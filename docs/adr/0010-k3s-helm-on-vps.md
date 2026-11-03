# ADR-0010: Kubernetes (k3s) + Helm on VPS EU

## Status

Accepted (Fase 4 — in progress)

## Date

2026-11-03

## Context

F3-01 targeted Docker Compose on a single VPS EU. The product owner now requires **Kubernetes with Helm charts** on a VPS (not AWS managed K8s), plus Keycloak and Vault (separate ADRs / F4 items). Compose remains the **lab/dev** path (`docker-compose.yml`); production target moves to k3s + Helm.

## Decision

- Runtime prod/staging: **k3s** (or k0s) single-node (or small HA later) on VPS EU.
- Packaging: Helm chart under `deploy/helm/facilityflow/`.
- Ingress: Traefik (k3s default) or Caddy ingress — documented in `docs/ops/KUBERNETES.md`.
- Lab/CI: keep Compose for `verify:local` and developer speed; no requirement to run k3s in CI MVP of F4-01.
- No EKS/GKE/AKS; no paid cloud control plane.

## Consequences

- Ops runbooks (`NEXT_VPS.md`, `COMPOSE_PROD.md`) gain a parallel K8s path; F3-01 GO can be satisfied via k3s once charts are proven.
- Image digests already pinned in Compose/Dockerfiles feed the same images into chart `values.yaml`.
- Team must size VPS for k3s + workloads (≥ 4 vCPU / 8 GB when Keycloak + Vault join).

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Stay Compose-only forever | Conflicts with stated K8s/Helm requirement |
| EKS / managed K8s | Cloud control plane; out of “VPS self-host” intent |
| Raw manifests without Helm | Harder values/env overlays; PO asked for Helm |
| Full k8s in CI day-1 | Heavy; F4-01 validates `helm template` / chart lint in-repo |
