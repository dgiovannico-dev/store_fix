#!/usr/bin/env bash
# Post-provisioning checks verso VPS (NEXT_VPS §3–5).
# Richiede .env.prod locale con VPS_IP / VPS_SSH_USER / FF_DOMAIN (da vps:wizard).
# Non stampa secret.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
fail=0
ok() { echo "  OK  $*"; }
ko() { echo "  FAIL $*"; fail=1; }

_env() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || return 1
  local line
  line=$(grep -E "^${key}=" "$ENV_FILE" | tail -n1) || return 1
  printf '%s' "${line#*=}"
}

echo "== FacilityFlow VPS remote check =="

if [[ ! -f "$ENV_FILE" ]]; then
  ko "manca $ENV_FILE — esegui: npm run vps:wizard"
  exit 1
fi

VPS_IP=$(_env VPS_IP || true)
VPS_SSH_USER=$(_env VPS_SSH_USER || true)
FF_DOMAIN=$(_env FF_DOMAIN || true)

if [[ -z "${VPS_IP}" || -z "${VPS_SSH_USER}" ]]; then
  ko "VPS_IP / VPS_SSH_USER assenti in $ENV_FILE (completa il wizard § host)"
fi
if [[ -z "${FF_DOMAIN}" ]]; then
  ko "FF_DOMAIN assente in $ENV_FILE"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "REMOTE CHECK SKIPPED — provisioning non ancora annotato in $ENV_FILE"
  exit 1
fi

echo "-- SSH (${VPS_SSH_USER}@${VPS_IP})"
if ssh -o BatchMode=yes -o ConnectTimeout=8 \
  "${VPS_SSH_USER}@${VPS_IP}" "echo ssh_ok" 2>/dev/null | grep -q ssh_ok; then
  ok "SSH BatchMode"
  if ssh -o BatchMode=yes -o ConnectTimeout=8 \
    "${VPS_SSH_USER}@${VPS_IP}" \
    "command -v docker >/dev/null && docker compose version >/dev/null" 2>/dev/null; then
    ok "Docker Compose sul VPS"
  else
    ko "Docker/Compose non rilevato sul VPS"
  fi
else
  ko "SSH non raggiungibile (chiave / UFW / IP)"
fi

echo "-- HTTPS health (https://${FF_DOMAIN})"
if curl -sfS --max-time 15 "https://${FF_DOMAIN}/api/health/live" >/dev/null; then
  ok "live 200"
else
  ko "live (DNS / Caddy / app)"
fi
if curl -sfS --max-time 15 "https://${FF_DOMAIN}/api/health/ready" >/dev/null; then
  ok "ready 200"
else
  ko "ready (DB down o proxy)"
fi

echo
if [[ "$fail" -ne 0 ]]; then
  echo "REMOTE CHECK FAIL — vedi docs/ops/NEXT_VPS.md"
  exit 1
fi
echo "REMOTE CHECK OK — prosegui smoke Flusso A + S5-EXIT-GAPS"
exit 0
