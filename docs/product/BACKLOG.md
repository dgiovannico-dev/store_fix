# FacilityFlow Retail — Product Backlog & Sprint Roadmap

> **Stato:** draft per review — nessuna implementazione fino ad approvazione.
> **Scope:** solo MVP (Fase 1). Fase 2 elencata come epics deferred, non stimata in sprint.
> **Lingua UI MVP:** italiano. Mercato: Italia / EUR.

---

## Comprensione prodotto (per validazione)

| Elemento | Lettura |
|----------|---------|
| **Cosa** | SoR multi-tenant di manutenzione retail/franchise mid-market (10–50 PV) |
| **Wedge** | Intake leggero + ticket/SLA/dispatch vendor + costi per store — non CMMS enterprise |
| **Buyer** | Ops / Facility Manager HQ |
| **Successo MVP** | Rete pilota 15 store / 5 vendor gestisce end-to-end Flusso A–C senza WhatsApp come SoR |
| **Fuori scope** | WhatsApp API, PM calendar, marketplace, pagamenti, IoT, ERP, multi-paese, AI chatbot sostitutivo |

**Decisioni stack proposte (bloccanti prima dello scaffold):**

| Area | Scelta MVP | Motivo |
|------|------------|--------|
| Auth | **Auth.js (NextAuth) + Postgres** | Dati sessione/self-host UE, DPA più lineare; magic link + email/password |
| ORM | **Prisma** | Schema esplicito, migrazioni, velocità MVP |
| DB | **PostgreSQL** (Neon EU o Postgres locale) | Isolamento tenant + query tipizzate |
| Storage | **Cloudflare R2** (EU) | S3-compatible, costi allegati |
| Email | **Resend** | DX semplice, template IT |
| Jobs SLA | **Inngest** | Cron + retry su breach senza cron fragile |
| UI | Next.js App Router + Tailwind + shadcn/ui | Allineato al brief |

---

## Mappa Epics → MVP

| ID | Epic | Priorità | Sprint target |
|----|------|----------|---------------|
| E01 | Foundation: tenancy, auth, RBAC | P0 | S1 |
| E02 | Onboarding rete (store, utenti, vendor seed) | P0 | S1 |
| E03 | Asset registry leggero | P0 | S1–S2 |
| E04 | Ticket lifecycle (web store + ops) | P0 | S2 |
| E05 | SLA, timer, breach, escalation | P0 | S2–S3 |
| E06 | Vendor portal | P0 | S3 |
| E07 | Chiusura, verifica store, costi | P0 | S3 |
| E08 | Notifiche email + in-app | P0 | S3 |
| E09 | Dashboard HQ | P0 | S4 |
| E10 | Audit log + soft-delete + NFR UX | P0 | S4 |
| E11 | Intake “WhatsApp-like” (link deep + form mobile) | P0 | S2 |
| E12 | GDPR base (export/retention hooks) | P1 | S4 |
| — | Fase 2 (WhatsApp API, PM, scorecard, AI assist, PWA offline) | Deferred | post-MVP |

---

## E01 — Foundation: tenancy, auth, RBAC

### US-E01-01 — Signup HQ / creazione tenant
**Come** owner di un’insegna, **voglio** registrarmi e creare il tenant, **così** parto con un workspace isolato.

**Acceptance criteria**
- [ ] Form signup: email, password (o magic link), nome insegna, partita IVA opzionale
- [ ] Alla conferma nasce `Tenant` + membership `owner`
- [ ] Redirect a onboarding guidato (non dashboard vuota)
- [ ] Email di conferma inviata
- [ ] Tentativo di accesso cross-tenant fallisce (test isolamento)

### US-E01-02 — Login / logout / sessione
**Come** utente, **voglio** autenticarmi in modo sicuro, **così** accedo solo ai dati del mio tenant.

**AC**
- [ ] Email/password + magic link
- [ ] Sessione httpOnly, CSRF-safe sulle mutation
- [ ] Logout invalida sessione
- [ ] Rate limit su login/signup

### US-E01-03 — Inviti e ruoli RBAC
**Come** `admin_hq`, **voglio** invitare utenti con ruolo, **così** store/ops/vendor hanno permessi corretti.

