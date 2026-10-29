# Sprint 4 — Sprint Backlog

> FacilityFlow Retail — **HQ governa + harden OSS**  
> Lingua: italiano · Stack: **OSS-only / self-host** · Nessun codice in questo documento  
> Fonte: [`../BACKLOG.md`](../BACKLOG.md) · DoD: [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) · Stack: [`../STACK.md`](../STACK.md) · RBAC: [`../RBAC.md`](../RBAC.md)

---

## Meta

| Campo | Valore |
|-------|--------|
| **Sprint** | S4 (settimane 7–8 del piano MVP 4×2w) |
| **Durata** | 2 settimane |
| **Capacità** | ~1–2 FTE · effort stimato **M** (rischio principale: MTTR/aggregati corretti, WCAG AA, backup verificabile) |
| **Branch base** | `develop` → `feature/FF-S4-*` / `bugfix/FF-S4-*` |
| **Vincolo hard** | Zero SaaS a pagamento nel path critico (no Clerk, Neon/Supabase Cloud, R2/S3 paid, Resend/Postmark, Inngest/Trigger Cloud, Sentry Cloud) |
| **UI** | Italiano (`it` default); catalogo i18n obbligatorio sulle nuove superfici |
| **Dipendenze in ingresso** | S1–S3 Done: tenancy/RBAC, ticket lifecycle, SLA/breach, vendor portal, verify/costi, email+bell, audit ticket (`US-E10-01`), Flussi A/B (+ C gate) |
| **Out of scope S4** | AI, WhatsApp Business API, marketplace, pagamenti, PM calendar, export contabile avanzato (F2-05), PWA, multi-paese |

### Analysis Card (planning S4)

