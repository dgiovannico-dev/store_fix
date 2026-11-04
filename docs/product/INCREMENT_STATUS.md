# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-11-04 — **dev-only**; F3-01 VPS umano; F4 Done; **F5 UX Done** (F5-UX-14 aperto); **F6 bozza PO**  
Hardening recente: F4-01…06 + F5-UX + positioning [`COMPETITIVE_POSITIONING.md`](./COMPETITIVE_POSITIONING.md).

**Autopilot:** F3–F5 (salvo F5-UX-14 / F3-01). **Fase 6** in BACKLOG = bozza — conferma PO prima di implementare. Next in-repo ammissibile senza conferma: **F5-UX-14** / debt.

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake, preventivi, scorecard, PM, CSV, PWA, AI, email inbound, audit |
| Fase 3 (F3-02…F3-08) | **Done in-repo** | observe, summarize, IMAP, RRULE, i18n prefs, RFQ, store push |
| F3-01 Exit pilota | **Blocked (skip deploy)** | Host/DNS/VPS — Compose **o** k3s (F4) |
| Fase 4 (F4-01…06) | **Done in-repo** | k3s+Helm · OpenBao/Keycloak **shared** · cutover — [`PLATFORM_IAM.md`](../ops/PLATFORM_IAM.md) |
| Fase 5 (F5-UX-00…15) | **Done salvo F5-UX-14** | Day/Week/Month GCal ancora aperto |
| Fase 6 (F6-01…10) | **Bozza PO** | Motivi di preferenza — conferma prima di sprint |
| Fase 7 (F7-01…10) | **Bozza PO** | AI vLLM + multi-provider BYOK — [`AI_PLATFORM.md`](./AI_PLATFORM.md) |

## Modalità corrente

**Solo sviluppi in-repo** — niente `vps:wizard` / compose.prod su host remoto finché non richiesto.  
Autopilot continua su debt / hardening / gap codice senza inventare nuove Fase 3 fuori tabella F3. `gdpr.purge` + `attachment.gc` + `rate_limit.gc` in-repo. Baseline header: [`SECURITY_HEADERS.md`](../ops/SECURITY_HEADERS.md).

### Prove locali

- `npm run verify:local` · `npm audit --audit-level=high` (0 high+; moderate eslint/minimatch waived) · `npm run build` OK
- `npm run smoke:http` PASS · **anche in CI** post-`next start`
- `npm run helm:template` · `compose:prod|lab|observe:config` OK · `vps:preflight` OK (preflight ≠ deploy)

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