**Ruoli MVP:** `owner`, `admin_hq`, `ops_coordinator`, `store_manager`, `store_staff`, `vendor`, `viewer_finance` (read-only costi).

**AC**
- [ ] Invite via email con token a scadenza
- [ ] Ruolo assegnabile e modificabile da admin
- [ ] Ogni API/UI route gated per ruolo
- [ ] `store_*` limitati agli store della membership
- [ ] `vendor` vede solo ticket assegnati al proprio vendor record

### US-E01-04 — Isolamento multi-tenant
**Come** piattaforma, **devo** filtrare ogni query per `tenant_id`.

**AC**
- [ ] Middleware/helper obbligatorio su data layer
- [ ] Test: utente tenant A non legge store/ticket tenant B
- [ ] Soft delete non espone record di altri tenant

---

## E02 — Onboarding rete

### US-E02-01 — CRUD Store
**Come** `admin_hq`, **voglio** creare/modificare store (nome, indirizzo, timezone Europe/Rome, contatti).

**AC**
- [ ] CRUD completo con validazione indirizzo minimo (città, CAP, via)
- [ ] Lista store ricercabile
- [ ] Soft delete; store soft-deleted non accettano nuovi ticket
- [ ] Empty state: CTA “Aggiungi il primo punto vendita”

### US-E02-02 — Import CSV store
**Come** `admin_hq`, **voglio** importare N store da CSV, **così** onboarding di 15 PV è veloce.

**AC**
- [ ] Template CSV scaricabile (colonne documentate in IT)
- [ ] Validazione riga-per-riga con report errori
- [ ] Import atomico per riga valida; skip + log errori
- [ ] Max ragionevole (es. 200 righe/upload) + rate limit

### US-E02-03 — CRUD Vendor + coverage
**Come** `admin_hq` / `ops_coordinator`, **voglio** anagrafare vendor (categorie/trades, contatti, store coperti).

**AC**
- [ ] Campi: ragione sociale, email, telefono, categorie, store coverage (all o subset)
- [ ] Collegamento a utente `vendor` (invite)
- [ ] Preferenza vendor usabile in assegnazione ticket

### US-E02-04 — Checklist onboarding “primo ticket in 15 min”
**Come** nuovo tenant, **voglio** una checklist, **così** completo setup minimo senza formazione.

**AC**
- [ ] Step: 1 store → 1 vendor → 1 SLA default → invita 1 store manager → ticket di prova
- [ ] Progress persistito
- [ ] Skip opzionale ma dashboard evidenzia setup incompleto

---

## E03 — Asset registry leggero

### US-E03-01 — CRUD Asset per store
**Come** `ops_coordinator` / `store_manager`, **voglio** registrare asset (tipo, marca/modello, ubicazione, note, vendor preferito).

**AC**
- [ ] Asset legato a `store_id` + `tenant_id`
- [ ] Categorie predefinite MVP: HVAC, frigo, casse, illuminazione, porte, altro
- [ ] Lista filtrabile per store/categoria
- [ ] Soft delete; storico ticket resta collegato all’asset
- [ ] Non è richiesto barcode/serial obbligatorio (opzionale)

### US-E03-02 — Collegamento asset in ticket
**Come** store staff, **voglio** selezionare un asset opzionale in creazione ticket.

**AC**
- [ ] Autocomplete asset dello store corrente
- [ ] Se asset ha preferred_vendor, suggerito in triage (non auto-assign MVP)

---

## E04 — Ticket lifecycle

### US-E04-01 — Creazione ticket da web (store)
**Come** `store_manager` / `store_staff`, **voglio** aprire un ticket in &lt;30s con foto.

**AC**
- [ ] Campi: categoria, urgenza (`critical`/`high`/`normal`/`low`), descrizione, foto (1–n), asset opzionale
- [ ] Store implicito dalla membership (o select se multi-store)
- [ ] Stato iniziale `open`
- [ ] Upload allegati su object storage via signed URL; non blob in DB
- [ ] UI phone-first; empty/error/loading completi
- [ ] Conferma immediata “Segnalazione ricevuta” con ID ticket

