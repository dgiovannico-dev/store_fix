# Docker Compose — FacilityFlow (ops)

Stack **OSS self-host**. Nessun secret reale in repo: copia `.env.example` → `.env`.

## Comando unico (full stack)

```bash
cp .env.example .env
docker compose --profile full up -d --build
```

Profili:

| Profile | Servizi |
|---------|---------|
| (default) | `postgres`, `seaweedfs` |
| `dev` | + `mailpit` |
| `full` | + `app` + `worker` (+ tipicamente mailpit se incluso nel compose profile) |
| `observe` | opzionale — GlitchTip self-host (F3-02: `glitchtip-*` services); default = log JSON only |

Produzione: [`compose.prod.yaml`](../../compose.prod.yaml) + [`COMPOSE_PROD.md`](./COMPOSE_PROD.md) · Health: [`HEALTH.md`](./HEALTH.md) · Secrets: [`SECRETS.md`](./SECRETS.md)

Seed pilota: [`SEED_PILOT.md`](./SEED_PILOT.md) · Backup: [`BACKUP.md`](./BACKUP.md) · Headers: [`SECURITY_HEADERS.md`](./SECURITY_HEADERS.md)

Verifica health:

```bash
docker compose ps
curl -sf http://localhost:3000/api/health
```

## Dev locale consigliato (hot reload)

Se era su `--profile full`, ferma i container Next/worker (evita conflitto porta 3000):

```bash
docker compose --profile full stop app worker
```

Poi solo infra + UI locale:

```bash
cp .env.example .env
docker compose up -d postgres seaweedfs
docker compose --profile dev up -d mailpit

npm install
npx prisma migrate deploy
npm run db:seed          # opzionale se DB già seedato
npm run storage:init     # opzionale se bucket già ok
npm run worker           # terminale 2 (opz.)
npm run dev              # terminale 1 → :3000 hot reload
```

Build Docker `app`/`worker`: context snello via [`.dockerignore`](../../.dockerignore) (esclude `node_modules`/`.next`/`.git`).

## Porte

Pubblicate su **`127.0.0.1` only** in `docker-compose.yml` (lab): evita bind `0.0.0.0` che bypassa UFW ([Docker publish ports](https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/)). Tra container resta la rete Compose (`postgres:5432`, `seaweedfs:8333`).

| Servizio | Porta host | Note |
|----------|------------|------|
| `postgres` | `127.0.0.1:5432` | user/pass/db da `.env` |
| `seaweedfs` | `127.0.0.1:8333` S3 · `9333` master | bucket via `npm run storage:init` |
| `mailpit` | `127.0.0.1:1025` SMTP · `8025` UI | solo profile `dev` / QA |
| `app` | `127.0.0.1:3000` | profile `full` oppure `npm run dev` |
| `worker` | — | pg-boss · `email.send` / SLA stub; `no-new-privileges` |

`app` / `worker` (profile `full`): `security_opt: no-new-privileges:true`.

## Credenziali locali (non produzione)

Da seed (`npm run db:seed`):

- email: `owner@demo.facilityflow.local`
- password: `DemoOwner123!`

Auth: [`AUTH.md`](./AUTH.md) · Mailpit: http://localhost:8025 · Inbound email→ticket: [`EMAIL_INBOUND.md`](./EMAIL_INBOUND.md) · PWA: [`PWA.md`](./PWA.md) · AI: [`AI_OLLAMA.md`](./AI_OLLAMA.md)

```bash
npx tsx scripts/send-test-email.ts   # inline
# oppure con worker: enqueue via outbox
```

## Reset volumi (distruttivo)

```bash
docker compose down -v
```

Poi ri-migrate / seed / `storage:init`.

## Verify report (post-dev)

Dopo slice significative:

1. `docker compose ps` — postgres healthy; seaweedfs up; mailpit healthy (dev)
2. `npm run typecheck && npm run test`
3. Smoke: `/api/health`, login seed, enqueue email → Mailpit
4. Nessun secret reale in git

**Mai** commitare `.env` con secret di produzione.
