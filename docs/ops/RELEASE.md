# Release checklist + semver (US-E14-14)

## Semver

Tag `vMAJOR.MINOR.PATCH` da `release/x.y.z` → `main` (GitFlow), sync `develop`.

## Pre-release

- [ ] CI green su `develop`
- [ ] Staging parity ([`STAGING.md`](./STAGING.md))
- [ ] Backup pre-migrate + `deploy-migrate.sh` su staging
- [ ] Smoke Flusso A staging
- [ ] `npm run perf:hq-list` / p95 gate (&lt; 300 ms) — anche in **CI** su PR/`develop` (seed pilota)
- [ ] Security headers dietro HTTPS
- [ ] Nessun secret in git; seed QA non in prod

## Release (PR auto-merge)

```bash
git checkout -b release/x.y.z develop
# bump version / CHANGELOG; verify
git push -u origin HEAD
gh pr create --base main --title "release/x.y.z" --body "…"
gh pr merge --auto --merge --delete-branch
git checkout main && git pull origin main
git tag -a vx.y.z -m "…"
git push origin vx.y.z
# back-merge main → develop (PR)
gh pr create --base develop --head main --title "chore: sync develop after vx.y.z" --body "…"
gh pr merge --auto --merge
```

Convenzione completa: [`.cursor/rules/gitflow.mdc`](../../.cursor/rules/gitflow.mdc) · helper lab: `scripts/gitflow-ship-pr.sh`.

Deploy prod: backup → migrate → up → ready → smoke — solo dopo **GO** in `S5-EXIT-GAPS.md`.

## Post-release

- Annotare restore drill / incident in ops
- Retro se fine sprint
