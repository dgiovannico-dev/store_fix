# ADR-0011: Keycloak (OIDC) + Vault for secrets

## Status

Accepted (Fase 4 — path locked; **F4-06** multi-app platform)

## Date

2026-11-03 (amended 2026-11-04)

## Context

ADR-0003 locks Auth.js + Postgres sessions for MVP. Product requires **Keycloak** as IdP and a **Vault** secret manager on the same self-hosted VPS/Kubernetes stack (ADR-0010). Both must serve **più applicativi** sullo stesso VPS (non solo FacilityFlow).

## Decision

1. **Secrets:** **OpenBao** (Vault-compatible KV v2, MPL-2.0) is a **shared platform** service (ADR-0001 — no HashiCorp Vault BSL). Layout: `secret/apps/<app-id>/…` + per-app ESO policies. FacilityFlow path: `secret/apps/facilityflow/runtime`. Inject via External Secrets into each app’s namespace Secret.
2. **Auth:** **Keycloak** is a **shared IdP**. Default: **one realm `platform`** + **one confidential OIDC client per application** (SSO). Separate realms only for distinct user populations. FacilityFlow client: `facilityflow-app`; Auth.js remains OIDC broker (Credentials lab-only in prod).
3. FacilityFlow must **not** embed OpenBao/Keycloak as chart subcharts owned by the app; install once, onboard apps via clients + policies — [`docs/ops/PLATFORM_IAM.md`](../ops/PLATFORM_IAM.md).
4. Supersede ADR-0003 only when OIDC is default in prod values and Credentials are lab-only (F4-04 DoD).

## Consequences

- Issuer URL: `https://auth.<domain>/realms/platform` (not `/realms/facilityflow`).
- Operators say “Vault” → OpenBao unless waived.
- Realm export: [`deploy/keycloak/realm-platform.json`](../../deploy/keycloak/realm-platform.json).
- VPS RAM: plan shared Keycloak + OpenBao + N apps (≥ 8 GB).

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Realm Keycloak per ogni app | Niente SSO; overhead admin |
| Un solo client OIDC per tutte le app | Redirect/audience confusi; blast radius |
| Policy OpenBao `secret/*` per ogni ESO | Lateral secret read tra app |
| Cloud IdP / HCP Vault | Viola ADR-0001 OSS-only / self-host |
| Replace Auth.js overnight | Breaks sessions/RBAC |
