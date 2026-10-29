# Release checklist — Production DoD E14

Allineata a E14 / S5 exit. Dry-run su **staging** obbligatorio prima di Go prod.

## Go staging

- [ ] HTTPS Caddy; HTTP→HTTPS ([`PROXY.md`](./PROXY.md))
- [ ] live/ready 200 ([`HEALTH.md`](./HEALTH.md))
- [ ] No Mailpit; secret da file 600 ([`SECRETS.md`](./SECRETS.md))
- [ ] CI green (`lint` `typecheck` `test` `build`)
- [ ] Migrate deploy + rollback path noto ([`MIGRATE.md`](./MIGRATE.md))
- [ ] Backup cron + restore drill annotato ([`BACKUP.md`](./BACKUP.md))
- [ ] p95 lista HQ &lt; 300 ms (`npm run perf:hq-list`; gate anche in CI su `develop`)
- [ ] Smoke Flusso A ([`SMOKE_FLUSSO_A.md`](./SMOKE_FLUSSO_A.md))
- [ ] Headers dietro HTTPS (`scripts/verify-security-headers.sh`)
- [ ] Firewall 22/80/443 ([`FIREWALL.md`](./FIREWALL.md))
- [ ] Obs: log-only firmata **o** GlitchTip self-host ([`OBSERVE.md`](./OBSERVE.md))
- [ ] Tag semver + GitFlow ([`RELEASE.md`](./RELEASE.md))

## No-go se manca

Seed 15×5 usabile · ready dietro TLS · restore drill · isolamento tenant · p95 · zero SaaS critico.
