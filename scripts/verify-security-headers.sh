#!/usr/bin/env bash
# Smoke headers dietro URL (US-E14-10 / T5.19) — usare HTTPS staging
# Usage: bash scripts/verify-security-headers.sh [URL] [--prod]
# HSTS: non assertato qui su HTTP localhost (Caddy). Gate in-repo:
#   src/ops/caddyfile-hsts.test.ts · dietro proxy: curl -sI https://$FF_DOMAIN | grep -i strict-transport
set -euo pipefail
URL="${1:-http://127.0.0.1:3000/login}"
MODE="${2:-}"
HDR=$(curl -sI "$URL")
echo "$HDR"
echo "$HDR" | grep -qi 'content-security-policy' || { echo "missing CSP"; exit 1; }
echo "$HDR" | grep -qi 'x-frame-options' || { echo "missing XFO"; exit 1; }
echo "$HDR" | grep -qi 'x-content-type-options' || { echo "missing nosniff"; exit 1; }
echo "$HDR" | grep -qi 'cross-origin-opener-policy:.*same-origin' || {
  echo "missing COOP same-origin"
  exit 1
}
if [[ "$MODE" == "--prod" ]]; then
  CSP=$(echo "$HDR" | grep -i '^content-security-policy:' || true)
  echo "$CSP" | grep -qi "unsafe-eval" && {
    echo "prod CSP must not include unsafe-eval"
    exit 1
  }
fi
echo "security-headers OK ($URL)"
