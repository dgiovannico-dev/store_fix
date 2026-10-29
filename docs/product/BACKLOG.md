# FacilityFlow Retail — Product Backlog & Sprint Roadmap (OSS-only)

> **Stato:** **v4 exploded + production-ready planning** — backlog esploso (Epic→US→TK); open decisions **locked**; S5/E14 in planning.  
> **Backlog esploso (indice):** [`backlog/README.md`](./backlog/README.md) — gerarchia, convenzioni ID, file E00–E14, selezione TK.  
> **Gate codice:** approvazione umana esplicita + lavoro su branch `develop` / `feature/*` (non commit diretti su `main`).  
> **Vincolo hard:** stack **100% open source / self-host**, nessun componente SaaS a pagamento. Dettaglio: [`STACK.md`](./STACK.md).  
> **RBAC:** [`RBAC.md`](./RBAC.md).  
> **Scope:** MVP (Fase 1) + production-ready (**E14 / S5**). **Fase 2 Done** (F2-01…F2-09, 2026-10-29). **Fase 3 = draft** (sotto; gate VPS).  
> **Lingua UI MVP:** italiano. Mercato: Italia / EUR.  
> **Go prod:** NO-GO finché VPS — [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) · [`../ops/NEXT_VPS.md`](../ops/NEXT_VPS.md).  
> **Integrazione:** GitFlow **senza PR** — push su `develop`; `main` solo via `release/*` / `hotfix/*`.

---

## Analysis Card (v3 — completezza backlog)

- **Assunzioni:** wedge invariato; v3 chiude gap di story-level (Membership, Flussi A/B/C, Attachment/Notification, RBAC artifact, seed, i18n, security).
- **Ricerca:** audit interno vs brief MVP 1–10 + flussi + NFR + modello dati; stack OSS già in `STACK.md`.
- **Scelta di design:** epic **E13** per acceptance E2E (senza feature nuove); `RBAC.md` come artefatto; soft-delete/i18n/security in E10.
- **AI:** F2-07 Done (Ollama opz. + human-confirm); non in DoD MVP.
- **Rischi:** S1 ancora XL; `US-E10-08` stretch droppable; email-to-ticket solo F2-08.

---

## Comprensione prodotto (validata)

| Elemento | Lettura |
|----------|---------|
| **Cosa** | SoR multi-tenant manutenzione retail/franchise mid-market (10–50 PV) |
| **Wedge** | Intake leggero + ticket/SLA/dispatch vendor + costi per store |
| **Buyer** | Ops / Facility Manager HQ |
| **Successo MVP** | Pilota 15 store / 5 vendor, Flussi A–C, stack Compose OSS healthy |
| **Fuori scope** | WhatsApp Business API a pagamento, CMMS enterprise, pagamenti/escrow, **billing/abbonamenti SaaS**, marketplace, ERP, multi-paese, AI chatbot sostitutivo ops, app native, **qualsiasi SaaS a pagamento nel path critico** |

### Stack OSS bloccato (prima dello scaffold)

| Area | Scelta | Note |
|------|--------|------|
| UI | Next.js App Router + TS + Tailwind + shadcn/ui | OSS |
| Auth | **Auth.js + Postgres** | Clerk escluso |
| DB | **PostgreSQL** in Compose | Neon/Supabase Cloud esclusi |
| ORM | **Prisma** | uno solo |
| Allegati | **SeaweedFS** (S3 API) + signed URL | R2/S3/MinIO esclusi |
| Email | **Nodemailer** + **Mailpit** (dev) / SMTP self-host | Resend/Postmark esclusi |
| Jobs SLA | **pg-boss** + worker container | Inngest/Trigger cloud esclusi |
| Error/obs | Log JSON; opz. **GlitchTip** profile | Sentry Cloud escluso |
| AI (F2) | **Ollama** locale + human-confirm | API cloud non obbligatorie |

---

## Mappa Epics → MVP

| ID | Epic | Priorità | Sprint |
|----|------|----------|--------|
| **E00** | **Platform OSS: Compose, Postgres, SeaweedFS, Mailpit, worker** | P0 | **S1** |
| E01 | Foundation: tenancy, auth, RBAC | P0 | S1 |
| E02 | Onboarding rete (store, utenti, vendor) | P0 | S1 |
| E03 | Asset registry leggero | P0 | S1–S2 |
| E04 | Ticket lifecycle (web store + ops) | P0 | S2 |
| E05 | SLA, timer, breach, escalation (pg-boss) | P0 | S2–S3 |
| E06 | Vendor portal | P0 | S3 |
| E07 | Chiusura, verifica store, costi | P0 | S3 |
| E08 | Notifiche email + in-app | P0 | S3 |
| E09 | Dashboard HQ | P0 | S4 |
| E10 | Audit + soft-delete + NFR UX + backup | P0 | S4 |
| E11 | Intake “WhatsApp-like” (deep link, no WA API a pagamento) | P0 | S2 |
| E12 | GDPR base (export/retention) | P1 | S4 |
| E13 | Flussi E2E A/B/C (acceptance verticali) | P0 | S1–S3 |
| **E14** | **Production-ready (harden, ops, exit pilota)** | **P0/P1** | **S5** |
| — | Fase 2 | Deferred | post-MVP |

