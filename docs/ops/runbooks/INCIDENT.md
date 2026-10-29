# Runbook — Incidente (US-E14-13 / T5.27)

## Triage (5 min)

1. `scripts/uptime-check.sh` / `curl …/api/health/ready`
2. `docker compose -f compose.prod.yaml --env-file .env.prod ps`
3. `logs app worker caddy postgres` — cerca 5xx, OOM, migrate fail
4. Impatto: login? ticket write? solo allegati (Seaweed)?

## Mitigazione

| Sintomo | Azione |
|---------|--------|
| Ready 503 | Postgres down → restart postgres; non restart-loop liveness |
| 502 Caddy | App unhealthy → `compose up -d --force-recreate app` |
| Deploy rotto | Rollback tag ([`MIGRATE.md`](../MIGRATE.md) + image precedente) |
| Disk full | Ruota log ([`LOGGING.md`](../LOGGING.md)); libera dump vecchi |

## Comunicazione

Annotare: start, impatto tenant, mitigazione, follow-up. Nessun secret in ticket pubblici.
