# CI (US-E14-04 / T5.8–T5.10)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

## Gate PR → `develop`

- `lint`, `typecheck`, `test` (Postgres service)
- `secrets:scan`
- `build` (`next build`) con cache npm

## Runner

Default: **GitHub-hosted** free tier. Self-hosted OK se OS/agent allineati; **nessun** secret di produzione nelle PR.

Env test: `DATABASE_URL` verso service `postgres:16` del job; `AUTH_SECRET` fittizio solo CI.