---

## Modello dati concettuale (MVP)

| Entità | Campi minimi | Soft delete |
|--------|--------------|-------------|
| `Tenant` | id, name, slug, region=`EU`, createdAt | no (disattiva flag) |
| `User` | id, email, name, passwordHash?, emailVerifiedAt | no |
| `Membership` | id, tenantId, userId, role, storeIds[] (null = HQ all-stores), vendorId? | sì |
| `Store` | id, tenantId, name, address, city, zip, timezone, contacts | sì |
| `Vendor` | id, tenantId, name, email, phone, trades[], storeCoverageIds[] | sì |
| `Asset` | id, tenantId, storeId, category, label, brandModel?, location?, notes?, preferredVendorId? | sì |
| `SlaPolicy` | id, tenantId, category, priority, resolutionHours | sì |
| `Ticket` | id, tenantId, storeId, assetId?, category, priority, status, description, vendorId?, slaDueAt, slaBreachedAt?, estimatedCost?, actualCost?, timestamps per stato | sì (raro) |
| `TicketEvent` | id, tenantId, ticketId, actorUserId, type, fromStatus?, toStatus?, meta JSON, createdAt | **no** (immutabile) |
| `Attachment` | id, tenantId, ticketId, storageKey, mime, sizeBytes, uploadedByUserId, createdAt | sì |
| `Notification` | id, tenantId, userId, type, ticketId?, payload JSON, readAt?, createdAt | sì |
| Infra (non dominio prodotto) | Auth.js Session/Account, InviteToken, EmailOutbox via pg-boss | — |

Tutte le query dominio: filtro obbligatorio `tenantId`.

---

## E00 — Platform OSS (Compose)

### US-E00-01 — Docker Compose core
**Come** developer, **voglio** uno stack Compose avviabile con un comando, **così** sviluppo e verify post-dev sono riproducibili.

**AC**
- [x] `docker compose up -d --build` avvia: `app`, `worker`, `postgres`, `seaweedfs` (S3), `mailpit` (profile `dev`)
- [x] Healthcheck su postgres + app `/api/health`
- [x] `.env.example` senza secret reali; nessun servizio SaaS obbligatorio
- [x] Documentazione IT in `docs/ops/COMPOSE.md` (porte, credenziali local, reset volumi)
- [x] `post-dev-verify`: relaunch compose obbligatorio dopo slice che toccano infra/app

### US-E00-02 — Object storage SeaweedFS
**AC**
- [x] Bucket allegati creato all’avvio (script init)
- [x] Upload/download via API S3-compatible; URL firmati a scadenza
- [x] Nessun file binario in Postgres
- [x] Test: upload foto ticket &lt; 10MB, MIME allowlist

### US-E00-03 — Outbox email + Mailpit
**AC**
- [x] Provider SMTP configurabile (default Mailpit in dev)
- [x] UI Mailpit raggiungibile in locale per QA
- [x] Template email HTML/testo in italiano (nuova, assign, breach, done, verified)
- [x] Nessuna dipendenza Resend/Postmark

### US-E00-04 — Worker pg-boss
**AC**
- [x] Processo `worker` consuma job: `sla.check_breaches`, `email.send`, (opz.) `gdpr.purge`
- [x] Retry con backoff; job falliti ispezionabili (log + tabella pg-boss)
- [x] Idempotenza su notifiche breach (un evento breach per ticket finché non resolved)

### US-E00-05 — Prisma schema baseline + migrazioni
**AC**
- [x] Schema Prisma copre tutte le entità della sezione “Modello dati”
- [x] Migrazione iniziale applicabile da zero su Postgres Compose
- [x] Seed minimo opzionale (tenant demo) documentato; seed pilota completo = `US-E10-04`

---

## E01 — Foundation: tenancy, auth, RBAC

### US-E01-01 — Signup HQ / creazione tenant
**Come** owner, **voglio** registrarmi e creare il tenant isolato.

