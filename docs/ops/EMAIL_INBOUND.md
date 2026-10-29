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

## IMAP (futuro)

Poll UNSEEN → parse → POST interno allo stesso `processInboundEmail`.  
Non richiesto per slice F2-08: webhook basta per forwarder OSS / Mailpit hook / script cron.
