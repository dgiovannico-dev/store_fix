#!/usr/bin/env bash
# OSV lockfile scan (US-E14-10 / T5.21) — OSS, no SaaS.
# Fail on Critical/High (align with `npm audit --audit-level=high`).
# Medium/Low are reported but do not fail CI (eslint transitive minimatch, etc.).
# Usage: bash scripts/osv-scan.sh
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

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

set +e
"$BIN" scan source --format json -L "$LOCK" >"$TMP" 2>/tmp/osv-scan.err
RC=$?
set -e

# Always show human table when findings or errors
if [[ "$RC" -ne 0 && "$RC" -ne 1 ]]; then
  cat /tmp/osv-scan.err >&2 || true
  echo "osv-scanner failed rc=$RC" >&2
  exit "$RC"
fi

python3 - "$TMP" <<'PY'
import json, sys
path = sys.argv[1]
try:
    data = json.load(open(path))
except json.JSONDecodeError:
    print("osv-scan: empty/invalid JSON (no packages?)", file=sys.stderr)
    sys.exit(0)

# results shape: { "results": [ { "packages": [ { "vulnerabilities": [...], "groups": [...] } ] } ] }
high = 0
medium = 0
low = 0
unknown = 0
rows = []

def sev_rank(v):
    # Prefer database_specific / severity CVSS
    for s in v.get("severity") or []:
        t = (s.get("type") or "").upper()
        score = s.get("score") or ""
        if "CVSS_V3" in t or "CVSS_V4" in t:
            try:
                # score like "CVSS:3.1/AV:N/..." — use numeric if present
                parts = score.split("/")
                # fallback: use database_specific
            except Exception:
                pass
    ds = v.get("database_specific") or {}
    sev = (ds.get("severity") or v.get("severity_level") or "").upper()
    if sev in ("CRITICAL", "HIGH", "MEDIUM", "MODERATE", "LOW"):
        return sev if sev != "MODERATE" else "MEDIUM"
    # CVSS float in severity[].score sometimes as number string
    for s in v.get("severity") or []:
        sc = s.get("score")
        if isinstance(sc, (int, float)):
            if sc >= 9: return "CRITICAL"
            if sc >= 7: return "HIGH"
            if sc >= 4: return "MEDIUM"
            return "LOW"
        if isinstance(sc, str) and sc.replace(".", "", 1).isdigit():
            f = float(sc)
            if f >= 9: return "CRITICAL"
            if f >= 7: return "HIGH"
            if f >= 4: return "MEDIUM"
            return "LOW"
    return "UNKNOWN"

for res in data.get("results") or []:
    for pkg in res.get("packages") or []:
        vulns = pkg.get("vulnerabilities") or []
        for v in vulns:
            level = sev_rank(v)
            vid = v.get("id") or "?"
            rows.append((level, vid))
            if level in ("CRITICAL", "HIGH"):
                high += 1
            elif level == "MEDIUM":
                medium += 1
            elif level == "LOW":
                low += 1
            else:
                unknown += 1

if rows:
    print(f"OSV findings: high+critical={high} medium={medium} low={low} unknown={unknown}")
    for level, vid in rows:
        print(f"  [{level}] {vid}")
else:
    print("No issues found")

if high > 0:
    sys.exit(1)
sys.exit(0)
PY