**AC**
- [x] Signup email/password (Auth.js Credentials) + conferma email via SMTP/Mailpit
- [x] Magic link opzionale (Auth.js Email provider → stesso SMTP) — documentato in AUTH.md; non abilitato di default
- [x] Nasce `Tenant` + membership `owner`
- [x] Redirect a onboarding guidato
- [x] Isolamento: utente tenant A non legge dati tenant B (test)

### US-E01-02 — Login / logout / sessione
**AC**
- [x] Sessione DB-backed (Auth.js + Postgres adapter)
- [x] Cookie httpOnly; CSRF-safe sulle mutation
- [x] Logout invalida sessione
- [x] Rate limit login/signup (middleware o libreria OSS)

### US-E01-03 — Inviti e ruoli RBAC
**Ruoli MVP:** `owner`, `admin_hq`, `ops_coordinator`, `store_manager`, `store_staff`, `vendor`, `viewer_finance`.

**AC**
- [x] Invite email con token a scadenza
- [x] Ruolo assegnabile/modificabile da admin
- [x] API/UI gated per ruolo; `store_*` limitati agli store membership; `vendor` solo ticket del proprio vendor
- [x] Nessun IdP SaaS obbligatorio

### US-E01-04 — Isolamento multi-tenant
**AC**
- [x] Helper data-layer forza `tenant_id` su ogni query
- [x] Soft delete non cross-tenant
- [x] Test automatici isolamento su store/ticket/asset

### US-E01-05 — Matrice RBAC come artefatto + test
**AC**
- [x] Matrice in [`docs/product/RBAC.md`](./RBAC.md) allineata ai ruoli MVP
- [x] Smoke test deny/allow per azioni critiche (apri ticket, assign, verify, costi, dashboard)
- [x] `viewer_finance` solo read su costi/aggregati; nessuna mutation

### US-E01-06 — Reset password
**AC**
- [x] Flusso “password dimenticata” via email (Mailpit in dev)
- [x] Token a scadenza + rate limit
- [x] Reset invalida sessioni esistenti dell’utente

---

## E02 — Onboarding rete

### US-E02-01 — CRUD Store
**AC**
- [x] Campi: nome, indirizzo, CAP, città, timezone default `Europe/Rome`, contatti
- [x] Soft delete; store deleted non accettano nuovi ticket (guard data-layer; enforce ticket = S2)
- [x] Empty state CTA “Aggiungi il primo punto vendita”

### US-E02-02 — Import CSV store
**AC**
- [x] Template CSV IT scaricabile
- [x] Validazione riga-per-riga + report errori
- [x] Max ~200 righe/upload + rate limit

### US-E02-03 — CRUD Vendor + coverage
**AC**
- [x] Ragione sociale, email, telefono, categorie/trades, coverage store
- [x] Invite utente `vendor` collegato
- [x] Preferred vendor usabile in triage (campo pronto; UI triage = S2)

### US-E02-04 — Checklist “primo ticket in 15 min”
**AC**
- [x] Step: 1 store → 1 vendor → SLA default → invita store manager → ticket prova (skip S1)
- [x] Progress persistito; skip con warning in dashboard
- [x] Misura E2E formalizzata in `US-E13-03` (Flusso C) — soft `docs/qa/flusso-c-s1.md`

### US-E02-05 — Membership user ↔ store / vendor
**Come** `admin_hq`, **voglio** collegare utenti a store (o a un vendor), **così** lo scope RBAC è corretto.

**AC**
- [x] `Membership`: `tenantId`, `userId`, `role`, `storeIds[]` (vuoto/null = scope HQ), `vendorId` obbligatorio se role=`vendor`
- [x] Invite crea Membership; modifica storeIds senza ricreare utente
- [x] `store_manager`/`store_staff` non vedono ticket/asset di altri store
- [x] Soft-disable membership → accesso immediato bloccato
- [x] Test: membership store A non legge store B

---

## E03 — Asset registry leggero

### US-E03-01 — CRUD Asset per store
**AC**
- [x] Tipo/categoria (HVAC, frigo, casse, illuminazione, porte, altro), marca/modello, ubicazione, note, preferred_vendor
- [x] Soft delete; ticket storici restano collegati
- [x] Serial/barcode opzionali

### US-E03-02 — Asset opzionale in ticket
**AC**
- [x] Autocomplete asset dello store
- [x] Se preferred_vendor presente → suggerito in triage (non auto-assign MVP)

---

## E04 — Ticket lifecycle

### US-E04-01 — Creazione ticket web (store, phone-first)
**AC**
- [x] Categoria, urgenza (`critical`/`high`/`normal`/`low`), descrizione, foto 1–n (SeaweedFS), asset opzionale
- [x] Stato iniziale `open`; conferma con ID ticket
- [x] Empty/loading/error completi; viewport 390px

