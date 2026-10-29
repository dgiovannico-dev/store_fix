# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-10-29 (post Fase 2 + hardening in-repo)

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR; i18n store/vendor + KPI extract |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake chat, preventivi, scorecard, contratti+PM, CSV, PWA, AI suggest, email inbound, audit config |
| Hardening post-F2 | **Done (lab)** | health smoke pack; suggest-vendor UI; `INTAKE_*` + asset SoT; CI p95 / migrate lab (già in path) |

## Freeze + ripresa

MVP lab S1–S5 chiuso; **Fase 2 + debt in-repo chiusi**.  
Go prod resta bloccato su VPS ([`../ops/NEXT_VPS.md`](../ops/NEXT_VPS.md)).  
**Niente Fase 3** finché non è in `BACKLOG.md`.

## Cosa fare adesso (solo umano / esplicito)

1. **VPS EU / staging** — [`../ops/NEXT_VPS.md`](../ops/NEXT_VPS.md)
2. **Commit / PR → develop** — bozza [`.scratch/lab-freeze/PR_DRAFT.md`](../../.scratch/lab-freeze/PR_DRAFT.md) — **solo se richiesto** (`crea PR…` / `commit`)
3. Opz. remoto: `STRESS_TICKETS=5000` su runner dedicata

## Verify locale

```bash
npm run verify:local
npm run db:seed:pilot && npm run perf:hq-list
npm run compose:lab:config   # richiede Docker
```
