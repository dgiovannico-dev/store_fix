# Observability — FacilityFlow (OPS)

**MVP (default):** log JSON strutturati via `src/infrastructure/log.ts` (+ `X-Request-Id` middleware). Nessun SaaS a pagamento nel path critico — **no Sentry Cloud**.

| Layer | MVP | Post-MVP (opzionale) |
|-------|-----|----------------------|
| Errori / trace | Log + `docker compose logs app worker` | **GlitchTip** self-host (SDK Sentry-compat, OSS) |
| Health | `GET /api/health`, `docker compose ps` | Ready/live separati in S5 (`US-E14-06`) |
| Log aggregati | stdout container | Loki + Promtail (futuro) |

## Profile Compose `observe` (opzionale)

Non nel default stack. Quando aggiunto a `docker-compose.yml`:

```bash
docker compose --profile observe up -d
```

Env esempio (solo self-host): `SENTRY_DSN=http://…@glitchtip:8000/1`.  
Osservabilità **non** è System of Record.

Vedi anche [`COMPOSE.md`](./COMPOSE.md).

## Decisione S5 (2026-10-29) — log-only

Per capacità VPS pilota **non** si avvia GlitchTip in default.  
Policy firmata sprint: **log JSON + request id + uptime cron** ([`CRON.md`](./CRON.md)) sufficienti per Exit S5.  
GlitchTip resta opzionale (`--profile observe` futuro) — **zero Sentry Cloud**.