### US-E04-02 — Triage e assegnazione (ops)
**AC**
- [x] `open` → `triaged` → `assigned` (vendor obbligatorio su assigned)
- [x] Note interne (solo HQ) vs note vendor
- [x] Priorità modificabile

### US-E04-03 — State machine
**Stati:** `open` → `triaged` → `assigned` → `in_progress` → `waiting_parts` → `done` → `verified` | `cancelled`

**AC**
- [x] Transizioni illegali rifiutate server-side
- [x] Matrice permessi per ruolo (vedi `RBAC.md` + `US-E01-05`)
- [x] Timestamp ingresso stato
- [x] `cancelled`: solo `owner` / `admin_hq` / `ops_coordinator`; motivo obbligatorio; `TicketEvent`; email a store (+ vendor se già assigned)

### US-E04-04 — Liste e dettaglio
**AC**
- [x] Filtri: stato, store, vendor, priorità, SLA risk, date
- [x] Timeline eventi + allegati + costi + SLA due
- [x] Indici DB; target p95 lista HQ &lt; 300ms su seed pilota (`US-E10-04`)

### US-E04-05 — Entità Attachment
**AC**
- [x] Record `Attachment` per ogni upload (ticketId, storageKey, mime, sizeBytes, uploadedBy)
- [x] Signed GET a scadenza; MIME allowlist (jpeg/png/webp); max 10MB
- [x] Soft-delete allegato non elimina subito oggetto (policy documentata; GC opz. job)
- [x] Vendor/store caricano solo su ticket nel proprio scope

---

## E05 — SLA (pg-boss)

### US-E05-01 — Template SLA
**AC**
- [x] `SlaPolicy`: categoria + priorità → ore risoluzione
- [x] **Clock start da `open`** (decisione default)
- [x] Seed IT: frigo critico 4h, HVAC 24h, non critico 72h
- [x] Change policy non ricalcola ticket già aperti

### US-E05-02 — Timer, breach, escalation
**AC**
- [x] `sla_due_at` a creazione (timezone store)
- [x] Job ricorrente pg-boss marca breach + notifica ops (idempotente)
- [x] Badge: ok / a rischio (&lt;20% rimanente) / breached
- [x] Ops: rilancio (nota + re-notify) o riassegnazione

---

## E06 — Vendor portal

### US-E06-01 — Inbox vendor
**AC**
- [x] Solo ticket assegnati al proprio vendor/tenant
- [x] Liste: da fare / in corso / chiusi
- [x] Dettaglio: indirizzo store, contatto, asset, foto, SLA due
- [x] UI usabile su viewport mobile (~390px) per aggiornamento stato in campo

### US-E06-02 — Stato + chiusura lavoro
**AC**
- [x] `assigned`→`in_progress`→`waiting_parts`→`done`
- [x] Su `done`: ≥1 foto SeaweedFS, `actual_cost` EUR obbligatorio, report testo; `estimated_cost` opzionale
- [x] Email ops + store su `done`

---

## E07 — Chiusura, verifica, costi

### US-E07-01 — Verifica store
**AC**
- [x] `done` → `verified` solo store membership dello store
- [x] Rifiuto → `in_progress` + motivo; notifica vendor/ops
- [x] `verified`: campi chiave immutabili; note append-only

### US-E07-02 — Costi per store
**AC**
- [x] `estimated_cost`, `actual_cost` EUR su ticket (scope vendor in chiusura; immutabili post-`verified`)
- [x] `viewer_finance` read-only su chiusi/verificati
- [x] Aggregazioni costi/MTTR per store = **US-E09-01** (S4), non duplicate qui

---

## E08 — Notifiche

### US-E08-01 — Email transazionali (SMTP OSS)
Eventi: nuovo ticket, assign, breach SLA, done, verified/rifiuto.

**AC**
- [x] Template IT; invio via worker/outbox (nuovo/assign/cancel; breach/done/verified = S3)
- [x] Idempotenza anti-spam
- [x] QA via Mailpit in dev

### US-E08-02 — In-app bell
**AC**
- [x] Unread count, mark read, deep link ticket

### US-E08-03 — Modello Notification + destinatari
**AC**
- [x] Entità `Notification` (userId, type, ticketId?, payload, readAt)
- [x] Regole destinatari documentate: nuovo→ops; assign→vendor; breach→ops; done→ops+store; verified/reject→ops+vendor
- [x] Creazione in-app + enqueue email atomici rispetto all’evento dominio (o outbox pattern)
- [x] Email outbox distinta da Notification UI (pg-boss `email.send`)

