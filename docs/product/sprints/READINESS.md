# Pre-development readiness — FacilityFlow Retail

> Aggiornato 2026-10-29: Increment S1–S5 lab + Fase 2 + hardening in-repo Done; Go prod = VPS.

## Verdetto attuale

| Dimensione | Stato |
|------------|--------|
| Brief MVP + Flussi A/B/C + NFR + OSS | ✅ |
| Backlog E00–E14 / S1–S5 | ✅ Done (lab) |
| Fase 2 (F2-01…F2-09) | ✅ Done |
| Hardening post-F2 in-repo (smoke health, AI vendor UI, cataloghi, i18n liste, KPI) | ✅ |
| DoD / GitFlow / STACK OSS | ✅ |
| Lab ops (compose, health, backup, CI p95, migrate lab) | ✅ |
| **Go staging / pilota VPS** | ❌ NO-GO — [`S5-EXIT-GAPS.md`](./S5-EXIT-GAPS.md) · [`../../ops/NEXT_VPS.md`](../../ops/NEXT_VPS.md) |

## Cosa fare adesso (umano)

1. VPS EU + DNS + `compose.prod` (unica via al Go)
2. Integrazione: **push diretto su `develop`** (niente PR); consolidamento su `main` solo via release/hotfix GitFlow
3. Non inventare Fase 3 fuori backlog — sviluppo F3-02+ solo dopo F3-01 / GO VPS

## Verify locale

```bash
npm run verify:local
npm run deploy:migrate:lab
npm run db:seed:pilot && npm run perf:hq-list
```

## Riferimenti

- Increment: [`../INCREMENT_STATUS.md`](../INCREMENT_STATUS.md)
- Exit gaps: [`S5-EXIT-GAPS.md`](./S5-EXIT-GAPS.md)
- PR draft: [`.scratch/lab-freeze/PR_DRAFT.md`](../../../.scratch/lab-freeze/PR_DRAFT.md)
