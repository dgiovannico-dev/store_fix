# Sprint 5 — Sprint Backlog

> FacilityFlow Retail — **Production harden** (pilota EU OSS)  
> Lingua: italiano · Stack: **OSS-only / self-host** · Nessun codice in questo documento  
> Epic: [`../backlog/E14-production-ready.md`](../backlog/E14-production-ready.md) · Fonte: [`../BACKLOG.md`](../BACKLOG.md) · DoD: [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) · Stack: [`../STACK.md`](../STACK.md)

---

## Meta

| Campo | Valore |
|-------|--------|
| **Sprint** | S5 (settimane 9–10 — **opzionale** oltre MVP prodotto S1–S4) |
| **Durata** | 2 settimane |
| **Capacità** | ~1–2 FTE · effort stimato **M–L** (rischio: staging VPS, TLS ACME, DR drill) |
| **Branch base** | `develop` → `feature/FF-S5-*` / `bugfix/FF-S5-*` · release via `release/x.y.z` |
| **Vincolo hard** | Zero SaaS a pagamento nel path critico (no Sentry Cloud, Datadog, managed DB, email SaaS, …) |
| **UI** | Italiano sui messaggi ops/QA; nessuna feature prodotto nuova |
| **Dipendenze in ingresso** | S1–S4 Done (wedge + Flussi A–C + seed 15×5 + NFR base E10); gap prep S4 (backup/p95/observe) da chiudere in W1 se aperti |
| **Out of scope S5** | WhatsApp API, billing, AI SoR, K8s, PITR, multi-region, feature E01–E13 nuove |

### Analysis Card (planning S5)

