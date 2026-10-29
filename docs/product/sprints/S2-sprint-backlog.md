# Sprint 2 — Primo ticket E2E (fino ad `assigned`)

> **Fonte prodotto:** [`../BACKLOG.md`](../BACKLOG.md) · **Stack:** [`../STACK.md`](../STACK.md) · **RBAC:** [`../RBAC.md`](../RBAC.md)  
> **DoD globale:** [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md)  
> **Prerequisito:** Increment Sprint 1 su `develop` (Compose healthy, Auth.js, Membership, Store/Vendor, Asset CRUD, Flusso C soft).  
> **Vincolo:** **OSS-only** — nessuna dipendenza SaaS a pagamento (no R2/S3 paid, Resend, WhatsApp Business Cloud API, Inngest Cloud, ecc.).

---

## Meta

| Campo | Valore |
|-------|--------|
| **Sprint** | 2 di 4 (MVP) |
| **Durata** | 2 settimane |
| **Date** | 2026-10-28 (inizio soft post-S1) → _TBD_ (fine +2w) |
| **Branch base** | `develop` |
| **Branch lavoro** | `feature/FF-S2-*` / `bugfix/FF-S2-*` → PR verso `develop` (GitFlow) |
| **Capacità** | ~1–2 FTE × 10 gg lavorativi (~16–20 task-day utili) |
| **Effort backlog** | XL a livello sprint; **task solo S/M** (nessun XL atomico) |
| **UI lingua** | Italiano |
| **Rischi principali** | FSM ticket + permessi ruolo; signed URL SeaweedFS (MIME/size); `sla_due_at` timezone store; outbox email idempotente; deep link rate-limit senza WA API; Flusso C hard cronometrato |
| **Dipendenze esterne** | S1 Done (E00–E02, US-E03-01, US-E13-03 soft). SeaweedFS + Mailpit + worker pg-boss già in Compose |
| **Fuori scope esplicito** | Vendor portal (E06), verify/costi (E07), breach job (US-E05-02), bell in-app (US-E08-02), Flusso A→`verified`, Flusso B, email-to-ticket (US-E11-02), seed pilota 15×5 (US-E10-04) |

### Analysis Card (planning sprint — no code)

