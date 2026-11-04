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

```bash
npm run platform:onboard -- <app-id> [--namespace <ns>] [--client-id <oidc-client>]
# es. npm run platform:onboard -- billing --namespace billing --client-id billing-app
```

Genera `deploy/openbao/policies/<app-id>-eso.hcl` e stampa checklist Keycloak/OpenBao (nessun contatto al cluster).

Manuale equivalente:

1. **Keycloak** — Clients → Create (pattern [`realm-platform.json`](../../deploy/keycloak/realm-platform.json)).
2. **OpenBao** — `bao policy write` + `bao kv put secret/apps/<app-id>/runtime`.
3. Token o Kubernetes role bound allo SA del namespace app.
4. ExternalSecret → Secret **nel namespace dell’app** (mai cross-ns).

Dettaglio: [`KEYCLOAK.md`](./KEYCLOAK.md) · [`VAULT.md`](./VAULT.md) · [`../../deploy/openbao/README.md`](../../deploy/openbao/README.md).

## Cosa non fare

- Un unico client Keycloak “catch-all” per tutte le app (redirect e audience confusi)
- Una policy OpenBao `secret/data/*` in read per ogni ESO (lateral movement)
- Mettere secret di App-B sotto `apps/facilityflow/`
- Far gestire init/unseal OpenBao o admin Keycloak all’app team senza custodia piattaforme
