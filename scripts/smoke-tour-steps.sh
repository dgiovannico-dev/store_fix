#!/usr/bin/env bash
# Smoke: every product-tour step route lands correctly + data-tour (if any).
# Prereq: app on BASE, seed pilota (owner / sm / vendor0).
set -euo pipefail

BASE="${SMOKE_BASE_URL:-http://127.0.0.1:3000}"
FAIL=0

login() {
  local email=$1 pass=$2
  local jar csrf
  jar=$(mktemp)
  csrf=$(curl -fsS -c "$jar" -b "$jar" "$BASE/api/auth/csrf" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["csrfToken"])')
  curl -sS -o /dev/null -c "$jar" -b "$jar" \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$csrf" \
    --data-urlencode "email=$email" \
    --data-urlencode "password=$pass" \
    --data-urlencode "callbackUrl=$BASE/app" \
    --data-urlencode "json=true"
  echo "$jar"
}

STEPS_JSON=$(npx tsx scripts/list-tour-steps.ts)

check_step() {
  local jar=$1 audience=$2 id=$3 route=$4 attr=$5
  local out code final err want_path final_path attr_miss=0
  out=$(mktemp)

  if [[ -z "$route" ]]; then
    case "$audience" in
      hq) route="/app/tickets" ;;
      store) route="/app/tickets" ;;
      vendor) route="/vendor/inbox" ;;
    esac
  fi

  want_path="$route"
  local url="$BASE$route"
  if [[ "$route" == *\?* ]]; then
    url="${url}&tour=1"
  else
    url="${url}?tour=1"
  fi

  code=$(curl -sS -o "$out" -w '%{http_code}' -b "$jar" -L --max-redirs 8 "$url" || echo ERR)
  err=0
  grep -qE 'Application error|Internal Server Error' "$out" && err=1 || true

  final=$(curl -sS -o /dev/null -w '%{url_effective}' -b "$jar" -L --max-redirs 8 "$url")
  final_path=$(python3 -c 'from urllib.parse import urlparse; import sys; print(urlparse(sys.argv[1]).path)' "$final")

  local ok=1
  [[ "$code" == "200" && "$err" == "0" ]] || ok=0

  if [[ "$audience" == "hq" ]]; then
    if [[ "$want_path" == "/app/dashboard" ]]; then
      if [[ "$final_path" != "/app/dashboard" ]]; then
        ok=0
      fi
    else
      case "$final_path" in
        "$want_path"|"$want_path"/*) ;;
        *) ok=0 ;;
      esac
      [[ "$final_path" == /vendor* ]] && ok=0
    fi
  elif [[ "$audience" == "store" ]]; then
    case "$final_path" in
      "$want_path"|"$want_path"/*) ;;
      *) ok=0 ;;
    esac
    [[ "$final_path" == /vendor* ]] && ok=0
    [[ "$final_path" == /app/dashboard ]] && ok=0
  else
    case "$final_path" in
      "$want_path"|"$want_path"/*) ;;
      *) ok=0 ;;
    esac
    [[ "$final_path" == /app/* ]] && ok=0
  fi

  if [[ -n "$attr" ]]; then
    if ! grep -q "data-tour=\"$attr\"" "$out"; then
      ok=0
      attr_miss=1
    fi
  fi

  if [[ "$ok" == "1" ]]; then
    echo "PASS $audience $id → $final_path attr=${attr:-—}"
  else
    echo "FAIL $audience $id code=$code err=$err want=$want_path got=$final_path attr_miss=$attr_miss attr=$attr"
    FAIL=$((FAIL + 1))
  fi
  rm -f "$out"
}

echo "=== HQ (owner) ==="
JAR=$(login owner@pilot.facilityflow.local 'PilotOwner123!')
while IFS='|' read -r audience id route attr; do
  [[ "$audience" == "hq" ]] || continue
  check_step "$JAR" "$audience" "$id" "$route" "$attr"
done <<< "$STEPS_JSON"
rm -f "$JAR"

echo "=== STORE (sm) ==="
JAR=$(login sm@pilot.facilityflow.local 'PilotStore123!')
while IFS='|' read -r audience id route attr; do
  [[ "$audience" == "store" ]] || continue
  check_step "$JAR" "$audience" "$id" "$route" "$attr"
done <<< "$STEPS_JSON"
rm -f "$JAR"

echo "=== VENDOR (vendor0) ==="
JAR=$(login vendor0@pilot.facilityflow.local 'PilotVendor123!')
while IFS='|' read -r audience id route attr; do
  [[ "$audience" == "vendor" ]] || continue
  check_step "$JAR" "$audience" "$id" "$route" "$attr"
done <<< "$STEPS_JSON"
rm -f "$JAR"

if [[ "$FAIL" -gt 0 ]]; then
  echo "FAIL smoke-tour-steps ($FAIL)" >&2
  exit 1
fi
echo "PASS smoke-tour-steps ($BASE)"
