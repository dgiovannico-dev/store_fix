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

## CSRF (API + Server Actions)

| Superficie | Protezione |
|------------|------------|
| **Server Actions** | Built-in Next.js: `Origin` vs `Host` / `X-Forwarded-Host`. Extra host: `experimental.serverActions.allowedOrigins` da `SERVER_ACTIONS_ALLOWED_ORIGINS` o host di `NEXT_PUBLIC_APP_URL` / `FF_DOMAIN` (skip localhost) — `next.config.ts` |
| **Mutating `/api/*`** | Middleware: rifiuta `Sec-Fetch-Site: cross-site`; se `Origin` presente deve matchare Host/X-Forwarded-Host o allowlist. **403** `{ code: "csrf_origin" }` |
| **Esenti** | `/api/health/*`, `/api/auth/*` (Auth.js), `/api/inbound/*` (Bearer webhook) |
| **Senza Origin** | Consentito (curl / job / client non-browser) se non `cross-site` |

Env opz.: `SERVER_ACTIONS_ALLOWED_ORIGINS` (alias `CSRF_ALLOWED_ORIGINS`) — host o URL separati da virgola, es. `app.example.com,https://lab.example.com`.

Fonti: [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [Next.js Server Actions security](https://nextjs.org/blog/security-nextjs-server-components-actions).

## Eccezioni

- **Dev:** CSP include `unsafe-eval` per HMR Next; **prod** lo omette (`middleware.ts`). Nonce/hash script = polish futuro.
- **Mailpit / Seaweed signed URL:** `connect-src` / `img-src` consentono `http:`/`https:` per PUT/GET firmati sullo storage Compose.
- Rate limit: [`RATE_LIMITS.md`](./RATE_LIMITS.md).

## Split proxy vs app

| Header | Dove | Gate in-repo |
|--------|------|--------------|
| CSP, Permissions-Policy, X-Request-Id | App middleware | `verify:headers … --prod` (HTTP CI) |
| **HSTS**, strip `Server` | Caddy (`deploy/Caddyfile`) — solo HTTPS | Vitest `src/ops/caddyfile-hsts.test.ts` + `caddy:validate` |

Smoke:

```bash
npm run verify:headers
# staging/prod HTTPS — fallisce se CSP include unsafe-eval; HSTS atteso dietro Caddy:
bash scripts/verify-security-headers.sh https://$FF_DOMAIN/login --prod
npm run caddy:validate   # sintassi Caddyfile (CI)
npm test -- src/ops/caddyfile-hsts.test.ts   # policy HSTS senza TLS live
```
