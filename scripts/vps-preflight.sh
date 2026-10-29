#!/usr/bin/env bash
# Preflight locale prima del provisioning VPS (US-E14 / NEXT_VPS.md).
# Non tocca host remoto — solo artefatti repo + Docker locale se disponibile.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "  OK  $*"; }
ko() { echo "  FAIL $*"; fail=1; }

echo "== FacilityFlow VPS preflight =="

echo "-- Artefatti obbligatori"
for f in \
  compose.prod.yaml \
  compose.lab.yaml \
  .env.prod.example \
  deploy/Caddyfile \
  scripts/deploy-migrate.sh \
  scripts/pg-backup.sh \
  scripts/verify-security-headers.sh \
  docs/ops/NEXT_VPS.md \
  docs/ops/FIREWALL.md \
  docs/ops/SECRETS.md \
  docs/ops/COMPOSE_PROD.md \
  docs/ops/SMOKE_FLUSSO_A.md \
  docs/product/sprints/S5-EXIT-GAPS.md
do
  if [[ -f "$f" ]]; then ok "$f"; else ko "manca $f"; fi
done

echo "-- Guardrail secret"
if npm run secrets:scan --silent; then ok "secrets:scan"; else ko "secrets:scan"; fi

echo "-- Tag lab"
if git rev-parse -q --verify "refs/tags/v0.1.0" >/dev/null; then
  ok "tag v0.1.0 presente"
else
  ko "tag v0.1.0 assente (lab freeze)"
fi

echo "-- Compose prod config (richiede Docker)"
if command -v docker >/dev/null 2>&1; then
  if docker compose -f compose.prod.yaml --env-file .env.prod.example config --quiet; then
    ok "compose.prod.yaml config"
  else
    ko "compose.prod.yaml config"
  fi
  if docker compose -f compose.prod.yaml -f compose.lab.yaml --env-file .env.prod.example config --quiet; then
    ok "compose.lab.yaml merge config"
  else
    ko "compose.lab.yaml merge config"
  fi
else
  echo "  SKIP docker non in PATH"
fi

echo
if [[ "$fail" -ne 0 ]]; then
  echo "PREFLIGHT FAIL — sistema i FAIL sopra, poi ripeti."
  echo "Checklist host: docs/ops/NEXT_VPS.md"
  exit 1
fi

echo "PREFLIGHT OK — pronto per provisioning umano VPS (NEXT_VPS.md §1+)."
exit 0
