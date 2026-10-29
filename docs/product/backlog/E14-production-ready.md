# E14 — Production-Ready (pilota EU self-host)

> FacilityFlow Retail — epic **ops / harden** per rendere la piattaforma **rilasciabile in produzione** su VPS EU (Compose OSS), pilota **15 store**.  
> Lingua: italiano · **Nessun codice** in questo documento · **Nessun SaaS a pagamento** nel path critico  
> Fonte prodotto: [`../BACKLOG.md`](../BACKLOG.md) · Stack: [`../STACK.md`](../STACK.md) · Sprint dedicato: [`../sprints/S5-sprint-backlog.md`](../sprints/S5-sprint-backlog.md)

**Stato 2026-10-29:** artefatti S5 pronti · prove lab PASS · **NO-GO VPS** — vedi [`../sprints/S5-EXIT-GAPS.md`](../sprints/S5-EXIT-GAPS.md).

---

## Analysis Card

- **Assunzioni:** S1–S4 Increment MVP prodotto disponibile (wedge + Flussi A–C + seed 15×5 + NFR base); target = **singola VPS EU** + eventuale staging su seconda macchina o stesso host con project Compose separato; SMTP reale già fuori Mailpit (profile prod); pilota 15 store / ~5 vendor senza feature prodotto nuove.
- **Ricerca:** Caddy Automatic HTTPS + Compose (volumi `/data` ACME) ([caddyserver.com/docs/automatic-https](https://caddyserver.com/docs/automatic-https), [zeroexp.dev Compose+Caddy](https://zeroexp.dev/library/docker-compose-https-certificates)); `prisma migrate deploy` in pipeline, mai `migrate dev` in prod ([Prisma deploy migrations](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)); backup utile solo con restore drill su DB scratch (`pg_dump -Fc` + `pg_restore --list` + restore non-live).
- **Scelta di design:** epic **S5 dedicato** “Production harden” (preferito a spargere tutto in S4); in S1/S4 solo **prep** già previste (health, compose, backup 1-pager, GlitchTip opz., security baseline, harness p95). Reverse proxy default **Caddy** (ACME zero-config); Traefik accettato come alternativa documentata. CI = **GitHub Actions** (runner free o self-hosted) = infra, non product SaaS.
- **AI:** `no` — zero AI; mai SoR.
- **Rischi:** confondere harden ops con feature prodotto; SMTP deliverability; secrets accidentalmente in git; migrate senza backup pre-deploy; staging “diverso” da prod → false confidence.

---

## Obiettivo epic

Rendere FacilityFlow **production-ready** per un pilota **15 store** su **VPS EU self-host** (Docker Compose + TLS + CI + backup/DR + runbook), senza inventare scope prodotto fuori wedge (no WhatsApp API, no billing, no AI SoR, no marketplace).

**Successo:** un operatore può rilasciare un tag semver su staging → prod con checklist, HTTPS, migrate sicura, health consumati dal proxy, backup automatico + drill restore, osservabilità minima (log + GlitchTip profile), smoke Flusso A su staging, e runbook per incidente / restore / rotazione secret / scale worker.

---

## Fuori scope (esplicito)

| Escluso | Motivo |
|---------|--------|
| WhatsApp Business API / CMMS / marketplace / pagamenti / billing | Fuori wedge MVP |
| AI / Ollama / chatbot ops | Fase 2; mai SoR |
| Multi-region / multi-paese / HA multi-nodo | Pilota single-VPS |
| PITR / replica Postgres / Kubernetes | Post-pilota; MVP = `pg_dump` + drill |
| SaaS a pagamento (Sentry Cloud, Datadog, managed DB, …) | `STACK.md` |
| Feature prodotto nuove (dashboard, ticket, …) | Già E01–E13 |

---

## Dipendenze / prep da sprint precedenti

| Quando | Cosa già (o da avviare) | Story correlate |
|--------|-------------------------|-----------------|
| **S1** | Compose core, `/api/health`, `.env.example`, worker, Postgres, SeaweedFS, Mailpit **solo** `dev` | US-E00-01…05 |
| **S4** | Log JSON + request id; profile `observe` GlitchTip opz.; script/`pg_dump` + runbook 1-pager; headers + rate limit; seed 15×5; harness misura p95 lista HQ | US-E10-03, US-E10-04, US-E10-07 |
| **S5** | Harden prod: TLS proxy, profile prod, secrets, CI, migrate/rollback, ready/live, staging parity, obs prod, backup cron+DR, security audit, perf gate CI, smoke E2E, runbook, release/semver | US-E14-01…14 |

> Se S4 non ha chiuso backup drill o p95 harness, **portarli come prep bloccante** in S5 W1 (non reinventare; chiudere il gap E10).

---

## Stories

### US-E14-01 — Reverse proxy TLS (Caddy o Traefik) + HTTPS

**Come** operatore, **voglio** terminare TLS sul reverse proxy davanti a `app`, **così** il pilota è raggiungibile solo in HTTPS su dominio EU.

**AC**
- [x] Servizio Compose (profile `prod`) **Caddy** (default) **oppure** Traefik, documentato in `docs/ops/PROXY.md`
- [x] HTTPS automatico (ACME Let’s Encrypt / equivalente OSS); HTTP → HTTPS
- [x] Upstream solo rete Docker interna; porte host pubbliche **80/443** (e SSH); Postgres/SeaweedFS **non** esposti pubblicamente
- [x] Proxy usa health/readiness upstream (vedi US-E14-06)
- [x] Nessun certificato/secret ACME committed in git; volume persistente per stato ACME

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-01.1 | Caddyfile (o Traefik) + servizio Compose profile `prod` | M |
| TK-E14-01.2 | Documentazione DNS, porte, rinnovo, troubleshooting TLS | S |
| TK-E14-01.3 | Smoke HTTPS staging + redirect HTTP | XS |

---

### US-E14-02 — Compose production profile

**Come** operatore, **voglio** un profilo Compose `prod` distinto da `dev`, **così** non avvio Mailpit né impostazioni da laptop in produzione.

**AC**
- [x] Profile / file prod: `app`, `worker`, `postgres`, `seaweedfs`, `proxy` (+ `observe` opzionale); **Mailpit assente**
  > proxy TLS = T5.4 ancora aperto; stack core in `compose.prod.yaml`
- [x] `restart: unless-stopped` (o `always`) su servizi critici
- [x] Resource limits (CPU/mem) documentati e applicati almeno su `app`, `worker`, `postgres`
- [x] `NODE_ENV=production`; SMTP reale via env (no Mailpit)
- [x] Doc in `docs/ops/COMPOSE_PROD.md` (differenze vs dev, comandi up/down)

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-02.1 | Compose prod: servizi, restart, no Mailpit | M |
| TK-E14-02.2 | Resource limits + note sizing VPS 15-store | S |
| TK-E14-02.3 | Doc COMPOSE_PROD + checklist “non esporre DB” | S |

---

### US-E14-03 — Secrets management

**Come** operatore, **voglio** gestire secret solo via env / Docker secrets documentati, **così** nessun secret finisce nel repo.

**AC**
- [x] `.env.example` completo **senza** valori reali; `.env*` (tranne example) in `.gitignore`
- [x] Doc `docs/ops/SECRETS.md`: generazione (`openssl rand`), rotazione (link US-E14-13), dove vivono i file sul VPS
- [x] Opzione documentata: Docker secrets / file montati read-only (anche se MVP usa soprattutto env files)
- [x] Checklist pre-commit / CI: fail se pattern secret banali rilevati (dove fattibile OSS)
- [x] Credenziali seed QA **mai** usate in prod

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-03.1 | SECRETS.md + allineamento `.env.example` / gitignore | S |
| TK-E14-03.2 | Nota Docker secrets + layout file sul VPS | XS |
| TK-E14-03.3 | Guardrail CI o script scan secret basico | S |

---

### US-E14-04 — CI pipeline OSS (GitHub Actions)

**Come** developer, **voglio** una pipeline CI OSS su ogni PR verso `develop`, **così** lint/typecheck/test/build falliscono prima del merge.

**AC**
- [x] Workflow GitHub Actions: `lint`, `typecheck`, unit/integration, `build` (Next)
- [x] Runner: GitHub-hosted free **oppure** self-hosted sul VPS EU — documentato; **non** è product SaaS
- [x] Nessun secret di prod nella CI di PR; DB di test effimero (service container Postgres) se serve integration
- [x] Badge/status opzionale; branch protection consigliata su `develop` (doc) — `docs/ops/CI.md` + badge README
- [x] Job audit dipendenze (npm audit / OSV) — vedi anche US-E14-10; può condividere step

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-04.1 | Workflow PR: lint + typecheck + test | M |
| TK-E14-04.2 | Job build + cache dipendenze | S |
| TK-E14-04.3 | Doc runner (GH free vs self-hosted) + secrets CI | S |

---

### US-E14-05 — DB migrate-on-deploy + rollback runbook

**Come** operatore, **voglio** applicare migrazioni Prisma in modo controllato al deploy, **così** lo schema prod resta allineato con rollback documentato.

**AC**
- [x] Deploy usa **`prisma migrate deploy`** (mai `migrate dev` in staging/prod) — `docs/ops/MIGRATE.md` + `deploy-migrate.sh`
- [x] Ordine documentato: backup → migrate deploy → avvio/ricarica app/worker → smoke health
- [x] Runbook rollback: limiti Prisma (forward-fix preferito); procedura restore DB da dump pre-migrate + redeploy tag precedente
- [x] Migrazioni committed in git; `migrate status` in troubleshooting
- [ ] Test almeno una volta su **staging** (gap VPS)

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-05.1 | Script/procedura migrate-on-deploy (staging+prod) | M |
| TK-E14-05.2 | Runbook rollback schema/app (dump + tag precedente) | S |
| TK-E14-05.3 | Prove su staging annotate nel runbook | S |

---

### US-E14-06 — Health / readiness / liveness

**Come** proxy e operatore, **voglio** endpoint di liveness e readiness distinti, **così** il proxy non manda traffico a istanze non pronte.

**AC**
- [x] **Liveness** (es. `/api/health/live`): processo up — non dipende da DB
- [x] **Readiness** (es. `/api/health/ready`): DB raggiungibile (+ opz. check minimo storage); 503 se non pronto
- [x] Compat: `/api/health` aggregato o alias documentato (E00)
- [x] Compose healthcheck e proxy usano readiness (o policy documentata)
- [x] Nessun leak di secret/PII nei body health

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-06.1 | Endpoint live + ready (+ alias `/api/health`) | M |
| TK-E14-06.2 | Wiring Compose healthcheck + proxy | S |
| TK-E14-06.3 | Test smoke 200/503 | XS |

---

### US-E14-07 — Staging environment parity

**Come** team, **voglio** uno staging con **parity** rispetto a prod (stesso Compose profile, stessa major version immagini), **così** smoke e migrate non mentono.

**AC**
- [ ] Ambiente staging su VPS EU (host dedicato o Compose project separato) documentato
- [ ] Stesso profile `prod` (no Mailpit); secret/staging DB/domain distinti
- [ ] Seed/anonymized o seed pilota **non** di produzione; procedura reset staging
- [ ] Checklist parity: proxy TLS, migrate, backup script, observe opzionale
- [ ] Deploy: prima staging, poi prod (release checklist US-E14-14)

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-07.1 | Provisioning staging + env/domain separati | M |
| TK-E14-07.2 | Doc parity checklist + reset seed staging | S |
| TK-E14-07.3 | Smoke stack healthy staging | XS |

---

### US-E14-08 — Observability produzione

**Come** operatore, **voglio** errori e uptime minimi self-host, **così** il pilota non dipende da Sentry Cloud / Datadog.

**AC**
- [x] Profile Compose `observe` con **GlitchTip** self-host (o conferma “log-only” se risorse VPS insufficienti — decisione annotata) — `OBSERVE.md`
- [x] Log rotation su host (logrotate / Docker `logging` options) documentata
- [x] Script OSS di **uptime check** (curl readiness) + cron esempio — `scripts/uptime-check.sh` / `CRON.md`
- [x] Request id correlabile (da S4) richiamato nei runbook incidente
- [x] Zero Sentry Cloud / SaaS APM

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-08.1 | GlitchTip profile prod/staging documentato e avviabile | M |
| TK-E14-08.2 | Log rotation (Docker/host) | S |
| TK-E14-08.3 | Script uptime + cron esempio | S |

---

### US-E14-09 — Backup automatico + DR drill

**Come** operatore, **voglio** backup Postgres automatici e un drill di restore, **così** un incidente dati non chiude il pilota.

**AC**
- [x] Cron host (o timer) esegue `pg_dump -Fc` fuori dal volume DB; checksum/size check; retention documentata — `BACKUP.md` / `pg-backup.sh`
- [x] Runbook DR: verify `pg_restore --list` → restore su DB **scratch** — `runbooks/RESTORE.md`
- [ ] Almeno **un** drill eseguito su **staging VPS** e annotato (locale drill PASS; gap VPS)
- [x] Policy SeaweedFS: cosa è / non è nel dump; restore allegati documentato a livello MVP
- [x] Estende / sostituisce il 1-pager S4 (`US-E10-03`) senza contraddirlo

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-09.1 | Script backup + cron + retention | M |
| TK-E14-09.2 | Runbook DR completo (dump → verify → restore scratch) | M |
| TK-E14-09.3 | Esecuzione drill staging + verbale | S |

---

### US-E14-10 — Security produzione

**Come** security-conscious operator, **voglio** harden di superficie e audit dipendenze, **così** il pilota riduce rischio brute-force e CVE note.

**AC**
- [ ] Headers security + rate limit (da `US-E10-07`) **verificati** dietro proxy in staging/prod (gap VPS; script locale `verify:headers`)
- [x] Nota **opzionale** fail2ban (SSH / abuse) — non obbligatorio per DoD; se assente, motivare — `FIREWALL.md`
- [x] Gate CI o script periodico: `npm audit` e/o **OSV** scanner; policy: fail su critical/high con path di waiver documentato
- [x] Firewall host: solo 22/80/443 (doc UFW o equivalente) — `FIREWALL.md`
- [x] Nessun secret in log; cookie secure in HTTPS (policy doc; enforce TLS su VPS)

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-10.1 | Verify headers/rate-limit dietro TLS proxy | S |
| TK-E14-10.2 | Doc fail2ban opzionale + firewall porte | XS |
| TK-E14-10.3 | Job/script audit npm + OSV in CI | M |

---

### US-E14-11 — Performance budget gate

**Come** team, **voglio** un gate su p95 lista ticket HQ, **così** non rilasciamo regressioni oltre budget sul seed pilota.

**AC**
- [x] Script (o job CI su staging/seed) misura p95 lista HQ; budget allineato MVP: **&lt; 300 ms** su seed 15×5 (come exit S4)
- [x] Fallisce la pipeline o il pre-release check se oltre budget (o genera report “NO-GO” nella release checklist)
- [x] Ambiente di misura documentato (non misurare su laptop freddo vs prod senza notare)
- [x] Nessuna cache SaaS; fix ammessi = indici/query/pagination

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-11.1 | Script misura p95 riusabile (da harness S4) | S |
| TK-E14-11.2 | Gate CI o step release checklist con soglia | M |
| TK-E14-11.3 | Doc ambiente di misura + interpretazione | XS |

---

### US-E14-12 — Smoke E2E Flusso A su staging

**Come** QA/ops, **voglio** uno smoke automatico o semi-automatico del **Flusso A** contro staging, **così** ogni release verifica il percorso pilota critico.

**AC**
- [x] Smoke Flusso A **domain** (vitest) + **HTTP auth** (`smoke:http` in CI); UI Flusso A su **staging VPS** resta gap
- [x] Eseguibile via script documentato (curl+session OSS + vitest); job CI su `develop`
- [x] Fallimento = blocco release (checklist) — CI fail / release checklist
- [x] Nessuna dipendenza da WhatsApp API; UI IT
- [ ] Credenziali solo secret staging (gap VPS)

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-12.1 | Script smoke Flusso A (staging) | M |
| TK-E14-12.2 | Integrazione pre-release / CI opzionale | S |
| TK-E14-12.3 | Doc dati seed + troubleshooting fail | XS |

---

### US-E14-13 — Runbook operativi

**Come** operatore on-call del pilota, **voglio** runbook brevi, **così** incidente / restore / rotazione secret / scale worker non dipendono dalla memoria.

**AC**
- [x] `docs/ops/runbooks/INCIDENT.md` — triage, log/GlitchTip, health, rollback tag
- [x] `docs/ops/runbooks/RESTORE.md` — punta/estende US-E14-09
- [x] `docs/ops/runbooks/SECRET_ROTATION.md` — AUTH_SECRET, DB password, SMTP, impatto sessioni (alias ROTATE_SECRETS)
- [x] `docs/ops/runbooks/SCALE_WORKER.md` — `compose up --scale worker=N` (o replica documentata), limiti Postgres/pg-boss
- [x] Ogni runbook: prerequisiti, passi, verifica, rollback; lingua IT

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-13.1 | Runbook incidente | S |
| TK-E14-13.2 | Runbook restore (link DR) | XS |
| TK-E14-13.3 | Runbook rotazione secret | S |
| TK-E14-13.4 | Runbook scale worker | S |

---

### US-E14-14 — Release checklist + versioning (semver)

**Come** release manager, **voglio** checklist + tag semver GitFlow, **così** ogni rilascio pilota è ripetibile e tracciabile.

**AC**
- [ ] Checklist release in `docs/ops/RELEASE_CHECKLIST.md` (CI green, staging smoke A, migrate, backup pre-prod, health, perf gate, zero SaaS)
- [ ] Versioning **semver** (`vX.Y.Z`); branch `release/x.y.z` → `main` + sync `develop` (GitFlow)
- [ ] Tag annotato collegato a changelog breve (Keep a Changelog light)
- [ ] Go/No-go pilota espliciti
- [ ] Nessun deploy “a mano” senza checklist firmata (anche self-check)

**Task (TK)**
| ID | Task | Size |
|----|------|------|
| TK-E14-14.1 | RELEASE_CHECKLIST.md + Go/No-go | S |
| TK-E14-14.2 | Convenzione semver + template tag/changelog | S |
| TK-E14-14.3 | Dry-run checklist su staging | XS |

---

## Riepilogo conteggi epic

| Metrica | Valore |
|---------|--------|
| User story | **14** (`US-E14-01` … `US-E14-14`) |
| Task (TK) | **42** |
| Sprint primario | **S5** (2 settimane) |
| Prep | S1 (health/compose/env), S4 (backup, observe, security, p95, seed) |

---

## Production Definition of Done

Una release / ambiente si considera **production-ready** (pilota) solo se:

- [ ] HTTPS attivo via proxy OSS (Caddy/Traefik); HTTP redirect; DB/storage non pubblici
- [ ] Profile Compose **prod** senza Mailpit; restart policy + limits applicati
- [ ] Secret solo fuori git; `SECRETS.md` seguito; seed QA ≠ prod
- [ ] CI green su lint, typecheck, test, build (+ audit critical/high gestiti)
- [ ] Migrate-on-deploy con backup precedente; rollback runbook provato su staging
- [ ] Liveness + readiness consumati da Compose/proxy
- [ ] Staging con parity documentata; smoke **Flusso A** passato su staging
- [ ] Observability: log rotation + (GlitchTip self-host **o** log-only esplicito) + uptime script
- [ ] Backup cron attivo; **DR drill** staging OK e datato
- [ ] Security: headers/rate-limit dietro TLS; firewall doc; audit dipendenze in CI
- [ ] Perf budget p95 lista HQ rispettato (o NO-GO esplicito)
- [ ] Runbook: incidente, restore, rotate secrets, scale worker
- [ ] Tag semver + release checklist completata
- [ ] **Zero** SaaS a pagamento nel path critico; regione dati **EU**

---

## Mapping sprint

| Story | S5 | Prep note |
|-------|----|-----------|
| US-E14-01 Proxy TLS | P0 | — |
| US-E14-02 Compose prod | P0 | S1 compose base |
| US-E14-03 Secrets | P0 | S1 `.env.example` |
| US-E14-04 CI | P0 | S1 script lint/typecheck/test |
| US-E14-05 Migrate/rollback | P0 | S1 Prisma migrate |
| US-E14-06 Health live/ready | P0 | S1 `/api/health` |
| US-E14-07 Staging parity | P0 | — |
| US-E14-08 Observability prod | P0 | S4 GlitchTip profile |
| US-E14-09 Backup/DR | P0 | S4 `pg_dump` 1-pager |
| US-E14-10 Security prod | P0 | S4 headers/rate limit |
| US-E14-11 Perf gate | P0 | S4 harness p95 |
| US-E14-12 Smoke Flusso A | P0 | S3 Flusso A E2E |
| US-E14-13 Runbooks | P0 | — |
| US-E14-14 Release/semver | P0 | GitFlow repo |

---

*Documento di planning — nessuna implementazione implicita. Aggiornare `BACKLOG.md` indice epics quando E14 viene accettato nel Product Backlog canonico.*
