#!/usr/bin/env bash
# Render Helm chart without a cluster (F4-01…03). Uses alpine/helm via Docker if helm CLI absent.
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
# F4-03: staging enables vault → ExternalSecret + SecretStore
echo "$OUT" | grep -q 'kind: ExternalSecret' || {
  echo "helm-template FAIL: expected ExternalSecret in staging render (vault.enabled)" >&2
  exit 1
}
echo "$OUT" | grep -q 'kind: SecretStore' || {
  echo "helm-template FAIL: expected SecretStore in staging render" >&2
  exit 1
}
echo "$OUT" | grep -q 'name: facilityflow-runtime' || {
  echo "helm-template FAIL: expected target Secret facilityflow-runtime" >&2
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
echo "$OUT_PROD" | grep -q 'kind: ExternalSecret' || {
  echo "helm-template FAIL: expected ExternalSecret in prod render" >&2
  exit 1
}
# F4-04: prod OIDC on, Credentials off
echo "$OUT_PROD" | grep -q 'AUTH_OIDC_ENABLED' || {
  echo "helm-template FAIL: expected AUTH_OIDC_ENABLED in prod render" >&2
  exit 1
}
echo "$OUT_PROD" | grep -q 'name: AUTH_CREDENTIALS_ENABLED' || {
  echo "helm-template FAIL: expected AUTH_CREDENTIALS_ENABLED in prod" >&2
  exit 1
}
echo "$OUT_PROD" | grep -A1 'name: AUTH_CREDENTIALS_ENABLED' | grep -q '"0"' || {
  echo "helm-template FAIL: prod Credentials must be disabled (0)" >&2
  exit 1
}
echo "$OUT_PROD" | grep -q 'AUTH_KEYCLOAK_SECRET' || {
  echo "helm-template FAIL: expected AUTH_KEYCLOAK_SECRET sync in prod" >&2
  exit 1
}

# Base values keep vault off — no ExternalSecret
OUT_BASE="$(run_helm template ff "${CHART}" --namespace facilityflow)"
if echo "$OUT_BASE" | grep -q 'kind: ExternalSecret'; then
  echo "helm-template FAIL: base values must not enable vault/ExternalSecret" >&2
  exit 1
fi
if echo "$OUT_BASE" | grep -q 'AUTH_OIDC_ENABLED'; then
  echo "helm-template FAIL: base values must not enable Keycloak OIDC" >&2
  exit 1
fi

echo "helm-template OK (base + staging + prod + OpenBao ESO + Keycloak)"
