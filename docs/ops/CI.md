# CI (US-E14-04 / T5.8–T5.10)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

Badge (default branch `main`):

[![CI](https://github.com/dgiovannico-dev/store_fix/actions/workflows/ci.yml/badge.svg)](https://github.com/dgiovannico-dev/store_fix/actions/workflows/ci.yml)

## Gate PR → `develop` / push `develop`

- `lint`, `typecheck`, `test` (Postgres service)
- `secrets:scan`
- `build` (`next build`) con cache npm
- `npm audit --audit-level=high` (**fail hard**; waiver: [`AUDIT.md`](./AUDIT.md))
- Perf p95 lista HQ su seed pilota (`perf:hq-list`)

## Runner

Default: **GitHub-hosted** free tier. Self-hosted OK se OS/agent allineati; **nessun** secret di produzione nelle PR.

Env test: `DATABASE_URL` verso service `postgres:16` del job; `AUTH_SECRET` fittizio solo CI.

## Branch protection consigliata (lab / pilota)

Su `develop` e `main` (Settings → Branches), consigliato:

| Setting | Valore | Motivo |
|---------|--------|--------|
| Require a pull request before merging | **On** | GitFlow PR |
| Required approving reviews | **0** (off) | Auto-merge agente; stesso autore non può self-approve |
| Require status checks | CI workflow `verify` (quando stabile) | Gate verde |
| Allow force pushes | **Off** | Policy gitflow |
| Allow deletions | **Off** su `develop`/`main` | Evita wipe ref |
| Repo `delete_branch_on_merge` | **`false`** | Altrimenti PR `develop`→`main` cancella `develop` |

Integrazione agente: `scripts/gitflow-ship-pr.sh` (PR + `gh pr merge --auto --merge`).

## Smoke HTTP locale (US-E14-12 parziale)

```bash
npm run db:seed:pilot && npm run dev   # altro terminale
npm run smoke:http
```

Vedi [`SMOKE_FLUSSO_A.md`](./SMOKE_FLUSSO_A.md).
