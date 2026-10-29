#!/usr/bin/env bash
# Smoke Flusso A allegati: presign → PUT firmati su S3_PUBLIC_ENDPOINT → confirm.
# Prerequisiti (lab): compose.prod+lab up, storage:init, seed pilota, app su BASE.
# Non in CI (niente SeaweedFS sul runner) — locale/lab only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${SMOKE_BASE_URL:-http://127.0.0.1:3000}"
EMAIL="${SMOKE_EMAIL:-owner@pilot.facilityflow.local}"
PASSWORD="${SMOKE_PASSWORD:-PilotOwner123!}"
PUBLIC_S3="${S3_PUBLIC_ENDPOINT:-http://127.0.0.1:8333}"
TICKET_ID="${SMOKE_TICKET_ID:-}"
JAR="$(mktemp)"
JPEG="$(mktemp)"
trap 'rm -f "$JAR" "$JPEG"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }
ok() { echo "OK: $*"; }
skip() { echo "SKIP: $*"; exit 0; }

# Tiny 1×1 JPEG (base64)
export JPEG
python3 - <<'PYJPEG'
import base64, pathlib, os
b = base64.b64decode(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z"
)
pathlib.Path(os.environ["JPEG"]).write_bytes(b)
PYJPEG
SIZE="$(wc -c <"$JPEG" | tr -d ' ')"

curl -fsS -o /dev/null --max-time 3 "$BASE/api/health/live" \
  || skip "app non su $BASE (avvia next / compose)"

# SeaweedFS: GET / spesso 403/404 — basta una risposta HTTP (non connection refused)
S3_CODE="$(curl -sS -o /dev/null --max-time 3 -w '%{http_code}' "$PUBLIC_S3/" || echo 000)"
[[ "$S3_CODE" != "000" ]] \
  || skip "S3_PUBLIC_ENDPOINT non raggiungibile ($PUBLIC_S3) — lab: compose.lab + storage:init"
ok "S3 probe $PUBLIC_S3 (HTTP $S3_CODE)"

CSRF_JSON="$(curl -fsS -c "$JAR" -b "$JAR" "$BASE/api/auth/csrf")"
CSRF="$(printf '%s' "$CSRF_JSON" | sed -n 's/.*"csrfToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[[ -n "$CSRF" ]] || fail "csrfToken mancante"
HTTP_CODE="$(
  curl -sS -o /tmp/ff-att-login.out -w '%{http_code}' \
    -c "$JAR" -b "$JAR" \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=$EMAIL" \
    --data-urlencode "password=$PASSWORD" \
    --data-urlencode "callbackUrl=$BASE/app" \
    --data-urlencode "json=true"
)"
[[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "302" ]] \
  || fail "login HTTP $HTTP_CODE"
ok "session"

if [[ -z "$TICKET_ID" ]]; then
  TICKET_ID="$(
    npx --yes tsx -e "
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      (async () => {
        const t = await p.ticket.findFirst({
          where: { deletedAt: null, status: { not: 'cancelled' } },
          orderBy: { openedAt: 'desc' },
          select: { id: true },
        });
        if (!t) process.exit(2);
        process.stdout.write(t.id);
        await p.\$disconnect();
      })().catch(async (e) => { console.error(e); await p.\$disconnect(); process.exit(1); });
    " 2>/dev/null || true
  )"
fi
[[ -n "$TICKET_ID" ]] || skip "nessun ticket in DB (npm run db:seed:pilot)"
ok "ticket $TICKET_ID"

PRESIGN="$(
  curl -fsS -c "$JAR" -b "$JAR" \
    -X POST "$BASE/api/tickets/$TICKET_ID/attachments/presign" \
    -H 'Content-Type: application/json' \
    -d "{\"filename\":\"smoke.jpg\",\"mime\":\"image/jpeg\",\"sizeBytes\":$SIZE}"
)"
UPLOAD_URL="$(printf '%s' "$PRESIGN" | sed -n 's/.*"uploadUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
STORAGE_KEY="$(printf '%s' "$PRESIGN" | sed -n 's/.*"storageKey"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[[ -n "$UPLOAD_URL" && -n "$STORAGE_KEY" ]] || fail "presign: $PRESIGN"

# Host firmato deve allinearsi a S3_PUBLIC_ENDPOINT (non seaweedfs:8333)
PUBLIC_HOST="$(printf '%s' "$PUBLIC_S3" | sed -E 's#https?://##' | cut -d/ -f1)"
echo "$UPLOAD_URL" | grep -Fq "$PUBLIC_HOST" \
  || fail "uploadUrl host non match S3_PUBLIC_ENDPOINT ($PUBLIC_HOST): $UPLOAD_URL"
ok "presign host=$PUBLIC_HOST"

PUT_CODE="$(
  curl -sS -o /tmp/ff-att-put.out -w '%{http_code}' \
    -X PUT "$UPLOAD_URL" \
    -H 'Content-Type: image/jpeg' \
    --data-binary @"$JPEG"
)"
[[ "$PUT_CODE" =~ ^2 ]] || fail "PUT S3 HTTP $PUT_CODE — $(head -c 200 /tmp/ff-att-put.out)"
ok "PUT $PUT_CODE"

CONFIRM="$(
  curl -fsS -c "$JAR" -b "$JAR" \
    -X POST "$BASE/api/tickets/$TICKET_ID/attachments/confirm" \
    -H 'Content-Type: application/json' \
    -d "{\"storageKey\":\"$STORAGE_KEY\",\"mime\":\"image/jpeg\",\"sizeBytes\":$SIZE}"
)"
echo "$CONFIRM" | grep -Eq '"ok":true|"attachment"' \
  || fail "confirm: $CONFIRM"
ok "confirm"

echo "PASS smoke-attachment-s3-put ($BASE → $PUBLIC_S3)"
