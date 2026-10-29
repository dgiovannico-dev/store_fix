# Security headers (US-E10-07 / T4.6)

Implementati in `src/middleware.ts`:

| Header | Valore |
|--------|--------|
| `Content-Security-Policy` | `default-src 'self'`; script/style `'unsafe-inline'` (Next/Tailwind); **prod senza** `'unsafe-eval'`; `object-src 'none'`; `base-uri 'none'`; `frame-ancestors 'none'`; **`upgrade-insecure-requests`** solo con `FF_DOMAIN` reale (o `FF_CSP_UPGRADE_INSECURE=1`) — off su lab HTTP |
| `X-Frame-Options` | `DENY` (legacy + CSP) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | default `strict-origin-when-cross-origin`; auth token pages (`/reset-password`, `/verify-email`, `/invite`) → `no-referrer`; `/login` `/register` `/logout` → `strict-origin` |
| `Permissions-Policy` | subset OWASP: camera/mic/geo/payment/usb/… off; clipboard non bloccato (UX paste) |
| `Cross-Origin-Opener-Policy` | `same-origin` (XS-Leak; no popup OAuth SoR) |
| `Cross-Origin-Resource-Policy` | `same-origin` (document isolation; storage firmato resta fuori middleware) |
| `X-Permitted-Cross-Domain-Policies` | `none` (no `crossdomain.xml` / Flash–Acrobat meta-policy) |
| `Origin-Agent-Cluster` | `?1` (hint isolamento processo per-origin; non garanzia Spectre) |
| `X-DNS-Prefetch-Control` | `off` (Chromium; riduce prefetch DNS su link — OWASP SHP) |
| `Cache-Control` | `no-store` su tutte le risposte middleware (SoR dinamico / auth; static `_next` escluso dal matcher) |
| `Clear-Site-Data` | `"cache", "cookies", "storage"` su `/logout` e `POST /api/auth/signout` (HTTPS; PWA SW si ri-registra al prossimo visit) |
| `X-Request-Id` | UUID correlabile nei log JSON |

## CSRF (API + Server Actions)

| Superficie | Protezione |
|------------|------------|
| **Server Actions** | Built-in Next.js: `Origin` vs `Host` / `X-Forwarded-Host`. Extra host: `experimental.serverActions.allowedOrigins` da `SERVER_ACTIONS_ALLOWED_ORIGINS` o host di `NEXT_PUBLIC_APP_URL` / `FF_DOMAIN` (skip localhost) — `next.config.ts` |
| **Mutating `/api/*` + `POST /logout`** | Middleware: rifiuta `Sec-Fetch-Site: cross-site`; se `Origin` presente deve matchare Host/X-Forwarded-Host o allowlist. **403** `{ code: "csrf_origin" }` |
| **Esenti** | `/api/health/*`, `/api/auth/*` (Auth.js), `/api/inbound/*` (Bearer webhook); altre pagine non-API |
| **Senza Origin** | Consentito (curl / job / client non-browser) se non `cross-site` |

Env opz.: `SERVER_ACTIONS_ALLOWED_ORIGINS` (alias `CSRF_ALLOWED_ORIGINS`) — host o URL separati da virgola, es. `app.example.com,https://lab.example.com`.

Fonti: [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [Next.js Server Actions security](https://nextjs.org/blog/security-nextjs-server-components-actions).

## Eccezioni

- **Dev:** CSP include `unsafe-eval` per HMR Next; **prod** lo omette (`middleware.ts`). Nonce/hash script = polish futuro.
- **`upgrade-insecure-requests`:** attivo in prod dietro `FF_DOMAIN` (VPS/Caddy HTTPS). Disabilitare con `FF_CSP_UPGRADE_INSECURE=0` se serve; forzare in lab con `=1`.
- **Mailpit / Seaweed signed URL:** `connect-src` / `img-src` consentono `http:`/`https:` per PUT/GET firmati sullo storage Compose (senza upgrade-insecure sul lab HTTP).
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
