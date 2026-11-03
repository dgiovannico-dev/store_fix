# Smoke Flusso A (US-E14-12 / T5.25)

## CI / locale (domain path)

```bash
npm test -- src/tests/e2e/flusso-a-verified.test.ts
```

Copre: create → triage → assign → vendor done → verify (tenant isolato).

## Locale HTTP (curl + session Auth.js)

Prerequisiti: Postgres + seed pilota + app Next in ascolto.

```bash
npm run db:seed:pilot
npm run dev   # altro terminale
npm run smoke:http
# oppure: SMOKE_BASE_URL=http://127.0.0.1:3000 bash scripts/smoke-flusso-a-http.sh
```

Verifica: `health/live|ready` → login credentials (CSRF) → `/api/auth/session` →
API auth-gated (`notifications/unread-count`, `tickets/form-options`).

**Esercitato locale:** 2026-10-29 — `PASS` con seed pilota + `npm run dev`.

Il lifecycle ticket end-to-end resta sul test dominio sopra (server actions, non REST).

## Staging (manuale pre-exit)

1. Login owner seed pilota (Credentials **oppure** Keycloak SSO su k3s — [`KEYCLOAK.md`](./KEYCLOAK.md))
2. Apri ticket frigo critico da store
3. Assign vendor → vendor `in_progress` → `done` (foto+costo)
4. Store verify
5. Dashboard HQ mostra ticket verified / costi

Su **Ingress k3s**: stessi passi contro `https://$FF_DOMAIN` — checklist cutover [`COMPOSE_TO_K3S.md`](./COMPOSE_TO_K3S.md) §5.

Annotare data + esito in Sprint Review S5.
