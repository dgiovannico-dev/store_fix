#!/usr/bin/env bash
# OSV lockfile scan (US-E14-10 / T5.21) — OSS, no SaaS.
# Usage: bash scripts/osv-scan.sh
# Exit 0 = no known vulns (or empty); non-zero = vulnerabilità / errore tool.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOCK="${OSV_LOCKFILE:-package-lock.json}"
[[ -f "$LOCK" ]] || { echo "missing $LOCK" >&2; exit 1; }

VERSION="${OSV_SCANNER_VERSION:-v2.7.0}"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ARCH=amd64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "unsupported arch: $ARCH" >&2; exit 1 ;;
esac
case "$OS" in
  linux|darwin) ;;
  *) echo "unsupported os: $OS" >&2; exit 1 ;;
esac

BIN="${OSV_SCANNER_BIN:-}"
if [[ -z "$BIN" ]]; then
  CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/facilityflow"
  mkdir -p "$CACHE_DIR"
  BIN="$CACHE_DIR/osv-scanner-${VERSION}-${OS}-${ARCH}"
  if [[ ! -x "$BIN" ]]; then
    URL="https://github.com/google/osv-scanner/releases/download/${VERSION}/osv-scanner_${OS}_${ARCH}"
    echo "Downloading $URL"
    curl -fsSL "$URL" -o "$BIN"
    chmod +x "$BIN"
  fi
fi

echo "OSV-Scanner $($BIN --version 2>/dev/null || true) → $LOCK"
# Fail on any vulnerability; table for humans (lockfile only — no recursive FS walk)
exec "$BIN" scan source --verbosity=warn -L "$LOCK"