### US-E04-02 — Triage e assegnazione (ops)
**Come** `ops_coordinator`, **voglio** triageare e assegnare a vendor.

**AC**
- [ ] Transizioni: `open` → `triaged` → `assigned` (e da `assigned` in poi)
- [ ] Assegnazione vendor obbligatoriamente prima di `assigned`
- [ ] Priorità modificabile
- [ ] Note interne (solo HQ) vs note vendor (visibili al vendor)
- [ ] RBAC: store non vede note interne

### US-E04-03 — Stati e macchine a stati
**Stati:** `open` → `triaged` → `assigned` → `in_progress` → `waiting_parts` → `done` → `verified` | `cancelled`

**AC**
- [ ] Transizioni illegali rifiutate server-side
- [ ] Matrice permessi: chi può muovere quale stato (store: open/verify/cancel early; vendor: in_progress/waiting_parts/done; ops: tutto tranne verify store-only se policy)
- [ ] Timestamp per ogni ingresso stato
- [ ] `cancelled` richiede motivo

### US-E04-04 — Lista e dettaglio ticket (HQ + store)
**AC**
- [ ] Filtri: stato, store, vendor, priorità, SLA a rischio, range date
- [ ] Dettaglio: timeline eventi, allegati, costi, SLA due
- [ ] Store vede solo i propri ticket
- [ ] p95 lista HQ target &lt;300ms su dataset pilota (indice DB documentato)

---

## E05 — SLA

### US-E05-01 — Template SLA per categoria
**Come** `admin_hq`, **voglio** definire SLA (es. frigo critico 4h, HVAC 24h, non critico 72h).

**AC**
- [ ] `SlaPolicy`: categoria + priorità → `response_hours` e/o `resolution_hours` (MVP: resolution da `assigned` o da `open` — **decisione: clock da creazione `open`**)
- [ ] Default seed IT per categorie MVP
- [ ] Modifica policy non ricalcola retroattivamente ticket già aperti (solo nuovi)

### US-E05-02 — Timer, badge breach, escalation
**AC**
- [ ] `sla_due_at` calcolato alla creazione (timezone store)
- [ ] Job periodico marca `sla_breached_at` e crea notifica a ops
- [ ] Badge UI: ok / a rischio (&lt;20% tempo rimanente) / breached
- [ ] Dashboard elenca ticket breached / a rischio
- [ ] Ops può rilanciare (nota + re-notify) o riassegnare

---

## E06 — Vendor portal

### US-E06-01 — Login vendor e inbox
**Come** `vendor`, **voglio** vedere solo i ticket assegnati a me.

**AC**
- [ ] Lista: da fare / in corso / chiusi
- [ ] Dettaglio: store address, contatto, asset, descrizione, foto, SLA due
- [ ] Nessun accesso ad altri vendor/tenant

### US-E06-02 — Aggiornamento stato + report fine lavoro
**AC**
- [ ] Transizioni vendor ammesse: `assigned`→`in_progress`→`waiting_parts`→`done`
- [ ] Su `done`: foto obbligatoria (≥1), costo stimato opzionale, costo effettivo richiesto (EUR), nota report
- [ ] Email a ops + store su `done`

---

## E07 — Chiusura, verifica, costi

### US-E07-01 — Verifica store
**Come** store, **voglio** confermare che l’intervento è OK.

**AC**
- [ ] Da `done` → `verified` solo ruoli store dello store del ticket
- [ ] Rifiuto verifica: torna `in_progress` o `assigned` con motivo (ops/vendor notificati)
- [ ] Ticket `verified` immutabile su campi chiave (costi/stato); solo note append-only

### US-E07-02 — Costi per store
**AC**
- [ ] Campi ticket: `estimated_cost`, `actual_cost` (EUR)
- [ ] Aggregazione per store/periodo in dashboard
- [ ] `viewer_finance` read-only su ticket chiusi/verificati + costi

---

## E08 — Notifiche

### US-E08-01 — Email transazionali
Eventi MVP: nuovo ticket, assegnazione vendor, breach SLA, ticket done, verified/rifiuto.

