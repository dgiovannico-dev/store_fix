# Migrate on deploy + rollback (US-E14-05 / T5.14–T5.15)

## Ordine deploy (staging poi prod)

1. **Backup** DB: `npm run db:backup` (o cron host) — annotare path dump
2. `docker compose … pull/build`
3. `npx prisma migrate deploy` (container `app` o job one-shot)
4. Restart `app` + `worker`
5. Health: `curl -sf https://$FF_DOMAIN/api/health/ready`

Script: [`scripts/deploy-migrate.sh`](../../scripts/deploy-migrate.sh)

```bash
FF_COMPOSE=compose.prod.yaml FF_ENV_FILE=.env.prod ./scripts/deploy-migrate.sh
```

### Lab dry-run (senza VPS) — `FF_MODE=lab`

Evidenza S5: backup + `prisma migrate deploy` senza container `app` (DB da `docker-compose.yml` dev o postgres lab).

**Solo infra dev (postgres/mailpit/seaweedfs, senza app container):**

```bash
npm run compose:lab:config
npm run verify:local

FF_MODE=lab FF_LAB_MIGRATE_ONLY=1 ./scripts/deploy-migrate.sh
```

Usa `DATABASE_URL` da `.env` (host `localhost:5432`). Output atteso: `lab migrate-only OK`.

**Lab compose.prod + override porte (app container presente):**

```bash
cp .env.example .env.lab
# POSTGRES_* allineati a .env.prod.example; DATABASE_URL=postgresql://…@localhost:5432/… se migrate da host

FF_MODE=lab \
  FF_COMPOSE=compose.prod.yaml:compose.lab.yaml \
  FF_ENV_FILE=.env.lab \
  NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 \
  ./scripts/deploy-migrate.sh
```

Con `app` up: migrate via `dc exec app …`, restart + ready. Senza `app`: stesso fallback host di sopra.

Shortcut npm:

```bash
npm run deploy:migrate:lab
```

**Staging VPS** (`deploy-migrate.sh` senza `FF_MODE=lab` su host EU) resta gap in [`../product/sprints/S5-EXIT-GAPS.md`](../product/sprints/S5-EXIT-GAPS.md).

## Limiti Prisma

- Migrazioni **forward-only** tipiche: non esiste `migrate down` ufficiale sicuro.
- Rollback schema = **restore dump pre-migrate** + redeploy immagine/tag precedente.

## Rollback (dry-run documentato)

1. Metti app in maintenance / ferma traffico (Caddy o scale app=0).
2. Restore dump:

```bash
DUMP=backups/ff-PRE-MIGRATE.dump
docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
  dropdb -U "$POSTGRES_USER" --if-exists facilityflow_rollback_tmp
# preferire restore sul volume SoR solo dopo freeze app:
cat "$DUMP" | docker compose -f compose.prod.yaml --env-file .env.prod exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl
```

3. Redeploy tag git/immagine precedente: `git checkout vX.Y.Z && compose up -d --build`
4. Verifica ready + smoke login.

**Drill:** eseguire almeno una volta su **staging** e annotare data in Review / [`BACKUP.md`](./BACKUP.md).
