# Compose production (US-E14-02 / T5.2–T5.3)

File: [`compose.prod.yaml`](../../compose.prod.yaml)

## Avvio

```bash
cp .env.prod.example .env.prod
# genera secret (vedi SECRETS.md) — niente default deboli in prod
# FF_DOMAIN=app.example.com · NEXT_PUBLIC_APP_URL=https://app.example.com
chmod 600 .env.prod
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
```

Verifica:

```bash
docker compose -f compose.prod.yaml --env-file .env.prod ps
curl -sf http://127.0.0.1:3000/api/health/live
curl -sf http://127.0.0.1:3000/api/health/ready
curl -sfI https://$FF_DOMAIN/api/health/ready   # via Caddy
```

Proxy TLS: [`PROXY.md`](./PROXY.md) · Staging: [`STAGING.md`](./STAGING.md) · Migrate: [`MIGRATE.md`](./MIGRATE.md)

## Differenze vs Compose locale

| Aspetto | Locale (`docker-compose.yml`) | Prod (`compose.prod.yaml`) |
|---------|-------------------------------|----------------------------|
| Mailpit | profile `dev`/`full` | **assente** |
| Postgres/Seaweed porte | pubblicate | **solo rete interna** |
| App bind | `0.0.0.0:3000` (full) | `127.0.0.1:3000` (proxy TLS in T5.4) |
| Healthcheck app | `/api/health` | `/api/health/ready` |
| SMTP | Mailpit | env `SMTP_*` reale |

## Sizing pilota 15 store

| Servizio | CPU limit | RAM limit | Nota |
|----------|-----------|-----------|------|
| postgres | 1.0 | 1G | SoR; backup fuori container |
| app | 1.0 | 1G | Next.js SSR |
| worker | 0.5 | 512M | pg-boss email/SLA |
| seaweedfs | 0.5 | 512M | allegati |

VPS minimo consigliato pilota: **2 vCPU / 4 GB RAM** + disco 40 GB (DB + volume Seaweed).

TLS: Caddy su 80/443 (prod) oppure lab porte alte:

```bash
docker compose -f compose.prod.yaml -f compose.lab.yaml --env-file .env.prod up -d --build
# https://localhost:8443  (curl -k)
```

Resource limits: `cpus` / `mem_limit` top-level **e** `deploy.resources` allineati (stessi valori) per Compose plugin e Swarm.

## Observability + push (F3-02 / F3-08)

`app` e `worker` ricevono `SENTRY_DSN`, `NTFY_BASE_URL`, `NTFY_TOKEN` (vuoti = no-op). GlitchTip self-host è **opt-in**:

```bash
# valida config (CI / preflight)
npm run compose:prod:observe:config

# avvio con profile observe (GlitchTip + Valkey + PG dedicato)
docker compose -f compose.prod.yaml --profile observe --env-file .env.prod up -d --build
# UI errori: http://127.0.0.1:${GLITCHTIP_PORT:-8000} — poi crea progetto e copia DSN in SENTRY_DSN
```

Variabili in [`.env.prod.example`](../../.env.prod.example). Non esporre GlitchTip in chiaro su Internet senza auth/TLS.