**AC**
- [ ] Template IT
- [ ] Preferenze base opt-out per tipo (tranne breach critici per ops — sempre on in MVP)
- [ ] Idempotenza: non spam duplicati per stesso evento

### US-E08-02 — In-app bell
**AC**
- [ ] Centro notifiche con unread count
- [ ] Mark as read
- [ ] Deep link al ticket

---

## E09 — Dashboard HQ

### US-E09-01 — Overview operativa
**Come** ops/facility, **voglio** vedere aperti per store, SLA a rischio, MTTR grezzo, costi periodo.

**AC**
- [ ] Widget: # aperti, # breached, # a rischio, MTTR (verified, media ore)
- [ ] Costi: somma `actual_cost` su verified nel range
- [ ] Breakdown per store (top N)
- [ ] Range default: 30 giorni; filtro store
- [ ] Empty state se zero ticket: CTA onboarding / crea ticket prova
- [ ] Nessun AI chatbot; solo metriche SoR

---

## E10 — Audit & qualità UX/NFR

### US-E10-01 — Audit log ticket
**AC**
- [ ] `TicketEvent` immutabile: actor, from_status, to_status, assignment changes, timestamp, metadata
- [ ] Visibile in timeline dettaglio
- [ ] Non modificabile via API

### US-E10-02 — Empty / loading / error + a11y + mobile
**AC**
- [ ] Ogni lista/dettaglio ha empty, skeleton/loading, error con retry
- [ ] Flussi store + HQ principali: target WCAG 2.1 AA (contrast, focus, labels)
- [ ] Store create-ticket usabile su viewport 390px

### US-E10-03 — Osservabilità base
**AC**
- [ ] Log strutturati JSON su request id
- [ ] Error tracking (Sentry o equivalente EU)
- [ ] Backup DB giornaliero documentato (runbook 1-pager)

---

## E11 — Intake WhatsApp-like (senza WA API)

### US-E11-01 — Link deep “Segnala guasto”
**Come** store, **voglio** un link/bookmark mobile al form ticket del mio store.

**AC**
- [ ] URL firmato o gated da auth store
- [ ] Opzionale: token store per kiosk (rate limited, no dati altri store)
- [ ] Istruzioni IT “metti in home screen / invia link su gruppo WA” (copy in-app) — **non** integrazione Cloud API

### US-E11-02 — (Opzionale MVP stretch) email-to-ticket
**AC**
- [ ] Solo se tempo S2 residuo; altrimenti Fase 2
- [ ] Indirizzo per-tenant; parse subject/body + allegato → ticket `open` da triageare

---

## E12 — GDPR base (P1)

### US-E12-01 — Export dati tenant + retention hook
**AC**
- [ ] Admin può richiedere export JSON/CSV entità core
- [ ] Retention policy documentata (default es. 24 mesi ticket verified); job soft-purge configurabile post-MVP ok se hook presente
- [ ] Hosting/regione EU dichiarato in settings

---

## Dipendenze (ordine verticale)

```
E01 Foundation
 └── E02 Onboarding (store, vendor, invite)
      ├── E03 Asset
      └── E11 Deep link intake
           └── E04 Ticket lifecycle
                ├── E05 SLA (+ jobs)
                ├── E06 Vendor portal
                │     └── E07 Chiusura/costi
                ├── E08 Notifiche (parallelabile da E04)
                └── E09 Dashboard ← richiede ticket+SLA+costi
 E10 Audit/NFR/UX  (trasversale: eventi da E04, polish S4)
 E12 GDPR hooks    (S4)
```

---

## Sprint roadmap (2 settimane / sprint)

### Definition of Done (tutti gli sprint)
- Story con AC verificabili su ambiente preview
- RBAC + `tenant_id` testati sulla feature
- UI IT; empty/loading/error sulla superficie toccata
- Nessuna feature Fase 2 / fuori scope

### Sprint 1 — “Tenant vivo + rete configurabile”
**Goal:** HQ si registra, configura store/vendor/utenti, checklist onboarding; asset base.

