# QA — Flusso A gate `assigned` (S2 / US-E13-01)

**Scenario:** “Frigo banco 2 non raffredda”, priorità **critical**, ≥2 foto.  
**Stop:** stato `assigned` (niente portal vendor / `in_progress`).

## Prerequisiti Compose

```bash
docker compose up -d postgres seaweedfs
docker compose --profile dev up -d mailpit
npx prisma migrate deploy && npm run db:seed
npm run storage:init
npm run worker   # altro terminale
npm run dev
```

## Checklist automatica

```bash
npm test -- src/tests/e2e/flusso-a-assigned.test.ts
npm test -- src/tests/isolation/tickets.test.ts src/tests/rbac/tickets.test.ts
```

## Checklist manuale UI

| # | Azione | Pass? |
|---|--------|:-----:|
| 1 | Store (o HQ): `/app/tickets/new` — categoria frigo, critical, descrizione | ☐ |
| 2 | Dettaglio: carica 2 foto JPEG/PNG/WebP | ☐ |
| 3 | Mailpit: email `ticket_nuovo` a HQ | ☐ |
| 4 | HQ: triage (nota interna opz.) → stato `triaged` | ☐ |
| 5 | HQ: assign vendor refrigerazione → `assigned` + `slaDueAt` ~4h | ☐ |
| 6 | Mailpit: email `ticket_assign` a vendor | ☐ |
| 7 | Tentativo UI illegale open→assigned diretto rifiutato (solo via API/FSM) | ☐ |
| 8 | Tenant B non vede ticket A (lista/dettaglio) | ☐ |

## Criteri pass

- [ ] 2 row `Attachment` (+ oggetti SeaweedFS se storage healthy)
- [ ] Notification `ticket.created` + email nuovo
- [ ] Email assign + `TicketEvent` created/triaged/assigned
- [ ] `slaDueAt` ≈ openedAt + 4h (policy frigo critical)
- [ ] Isolamento + RBAC suite verdi
- [ ] Stop a `assigned`

## Esito

- Data: __________
- Operatore: __________
- Auto test: Pass / Fail
- Manuale Mailpit: Pass / Fail / N/A
- Note: __________