---

## E09 — Dashboard HQ

### US-E09-01 — Overview operativa
**AC**
- [x] Aperti, breached, a rischio, MTTR grezzo (verified), costi periodo (`actual_cost`)
- [x] Breakdown per store; range default 30g
- [x] Empty state → onboarding / ticket prova
- [x] `viewer_finance`: accesso read-only aggregati + lista ticket chiusi/verificati; nessuna mutation; niente note interne
- [x] Nessun AI chatbot

---

## E10 — Audit & NFR

### US-E10-01 — Audit immutabile (ticket)
**AC**
- [x] `TicketEvent`: actor, from/to status, assignment, timestamp, metadata
- [x] Timeline UI; API non permette update/delete eventi

### US-E10-02 — Empty / loading / error + a11y + mobile
**AC**
- [x] Pattern completi su liste/dettagli (store, HQ, vendor)
- [x] Target WCAG 2.1 AA flussi store/HQ principali
- [x] Create-ticket + vendor status update OK a 390px

### US-E10-03 — Osservabilità + backup OSS
**AC**
- [x] Log JSON con request id
- [x] Error tracking: log + opz. GlitchTip (profile `observe`) — **non** Sentry Cloud
- [x] Backup Postgres giornaliero (script `pg_dump` + cron host) + runbook 1-pager
- [x] Backup/retention policy oggetti SeaweedFS documentata

### US-E10-04 — Seed pilota & dataset perf
**AC**
- [x] Script seed: ≥15 store, 5 vendor, ticket multi-stato, asset, SLA policies, membership
- [x] Credenziali QA documentate (solo ambiente locale/staging)
- [x] Dataset stress opzionale ~50 store × 100 ticket (default `db:seed:stress`) p95 ~4 ms; full 5k via `STRESS_TICKETS=5000` ancora opz.
- [x] Usato come exit criterion S4

### US-E10-05 — Policy soft-delete unificata
**AC**
- [x] Elenco entità soft-deletable + regole restore (solo admin_hq/owner, stesso tenant)
- [x] Store deleted → blocca nuovi ticket (già E02); asset deleted nascosti da autocomplete
- [x] Membership disabled ≠ hard delete User
- [x] Documentato in `docs/ops/SOFT_DELETE.md`

### US-E10-06 — i18n scaffolding
**AC**
- [x] Catalogo stringhe UI con locale default `it`
- [x] Stub `en` opzionale (chiavi presenti, anche se non tradotte al 100%)
- [x] Nessuna stringa user-facing hardcoded nelle nuove superfici post-scaffolding

### US-E10-07 — Security baseline
**AC**
- [x] Security headers (CSP basica, frame deny, nosniff) via middleware Next
- [x] Rate limit su mutation pubbliche/intake deep-link e auth
- [x] Signed URL TTL documentato; allowlist MIME testata
- [x] Checklist security in verify report post-slice sensibili

### US-E10-08 — Audit config (membership/ruoli) — stretch P1
> **DROP S4 (2026-10-29):** portata a **F2-09** per regola T4.19 / CP3. DoD MVP invariato (`US-E10-01` audit ticket sufficiente).
**AC** (carry-over F2-09 — implementato 2026-10-29)
- [x] Eventi append-only su cambio ruolo / membership / soft-disable (oltre TicketEvent)
- [x] Visibili solo a owner/admin_hq
- [x] Se non entra in S4 → spostare Fase 2 senza bloccare DoD MVP wedge

---

## E11 — Intake WhatsApp-like (senza API a pagamento)

### US-E11-01 — Deep link “Segnala guasto”
**AC**
- [x] Link auth-gated (o token store rate-limited)
- [x] Copy IT: “invia questo link sul gruppo WhatsApp / home screen”
- [x] **Vietato** WhatsApp Business Cloud API in MVP (costo + non OSS)

> **Nota:** email-to-ticket (ex US-E11-02) è **solo Fase 2** (`F2-08`) — non fa parte del DoD MVP e non ha task sprint.

---

## E12 — GDPR base (P1)

### US-E12-01 — Export + retention
**AC**
- [x] Export tenant JSON/CSV entità core
- [x] Retention documentata (default 24 mesi verified); hook job pg-boss
- [x] Settings: regione EU / self-host dichiarata

---

## E13 — Flussi E2E (acceptance verticali)

> Questi story **non** aggiungono feature: chiudono i Flussi A/B/C del brief come AC di accettazione.

### US-E13-01 — Flusso A — Guasto critico store (E2E)
**Scenario:** “Frigo banco 2 non raffredda”, urgenza critical, 2 foto.

