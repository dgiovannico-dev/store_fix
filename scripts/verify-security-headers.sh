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
echo "$HDR" | grep -qi "object-src 'none'" || {
  echo "missing CSP object-src 'none'"
  exit 1
}
echo "$HDR" | grep -qi "frame-src 'none'" || {
  echo "missing CSP frame-src 'none'"
  exit 1
}
echo "$HDR" | grep -qi "worker-src 'self'" || {
  echo "missing CSP worker-src 'self'"
  exit 1
}
echo "$HDR" | grep -qi "manifest-src 'self'" || {
  echo "missing CSP manifest-src 'self'"
  exit 1
}
echo "$HDR" | grep -qi "base-uri 'none'" || {
  echo "missing CSP base-uri 'none'"
  exit 1
}
echo "$HDR" | grep -qi 'x-frame-options' || { echo "missing XFO"; exit 1; }
echo "$HDR" | grep -qi 'x-content-type-options' || { echo "missing nosniff"; exit 1; }
echo "$HDR" | grep -qi 'cross-origin-opener-policy:.*same-origin' || {
  echo "missing COOP same-origin"
  exit 1
}
echo "$HDR" | grep -qi 'cross-origin-resource-policy:.*same-origin' || {
  echo "missing CORP same-origin"
  exit 1
}
echo "$HDR" | grep -qi 'x-permitted-cross-domain-policies:.*none' || {
  echo "missing X-Permitted-Cross-Domain-Policies none"
  exit 1
}
echo "$HDR" | grep -qi 'permissions-policy:.*payment=()' || {
  echo "missing Permissions-Policy payment=()"
  exit 1
}
echo "$HDR" | grep -qi 'permissions-policy:.*browsing-topics=()' || {
  echo "missing Permissions-Policy browsing-topics=()"
  exit 1
}
echo "$HDR" | grep -qiE 'origin-agent-cluster:[[:space:]]*\?1' || {
  echo "missing Origin-Agent-Cluster ?1"
  exit 1
}
echo "$HDR" | grep -qiE 'cache-control:[[:space:]]*no-store' || {
  echo "missing Cache-Control no-store"
  exit 1
}
echo "$HDR" | grep -qiE 'x-dns-prefetch-control:[[:space:]]*off' || {
  echo "missing X-DNS-Prefetch-Control off"
  exit 1
}
echo "$HDR" | grep -qiE 'x-robots-tag:.*noindex' || {
  echo "missing X-Robots-Tag noindex"
  exit 1
}
# robots.txt (same origin as URL) — Disallow all for private SoR
ROBOTS_URL="$(python3 - <<'PY' "$URL"
import sys
from urllib.parse import urlparse, urlunparse
u = urlparse(sys.argv[1])
print(urlunparse((u.scheme, u.netloc, "/robots.txt", "", "", "")))
PY
)"
ROBOTS_BODY=$(curl -sf "$ROBOTS_URL" || true)
echo "$ROBOTS_BODY" | grep -qi 'Disallow: /' || {
  echo "missing robots.txt Disallow: / ($ROBOTS_URL)"
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
