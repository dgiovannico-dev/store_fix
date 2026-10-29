# ADR-0002: Next.js modular monolith (hexagonal slices)

## Status

Accepted

## Date

2026-10-28

## Context

MVP needs one deployable app (HQ, store, vendor portals) with clear domain boundaries (tenancy, tickets, SLA, vendors, assets) and testable domain logic. A microservices split would explode Compose ops before product-market fit. Agents and humans need a shared module shape: ports/adapters without premature distributed systems.

## Decision

Ship a **modular monolith** on **Next.js App Router**: UI + Server Actions/Route Handlers as adapters; domain use-cases and entities in framework-agnostic modules; Prisma/SeaweedFS/pg-boss/Nodemailer behind ports. One Postgres database; `tenantId` on every domain row. Worker process shares domain packages, not HTTP fan-out between services.

## Consequences

- Vertical slices per bounded concept; deep modules for Tenant/Store/Ticket/SLA/Vendor.
- Domain tests run without spinning Next for pure logic.
- Later extraction of worker or read models is possible without rewriting vocabulary.
- Discipline required: no leaking Prisma types into UI; no cross-tenant queries.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Microservices (ticket-svc, auth-svc, …) | Ops/Compose cost &gt; MVP value; distributed transactions for SLA+notify |
| Classic layered “dump in /lib” monolith | Becomes god-modules; hard for multi-agent ownership |
| Separate BFF + API gateway | Extra hop without multi-client need in MVP |
