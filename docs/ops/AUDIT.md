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

Baseline post-fix (2026-10-29): **11** advisory (4 moderate / 5 high / 2 critical) — tutti in tabella waiver sotto.

## Waiver aperti (dev / transitive)

| Area | Severity | Motivo waiver | Exit |
|------|----------|---------------|------|
| `vitest` / `tinypool` / `vite` / `esbuild` | high–critical | Solo **dev/test**; bump = Vitest 5 breaking | Slice dedicata vitest 5 |
| `prisma` / `deepmerge-ts` | high | Transitive Prisma 6 CLI; Prisma 7 = breaking schema | Attendere Prisma 7 piano |
| `next` / nested `postcss` | high | Fix via `next@16` force — fuori scope lab freeze Next 15 | Attendere patch Next 15.x |

Riesaminare waiver a ogni release / GO staging VPS.