- **Assunzioni:** S1–S3 Increment disponibile; seed pilota non ancora completo (lo è `US-E10-04`); `viewer_finance` già in `RBAC.md` ma UI/API dashboard da chiudere; p95 lista HQ già citato in `US-E04-04` ma misurato su seed S4.
- **Ricerca:** stati empty/loading/error accessibili ([accessibility.build](https://accessibility.build/blog/accessible-loading-empty-error-states), [WCAG 2.1](https://www.w3.org/TR/WCAG21/)); backup `pg_dump` + verify restore ([docs PostgreSQL](https://www.postgresql.org/docs/current/app-pgdump.html), runbook dump→verify→retain).
- **Scelta di design:** seed e indici **prima** della dashboard e della misura p95; soft-delete e i18n come policy/scaffolding leggeri (doc + catalogo) invece di rewrite; GlitchTip solo profile Compose `observe` (opzionale); `US-E10-08` stretch esplicitamente droppable.
- **AI:** `no` — MVP; Fase 2 = Ollama + human-confirm.
- **Rischi:** aggregazioni MTTR/costi errate → trust HQ rotto; AA incompleta sui flussi store/HQ; backup “solo script” senza drill restore; scope creep su audit config.

---

## Sprint Goal

**Dashboard HQ operativa** (aperti / breached / a rischio / MTTR grezzo / costi periodo) con accesso **`viewer_finance` read-only**, più **harden NFR OSS**: a11y (WCAG 2.1 AA flussi principali), seed pilota 15×5, policy soft-delete, catalogo i18n `it`, security headers + rate limit, backup `pg_dump` + runbook, export GDPR, e **p95 lista HQ &lt; 300 ms** sul dataset seed — senza introdurre SaaS a pagamento.

---

## Definition of Done (richiamo S4)

Oltre al DoD globale in [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md), per questo sprint:

- [x] AC delle story in-scope soddisfatti (o story esplicitamente droppata / ripianificata)
- [x] Isolamento tenant su dashboard, export GDPR, seed, query aggregati
- [x] Test dominio: aggregazioni MTTR/costi, deny mutation `viewer_finance`, soft-delete regole critiche, rate limit smoke
- [x] Verify: typecheck + lint + test; Compose healthy **app / db / jobs** (+ SeaweedFS); report breve post-slice
- [x] Documenti ops prodotti: `SOFT_DELETE.md`, runbook backup, note seed QA, retention GDPR
- [x] Nessun SaaS a pagamento; GlitchTip solo se profile `observe` self-host
- [x] `BACKLOG.md` aggiornato a fine sprint + retro `docs/product/retros/S4-YYYY-MM-DD.md`

---

## Stories in scope

| ID | Titolo | Priorità | Note |
|----|--------|----------|------|
| **US-E09-01** | Overview operativa HQ + `viewer_finance` | P0 | MTTR grezzo (verified), costi `actual_cost`, breakdown store, range 30g |
| **US-E10-02** | Empty / loading / error + a11y + mobile | P0 | WCAG 2.1 AA store/HQ; create-ticket + vendor status @ 390px |
| **US-E10-03** | Osservabilità + backup OSS | P0 | Log JSON + request id; opz. GlitchTip; `pg_dump` + runbook; policy SeaweedFS |
| **US-E10-04** | Seed pilota & dataset perf | P0 | ≥15 store, 5 vendor; stress opz. 50×5k; exit criterion |
| **US-E10-05** | Policy soft-delete unificata | P0 | Doc `docs/ops/SOFT_DELETE.md` + allineamento comportamento |
| **US-E10-06** | i18n scaffolding | P0 | Catalogo default `it`; stub `en` opzionale |
| **US-E10-07** | Security baseline | P0 | Headers CSP/frame/nosniff; rate limit auth/intake; MIME + signed URL TTL |
| **US-E12-01** | Export + retention GDPR | P1 | Export JSON/CSV; retention 24 mesi verified; regione EU |
| **US-E10-08** | Audit config membership/ruoli | P1 **stretch** | Droppable → Fase 2 senza bloccare DoD MVP |
| **Buffer** | Bugfix + indici perf | — | Capacità residua; p95 &lt; 300 ms |

---

## Regola drop — US-E10-08 (stretch)

| Condizione | Azione |
|------------|--------|
| A fine **giorno 8** (W2 mid) le P0 (`US-E09-01`, `US-E10-02…07`) o `US-E12-01` risultano a rischio DoD | **Drop** `US-E10-08` immediatamente |
| Capacità residua &lt; 0,5 giorno dopo checkpoint CP3 | **Drop** senza negoziazione mid-sprint ulteriore |
| Completata parzialmente | Non shippare “mezzo audit”: o Done completo o **carry-over Fase 2** con AC intatti |
| Impatto DoD MVP wedge | **Nessuno** — audit ticket (`US-E10-01`) già in S3 resta sufficiente per pilota |

**Owner drop decision:** Product / lead sprint in Daily async del giorno 8 o al CP3.

---

## Task ordinati (T4.x)

Stime t-shirt: **S** ≈ 0,5–1 giorno · **M** ≈ 1–2 giorni. Ordine = dipendenze (seed/policy → security/i18n → dashboard → NFR UX → obs/backup/GDPR → perf/stretch).

### Foundation dataset & policy

#### T4.1 — Script seed pilota 15×5 *(US-E10-04)* · **M**
- [x] Script idempotente (o documentato reset): ≥ **15 store**, **5 vendor**, asset, SLA policies, membership multi-ruolo (incluso `viewer_finance`), ticket multi-stato (open→verified + breached)
- [x] Credenziali QA **solo** locale/staging documentate (no secret in repo)
- [x] Verify: seed applicabile su Compose fresco; smoke login HQ/store/vendor/finance
- **Done quando:** pilota 15×5 riproducibile in &lt; 15 min wall-clock post-compose

#### T4.2 — Dataset stress opzionale + harness misura p95 *(US-E10-04, buffer)* · **S**
- [x] Flag/script stress ~**50 store × 5k ticket** (opzionale, non bloccante se tempo corto)
- [x] Procedura misura latenza lista HQ (p95) documentata (comando + ambiente)
- **Done quando:** si può ripetere la misura p95 su seed (minimo) e, se presente, su stress

#### T4.3 — Policy soft-delete unificata — documento *(US-E10-05)* · **S**
- [x] Creare `docs/ops/SOFT_DELETE.md`: elenco entità soft-deletable (Membership, Store, Vendor, Asset, SlaPolicy, Ticket raro, Attachment, Notification) vs immutabili (`TicketEvent`)
- [x] Regole restore: solo `admin_hq` / `owner`, stesso tenant
- [x] Store deleted → niente nuovi ticket; asset deleted nascosti da autocomplete; membership disabled ≠ hard delete User
- [x] GC oggetti SeaweedFS: soft-delete allegato non elimina subito oggetto (rinvio a job opz.)
- **Done quando:** doc reviewato e linkato da BACKLOG / ops index

#### T4.4 — Allineamento comportamento soft-delete vs policy *(US-E10-05)* · **M**
- [x] Gap analysis codice vs `SOFT_DELETE.md`; chiudere gap critici (store/asset/membership)
- [x] Test: restore deny cross-tenant; store soft-deleted blocca create ticket
- **Done quando:** AC soft-delete verificati; nessun comportamento “hard delete silenzioso” su entità soft

### i18n & security (prima delle superfici nuove)

#### T4.5 — Catalogo i18n `it` (+ stub `en`) *(US-E10-06)* · **M**
- [x] Scaffold catalogo stringhe UI; locale default **`it`**
- [x] Stub `en` con chiavi presenti (traduzione completa non obbligatoria)
- [x] Convenzione: nessuna stringa user-facing hardcoded sulle **nuove** superfici S4 (dashboard, empty states, export, settings retention)
- [x] Migrazione progressiva stringhe esistenti toccate da S4 (non big-bang tutto il prodotto)
- **Done quando:** dashboard + messaggi NFR S4 passano dal catalogo `it`

#### T4.6 — Security headers middleware *(US-E10-07)* · **S**
- [x] Headers: CSP basica, `X-Frame-Options` deny (o equivalente), `X-Content-Type-Options: nosniff`
- [x] Documentare eccezioni necessarie (es. Mailpit solo dev) senza indebolire prod
- **Done quando:** headers verificabili su risposta app (smoke curl / DevTools)

#### T4.7 — Rate limit auth + intake deep-link *(US-E10-07)* · **M**
- [x] Rate limit su mutation pubbliche / intake deep-link e endpoint auth (brute-force mitigation)
- [x] Comportamento IT chiaro su 429; log con request id
- [x] Signed URL TTL documentato; allowlist MIME (jpeg/png/webp) re-testata
- [x] Checklist security nel verify report delle slice sensibili
- **Done quando:** AC security baseline coperte; test smoke rate limit + MIME deny

### Dashboard HQ + finance

#### T4.8 — Aggregazioni dominio: aperti, breached, a rischio *(US-E09-01)* · **M**
- [x] Definizione formale “a rischio” (es. due entro finestra / priorità) documentata in glossario breve dello sprint
- [x] Query/servizio aggregati filtrati obbligatoriamente per `tenantId`
- [x] Range default **30 giorni**
- [x] Test unit/integration su conteggi con seed
- **Done quando:** KPI card corretti su seed noto

#### T4.9 — MTTR grezzo (verified) + costi periodo *(US-E09-01)* · **M**
- [x] **MTTR grezzo:** media tempi su ticket `verified` (definizione timestamp start→verified esplicitata; niente AI)
- [x] **Costi periodo:** somma `actual_cost` nel range; breakdown **per store**
- [x] Empty state dashboard → CTA onboarding / ticket di prova (stringhe da catalogo `it`)
- [x] Nessun chatbot / suggerimento AI
- **Done quando:** numeri riconciliabili manualmente sul seed; empty state OK su tenant vuoto

#### T4.10 — UI Dashboard HQ + RBAC `viewer_finance` *(US-E09-01)* · **M**
- [x] Pagina overview HQ (IT): KPI + tabella/breakdown store
- [x] Ruoli HQ (`owner`, `admin_hq`, `ops_coordinator`): accesso aggregati + navigazione operativa esistente
- [x] **`viewer_finance`:** read-only aggregati + lista ticket **chiusi/verificati**; **nessuna mutation**; **niente note interne**
- [x] Test deny: POST/PATCH/DELETE rifiutati per `viewer_finance`
- **Done quando:** AC `viewer_finance` + dashboard soddisfatti end-to-end

### UX NFR / a11y

#### T4.11 — Pattern empty / loading / error unificati *(US-E10-02)* · **M**
- [x] Pattern su liste/dettagli store, HQ, vendor (distingui first-use vs no-results vs errore)
- [x] Status messages accessibili (live region / `role="status"` dove appropriato — WCAG 4.1.3)
- [x] Copy IT dal catalogo i18n
- **Done quando:** superfici principali non mostrano schermate bianche / errori grezzi

#### T4.12 — WCAG 2.1 AA + mobile 390px *(US-E10-02)* · **M**
- [x] Audit mirato flussi **store** e **HQ** principali (contrasto, focus, label, errori in testo)
- [x] Create-ticket + aggiornamento stato vendor usabili a **390px**
- [x] Checklist a11y nel verify report della slice
- **Done quando:** target AA sui flussi dichiarati; mobile OK senza scroll orizzontale bloccante

### Osservabilità, backup, GDPR

#### T4.13 — Log JSON + request id *(US-E10-03)* · **S**
- [x] Log strutturati JSON con `requestId` correlabile app↔worker
- [x] Errori applicativi loggati senza PII inutili
- **Done quando:** da un request id si ricostruisce il path in log locali

#### T4.14 — Profile Compose `observe` + GlitchTip opzionale *(US-E10-03)* · **S**
- [x] Profile `observe` documentato in ops (GlitchTip self-host e/o Loki — **non** Sentry Cloud)
- [x] Default MVP: log-only; GlitchTip **opzionale** e non richiesto per Exit MVP
- **Done quando:** `compose --profile observe` documentato; zero dipendenza cloud a pagamento

#### T4.15 — Backup Postgres `pg_dump` + runbook 1-pager *(US-E10-03)* · **M**
- [x] Script dump (preferire formato custom `-Fc`) + schedule cron host esempio
- [x] Runbook 1-pager: dump → verifica integrità → retention → **restore drill** su DB scratch
- [x] Policy retention oggetti SeaweedFS documentata (allineata a soft-delete / GDPR)
- [x] Riconciliare retention backup vs retention dati prodotto (24 mesi verified)
- **Done quando:** un restore di prova eseguito almeno una volta in staging/local e annotato nel runbook

#### T4.16 — Export GDPR tenant JSON/CSV *(US-E12-01)* · **M**
- [x] Export entità core (tenant-scoped) in JSON e/o CSV; solo `owner` / `admin_hq` (`RBAC.md`)
- [x] Settings: regione **EU** / self-host dichiarata
- [x] Retention documentata (default **24 mesi** su verified); hook job **pg-boss** (skeleton o job reale se capacità)
- [x] Isolamento: impossibile esportare altro tenant
- **Done quando:** export scaricabile su seed; retention descritta in settings/docs

### Perf, buffer, stretch

#### T4.17 — Indici & tuning lista/dashboard HQ *(buffer + US-E04-04 / exit)* · **M**
- [x] Revisione indici su filtri lista HQ e aggregati (tenantId, status, slaDueAt, storeId, verifiedAt, …)
- [x] Misura p95 lista HQ su seed pilota; target **&lt; 300 ms**
- [x] Se fail: indici / pagination / select stretti — niente cache SaaS
- **Done quando:** p95 &lt; 300 ms documentato nel verify report exit

#### T4.18 — Buffer bugfix regressioni S1–S3 *(buffer)* · **S–M** (capacità residua)
- [x] Triage bug bloccanti pilota (auth, ticket, SLA, vendor, allegati)
- [x] Max scope: fix mirati + test; no rewrite
- **Done quando:** nessun P0 aperto noto sul percorso pilota, oppure elenco esplicito in Exit notes

#### T4.19 — Stretch: audit config membership/ruoli *(US-E10-08)* · **M** · **DROPPED → F2-09** (2026-10-29)
- [ ] Eventi append-only su cambio ruolo / membership / soft-disable (oltre `TicketEvent`) — **F2-09**
- [ ] Visibili solo a `owner` / `admin_hq` — **F2-09**
- [x] Applicare **regola drop** se a rischio P0
- **Done quando:** AC completi **oppure** story spostata Fase 2 con nota in BACKLOG ✅

#### T4.20 — Chiusura sprint + checklist rilascio MVP *(meta)* · **S**
- [x] Spuntare AC in `BACKLOG.md`; retro `docs/product/retros/S4-YYYY-MM-DD.md`
- [x] Completare Exit criteria + MVP release checklist (sotto)
- [x] Carry-over Fase 2 aggiornato
- **Done quando:** artefatti Scrum S4 chiusi

---

### Riepilogo task

| ID | Story | Size | Stretch? |
|----|-------|------|----------|
| T4.1 | US-E10-04 | M | |
| T4.2 | US-E10-04 / buffer | S | |
| T4.3 | US-E10-05 | S | |
| T4.4 | US-E10-05 | M | |
| T4.5 | US-E10-06 | M | |
| T4.6 | US-E10-07 | S | |
| T4.7 | US-E10-07 | M | |
| T4.8 | US-E09-01 | M | |
| T4.9 | US-E09-01 | M | |
| T4.10 | US-E09-01 | M | |
| T4.11 | US-E10-02 | M | |
| T4.12 | US-E10-02 | M | |
| T4.13 | US-E10-03 | S | |
| T4.14 | US-E10-03 | S | |
| T4.15 | US-E10-03 | M | |
| T4.16 | US-E12-01 | M | |
| T4.17 | buffer / perf | M | |
| T4.18 | buffer bugfix | S–M | |
| T4.19 | US-E10-08 | M | **sì** |
| T4.20 | meta chiusura | S | |

**Totale task:** **20** (di cui 1 stretch droppable).

---

## Checkpoints

| CP | Quando | Gate | Se FAIL |
|----|--------|------|---------|
| **CP1** | Fine giorno 3 (W1) | Seed 15×5 (T4.1) + `SOFT_DELETE.md` (T4.3) + i18n scaffold avviato (T4.5) | Bloccare UI dashboard finché seed non riproducibile; ripianificare T4.2 |
| **CP2** | Fine W1 (giorno 5) | Security headers + rate limit (T4.6–7); aggregati MTTR/costi green su test (T4.8–9); soft-delete allineato (T4.4) | Tagliare polish a11y non critico; proteggere T4.10 |
| **CP3** | Giorno 8 (W2 mid) | Dashboard + `viewer_finance` (T4.10); empty/loading/error (T4.11); avvio backup runbook (T4.15) | **Drop US-E10-08** (T4.19); ridurre stress dataset; focus p95 + GDPR export |
| **CP4** | Giorno 10 (exit) | p95 &lt; 300 ms (T4.17); backup restore drill (T4.15); export GDPR (T4.16); a11y mobile (T4.12); zero SaaS | Non dichiarare MVP Done; elenco gap in Exit notes + carry-over |

---

## Piano settimane

### Settimana 1 — “Dati fidati + harden base + KPI”

| Giorno | Focus |
|--------|--------|
| 1–2 | T4.1 seed · T4.3 policy soft-delete · avvio T4.5 i18n |
| 3 | **CP1** · T4.4 soft-delete code · T4.6 headers |
| 4–5 | T4.7 rate limit · T4.8–T4.9 aggregati MTTR/costi · **CP2** |

### Settimana 2 — “HQ UI + NFR + exit pilota”

| Giorno | Focus |
|--------|--------|
| 6–7 | T4.10 dashboard + `viewer_finance` · T4.11 pattern UX · T4.13 log |
| 8 | T4.15 backup runbook · T4.14 GlitchTip opz. · **CP3** + decisione drop T4.19 |
| 9 | T4.16 GDPR export · T4.12 a11y/mobile · T4.17 indici/p95 |
| 10 | T4.18 bugfix buffer · T4.2 stress se residuo · T4.20 chiusura · **CP4 / Exit** |

---

## Exit criteria (Increment S4 = candidatura rilascio MVP)

Uno-liner: **pilota 15×5 usabile, p95 lista HQ &lt; 300 ms, backup `pg_dump` verificato, zero SaaS a pagamento.**

Checklist:

- [x] Seed pilota **15 store × 5 vendor** usabile end-to-end (Flussi A/B già S3 + dashboard S4)
- [x] Dashboard HQ: aperti, breached, a rischio, **MTTR grezzo (verified)**, **costi periodo** + breakdown store (30g)
- [x] `viewer_finance` read-only conforme `RBAC.md`
- [x] p95 **lista HQ &lt; 300 ms** su seed (misura allegata al verify report)
- [x] Runbook backup Postgres (`pg_dump`) + almeno un restore drill annotato
- [x] Policy SeaweedFS / soft-delete documentate
- [x] Export GDPR tenant + retention dichiarata (24 mesi verified) + regione EU
- [x] Security headers + rate limit su auth/intake
- [x] Catalogo i18n `it` sulle superfici S4
- [x] a11y AA flussi store/HQ principali; create-ticket + vendor status OK a 390px
- [x] **Zero** componente SaaS a pagamento nel path critico; GlitchTip solo self-host opzionale
- [x] `US-E10-08` Done **oppure** droppata esplicitamente verso Fase 2

---

## Carry-over → Fase 2

| Item | Origine | Nota |
|------|---------|------|
| Audit config membership/ruoli | **US-E10-08** se droppata | Eventi append-only ruoli; solo owner/admin_hq |
| Email-to-ticket SMTP inbound | US-E11-02 (già stretch S2) | No vendor SaaS inbound |
| Export contabile CSV avanzato | F2-05 | Oltre export GDPR base |
| Scorecard vendor / preventivi / PM calendar | F2-02…04 | Fuori wedge |
| Intake chat-like avanzato | F2-01 | No WhatsApp Cloud API a pagamento |
| PWA offline-light | F2-06 | — |
| AI assist (classify / suggest / summarize) | F2-07 | **Ollama** + human-confirm; mai SoR |
| PITR / backup fisico avanzato | Ops post-MVP | MVP = `pg_dump` logical + drill |
| Traduzione `en` completa | US-E10-06 stub | Catalogo chiavi già presenti |
| GC job oggetti SeaweedFS | Soft-delete policy | Opzionale post-pilota |
| Dataset stress 50×5k continuo in CI | T4.2 | Se non automatizzato in S4 |

---

## MVP release checklist (fine S4)

### Prodotto / accettazione

- [x] Wedge: intake + ticket/SLA/dispatch + costi per store dimostrabile su pilota 15×5
- [x] Flussi A (→ verified) e B (breach idempotente) green da S3; C onboarding &lt; 15 min ancora valido
- [x] Dashboard HQ + `viewer_finance` accettati da buyer Ops/Facility
- [x] UI italiana; empty/loading/error sui path critici
- [x] Nessuna feature fuori backlog introdotta “di nascosto”

### Tecnico / OSS

- [x] Compose: `app`, `worker`, `postgres`, `seaweedfs` healthy; Mailpit solo `dev`
- [x] Auth.js + Postgres; Prisma unico ORM; pg-boss per job; SeaweedFS signed URL
- [x] Audit ticket immutabile; soft-delete policy pubblicata
- [x] Security baseline (headers, rate limit, MIME allowlist, TTL signed URL)
- [x] Backup runbook + restore drill; retention GDPR documentata
- [x] Inventario dipendenze: **nessun** SaaS a pagamento obbligatorio
- [x] Profile `observe` (GlitchTip) opzionale e documentato come non-blocking

### Processo

- [x] Tutte le story P0 S4 Done; stretch annotate (done/drop)
- [x] `BACKLOG.md` spuntato; retro S4 scritta
- [x] Verify report exit con p95 + health stack + smoke pilota
- [ ] Branch: merge verso `develop`; rilascio via `release/x.y.z` → `main` (GitFlow)
- [x] Credenziali QA seed **non** in produzione; `.env.example` senza secret

### Go / No-go pilota

| Criterio | Go se… |
|----------|--------|
| Usabilità | Store apre ticket + vendor chiude + store verifica + HQ vede KPI/costi |
| Perf | p95 lista HQ &lt; 300 ms su seed |
| Affidabilità | Backup restore drill OK; breach job ancora idempotente |
| Compliance base | Export GDPR + EU self-host dichiarati; soft-delete chiaro |
| Costo stack | Zero abbonamenti SaaS obbligatori |

**No-go** se manca uno tra: seed 15×5, dashboard/MTTR affidabile, p95, backup drill, isolamento tenant su export/dashboard.

---

## Riferimenti rapidi

| Artefatto | Path |
|-----------|------|
| Product Backlog | `docs/product/BACKLOG.md` |
| Stack OSS | `docs/product/STACK.md` |
| RBAC | `docs/product/RBAC.md` |
| DoD | `docs/product/sprints/DEFINITION_OF_DONE.md` |
| Soft-delete (da produrre) | `docs/ops/SOFT_DELETE.md` |
| Backup runbook (da produrre) | `docs/ops/` (1-pager `pg_dump`) |
| Retro S4 (a fine sprint) | `docs/product/retros/S4-YYYY-MM-DD.md` |

---

*Documento di planning — nessuna implementazione implicita. Aggiornare checkbox task durante lo sprint.*
