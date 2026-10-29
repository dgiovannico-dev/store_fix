# Regole destinatari Notification + email

Completo S3 (US-E08-03 / T3.1). L’email outbox (`email.send` / Nodemailer→Mailpit) è **distinta** dalla row `Notification` in-app.

| Evento | Notification type | Email template | Destinatari |
|--------|-------------------|----------------|-------------|
| Ticket creato (`open`) | `ticket.created` | `ticket_nuovo` | HQ: `owner`, `admin_hq`, `ops_coordinator` |
| Ticket assegnato | `ticket.assigned` | `ticket_assign` | Utenti membership `vendor` + `Vendor.email` |
| Ticket annullato | `ticket.cancelled` | `ticket_cancelled` | Store in scope + HQ; se assigned anche vendor |
| Lavoro `done` | `ticket.done` | `ticket_done` | HQ + store membership dello store |
| SLA breach | `ticket.breached` | `ticket_breach` | HQ ops |
| Verificato | `ticket.verified` | `ticket_verified` | HQ + vendor |
| Rifiuto verifica | `ticket.rejected` | `ticket_rejected` | HQ + vendor |

## Vincoli

- Query Notification sempre `tenantId` + `userId` (nessun leak cross-user).
- Nessun SaaS email a pagamento — Nodemailer + Mailpit.
- Deep link: `{NEXT_PUBLIC_APP_URL}/app/tickets/{id}` (vendor: `/vendor/tickets/{id}`).
- Idempotenza email: `emailIdempotencyKey` + claim (T2.25).
