# PR draft — FacilityFlow S1–S5 lab + Fase 2

**Branch attuale:** `feature/FF-S1-platform-oss` (da riallineare GitFlow se serve: `feature/FF-S1-S5-F2-increment` → `develop`)

## Summary

- Increment MVP wedge S1–S4: tenancy, ticket/SLA, vendor, dashboard HQ, seed 15×5, GDPR, NFR
- S5 ops lab: health live/ready, `compose.prod.yaml` + Caddy, CI + **gate p95**, runbook E14
- **Fase 2 Done** (F2-01…F2-09): intake chat, preventivi, scorecard, contratti+PM, CSV, PWA, AI suggest, email inbound, audit config
- Hardening post-F2: health smoke pack, suggest-vendor UI, cataloghi `INTAKE_*`/asset, i18n store/vendor, KPI extract
- **NO-GO produzione** finché VPS EU non chiude [`docs/product/sprints/S5-EXIT-GAPS.md`](../../docs/product/sprints/S5-EXIT-GAPS.md)

## Test plan

- [x] `npm run verify:local` (typecheck + **106** test + secrets:scan)
- [x] `npm run perf:hq-list` p95 ≪ 300 ms su seed pilota
- [x] `npm run deploy:migrate:lab` (backup + migrate host)
- [x] Restore drill locale annotato in `docs/ops/BACKUP.md`
- [ ] CI GitHub su PR → `develop` (workflow include seed + p95)
- [ ] Staging VPS HTTPS + smoke UI Flusso A

## Note GitFlow

Non mergiare su `main` senza `release/x.y.z`. Target PR: **`develop`**.