**AC**
- [x] Store apre ticket `open` con 2 allegati SeaweedFS
- [x] Ops riceve email + notification; triage → assign vendor refrigerazione; SLA 4h valorizzato
- [x] Vendor: email + inbox → `in_progress` → `done` (foto + `actual_cost`)
- [x] Store verifica → `verified`; dashboard riflette tempo/costo store
- [x] Gate intermedio S2: path fino a `assigned` + SLA due
- [x] Gate completo S3: fino a `verified`
- [x] 1 transizione illegale rifiutata; isolamento tenant verificato sul path

### US-E13-02 — Flusso B — Breach SLA
**AC**
- [x] Ticket con `sla_due_at` nel passato (o clock forzato in test)
- [x] Job pg-boss marca `slaBreachedAt` + badge breached
- [x] Notifica email + in-app a ops **una sola volta** (idempotenza)
- [x] Ops rilancia (nota + re-notify) **oppure** riassegna vendor
- [x] Gate S3

### US-E13-03 — Flusso C — Onboarding rete &lt;15 min
**AC**
- [x] Da tenant vuoto: CSV/crea store → invita store manager → 5 vendor (o ≥1 in dry-run) → SLA default
- [x] Primo ticket di prova entro **15 minuti** wall-clock (cronometrato in QA)
- [x] Checklist `US-E02-04` completabile senza SQL
- [x] Gate soft S1 (setup rete); gate hard S2 (ticket prova incluso)

---

## Dipendenze

```
E00 Platform OSS (Compose, SeaweedFS, Mailpit, pg-boss, Prisma schema)
 └── E01 Auth / tenancy / RBAC / reset / matrice
      └── E02 Onboarding + Membership
           ├── E03 Asset
           └── E11 Deep link
                └── E04 Ticket + Attachment
                     ├── E05 SLA (pg-boss)
                     ├── E06 Vendor portal
                     │     └── E07 Verify / costi
                     ├── E08 Notifiche (+ Notification model)
                     └── E09 Dashboard
 E10 Audit / NFR / seed / i18n / security   (trasversale; polish S4)
 E12 GDPR                                   (S4)
 E13 Flussi A/B/C                           (gate S1–S3, dipende da E02–E08)
```

---

## Sprint roadmap (2 settimane)

> **Sprint Backlog operativi (task-level):** [`sprints/README.md`](./sprints/README.md)  
> **DoD / DoR globale:** [`sprints/DEFINITION_OF_DONE.md`](./sprints/DEFINITION_OF_DONE.md)

### Definition of Done
- AC verificati su **Compose locale** (regola post-dev-verify)
- RBAC + `tenant_id` testati (matrice `RBAC.md`)
- UI IT; empty/loading/error sulla superficie toccata
- **Nessun** servizio a pagamento introdotto
- Nessuna feature Fase 2 / fuori scope
- Increment shippabile su `develop` (GitFlow)
- Flussi E13 del gate di sprint soddisfatti
- Checklist completa in `sprints/DEFINITION_OF_DONE.md`

### Sprint 1 — “Platform OSS + rete configurabile”
**Goal:** stack Compose healthy; HQ signup; membership; store/vendor; asset CRUD; Flusso C setup.

| Story | Note |
|-------|------|
| US-E00-01…05 | Compose, SeaweedFS, Mailpit, worker, Prisma schema |
| US-E01-01…06 | Auth.js, tenant, RBAC, matrice, reset password |
| US-E02-01…05 | Store CSV, vendor, checklist, **Membership** |
| US-E03-01 | Asset CRUD |
| US-E13-03 (soft) | Onboarding rete misurabile (senza ticket ancora ok) |

**Exit:** `compose up` verde; “1 store + 1 vendor + 1 store manager” via Membership; invite in Mailpit; RBAC.md + test smoke base.

### Sprint 2 — “Primo ticket E2E (fino ad assigned)”
**Goal:** store apre ticket + foto; ops triaga/assegna; SLA due; deep link; email; Flusso A parziale + C hard.

| Story | Note |
|-------|------|
| US-E04-01…05 | Lifecycle, cancel, liste, **Attachment** |
| US-E03-02 | Asset su ticket |
| US-E05-01 | Policy + `sla_due_at` |
| US-E11-01 | Deep link |
| US-E08-01 (parziale) + US-E08-03 (skeleton) | Email nuovo/assign + model Notification |
| US-E10-01 (parziale) | Eventi stato/assign |
| US-E13-01 (gate assigned) | Flusso A fino a `assigned` |
| US-E13-03 (hard) | Ticket prova &lt;15 min |

**Exit:** Flusso A → `assigned`; Flusso C &lt;15 min; allegati su SeaweedFS + row Attachment.

