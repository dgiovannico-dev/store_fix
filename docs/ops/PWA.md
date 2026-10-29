# PWA offline-light (F2-06)

Installabile + fallback offline. **Non** è SoR offline (niente coda ticket / sync).

## Cosa c’è

| Pezzo | Path |
|-------|------|
| Manifest | `/manifest.webmanifest` via `src/app/manifest.ts` |
| Icone | `public/icons/icon-192.png`, `icon-512.png` |
| Service worker | `public/sw.js` (cache shell + `/offline`) |
| Registrazione | `RegisterServiceWorker` in root layout — **solo `NODE_ENV=production`** |
| Offline UI | `/offline` |

## Strategie cache

- `/_next/static/*` → cache-first
- navigazioni → network-first, fallback `/offline`
- `/api/*` e auth → **mai** cache come verità

## Verify lab

```bash
npm run build && npm run start
# Chrome DevTools → Application → Manifest / Service Workers
# Network → Offline → naviga: deve apparire /offline
```

HTTPS consigliato (Compose lab Caddy :8443). Localhost è eccezione browser.
