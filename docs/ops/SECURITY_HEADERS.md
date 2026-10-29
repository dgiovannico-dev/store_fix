# Security headers (US-E10-07 / T4.6)

Implementati in `src/middleware.ts`:

| Header | Valore |
|--------|--------|
| `Content-Security-Policy` | `default-src 'self'`; script/style con `'unsafe-inline'` (compat Next/Tailwind MVP); `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` (legacy + CSP) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera/mic/geo off |
| `X-Request-Id` | UUID correlabile nei log JSON |

## Eccezioni

- **Dev:** CSP lascia `unsafe-eval` per HMR Next; stringere in prod (nonce) in E14.
- **Mailpit / Seaweed signed URL:** `connect-src` / `img-src` consentono `http:`/`https:` per PUT/GET firmati sullo storage Compose.
- Rate limit: `src/infrastructure/rate-limit.ts` su login/signup/intake (vedi verify report).

Smoke:

```bash
curl -sI http://localhost:3000/login | grep -iE 'content-security|x-frame|x-content|x-request'
```
