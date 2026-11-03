# Kubernetes / Helm — FacilityFlow (Fase 4)

**ADR:** [`../adr/0010-k3s-helm-on-vps.md`](../adr/0010-k3s-helm-on-vps.md) · Keycloak/OpenBao: [`../adr/0011-keycloak-oidc-and-vault.md`](../adr/0011-keycloak-oidc-and-vault.md)  
**Chart:** [`../../deploy/helm/facilityflow/`](../../deploy/helm/facilityflow/)

## Ruoli

| Ambiente | Runtime |
|----------|---------|
| Lab / CI | Docker Compose (`COMPOSE.md`) — invariato |
| Staging / pilota (target F4) | **k3s** su VPS EU + Helm chart `facilityflow` |

Niente EKS/GKE/AKS. Control plane = k3s sull’host.

## Prerequisiti VPS (indicativi)

- ≥ **4 vCPU / 8 GB RAM** quando si aggiungono Keycloak + Vault (F4-03/04); 4 GB solo chart app/worker è stretto.
- OS Linux 64-bit; porte 80/443/6443 (API k3s) + SSH; UFW come [`FIREWALL.md`](./FIREWALL.md).
- DNS `FF_DOMAIN` → IP VPS.

## Install k3s (operatore)

```bash
curl -sfL https://get.k3s.io | sh -
sudo k3s kubectl get nodes
# Helm 3
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

kubeconfig: `/etc/rancher/k3s/k3s.yaml` (o `KUBECONFIG=` export per l’operatore).

## Deploy chart (skeleton F4-01)

```bash
kubectl create namespace facilityflow
# Bootstrap senza OpenBao (lab): runtime.env 600 — SECRETS.md
# kubectl -n facilityflow create secret generic facilityflow-runtime --from-env-file=./runtime.env
# Staging/prod: OpenBao + ESO (vault.enabled) — VAULT.md

# Staging
helm upgrade --install ff ./deploy/helm/facilityflow \
  -n facilityflow \
  -f deploy/helm/facilityflow/values-staging.yaml \
  --set ingress.host="staging.$FF_DOMAIN" \
  --set app.image.repository=ghcr.io/OWNER/facilityflow \
  --set app.image.tag=0.1.0 \
  --set worker.image.repository=ghcr.io/OWNER/facilityflow-worker \
  --set worker.image.tag=0.1.0

# Produzione — digests obbligatori (output CI build)
helm upgrade --install ff ./deploy/helm/facilityflow \
  -n facilityflow \
  -f deploy/helm/facilityflow/values-prod.yaml \
  --set ingress.host="$FF_DOMAIN" \
  --set app.image.repository=ghcr.io/OWNER/facilityflow \
  --set app.image.digest="sha256:${APP_DIGEST}" \
  --set worker.image.repository=ghcr.io/OWNER/facilityflow-worker \
  --set worker.image.digest="sha256:${WORKER_DIGEST}"
```

Validazione locale **senza cluster** (CI/dev):

```bash
npm run helm:template   # lint + template base/staging/prod (PDB + digest check)
```

## Roadmap chart

| Fase | Contenuto |
|------|-----------|
| **F4-01** | app + worker Deployments, Service, Ingress |
| **F4-02** | Done — overlays + PDB + digests |
| **F4-03** | Done in-repo — OpenBao values + ESO SecretStore/ExternalSecret → `facilityflow-runtime`; [`VAULT.md`](./VAULT.md) |
| **F4-04** | Done in-repo — realm export + Auth.js Keycloak; [`KEYCLOAK.md`](./KEYCLOAK.md) |
| **F4-05** | Runbook Compose → k3s + DR |

Postgres / SeaweedFS: restano **esterni** al chart app (Compose sul nodo o StatefulSet dedicati).

## Relazione con F3-01

Exit pilota può chiudersi su **Compose** (path attuale `NEXT_VPS.md`) **oppure** su k3s quando helm install + smoke Flusso A sono verdi. Non richiedere entrambi sullo stesso host piccolo.
