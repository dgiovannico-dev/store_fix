# Sprint 1 — Platform OSS + rete configurabile

> **Fonte:** [`../BACKLOG.md`](../BACKLOG.md) · [`../STACK.md`](../STACK.md) · [`../RBAC.md`](../RBAC.md)  
> **Branch di integrazione:** `develop` (GitFlow)  
> **Lingua UI:** italiano  
> **Vincolo:** OSS-only — nessun SaaS a pagamento nel path critico  
> **Stato:** Sprint Backlog pianificato — **nessuna implementazione** finché non avviata esplicitamente

---

## Meta

| Campo | Valore |
|-------|--------|
| **Sprint** | S1 |
| **Lunghezza** | 2 settimane |
| **Date** | _TBD_ → _TBD_ (placeholder) |
| **Capacità stimata** | ~1–2 FTE · ~20–28 punti utili (t-shirt aggregata XL → spezzata in task S/M) |
| **Base branch** | `develop` |
| **Feature branch tipici** | `feature/S1-E00-compose`, `feature/S1-E01-auth`, `feature/S1-E02-onboarding`, … |
| **PR target** | `develop` |
| **DoD globale** | [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md) |
| **Verify** | `.cursor/rules/post-dev-verify.mdc` (compose + typecheck + test) |

### Rischi (S1)

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| Auth.js Credentials + session DB-backed non banale | Alto | Task dedicati; adapter Prisma; test sessione; rate limit subito |
| SeaweedFS S3 gateway fragile in Compose | Medio | Init bucket script + healthcheck; signed URL smoke test |
| Scope S1 XL (E00+E01+E02+E03) | Alto | Task ≤ M; checkpoint ogni 3–5 task; drop checklist polish se in ritardo |
| Membership scope store/vendor incompleto | Alto | Test isolamento tenant **e** store-scope espliciti |
| Flusso C hard (ticket) fuori S1 | Basso | Soft gate: solo setup rete; ticket = S2 |

### Assunzioni di planning

1. Greenfield Next.js App Router + Prisma + Compose (repo oggi solo docs).
2. SLA default seed minimo in checklist (policy CRUD completa = S2 / US-E05-01).
3. Template email IT skeleton in S1; eventi ticket completi = S2–S3.
4. `DEFINITION_OF_DONE.md` è la checklist globale; sotto si aggiunge exit S1.

---

## Sprint Goal

**Platform OSS healthy + HQ signup + membership + store/vendor + asset CRUD + Flusso C setup soft.**

In una frase: da zero a tenant isolato con rete (store, vendor, utenti, asset) su stack Compose riproducibile, senza ancora ticket production-ready.

---

## Definition of Done

