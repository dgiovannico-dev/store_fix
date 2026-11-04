# Job pg-boss (Compose worker)

| Coda | Schedule | Note |
|------|----------|------|
| `email.outbox_dispatch` | `*/1 * * * *` Europe/Rome (+ kick on-demand) | Claim `EmailOutbox` con `FOR UPDATE SKIP LOCKED`; Nodemailer → Mailpit/SMTP; retry backoff fino a 8 attempts → `dead`; reclaim `processing` stuck > 5m |
| `email.outbox_gc` | `0 5 * * *` Europe/Rome | Delete righe `sent` più vecchie di 30 giorni |
| `email.digest_weekly` | `0 8 * * 1` Europe/Rome | Digest HQ settimanale → append outbox |
| `sla.check_breaches` | `*/5 * * * *` Europe/Rome | Idempotente: `UPDATE … WHERE sla_breached_at IS NULL` |
| `email.imap_poll` | `IMAP_POLL_CRON` default `*/2 * * * *` Europe/Rome | Solo se `IMAP_HOST`+credenziali; UNSEEN → `processInboundEmail` |
| `pm.maintain` | `0 * * * *` Europe/Rome | Espande serie RRULE + reminder email HQ (48h) |
| `gdpr.purge` | `0 3 * * *` Europe/Rome | Soft-delete ticket `verified` oltre 24 mesi + allegati; dry-run `GDPR_PURGE_DRY_RUN=true` — [`GDPR_RETENTION.md`](./GDPR_RETENTION.md) |
| `attachment.gc` | `0 4 * * *` Europe/Rome | DeleteObject SeaweedFS per allegati soft-deleted oltre grace (default 7g); dry-run `ATTACHMENT_GC_DRY_RUN=true` — [`ATTACHMENTS.md`](./ATTACHMENTS.md) |
| `rate_limit.gc` | `15 * * * *` Europe/Rome | Delete `RateLimitBucket` con `resetAt` scaduto; utile con `FF_RATE_LIMIT_STORE=postgres`; dry-run `RATE_LIMIT_GC_DRY_RUN=true` — [`RATE_LIMITS.md`](./RATE_LIMITS.md) |

> **Retired:** `email.send` (payload arbitrario da pg-boss) non è più System of Record. SoR = tabella `EmailOutbox`.

## Email outbox (F3-09)

- **Append:** `appendEmailOutbox(tx, …)` nella stessa `$transaction` del dominio (emit, invite, verify, reset, RFQ, PM, SLA relaunch).
- **Idempotenza:** `UNIQUE(idempotencyKey)` — secondo append → `skipped: true`.
- **Stati:** `pending` → `processing` → `sent` | retry → `pending` | `dead`.
- **At-least-once SMTP:** crash dopo SMTP ok e prima di `SENT` può re-inviare; dopo `SENT` la key non re-invia.

### Runbook — stuck / DEAD

```sql
-- Stuck PROCESSING
SELECT id, "toAddr", attempts, "lockedAt", "lastError"
FROM "EmailOutbox"
WHERE status = 'processing' AND "lockedAt" < NOW() - INTERVAL '5 minutes';

-- DLQ
SELECT id, "toAddr", template, attempts, "lastError", "createdAt"
FROM "EmailOutbox" WHERE status = 'dead' ORDER BY "createdAt" DESC LIMIT 50;

-- Requeue manuale DEAD → PENDING
UPDATE "EmailOutbox"
SET status = 'pending', attempts = 0, "nextAttemptAt" = NOW(),
    "lockToken" = NULL, "lockedAt" = NULL, "lastError" = NULL
WHERE id = '<id>' AND status = 'dead';
```

## Chiavi

- Email: `emailIdempotencyKey(template, ticketId, recipient)` o chiave esplicita (`invite:…`, `rfq_invite:…`, …) su colonna `EmailOutbox.idempotencyKey`
- SLA schedule: creato una volta all’avvio worker (`boss.schedule`); re-run worker = warn se già esiste

## Avvio

```bash
npm run worker
```