- **Assunzioni:** MVP prodotto già “candidabile” a fine S4; S5 non aggiunge wedge — solo **operabilità pilota** su VPS EU; Caddy default; GitHub Actions = infra OK.
- **Ricerca:** Caddy Automatic HTTPS ([docs](https://caddyserver.com/docs/automatic-https)); `prisma migrate deploy` in deploy ([Prisma](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)); backup = dump + verify list + restore scratch (non live).
- **Scelta di design:** **S5 dedicato** “Production harden” (preferito a gonfiare S4); task ≤ M; proxy+prod compose+secrets+CI prima; DR e smoke A a metà/fine; Traefik solo se team lo preferisce esplicitamente.
- **AI:** `no`.
- **Rischi:** ACME fallisce (DNS/80); staging ≠ prod; migrate senza backup; secret in git; sovra-ingegnerizzare observability.

---

## Sprint Goal

**Harden di produzione OSS su VPS EU:** TLS + Compose prod + CI + migrate/rollback + staging parity + backup/DR + smoke Flusso A — pilota 15 store rilasciabile con runbook e tag semver, zero SaaS a pagamento.

---

## Definition of Done (richiamo S5)

Oltre al DoD globale in [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) e alla **Production DoD** in E14:

- [x] AC delle story E14 in-scope soddisfatti (o esplicitamente slippati con nota)
- [ ] Staging e (se disponibile) prod: HTTPS, health ready/live, no Mailpit — **gap VPS** ([S5-EXIT-GAPS.md](./S5-EXIT-GAPS.md))
- [x] CI green su `develop` (lint, typecheck, test, build, audit policy) — PASS 2026-10-29; GitFlow senza PR (push diretto `develop`)
- [x] Almeno un **DR restore drill** staging annotato — **locale PASS** 2026-10-29; ripetere su VPS staging
- [x] Smoke Flusso A staging green pre-exit — **domain test PASS**; UI staging = gap VPS
- [x] Runbook + release checklist presenti sotto `docs/ops/`
- [x] Nessun SaaS a pagamento; GlitchTip solo self-host
- [x] Retro `docs/product/retros/S5-YYYY-MM-DD.md` + aggiornamento indice backlog/epics

---

## Stories in scope (tutte E14)

| ID | Titolo | Priorità | Prep S1/S4 |
|----|--------|----------|------------|
| **US-E14-01** | Reverse proxy TLS (Caddy/Traefik) | P0 | — |
| **US-E14-02** | Compose prod profile | P0 | S1 Compose |
| **US-E14-03** | Secrets management | P0 | S1 `.env.example` |
| **US-E14-04** | CI GitHub Actions | P0 | S1 script npm |
| **US-E14-05** | Migrate-on-deploy + rollback | P0 | S1 Prisma |
| **US-E14-06** | Health live/ready | P0 | S1 `/api/health` |
| **US-E14-07** | Staging parity | P0 | — |
| **US-E14-08** | Observability prod | P0 | S4 GlitchTip/log |
| **US-E14-09** | Backup cron + DR drill | P0 | S4 `pg_dump` |
| **US-E14-10** | Security prod + audit | P0 | S4 headers/RL |
| **US-E14-11** | Perf budget gate p95 | P0 | S4 harness |
| **US-E14-12** | Smoke E2E Flusso A staging | P0 | S3 Flusso A |
| **US-E14-13** | Runbooks ops | P0 | — |
| **US-E14-14** | Release checklist + semver | P0 | GitFlow |

### Prep obbligatorio (se gap da S4)

| Gap | Stato post-S4 (2026-10-29) | Azione in S5 |
|-----|---------------------------|--------------|
| Restore drill S4 | **PASS** locale (`BACKUP.md`) | Ripetere su staging **T5.20** |
| Harness p95 | `npm run perf:hq-list` green (~2.5 ms seed) | Gate **T5.24** su staging |
| Profile `observe` | Doc `docs/ops/OBSERVE.md` | Runtime self-host in **T5.16** se capacita |

---

## Task ordinati (T5.x)

Stime: **XS** &lt; ~0,5g · **S** ~0,5–1g · **M** ~1–2g. Ordine = dipendenze.

### W1 foundation — proxy, prod compose, secrets, health, CI

#### T5.1 — Endpoint liveness + readiness *(US-E14-06)* · **M**
- [x] `/api/health/live`, `/api/health/ready` (+ alias `/api/health` documentato)
- [x] Ready fallisce se DB down; live non dipende da DB
- [x] Nessun secret/PII nel JSON
- **Done quando:** curl smoke 200/503; test automatico minimo

#### T5.2 — Compose profile `prod` senza Mailpit *(US-E14-02)* · **M**
- [x] Servizi: app, worker, postgres, seaweedfs (+ proxy in T5.4); restart policy
- [x] `NODE_ENV=production`; SMTP env; **no** Mailpit
- [x] Postgres/SeaweedFS non pubblicati su 0.0.0.0
- **Done quando:** `compose --profile prod up` documentato e healthy in locale/staging-like

#### T5.3 — Resource limits + sizing VPS *(US-E14-02)* · **S**
- [x] Limits CPU/mem su app/worker/postgres
- [x] Nota sizing pilota 15 store in `COMPOSE_PROD.md`
- **Done quando:** limits in compose + doc

#### T5.4 — Reverse proxy Caddy (o Traefik) TLS *(US-E14-01)* · **M**
- [x] Servizio proxy profile prod; Caddyfile/Traefik; volumi ACME
- [x] Upstream readiness; porte 80/443
- **Done quando:** HTTPS su staging (o lab con DNS) OK

#### T5.5 — Doc PROXY + DNS/porte *(US-E14-01)* · **S**
- [x] `docs/ops/PROXY.md`: ACME, rinnovo, troubleshooting
- **Done quando:** operatore può riprodurre senza chat

#### T5.6 — SECRETS.md + gitignore / env example *(US-E14-03)* · **S**
- [x] Generazione, layout VPS, divieto commit; Docker secrets nota
- [x] Allineamento `.env.example`
- **Done quando:** review secrets policy OK

#### T5.7 — Guardrail secret in CI/script *(US-E14-03)* · **S**
- [x] Scan basico o job che fallisce su pattern evidenti
- **Done quando:** documentato e eseguibile in CI o pre-commit

#### T5.8 — GitHub Actions: lint + typecheck + test *(US-E14-04)* · **M**
- [x] Workflow PR → `develop`
- [x] Postgres service container se integration
- **Done quando:** PR di prova green/red corretta

#### T5.9 — CI build + cache *(US-E14-04)* · **S**
- [x] Job `next build` (o equivalente) + cache npm
- **Done quando:** build in CI stabile

#### T5.10 — Doc runner CI (GH free / self-hosted) *(US-E14-04)* · **S**
- [x] Scelta annotata; niente secret prod in PR CI
- **Done quando:** `docs/ops/CI.md` (o sezione) completa

#### T5.11 — Wiring healthcheck Compose + proxy *(US-E14-06)* · **S**
- [x] Healthcheck Compose su readiness; proxy allineato
- **Done quando:** container unhealthy se DB down

### W1→W2 — staging, migrate, security, obs

#### T5.12 — Staging parity provisioning *(US-E14-07)* · **M**
- [x] Project/host staging; domain; secret separati; stesso profile prod
- **Done quando:** stack staging healthy via HTTPS

#### T5.13 — Checklist parity + reset seed staging *(US-E14-07)* · **S**
- [x] Doc parity vs prod; procedura seed/reset non-prod
- **Done quando:** checklist usabile in release

#### T5.14 — Migrate-on-deploy procedura *(US-E14-05)* · **M**
- [x] Ordine: backup → `prisma migrate deploy` → restart → health
- [x] Script o runbook eseguibile su staging
- **Done quando:** migrate staging eseguita con successo

#### T5.15 — Runbook rollback migrate/app *(US-E14-05)* · **S**
- [x] Restore dump pre-migrate + redeploy tag precedente; limiti forward-fix
- **Done quando:** dry-run documentato su staging

#### T5.16 — GlitchTip profile observe prod/staging *(US-E14-08)* · **M**
- [x] Avvio self-host **oppure** decisione esplicita log-only (risorse)
- [x] Zero Sentry Cloud
- **Done quando:** errori di prova visibili in GlitchTip **o** policy log-only firmata

#### T5.17 — Log rotation *(US-E14-08)* · **S**
- [x] Docker logging options e/o logrotate host
- **Done quando:** doc + config esempio applicata su staging

#### T5.18 — Script uptime check + cron *(US-E14-08)* · **S**
- [x] Curl readiness; cron; alert via exit/SMTP self-host
- **Done quando:** script gira e fallisce se staging down

#### T5.19 — Verify security headers/RL dietro TLS *(US-E14-10)* · **S**
- [x] Conferma AC `US-E10-07` su URL HTTPS staging
- **Done quando:** evidence in verify report

#### T5.20 — Firewall doc + fail2ban opzionale *(US-E14-10)* · **XS**
- [x] UFW 22/80/443; nota fail2ban non obbligatoria
- **Done quando:** doc ops aggiornata

#### T5.21 — CI audit npm + OSV *(US-E14-10, US-E14-04)* · **M**
- [x] Job audit; policy high/critical + waiver path
- **Done quando:** gate attivo su PR o nightly

### W2 — backup/DR, perf, smoke, runbook, release

#### T5.22 — Backup automatico cron *(US-E14-09)* · **M**
- [x] `pg_dump -Fc` off-volume; size/checksum; retention
- **Done quando:** cron staging produce dump verificabile

#### T5.23 — Runbook DR + drill staging *(US-E14-09)* · **M**
- [x] `pg_restore --list` → restore scratch → conteggi; verbale data/RTO
- [x] Nota SeaweedFS MVP
- **Done quando:** drill PASS annotato

#### T5.24 — Perf budget script + gate *(US-E14-11)* · **M**
- [x] p95 lista HQ &lt; 300 ms su seed; fail CI o NO-GO checklist
- **Done quando:** gate eseguibile e documentato

#### T5.25 — Smoke E2E Flusso A staging *(US-E14-12)* · **M**
- [x] Script OSS end-to-end Flusso A; secret staging
- **Done quando:** run green su staging seed

#### T5.26 — Hook smoke in pre-release / CI opz. *(US-E14-12)* · **S**
- [x] Collegamento a checklist o workflow manuale/nightly
- **Done quando:** percorso release lo richiede

#### T5.27 — Runbook incidente *(US-E14-13)* · **S**
- [x] `docs/ops/runbooks/INCIDENT.md`
- **Done quando:** triage + rollback tag chiari

#### T5.28 — Runbook restore (link DR) *(US-E14-13)* · **XS**
- [x] `RESTORE.md` punta a drill US-E14-09
- **Done quando:** link non ambiguo

#### T5.29 — Runbook rotazione secret *(US-E14-13)* · **S**
- [x] AUTH_SECRET, DB, SMTP; impatto sessioni
- **Done quando:** procedura provabile su staging (almeno un secret)

#### T5.30 — Runbook scale worker *(US-E14-13)* · **S**
- [x] Scale Compose / limiti pg-boss; verifica code
- **Done quando:** scale di prova staging documentata

#### T5.31 — Release checklist + Go/No-go *(US-E14-14)* · **S**
- [x] `docs/ops/RELEASE_CHECKLIST.md` allineata Production DoD E14
- **Done quando:** checklist usata in dry-run

#### T5.32 — Semver + changelog template *(US-E14-14)* · **S**
- [x] Convenzione tag `vX.Y.Z`; GitFlow release branch
- **Done quando:** esempio tag su staging release dry-run

#### T5.33 — Dry-run release su staging *(US-E14-14)* · **XS**
- [x] Eseguire checklist end-to-end senza dichiarare prod go se VPS prod non pronta
- **Done quando:** gap list esplicita o Go staging

#### T5.34 — Chiusura sprint S5 *(meta)* · **S**
- [x] Spuntare E14/BACKLOG; retro S5; aggiornare `sprints/README.md` indice
- **Done quando:** artefatti Scrum chiusi

---

### Riepilogo task

| ID | Story | Size |
|----|-------|------|
| T5.1 | US-E14-06 | M |
| T5.2 | US-E14-02 | M |
| T5.3 | US-E14-02 | S |
| T5.4 | US-E14-01 | M |
| T5.5 | US-E14-01 | S |
| T5.6 | US-E14-03 | S |
| T5.7 | US-E14-03 | S |
| T5.8 | US-E14-04 | M |
| T5.9 | US-E14-04 | S |
| T5.10 | US-E14-04 | S |
| T5.11 | US-E14-06 | S |
| T5.12 | US-E14-07 | M |
| T5.13 | US-E14-07 | S |
| T5.14 | US-E14-05 | M |
| T5.15 | US-E14-05 | S |
| T5.16 | US-E14-08 | M |
| T5.17 | US-E14-08 | S |
| T5.18 | US-E14-08 | S |
| T5.19 | US-E14-10 | S |
| T5.20 | US-E14-10 | XS |
| T5.21 | US-E14-10 / 04 | M |
| T5.22 | US-E14-09 | M |
| T5.23 | US-E14-09 | M |
| T5.24 | US-E14-11 | M |
| T5.25 | US-E14-12 | M |
| T5.26 | US-E14-12 | S |
| T5.27 | US-E14-13 | S |
| T5.28 | US-E14-13 | XS |
| T5.29 | US-E14-13 | S |
| T5.30 | US-E14-13 | S |
| T5.31 | US-E14-14 | S |
| T5.32 | US-E14-14 | S |
| T5.33 | US-E14-14 | XS |
| T5.34 | meta | S |

**Totale task sprint:** **34** (mappano i **42** TK epic; alcuni TK XS epic sono fusi nei Done criteria dei T5).

---

## Checkpoints

| CP | Quando | Gate | Se FAIL |
|----|--------|------|---------|
| **CP1** | Fine giorno 3 | Health live/ready (T5.1) + Compose prod (T5.2) + secrets doc (T5.6) | Bloccare proxy fino a prod compose stabile |
| **CP2** | Fine W1 | Proxy TLS staging (T5.4) + CI lint/test/build (T5.8–9) + health wiring (T5.11) | Tagliare Traefik alt; focus Caddy; CI minimo senza cache fancy |
| **CP3** | Giorno 8 | Staging parity (T5.12) + migrate (T5.14–15) + backup cron avviato (T5.22) | Slip GlitchTip → log-only; proteggere DR drill |
| **CP4** | Giorno 10 exit | DR drill (T5.23) + smoke A (T5.25) + perf gate (T5.24) + checklist release (T5.31) + zero SaaS | No-go pilota prod; Go solo staging se gap minimi documentati |

---

## Piano settimane

### Settimana 1 — “Prod stack + TLS + CI”

| Giorno | Focus |
|--------|--------|
| 1–2 | T5.1 health · T5.2–T5.3 compose prod · T5.6 secrets |
| 3 | **CP1** · T5.4 proxy · T5.7 secret guardrail |
| 4–5 | T5.8–T5.10 CI · T5.5 PROXY.md · T5.11 wiring · **CP2** |

### Settimana 2 — “Staging, DR, smoke, release”

| Giorno | Focus |
|--------|--------|
| 6–7 | T5.12–T5.15 staging + migrate · T5.16–T5.18 obs · T5.19–T5.21 security/audit |
| 8 | T5.22 backup · avvio T5.23 drill · **CP3** |
| 9 | T5.23 drill close · T5.24 perf · T5.25–T5.26 smoke A · T5.27–T5.30 runbooks |
| 10 | T5.31–T5.33 release · T5.34 chiusura · **CP4 / Exit** |

---

## Exit criteria (Increment S5)

Uno-liner: **staging (e prod se provisionata) HTTPS + CI + migrate + DR drill + smoke Flusso A + runbook/semver — zero SaaS.**

Checklist:

- [x] HTTPS via Caddy/Traefik; profile prod senza Mailpit
- [x] Secrets policy + nessun secret in git
- [x] CI: lint, typecheck, test, build, audit policy
- [ ] Migrate-on-deploy + rollback runbook provati su staging
- [x] Live/ready consumati da Compose/proxy
- [ ] Staging parity checklist OK
- [x] Obs: rotation + uptime + GlitchTip o log-only esplicito
- [x] Backup cron + DR drill PASS datato
- [x] Security verify dietro TLS + firewall doc
- [x] Perf p95 gate OK (o NO-GO esplicito)
- [ ] Smoke Flusso A staging green
- [x] Quattro runbook + release checklist + tag semver dry-run
- [x] Production DoD E14 soddisfatta per Go pilota (o gap list)

---

## Carry-over post-S5

| Item | Nota |
|------|------|
| VPS prod secondaria / HA | Fuori pilota single-node |
| PITR / replica Postgres | Post-pilota |
| Traefik se non scelto | Solo se Caddy insufficiente |
| Smoke A in CI obbligatorio ogni PR | Opz.; può restare pre-release |
| Alerting avanzato (Prometheus/Loki) | Profile observe esteso |
| fail2ban hardening pieno | Opzionale già in E14 |

---

## Production Definition of Done (richiamo breve)

Vedi sezione completa in [`../backlog/E14-production-ready.md`](../backlog/E14-production-ready.md). Sintesi exit:

HTTPS · Compose prod · secrets · CI · migrate+rollback · ready/live · staging parity · obs minima · backup+DR · security+audit · p95 gate · smoke A · runbook · semver — **EU, OSS-only**.

---

## Riferimenti rapidi

| Artefatto | Path |
|-----------|------|
| Epic E14 | `docs/product/backlog/E14-production-ready.md` |
| Product Backlog | `docs/product/BACKLOG.md` |
| Stack OSS | `docs/product/STACK.md` |
| DoD globale | `docs/product/sprints/DEFINITION_OF_DONE.md` |
| S4 (prep NFR) | `docs/product/sprints/S4-sprint-backlog.md` |
| Retro S5 | `docs/product/retros/S5-YYYY-MM-DD.md` |

---

*Documento di planning — nessuna implementazione implicita. Aggiornare checkbox task durante lo sprint.*