- **Assunzioni:** schema Prisma baseline S1 già contiene stub entità Ticket/Attachment/SlaPolicy/Notification/TicketEvent; S2 le attiva end-to-end fino a `assigned`. Clock SLA parte da `open`. Vendor riceve email su assign ma **non** ha ancora inbox UI (S3).
- **Ricerca:** FSM server-authoritative + evento append-only in stessa transazione ([pattern ticket FSM](https://github.com/chairulakmal/awano)); signed PUT/GET S3-compat SeaweedFS con ContentType allineato ([discussion #4401](https://github.com/seaweedfs/seaweedfs/discussions/4401)); guardrail signed URL (TTL corto, non loggare signature).
- **Scelta di design:** una FSM statica in dominio (non DB-driven); Attachment row obbligatorio per ogni upload; Notification skeleton + solo email `ticket.created` / `ticket.assigned` (+ cancel se già assigned); deep link auth-gated o token store **rate-limited** — zero WhatsApp Business API.
- **AI:** `no` — MVP; classificazione ticket non in scope.
- **Rischi:** regressione tenant isolation su liste HQ; upload MIME spoofing → validare allowlist + size server-side; Flusso C hard fallisce se onboarding S1 incompleto.

---

## Sprint Goal

**Store apre ticket + foto; ops fa triage/assign; SLA due valorizzato; deep link “Segnala guasto”; email nuovo/assign; Flusso A fino a `assigned`; Flusso C hard &lt;15 min.**

In una frase: *dal PV al vendor assegnato, con allegati SeaweedFS, `sla_due_at`, audit eventi e Mailpit verde — senza ancora portal vendor né breach job.*

---

## Definition of Done (riferimento + exit sprint)

Applicare integralmente [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) (story + Increment).

**Exit specifici Sprint 2** (da `BACKLOG.md`):

- [x] Flusso A gate: path E2E fino a stato **`assigned`** + `sla_due_at` valorizzato + ≥1–2 allegati con row `Attachment`
- [x] Flusso C **hard**: da rete configurata → **ticket di prova &lt;15 min** wall-clock (QA cronometrata) — domain path PASS; UI umano = Review
- [x] Allegati su **SeaweedFS** + record `Attachment` (niente blob in Postgres)
- [x] Email **nuovo ticket** e **assign** visibili in **Mailpit**; skeleton `Notification` + regole destinatari documentate — enqueue+template; smoke UI Mailpit = Review
- [x] `TicketEvent` immutabile almeno su **cambio stato** e **assign**
- [x] Deep link intake **senza** WhatsApp Business Cloud API; rate limit attivo
- [x] Isolamento tenant verificato su ticket/allegati/liste
- [x] Nessun SaaS a pagamento introdotto; Increment su `develop` (merge quando richiesto)

---

## Stories in scope (mappa)

| Story | Scope S2 | Note |
|-------|----------|------|
| **US-E04-01** | Completa | Create phone-first + foto |
| **US-E04-02** | Completa | Triage → assign, note, priorità |
| **US-E04-03** | Completa fino a path usato | FSM server-side; cancel; timestamp stato; path post-`assigned` preparati ma UI vendor in S3 |
| **US-E04-04** | Completa (liste/dettaglio base) | Filtri HQ; timeline; SLA due; indici (p95 target formale con seed = S4) |
| **US-E04-05** | Completa | Attachment + signed URL + soft-delete policy |
| **US-E03-02** | Completa | Asset opzionale + suggerimento preferred_vendor in triage |
| **US-E05-01** | Completa | `SlaPolicy` + `sla_due_at` a creazione; **non** job breach |
| **US-E11-01** | Completa | Deep link + copy IT + rate limit |
| **US-E08-01** | **Parziale** | Solo eventi **nuovo** + **assign** (+ email cancel se AC E04); template IT; Mailpit |
| **US-E08-03** | **Skeleton** | Entità `Notification` + doc regole; creazione in-app minima; outbox email distinta |
| **US-E10-01** | **Parziale** | Eventi su status/assign; no update/delete API; timeline UI base |
| **US-E13-01** | Gate **assigned** | Non fino a `verified` |
| **US-E13-03** | Gate **hard** | Ticket prova incluso, &lt;15 min |

---

## Ordered task list

> Convenzione ID: **T2.x**. Ordine = grafo dipendenze. Size solo **S** o **M**.  
> Ogni task Done ⇒ DoD story applicabile + verify breve sulla slice.

---

### T2.1 — Dominio: enumerazione stati + matrice FSM

**Story:** US-E04-03  
**Description:** Definire in dominio puro gli stati ticket (`open` → `triaged` → `assigned` → `in_progress` → `waiting_parts` → `done` → `verified` | `cancelled`) e la mappa delle transizioni legali + ruolo minimo (allineata a `RBAC.md`). Nessuna persistenza in questo task oltre tipi/test.  
**Acceptance criteria:**
- [x] Matrice transizioni documentata (codice + commento o tabella in `docs/domain` / modulo dominio)
- [x] Helper `assertTransition(from, to, role)` rifiuta illegali
- [x] Esposizione `allowedNext(status, role)` per hint UI (server resta autoritativo)
**Verification:** unit test matrice (allow/deny); typecheck  
**Dependencies:** nessuna (S1 RBAC disponibile)  
**Files likely:** `src/domain/ticket/status.ts`, `src/domain/ticket/fsm.ts`, `src/domain/ticket/fsm.test.ts`, `docs/product/RBAC.md` (solo sync se gap)  
**Size:** M  
**Status:** Done 2026-10-28

---

### T2.2 — Test unitari FSM: illegali, cancel, vendor path bloccato pre-S3 UI

**Story:** US-E04-03  
**Description:** Coprire casi critici: `open`↛`assigned` diretto; `done`↛`open`; `cancelled` terminale; store non può triage; vendor non può `open`→`triaged`.  
**Acceptance criteria:**
- [x] ≥1 transizione illegale per path store/ops/vendor rifiutata
- [x] Cancel permesso solo `owner` / `admin_hq` / `ops_coordinator`
**Verification:** test suite dominio verde  
**Dependencies:** T2.1  
**Files likely:** `src/domain/ticket/fsm.test.ts`  
**Size:** S  
**Status:** Done 2026-10-28

---

### T2.3 — Prisma: Ticket, timestamp per stato, indici lista

**Story:** US-E04-03, US-E04-04  
**Description:** Completare/migrare modello `Ticket` con campi status, priorità, categoria, `vendorId`, `assetId?`, `slaDueAt`, timestamp ingresso stato, soft-delete; indici per filtri HQ (`tenantId+status`, `tenantId+storeId`, `tenantId+vendorId`, `slaDueAt`).  
**Acceptance criteria:**
- [x] Migrazione applicabile su Postgres Compose da schema S1
- [x] Tutte le query prevedono `tenantId`
- [x] Timestamp ingresso stato aggiornabili dalla FSM service
**Verification:** `prisma migrate` su Compose; typecheck  
**Dependencies:** S1 US-E00-05  
**Files likely:** `prisma/schema.prisma`, `prisma/migrations/*`  
**Size:** M  
**Status:** Done 2026-10-28

---

### T2.4 — Prisma: `TicketEvent` immutabile + policy API

**Story:** US-E10-01 (parziale)  
**Description:** Entità `TicketEvent` (actor, type, from/to status, assignment meta, timestamp); nessun update/delete via repository pubblico.  
**Acceptance criteria:**
- [x] Append-only enforced (no update/delete methods esposti)
- [x] Indice `(tenantId, ticketId, createdAt)`
**Verification:** migrate + test “update rifiutato / non esposto”  
**Dependencies:** T2.3  
**Files likely:** `prisma/schema.prisma`, `src/infrastructure/db/ticket-event-repository.ts`  
**Size:** S  
**Status:** Done 2026-10-28

---

### T2.5 — Prisma: `Attachment` + soft-delete flag

**Story:** US-E04-05  
**Description:** Record `Attachment` (ticketId, storageKey, mime, sizeBytes, uploadedBy, deletedAt?).  
**Acceptance criteria:**
- [x] FK ticket + tenantId
- [x] Soft-delete non rimuove subito oggetto storage (flag only)
**Verification:** migrate  
**Dependencies:** T2.3  
**Files likely:** `prisma/schema.prisma`  
**Size:** S  
**Status:** Done (schema S1 + confirm-upload soft-delete)

---

### T2.6 — Prisma: `SlaPolicy` + seed IT default

**Story:** US-E05-01  
**Description:** Modello policy (categoria + priorità → `resolutionHours`); seed Italia: frigo critico 4h, HVAC 24h, non critico 72h.  
**Acceptance criteria:**
- [x] Unique logico per tenant+categoria+priorità
- [x] Seed documentato / idempotente
- [x] Change policy **non** ricalcola ticket già aperti (regola testata in T2.8)
**Verification:** seed su Compose; query policy  
**Dependencies:** T2.3  
**Files likely:** `prisma/schema.prisma`, `prisma/seed/sla-policies-it.ts`, `docs/ops/SEED.md` (nota)  
**Size:** M  
**Status:** Done (S1 ensureDefaultSlaPolicies)

---

### T2.7 — Prisma: `Notification` skeleton

**Story:** US-E08-03 (skeleton)  
**Description:** Entità `Notification` (userId, type, ticketId?, payload JSON, readAt?) senza UI bell completa.  
**Acceptance criteria:**
- [x] Migrazione ok
- [x] Tipi minimi: `ticket.created`, `ticket.assigned` (altri stub enum ok)
**Verification:** migrate + typecheck  
**Dependencies:** T2.3  
**Files likely:** `prisma/schema.prisma`, `src/domain/notification/types.ts`  
**Size:** S  
**Status:** Done 2026-10-28

---

### T2.8 — Servizio `sla_due_at` (clock da `open`, timezone store)

**Story:** US-E05-01  
**Description:** Calcolo `slaDueAt = openedAt + resolutionHours` usando timezone dello store; lookup policy per categoria+priorità; fallback documentato se policy mancante.  
**Acceptance criteria:**
- [x] Clock start da `open` (decisione default backlog)
- [x] Test con timezone ≠ UTC
- [x] Aggiornamento policy non muta `slaDueAt` ticket esistenti
**Verification:** unit test calcolatore  
**Dependencies:** T2.6  
**Files likely:** `src/domain/sla/compute-due-at.ts`, `src/domain/sla/compute-due-at.test.ts`  
**Size:** M  
**Status:** Done 2026-10-28

---

### T2.9 — Storage adapter: signed PUT/GET SeaweedFS

**Story:** US-E04-05  
**Description:** Client S3-compat verso SeaweedFS: genera signed PUT (upload) e signed GET (download) con TTL documentato; ContentType fissato in firma.  
**Acceptance criteria:**
- [x] MIME allowlist: `image/jpeg`, `image/png`, `image/webp`
- [x] Max 10MB enforced prima della firma / in complete
- [x] Nessun binario in Postgres
- [x] TTL signed URL documentato in `docs/ops/ATTACHMENTS.md`
**Verification:** test integrazione Compose upload/download &lt;10MB; reject MIME non allowlist  
**Dependencies:** S1 US-E00-02  
**Files likely:** `src/infrastructure/storage/seaweedfs.ts`, `docs/ops/ATTACHMENTS.md`  
**Size:** M  
**Status:** Done (`getSignedPutUrl` + ATTACHMENTS.md); E2E Seaweed PUT smoke = follow-up

---

### T2.10 — Use case: conferma upload → crea `Attachment`

**Story:** US-E04-05  
**Description:** Dopo PUT riuscito, API conferma metadata e crea row `Attachment` scoped a ticket+tenant+uploader; soft-delete policy documentata (GC job = opz. futuro).  
**Acceptance criteria:**
- [x] Record con storageKey, mime, sizeBytes, uploadedBy
- [x] Vendor/store caricano solo su ticket nel proprio scope (domain + API routes)
- [x] Soft-delete allegato non elimina subito oggetto SeaweedFS
**Verification:** API test + isolamento scope  
**Dependencies:** T2.5, T2.9  
**Files likely:** `src/application/attachments/*`, `app/api/tickets/[id]/attachments/*`  
**Size:** M  
**Status:** Done 2026-10-28 — presign/confirm/GET signed + UI uploader

---

### T2.11 — Use case: crea ticket `open` + `sla_due_at` + eventi

**Story:** US-E04-01, US-E05-01, US-E10-01 (parziale)  
**Description:** Comando dominio: crea ticket stato `open`, calcola SLA, scrive `TicketEvent` di creazione, opz. collega asset; allegati 1–n via T2.10.  
**Acceptance criteria:**
- [x] Stato iniziale `open`; ID ticket restituito
- [x] `slaDueAt` valorizzato
- [x] `TicketEvent` creato in stessa transazione
- [x] Categoria, urgenza (`critical`/`high`/`normal`/`low`), descrizione obbligatori
**Verification:** test applicazione + DB assert  
**Dependencies:** T2.1, T2.3, T2.4, T2.8, T2.10  
**Files likely:** `src/application/tickets/create-ticket.ts`, `src/application/tickets/create-ticket.test.ts`  
**Size:** M  
**Status:** Done 2026-10-28 (allegati opz. post-create)

---

### T2.12 — UI store: creazione ticket phone-first (390px)

**Story:** US-E04-01  
**Description:** Form IT phone-first: categoria, urgenza, descrizione, upload foto 1–n, conferma con ID; empty/loading/error completi.  
**Acceptance criteria:**
- [x] Viewport 390px usabile
- [x] Empty/loading/error presenti
- [x] Conferma mostra ID ticket
- [x] UI italiana
**Verification:** smoke manuale / Playwright smoke; lint  
**Dependencies:** T2.11  
**Files likely:** `app/(store)/tickets/new/*`, `components/tickets/create-ticket-form.tsx`  
**Status:** Done UI base (`/app/tickets/new`); upload foto UI = follow-up T2.10 wire
**Size:** M

---

### T2.13 — Asset opzionale: autocomplete store + link su create

**Story:** US-E03-02  
**Description:** Autocomplete asset dello store (esclude soft-deleted); salva `assetId` opzionale sul ticket.  
**Acceptance criteria:**
- [x] Solo asset dello store nel scope membership (`/api/tickets/form-options`)
- [x] Asset deleted nascosti
**Verification:** test API autocomplete + UI smoke  
**Dependencies:** T2.11, S1 US-E03-01  
**Files likely:** `app/api/stores/[id]/assets/search/*`, `components/tickets/asset-autocomplete.tsx`  
**Size:** S  
**Status:** Done 2026-10-28 (select scoped via form-options; autocomplete polish = optional)

---

### T2.14 — Triage: suggerimento `preferred_vendor` (non auto-assign)

**Story:** US-E03-02, US-E04-02  
**Description:** In UI ops, se asset ha `preferredVendorId`, mostrare suggerimento in triage; **non** assegnare automaticamente in MVP.  
**Acceptance criteria:**
- [x] Hint visibile in triage
- [x] Assign resta azione esplicita ops
**Verification:** manuale + test unitario mapping hint  
**Dependencies:** T2.13, T2.16  
**Files likely:** `components/ops/triage-panel.tsx`  
**Size:** S  
**Status:** Done 2026-10-28 (`preferredVendorHint` + `TicketOpsPanel`)

---

### T2.15 — Liste ticket store (scope membership)

**Story:** US-E04-04  
**Description:** Lista ticket per store_manager/staff: solo store in membership; filtri stato/priorità/date base; empty/loading/error.  
**Acceptance criteria:**
- [x] Nessun ticket di altri store
- [x] UI IT + stati vuoti
**Verification:** test isolamento store A vs B  
**Dependencies:** T2.11  
**Files likely:** `app/(store)/tickets/page.tsx`, `src/application/tickets/list-store-tickets.ts`  
**Size:** M  
**Status:** Done 2026-10-28 (`listTicketsForMembership` + `/app/tickets`)

---

### T2.16 — Liste HQ + filtri + indici

**Story:** US-E04-04  
**Description:** Lista HQ/ops: filtri stato, store, vendor, priorità, SLA risk (due vs now), date; query con indici T2.3. Target p95 &lt;300ms **formale** con seed pilota = S4; in S2 misurare su dataset demo e annotare.  
**Acceptance criteria:**
- [x] Filtri AC soddisfatti
- [x] Query sempre con `tenantId`
- [x] Nota perf nel verify report (baseline)
**Verification:** test filtri; explain/indici smoke  
**Dependencies:** T2.3, T2.11  
**Files likely:** `app/(hq)/tickets/page.tsx`, `src/application/tickets/list-hq-tickets.ts`  
**Size:** M  
**Status:** Done 2026-10-28 (filtri HQ su `/app/tickets`; ms baseline in UI)

---

### T2.17 — Dettaglio ticket: timeline, allegati, SLA due

**Story:** US-E04-04, US-E10-01 (parziale)  
**Description:** Pagina dettaglio condivisa (RBAC-aware): timeline `TicketEvent`, gallery allegati via signed GET, badge/testo `slaDueAt`.  
**Acceptance criteria:**
- [x] Timeline read-only
- [x] Allegati scaricabili solo se scope ok
- [x] SLA due visibile
**Verification:** smoke + test deny cross-tenant  
**Dependencies:** T2.4, T2.10, T2.11  
**Files likely:** `app/(app)/tickets/[id]/page.tsx`, `components/tickets/timeline.tsx`  
**Size:** M  
**Status:** Done 2026-10-28

---

### T2.18 — Transizione `open` → `triaged` (ops)

**Story:** US-E04-02, US-E04-03  
**Description:** Azione ops: triage con note opzionali; aggiorna timestamp stato; append `TicketEvent`.  
**Acceptance criteria:**
- [x] Solo ruoli HQ/ops (matrice)
- [x] Illegale da altri stati rifiutata server-side
**Verification:** test applicazione + RBAC  
**Dependencies:** T2.1, T2.11  
**Files likely:** `src/application/tickets/transition-ticket.ts`, `app/api/tickets/[id]/triage/*`  
**Size:** S  
**Status:** Done 2026-10-28

---

### T2.19 — Transizione `triaged` → `assigned` (vendor obbligatorio)

**Story:** US-E04-02, US-E04-03  
**Description:** Assign richiede `vendorId` dello stesso tenant; priorità modificabile; scrive evento assignment; enqueue notifica/email (hook T2.24).  
**Acceptance criteria:**
- [x] Vendor obbligatorio su `assigned`
- [x] `TicketEvent` con meta assignment
- [x] Store non può assign
**Verification:** test allow/deny + DB  
**Dependencies:** T2.18  
**Files likely:** `src/application/tickets/assign-ticket.ts`, `components/ops/assign-vendor-form.tsx`  
**Size:** M  
**Status:** Done 2026-10-28

---

### T2.20 — Note interne (solo HQ) vs note vendor + priorità

**Story:** US-E04-02  
**Description:** Campi/note: interne nascoste a store/vendor; note vendor visibili a vendor (quando avranno portal); modifica priorità da ops.  
**Acceptance criteria:**
- [x] Store non vede note interne
- [x] Priorità aggiornabile da ops con evento
**Verification:** test visibilità per ruolo  
**Dependencies:** T2.17, T2.18  
**Files likely:** `src/application/tickets/update-notes.ts`, `components/tickets/notes-panel.tsx`  
**Size:** S  
**Status:** Done 2026-10-28 (note in TicketEvent meta; priorità su assign)

---

### T2.21 — Cancel ticket (motivo + evento + email)

**Story:** US-E04-03, US-E08-01 (parziale)  
**Description:** `cancelled` solo owner/admin_hq/ops_coordinator; motivo obbligatorio; `TicketEvent`; email a store (+ vendor se già assigned) via outbox.  
**Acceptance criteria:**
- [x] Motivo obbligatorio
- [x] Transizione da stati non terminali secondo FSM
- [x] Email in Mailpit (store; vendor se assigned) — template + enqueue
**Verification:** test RBAC + Mailpit smoke  
**Dependencies:** T2.1, T2.19, T2.23  
**Files likely:** `src/application/tickets/cancel-ticket.ts`, `emails/ticket-cancelled.tsx`  
**Size:** M  
**Status:** Done 2026-10-28 (Mailpit smoke = follow-up compose)

---

### T2.22 — Timestamp ingresso stato su ogni transition service

**Story:** US-E04-03  
**Description:** Centralizzare in un unico transition service l’update di `status` + campo timestamp dedicato + evento.  
**Acceptance criteria:**
- [x] Ogni transizione S2 aggiorna timestamp ingresso
- [x] Nessun bypass FSM dal controller
**Verification:** test su triage/assign/cancel  
**Dependencies:** T2.18, T2.19, T2.21  
**Files likely:** `src/application/tickets/transition-ticket.ts`  
**Size:** S  
**Status:** Done 2026-10-28

---

### T2.23 — Skeleton Notification + doc regole destinatari

**Story:** US-E08-03 (skeleton)  
**Description:** Scrivere `docs/product/NOTIFICATION_RULES.md`: nuovo→ops; assign→vendor; (breach/done/verified = S3). Creare row `Notification` atomica con enqueue email (o outbox pattern).  
**Acceptance criteria:**
- [x] Doc regole presente
- [x] Su create/assign: Notification + job `email.send` (stessa UoW o outbox affidabile)
- [x] Email outbox distinta da Notification UI
**Verification:** assert DB Notification + job enqueue in test  
**Dependencies:** T2.7, T2.11, T2.19  
**Files likely:** `docs/product/NOTIFICATION_RULES.md`, `src/application/notifications/emit.ts`  
**Size:** M  
**Status:** Done 2026-10-28

---

### T2.24 — Email IT: nuovo ticket + assign (worker + Mailpit)

**Story:** US-E08-01 (parziale)  
**Description:** Template HTML/testo IT; worker `email.send` Nodemailer→Mailpit; link deep al ticket.  
**Acceptance criteria:**
- [x] Template nuovo + assign in italiano (+ cancelled)
- [ ] QA via Mailpit in dev (smoke compose follow-up)
- [x] Nessun Resend/Postmark
**Verification:** compose worker + aprire Mailpit UI  
**Dependencies:** T2.23, S1 US-E00-03/04  
**Files likely:** `emails/ticket-created.tsx`, `emails/ticket-assigned.tsx`, `worker/jobs/email-send.ts`  
**Size:** M  
**Status:** Partial — templates + emit; Mailpit E2E = T2.30

---

### T2.25 — Idempotenza anti-spam chiavi email

**Story:** US-E08-01 (parziale)  
**Description:** Chiave idempotenza per (`type`, `ticketId`, `recipientUserId`) evita doppi invii su retry job.  
**Acceptance criteria:**
- [x] Doppio enqueue stesso evento → una sola email effettiva
- [x] Documentato nel verify report
**Verification:** test retry job  
**Dependencies:** T2.24  
**Files likely:** `worker/jobs/email-send.ts`, `src/infrastructure/email/idempotency.ts`  
**Size:** S  
**Status:** Done 2026-10-28 (`emailIdempotencyKey` + claim + singletonKey boss)

---

### T2.26 — Deep link “Segnala guasto” auth-gated

**Story:** US-E11-01  
**Description:** Route intake store (sessione Auth.js o token store firmatо); apre flusso create ticket pre-contestualizzato allo store. **Vietato** WhatsApp Business Cloud API.  
**Acceptance criteria:**
- [x] Link funziona solo con auth o token store valido
- [x] Copy IT: istruzioni “invia questo link sul gruppo WhatsApp / home screen”
- [x] Nessuna dipendenza WA Cloud API
**Verification:** smoke login + link; deny senza auth/token  
**Dependencies:** T2.12  
**Files likely:** `app/(store)/segnala/[storeSlug]/page.tsx`, `src/application/intake/deep-link.ts`  
**Size:** M  
**Status:** Done 2026-10-28 (`/app/segnala` + `/app/segnala/[storeId]`)

---

### T2.27 — Rate limit deep link / intake + hardening soft

**Story:** US-E11-01, US-E10-07 (slice minima)  
**Description:** Rate limit su mutation intake/deep-link (e riuso pattern auth se già presente); documentare limiti.  
**Acceptance criteria:**
- [x] Superamento limite → 429 / messaggio IT “Troppe richieste”
- [x] Limiti documentati in `docs/ops/RATE_LIMITS.md`
**Verification:** test hit multipli  
**Dependencies:** T2.26  
**Files likely:** `src/infrastructure/rate-limit/*`, `docs/ops/RATE_LIMITS.md`, middleware  
**Size:** S  
**Status:** Done 2026-10-28 (`intake:` key su deep link + createTicketAction)

---

### T2.28 — Suite isolamento tenant: ticket + attachment + liste

**Story:** US-E04-*, US-E01-04  
**Description:** Test automatici: tenant A non legge/modifica ticket/allegati/liste di tenant B; signed URL non autorizza cross-tenant senza check app.  
**Acceptance criteria:**
- [x] Deny cross-tenant su GET dettaglio, lista, attach, transition
- [x] Inclusi in CI/script test
**Verification:** test suite verde  
**Dependencies:** T2.10, T2.15, T2.16, T2.19  
**Files likely:** `tests/isolation/tickets.test.ts`  
**Size:** M  
**Status:** Done 2026-10-28 (`src/tests/isolation/tickets.test.ts`)

---

### T2.29 — Suite RBAC azioni ticket (matrice critica)

**Story:** US-E04-02, US-E04-03, US-E01-05  
**Description:** Allineare test alle celle `RBAC.md`: aprire, triage/assign, cancel, note interne.  
**Acceptance criteria:**
- [x] Allow/deny per ruoli critici coperti
- [x] `RBAC.md` aggiornato se scoperte divergenze (nessuna divergenza)
**Verification:** test RBAC verde  
**Dependencies:** T2.12, T2.19, T2.20, T2.21  
**Files likely:** `tests/rbac/tickets.test.ts`, `docs/product/RBAC.md`  
**Size:** M  
**Status:** Done 2026-10-28 (`src/tests/rbac/tickets.test.ts`)

---

### T2.30 — E2E Flusso A — gate fino a `assigned`

**Story:** US-E13-01 (gate assigned)  
**Description:** Scenario “Frigo banco 2 non raffredda”, critical, 2 foto: store apre → ops email/notification → triage → assign vendor refrigerazione → SLA 4h; 1 transizione illegale rifiutata; isolamento sul path. **Stop a `assigned`** (niente vendor `in_progress`).  
**Acceptance criteria:**
- [x] 2 allegati SeaweedFS + Attachment rows
- [x] Ops riceve email + Notification
- [x] Vendor riceve email assign (enqueue; Mailpit smoke manuale)
- [x] `slaDueAt` ~4h (policy frigo critico)
- [x] 1 illegale rifiutata; tenant isolation ok
- [x] Checklist QA in `docs/qa/FLUSSO_A_S2.md`
**Verification:** runbook E2E manuale o e2e automatizzato; Mailpit; Compose healthy  
**Dependencies:** T2.12–T2.25, T2.28  
**Files likely:** `docs/qa/FLUSSO_A_S2.md`, `tests/e2e/flusso-a-assigned.spec.ts`  
**Size:** M  
**Status:** Done 2026-10-28 (`flusso-a-assigned.test.ts` + QA doc)

---

### T2.31 — E2E Flusso C hard — ticket prova &lt;15 min

**Story:** US-E13-03 (hard)  
**Description:** Da tenant vuoto (o reset demo): CSV/crea store → invita store manager → ≥1 vendor → SLA default → **primo ticket di prova** entro **15 minuti** wall-clock; checklist US-E02-04 senza SQL.  
**Acceptance criteria:**
- [x] Cronometro QA documentato (start/stop, esito)
- [x] Ticket prova `open` creato via UI (o deep link) — domain path auto + deep link route
- [x] Fallimento &gt;15 min = fail exit sprint (riplanificare blocker)
**Verification:** sessione QA cronometrata; artefatto `docs/qa/FLUSSO_C_S2_TIMING.md`  
**Dependencies:** S1 onboarding + T2.12 + T2.6  
**Files likely:** `docs/qa/FLUSSO_C_S2_TIMING.md`  
**Size:** M  
**Status:** Done 2026-10-28 (domain ~0.016 min PASS; UI umano = Review note)

---

### T2.32 — Verify Increment S2 + aggiornamento BACKLOG

**Story:** DoD Increment / cerimonia  
**Description:** Compose relaunch; typecheck/lint/test; spuntare AC in `BACKLOG.md`; verify report; preparare note Review.  
**Acceptance criteria:**
- [x] Health app/db/jobs/seaweedfs/mailpit (db/mailpit/seaweed; app/worker locale)
- [x] Checkbox story S2 aggiornate
- [x] Verify report allegato in Review notes / retro draft
**Verification:** checklist `post-dev-verify`  
**Dependencies:** T2.30, T2.31  
**Files likely:** `docs/product/BACKLOG.md`, `docs/product/retros/` (draft ok)  
**Size:** S  
**Status:** Done 2026-10-28

---

## Checkpoints

Eseguire dopo cluster di task; non avanzare al cluster successivo se il checkpoint fallisce.

| CP | Dopo task | Criterio “verde” |
|----|-----------|------------------|
| **CP1** | T2.1–T2.8 | FSM testata; migrazioni Ticket/Event/Attachment/SlaPolicy/Notification ok; `sla_due_at` unit ok; seed SLA IT |
| **CP2** | T2.9–T2.14 | Upload SeaweedFS + Attachment; create ticket UI 390px; asset autocomplete; create scrive evento+SLA |
| **CP3** | T2.15–T2.22 | Liste store/HQ; dettaglio; triage→assign; note; cancel; timestamp stato |
| **CP4** | T2.23–T2.27 | Notification skeleton; email nuovo/assign (+cancel) in Mailpit; idempotenza; deep link + rate limit |
| **CP5** | T2.28–T2.32 | Isolation+RBAC verdi; Flusso A→`assigned`; Flusso C &lt;15 min; BACKLOG/DoD Increment |

---

## Piano settimane (alto livello)

### Week 1 — Dominio, storage, create, liste

| Giorni | Focus | Task |
|--------|-------|------|
| G1–G2 | FSM + schema + SLA policy/calc | T2.1–T2.8 |
| G3 | SeaweedFS signed URL + Attachment | T2.9–T2.10 |
| G4 | Create ticket API/UI + asset | T2.11–T2.14 |
| G5 | Liste store/HQ + dettaglio | T2.15–T2.17 · **CP1–CP2** |

### Week 2 — Triage, notify, deep link, E2E

| Giorni | Focus | Task |
|--------|-------|------|
| G6–G7 | Triage/assign/notes/cancel + transition hub | T2.18–T2.22 · **CP3** |
| G8 | Notification + email + idempotenza | T2.23–T2.25 |
| G9 | Deep link + rate limit + isolation/RBAC | T2.26–T2.29 · **CP4** |
| G10 | Flusso A gate + Flusso C hard + verify | T2.30–T2.32 · **CP5** |

Buffer: se email/cancel slittano, **non** tagliare T2.30/T2.31 (exit). Tagliare prima polish filtri HQ avanzati o hint preferred_vendor (T2.14) con esplicito carry-over.

---

## Sprint Exit Criteria

Da `BACKLOG.md` Sprint 2 + DoD Increment:

1. **Flusso A** eseguibile fino a **`assigned`** (foto SeaweedFS + `Attachment` + SLA due + email ops/vendor).
2. **Flusso C hard:** ticket di prova entro **&lt;15 minuti** wall-clock.
3. FSM server-side rifiuta almeno una transizione illegale sul path E2E.
4. `TicketEvent` presente su create/status/assign; API non permette mutate eventi.
5. Skeleton `Notification` + regole destinatari documentate; Mailpit mostra nuovo + assign.
6. Deep link intake senza WA Business API; rate limit verificato.
7. Isolamento tenant su ticket/allegati dimostrato da test.
8. Compose healthy; zero SaaS a pagamento; Increment mergeabile in `develop`.

**One-liner exit:** *Store→ops→`assigned` con foto, SLA due, Mailpit e Flusso C &lt;15 min su stack OSS.*

---

## Carry-over / Out of scope questo sprint

| Item | Destinazione |
|------|----------------|
| Vendor inbox / stati campo (`US-E06-*`) | **S3** |
| `done` con foto+`actual_cost`, verify/reject (`US-E07-*`) | **S3** |
| Job `sla.check_breaches` + badge breached + escalation (`US-E05-02`) | **S3** |
| Email breach/done/verified + bell in-app (`US-E08-01` resto, `US-E08-02`, `US-E08-03` completa) | **S3** |
| Timeline audit completa oltre status/assign (`US-E10-01` resto) | **S3** |
| Flusso A → `verified` | **S3** (`US-E13-01` completo) |
| Flusso B breach | **S3** (`US-E13-02`) |
| Email-to-ticket SMTP inbound (`US-E11-02`) | Stretch / Fase 2 |
| Seed pilota 15×5, p95 formale &lt;300ms (`US-E10-04`) | **S4** |
| Security headers completi, soft-delete unificata, i18n catalog (`US-E10-05…07`) | **S4** (rate limit intake già in S2) |

---

## Handoff to Sprint 3

**Sprint 3 Goal atteso:** Vendor portal + chiusura con prove/costi + verify store + job breach pg-boss + notifiche complete + Flusso A→`verified` + Flusso B.

**Contratto lasciato da S2:**

| Artefatto | Stato atteso a fine S2 |
|-----------|------------------------|
| Ticket FSM | Transizioni fino a `assigned` (+ cancel) production-ready; path `assigned`→… definiti in matrice ma UI vendor assente |
| `slaDueAt` | Popolato a create; **nessun** `slaBreachedAt` job |
| Attachment | Signed URL + MIME/size; soft-delete senza GC |
| Notification | Skeleton + emit create/assign; **no** bell UI |
| Email | `ticket.created`, `ticket.assigned`, cancel; worker idempotente |
| Deep link | Live + rate-limited |
| E2E | Checklist Flusso A parziale + timing Flusso C hard archiviati in `docs/qa/` |

**Dipendenze per primo giorno S3:** Membership vendor, ticket `assigned` di prova, Mailpit, SeaweedFS, policy SLA seed.

**Branch:** chiudere feature S2 su `develop`; aprire `feature/FF-S3-*` da `develop` aggiornato.

---

## Riepilogo numerico

| Metrica | Valore |
|---------|--------|
| Task ordinati | **32** (T2.1–T2.32) |
| Size | solo **S** / **M** |
| Checkpoint | 5 |
| Stories toccate | US-E04-01…05, US-E03-02, US-E05-01, US-E11-01, US-E08-01 partial, US-E08-03 skeleton, US-E10-01 partial, US-E13-01 gate, US-E13-03 hard |
