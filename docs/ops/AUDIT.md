# Dependency audit (US-E14-10 / T5.21)

## Policy

- CI: `npm audit --audit-level=high` (gate hard — baseline 0 high+; vedi anche `CI.md` / US-E14-04)
- CI: job **`osv`** — `bash scripts/osv-scan.sh` su `package-lock.json` (OSV.dev / T5.21)
- Locale: `npm audit --audit-level=high` e `npm run audit:osv` dopo bump dipendenze
- **Fail hard** su high/critical nel path runtime **senza** waiver documentato qui
- Nessun SaaS scanner a pagamento (no Snyk Cloud obbligatorio)

### OSV

```bash
npm run audit:osv
# pin: OSV_SCANNER_VERSION=v2.7.0 (default nello script)
```

Exit ≠ 0 se OSV trova CVE note; documentare waiver sotto se si accetta rischio temporaneo.

## Azioni in-repo (2026-10-29)

| Pacchetto | Azione | Note |
|-----------|--------|------|
| `sharp` (via Next) | bump lock → `0.35.5` | `npm audit fix` non-breaking |
| `nodemailer` | `10.3.0` + `overrides` | CVE ≤10.1.3; peer next-auth override |
| `vitest` / `vite` | Vitest **5.0.5** + Vite **^6.4** | Chiude tinypool critical |
| `deepmerge-ts` / `postcss` | overrides `8.0.2` / `8.5.32` | Senza bump Prisma 7 / Next 16 |
| `@vitejs/plugin-react` | rimosso | Non usato da `vitest.config.ts` |
| `@sentry/node` build | `webpackIgnore` + `serverExternalPackages` | Fix `node:` UnhandledSchemeError su `next build` |

**Baseline:** `npm audit` → **0 vulnerabilities** (2026-10-29).  
**OSV:** `npm run audit:osv` → **No issues found** (2026-10-29, scanner v2.7.0).

## Waiver aperti

Nessuno high/critical aperto.  
Eventuali regression: riesaminare a GO staging VPS / bump Next–Prisma major.
