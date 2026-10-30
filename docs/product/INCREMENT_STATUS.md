# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-10-29 — **dev-only** (nessun deploy VPS); F3-01 resta tracking umano  
Hardening recente in-repo: CI Actions SHA pin; Dependabot weekly; Node/Compose digests; ADR-0009.

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake, preventivi, scorecard, PM, CSV, PWA, AI, email inbound, audit |
| Fase 3 (F3-02…F3-08) | **Done in-repo** | observe, summarize, IMAP, RRULE, i18n prefs, RFQ, store push |
| F3-01 Exit pilota | **Blocked (skip deploy)** | Host/DNS/VPS — ripresa solo quando richiesto |

## Modalità corrente

**Solo sviluppi in-repo** — niente `vps:wizard` / compose.prod su host remoto finché non richiesto.  
Autopilot continua su debt / hardening / gap codice senza inventare nuove Fase 3 fuori tabella F3. `gdpr.purge` + `attachment.gc` + `rate_limit.gc` in-repo. Baseline header: [`SECURITY_HEADERS.md`](../ops/SECURITY_HEADERS.md).

### Prove locali

- `npm run verify:local` · `npm audit` → 0 · `npm run build` OK
- `npm run smoke:http` PASS (2026-10-29) · **anche in CI** post-`next start`
- `compose:prod|lab|observe:config` OK · `vps:preflight` OK (preflight ≠ deploy)

## Quando riprenderà il deploy (umano)

1. **VPS EU / staging** — `npm run vps:wizard` → host/DNS/UFW → `compose.prod` → `vps:remote-check`
2. Opt-in observe su VPS se RAM ≥512 MiB
3. Chiudere gap in `S5-EXIT-GAPS.md` → GO staging / pilota

## Verify locale

```bash
npm run verify:local
npm run compose:observe:config
npm run compose:lab:config
```
