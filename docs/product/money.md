# Denaro EUR (MVP)

- Campi Prisma: `Ticket.estimatedCost`, `Ticket.actualCost` come `Decimal(12, 2)` — **euro con centesimi**, non integer cents.
- Input UI: numero con punto o virgola; domain parse con `Number` / `z.coerce.number()`.
- Scrivere costi: solo vendor (pre-`verified`) o HQ ops su path chiusura; mai `viewer_finance` / `store_staff`.
- Dopo `verified`: costi e campi chiave **immutabili** (`assertTicketMutable`).
- Export contabile (F2-05): `GET /api/exports/accounting` — CSV UTF-8 (BOM per Excel), colonne `actual_cost` con punto decimale + `currency=EUR`; RBAC `export_accounting` (HQ + `viewer_finance`).
- Preventivo (F2-02): `Ticket.estimatedCost` + `quoteStatus` (`pending`|`accepted`|`rejected`); eventi `quote_*`; vendor propone, store/HQ `accept_quote`; chiusura `done` bloccata se `pending`.
