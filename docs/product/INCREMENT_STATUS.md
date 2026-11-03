# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-11-03 — **dev-only**; F3-01 VPS umano; **Fase 4 Done in-repo** (k3s/Helm/OpenBao/Keycloak/cutover)  
Hardening recente: F4-01…05 + retro [`retros/F4-2026-11-03.md`](./retros/F4-2026-11-03.md); Compose digests.

**Autopilot:** F3-02…F3-08 Done; **F4-01…05 Done in-repo**; CI `helm:template`. Resta F3-01 / install k3s+OpenBao+Keycloak su host (umano). Niente Fase 5 inventata.

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake, preventivi, scorecard, PM, CSV, PWA, AI, email inbound, audit |
| Fase 3 (F3-02…F3-08) | **Done in-repo** | observe, summarize, IMAP, RRULE, i18n prefs, RFQ, store push |
| F3-01 Exit pilota | **Blocked (skip deploy)** | Host/DNS/VPS — Compose **o** k3s (F4) |
| Fase 4 (F4-01…05) | **Done in-repo** | k3s+Helm · OpenBao · Keycloak · cutover — [`COMPOSE_TO_K3S.md`](../ops/COMPOSE_TO_K3S.md) |

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
