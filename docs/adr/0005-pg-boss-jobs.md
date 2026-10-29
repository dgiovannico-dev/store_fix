# ADR-0005: Background jobs with pg-boss

## Status

Accepted

## Date

2026-10-28

## Context

SLA breach checks, email outbox, and optional GDPR purge must run reliably outside the HTTP request. Adding Redis (BullMQ) increases Compose surface; paid job clouds (Inngest/Trigger) violate ADR-0001. Throughput for a 15–50 store pilota is modest.

## Decision

Use **pg-boss** (MIT) on the same PostgreSQL instance, with a dedicated **`worker`** Compose service. Queues include at least `sla.check_breaches`, `email.send`, optional `gdpr.purge`. Handlers are **idempotent** (especially one breach notification per ticket until resolved). Prefer enqueue in the same transaction as the domain write when the adapter allows.

## Consequences

- No Redis required for MVP jobs.
- Jobs are backed up with Postgres; failed jobs inspectable via pg-boss tables + logs.
- Worker must be a long-lived process — not started per Next.js request ([pg-boss](https://pgboss.io/introduction)).
- At-least-once delivery: domain events must tolerate retries.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| BullMQ + Redis/Valkey | Extra stateful service; unnecessary at MVP volume |
| Inngest / Trigger.dev Cloud | SaaS; OSS-only violation |
| Cron hitting HTTP routes only | Weaker durability/retries for email + breach; harder transactional outbox |
