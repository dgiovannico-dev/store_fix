# Keycloak OIDC + Auth.js broker (F4-04)

**ADR:** [`../adr/0011-keycloak-oidc-and-vault.md`](../adr/0011-keycloak-oidc-and-vault.md) · Auth lab: [`AUTH.md`](./AUTH.md)

FacilityFlow resta **Auth.js** come broker/session SoR locale. Keycloak è l’**IdP** OIDC. I ruoli applicativi restano su **Membership** (Prisma) — niente mapping realm-role→RBAC in questa slice.

## Realm export (in-repo)

[`deploy/keycloak/realm-facilityflow.json`](../../deploy/keycloak/realm-facilityflow.json)

- Realm: `facilityflow`
- Client confidential: `facilityflow-app`
- Redirect: `{APP}/api/auth/callback/keycloak`
- PKCE S256
- `secret: REPLACE_AT_IMPORT` — sostituire all’import; **non** commitare secret reali

Import (operatore, dopo Keycloak su k3s/Compose):

```bash
# Esempio CLI — adatta URL admin
/opt/keycloak/bin/kc.sh import --file deploy/keycloak/realm-facilityflow.json
# oppure Admin UI → Realm settings → Partial import
```

Sostituire `${FF_APP_URL}` con `https://$FF_DOMAIN` (e lasciare localhost solo in lab).

## Env Auth.js

| Variabile | Ruolo |
|-----------|--------|
| `AUTH_OIDC_ENABLED` | `1` abilita provider Keycloak (se ID/SECRET/ISSUER ok) |
| `AUTH_KEYCLOAK_ID` | client id (`facilityflow-app`) |
| `AUTH_KEYCLOAK_SECRET` | client secret (OpenBao / runtime Secret) |
| `AUTH_KEYCLOAK_ISSUER` | es. `https://auth.$FF_DOMAIN/realms/facilityflow` |
| `AUTH_CREDENTIALS_ENABLED` | `0` in prod con OIDC; lab default Credentials on |

Issuer **include** il realm path (Auth.js discovery). Fonte: [Auth.js Keycloak](https://authjs.dev/getting-started/providers/keycloak).

## Helm

`values-prod.yaml` / staging: `keycloak.enabled: true` inietta flag OIDC e spegne Credentials in prod.  
Secret client: stessa `facilityflow-runtime` via ESO (property `AUTH_KEYCLOAK_SECRET`) — vedi [`VAULT.md`](./VAULT.md).

```bash
helm upgrade --install ff ./deploy/helm/facilityflow \
  -f deploy/helm/facilityflow/values-prod.yaml \
  --set keycloak.issuer="https://auth.$FF_DOMAIN/realms/facilityflow" \
  --set ingress.host="$FF_DOMAIN"
```

## Install Keycloak (umano / VPS)

Fuori scope codice: chart Bitnami/official Keycloak su k3s (≥ 8 GB RAM consigliati con OpenBao).  
DNS `auth.$FF_DOMAIN` → Ingress TLS. Lab Compose resta Credentials-only.

## Primo login OIDC

1. Utente esiste in Keycloak (email)
2. Auth.js PrismaAdapter crea/linka `User` + `Account`
3. Serve una **Membership** attiva in Postgres (seed HQ o invite) — altrimenti sessione senza `tenantId` (stesso soft-fail di Credentials senza membership)

## Verify in-repo

```bash
npm test -- src/infrastructure/auth/oidc-config.test.ts src/ops/keycloak-realm.test.ts
npm run helm:template
```
