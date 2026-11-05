# Increment status — FacilityFlow Retail

**Aggiornato:** 2026-11-05 — **dev-only**; F3-01 VPS umano; F4–F9 Done in-repo; **R0–R4 modular monolith anti-regressione Done** (ADR-0013).

Hardening recente: F9 adoption (digest habit, Flusso A CTA, vendor nudge, trust/QR/SSO packs), breadcrumb hydration fix, refactor R0–R4.

**Autopilot:** F3–F9 in-repo chiusi salvo F3-01 VPS + F7-08/09 deferred. **Hard-stop prodotto** finché VPS o nuovo item backlog.

| Sprint / fase | Stato | Note |
|---------------|-------|------|
| S1–S3 | Done | Wedge + Flussi A/B/C |
| S4 | Done | Dashboard HQ, seed 15×5, NFR, GDPR |
| S5 | Lab PASS / **NO-GO VPS** | Ops E14; gap in [`sprints/S5-EXIT-GAPS.md`](./sprints/S5-EXIT-GAPS.md) |
| Fase 2 (F2-01…F2-09) | **Done** | Intake, preventivi, scorecard, PM, CSV, PWA, AI, email inbound, audit |
| Fase 3 (F3-02…F3-09) | **Done in-repo** | observe…outbox; F3-01 host |
| F3-01 Exit pilota | **Blocked (skip deploy)** | Host/DNS/VPS — Compose **o** k3s (F4) |
| Fase 4 (F4-01…06) | **Done in-repo** | k3s+Helm · OpenBao/Keycloak **shared** |
| Fase 5 (F5-UX-00…15) | **Done** | Incl. F5-UX-14 Day/Week/Month |
| Fase 6 (F6-01…10) | **Done in-repo** | Digest, chargeback, outbox, wallboard, … |
| Fase 7 (F7-01…10) | **Done core** | vLLM gateway + settings; F7-08/09 deferred |
| Fase 8 (F8-01…10) | **Done in-repo** | Driver.js tour on-demand |
| Fase 9 / S6 (F9-01…11) | **Done in-repo** | Adoption no-billing; retro `retros/S6-2026-11-05.md` |
| **Refactor R0–R4** | **Done** | Safety net → P0 security → layer moves → CQRS reads → load/UX; ADR-0013 |

## Modalità corrente

**Solo sviluppi in-repo** — niente `vps:wizard` / compose.prod su host remoto finché non richiesto.  
Autopilot continua su debt / hardening / gap codice senza inventare nuove Fase 3 fuori tabella F3. Baseline: [`SECURITY_HEADERS.md`](../ops/SECURITY_HEADERS.md) · arch: [`adr/0013-modular-monolith-selective-cqrs.md`](../adr/0013-modular-monolith-selective-cqrs.md).

### Prove locali

- `npm run verify:local` · `npm audit --audit-level=high` · `npm run build`
- `npm run smoke:http` · `npm run helm:template` · `compose:prod|lab|observe:config`

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
