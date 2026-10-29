# Secrets management (US-E14-03 / T5.6)

## Regole

1. **Mai** commitare `.env`, `.env.prod`, dump DB, chiavi private.
2. `.env.example` contiene solo placeholder — password deboli solo per **dev locale**.
3. Produzione: valori unici, lunghezza ≥ 32 per `AUTH_SECRET`.
4. Rotazione: aggiornare file env sul VPS → `compose … up -d` (riavvio app/worker).

## Generazione

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 24      # POSTGRES_PASSWORD / S3_SECRET_KEY
```

Layout VPS suggerito:

```
/etc/facilityflow/.env.prod   # mode 600, owner deploy
/opt/facilityflow/            # clone repo
```

```bash
docker compose -f compose.prod.yaml --env-file /etc/facilityflow/.env.prod up -d
```

## Inventario secret

| Variabile | Criticità | Note |
|-----------|-----------|------|
| `AUTH_SECRET` | alta | Auth.js session |
| `POSTGRES_PASSWORD` | alta | SoR |
| `DATABASE_URL` | alta | include password |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | alta | SeaweedFS |
| SMTP credentials (se presenti) | media | self-host / cliente |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | alta | Bearer per `/api/inbound/email` (F2-08); vuoto = endpoint 503 |

## Docker secrets

Opzionale: montare file secret Compose (`secrets:`). MVP file env 600 è accettabile su VPS single-tenant.

## Guardrail

```bash
npm run secrets:scan
```

Fallisce su pattern evidenti in file tracked (non in `.env` gitignored).
