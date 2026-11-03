# OpenBao (Vault API) + External Secrets — piattaforma multi-app (F4-03 / F4-06)

**ADR:** [`../adr/0011-keycloak-oidc-and-vault.md`](../adr/0011-keycloak-oidc-and-vault.md) · Multi-app: [`PLATFORM_IAM.md`](./PLATFORM_IAM.md) · Chart FF: [`KUBERNETES.md`](./KUBERNETES.md)  
**Perché OpenBao:** HashiCorp Vault post-2023 è BSL (non OSI); OpenBao è MPL-2.0 con API KV compatibile (ADR-0001).

OpenBao è un servizio **condiviso**. FacilityFlow (e altre app) consumano path/policy dedicati.  
Lab Compose continua a usare `.env` ([`SECRETS.md`](./SECRETS.md)).

## Layout KV (obbligatorio)

```
secret/                          # mount kv-v2
  apps/
    facilityflow/
      runtime                    # DATABASE_URL, AUTH_SECRET, AUTH_KEYCLOAK_SECRET
    <other-app>/
      runtime
  platform/                      # opz. secret trasversali (SMTP relay, …) — policy separate
```

| Pezzo | Dove |
|-------|------|
| OpenBao server | Helm `openbao/openbao` + [`deploy/openbao/values-standalone.yaml`](../../deploy/openbao/values-standalone.yaml) — **una** install |
| ESO | Chart `external-secrets` (cluster-wide controller) |
| Policy per app | [`deploy/openbao/policies/<app>-eso.hcl`](../../deploy/openbao/policies/) · template `_template-app-eso.hcl` |
| SecretStore FF | Helm `facilityflow` → Secret `facilityflow-runtime` in ns `facilityflow` |

## 1. Install ESO (una volta)

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace \
  --set installCRDs=true
```

## 2. Install OpenBao (una volta)

```bash
helm repo add openbao https://openbao.github.io/openbao-helm
helm upgrade --install openbao openbao/openbao \
  -n openbao --create-namespace \
  -f deploy/openbao/values-standalone.yaml
```

```bash
export BAO_ADDR=http://127.0.0.1:8200
kubectl -n openbao port-forward svc/openbao 8200:8200 &
```

## 3. Init + unseal (umano, piattaforma)

```bash
bao operator init -key-shares=5 -key-threshold=3
bao operator unseal   # ×3
```

Custodia unseal/root = **team piattaforma**, non singoli app team.

## 4. KV + policy per FacilityFlow

```bash
bao login
bao secrets enable -path=secret kv-v2

bao kv put secret/apps/facilityflow/runtime @runtime.json
# keys: DATABASE_URL, AUTH_SECRET, AUTH_KEYCLOAK_SECRET — never commit

bao policy write facilityflow-eso deploy/openbao/policies/facilityflow-eso.hcl
```

### Nuova app

```bash
# 1) copia template → billing-eso.hcl (sostituisci APP_ID)
bao policy write billing-eso deploy/openbao/policies/billing-eso.hcl
bao kv put secret/apps/billing/runtime @billing-runtime.json
```

## 5. Auth ESO (per namespace app)

### A) Token bootstrap

```bash
bao token create -policy=facilityflow-eso -ttl=768h -orphan
kubectl -n facilityflow create secret generic openbao-eso-token \
  --from-literal=token='<TOKEN>'
# Altra app: policy=billing-eso + secret nel namespace billing
```

### B) Kubernetes auth (consigliato)

```bash
bao auth enable kubernetes
bao write auth/kubernetes/role/facilityflow-eso \
  bound_service_account_names='ff-facilityflow-eso' \
  bound_service_account_namespaces='facilityflow' \
  policies='facilityflow-eso' \
  ttl=1h \
  audience=openbao
# Ripetere role/policy/namespace per ogni app
```

## 6. Helm FacilityFlow

```bash
helm upgrade --install ff ./deploy/helm/facilityflow \
  -n facilityflow --create-namespace \
  -f deploy/helm/facilityflow/values-staging.yaml \
  --set ingress.host="staging.$FF_DOMAIN" \
  --set keycloak.issuer="https://auth.$FF_DOMAIN/realms/platform"
```

`vault.secretPath` default: `apps/facilityflow/runtime`.

## 7. Rotazione

1. `bao kv put secret/apps/facilityflow/runtime …`
2. Refresh ESO / rollout pod
3. [`runbooks/SECRET_ROTATION.md`](./runbooks/SECRET_ROTATION.md)

## Sicurezza

- Nessun root/unseal in git.
- **Mai** policy `secret/data/apps/*` o `secret/data/*` su token ESO di un’app.
- `tlsDisable: true` solo in-cluster; TLS se esposto.
- Compose lab **non** dipende da OpenBao.
