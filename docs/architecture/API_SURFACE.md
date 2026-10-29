# FacilityFlow Retail — API surface (high-level)

> Mappa concettuale **Route Handlers + Server Actions** per dominio. Non è OpenAPI.  
> Ogni chiamata dominio richiede sessione Auth.js + Membership attiva + filtro `tenantId`.  
> Ruoli: vedi `docs/product/RBAC.md`. ◐ = limitato a store/vendor scope.

Legenda metodi: `GET` lettura · `POST` creazione · `PATCH` aggiornamento parziale · `DELETE` soft-delete / revoke · `ACTION` Server Action (mutation UI).

---

## Auth

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| `/api/auth/[...nextauth]` | *Auth.js* | Login, logout, session, CSRF | pubblico / autenticato |
| `POST` signup HQ | `POST` / `ACTION` | Crea Tenant + Membership `owner` + conferma email | pubblico |
| `POST` invite accept | `POST` / `ACTION` | Consuma Invite → Membership | token invite |
| `POST` password forgot/reset | `POST` | Reset via SMTP | pubblico (rate-limited) |
| `GET` session / me | `GET` | User + Membership corrente (ruolo, storeIds, vendorId) | autenticato |

---

## Stores

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Lista store | `GET` | Elenco tenant (filtri città/attivi) | owner, admin_hq, ops_coordinator; store_* ◐ propri |
| Dettaglio store | `GET` | Anagrafica + contatti | come sopra |
| Crea / aggiorna store | `POST` / `PATCH` | CRUD anagrafica | owner, admin_hq, ops_coordinator |
| Soft-delete / restore store | `DELETE` / `POST` restore | Blocca nuovi ticket se deleted | owner, admin_hq (+ restore policy) |
| Import CSV store | `POST` | Bulk onboarding | owner, admin_hq, ops_coordinator |
| Membership user↔store | `POST` / `PATCH` | Aggiorna `storeIds` Membership | owner, admin_hq, ops_coordinator |

---

## Vendors

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Lista / dettaglio vendor | `GET` | Anagrafica, trades, coverage | owner, admin_hq, ops_coordinator; vendor ◐ sé |
| CRUD vendor + coverage | `POST` / `PATCH` / `DELETE` | Manutentori e store coverage | owner, admin_hq, ops_coordinator |
| Inbox vendor | `GET` | Ticket assegnati (da fare / in corso / chiusi) | vendor ◐ |

---

## Assets

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Lista asset per store | `GET` | Registry leggero (+ autocomplete) | HQ; store_* ◐ |
| CRUD asset | `POST` / `PATCH` / `DELETE` | Categoria, label, preferred vendor | HQ; store_* ◐ |
| Suggest preferred vendor | `GET` | Suggerimento triage (non auto-assign) | ops / HQ in triage |

---

## Tickets

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Lista ticket | `GET` | Filtri stato/store/vendor/priorità/SLA/date | HQ; store_* ◐; vendor ◐ assegnati; viewer_finance **** chiusi/verificati |
| Dettaglio + timeline | `GET` | Ticket + TicketEvent + allegati + costi + SLA | come scope sopra; note interne solo HQ |
| Crea ticket (web / deep link) | `POST` / `ACTION` | Intake: category, priority, desc, foto, asset? → `open` | HQ; store_* ◐ |
| Triage | `PATCH` / `ACTION` | `open`→`triaged`; priorità; note interne | owner, admin_hq, ops_coordinator |
| Assign / dispatch | `PATCH` / `ACTION` | `triaged`→`assigned` + vendorId | owner, admin_hq, ops_coordinator |
| Aggiorna stato vendor path | `PATCH` / `ACTION` | `assigned`→`in_progress`→`waiting_parts`→`done` | vendor ◐; HQ override |
| Chiudi lavoro (`done`) | `PATCH` / `ACTION` | Foto prove + `actual_cost` (+ stima opz.) | vendor ◐; HQ |
| Verify / reject store | `PATCH` / `ACTION` | `done`→`verified` oppure reject → `in_progress` | store_* ◐; HQ verify |
| Cancel | `PATCH` / `ACTION` | →`cancelled` + motivo | owner, admin_hq, ops_coordinator |
| Note (interne / vendor) | `POST` | Append note per canale | HQ interne; vendor note ◐ |
| Upload allegato | `POST` | Presign PUT + crea `Attachment` | scope ticket |
| Download allegato | `GET` | Presign GET a scadenza | scope ticket |
| Soft-delete allegato | `DELETE` | Metadata; GC oggetto opz. | scope + policy |

---

## SLA

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Lista / CRUD SlaPolicy | `GET` / `POST` / `PATCH` / `DELETE` | category+priority → resolutionHours | owner, admin_hq, ops_coordinator |
| Seed policy IT | `POST` (admin/dev) | Template default (frigo 4h, …) | owner, admin_hq (o seed script) |
| Badge / risk su ticket | *derivato* | ok / a rischio / breached da `slaDueAt` | lettori ticket |
| Escalation (re-notify / reassign) | `POST` / `ACTION` | Post-breach ops | owner, admin_hq, ops_coordinator |
| Worker `sla.check_breaches` | *job* | Marca `slaBreachedAt` + notifica idempotente | system |

---

## Notifications

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Lista in-app + unread count | `GET` | Bell UI | autenticato (proprie) |
| Mark read | `PATCH` / `ACTION` | `readAt` | autenticato (proprie) |
| Preferenze destinatari | *config codice* MVP | nuovo→ops; assign→vendor; breach→ops; done→ops+store; verified/reject→ops+vendor | — |
| Worker `email.send` | *job* | Outbox SMTP (template IT) | system |

---

## Dashboard

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Overview HQ | `GET` | Aperti, breached, a rischio, MTTR (`verified`), costi periodo | owner, admin_hq, ops_coordinator; viewer_finance **** read-only |
| Breakdown per store | `GET` | Aggregati costi/MTTR; range default 30g | come sopra |
| Onboarding progress | `GET` | Checklist “primo ticket in 15 min” | owner, admin_hq, ops_coordinator |

---

## GDPR

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| Export tenant | `POST` / `GET` | Pacchetto dati tenant (async se pesante) | owner, admin_hq |
| Retention policy | `GET` | Default 24 mesi post-`verified` (documentata) | owner, admin_hq |
| Purge job | *job* `gdpr.purge` | Hook retention (opz. MVP) | system / owner trigger |

---

## Cross-cutting

| Surface | Method | Purpose | Roles |
|---------|--------|---------|-------|
| `/api/health` | `GET` | Liveness Compose | pubblico |
| Audit TicketEvent | `GET` (via dettaglio) | Timeline immutabile | scope ticket; no PATCH/DELETE eventi |

\*\*\*\* `viewer_finance`: solo read aggregati + ticket chiusi/verificati; nessuna mutation; niente note interne.
