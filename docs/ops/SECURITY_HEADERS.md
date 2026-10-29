# Security headers (US-E10-07 / T4.6)

Implementati in `src/middleware.ts`:

| Header | Valore |
|--------|--------|
| `Content-Security-Policy` | `default-src 'self'`; script/style `'unsafe-inline'` (Next/Tailwind); **prod senza** `'unsafe-eval'`; `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` (legacy + CSP) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera/mic/geo off |
| `X-Request-Id` | UUID correlabile nei log JSON |

## Eccezioni

- **Dev:** CSP include `unsafe-eval` per HMR Next; **prod** lo omette (`middleware.ts`). Nonce/hash script = polish futuro.
- **Mailpit / Seaweed signed URL:** `connect-src` / `img-src` consentono `http:`/`https:` per PUT/GET firmati sullo storage Compose.
- Rate limit: `src/infrastructure/rate-limit.ts` su login/signup/intake (vedi verify report).

Smoke:

```bash
npm run verify:headers
# staging/prod HTTPS — fallisce se CSP include unsafe-eval:
bash scripts/verify-security-headers.sh https://$FF_DOMAIN/login --prod
```
