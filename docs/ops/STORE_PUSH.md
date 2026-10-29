# Push store — ntfy / webhook (F3-08)

OSS-only. **Niente** WhatsApp Business Cloud API.

## Config

| Dove | Campo |
|------|--------|
| Store | `webhookUrl` (http/https) e/o `ntfyTopic` |
| Env | `NTFY_BASE_URL` (es. `https://ntfy.example.com`), opz. `NTFY_TOKEN` |

Eventi: ticket `created`, `assigned`, `done` → `pushStoreTicketEvent` da `emitTicketNotification`.

## Test ntfy

```bash
# self-host o ntfy.sh (topic = password)
curl -d "test" "$NTFY_BASE_URL/mio-topic"
```

## Webhook

Riceve JSON:

```json
{
  "event": "ticket.created",
  "ticketId": "…",
  "storeId": "…",
  "storeName": "…",
  "title": "Nuovo ticket",
  "body": "…",
  "url": "https://…/app/tickets/…"
}
```
