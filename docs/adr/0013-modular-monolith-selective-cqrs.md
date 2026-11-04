# ADR-0013: Modular monolith + selective CQRS (incremental)

## Status

Accepted — implements / sharpens [ADR-0002](./0002-nextjs-modular-monolith-hexagonal.md)

## Date

2026-11-04

## Context

`src/` had impure Prisma services under `domain/`, page-inline heavy reads, and a few P0 auth/notify gaps. A full ports/adapters rewrite or microservices split would raise regression risk on Flusso A/B/C, tenancy, and email outbox.

## Decision

1. Keep a **single Next.js modular monolith** (OSS Compose/k3s).
2. **Domain = pure rules** (FSM, RBAC, validators). **Application = use cases + Prisma.** Presentation labels live under `src/lib/labels/`.
3. **Selective CQRS (light):** extract heavy HQ reads (wallboard, chargeback, contract performance) into `application/*/…-query.ts`. No Postgres replicas, no materialized views, no Valkey for reads in this phase.
4. **No Prisma repository ports in v1** — defer until a second adapter exists.
5. Deliver via anti-regression slices (R0 safety net → R1 correctness → R2 mechanical moves → R3 query modules → R4 load/UX), each with `verify:local` + GitFlow PR.

## Consequences

- Clearer BC ownership; fewer accidental domain→application cycles.
- Pages stay auth + render; query modules own tenancy filters.
- Ticket/SLA notify + outbox stay in the same TX as domain writes (aligned with F3-09).
- Later extraction of a read worker remains possible without renaming the whole tree.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Ports Prisma ovunque | Churn alto, zero secondo adapter |
| CQRS su ogni CRUD store/vendor | Overkill MVP |
| Microservizi / monorepo packages | Ops & regressioni |
| Big-bang rename `domain/` | Blocca delivery |
