# OpenBao (Vault API) + External Secrets — FacilityFlow (F4-03)

**ADR:** [`../adr/0011-keycloak-oidc-and-vault.md`](../adr/0011-keycloak-oidc-and-vault.md) · Chart app: [`KUBERNETES.md`](./KUBERNETES.md)  
**Perché OpenBao:** HashiCorp Vault post-2023 è BSL (non OSI); OpenBao è MPL-2.0 con API KV compatibile (ADR-0001).

Lab Compose continua a usare `.env` / `.env.prod` ([`SECRETS.md`](./SECRETS.md)). Questo runbook vale solo per **k3s**.

## Componenti

| Pezzo | Dove |
|-------|------|
| OpenBao server | Helm chart `openbao/openbao` + [`deploy/openbao/values-standalone.yaml`](../../deploy/openbao/values-standalone.yaml) |
| External Secrets Operator (ESO) | Chart ufficiale `external-secrets` (CRD + controller) |
| SecretStore + ExternalSecret | Template Helm `facilityflow` quando `vault.enabled: true` |
| K8s Secret target | `facilityflow-runtime` (`DATABASE_URL`, `AUTH_SECRET`) |

## 1. Install ESO

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace \
  --set installCRDs=true
kubectl -n external-secrets get pods
```

## 2. Install OpenBao (standalone)

```bash
helm repo add openbao https://openbao.github.io/openbao-helm
helm repo update
helm upgrade --install openbao openbao/openbao \
  -n openbao --create-namespace \
  -f deploy/openbao/values-standalone.yaml
kubectl -n openbao get pods
```

CLI sul pod (o `bao` locale puntato al Service):

```bash
export BAO_ADDR=http://127.0.0.1:8200
kubectl -n openbao port-forward svc/openbao 8200:8200 &
```

## 3. Init + unseal (umano, una tantum)

```bash
bao operator init -key-shares=5 -key-threshold=3
# Salvare root token + unseal keys fuori git (password manager / envelope).
bao operator unseal   # ×3 con key distinte
```

Dopo reboot nodo: ripetere **unseal** (file storage non auto-unseal). Opzionale: auto-unseal con transit remoto in slice successive — fuori F4-03.

## 4. KV + seed runtime

```bash
bao login   # root o admin token
bao secrets enable -path=secret kv-v2

# Put DATABASE_URL + AUTH_SECRET into KV (generate auth value with openssl rand -base64 32)
bao kv put secret/facilityflow/runtime @runtime.json
# runtime.json example keys: DATABASE_URL, AUTH_SECRET — never commit the file

bao policy write facilityflow-eso deploy/openbao/policies/eso-read.hcl
```

## 5. Auth per ESO

### A) Token bootstrap (default chart — staging/prod overlays)

```bash
bao token create -policy=facilityflow-eso -ttl=768h -orphan
kubectl -n facilityflow create secret generic openbao-eso-token \
  --from-literal=token='<TOKEN>'
```

### B) Kubernetes auth (hardening)

```bash
bao auth enable kubernetes
# Config host/CA: vedi OpenBao docs platform/k8s + ESO Vault kubernetes auth
bao write auth/kubernetes/role/facilityflow-eso \
  bound_service_account_names='ff-facilityflow-eso' \
  bound_service_account_namespaces='facilityflow' \
  policies='facilityflow-eso' \
  ttl=1h \
  audience=openbao
```

Poi nel chart:

```yaml
vault:
  auth:
    method: kubernetes
    kubernetes:
      role: facilityflow-eso
      audiences: ["openbao"]
```

## 6. Deploy app con sync ESO

Prerequisito: namespace `facilityflow` + ESO CRD presenti.

```bash
helm upgrade --install ff ./deploy/helm/facilityflow \
  -n facilityflow --create-namespace \
  -f deploy/helm/facilityflow/values-staging.yaml \
  --set ingress.host="staging.$FF_DOMAIN"
# vault.enabled=true negli overlay staging/prod
```

Verifica:

```bash
kubectl -n facilityflow get secretstore,externalsecret,secret facilityflow-runtime
kubectl -n facilityflow describe externalsecret ff-facilityflow-runtime
```

Se `SecretSynced` / Secret presente → Deployments leggono già `facilityflow-runtime`.

## 7. Rotazione

1. `bao kv put secret/facilityflow/runtime …` (nuovi valori)
2. Attendere `refreshInterval` (default 1h) oppure annotare ExternalSecret per force sync
3. Rollout app/worker se Auth.js richiede restart sessioni — vedi [`runbooks/SECRET_ROTATION.md`](./runbooks/SECRET_ROTATION.md)

## Validazione in-repo (senza cluster)

```bash
npm run helm:template   # staging/prod renderizzano SecretStore + ExternalSecret
```

## Sicurezza

- Nessun root token / unseal key in git o Issue.
- `tlsDisable: true` solo su rete cluster interna; esporre OpenBao fuori dal cluster solo con TLS + ACL.
- Compose lab **non** dipende da OpenBao.
