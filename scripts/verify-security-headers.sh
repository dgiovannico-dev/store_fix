#!/usr/bin/env bash
# Smoke headers dietro URL (US-E14-10 / T5.19) — usare HTTPS staging
set -euo pipefail
URL="${1:-http://127.0.0.1:3000/login}"
HDR=$(curl -sI "$URL")
echo "$HDR"
echo "$HDR" | grep -qi 'content-security-policy' || { echo "missing CSP"; exit 1; }
echo "$HDR" | grep -qi 'x-frame-options' || { echo "missing XFO"; exit 1; }
echo "$HDR" | grep -qi 'x-content-type-options' || { echo "missing nosniff"; exit 1; }
echo "security-headers OK ($URL)"
