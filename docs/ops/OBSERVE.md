# Observability — FacilityFlow (OPS)

**Default (pilota):** log JSON strutturati via `src/infrastructure/log.ts` (+ `X-Request-Id`). Nessun SaaS a pagamento — **no Sentry Cloud**.

| Layer | Default | Opzionale (`--profile observe`) |
|-------|---------|----------------------------------|
| Errori | Log JSON + `docker compose logs` | **GlitchTip** self-host (OSS, Sentry-compatible DSN) |
| Health | `GET /api/health` | — |
| Log aggregati | stdout | Loki futuro |

## Profile Compose `observe` (F3-02)

Stack dedicato (Postgres + Valkey + web + worker GlitchTip), **non** condivide il DB SoR FacilityFlow.

```bash
# Solo observe (lab)
docker compose --profile observe up -d

# Validazione config
docker compose --profile observe config --quiet
```

UI: `http://localhost:${GLITCHTIP_PORT:-8000}` — crea progetto e copia DSN.

| Env | Default lab | Note |
|-----|-------------|------|
| `GLITCHTIP_DB_PASSWORD` | `glitchtip_dev` | Cambiare in prod |
| `GLITCHTIP_SECRET_KEY` | lab placeholder | `openssl rand -hex 32` |
| `GLITCHTIP_DOMAIN` | `http://localhost:8000` | URL pubblico HTTPS in VPS |
| `GLITCHTIP_PORT` | `8000` | Host bind |

App FacilityFlow: quando avrai un DSN, imposta `SENTRY_DSN=http://…@glitchtip-host:8000/1` (SDK opzionale follow-up; path critico resta log-only senza DSN).

```bash
docker compose --profile observe down
```

Osservabilità **non** è System of Record.

Vedi [`COMPOSE.md`](./COMPOSE.md), [`SECRETS.md`](./SECRETS.md).

## Decisione S5 — log-only default

Capacità VPS pilota: **non** avviare GlitchTip in default.  
Policy Exit S5: log JSON + request id + uptime cron ([`CRON.md`](./CRON.md)).  
Profile `observe` è **opt-in** (F3-02) — zero Sentry Cloud.
