# Runbook — Rotazione secret (US-E14-13 / T5.29)

## AUTH_SECRET

1. Genera nuovo: `openssl rand -base64 32`
2. Aggiorna `.env.prod` / staging.env
3. `compose up -d --force-recreate app`
4. **Effetto:** sessioni Auth.js invalidate → utenti rifanno login

## POSTGRES_PASSWORD

1. Backup dump
2. `ALTER USER … PASSWORD` in Postgres **oppure** ricrea volume solo su staging
3. Aggiorna `POSTGRES_PASSWORD` + `DATABASE_URL` in env app/worker
4. Recreate app worker

## S3 / SMTP

Aggiorna env → recreate `app` `worker`. Verifica upload allegato + email worker.

Prova minima staging: ruotare solo `AUTH_SECRET` e confermare login fresco.
