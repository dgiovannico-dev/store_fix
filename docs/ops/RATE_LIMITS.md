# Rate limits (MVP)

In-process (`checkRateLimit`) — single-node Compose. Nessun Redis.

| Chiave | Limite | Finestra | Dove |
|--------|--------|----------|------|
| `login:*` | 10 | 15 min | login action |
| `signup:*` | 10 | 15 min | signup |
| `pwdreset:*` | 5 | 15 min | password reset |
| `csv-import:*` | (vedi codice) | — | import CSV store |
| `intake:*` | **20** | **15 min** | deep link / create ticket |

Superamento → redirect o risposta **429** / errore IT “Troppe richieste”.

## Deep link intake (T2.27)

- Route: `/app/segnala/[storeId]` (auth-gated)
- Mutation create ticket riusa limite `intake:{tenantId}:{userId}`
