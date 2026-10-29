# Staging parity (US-E14-07 / T5.12–T5.13)

## Principio

Stesso artefatto di prod: `compose.prod.yaml` + Caddy + secret **separati**.

| | Staging | Prod |
|-|---------|------|
| Compose project | `-p ff-staging` | `-p ff-prod` |
| Env file | `/etc/facilityflow/staging.env` | `/etc/facilityflow/.env.prod` |
| Domain | `staging.example.com` | `app.example.com` |
| DB / Seaweed volumes | dedicati | dedicati |
| Seed | `npm run db:seed:pilot` OK | **mai** seed QA |

```bash
docker compose -p ff-staging -f compose.prod.yaml --env-file /etc/facilityflow/staging.env up -d --build
```

## Checklist parity

- [ ] HTTPS via Caddy; HTTP→HTTPS
- [ ] `/api/health/live` 200 · `/api/health/ready` 200
- [ ] Mailpit **assente**
- [ ] Postgres/Seaweed non pubblicati
- [ ] `prisma migrate deploy` eseguito (vedi [`MIGRATE.md`](./MIGRATE.md))
- [ ] Backup script raggiungibile; restore drill annotato
- [ ] Observe: log-only (default) o GlitchTip self-host

## Reset seed (solo non-prod)

```bash
# distruttivo sullo stack staging
docker compose -p ff-staging -f compose.prod.yaml --env-file staging.env down -v
docker compose -p ff-staging -f compose.prod.yaml --env-file staging.env up -d --build
docker compose -p ff-staging -f compose.prod.yaml --env-file staging.env exec app \
  npx prisma migrate deploy
docker compose -p ff-staging -f compose.prod.yaml --env-file staging.env exec app \
  npm run db:seed:pilot
```

**Vietato** su prod.
