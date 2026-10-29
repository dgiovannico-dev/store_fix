#!/usr/bin/env bash
# Backup Postgres formato custom (-Fc) — US-E10-03 / T4.15
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/ff-${STAMP}.dump"
mkdir -p "$OUT_DIR"

COMPOSE_FILE=""
for cand in "$ROOT/compose.yaml" "$ROOT/compose.yml" "$ROOT/docker-compose.yml"; do
  if [[ -f "$cand" ]]; then COMPOSE_FILE="$cand"; break; fi
done
if [[ -z "$COMPOSE_FILE" ]]; then
  echo "compose file non trovato" >&2
  exit 1
fi

echo "Dump → $FILE (compose: $COMPOSE_FILE)"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U facilityflow -Fc facilityflow > "$FILE"

echo "Verify list (pg_restore nel container — evita mismatch versione host)"
# Stesso major di pg_dump: monta backups/ e lista il dump.
docker compose -f "$COMPOSE_FILE" run --rm -T \
  -v "$OUT_DIR:/backups:ro" \
  postgres \
  pg_restore -l "/backups/$(basename "$FILE")" | head -n 20

echo "OK $FILE"
echo "Restore drill (scratch DB): creare DB facilityflow_restore_test poi:"
echo "  pg_restore -U facilityflow -d facilityflow_restore_test $FILE"
