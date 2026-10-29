# ADR-0001: Stack OSS-only / self-host

## Status

Accepted

## Date

2026-10-28

## Context

FacilityFlow Retail is a multi-tenant SoR for Italian retail facility ops. The product must run on EU VPS without paid SaaS in the critical path (auth, DB, object storage, email, jobs, error tracking). Locking the stack before scaffold avoids “free tier now, paywall later” lock-in and keeps GDPR surface smaller.

## Decision

Every runtime component is OSI-approved (or equivalently permissive) and self-hostable via Docker Compose: Next.js, Auth.js, PostgreSQL, Prisma, SeaweedFS, Nodemailer (+ Mailpit in dev), pg-boss worker, optional GlitchTip/Loki. Hosting (VPS EU) is infrastructure, not a software SaaS dependency. Detail: `docs/product/STACK.md`.

## Consequences

- Compose + runbooks are first-class (backup, TLS, SMTP deliverability).
- No Clerk/Neon/R2/Resend/Inngest Cloud/Sentry Cloud in MVP.
- Ops burden shifts to the team; mitigated by E00/E14 and `post-dev-verify`.
- Fase 2 AI prefers local Ollama + human confirm — never SoR.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Managed BaaS (Clerk + Neon + R2 + Resend) | Paywall / US vendors in critical path; conflicts with OSS-only policy |
| Hybrid “OSS app + paid email/jobs” | Still SaaS dependency for core flows |
| MinIO community for objects | Project archived / unsuitable for greenfield 2026 |
