# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-10-29 (F3-02…F3-08 in-repo Done; F3-01 VPS umano)

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake, preventivi, scorecard, PM, CSV, PWA, AI, email inbound, audit |
| Fase 3 (F3-02…F3-08) | **Done in-repo** | observe, summarize, IMAP, RRULE, i18n prefs, RFQ, store push |
| F3-01 Exit pilota | **Blocked** | Host/DNS/VPS — [`../ops/NEXT_VPS.md`](../ops/NEXT_VPS.md) |

## Freeze + ripresa

Increment lab + Fase 3 implementabile chiusi sotto autopilot.  
**Hard-stop:** solo F3-01 (secret/IP/DNS umani). Retro: [`retros/F3-2026-10-29.md`](./retros/F3-2026-10-29.md).

## Cosa fare adesso

1. **VPS EU / staging** — `npm run vps:preflight` → `vps:wizard` → host → `vps:remote-check`
2. Opt-in observe: `docker compose --profile observe up -d` (RAM ≥512 MiB)
3. Tag / GO E14 dopo smoke Flusso A su VPS

## Verify locale

```bash
npm run verify:local
npm run compose:observe:config
npm run compose:lab:config
```
