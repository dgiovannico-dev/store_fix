# FacilityFlow Retail

Webapp multi-tenant OSS per manutenzione reti retail/franchise mid-market (Italia).

## Stack (vincolante)

Next.js App Router · Auth.js · Prisma · PostgreSQL · SeaweedFS · pg-boss · Nodemailer/Mailpit · Tailwind + shadcn  
Dettaglio: [`docs/product/STACK.md`](docs/product/STACK.md)

## Script

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Build produzione |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest |
| `npm run db:generate` | Prisma client |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Seed tenant demo (locale) |
| `npm run worker` | Worker pg-boss |
| `npm run storage:init` | Bucket SeaweedFS |

## Avvio locale

Vedi [`docs/ops/COMPOSE.md`](docs/ops/COMPOSE.md).

Credenziali seed: `owner@demo.facilityflow.local` / `DemoOwner123!` → `/login`  
Auth: [`docs/ops/AUTH.md`](docs/ops/AUTH.md)

## Documentazione

- Product backlog: `docs/product/BACKLOG.md`
- Design package: `docs/design/README.md`
- Architettura: `docs/architecture/SOFTWARE_ARCHITECTURE.md`
- Sprint S1: `docs/product/sprints/S1-sprint-backlog.md`

## Branch

GitFlow: lavoro su `feature/*` → `develop`. Branch corrente tipico S1: `feature/FF-S1-platform-oss`.
