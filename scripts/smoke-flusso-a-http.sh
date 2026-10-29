#!/usr/bin/env bash
# US-E14-12 — smoke HTTP locale (curl + session Auth.js).
# Prerequisiti: app su BASE (default http://127.0.0.1:3000), seed pilota.
# Lifecycle ticket completo resta su: npm test -- src/tests/e2e/flusso-a-verified.test.ts
set -euo pipefail

BASE="${SMOKE_BASE_URL:-http://127.0.0.1:3000}"
EMAIL="${SMOKE_EMAIL:-owner@pilot.facilityflow.local}"
PASSWORD="${SMOKE_PASSWORD:-PilotOwner123!}"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "OK: $*"; }

curl -fsS -o /dev/null --max-time 5 "$BASE/api/health/live" \
  || fail "health/live non raggiungibile su $BASE (avvia next / compose app)"
ok "health/live"

READY="$(curl -fsS --max-time 10 "$BASE/api/health/ready" || true)"
echo "$READY" | grep -q '"ok":true\|"status":"ok"\|db' \
  || fail "health/ready unexpected: $READY"
ok "health/ready"

CSRF_JSON="$(curl -fsS -c "$JAR" -b "$JAR" "$BASE/api/auth/csrf")"
CSRF="$(printf '%s' "$CSRF_JSON" | sed -n 's/.*"csrfToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[[ -n "$CSRF" ]] || fail "csrfToken mancante: $CSRF_JSON"
ok "csrf"

# Auth.js credentials callback (double-submit CSRF)
HTTP_CODE="$(
  curl -sS -o /tmp/ff-smoke-login.out -w '%{http_code}' \
    -c "$JAR" -b "$JAR" \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=$EMAIL" \
    --data-urlencode "password=$PASSWORD" \
    --data-urlencode "callbackUrl=$BASE/app" \
    --data-urlencode "json=true"
)"
# 200 JSON o 302 redirect sono accettabili con cookie di sessione
if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "302" ]]; then
  fail "login HTTP $HTTP_CODE — $(head -c 200 /tmp/ff-smoke-login.out)"
fi

SESSION="$(curl -fsS -c "$JAR" -b "$JAR" "$BASE/api/auth/session")"
echo "$SESSION" | grep -q '"email"' \
  || fail "session senza email (seed pilota? npm run db:seed:pilot): $SESSION"
ok "session $EMAIL"

NOTIF="$(curl -fsS -c "$JAR" -b "$JAR" "$BASE/api/notifications/unread-count")"
echo "$NOTIF" | grep -Eq '"count"|[0-9]' \
  || fail "notifications unread-count: $NOTIF"
ok "notifications/unread-count (auth)"

OPTS="$(curl -fsS -c "$JAR" -b "$JAR" "$BASE/api/tickets/form-options")"
echo "$OPTS" | grep -Eq 'store|categor' \
  || fail "tickets/form-options: $OPTS"
ok "tickets/form-options (auth)"

echo "PASS smoke-flusso-a-http ($BASE)"
