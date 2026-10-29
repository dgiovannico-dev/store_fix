# S5 Exit — Gap list / Go–No-go (2026-10-29)

**Verdetto:** **NO-GO produzione pilota** finché non chiudono i gap VPS sotto.  
**Go staging-lab (locale):** artefatti ops + prove locali **PASS**.

## PASS locale (evidenza)

| Check | Esito | Note |
|-------|-------|------|
| `compose.prod.yaml config` | PASS | env dummy + `cpus`/`mem_limit` |
| `compose.lab.yaml` merge | PASS | porte 8080/8443 |
| Caddyfile `caddy validate` | PASS | image `caddy:2.9-alpine` |
| `/api/health/live` + `ready` | PASS | ready `db:up` |
| Security headers | PASS | CSP, XFO, nosniff (`verify-security-headers.sh`) |
| p95 lista HQ seed | PASS | ≪ 300 ms (`npm run perf:hq-list`); **anche in CI** PR/`develop`; stress 50×100 → p95 ~4 ms |
| Flusso A domain test | PASS | `flusso-a-verified.test.ts` |
| Restore drill DB | PASS | 2026-10-29 locale (`BACKUP.md`) |
| Migrate-on-deploy lab dry-run | PASS | 2026-10-29 — `npm run deploy:migrate:lab` → backup + host `prisma migrate deploy` ([`MIGRATE.md`](../../ops/MIGRATE.md)) |
| Secrets scan | PASS | `npm run secrets:scan` |
| Zero SaaS path critico | PASS | log-only observe firmata |

## GAP bloccanti Go prod / staging VPS

| Gap | Story | Azione |
|-----|-------|--------|
| HTTPS ACME su dominio reale | US-E14-01 | DNS + UFW + `compose.prod` su VPS EU |
| Staging parity host dedicato | US-E14-07 | project `ff-staging` + secret separati |
| DR drill **su staging** | US-E14-09 | ripetere restore scratch remoto |
| Smoke Flusso A **UI staging** | US-E14-12 | checklist manuale post-deploy |
| Migrate-on-deploy su **staging VPS** | US-E14-05 | `deploy-migrate.sh` **prod** (container `app`) end-to-end — lab dry-run già PASS in tabella locale |
| CI green su remote `develop` | US-E14-04 | **PASS** 2026-10-29 — push `4c59c07` (`verify` + seed + p95); PR [#1](https://github.com/dgiovannico-dev/store_fix/pull/1)/[#5](https://github.com/dgiovannico-dev/store_fix/pull/5) |
| Tag `v0.1.0` dry-run | US-E14-14 | dopo staging green |

## Slip espliciti

- GlitchTip runtime: **non** avviato — policy **log-only** (`OBSERVE.md`)
- Perf p95 in CI PR: **PASS** (2026-10-29) — job `Perf p95 lista HQ` in `.github/workflows/ci.yml` (seed + `perf:hq-list`); p95 su host staging VPS resta gap fino a deploy

Quando i gap VPS sono chiusi → rieseguire [`RELEASE_CHECKLIST.md`](../../ops/RELEASE_CHECKLIST.md) e aggiornare questo file a **GO staging** / **GO pilota**.
