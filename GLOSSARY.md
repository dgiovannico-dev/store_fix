# FacilityFlow Retail

Ubiquitous language for the multi-tenant facility / maintenance System of Record (SoR) for mid-market retail and franchise networks in Italy. UI copy is Italian; code and API identifiers prefer the English canonical term below.

## Tenancy & identity

**Tenant** / **Tenant**:
The isolated customer organization (retail/franchise HQ) that owns stores, vendors, tickets, and policies. Region is EU for MVP.
_Avoid_: Account, organization (as DB entity), company, workspace

**User** / **Utente**:
A person who can authenticate. Exists across tenants only via Membership; not a billable “seat” in MVP.
_Avoid_: Account (prefer User + Membership), member (alone)

**Membership** / **Membership**:
The binding of a User to a Tenant with one role and optional store/vendor scope (`storeIds`, `vendorId`). Soft-disable blocks access without deleting the User.
_Avoid_: Role assignment alone, permission grant, invite (Invite creates Membership)

**Role** / **Ruolo**:
One of: `owner`, `admin_hq`, `ops_coordinator`, `store_manager`, `store_staff`, `vendor`, `viewer_finance`. Defined in `docs/product/RBAC.md`.
_Avoid_: Permission set, profile, group

**Invite** / **Invito**:
A time-limited token that creates a Membership when accepted. Not a permanent domain entity after consumption.
_Avoid_: Share link (generic), magic link (auth mechanism, not invite)

## Network topology

**Store** / **Punto vendita (PV)**:
A physical retail location belonging to a Tenant (address, timezone, contacts). Primary scope for store staff and ticket intake.
_Avoid_: Location (alone), site, branch, shop

**Vendor** / **Fornitore / manutentore**:
An external service company (or internal contractor record) that receives assigned tickets for one or more trades and store coverage.
_Avoid_: Supplier (procurement), contractor (unless meaning Vendor), technician (person ≠ Vendor org)

**Asset** / **Asset**:
A maintainable equipment unit at a Store (category, label, optional preferred Vendor). Optional on a Ticket.
_Avoid_: Equipment (synonym OK in UI), device, machine

**Trade** / **Mestiere / specialità**:
A Vendor capability tag (e.g. HVAC, frigo) used for coverage and triage suggestions — not a separate aggregate in MVP.
_Avoid_: Skill, category (category is Ticket/Asset classification)

## Ticketing

**Ticket** / **Ticket**:
The work order for a maintenance issue at a Store: category, priority, status, optional Asset/Vendor, SLA due, costs, attachments.
_Avoid_: Case, request, work order (as entity name), issue, incident (ITSM)

**Ticket status** / **Stato ticket**:
Canonical machine states: `open` → `triaged` → `assigned` → `in_progress` → `waiting_parts` → `done` → `verified`, plus terminal `cancelled`.
_Avoid_: Stage, phase, workflow step (as synonyms for status enum)

**Triage** / **Triage**:
Ops review of an `open` ticket leading to `triaged` (and later assignment). Includes priority/category adjustment and internal notes.
_Avoid_: Screening, intake (intake is channel; triage is ops action)

**Dispatch** / **Assegnazione (dispatch)**:
Assigning a Vendor to a ticket (`assigned`). Does not invent a separate Dispatch entity in MVP.
_Avoid_: Job (job = background worker), order assignment

**Verified** / **Verificato**:
Terminal success state after Store membership confirms work done. Key fields become immutable; notes remain append-only.
_Avoid_: Closed (ambiguous with `done`), approved, completed (use `done` then `verified`)

**Done** / **Lavoro completato (`done`)**:
Vendor asserts work finished (photos + actual cost required). Awaits Store verification.
_Avoid_: Closed, finished, resolved (SLA “resolved” means post-breach cleared for notifications)

**Cancelled** / **Annullato**:
Terminal abort by HQ/ops with mandatory reason; notifies Store (and Vendor if already assigned).
_Avoid_: Deleted, void

**Reject (verification)** / **Rifiuto verifica**:
Store refuses `done` → returns ticket to `in_progress` with reason; notifies Vendor and ops.
_Avoid_: Cancel (different state), reopen (generic)

