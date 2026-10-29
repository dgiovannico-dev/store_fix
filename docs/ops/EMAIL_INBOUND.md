# Email → ticket (F2-08)

Self-host only — **nessun** SaaS inbound (SendGrid Inbound, Mailgun, …).

## Convenzione messaggio

- Subject: `[store:Nome PV esatto]` **oppure** `PV: Nome PV`
- Body: descrizione guasto (IT)
- Keywords → categorie intake: frigo, hvac, casse, illuminazione (luce/elettrico), porte; altro (es. idraulico); `critico`/`emergenza` → priorità critical

## Webhook

```bash
export INBOUND_EMAIL_WEBHOOK_SECRET=$(openssl rand -hex 24)

curl -sS -X POST http://localhost:3000/api/inbound/email \
  -H "Authorization: Bearer $INBOUND_EMAIL_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "<unique-message-id@mail>",
    "tenantSlug": "pilot-retail",
    "subject": "[store:PV Milano 1] Frigo critico",
    "text": "Temperatura alta",
    "from": "staff@pv.it"
  }'
```

Dedup: stesso `messageId` + tenant → non crea ticket doppio.

## IMAP poll (F3-04)

Worker pg-boss coda `email.imap_poll` (cron default `*/2 * * * *` Europe/Rome):

1. `imapflow` SEARCH `UNSEEN` sulla mailbox
2. Parse (`mailparser`) → stesso `processInboundEmail` del webhook
3. Dedup Message-ID (o fallback `imap:MAILBOX:uid`)
4. `\\Seen` solo su ok/duplicate (`IMAP_MARK_SEEN=true` default)

```env
IMAP_HOST=imap.example.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=intake@example.com
IMAP_PASS=…
IMAP_MAILBOX=INBOX
IMAP_TENANT_SLUG=pilot-retail
# IMAP_POLL_CRON=*/2 * * * *
# IMAP_MARK_SEEN=true
```

Senza `IMAP_HOST` (o user/pass) il job skippa — webhook F2-08 resta valido.  
Nessun SaaS inbound.
