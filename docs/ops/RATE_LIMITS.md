# Rate limits (MVP)

Policy nominate: `src/infrastructure/rate-limit-policies.ts` (`RATE_LIMIT.*`).

| Store | Env | Dove |
|-------|-----|------|
| **memory** (default) | `FF_RATE_LIMIT_STORE` unset / `memory` | `checkRateLimit` in-process — single-node Compose |
| **postgres** | `FF_RATE_LIMIT_STORE=postgres` | tabella `RateLimitBucket` + `pg_advisory_xact_lock` — multi-replica sullo stesso Postgres OSS |

Route async (`/logout`, `/api/*` rate-limited): `checkRateLimitPolicyAsync` (rispetta lo store).  
Server Actions sync (login/signup/intake/…): restano **memory** finché non migrati ad async (accettabile MVP single-node).

| Chiave | Limite | Finestra | Policy | Dove |
|--------|--------|----------|--------|------|
| `login:*` (IP) | **10** | **15 min** | `login` | `src/app/actions/login.ts` |
| `logout:*` (IP) | **20** | **15 min** | `logout` | `src/app/logout/route.ts` (GET/POST) |
| `signup:*` (IP) | **10** | **15 min** | `signup` | `src/app/actions/signup.ts` |
| `pwdreset:*` (email) | **5** | **15 min** | `pwdreset` | `src/domain/auth/password-reset.ts` |
| `store-csv:{tenantId}` | **5** | **15 min** | `storeCsv` | `src/domain/stores/csv-import.ts` |
| `intake:{tenantId}:{userId}` | **20** | **15 min** | `intake` | deep link page + `createTicket` action |
| `ai-suggest:{tenantId}:{userId}` | **20** | **60 s** | `aiSuggest` | `/api/ai/suggest-category`, `suggest-vendor`, `summarize-ticket` (budget condiviso) |
| `inbound-email:{ip}` | **60** | **60 s** | `inboundEmail` | `/api/inbound/email` (Bearer webhook) |

Superamento → redirect o risposta **429** / copy IT “Troppe richieste” (`rateLimitedRetry` / `tooManyRequests`).  
Route JSON (`/api/*`, `/logout`): `tooManyRequestsJson` — header **`Retry-After`** (secondi) + `Cache-Control: no-store` + body `{ code: "rate_limited", retryAfterSec }`.

## Deep link intake (T2.27)

- Route: `/app/segnala/[storeId]` (auth-gated) — gate lettura pagina
- Mutation create ticket riusa limite `intake:{tenantId}:{userId}`

## Note ops

- Default **per processo** (memory). Con `FF_RATE_LIMIT_STORE=postgres` le route async condividono i bucket su Postgres (no Redis SaaS). GC chiavi scadute: opzionale `DELETE FROM "RateLimitBucket" WHERE "resetAt" < now()` (manuale/job futuro).
- Chiave IP: `clientIpFromHeaders` (`src/infrastructure/security/client-ip.ts`) — preferisce `X-Real-IP`, altrimenti **rightmost** di `X-Forwarded-For` (hop aggiunto dal proxy fidato). `FF_TRUSTED_PROXY_COUNT` (default `1`, tipico Caddy). Non usare leftmost (spoofabile).
- CSRF su `/api/*` mutanti + `POST /logout`: vedi [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md) — indipendente dai rate limit.
