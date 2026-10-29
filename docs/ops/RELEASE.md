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

## Release (senza PR)

```bash
git checkout -b release/x.y.z develop
# bump version / CHANGELOG
git checkout main && git pull origin main
git merge --no-ff release/x.y.z
git push origin main
git tag -a vx.y.z -m "…"
git push origin vx.y.z
git checkout develop && git merge --no-ff main && git push origin develop
```

Deploy prod: backup → migrate → up → ready → smoke — solo dopo **GO** in `S5-EXIT-GAPS.md`.

## Post-release

- Annotare restore drill / incident in ops
- Retro se fine sprint
