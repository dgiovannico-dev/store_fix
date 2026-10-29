# Job pg-boss (Compose worker)

| Coda | Schedule | Note |
|------|----------|------|
| `email.send` | on-demand | Nodemailer → Mailpit/SMTP; retry 5 + backoff |
| `sla.check_breaches` | `*/5 * * * *` Europe/Rome | Idempotente: `UPDATE … WHERE sla_breached_at IS NULL` |
| `email.imap_poll` | `IMAP_POLL_CRON` default `*/2 * * * *` Europe/Rome | Solo se `IMAP_HOST`+credenziali; UNSEEN → `processInboundEmail` |
| `pm.maintain` | `0 * * * *` Europe/Rome | Espande serie RRULE + reminder email HQ (48h) |
| `gdpr.purge` | `0 3 * * *` Europe/Rome | Soft-delete ticket `verified` oltre 24 mesi + allegati; dry-run `GDPR_PURGE_DRY_RUN=true` — [`GDPR_RETENTION.md`](./GDPR_RETENTION.md) |
| `attachment.gc` | `0 4 * * *` Europe/Rome | DeleteObject SeaweedFS per allegati soft-deleted oltre grace (default 7g); dry-run `ATTACHMENT_GC_DRY_RUN=true` — [`ATTACHMENTS.md`](./ATTACHMENTS.md) |

## Chiavi

- Email: `singletonKey` = `emailIdempotencyKey(template, ticketId, recipient)` + claim in-process
- SLA schedule: creato una volta all’avvio worker (`boss.schedule`); re-run worker = warn se già esiste

## Avvio

```bash
npm run worker
```
