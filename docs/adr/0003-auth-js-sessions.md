# ADR-0003: Auth.js with Postgres sessions

## Status

Accepted

## Date

2026-10-28

## Context

Users need email/password (Credentials), optional magic link (Email provider), invite acceptance, and reliable logout across HQ/store/vendor surfaces. Session data must sit in the same EU Postgres as the SoR — no hosted auth SaaS (ADR-0001). CSRF-safe mutations and rate-limited login are MVP security baselines (`US-E01-*`, `US-E10-07`).

## Decision

Use **Auth.js (NextAuth v5)** with the **Postgres adapter**: DB-backed sessions, httpOnly cookies, Credentials + Email providers over Nodemailer/SMTP (Mailpit in dev). Membership/role claims loaded into the session for RBAC gates; logout invalidates the server session row.

## Consequences

- Auth tables coexist with domain schema; migrations owned by the app.
- Server Actions / mutations must remain CSRF-safe under Auth.js conventions.
- Invite and password-reset flows reuse the same SMTP path as transactional mail.
- Custom Membership soft-disable must revoke effective access even if cookie still present (re-check Membership on request).

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Clerk / Auth0 / Supabase Auth managed | SaaS, conflicts with OSS-only |
| JWT-only stateless sessions | Harder immediate revoke; weaker fit for soft-disable Membership |
| Custom auth from scratch | Security footguns; no gain vs Auth.js adapter |
