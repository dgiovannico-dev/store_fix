# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-10-29 — **hard-stop autopilot**: in-repo chiuso; solo F3-01 umano

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake, preventivi, scorecard, PM, CSV, PWA, AI, email inbound, audit |
| Fase 3 (F3-02…F3-08) | **Done in-repo** | observe, summarize, IMAP, RRULE, i18n prefs, RFQ, store push |
| F3-01 Exit pilota | **Blocked** | Host/DNS/VPS — [`../ops/NEXT_VPS.md`](../ops/NEXT_VPS.md) |

## Freeze + ripresa

Increment lab + Fase 3 + hardening OSS (i18n, stress 5k, Vitest 5, `npm audit` 0, `next build` Sentry) chiusi sotto autopilot.  
**Hard-stop:** F3-01 richiede IP/DNS/secret/VPS umani — nessun altro item F3/P1/P2/debt in-repo aperto.  
Retro: [`retros/F3-2026-10-29.md`](./retros/F3-2026-10-29.md).

### Prove locali (ripassate 2026-10-29)

- `npm run verify:local` · `npm audit` → 0 · `npm run build` OK
- `compose:prod|lab|observe:config` OK · `vps:preflight` OK

## Cosa fare adesso (umano)

1. **VPS EU / staging** — `npm run vps:wizard` → host/DNS/UFW → `compose.prod` → `vps:remote-check`
2. Opt-in observe su VPS se RAM ≥512 MiB
3. Chiudere gap in `S5-EXIT-GAPS.md` → GO staging / pilota

## Verify locale

```bash
npm run verify:local
npm run compose:observe:config
npm run compose:lab:config
npm run vps:preflight
```
