# Rate limits (MVP)

In-process (`checkRateLimit` in `src/infrastructure/rate-limit.ts`) — single-node Compose. Nessun Redis.

| Chiave | Limite | Finestra | Dove |
|--------|--------|----------|------|
| `login:*` (IP) | **10** | **15 min** | `src/app/actions/login.ts` |
| `logout:*` (IP) | **20** | **15 min** | `src/app/logout/route.ts` (GET/POST) |
| `signup:*` (IP) | **10** | **15 min** | `src/app/actions/signup.ts` |
| `pwdreset:*` (email) | **5** | **15 min** | `src/domain/auth/password-reset.ts` |
| `store-csv:{tenantId}` | **5** | **15 min** | `src/domain/stores/csv-import.ts` |
| `intake:{tenantId}:{userId}` | **20** | **15 min** | deep link page + `createTicket` action |
| `ai-suggest:{tenantId}:{userId}` | **20** | **60 s** | `/api/ai/suggest-category`, `suggest-vendor`, `summarize-ticket` |
| `inbound-email:{ip}` | **60** | **60 s** | `/api/inbound/email` (Bearer webhook) |

Superamento → redirect o risposta **429** / copy IT “Troppe richieste” (`rateLimitedRetry` / `tooManyRequests`).

## Deep link intake (T2.27)

- Route: `/app/segnala/[storeId]` (auth-gated) — gate lettura pagina
- Mutation create ticket riusa limite `intake:{tenantId}:{userId}`

## Note ops

- Limiti **per processo**: dietro più replica `app` i bucket non sono condivisi (accettabile MVP; Fase 4 Redis solo se metriche lo chiedono).
- CSRF su `/api/*` mutanti + `POST /logout`: vedi [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md) — indipendente dai rate limit.
