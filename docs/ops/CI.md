# CI (US-E14-04 / T5.8–T5.10)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

Badge (default branch `main`):

[![CI](https://github.com/dgiovannico-dev/store_fix/actions/workflows/ci.yml/badge.svg)](https://github.com/dgiovannico-dev/store_fix/actions/workflows/ci.yml)

## Gate PR → `develop` / push `develop`

- `lint`, `typecheck`, `test` (Postgres service)
- `secrets:scan`
- `compose:prod|lab|observe:config` (YAML interpolate, no stack up)
- `build` (`next build`) con cache npm
- `npm audit --audit-level=high` (**fail hard**; waiver: [`AUDIT.md`](./AUDIT.md))
- Job parallelo **`osv`**: `scripts/osv-scan.sh` su `package-lock.json` (T5.21 / US-E14-10)
- Perf p95 lista HQ su seed pilota (`perf:hq-list`)
- HTTP smoke curl+session (`npm run smoke:http` dopo `next start` + seed pilota) — US-E14-12 path auth
- Security headers prod CSP (`verify:headers … --prod`, no `unsafe-eval`) — US-E14-10 in-repo half
- Allegati S3 pubblico: `npm run smoke:attachment-put` **locale/lab only** (SKIP se SeaweedFS assente; non in CI)

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

## Verify locale (agente / laptop)

```bash
npm run verify:local
# = typecheck + lint + test + secrets:scan + npm audit --audit-level=high
npm run audit:osv   # opz. (rete; job CI `osv`)
```

## Smoke HTTP locale (US-E14-12 parziale)

```bash
npm run db:seed:pilot && npm run dev   # altro terminale
npm run smoke:http
```

Vedi [`SMOKE_FLUSSO_A.md`](./SMOKE_FLUSSO_A.md).
