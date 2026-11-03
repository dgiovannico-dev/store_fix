# ADR-0011: Keycloak (OIDC) + Vault for secrets

## Status

Accepted (Fase 4 — deferred implementation; path locked)

## Date

2026-11-03

## Context

ADR-0003 locks Auth.js + Postgres sessions for MVP. Product now requires **Keycloak** as IdP and a **Vault** secret manager on the same self-hosted VPS/Kubernetes stack (ADR-0010). Both are OSS and self-hostable; a big-bang cutover would block pilota.

## Decision

1. **Secrets (F4-03):** **OpenBao** (Vault-compatible KV v2 API, MPL-2.0) on the cluster — satisfies ADR-0001 (HashiCorp Vault post-2023 is BSL, not OSI). Inject via External Secrets Operator / agent into Helm. `.env.prod` remains for Compose lab only. Operators may say “Vault”; we mean the OpenBao binary unless an explicit waiver is recorded.
2. **Auth (F4-04):** Introduce **Keycloak** as OIDC provider; FacilityFlow keeps **Auth.js as OIDC client/broker** first (Credentials may remain for lab/seed). Full removal of Auth.js credentials is a later slice after Keycloak realms/roles map to Membership/RBAC.
3. Supersede ADR-0003 only when OIDC path is default in prod values and Credentials are lab-only — track in BACKLOG F4-04 DoD.

## Consequences

- New ADR does **not** delete Auth.js tables yet; dual path during migration.
- Vault unseal / init is human ops on VPS — documented in [`docs/ops/VAULT.md`](../ops/VAULT.md) (F4-03).
- Keycloak realm export checked into `deploy/keycloak/` (no secrets).
- VPS RAM: plan Keycloak + Vault alongside app (≥ 8 GB recommended).

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Replace Auth.js overnight | Breaks sessions/RBAC/tests; no thin slice |
| Cloud IdP (Auth0/Clerk) | Violates ADR-0001 OSS-only |
| Keep only `.env` files in K8s | No rotation/audit; conflicts with Vault ask |
| SaaS Vault (HCP) | Paid cloud; out of VPS self-host intent |
