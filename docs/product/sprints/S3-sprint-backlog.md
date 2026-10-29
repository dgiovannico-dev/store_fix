# Sprint 3 — Sprint Backlog

> **FacilityFlow Retail** · Portale vendor + verify/costi + SLA breach + notifiche complete  
> Fonte di verità prodotto: [`../BACKLOG.md`](../BACKLOG.md) · Stack: [`../STACK.md`](../STACK.md) · RBAC: [`../RBAC.md`](../RBAC.md) · DoD: [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md)

---

## 1. Meta

| Campo | Valore |
|-------|--------|
| **Sprint** | S3 |
| **Durata** | 2 settimane (~10 giornate utili) |
| **Capacità** | ~1–2 FTE (solo / small team + AI agent) |
| **Effort stimato backlog** | **L** (t-shirt prodotto); task solo **S** / **M** |
| **Branch base** | `develop` → `feature/FF-S3-*` (GitFlow) |
| **Lingua UI** | Italiano |
| **Vincolo hard** | **OSS-only / self-host** — Auth.js, Postgres, Prisma, SeaweedFS, Nodemailer+Mailpit, pg-boss. Vietato: Clerk, Neon/Supabase Cloud, R2/S3 paid, Resend/Postmark, Inngest/Trigger Cloud, Sentry Cloud, WhatsApp Business API |
| **Prerequisiti S2 (assunti Done)** | Lifecycle ticket fino a `assigned`; Attachment SeaweedFS; `SlaPolicy` + `sla_due_at`; email nuovo/assign parziale; Notification skeleton; TicketEvent parziale (stato/assign); Flusso A gate `assigned`; Flusso C hard |
| **Fuori scope S3** | Dashboard HQ aggregata (`US-E09-01`); seed pilota 15×5 (`US-E10-04`); GDPR (`US-E12`); i18n/security/backup polish (`US-E10-02…07`); Flusso C; AI; preventivi Fase 2 |
| **Open decision vincolanti** | Verify reject → **`in_progress`** (confermato per S3); SLA clock da `open` (default S2); vendor multi-insegna = **no** |

### Analysis Card (planning S3)

