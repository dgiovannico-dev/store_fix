# Dependency audit (US-E14-10 / T5.21)

## Policy

- CI: `npm audit --audit-level=high` (warning / continue-on-error finché waiver sotto restano aperti)
- Locale: `npm audit --audit-level=high` dopo bump dipendenze
- **Fail hard** su high/critical nel path runtime **senza** waiver documentato qui
- Nessun SaaS scanner a pagamento (no Snyk Cloud obbligatorio)

## Azioni in-repo (2026-10-29)

| Pacchetto | Azione | Note |
|-----------|--------|------|
| `sharp` (via Next) | bump lock → `0.35.5` | `npm audit fix` non-breaking |
| `nodemailer` | `10.3.0` + `overrides` | CVE ≤10.1.3 chiusi; peer next-auth `^7\|\|^8` — override intenzionale |
| lint | rimosso `eslint-disable` inutilizzato | `flusso-c-hard-timing` |
| `vitest` / `tinypool` / `vite` | Vitest **5.0.5** + Vite **^6.4** + `@types/node` ^22 | Chiude critical tinypool / mocker; 127 test PASS |

Baseline post-Vitest 5 (2026-10-29): **5** advisory (1 moderate / 4 high) — solo waiver sotto.

## Waiver aperti (transitive / major freeze)

| Area | Severity | Motivo waiver | Exit |
|------|----------|---------------|------|
| `prisma` / `deepmerge-ts` | high | Transitive Prisma 6 CLI; Prisma 7 = breaking schema | Piano Prisma 7 |
| `next` / nested `postcss` | high | Fix via `next@16` force — lab freeze Next 15 | Patch Next 15.x o piano Next 16 |

Riesaminare waiver a ogni release / GO staging VPS.
