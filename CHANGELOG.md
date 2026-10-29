# Changelog

Formato ispirato a [Keep a Changelog](https://keepachangelog.com/). Tag GitFlow: `vMAJOR.MINOR.PATCH`.

## [Unreleased]

### Changed
- GitFlow **senza PR**: push su `develop`; `main` solo via `release/*` / `hotfix/*`

## [0.1.0] — 2026-10-29

### Lab freeze → `main`

- Increment **S1–S5 lab** + **Fase 2** + hardening post-F2
- CI green su `develop` (US-E14-04: verify + seed + p95)
- Stack OSS Compose (Auth.js, Prisma, SeaweedFS, pg-boss, Mailpit)

### Notes

- **Produzione pilota ancora NO-GO** finché VPS EU non chiude [`docs/product/sprints/S5-EXIT-GAPS.md`](./docs/product/sprints/S5-EXIT-GAPS.md)
- Tag `v0.1.0` = codice consolidato su `main`, **non** Go deploy prod
