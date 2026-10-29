#!/usr/bin/env bash
# Backup → prisma migrate deploy → restart → health (US-E14-05 / T5.14)
# FF_MODE=lab — migrate da host se container `app` assente (dry-run laptop)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FF_MODE="${FF_MODE:-prod}" # prod | lab
COMPOSE_FILE="${FF_COMPOSE:-compose.prod.yaml}"
ENV_FILE="${FF_ENV_FILE:-.env.prod}"
PROJECT="${FF_PROJECT:-}"
DOMAIN_URL="${NEXT_PUBLIC_APP_URL:-http://127.0.0.1:3000}"
LAB_MIGRATE_ONLY="${FF_LAB_MIGRATE_ONLY:-0}"

dc() {
  local -a file_args=()
  local f
  IFS=':' read -ra _files <<< "$COMPOSE_FILE"
  for f in "${_files[@]}"; do
    file_args+=(-f "$f")
  done
  local -a env_args=()
  if [[ -f "$ENV_FILE" ]]; then
    env_args=(--env-file "$ENV_FILE")
  elif [[ "$FF_MODE" != "lab" ]]; then
    echo "FF_ENV_FILE mancante: $ENV_FILE" >&2
    exit 1
  fi
  if [[ -n "$PROJECT" ]]; then
    docker compose -p "$PROJECT" "${file_args[@]}" "${env_args[@]}" "$@"
  else
    docker compose "${file_args[@]}" "${env_args[@]}" "$@"
  fi
}

load_host_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi
  local candidate
  for candidate in "$ENV_FILE" .env .env.local; do
    if [[ -f "$candidate" ]] && grep -q '^DATABASE_URL=' "$candidate" 2>/dev/null; then
      set -a
      # shellcheck disable=SC1090
      source "$candidate"
      set +a
      return 0
    fi
  done
  echo "FF_MODE=lab: imposta DATABASE_URL (export) o .env con DATABASE_URL" >&2
  exit 1
}

app_container_running() {
  local id
  id="$(dc ps -q app 2>/dev/null || true)"
  [[ -n "$id" ]]
}

echo "== backup =="
npm run db:backup || {
  echo "WARN: db:backup fallito (postgres locale?) — assicurati dump pre-migrate sul VPS" >&2
}

echo "== migrate (mode=$FF_MODE) =="
if app_container_running; then
  dc exec -T app npx prisma migrate deploy
elif [[ "$FF_MODE" == "lab" ]]; then
  load_host_database_url
  npx prisma migrate deploy
else
  echo "prod: container app non in esecuzione — avviare stack compose.prod" >&2
  exit 1
fi

if [[ "$FF_MODE" == "lab" && "$LAB_MIGRATE_ONLY" == "1" ]]; then
  echo "lab migrate-only OK (skip restart/health)"
  exit 0
fi

if ! app_container_running; then
  if [[ "$FF_MODE" == "lab" ]]; then
    echo "== skip restart (app container assente — lab dry-run) =="
    if curl -sf "${DOMAIN_URL%/}/api/health/ready" >/dev/null 2>&1; then
      echo "ready OK (host/dev app)"
      exit 0
    fi
    echo "ready SKIP (nessun app in ascolto su ${DOMAIN_URL}) — migrate deploy OK"
    exit 0
  fi
  echo "app container assente dopo migrate" >&2
  exit 1
fi

echo "== restart app/worker =="
dc up -d --no-deps --force-recreate app worker

echo "== wait ready =="
for i in $(seq 1 30); do
  if curl -sf "${DOMAIN_URL%/}/api/health/ready" >/dev/null; then
    echo "ready OK"
    exit 0
  fi
  sleep 2
done
echo "ready FAIL" >&2
exit 1
