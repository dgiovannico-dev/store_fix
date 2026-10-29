#!/usr/bin/env bash
# Curl readiness — cron / monitoraggio (US-E14-08 / T5.18)
set -euo pipefail
URL="${FF_HEALTH_URL:-http://127.0.0.1:3000/api/health/ready}"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL") || CODE="000"
if [[ "$CODE" != "200" ]]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) FAIL $URL status=$CODE" >&2
  exit 1
fi
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) OK $URL"