### Sprint 3 — “Vendor + verify + breach vivo”
**Goal:** portale vendor, chiusura con prove/costi, verify store, job breach, bell; Flussi A completo + B.

| Story | Note |
|-------|------|
| US-E06-01…02 | Vendor portal (mobile) |
| US-E07-01…02 | Verify + costi |
| US-E05-02 | Breach pg-boss |
| US-E08-01…03 | Email restanti + bell + Notification completa |
| US-E10-01 | Audit timeline completa |
| US-E13-01 (completo) | Flusso A → `verified` |
| US-E13-02 | Flusso B breach |

**Exit:** Flusso A → `verified`; Flusso B notifica ops idempotente.

### Sprint 4 — “HQ governa + harden OSS”
**Goal:** dashboard (+ finance), GDPR, a11y/perf, backup, seed, i18n, security baseline.

| Story | Note |
|-------|------|
| US-E09-01 | Dashboard + viewer_finance |
| US-E10-02…07 | UX NFR, obs/backup, **seed**, soft-delete, i18n, security |
| US-E12-01 | Export/retention |
| US-E10-08 | Stretch audit config (P1, droppable) |
| Buffer | Indici, bugfix |

**Exit:** pilota 15×5 usabile; p95 lista HQ &lt;300ms su seed; backup documentato; zero SaaS a pagamento.

---

## Stime (t-shirt, ~1–2 FTE)

| Sprint | Effort | Rischio |
|--------|--------|---------|
| S1 | **XL** | Compose + SeaweedFS + Auth.js membership |
| S2 | XL | State machine + signed URL S3 |
| S3 | L | pg-boss breach idempotente; UX vendor |
| S4 | M | MTTR corretto; AA; backup |

**Totale MVP:** ~8 settimane (4×2w). S1 più pesante del piano SaaS precedente per via di E00.

---

## Fase 2 (deferred) — ancora OSS-first

| ID | Epic | Nota costo |
|----|------|------------|
| F2-01 | Intake chat-like avanzato | Done 2026-10-29 — wizard chat-like su `/app/segnala/[storeId]` (no WA Cloud / no gateway) |
| F2-02 | Preventivi / accettazione costi | Done 2026-10-29 — `quoteStatus` + propose/accept/reject; gate done se pending |
| F2-03 | Scorecard vendor | Done 2026-10-29 — `/app/vendors/scorecard` + KPI su dettaglio (chiusi, giorni, SLA, costi, aperti) |
| F2-04 | Contratti + calendar PM | Done 2026-10-29 — v1 contratti + v2 `PlannedMaintenanceEvent` / `/app/calendario` (no RRULE) |
| F2-05 | Export contabile CSV | Done 2026-10-29 — `/api/exports/accounting` (EUR UTF-8) |
| F2-06 | PWA offline-light | Done 2026-10-29 — manifest + SW shell + `/offline` (no SoR offline) |
| F2-07 | AI assist (classify / suggest vendor / summarize) | Done 2026-10-29 — categoria + vendor (API+UI ops panel); human-confirm select; summarize stretch |
| F2-08 | Email-to-ticket SMTP inbound (ex US-E11-02) | Done 2026-10-29 — webhook `/api/inbound/email` + dedup Message-ID (IMAP poll opz. futuro) |
| F2-09 | Audit config membership/ruoli (ex US-E10-08 se droppata) | Done 2026-10-29 — `ConfigAuditEvent` + `/app/settings/audit` |

---

## Fase 3 (draft) — post-pilota / post-VPS

> **Gate soft:** F3-01 (VPS) resta tracking umano; **autopilot** può implementare F3-02…F3-08 in-repo in parallelo (OSS-only). WhatsApp Business Cloud API a pagamento resta **fuori scope**. Deploy prod solo dopo F3-01 GO.