| Story | Note |
|-------|------|
| US-E01-01…04 | Auth, tenant, RBAC, isolamento |
| US-E02-01…04 | Store CRUD, CSV, vendor, checklist |
| US-E03-01 | Asset CRUD (collegamento ticket in S2) |
| Scaffold app | Next.js + Prisma schema + Auth.js + shadcn IT shell |

**Exit criteria:** da signup a “1 store + 1 vendor + 1 store manager invitato” senza SQL manuale.

### Sprint 2 — “Primo ticket end-to-end (senza vendor portal completo)”
**Goal:** Store apre ticket (web + deep link); ops triaga/assegna; SLA clock parte; email base nuovo/assign.

| Story | Note |
|-------|------|
| US-E04-01…04 | Lifecycle core + liste |
| US-E03-02 | Asset su ticket |
| US-E05-01 | Policy SLA + `sla_due_at` |
| US-E11-01 | Deep link Segnala guasto |
| US-E08-01 (parziale) | Email nuovo ticket + assegnazione |
| US-E10-01 (parziale) | Eventi stato/assign |

**Exit criteria:** Flusso A fino a `assigned` + SLA due visibile; Flusso C onboarding → ticket prova &lt;15 min.

### Sprint 3 — “Vendor chiude, store verifica, SLA breach vivo”
**Goal:** Portale vendor, chiusura con prove/costi, verifica store, breach job + notifiche.

| Story | Note |
|-------|------|
| US-E06-01…02 | Vendor portal |
| US-E07-01…02 | Verify + costi |
| US-E05-02 | Breach job + badge + escalate |
| US-E08-01…02 | Restanti email + bell |
| US-E10-01 | Audit completo timeline |

**Exit criteria:** Flusso A completo fino a `verified`; Flusso B breach notifica ops.

### Sprint 4 — “HQ governa la rete + harden”
**Goal:** Dashboard, finance viewer, GDPR hooks, a11y/perf/osservabilità, polish pilota.

| Story | Note |
|-------|------|
| US-E09-01 | Dashboard |
| US-E10-02…03 | UX NFR + observability |
| US-E12-01 | Export + retention hook |
| Buffer | Bugfix pilota, indici lista ticket, seed demo 15×5 |

**Exit criteria:** Pilota 15 store / 5 vendor usabile; lista HQ entro budget perf su seed; runbook backup.

---

## Stime grezze (t-shirt, team ~1–2 FTE product eng)

| Sprint | Effort | Rischio principale |
|--------|--------|--------------------|
| S1 | L | Auth.js + membership multi-store corretta |
| S2 | XL | State machine + allegati signed URL |
| S3 | L | Job SLA affidabile; UX vendor |
| S4 | M | Metriche MTTR corrette; AA |

**Totale MVP:** ~8 settimane calendario (4×2w), allineato al brief Sprint 1–4.

---

## Epics Fase 2 (deferred — non in sprint MVP)

| ID | Epic |
|----|------|
| F2-01 | WhatsApp Business Cloud API → ticket |
| F2-02 | Preventivi / accettazione costi |
| F2-03 | Scorecard vendor |
| F2-04 | Contratti + calendar PM |
| F2-05 | Export contabile CSV avanzato / Google Calendar |
| F2-06 | PWA offline-light |
| F2-07 | AI assist (classify / suggest vendor / summarize) con human-confirm |

---

## Open decisions (da chiudere prima dello scaffold)

1. **Auth:** conferma Auth.js vs Clerk (EU residency / DPA).
2. **SLA clock start:** proposta = da `open`; alternativa = da `assigned`.
3. **Verify reject target state:** proposta = `in_progress`.
4. **Vendor multi-tenant:** un’azienda vendor serve più insegne? MVP: **no** (vendor record per-tenant); Fase 2 eventuale.
5. **Nome prodotto** definitivo (FacilityFlow Retail = working title).

---

## Prossimi passi (dopo tua approvazione)

1. Chiudere le 5 open decisions.
2. Opzionale: raffinare AC in ticket Linear/GitHub Issues.
3. Solo su richiesta esplicita: scaffold MVP (schema Prisma + shell Next.js) secondo questo backlog, partendo da Sprint 1.
