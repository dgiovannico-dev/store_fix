# Runbook — Scale worker (US-E14-13 / T5.30)

```bash
docker compose -f compose.prod.yaml --env-file .env.prod up -d --scale worker=2
docker compose -f compose.prod.yaml --env-file .env.prod ps
```

pg-boss usa Postgres come coda: più worker = più consumer. Verificare:

- job `email.send` / `sla.check_breaches` non duplicano side-effect non idempotenti (breach già idempotente)
- CPU/mem sotto limits in `compose.prod.yaml`

Scale-down: `--scale worker=1`. Documentare prova staging (data + esito).
