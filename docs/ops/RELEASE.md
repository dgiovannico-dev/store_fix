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

## Release

```bash
git checkout -b release/0.1.0 develop
# bump version / CHANGELOG se presente
git checkout main && git merge --no-ff release/0.1.0
git tag v0.1.0
git checkout develop && git merge --no-ff release/0.1.0
```

Deploy prod: backup → migrate → up → ready → smoke.

## Post-release

- Annotare restore drill / incident in ops
- Retro se fine sprint
