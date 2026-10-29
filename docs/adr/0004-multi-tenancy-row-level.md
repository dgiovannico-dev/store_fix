# ADR-0004: Multi-tenancy by shared schema + row `tenantId`

## Status

Accepted

## Date

2026-10-28

## Context

Pilota target ~15 stores / 5 vendors per tenant, multi-tenant SaaS shape without per-tenant databases. Hard requirement: no cross-tenant data leak (DoD + `US-E01-01`). Membership scopes stores/vendor inside a tenant; HQ roles see all stores in their tenant.

## Decision

**Shared PostgreSQL schema**, every domain table carries **`tenantId`**, and **every query/mutation filters by tenant** from the authenticated Membership. Application-enforced row isolation (Prisma middleware / repository helpers); optional Postgres RLS later as defense-in-depth, not MVP blocker. Soft-delete and GDPR export/retention are per-tenant.

## Consequences

- Simpler Compose and migrations; one backup pipeline.
- Bug in a missing `tenantId` filter is a severity-1 — must be covered by automated isolation tests.
- Indexes always include `tenantId` as leading or composite key where lists filter by tenant.
- No “superuser UI” that bypasses tenant without an explicit break-glass story (out of MVP).

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| DB-per-tenant | Ops explosion for mid-market MVP; migration fan-out |
| Schema-per-tenant | Same operational cost; Prisma friction |
| Rely only on RLS without app filters | Easy to bypass via raw queries; RLS alone insufficient for app bugs |