| ID | Titolo | Priorità | AC (1 riga) | Dip. VPS GO |
|----|--------|----------|-------------|-------------|
| **F3-01** | Exit pilota produzione (chiusura gap E14/S5) | **P0** | HTTPS ACME, staging parity, migrate-on-deploy, DR remoto, smoke Flusso A UI, CI green `develop`, tag `v0.1.0` dry-run → **GO pilota** | **Sì** (prerequisito) |
| **F3-02** | Observability GlitchTip (`observe`) staging/prod | **P1** | Profile Compose `observe` su VPS **oppure** policy log-only firmata post-review | **Sì** |
| **F3-03** | AI riassunto note ticket (stretch F2-07) | **P1** | Done 2026-10-29 — `/api/ai/summarize-ticket` + pannello HQ sola lettura (heuristic/Ollama); no write SoR | No (Ollama opz.) |
| **F3-04** | Email-to-ticket IMAP poll (stretch F2-08) | **P1** | Done 2026-10-29 — coda `email.imap_poll` + imapflow/mailparser → `processInboundEmail`; Seen su ok/dup; skip se IMAP_* vuoto | No (env VPS) |
| **F3-05** | PM ricorrente RRULE (evoluzione F2-04) | **P1** | RRULE genera `PlannedMaintenanceEvent` + reminder pg-boss; calendario mostra serie | No |
| **F3-06** | Multi-lingua / multi-regione light | **P2** | `defaultLocale` IT+EN; date/valuta configurabili; niente rewrite i18n big-bang | No |
| **F3-07** | RFQ vendor interno (no marketplace) | **P2** | Ops richiede preventivi a N vendor del tenant; no escrow/billing/directory pubblica | No |
| **F3-08** | Push store (ntfy / webhook self-host) | **P2** | Eventi ticket → ntfy o webhook; **vietato** WA Cloud API | **Sì** |

---

## Open decisions — CHIUSE (default MVP)

| # | Decisione | Default locked |
|---|-----------|----------------|
| 1 | Auth | **Auth.js** + Postgres |
| 2 | SLA clock start | Da **`open`** |
| 3 | Verify reject | → **`in_progress`** + motivo |
| 4 | Vendor multi-insegna | **No** (vendor per-tenant) |
| 5 | SMTP | **Mailpit** in S1–S3; SMTP reale (profile `mail` o SMTP cliente) prima del pilota con email vere |
| 6 | Nome prodotto | **FacilityFlow Retail** (rinominabile dopo MVP) |
| 7 | ORM | **Prisma** (non Drizzle) |
| 8 | US-E10-08 | **Dropped S4 → F2-09** (`T4.19` / CP3, 2026-10-29); DoD MVP non bloccato |

Override solo con nota esplicita in chat + aggiornamento di questo file.

---

## Checklist completezza MVP (v4)

| Area brief | Copertura | Story chiave |
|------------|-----------|--------------|
| Auth & tenancy + invite + ruoli | ✅ | E01, E02-05 |
| Store CRUD + CSV | ✅ | E02-01/02 |
| Asset registry | ✅ | E03 |
| Ticket lifecycle + stati | ✅ | E04 |
| Intake WhatsApp-like (no WA API) | ✅ | E11-01 |
| SLA + breach + escalation | ✅ | E05 |
| Vendor portal | ✅ | E06 |
| Chiusura / verify / costi | ✅ | E07 |
| Dashboard HQ | ✅ | E09 |
| Email + bell | ✅ | E08 |
| Audit ticket | ✅ | E10-01 |
| Empty/loading/error + mobile | ✅ | E04-01, E10-02, E06-01 |
| Flussi A / B / C | ✅ | **E13** |
| Modello dati (11 entità) | ✅ | sezione + E00-05, E04-05, E08-03 |
| NFR: i18n, security, backup, perf, GDPR | ✅ | E10-04…07, E12, E04-04 |
| Stack OSS / Compose | ✅ | E00 + STACK.md |
| RBAC artifact | ✅ | E01-05 + RBAC.md |
| Seed pilota | ✅ | E10-04 |
| Billing / pagamenti | ✅ escluso | Fuori scope |
| Stretch droppable | ⚠️ solo | E10-08 (`T4.19`); E11-02 → F2-08 |
| Story → task sprint | ✅ | 47/47 MVP stories mappate (audit pre-dev) |
| Sprint backlogs S1–S4 | ✅ | ~100 task in `docs/product/sprints/` |
| Backlog esploso Epic→US→TK | ✅ | ~210 TK in [`backlog/`](./backlog/) |
| Production-ready E14 + S5 | 🟡 lab PASS / **NO-GO VPS** | Artefatti S5 + gap list [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| DoD / DoR | ✅ | `sprints/DEFINITION_OF_DONE.md` |

**Verdetto v4:** planning **completo** per MVP (E00–E13 / S1–S4) **e** production-ready (E14 / S5). Open decisions **locked**. Gate codice = **approvazione esplicita** + branch da `develop`.

Vedi anche: [`sprints/READINESS.md`](./sprints/READINESS.md) · [`backlog/README.md`](./backlog/README.md).

---

## Prossimi passi (kickoff sviluppo)

1. ~~Chiudere open decisions~~ → locked sopra.
2. Conferma umana: “parti con S1 / T1.1”.
3. Checkout `develop` → `feature/FF-S1-platform-oss` → Analysis Card T1.1 → scaffold E00.