**TicketEvent** / **Evento ticket**:
Immutable audit entry for status/assignment/metadata changes. Never updated or deleted.
_Avoid_: Log line, activity (UI), history row (impl)

**Attachment** / **Allegato**:
Metadata row for a file on a Ticket; bytes live in object storage (SeaweedFS). MIME allowlist; max 10MB MVP.
_Avoid_: Upload, media, blob (storage key is infra)

**Internal note** / **Nota interna**:
Comment visible to HQ roles only, not to Vendor or Store in MVP rules.
_Avoid_: Private comment (vague)

**Vendor note** / **Nota vendor**:
Comment visible on the vendor path for assigned tickets.
_Avoid_: Public note

## SLA & ops metrics

**SlaPolicy** / **Policy SLA**:
Tenant template: category + priority → resolution hours. Clock starts at ticket `open`. Changing policy does not recalculate open tickets.
_Avoid_: SLA rule, SLA template (UI OK), contract SLA (legal)

**SLA due** / **Scadenza SLA (`slaDueAt`)**:
Deadline computed at creation from SlaPolicy and Store timezone.
_Avoid_: Due date (generic), ETA

**Breach** / **Breach / violazione SLA**:
Ticket past `slaDueAt` without resolution; recorded as `slaBreachedAt` and notified to ops (idempotent once until resolved).
_Avoid_: Overdue (UI synonym OK), violation (prefer breach), timeout

**At risk** / **A rischio**:
SLA badge when remaining time &lt; 20% of total window (not yet breached).
_Avoid_: Warning, yellow (presentation)

**Escalation** / **Escalation**:
Ops action after breach or risk: re-notify and/or reassign Vendor with a note — not an automatic separate entity in MVP.
_Avoid_: Pager, severity bump (priority change is triage)

**MTTR** / **MTTR**:
Mean time to repair measured to `verified` (gross MVP metric on HQ dashboard).
_Avoid_: Cycle time, lead time

## Costs & notifications

**Estimated cost** / **Costo stimato**:
Optional EUR estimate on the Ticket (vendor path). Immutable after `verified`.
_Avoid_: Quote, bid

**Actual cost** / **Costo effettivo**:
Required EUR amount on `done`. Immutable after `verified`. Source for store cost aggregates.
_Avoid_: Invoice amount, spend (aggregate)

**Notification** / **Notifica**:
In-app bell item for a User (type, optional ticket, payload, `readAt`). Distinct from email outbox jobs.
_Avoid_: Alert (SLA badge ≠ Notification), message, email (channel)

**Email outbox** / **Outbox email**:
Durable send intent processed by the worker (`email.send`). Infra pattern, not a product aggregate users edit.
_Avoid_: Notification (in-app entity)

## Channels & compliance

**Intake** / **Intake**:
How a Ticket enters the SoR (web store UI, deep-link kiosk). WhatsApp Business API is out of scope as SoR.
_Avoid_: Channel as entity, WhatsApp ticket

**Deep link / kiosk** / **Deep link store**:
Store-scoped URL for fast ticket creation without full HQ navigation.
_Avoid_: QR alone (may launch the link), public form

**System of Record (SoR)** / **Sistema di record**:
Postgres-backed app state for tickets, SLA, membership, costs. AI never replaces SoR.
_Avoid_: Source of truth (synonym OK), CRM

**Soft delete** / **Soft delete**:
Logical deactivation (`deletedAt`) with tenant-scoped restore rules; Membership soft-disable ≠ User delete.
_Avoid_: Archive (unless documented), hide

**GDPR export / retention** / **Export / retention GDPR**:
Tenant-scoped data export and retention (default 24 months after `verified`) with optional purge job.
_Avoid_: Backup (ops), anonymization (may be later)

## Anti-language (do not invent)

- **Billing / subscription** as product entities — out of MVP scope.
- **Job** for a Ticket — reserve *job* for pg-boss background work.
- **Workspace / org** instead of Tenant.
- **Closed** as a status — use `done` / `verified` / `cancelled`.
