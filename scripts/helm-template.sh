#!/usr/bin/env bash
# Render Helm chart without a cluster (F4-01). Uses alpine/helm via Docker if helm CLI absent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHART="${ROOT}/deploy/helm/facilityflow"
IMAGE="${HELM_IMAGE:-alpine/helm:3.16.4}"

if command -v helm >/dev/null 2>&1; then
  echo "helm-template: local helm → ${CHART}"
  helm template ff "${CHART}" --namespace facilityflow >/dev/null
  helm lint "${CHART}"
else
  echo "helm-template: ${IMAGE} → ${CHART}"
  docker run --rm -v "${CHART}:/chart:ro" "${IMAGE}" template ff /chart --namespace facilityflow >/dev/null
  docker run --rm -v "${CHART}:/chart:ro" "${IMAGE}" lint /chart
fi
echo "helm-template OK"