Riferimento obbligatorio: [`DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md).

**Exit aggiuntivi Sprint 1**

- [ ] `docker compose up -d --build` → servizi `app`, `worker`, `postgres`, `seaweedfs`, `mailpit` (profile `dev`) healthy
- [ ] Typecheck + lint + test unit/integration rilevanti verdi
- [ ] Nessun leak cross-tenant su store/vendor/asset/membership (test automatici)
- [ ] RBAC.md allineato + smoke deny/allow azioni S1 (CRUD rete / invite)
- [ ] UI IT sulle superfici toccate (signup, login, store, vendor, asset, checklist)
- [ ] Nessun servizio SaaS a pagamento introdotto
- [ ] Increment su `develop` potenzialmente rilasciabile (stack + onboarding rete)
- [ ] Soft gate `US-E13-03`: setup rete misurabile senza SQL (ticket prova = S2)

---

## Ordered task list

> Ordine = grafo dipendenze. Size: **XS** &lt; ~0.5g · **S** ~0.5–1g · **M** ~1–2g. **Mai XL.**

---

### T1.1 — Scaffold Next.js App Router + tooling

**Story:** US-E00-01 (prep)  
**Description:** Inizializzare app TypeScript App Router, Tailwind, ESLint, script `typecheck`/`lint`/`test`, struttura cartelle `app/`, `src/`, `prisma/`. Nessun SaaS.  
**Acceptance criteria:**
- [ ] Progetto Next.js + TS avviabile in locale
- [ ] Script npm: `typecheck`, `lint`, `test` documentati in README breve
- [ ] Nessuna dipendenza Clerk/Neon/Resend/Inngest/Sentry Cloud  
**Verification:** typecheck · lint · `next build` smoke  
**Dependencies:** nessuna  
**Files likely:** `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `README.md`  
**Size:** M

---

### T1.2 — Docker Compose: Postgres + healthcheck

**Story:** US-E00-01  
**Description:** Servizio `postgres` (16) con volume, healthcheck, variabili da `.env.example`.  
**Acceptance criteria:**
- [ ] `docker compose up -d postgres` healthy
- [ ] Credenziali solo in env / `.env.example` (no secret reali committed)
- [ ] Porta documentata  
**Verification:** compose health · manual `psql`  
**Dependencies:** T1.1  
**Files likely:** `docker-compose.yml`, `.env.example`, `docs/ops/COMPOSE.md`  
**Size:** S

---

### T1.3 — Compose: servizi app + `/api/health`

**Story:** US-E00-01  
**Description:** Dockerfile app, servizio Compose `app`, endpoint health per post-dev-verify.  
**Acceptance criteria:**
- [ ] `GET /api/health` → 200 con status ok
- [ ] Healthcheck Compose su app
- [ ] `docker compose up -d --build` avvia almeno postgres+app  
**Verification:** compose · curl health · typecheck  
**Dependencies:** T1.2  
**Files likely:** `Dockerfile`, `docker-compose.yml`, `app/api/health/route.ts`  
**Size:** S

---

### T1.4 — Prisma schema baseline + migrazione iniziale

**Story:** US-E00-05  
**Description:** Schema Prisma per tutte le entità del modello dati MVP (Tenant, User, Membership, Store, Vendor, Asset, SlaPolicy, Ticket, TicketEvent, Attachment, Notification + tabelle Auth.js). Soft-delete dove previsto.  
**Acceptance criteria:**
- [ ] Migrazione applicabile da zero su Postgres Compose
- [ ] Indici su `tenantId` per entità tenant-scoped
- [ ] Nessun campo che violi isolamento (sempre `tenantId` su dominio)  
**Verification:** `prisma migrate deploy` su Compose · typecheck  
**Dependencies:** T1.2  
**Files likely:** `prisma/schema.prisma`, `prisma/migrations/**`  
**Size:** M

---

### T1.5 — Seed minimo tenant demo (opzionale documentato)

**Story:** US-E00-05  
**Description:** Seed leggero (1 tenant + owner) per smoke; seed pilota 15×5 resta `US-E10-04` (S4).  
**Acceptance criteria:**
- [ ] `prisma db seed` documentato
- [ ] Credenziali solo locale; non per produzione  
**Verification:** seed + login smoke (dopo auth) · manual  
**Dependencies:** T1.4  
**Files likely:** `prisma/seed.ts`, `docs/ops/COMPOSE.md`  
**Size:** S

---

### Checkpoint A — Foundation DB

Dopo T1.1–T1.5: Postgres up, schema migrato, health app ok. **Gate:** migrate da zero verde.

---

### T1.6 — SeaweedFS in Compose + init bucket

**Story:** US-E00-02  
**Description:** Servizio SeaweedFS (S3 API), script init bucket allegati all’avvio.  
**Acceptance criteria:**
- [ ] Bucket creato automaticamente
- [ ] Nessun binario in Postgres
- [ ] Env S3 endpoint/keys in `.env.example`  
**Verification:** compose · script init · manual list bucket  
**Dependencies:** T1.2  
**Files likely:** `docker-compose.yml`, `scripts/seaweed-init.sh`, `docs/ops/COMPOSE.md`  
**Size:** M

---

### T1.7 — Client storage S3 + signed URL + MIME allowlist

**Story:** US-E00-02  
**Description:** Adapter upload/download S3-compatible (max 10MB, jpeg/png/webp); URL firmati a scadenza.  
**Acceptance criteria:**
- [ ] Upload &lt;10MB ok; MIME non in allowlist rifiutato
- [ ] Signed GET con TTL documentato
- [ ] Test unit/integration su allowlist + size  
**Verification:** test · manual upload smoke  
**Dependencies:** T1.6  
**Files likely:** `src/infra/storage/**`, `src/infra/storage/*.test.ts`  
**Size:** M

---

### T1.8 — Mailpit + Nodemailer SMTP config

**Story:** US-E00-03  
**Description:** Profile `dev` Mailpit; provider SMTP configurabile; UI Mailpit raggiungibile.  
**Acceptance criteria:**
- [ ] Mailpit UI locale documentata
- [ ] Nessuna dipendenza Resend/Postmark
- [ ] Invio test “hello” arriva in Mailpit  
**Verification:** compose · manual Mailpit  
**Dependencies:** T1.3  
**Files likely:** `docker-compose.yml`, `src/infra/email/mailer.ts`, `.env.example`  
**Size:** S

---

### T1.9 — Outbox email skeleton + template IT base

**Story:** US-E00-03  
**Description:** Struttura template HTML/testo IT (nuova, assign, breach, done, verified) anche se eventi ticket non ancora wired; enqueue stub.  
**Acceptance criteria:**
- [ ] 5 template IT presenti (placeholder ok)
- [ ] API interna `enqueueEmail` collaudabile con Mailpit  
**Verification:** test template render · manual send  
**Dependencies:** T1.8  
**Files likely:** `src/infra/email/templates/**`, `src/infra/email/outbox.ts`  
**Size:** M

---

### T1.10 — Worker container + pg-boss bootstrap

**Story:** US-E00-04  
**Description:** Processo `worker` in Compose; avvio pg-boss su Postgres; code `email.send` e stub `sla.check_breaches`.  
**Acceptance criteria:**
- [ ] Worker healthy e consuma `email.send`
- [ ] Retry/backoff configurati; fallimenti ispezionabili (log)
- [ ] Nessun Redis obbligatorio  
**Verification:** compose · enqueue job → Mailpit · log worker  
**Dependencies:** T1.4, T1.9  
**Files likely:** `apps/worker/**` o `src/worker/**`, `Dockerfile.worker`, `docker-compose.yml`  
**Size:** M

---

### Checkpoint B — Platform OSS core

Dopo T1.6–T1.10: SeaweedFS + Mailpit + worker email. **Gate:** `compose up` full stack verde; email via worker in Mailpit.

---

### T1.11 — Auth.js: adapter Prisma + sessioni DB

**Story:** US-E01-02  
**Description:** Config Auth.js v5 con adapter Prisma, session strategy database-compatible (gestione Credentials), cookie httpOnly.  
**Acceptance criteria:**
- [ ] Sessioni persistite in Postgres
- [ ] Cookie httpOnly; CSRF-safe su mutation Auth.js
- [ ] Nessun IdP SaaS  
**Verification:** typecheck · test sessione · manual login stub  
**Dependencies:** T1.4  
**Files likely:** `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `prisma/schema.prisma`  
**Size:** M

---

### T1.12 — Signup HQ: Tenant + membership owner

**Story:** US-E01-01  
**Description:** Registrazione email/password; creazione atomica Tenant + Membership `owner`; redirect onboarding.  
**Acceptance criteria:**
- [ ] Signup crea Tenant + owner
- [ ] Password hashed (argon2/bcrypt)
- [ ] Redirect a onboarding guidato
- [ ] UI IT  
**Verification:** test integration · manual signup  
**Dependencies:** T1.11, T1.8  
**Files likely:** `app/(auth)/signup/**`, `src/domain/tenancy/**`, `src/app/actions/signup.ts`  
**Size:** M

---

### T1.13 — Conferma email + magic link opzionale

**Story:** US-E01-01  
**Description:** Email verifica via SMTP/Mailpit; provider Email Auth.js (magic link) sullo stesso SMTP.  
**Acceptance criteria:**
- [ ] Link conferma in Mailpit funziona
- [ ] Magic link opzionale documentato
- [ ] Token a scadenza  
**Verification:** compose · Mailpit manual · test token expiry  
**Dependencies:** T1.12, T1.10  
**Files likely:** `src/infra/email/templates/verify*.tsx`, `auth.ts`  
**Size:** M

---

### T1.14 — Login / logout / rate limit auth

**Story:** US-E01-02  
**Description:** Login Credentials, logout invalida sessione, rate limit login/signup (middleware o libreria OSS).  
**Acceptance criteria:**
- [ ] Logout invalida sessione DB
- [ ] Rate limit su login/signup
- [ ] Messaggi errore IT senza leak info utente  
**Verification:** test · manual brute-force soft  
**Dependencies:** T1.11, T1.12  
**Files likely:** `app/(auth)/login/**`, `middleware.ts`, `src/infra/rate-limit.ts`  
**Size:** S

---

### T1.15 — Helper data-layer `tenantId` obbligatorio

**Story:** US-E01-04  
**Description:** API repository/query che forzano `tenantId` (fail-closed se assente); pattern unico per store/vendor/asset.  
**Acceptance criteria:**
- [ ] Helper rifiuta query senza tenant
- [ ] Soft-delete scoped al tenant
- [ ] Documentato uso obbligatorio in data-layer  
**Verification:** unit test fail-closed  
**Dependencies:** T1.4, T1.12  
**Files likely:** `src/infra/db/tenant-scoped.ts`, `src/infra/db/*.test.ts`  
**Size:** S

---

### T1.16 — Test isolamento multi-tenant (foundation)

**Story:** US-E01-01, US-E01-04  
**Description:** Suite automatica: utente tenant A non legge Tenant/Store/Vendor/Asset di B.  
**Acceptance criteria:**
- [ ] Test cross-tenant fail su read/write store (anche se CRUD UI non completo)
- [ ] Fixture due tenant  
**Verification:** test automatici  
**Dependencies:** T1.15, T1.12  
**Files likely:** `tests/isolation/tenant-isolation.test.ts`  
**Size:** M

---

### Checkpoint C — Auth + tenancy

Dopo T1.11–T1.16: signup/login, helper tenant, test isolamento base. **Gate:** due tenant non si vedono.

---

### T1.17 — Artefatto RBAC.md + enum ruoli in codice

**Story:** US-E01-05  
**Description:** Allineare enum ruoli MVP a `RBAC.md`; helper `can(role, action)`.  
**Acceptance criteria:**
- [ ] Ruoli: owner, admin_hq, ops_coordinator, store_manager, store_staff, vendor, viewer_finance
- [ ] Matrice documentata in sync con codice
- [ ] `viewer_finance` read-only sulle azioni S1 rilevanti (no mutation rete)  
**Verification:** typecheck · unit su `can()`  
**Dependencies:** T1.15  
**Files likely:** `docs/product/RBAC.md`, `src/domain/rbac/**`  
**Size:** S

---

### T1.18 — Inviti email con token a scadenza

**Story:** US-E01-03  
**Description:** Invite crea token + email Mailpit; accept crea/aggiorna Membership.  
**Acceptance criteria:**
- [ ] Token scaduto rifiutato
- [ ] Ruolo assegnabile da admin/owner
- [ ] Email IT in Mailpit  
**Verification:** test · Mailpit manual  
**Dependencies:** T1.17, T1.10, T1.12  
**Files likely:** `src/domain/invites/**`, `app/(app)/settings/invites/**`, `prisma/schema.prisma`  
**Size:** M

---

### T1.19 — Gate API/UI per ruolo (azioni S1)

**Story:** US-E01-03, US-E01-05  
**Description:** Middleware/server actions gated: CRUD store/vendor/invite solo ruoli HQ ammessi.  
**Acceptance criteria:**
- [ ] Smoke deny: store_staff non invita / non CRUD vendor
- [ ] Smoke allow: admin_hq CRUD store
- [ ] Scope `store_*` preparato (enforced con Membership in T1.27+)  
**Verification:** test deny/allow  
**Dependencies:** T1.17, T1.18  
**Files likely:** `src/domain/rbac/guards.ts`, `tests/rbac/s1-actions.test.ts`  
**Size:** M

---

### T1.20 — Reset password

**Story:** US-E01-06  
**Description:** Flusso password dimenticata via email; token scadenza + rate limit; reset invalida sessioni.  
**Acceptance criteria:**
- [ ] Email reset in Mailpit
- [ ] Token one-time / scadenza
- [ ] Sessioni esistenti invalidate post-reset  
**Verification:** test · Mailpit manual  
**Dependencies:** T1.14, T1.10  
**Files likely:** `app/(auth)/forgot-password/**`, `app/(auth)/reset-password/**`  
**Size:** S

---

### Checkpoint D — RBAC + invite

Dopo T1.17–T1.20: invite, gate ruoli, reset password. **Gate:** invite → accept → ruolo applicato; deny smoke verde.

---

### T1.21 — CRUD Store (API + UI IT)

**Story:** US-E02-01  
**Description:** Campi nome, indirizzo, CAP, città, timezone default `Europe/Rome`, contatti; soft delete; empty state CTA.  
**Acceptance criteria:**
- [ ] CRUD completo tenant-scoped
- [ ] Soft delete; store deleted non accettano nuovi ticket (flag/guard pronto)
- [ ] Empty state “Aggiungi il primo punto vendita”  
**Verification:** test · manual UI  
**Dependencies:** T1.15, T1.19  
**Files likely:** `app/(app)/stores/**`, `src/domain/stores/**`  
**Size:** M

---

### T1.22 — Import CSV store

**Story:** US-E02-02  
**Description:** Template CSV IT, validazione riga-per-riga, report errori, max ~200 righe + rate limit.  
**Acceptance criteria:**
- [ ] Template scaricabile
- [ ] Report errori per riga
- [ ] Limite righe + rate limit  
**Verification:** test validazione · manual upload  
**Dependencies:** T1.21  
**Files likely:** `app/(app)/stores/import/**`, `src/domain/stores/csv-import.ts`, `public/templates/stores.it.csv`  
**Size:** M

---

### T1.23 — CRUD Vendor + coverage store

**Story:** US-E02-03  
**Description:** Ragione sociale, email, telefono, trades, coverage storeIds; preferred vendor usabile in triage (campo pronto).  
**Acceptance criteria:**
- [ ] CRUD vendor tenant-scoped + soft delete
- [ ] Coverage multi-store
- [ ] UI IT empty/list/detail  
**Verification:** test · manual  
**Dependencies:** T1.21  
**Files likely:** `app/(app)/vendors/**`, `src/domain/vendors/**`  
**Size:** M

---

### T1.24 — Invite utente role=vendor collegato

**Story:** US-E02-03, US-E01-03  
**Description:** Invite con `vendorId` obbligatorio se role=`vendor`.  
**Acceptance criteria:**
- [ ] Membership vendor senza vendorId rifiutata
- [ ] Accept invita → accesso scope vendor (guard)  
**Verification:** test  
**Dependencies:** T1.18, T1.23  
**Files likely:** `src/domain/invites/**`, `src/domain/memberships/**`  
**Size:** S

---

### T1.25 — Test isolamento Store/Vendor cross-tenant

**Story:** US-E01-04  
**Description:** Suite dedicata: A non legge/aggiorna store/vendor di B; soft-delete non cross-tenant.  
**Acceptance criteria:**
- [ ] Test read/update/delete isolation verdi
- [ ] Inclusi nel CI script `test`  
**Verification:** test automatici  
**Dependencies:** T1.21, T1.23, T1.16  
**Files likely:** `tests/isolation/store-vendor-isolation.test.ts`  
**Size:** S

---

### Checkpoint E — Rete store/vendor

Dopo T1.21–T1.25: store CRUD+CSV, vendor+invite. **Gate:** isolamento store/vendor testato.

---

### T1.26 — Membership user ↔ store / vendor (modello + API)

**Story:** US-E02-05  
**Description:** API per assegnare `storeIds[]` (null/vuoto = HQ all-stores) e `vendorId`; soft-disable membership.  
**Acceptance criteria:**
- [ ] Modifica storeIds senza ricreare utente
- [ ] Soft-disable → accesso bloccato immediatamente
- [ ] vendorId obbligatorio se role=vendor  
**Verification:** test  
**Dependencies:** T1.17, T1.18, T1.21, T1.23  
**Files likely:** `src/domain/memberships/**`, `app/(app)/settings/members/**`  
**Size:** M

---

### T1.27 — Scope enforcement store_manager / store_staff

**Story:** US-E02-05, US-E01-04  
**Description:** Query asset/store filtrate da Membership.storeIds; deny fuori scope.  
**Acceptance criteria:**
- [ ] store_manager A non vede store B
- [ ] Test automatico membership store-scope  
**Verification:** test  
**Dependencies:** T1.26, T1.21  
**Files likely:** `src/domain/rbac/store-scope.ts`, `tests/isolation/membership-store-scope.test.ts`  
**Size:** M

---

### T1.28 — CRUD Asset per store

**Story:** US-E03-01  
**Description:** Categoria (HVAC, frigo, casse, illuminazione, porte, altro), marca/modello, ubicazione, note, preferred_vendor; soft delete; serial/barcode opzionali.  
**Acceptance criteria:**
- [ ] CRUD asset tenant+store scoped
- [ ] Soft delete; ticket storici restano collegabili (FK nullable soft)
- [ ] preferred_vendor opzionale  
**Verification:** test · manual UI  
**Dependencies:** T1.21, T1.23, T1.27  
**Files likely:** `app/(app)/stores/[storeId]/assets/**`, `src/domain/assets/**`  
**Size:** M

---

### T1.29 — Test isolamento Asset (+ soft-delete)

**Story:** US-E01-04, US-E03-01  
**Description:** Cross-tenant e cross-store (membership) su asset.  
**Acceptance criteria:**
- [ ] Tenant A non legge asset B
- [ ] store_staff store1 non legge asset store2  
**Verification:** test automatici  
**Dependencies:** T1.28, T1.27  
**Files likely:** `tests/isolation/asset-isolation.test.ts`  
**Size:** S

---

### Checkpoint F — Membership + asset

Dopo T1.26–T1.29: membership scope + asset CRUD + test. **Gate:** “1 store + 1 vendor + 1 store manager” via Membership.

---

### T1.30 — Checklist onboarding “primo ticket in 15 min”

**Story:** US-E02-04  
**Description:** Step UI: 1 store → 1 vendor → SLA default (seed) → invita store manager → (ticket prova = skip/warn in S1). Progress persistito.  
**Acceptance criteria:**
- [ ] Progress persistito per tenant
- [ ] Skip con warning in dashboard/onboarding
- [ ] Completabile senza SQL fino a invite SM  
**Verification:** manual · test progress state  
**Dependencies:** T1.21, T1.23, T1.26, T1.5  
**Files likely:** `app/(app)/onboarding/**`, `src/domain/onboarding/**`  
**Size:** M

---

### T1.31 — Seed SLA default IT (minimo checklist)

**Story:** US-E02-04 (support), prep US-E05-01  
**Description:** Seed policy minime (frigo critico 4h, HVAC 24h, non critico 72h) per checklist; UI CRUD policy completa = S2.  
**Acceptance criteria:**
- [ ] Policy default create su nuovo tenant (o seed)
- [ ] Visibili in checklist come “SLA default ok”  
**Verification:** test seed · manual  
**Dependencies:** T1.4, T1.12  
**Files likely:** `prisma/seed.ts`, `src/domain/sla/defaults.ts`  
**Size:** S

---

### T1.32 — Soft gate Flusso C (US-E13-03)

**Story:** US-E13-03  
**Description:** QA cronometrata: tenant vuoto → store (CRUD o CSV) → invite store manager → ≥1 vendor → SLA default; **senza** richiedere ticket prova (hard = S2).  
**Acceptance criteria:**
- [ ] Path senza SQL
- [ ] Checklist US-E02-04 completabile su setup rete
- [ ] Tempo wall-clock annotato in nota QA (target &lt;15 min setup; ticket escluso)  
**Verification:** manual QA script · compose healthy  
**Dependencies:** T1.22, T1.24, T1.30, T1.31  
**Files likely:** `docs/qa/flusso-c-s1.md` (checklist QA)  
**Size:** S

---

### T1.33 — Documentazione Compose ops + verify report S1

**Story:** US-E00-01  
**Description:** `docs/ops/COMPOSE.md` (porte, credenziali local, reset volumi); allineare post-dev-verify.  
**Acceptance criteria:**
- [ ] Doc IT completa
- [ ] Comando unico documentato `docker compose up -d --build`
- [ ] Nessun secret reale  
**Verification:** manual follow doc da zero  
**Dependencies:** T1.3, T1.6, T1.8, T1.10  
**Files likely:** `docs/ops/COMPOSE.md`, `.env.example`  
**Size:** S

---

### T1.34 — Smoke RBAC S1 + regression isolation pack

**Story:** US-E01-05, US-E01-04  
**Description:** Pacchetto test unico: deny/allow critici S1 + isolation store/vendor/asset/membership.  
**Acceptance criteria:**
- [ ] Suite verde in CI locale
- [ ] Copre invite, CRUD store/vendor/asset, scope store  
**Verification:** test  
**Dependencies:** T1.19, T1.25, T1.27, T1.29  
**Files likely:** `tests/rbac/**`, `tests/isolation/**`  
**Size:** S

---

### Checkpoint G — Sprint exit soft

Dopo T1.30–T1.34: Flusso C soft + docs + pack test. **Gate:** exit criteria S1 soddisfatti.

---

## Checkpoints (sintesi)

| CP | Dopo task | Criterio go/no-go |
|----|-----------|-------------------|
| A | T1.5 | Migrate da zero + health |
| B | T1.10 | Full compose + email worker |
| C | T1.16 | Auth + isolamento tenant |
| D | T1.20 | Invite + RBAC smoke |
| E | T1.25 | Store/vendor + isolation |
| F | T1.29 | Membership + asset |
| G | T1.34 | Exit S1 / Flusso C soft |

Se un checkpoint fallisce: stop feature nuove, fix, poi riprendi. Non saltare test isolamento.

---

## Day plan Week 1 / Week 2

### Week 1 — Platform + Auth

| Giorni | Focus | Task |
|--------|-------|------|
| G1–G2 | Scaffold + Compose Postgres/app + Prisma | T1.1–T1.5 → **CP A** |
| G3–G4 | SeaweedFS, Mailpit, worker pg-boss | T1.6–T1.10 → **CP B** |
| G5 | Auth session + signup HQ | T1.11–T1.12 |
| Buffer W1 | Conferma email, login/rate limit, helper tenant, test isolation | T1.13–T1.16 → **CP C** |

### Week 2 — Rete + Membership + Asset + Flusso C soft

| Giorni | Focus | Task |
|--------|-------|------|
| G6 | RBAC, invite, gate, reset | T1.17–T1.20 → **CP D** |
| G7 | Store CRUD + CSV | T1.21–T1.22 |
| G8 | Vendor + invite vendor + isolation | T1.23–T1.25 → **CP E** |
| G9 | Membership + scope + Asset + isolation | T1.26–T1.29 → **CP F** |
| G10 | Checklist, SLA seed, Flusso C soft, docs, pack test | T1.30–T1.34 → **CP G** |

Capacità stretta: priorità drop (in ordine) → polish template email → magic link → CSV edge cases → UI asset advanced. **Non droppare:** compose healthy, tenant isolation tests, membership store-scope, exit soft Flusso C.

---

## Sprint Exit Criteria (da BACKLOG)

Da [`../BACKLOG.md`](../BACKLOG.md) — Sprint 1:

- [x] `compose up` verde (app, worker, postgres, seaweedfs, mailpit) — verify locale 2026-10-28
- [x] “1 store + 1 vendor + 1 store manager” via Membership — path UI + test
- [x] Invite visibile in Mailpit — createInvite → SMTP
- [x] `RBAC.md` + test smoke base deny/allow — `can()` + `s1-smoke-pack`
- [x] Soft gate Flusso C: setup rete misurabile (ticket prova non obbligatorio) — `/onboarding` + `docs/qa/flusso-c-s1.md`

**One-liner exit:** *Compose OSS healthy + tenant HQ con rete (store/vendor/membership/asset) isolata e invitabile via Mailpit.*

**Chiusura:** retro [`../retros/S1-2026-10-28.md`](../retros/S1-2026-10-28.md) · handoff S2 sotto.

---

## Carry-over / Out of scope this sprint

| Item | Motivo |
|------|--------|
| US-E03-02 Asset su ticket | Serve lifecycle ticket (S2) |
| US-E04-* Ticket / Attachment entity wiring | S2 |
| US-E05-01 CRUD SlaPolicy completo / clock | Solo seed default in S1; resto S2 |
| US-E05-02 Breach job reale | Stub queue ok; logica S3 |
| US-E08-* Notifiche ticket complete | Skeleton email ok |
| US-E11-01 Deep link | S2 |
| US-E13-01 / E13-02 | S2–S3 |
| US-E13-03 **hard** (ticket &lt;15 min) | Soft only in S1 |
| US-E10-04 Seed pilota 15×5 | S4 |
| Qualsiasi SaaS / WhatsApp Business API / AI | Fuori policy OSS / Fase 2 |

---

## Handoff to Sprint 2

**Sprint 2 Goal (preview):** primo ticket E2E fino ad `assigned` + foto SeaweedFS + Attachment + SLA due + deep link + email nuovo/assign + Flusso A gate assigned + Flusso C **hard**.

**Prerequisiti da lasciare verdi su `develop`:**

1. Compose + worker + Mailpit + SeaweedFS signed URL
2. Auth.js session + invite + Membership store/vendor scope
3. Store CSV + Vendor + Asset CRUD
4. Pacchetto test isolamento + RBAC smoke
5. Checklist onboarding (ticket step ancora warning/skip)

**Primo task suggerito S2:** state machine ticket + create ticket phone-first (US-E04-01) riusando storage T1.7 e membership scope T1.27.

**Branch:** continuare da `develop`; aprire `feature/S2-E04-ticket-lifecycle`.

---

## Tracciabilità story → task

| Story | Task |
|-------|------|
| US-E00-01 | T1.1, T1.2, T1.3, T1.33 |
| US-E00-02 | T1.6, T1.7 |
| US-E00-03 | T1.8, T1.9 |
| US-E00-04 | T1.10 |
| US-E00-05 | T1.4, T1.5 |
| US-E01-01 | T1.12, T1.13, T1.16 |
| US-E01-02 | T1.11, T1.14 |
| US-E01-03 | T1.18, T1.19, T1.24 |
| US-E01-04 | T1.15, T1.16, T1.25, T1.27, T1.29 |
| US-E01-05 | T1.17, T1.19, T1.34 |
| US-E01-06 | T1.20 |
| US-E02-01 | T1.21 |
| US-E02-02 | T1.22 |
| US-E02-03 | T1.23, T1.24 |
| US-E02-04 | T1.30, T1.31 |
| US-E02-05 | T1.26, T1.27 |
| US-E03-01 | T1.28, T1.29 |
| US-E13-03 (soft) | T1.32 |

**Conteggio task:** **34** (T1.1–T1.34) · Size max **M** · Checkpoint **7**.
