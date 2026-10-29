# Job pg-boss (Compose worker)

| Coda | Schedule | Note |
|------|----------|------|
| `email.send` | on-demand | Nodemailer → Mailpit/SMTP; retry 5 + backoff |
| `sla.check_breaches` | `*/5 * * * *` Europe/Rome | Idempotente: `UPDATE … WHERE sla_breached_at IS NULL` |
| `email.imap_poll` | `IMAP_POLL_CRON` default `*/2 * * * *` Europe/Rome | Solo se `IMAP_HOST`+credenziali; UNSEEN → `processInboundEmail` |
| `pm.maintain` | `0 * * * *` Europe/Rome | Espande serie RRULE + remider email HQ (48h) |

## Chiavi

- Email: `singletonKey` = `emailIdempotencyKey(template, ticketId, recipient)` + claim in-process
- SLA schedule: creato una volta all’avvio worker (`boss.schedule`); re-run worker = warn se già esiste

## Avvio

```bash
npm run worker
```
