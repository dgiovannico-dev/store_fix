#!/usr/bin/env bash
# Render Helm chart without a cluster (F4-01/02). Uses alpine/helm via Docker if helm CLI absent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHART="${ROOT}/deploy/helm/facilityflow"
IMAGE="${HELM_IMAGE:-alpine/helm:3.16.4}"

run_helm() {
  if command -v helm >/dev/null 2>&1; then
    helm "$@"
  else
    # chart mounted at /chart; rewrite local paths after --values / -f
    local args=()
    local prev=""
    for a in "$@"; do
      if [[ "$prev" == "-f" || "$prev" == "--values" ]]; then
        args+=("/chart/$(basename "$a")")
      elif [[ "$a" == "$CHART" ]]; then
        args+=("/chart")
      else
        args+=("$a")
      fi
      prev="$a"
    done
    docker run --rm -v "${CHART}:/chart:ro" "${IMAGE}" "${args[@]}"
  fi
}

echo "helm-template: lint + base/staging/prod → ${CHART}"
run_helm lint "${CHART}"
run_helm template ff "${CHART}" --namespace facilityflow >/dev/null
run_helm template ff-staging "${CHART}" --namespace facilityflow \
  -f "${CHART}/values-staging.yaml" >/dev/null
# prod overlay with placeholder digests so image refs are digest-pinned in render
run_helm template ff-prod "${CHART}" --namespace facilityflow \
  -f "${CHART}/values-prod.yaml" \
  --set app.image.digest=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc \
  --set worker.image.digest=sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd \
  >/dev/null

# Assert PDB appears when overlay enables it
OUT="$(run_helm template ff-staging "${CHART}" --namespace facilityflow -f "${CHART}/values-staging.yaml")"
echo "$OUT" | grep -q 'kind: PodDisruptionBudget' || {
  echo "helm-template FAIL: expected PodDisruptionBudget in staging render" >&2
  exit 1
}
OUT_PROD="$(run_helm template ff-prod "${CHART}" --namespace facilityflow \
  -f "${CHART}/values-prod.yaml" \
  --set app.image.digest=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc \
  --set worker.image.digest=sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd)"
echo "$OUT_PROD" | grep -q '@sha256:cccccccccccccccc' || {
  echo "helm-template FAIL: expected app image digest in prod render" >&2
  exit 1
}

echo "helm-template OK (base + staging + prod)"
