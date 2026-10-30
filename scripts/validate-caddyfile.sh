#!/usr/bin/env bash
# Validate deploy/Caddyfile with the same image as compose.prod (US-E14-01 / T5.4).
# Requires Docker. No stack up — config syntax only.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CADDYFILE="${CADDYFILE:-$ROOT/deploy/Caddyfile}"
IMAGE="${CADDY_IMAGE:-caddy:2.11.7-alpine@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f}"
FF_DOMAIN="${FF_DOMAIN:-localhost}"

if [[ ! -f "$CADDYFILE" ]]; then
  echo "validate-caddyfile: missing $CADDYFILE" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "validate-caddyfile: docker not in PATH" >&2
  exit 1
fi

echo "validate-caddyfile: $IMAGE — $CADDYFILE (FF_DOMAIN=$FF_DOMAIN)"
docker run --rm \
  -e "FF_DOMAIN=$FF_DOMAIN" \
  -v "$CADDYFILE:/etc/caddy/Caddyfile:ro" \
  "$IMAGE" \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
