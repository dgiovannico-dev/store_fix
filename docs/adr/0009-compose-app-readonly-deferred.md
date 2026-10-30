# ADR-0009: Compose `read_only` rootfs for app deferred

## Status

Accepted (deferred)

## Date

2026-10-30

## Context

Docker hardening guides recommend `read_only: true` plus `tmpfs` for writable paths. FacilityFlow `app` runs Next.js (`npm run start`) as `USER nextjs` with `no-new-privileges`. A full read-only rootfs typically needs writable `/tmp` and often `.next/cache` (and possibly other runtime paths), which is easy to get wrong and break healthchecks / first request compilation artifacts in the current non-standalone image layout.

## Decision

**Defer** `read_only` + `tmpfs` on `app`/`worker` until after VPS GO / E14 exit, when we can:

1. Prefer Next **standalone** output (smaller writable surface), or
2. Enumerate exact writable paths under a staging smoke (`health/ready` + Flusso A).

Keep current hardening: non-root USER, `no-new-privileges`, loopback publishes, healthchecks, pinned images.

## Consequences

- Rootfs remains writable inside the container (mitigated by non-root + no-new-privileges).
- Avoids flaky Compose regressions in lab while still closing F3-01 on the human VPS path.

## Alternatives rejected

| Alternative | Perché no (ora) |
|-------------|-----------------|
| Blind `read_only` + `/tmp` only | Likely breaks Next cache / runtime writes |
| Invent standalone migration in this slice | Scope creep vs thin ops hardening |

## References

- `docs/ops/COMPOSE.md` · `Dockerfile` · OWASP Docker cheat sheet
