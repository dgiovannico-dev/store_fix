# Checklist operatore — VPS EU (Go staging / pilota)

**Stato:** NO-GO — gap in [`../product/sprints/S5-EXIT-GAPS.md`](../product/sprints/S5-EXIT-GAPS.md).  
**Chiusura:** tutte le checkbox sotto + [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) → aggiornare exit gaps a **GO** · tag `v0.1.0` ([`RELEASE.md`](./RELEASE.md)).

> Provisioning **manuale** sull’host; nessuno script di bootstrap automatico in repo.

## 0 — Prerequisito repo / CI

- [ ] CI green su `develop` (US-E14-04) — vedi riga CI in [`S5-EXIT-GAPS.md`](../product/sprints/S5-EXIT-GAPS.md)

## 1 — Host e rete

- [ ] VPS EU (≥ 2 vCPU / 4 GB) provisionato
- [ ] DNS `FF_DOMAIN` → IP pubblico del VPS
- [ ] UFW 22/80/443; DB/object storage **non** esposti — [`FIREWALL.md`](./FIREWALL.md)

## 2 — Secret e env

- [ ] `.env.prod` da [`.env.prod.example`](../../.env.prod.example); secret forti, file **600** — [`SECRETS.md`](./SECRETS.md)
- [ ] `npm run secrets:scan` pulito sul clone deployato

## 3 — Stack produzione

- [ ] Clone repo in `/opt/facilityflow` (o path team)
- [ ] `docker compose -f compose.prod.yaml --env-file .env.prod up -d --build` — [`COMPOSE_PROD.md`](./COMPOSE_PROD.md)
- [ ] `ps` healthy; `live`/`ready` 200 (localhost + HTTPS via Caddy) — [`HEALTH.md`](./HEALTH.md) · [`PROXY.md`](./PROXY.md)

## 4 — Deploy dati e DR

- [ ] `deploy-migrate.sh` end-to-end su host staging (container `app`) — [`MIGRATE.md`](./MIGRATE.md)
- [ ] Seed pilota **solo staging** — [`SEED_PILOT.md`](./SEED_PILOT.md)
- [ ] Restore drill **remoto** su scratch annotato — [`BACKUP.md`](./BACKUP.md) · [`runbooks/RESTORE.md`](./runbooks/RESTORE.md)

## 5 — Verifica exit S5

- [ ] Smoke Flusso A **UI** staging — [`SMOKE_FLUSSO_A.md`](./SMOKE_FLUSSO_A.md)
- [ ] `scripts/verify-security-headers.sh https://$FF_DOMAIN/...` — [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md)
- [ ] `npm run perf:hq-list` su staging (p95 &lt; 300 ms)
- [ ] Checklist release staging completa — [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)
- [ ] [`S5-EXIT-GAPS.md`](../product/sprints/S5-EXIT-GAPS.md) → **GO staging** / **GO pilota**

Niente altro scope prodotto finché questa checklist non è verde.
