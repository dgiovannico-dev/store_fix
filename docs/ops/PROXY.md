# Reverse proxy TLS — Caddy (US-E14-01 / T5.4–T5.5)

Stack: [`compose.prod.yaml`](../../compose.prod.yaml) + [`deploy/Caddyfile`](../../deploy/Caddyfile)

Validazione sintassi (CI + preflight, no stack up):

```bash
npm run caddy:validate
# image allineata a compose.prod: caddy:2.9.1-alpine
```

HSTS e header proxy sono nel Caddyfile; CSP/Permissions-Policy restano sull’app (`SECURITY_HEADERS.md`). Smoke HTTPS+HSTS su VPS: `verify:headers https://$FF_DOMAIN/... --prod`.

## Client IP / `X-Forwarded-*`

| Topologia | Comportamento |
|-----------|----------------|
| **Caddy = edge** (default VPS) | `reverse_proxy` **ignora** XFF spoofati dal client e valorizza header fidati verso `app`. Rate-limit app: `FF_TRUSTED_PROXY_COUNT=1` ([`RATE_LIMITS.md`](./RATE_LIMITS.md)). |
| **CDN → Caddy → app** | Abilitare nel Caddyfile globale `servers.trusted_proxies` con CIDR del CDN + `trusted_proxies_strict` (snippet commentato in `deploy/Caddyfile`). Aggiornare `FF_TRUSTED_PROXY_COUNT` se compaiono hop extra. |

Fonti: [Caddy `trusted_proxies`](https://caddyserver.com/docs/caddyfile/options#trusted-proxies), [MDN X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For).

## DNS / porte

| Porta host | Servizio | Note |
|------------|----------|------|
| **80** | Caddy | ACME HTTP-01 + redirect HTTPS |
| **443** | Caddy | HTTPS (+ HTTP/3 UDP) |
| 22 | SSH | solo admin |
| — | Postgres / SeaweedFS / app:3000 | **non** pubblici (app solo `127.0.0.1:3000`) |

1. Crea record **A/AAAA** `FF_DOMAIN` → IP VPS EU.
2. Apri UFW 22/80/443 (vedi [`FIREWALL.md`](./FIREWALL.md)).
3. Imposta in `.env.prod`:

```bash
FF_DOMAIN=app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
```

4. Avvia:

```bash
docker compose -f compose.prod.yaml --env-file .env.prod up -d --build
curl -sfI https://$FF_DOMAIN/api/health/ready
curl -sfI http://$FF_DOMAIN/api/health/live   # deve redirect → HTTPS
```

## ACME / rinnovo

- Caddy ottiene e rinnova certificati **automaticamente** ([Automatic HTTPS](https://caddyserver.com/docs/automatic-https)).
- Stato in volume Docker `caddy_data` — **non** commitare certificati.
- Rinnovo: nessun cron manuale; se fallisce, Caddy logga su stdout.

## Lab senza DNS pubblico

```bash
FF_DOMAIN=localhost
NEXT_PUBLIC_APP_URL=https://localhost
```

Caddy emette certificato **interno** per `localhost` (trust store locale / `-k` in curl).

## Upstream health

`reverse_proxy` usa `health_uri /api/health/ready` — se DB down, Caddy smette di bilanciare verso `app` (503 upstream).

## Troubleshooting

| Sintomo | Check |
|---------|--------|
| ACME timeout | DNS punta al VPS? 80/443 aperti? firewall cloud? |
| 502/503 | `docker compose … logs app caddy`; ready 200 su `127.0.0.1:3000`? |
| Mixed content | `NEXT_PUBLIC_APP_URL` deve essere `https://…` |
| Cert scaduto | volume `caddy_data` integro? clock NTP? |

```bash
docker compose -f compose.prod.yaml --env-file .env.prod logs -f caddy
docker compose -f compose.prod.yaml --env-file .env.prod exec app \
  wget -qO- http://127.0.0.1:3000/api/health/ready
```
