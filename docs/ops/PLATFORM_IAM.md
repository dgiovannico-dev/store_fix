# Platform IAM — Keycloak + OpenBao multi-app (F4-06)

**ADR:** [`../adr/0011-keycloak-oidc-and-vault.md`](../adr/0011-keycloak-oidc-and-vault.md)

Keycloak e OpenBao (**“Vault”**) sono servizi **condivisi di piattaforma**, non di proprietà di FacilityFlow. Ogni applicativo è un **consumer** con client OIDC e path KV isolati.

```
┌─────────────────────────────────────────────────────────┐
│  VPS / k3s                                              │
│  ┌─────────────┐     ┌──────────────┐                   │
│  │  Keycloak   │     │   OpenBao    │                   │
│  │  realm:     │     │  KV: secret/ │                   │
│  │  platform   │     │  apps/<id>/  │                   │
│  └──────┬──────┘     └──────┬───────┘                   │
│         │ clients           │ policies per-app          │
│    ┌────┴────┬────────┐     │                           │
│    ▼         ▼        ▼     ▼                           │
│  FF-app   App-B    App-C   ESO → Secret per namespace    │
└─────────────────────────────────────────────────────────┘
```

## Convenzioni

| Area | Regola |
|------|--------|
| Keycloak realm | **Uno** realm condiviso `platform` (SSO tra app dello stesso user pool) |
| Keycloak client | **Uno confidential client per app** (`facilityflow-app`, `billing-app`, …) |
| Realm separati | Solo se user pool / policy IdP **davvero** isolati (es. B2B vs interno) |
| OpenBao mount | Un KV v2 `secret/` |
| Path app | `secret/apps/<app-id>/runtime` (e sotto-path se serve) |
| Path piattaforma | `secret/platform/…` (es. TLS condivisi, SMTP relay) — policy strette |
| ESO | SecretStore **namespaced** + policy OpenBao **least privilege** per app |
| Namespace K8s | Un namespace (o release) per app — non condividere `facilityflow-runtime` |

## Onboarding di una nuova app

1. **Keycloak** — Admin → Clients → Create: redirect `{APP}/api/auth/callback/…`, PKCE S256, client auth on. Copiare pattern da [`deploy/keycloak/realm-platform.json`](../../deploy/keycloak/realm-platform.json).
2. **OpenBao** — copiare policy da [`deploy/openbao/policies/_template-app-eso.hcl`](../../deploy/openbao/policies/_template-app-eso.hcl), sostituire `APP_ID`, `bao policy write <app>-eso …`.
3. Seed KV: `bao kv put secret/apps/<app-id>/runtime @runtime.json`
4. Token o Kubernetes role bound allo ServiceAccount del namespace app.
5. ExternalSecret → Secret runtime **nel namespace dell’app** (mai cross-ns read).

Dettaglio operativo: [`KEYCLOAK.md`](./KEYCLOAK.md) · [`VAULT.md`](./VAULT.md).

## Cosa non fare

- Un unico client Keycloak “catch-all” per tutte le app (redirect e audience confusi)
- Una policy OpenBao `secret/data/*` in read per ogni ESO (lateral movement)
- Mettere secret di App-B sotto `apps/facilityflow/`
- Far gestire init/unseal OpenBao o admin Keycloak all’app team senza custodia piattaforme
