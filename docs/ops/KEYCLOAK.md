# Keycloak OIDC — IdP piattaforma multi-app (F4-04 / F4-06)

**ADR:** [`../adr/0011-keycloak-oidc-and-vault.md`](../adr/0011-keycloak-oidc-and-vault.md) · Multi-app: [`PLATFORM_IAM.md`](./PLATFORM_IAM.md) · Auth lab: [`AUTH.md`](./AUTH.md)

Keycloak è l’**IdP condiviso**. FacilityFlow usa **Auth.js** come broker; RBAC applicativo resta su **Membership** (Prisma).

## Modello

| Scelta | Valore |
|--------|--------|
| Realm | **`platform`** (condiviso — SSO tra app) |
| Client FF | **`facilityflow-app`** (confidential, PKCE S256) |
| Altre app | Nuovo client nello **stesso** realm (non nuovo realm, salvo user pool diverso) |
| Issuer Auth.js | `https://auth.$FF_DOMAIN/realms/platform` |

Export: [`deploy/keycloak/realm-platform.json`](../../deploy/keycloak/realm-platform.json)  
(deprecato: `realm-facilityflow.json` → stub che punta al file sopra)

## Import

```bash
# Sostituire ${FF_APP_URL} / secret REPLACE_* prima o dopo import
/opt/keycloak/bin/kc.sh import --file deploy/keycloak/realm-platform.json
# oppure Admin UI → Partial import
```

Client stub `example-sibling-app` è **disabled** — duplicarlo/rinominarlo per onboarding.

## Env Auth.js (FacilityFlow)

| Variabile | Ruolo |
|-----------|--------|
| `AUTH_OIDC_ENABLED` | `1` + ID/SECRET/ISSUER |
| `AUTH_KEYCLOAK_ID` | `facilityflow-app` |
| `AUTH_KEYCLOAK_SECRET` | da OpenBao `apps/facilityflow/runtime` |
| `AUTH_KEYCLOAK_ISSUER` | `https://auth.$FF_DOMAIN/realms/platform` |
| `AUTH_CREDENTIALS_ENABLED` | `0` in prod Helm |

## Helm

```bash
helm upgrade --install ff ./deploy/helm/facilityflow \
  -f deploy/helm/facilityflow/values-prod.yaml \
  --set keycloak.issuer="https://auth.$FF_DOMAIN/realms/platform" \
  --set ingress.host="$FF_DOMAIN"
```

## Onboarding seconda app (checklist)

1. Admin Keycloak → Clients → Create (da stub sibling)
2. Redirect URI dell’altra app; secret in OpenBao `secret/apps/<app-id>/…`
3. Policy ESO dedicata — [`VAULT.md`](./VAULT.md)
4. Non riusare `facilityflow-app` client id

## Install Keycloak (umano)

Chart ufficiale/Bitnami su k3s; DNS `auth.$FF_DOMAIN`. Una install per tutto il VPS.

## F9-10 — Azure AD / Entra ID federation pack

Goal: corporate IdP → Keycloak `platform` realm → Auth.js broker → FacilityFlow **Membership** roles. Software remains OSS; this is an **ops packaging** runbook (no CE feature lock).

### High-level flow

```
Azure AD (OIDC) ──► Keycloak IdP alias `azure-ad`
                         │
                         ▼
                   realm `platform`
                         │
                         ▼
              Auth.js (`AUTH_KEYCLOAK_*`)
                         │
                         ▼
              Membership.role (Prisma) — source of RBAC truth
```

### Keycloak Admin steps (summary)

1. **Identity providers → Add → OpenID Connect v1.0** (or Microsoft social broker).
2. Alias: `azure-ad`. Display name: `Microsoft`.
3. From Azure App Registration: **Client ID**, **Client secret**, discovery URL  
   `https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration`.
4. Default scopes: `openid profile email`.
5. **Mappers** (Important → FacilityFlow):
   | Mapper | Claim | Target |
   |--------|-------|--------|
   | email | `email` / `preferred_username` | User email (must match invite/membership) |
   | groups (optional) | `groups` or app roles | Keycloak group → later sync script |
6. First login: user must already have a **Membership** (invite flow) or owner creates membership after SSO — FacilityFlow does **not** auto-promote Azure groups to `owner`.
7. Claim→role (ops convention, document in tenant runbook):
   | Azure app role / group | Suggested FF role |
   |------------------------|-------------------|
   | `FacilityFlow.Owner` | `owner` (manual assign once) |
   | `FacilityFlow.Ops` | `ops_coordinator` |
   | `FacilityFlow.Store` | `store_manager` + `storeIds` |
   | `FacilityFlow.Vendor` | `vendor` + `vendorId` |

Automated SCIM sync is **out of F9** (enterprise later).

### Verify

- Login with Azure → lands on `/app` with session `tenantId` + `role`.
- User without Membership → clear IT error (forbidden), not silent empty shell.

## Verify in-repo

```bash
npm test -- src/ops/keycloak-realm.test.ts src/ops/platform-iam.test.ts
```

