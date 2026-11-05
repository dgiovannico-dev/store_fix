#!/usr/bin/env bash
# Multi-role section crawl — owner / store / vendor / finance (nessuna sezione HQ saltata).
# Prereq: app on BASE, `npm run db:seed:pilot`, postgres via docker compose.
set -euo pipefail
FAIL=0
BASE="${SMOKE_BASE_URL:-http://127.0.0.1:3000}"
login() {
  local email=$1 pass=$2
  local jar
  jar=$(mktemp)
  local csrf
  csrf=$(curl -fsS -c "$jar" -b "$jar" "$BASE/api/auth/csrf" | python3 -c 'import sys,json; print(json.load(sys.stdin)["csrfToken"])')
  curl -sS -o /dev/null -c "$jar" -b "$jar" -X POST "$BASE/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$csrf" \
    --data-urlencode "email=$email" \
    --data-urlencode "password=$pass" \
    --data-urlencode "callbackUrl=$BASE/app" \
    --data-urlencode "json=true"
  echo "$jar"
}
check() {
  local jar=$1 role=$2 path=$3 want_marker=${4:-} forbid_marker=${5:-}
  local out code
  out=$(mktemp)
  code=$(curl -sS -o "$out" -w '%{http_code}' -b "$jar" -L --max-redirs 5 "$BASE$path" || echo ERR)
  local err=0
  grep -qE 'Application error|Internal Server Error' "$out" && err=1 || true
  local ok=1
  [[ "$code" == "200" && "$err" == "0" ]] || ok=0
  if [[ -n "$want_marker" ]] && ! grep -q "$want_marker" "$out"; then ok=0; fi
  if [[ -n "$forbid_marker" ]] && grep -q "$forbid_marker" "$out"; then ok=0; fi
  if [[ "$ok" == "1" ]]; then echo "PASS $role $code $path"; else
    echo "FAIL $role $code err=$err $path want=$want_marker forbid=$forbid_marker"
    FAIL=$((FAIL + 1))
  fi
  rm -f "$out"
}

TICKET=$(docker compose exec -T postgres psql -U facilityflow -d facilityflow -tAc "SELECT t.id FROM \"Ticket\" t JOIN \"Tenant\" tn ON tn.id=t.\"tenantId\" WHERE tn.slug='pilot-retail' LIMIT 1;" | tr -d '[:space:]')
STORE=$(docker compose exec -T postgres psql -U facilityflow -d facilityflow -tAc "SELECT s.id FROM \"Store\" s JOIN \"Tenant\" tn ON tn.id=s.\"tenantId\" WHERE tn.slug='pilot-retail' LIMIT 1;" | tr -d '[:space:]')
VENDOR=$(docker compose exec -T postgres psql -U facilityflow -d facilityflow -tAc "SELECT v.id FROM \"Vendor\" v JOIN \"Tenant\" tn ON tn.id=v.\"tenantId\" WHERE tn.slug='pilot-retail' LIMIT 1;" | tr -d '[:space:]')
VT=$(docker compose exec -T postgres psql -U facilityflow -d facilityflow -tAc "SELECT t.id FROM \"Ticket\" t JOIN \"Tenant\" tn ON tn.id=t.\"tenantId\" WHERE tn.slug='pilot-retail' AND t.\"vendorId\" IS NOT NULL LIMIT 1;" | tr -d '[:space:]')

echo "ids ticket=$TICKET store=$STORE vendor=$VENDOR vt=$VT"

JAR=$(login owner@pilot.facilityflow.local 'PilotOwner123!')
for p in /login /onboarding /app/dashboard /app/tickets /app/tickets/new "/app/tickets/$TICKET" /app/stores /app/stores/import "/app/stores/$STORE" /app/vendors /app/vendors/scorecard "/app/vendors/$VENDOR" /app/assets /app/contratti /app/contratti/performance /app/calendario /app/finance/chargeback /app/wallboard /app/rfq /app/rfq/new /app/settings/locale /app/settings/members /app/settings/audit /app/settings/ai /app/segnala; do
  check "$JAR" owner "$p"
done
rm -f "$JAR"

JAR=$(login sm@pilot.facilityflow.local 'PilotStore123!')
check "$JAR" store /app/tickets page.tickets.root
check "$JAR" store /app/tickets/new page.tickets.new
check "$JAR" store /app/segnala page.segnala.root
check "$JAR" store /app/settings/locale page.settings.locale
check "$JAR" store /app/stores "" page.stores.root
check "$JAR" store /app/dashboard "" page.dashboard.root
rm -f "$JAR"

JAR=$(login vendor0@pilot.facilityflow.local 'PilotVendor123!')
check "$JAR" vendor /vendor/inbox page.vendor.inbox
check "$JAR" vendor /vendor/rfq page.vendor.rfq
check "$JAR" vendor "/vendor/tickets/$VT"
check "$JAR" vendor /app/stores page.vendor.inbox page.stores.root
rm -f "$JAR"

JAR=$(login finance@pilot.facilityflow.local 'PilotFinance123!')
check "$JAR" finance /app/dashboard page.dashboard.root
check "$JAR" finance /app/tickets
check "$JAR" finance /app/contratti
check "$JAR" finance /app/finance/chargeback page.chargeback.root
check "$JAR" finance /app/stores page.dashboard.root page.stores.root
check "$JAR" finance /app/settings/ai page.dashboard.root hq.settings.ai
rm -f "$JAR"

if [[ "$FAIL" -gt 0 ]]; then
  echo "FAIL smoke-all-roles ($FAIL)" >&2
  exit 1
fi
echo "PASS smoke-all-roles ($BASE)"