- **Assunzioni:** S2 ha lasciato Notification + TicketEvent “skeleton”; S3 li completa e li collega a ogni transizione vendor/verify/breach. Dashboard riflette tempo/costo solo a livello ticket/store fino a S4 (E09).
- **Ricerca:** pg-boss at-least-once → handler idempotenti ([docs pg-boss](https://pgboss.io/introduction)); schedule con `key`/`singletonKey` unici ([AGLedger / pg-boss footguns](https://agledger.ai/blog/pg-boss-production-lessons/)); chiusura con foto+costo e verify/reject→in_progress allineati a CMMS ([Xenia closure tracking](https://www.xenia.team/work-orders/maintenance-ticket-system-closure-tracking)); bell tenant+user scoped ([pattern feed multi-tenant](https://docs.knock.app/in-app-ui/feeds/filtering-in-app-feeds)).
- **Scelta di design:** un job ricorrente `sla.check_breaches` che marca breach con update condizionale `WHERE sla_breached_at IS NULL`, poi crea Notification + enqueue `email.send` una sola volta; niente Redis per unread count in MVP (query Postgres). Vendor path stretto: `Membership.vendorId` + `ticket.vendorId`.
- **AI:** `no` — SoR umano; assist classificazione fuori MVP.
- **Rischi:** doppie email breach se manca idempotenza; vendor che vede ticket altrui; `done` senza foto; reject senza motivo; timeline incompleta che spezza E2E A/B.

---

## 2. Sprint Goal

**Portale vendor (RBAC scoped, mobile) + chiusura con foto/`actual_cost` + verify/reject store → `in_progress` + job pg-boss `sla.check_breaches` idempotente + notifiche email/in-app complete (bell) + timeline `TicketEvent` piena; chiudere Flusso A fino a `verified` e Flusso B (breach vivo).**

Increment potenzialmente rilasciabile: un vendor di campo aggiorna e chiude ticket; lo store verifica o rifiuta; ops riceve breach una sola volta; audit e campanella operativi su Compose.

---

## 3. Definition of Done (richiamo S3)

Oltre a [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md):

- [ ] AC delle story in scope spuntati in `BACKLOG.md`
- [ ] Isolamento **tenant** + scope **vendor** (`vendor_id`) + scope **store membership** su verify
- [ ] Test dominio: transizioni illegali, `done` senza foto/`actual_cost` rifiutato, breach idempotente, deny cross-vendor
- [ ] Compose healthy: **app / postgres / worker / seaweedfs / mailpit** (dev)
- [ ] UI IT; empty/loading/error su inbox vendor, dettaglio, bell, timeline
- [ ] Nessun SaaS a pagamento introdotto
- [ ] Verify report breve dopo ogni slice M
- [ ] Gate E13: **Flusso A → `verified`** e **Flusso B** green

---

## 4. Story in scope (checklist)

| Story | Titolo | Completamento atteso |
|-------|--------|----------------------|
| **US-E06-01** | Inbox vendor | Completo |
| **US-E06-02** | Stato + chiusura lavoro | Completo |
| **US-E07-01** | Verifica store | Completo |
| **US-E07-02** | Costi per store | Completo (aggregati dashboard = S4; campi + read scope qui) |
| **US-E05-02** | Timer, breach, escalation | Completo |
| **US-E08-01** | Email transazionali SMTP OSS | Completo (chiude gap post-S2) |
| **US-E08-02** | In-app bell | Completo |
| **US-E08-03** | Modello Notification + destinatari | Completo |
| **US-E10-01** | Audit immutabile ticket | Completo |
| **US-E13-01** | Flusso A → `verified` | Completo (da gate `assigned`) |
| **US-E13-02** | Flusso B — Breach SLA | Completo |

---

## 5. Task ordinati (T3.x)

> Ordine = grafo dipendenze. Size solo **S** o **M**. Ogni task: Story · AC · Verification · Deps · Files · Size.

---

### T3.1 — Notification completa + regole destinatari

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E08-03` (completo) |
| **Deps** | S2 skeleton Notification; Prisma baseline |

**AC**
- [x] Entità `Notification`: `tenantId`, `userId`, `type`, `ticketId?`, `payload` JSON, `readAt?`, `createdAt`; soft-delete consentito
- [x] Regole destinatari documentate e implementate:
  - nuovo ticket → ops (`ops_coordinator` / `admin_hq` / `owner` rilevanti)
  - assign → utenti `vendor` del vendor assegnato
  - breach → ops
  - done → ops + store membership dello store
  - verified / reject → ops + vendor
- [x] Creazione in-app + enqueue `email.send` **nello stesso flusso dominio** (transazione o outbox pattern); email outbox **distinta** dalla riga Notification UI
- [x] Query sempre filtrate `tenantId` + `userId` (nessun leak cross-user)
**Status:** Done 2026-10-29

**Verification**
- [ ] Test unit/integration: per ogni tipo evento, destinatari corretti; zero notifiche cross-tenant
- [ ] Mailpit **non** obbligatorio in questo task (enqueue verificabile su tabella/job)
- [ ] Typecheck + test verdi

**Files probabili**
- `prisma/schema.prisma` (`Notification`)
- `docs/product/notifications-recipients.md` (o sezione in `RBAC.md` / ops)
- `src/domain/notifications/*` (o `src/application/notifications/*`)
- `src/workers/email-send.ts` (hook enqueue)
- `tests/notifications/recipients.test.ts`

---

### T3.2 — TicketEvent completo (tipi + append-only)

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E10-01` (dominio/API; UI timeline = T3.12) |
| **Deps** | Eventi stato/assign S2 |

**AC**
- [x] Tipi evento minimi: `status_changed`, `assigned`, `note_added`, `attachment_added`, `cost_set`, `sla_breached`, `sla_relaunch`, `verified`, `rejected` (+ meta JSON)
- [x] Ogni mutazione di stato/assign/costi/breach scrive **un** evento con `actorUserId`, `fromStatus?`, `toStatus?`, timestamp
- [x] API: **nessun** UPDATE/DELETE su `TicketEvent` (solo INSERT + GET timeline)
- [x] Isolamento `tenantId`; soft-delete ticket non cancella eventi
**Status:** Done 2026-10-29 (`TicketEventType` + append-only repo)

**Files probabili**
- `prisma/schema.prisma` (`TicketEvent`)
- `src/domain/tickets/ticket-events.ts`
- `src/app/api/.../tickets/[id]/events/route.ts`
- `tests/tickets/ticket-events.test.ts`

---

### T3.3 — Vendor RBAC scope + inbox (liste)

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E06-01` (liste + isolamento) |
| **Deps** | T3.1 (opz. badge unread); Membership `vendorId` S1/S2; assign S2 |

**AC**
- [x] Utente ruolo `vendor` vede **solo** ticket con `ticket.vendorId === membership.vendorId` **e** stesso `tenantId`
- [x] Liste tab: **Da fare** (`assigned`), **In corso** (`in_progress`, `waiting_parts`), **Chiusi** (`done`, `verified`) — copy IT
- [x] Deny: ticket di altro vendor / altro tenant → 404/403 (stesso messaggio, no leak)
- [x] Empty state IT (“Nessun ticket assegnato”)
- [x] Test smoke allineati a `RBAC.md` riga “Aggiornare stato vendor path” / note vendor
**Status:** Done 2026-10-29 (`/vendor/inbox`)

**Files probabili**
- `src/app/(vendor)/vendor/inbox/page.tsx`
- `src/server/tickets/vendor-scope.ts`
- `src/app/api/vendor/tickets/route.ts`
- `tests/rbac/vendor-scope.test.ts`

---

### T3.4 — Dettaglio ticket vendor (mobile ~390px)

| | |
|--|--|
| **Size** | **S** |
| **Story** | `US-E06-01` (dettaglio) |
| **Deps** | T3.3 |

**AC**
- [x] Dettaglio: indirizzo store, contatto, asset (se presente), foto (signed URL SeaweedFS), descrizione, **SLA due** + badge lettura (ok / a rischio / breached — logica badge condivisa con E05)
- [x] UI usabile a **~390px** per aggiornamento stato in campo (bottoni tap-friendly)
- [x] Loading / error IT; deep link da notifica (path stabile `/vendor/tickets/[id]`)
**Status:** Done 2026-10-29

**Files probabili**
- `src/app/(vendor)/vendor/tickets/[id]/page.tsx`
- `src/components/vendor/ticket-detail.tsx`
- `src/components/sla/sla-badge.tsx` (riuso)

---

### T3.5 — Transizioni vendor: assigned → in_progress → waiting_parts

| | |
|--|--|
| **Size** | **S** |
| **Story** | `US-E06-02` (path intermedio) |
| **Deps** | T3.3, T3.2 |

**AC**
- [x] Solo `vendor` (scope proprio) o ops/admin/owner possono muovere sul path vendor
- [x] Transizioni legali: `assigned`→`in_progress`; `in_progress`↔`waiting_parts`; da questi **non** si salta a `verified`
- [x] Ogni cambio → `TicketEvent` + (se previsto) Notification interna minima ops opzionale (non spam)
- [x] Transizione illegale → errore dominio chiaro IT
**Status:** Done 2026-10-29

**Files probabili**
- `src/domain/tickets/status-machine.ts`
- `src/app/api/vendor/tickets/[id]/status/route.ts`
- `tests/tickets/vendor-transitions.test.ts`

---

### T3.6 — Chiusura `done`: foto + `actual_cost` + report

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E06-02` (chiusura); prepara `US-E07-02` campi |
| **Deps** | T3.5, Attachment S2, T3.1, T3.2 |

**AC**
- [x] Transizione a `done` **solo se**: ≥1 allegato foto SeaweedFS caricato in chiusura (o flag `kind=closing`), `actual_cost` EUR obbligatorio (>0 o ≥0 documentato), report testo obbligatorio; `estimated_cost` opzionale
- [x] Senza foto o senza `actual_cost` → reject validazione (nessuno stato `done`)
- [x] Su successo: Notification + enqueue email **done** → ops + store (regole T3.1)
- [x] `TicketEvent` `status_changed` + `cost_set`
- [x] Vendor vede i costi solo sui propri ticket (RBAC ◐)
**Status:** Done 2026-10-29 (Mailpit smoke = follow-up)

**Files probabili**
- `src/domain/tickets/complete-work.ts`
- `src/app/api/vendor/tickets/[id]/complete/route.ts`
- `src/components/vendor/complete-work-form.tsx`
- `src/emails/ticket-done.tsx` (o template HTML)
- `tests/tickets/complete-work.test.ts`

---

### T3.7 — Email residuali: breach, verified, reject (+ idempotenza)

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E08-01` (completo) |
| **Deps** | T3.1; template nuovo/assign già S2 |

**AC**
- [x] Template IT HTML/testo: **breach SLA**, **done** (se non già in T3.6), **verified**, **rifiuto verify**
- [x] Invio solo via worker `email.send` + SMTP (Mailpit in dev) — **no** Resend/Postmark
- [x] Idempotenza anti-spam: stessa chiave logica (es. `ticketId+type+dedupeKey`) non genera doppio invio per breach finché ticket non resolved/re-open path
- [ ] QA: messaggi ispezionabili in UI Mailpit (Review umana)
**Status:** Done dominio 2026-10-29; Mailpit UI = Review

**Files probabili**
- `src/emails/ticket-breach.tsx`
- `src/emails/ticket-verified.tsx`
- `src/emails/ticket-rejected.tsx`
- `src/workers/email-send.ts`
- `src/domain/notifications/email-dedupe.ts`
- `tests/emails/dedupe.test.ts`

---

### T3.8 — Verifica store / reject → `in_progress`

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E07-01` |
| **Deps** | T3.6, T3.1, T3.2, T3.7 |

**AC**
- [x] `done` → `verified` **solo** da ruoli con `verifyTicket` + store scope (owner/admin/store; ops ❌ per RBAC)
- [x] Rifiuto: `done` → `in_progress` + **motivo obbligatorio**; notifica ops + vendor (in-app + email)
- [x] Su `verified`: campi chiave immutabili (`actual_cost`, status, vendorId, storeId, category…); note **append-only**
- [x] `TicketEvent` `verified` / `rejected`
**Status:** Done 2026-10-29

**Files probabili**
- `src/domain/tickets/verify.ts`
- `src/app/(store)/tickets/[id]/verify/actions.ts`
- `src/app/api/tickets/[id]/verify/route.ts`
- `src/app/api/tickets/[id]/reject/route.ts`
- `tests/tickets/verify-reject.test.ts`

---

### T3.9 — Costi EUR per store (read scope + immutabilità)

| | |
|--|--|
| **Size** | **S** |
| **Story** | `US-E07-02` |
| **Deps** | T3.6, T3.8 |

**AC**
- [x] Campi `estimated_cost`, `actual_cost` in EUR (centimes/`Decimal` Prisma — una sola convenzione documentata)
- [x] Store membership: read costi sui propri ticket dopo `done`/`verified`
- [x] `viewer_finance`: read-only su chiusi/verificati (nessuna mutation) — preparare gate API anche se dashboard S4
- [x] Aggregazioni HQ **non** richieste in S3 (solo dati pronti per E09)
**Status:** Done 2026-10-29 (`money.md` + `canReadTicketCosts` + immutabilità)

**Files probabili**
- `src/domain/tickets/costs.ts`
- `src/components/tickets/cost-fields.tsx`
- `tests/rbac/costs.test.ts`
- `docs/product/money.md` (breve nota EUR)

---

### T3.10 — Job `sla.check_breaches` idempotente + badge + escalation

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E05-02` |
| **Deps** | `sla_due_at` S2; T3.1; T3.2; T3.7; worker E00 |

**AC**
- [x] Job ricorrente pg-boss nome coda **`sla.check_breaches`** (schedule con `key`/`singletonKey` unici — no overwrite silenzioso)
- [x] Seleziona ticket aperti non ancora breached con `sla_due_at < now()` (timezone store già applicata a creazione)
- [x] Update **condizionale** `sla_breached_at = now() WHERE sla_breached_at IS NULL` → **idempotente** anche con delivery at-least-once
- [x] Una sola Notification breach + una sola email ops per ticket finché non resolved/`verified` (o policy “fino a resolved” del backlog)
- [x] Badge UI: **ok** / **a rischio** / **breached** (vendor detail)
- [x] Ops: azione **Rilancio** (nota + re-notify) **oppure** **Riassegnazione** vendor → eventi `sla_relaunch` / `assigned`
- [x] Worker Compose healthy; log JSON senza stack spam
- [x] `singletonKey` / schedule key documentati in `docs/ops/JOBS.md` (breve)
**Status:** Done 2026-10-29

**Files probabili**
- `src/workers/sla-check-breaches.ts`
- `src/domain/sla/breach.ts`
- `src/domain/sla/badge.ts`
- `src/app/api/ops/tickets/[id]/relaunch/route.ts`
- `src/app/api/ops/tickets/[id]/reassign/route.ts`
- `tests/sla/breach-idempotent.test.ts`
- `docs/ops/JOBS.md`

---

### T3.11 — Bell UI in-app

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E08-02` (+ consumo T3.1) |
| **Deps** | T3.1; preferibilmente dopo T3.6–T3.10 per avere tipi reali |

**AC**
- [x] Icona campanella in shell autenticata (HQ / store / vendor)
- [x] Unread count (`readAt IS NULL`) scoped `tenantId` + `userId`
- [x] Pannello: lista recente IT; mark one read; mark all read
- [x] Deep link → dettaglio ticket corretto per ruolo (`/app/tickets/...`, `/vendor/tickets/...`) con **re-check** RBAC al land
- [x] Polling leggero (es. 30s) o refresh on focus — **niente** WebSocket obbligatorio MVP; **niente** Redis obbligatorio
**Status:** Done 2026-10-29

**Files probabili**
- `src/components/notifications/notification-bell.tsx`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/unread-count/route.ts`
- `src/app/api/notifications/[id]/read/route.ts`
- `tests/notifications/bell-api.test.ts`

---

### T3.12 — Timeline UI `TicketEvent` completa

| | |
|--|--|
| **Size** | **S** |
| **Story** | `US-E10-01` (UI) |
| **Deps** | T3.2; alimentata da T3.5–T3.10 |

**AC**
- [x] Timeline sul dettaglio ticket (ops/store/vendor in read secondo scope): actor, tipo, from→to, timestamp, meta essenziale (costo, motivo reject, breach)
- [x] Copy IT; ordinamento cronologico
- [x] Nessuna azione UI di edit/delete eventi
**Status:** Done 2026-10-29 (`TicketTimeline`)

**Files probabili**
- `src/components/tickets/ticket-timeline.tsx`
- `src/app/(app)/tickets/[id]/page.tsx` (integrazione)
- `tests/e2e/timeline-smoke.spec.ts` (opz.)

---

### T3.13 — E2E Flusso A → `verified`

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E13-01` (completo) |
| **Deps** | T3.3–T3.12 (path verticale intero) |

**AC** (scenario: “Frigo banco 2 non raffredda”, critical, 2 foto)
- [x] Store apre `open` con 2 allegati SeaweedFS
- [x] Ops: email + notification; triage → assign vendor refrigerazione; SLA 4h valorizzato
- [x] Vendor: email + inbox → `in_progress` → `done` (foto chiusura + `actual_cost`)
- [x] Store verifica → `verified`; costi/tempo visibili a livello ticket/store
- [x] 1 transizione illegale rifiutata sul path
- [x] Isolamento tenant verificato sul path (tentativo cross-tenant deny)
**Status:** Done 2026-10-29 (`flusso-a-verified.test.ts` + `FLUSSO_A_S3.md`)

**Files probabili**
- `docs/qa/FLUSSO-A.md`
- `tests/e2e/flusso-a.spec.ts`
- `scripts/qa/seed-flusso-a.ts` (opz.)

---

### T3.14 — E2E Flusso B — Breach SLA

| | |
|--|--|
| **Size** | **M** |
| **Story** | `US-E13-02` |
| **Deps** | T3.10, T3.11, T3.7, T3.2 |

**AC**
- [x] Ticket con `sla_due_at` nel passato (seed/test clock)
- [x] Job marca `slaBreachedAt` + badge **breached**
- [x] Notifica email + in-app a ops **una sola volta** (ripetere job 2–3 volte)
- [x] Ops esegue **rilancio** (nota + re-notify) **oppure** riassegna vendor
- [x] Eventi timeline: `sla_breached` + `sla_relaunch` o `assigned`
**Status:** Done 2026-10-29 (`flusso-b-breach.test.ts` + `FLUSSO_B_S3.md`)

**Files probabili**
- `docs/qa/FLUSSO-B.md`
- `tests/e2e/flusso-b.spec.ts`
- `tests/sla/flusso-b-idempotency.test.ts`

---

## 6. Mappa Story → Task

| Story | Task |
|-------|------|
| US-E08-03 | T3.1 |
| US-E10-01 | T3.2, T3.12 |
| US-E06-01 | T3.3, T3.4 |
| US-E06-02 | T3.5, T3.6 |
| US-E08-01 | T3.7 (+ email done in T3.6) |
| US-E07-01 | T3.8 |
| US-E07-02 | T3.9 (campi; aggregati HQ → S4) |
| US-E05-02 | T3.10 |
| US-E08-02 | T3.11 |
| US-E13-01 | T3.13 |
| US-E13-02 | T3.14 |

**Conteggio task:** **14** (T3.1–T3.14) · Size: **S×4** (T3.4, T3.5, T3.9, T3.12) + **M×10**

---

## 7. Checkpoints (incrementali)

| CP | Quando | Criterio “verde” |
|----|--------|------------------|
| **CP0** | Day 0 | Branch da `develop`; Compose up; smoke S2 Flusso A → `assigned` ancora ok |
| **CP1** | Fine T3.1–T3.2 | Notification rules + TicketEvent append-only testati |
| **CP2** | Fine T3.3–T3.6 | Vendor inbox mobile; `done` con foto+`actual_cost`; email done in Mailpit |
| **CP3** | Fine T3.7–T3.9 | Verify/reject→`in_progress`; costi immutabili post-`verified` |
| **CP4** | Fine T3.10–T3.12 | Breach job idempotente; bell; timeline piena |
| **CP5** | Fine T3.13–T3.14 | **Exit:** Flusso A → `verified` + Flusso B ops notified ×1 |

Ogni CP: aggiornare checkbox story in `BACKLOG.md` per quanto chiuso; verify report se slice M.

---

## 8. Piano settimane

### Settimana 1 — “Vendor chiude con prove”

| Giorno | Focus | Task |
|--------|-------|------|
| G1 | Notification + destinatari; TicketEvent tipi | T3.1, avvio T3.2 |
| G2 | Chiudere T3.2; inbox vendor RBAC | T3.2, T3.3 |
| G3 | Dettaglio mobile + transizioni intermedie | T3.4, T3.5 |
| G4 | Complete work foto+costo | T3.6 |
| G5 | Email residuali + buffer bugfix vendor | T3.7; **CP2** |

**Daily async (template):** ieri / oggi / blocker (es. signed URL closing photo, dedupe email).

### Settimana 2 — “Verify + breach vivo + E2E”

| Giorno | Focus | Task |
|--------|-------|------|
| G6 | Verify / reject | T3.8 |
| G7 | Costi + job breach | T3.9, T3.10 |
| G8 | Bell + timeline | T3.11, T3.12 · **CP4** |
| G9 | Flusso A E2E | T3.13 |
| G10 | Flusso B E2E + harden + Review | T3.14 · **CP5** · retro draft |

**Buffer:** se T3.10 scivola, **non** tagliare idempotenza — piuttosto ritardare polish UI timeline (T3.12 resta P0 ma può seguire subito dopo breach green).

---

## 9. Exit criterion (Sprint 3)

**Flusso A completo fino a `verified` (foto+costi+timeline+notifiche) e Flusso B con breach pg-boss che notifica ops una sola volta (email + bell), su stack Compose OSS healthy.**

Checklist exit:
- [ ] Tutti i task T3.1–T3.14 Done (o drop esplicito documentato — nessuno drop previsto)
- [ ] `US-E06-*`, `US-E07-*`, `US-E05-02`, `US-E08-01…03`, `US-E10-01`, `US-E13-01`, `US-E13-02` spuntati in `BACKLOG.md`
- [ ] Test isolamento vendor + tenant verdi
- [ ] Mailpit: sequenze A e B ispezionate
- [ ] Worker: `sla.check_breaches` + `email.send` senza errori critici
- [ ] Increment su `develop` via PR feature
- [ ] Retro: `docs/product/retros/S3-YYYY-MM-DD.md`

---

## 10. Carry-over (se non entra)

| Item | Condizione | Destinazione |
|------|------------|--------------|
| Polish a11y vendor 390px esteso | Solo se WCAG oltre smoke | `US-E10-02` (S4) |
| Aggregati costi HQ / MTTR | Mai in S3 | `US-E09-01` |
| Audit config membership | Fuori scope | `US-E10-08` stretch S4 / F2 |
| Re-notify breach “manuale ripetibile” oltre relaunch | Se ambiguo | chiarire in Review; default = relaunch crea **nuova** email ops con nuovo dedupeKey |
| Indici perf lista HQ | Non bloccante | S4 buffer |

**Regola:** non portare in S4 pezzi che spezzano Exit (breach idempotente e Flusso A→verified sono non-negoziabili).

---

## 11. Handoff → Sprint 4

**Sprint Goal S4 (bozza):** Dashboard HQ (+ `viewer_finance`) + harden NFR (a11y/empty, obs/backup, seed 15×5, soft-delete, i18n, security) + GDPR base; exit pilota usabile.

| Input da S3 | Consumato in S4 da |
|-------------|-------------------|
| `actual_cost` / `verified` / `sla_breached_at` affidabili | `US-E09-01` MTTR + costi periodo |
| Notification + bell stabili | Dashboard deep links / empty states |
| Timeline TicketEvent | Audit UX + eventuale stretch `US-E10-08` |
| Job pg-boss collaudati | Hook `gdpr.purge` / retention `US-E12-01` |
| Seed QA Flusso A/B | Estendere a `US-E10-04` seed pilota |

**Dipendenze da chiudere prima di coding S4:** open decision SMTP prod; conferma metriche MTTR solo su `verified`.

**DoD S4:** richiamo globale + p95 lista HQ &lt;300ms su seed + backup documentato + zero SaaS a pagamento.

---

## 12. Rischi & focus espliciti (anti-deriva)

1. **Vendor RBAC scope** — ogni query vendor con `tenantId` **e** `vendorId`; test deny obbligatori (T3.3).
2. **`done` con foto + `actual_cost`** — gate duro in dominio, non solo UI (T3.6).
3. **Store verify / reject → `in_progress`** — motivo obbligatorio; immutabilità post-`verified` (T3.8).
4. **`sla.check_breaches` idempotente** — update condizionale + dedupe email/notification (T3.10, T3.14).
5. **Bell UI** — unread per user+tenant; deep link con re-authz (T3.11).
6. **Timeline `TicketEvent` piena** — ogni ramo A/B lascia traccia (T3.2, T3.12).
7. **E2E A e B** — unici gate di uscita sprint (T3.13, T3.14).

---

## 13. Riferimenti rapidi

| Doc | Path |
|-----|------|
| Product Backlog | [`../BACKLOG.md`](../BACKLOG.md) |
| Stack OSS | [`../STACK.md`](../STACK.md) |
| RBAC | [`../RBAC.md`](../RBAC.md) |
| DoD | [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) |
| pg-boss intro (at-least-once) | https://pgboss.io/introduction |
| pg-boss scheduling | https://pgboss.io/api/scheduling |
