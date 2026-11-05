#!/usr/bin/env bash
# F9-11 — verify backup artifacts exist and look like pg_dump custom format.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${BACKUP_DIR:-$ROOT/backups}"
MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-168}"

if [[ ! -d "$DIR" ]]; then
  echo "FAIL: missing backups dir $DIR — run: npm run db:backup"
  exit 1
fi

mapfile -t dumps < <(ls -t "$DIR"/ff-*.dump 2>/dev/null || true)
if [[ ${#dumps[@]} -eq 0 ]]; then
  echo "FAIL: no ff-*.dump in $DIR"
  exit 1
fi

latest="${dumps[0]}"
age_sec=$(( $(date +%s) - $(stat -f %m "$latest" 2>/dev/null || stat -c %Y "$latest") ))
age_h=$(( age_sec / 3600 ))
if (( age_h > MAX_AGE_HOURS )); then
  echo "FAIL: latest dump too old (${age_h}h > ${MAX_AGE_HOURS}h): $latest"
  exit 1
fi

# Custom-format dumps start with "PGDMP"
sig=$(head -c 5 "$latest" | tr -d '\0' || true)
if [[ "$sig" != "PGDMP" ]]; then
  echo "WARN: $latest does not look like -Fc (sig=$sig) — still present"
fi

echo "PASS: latest=$latest age_h=$age_h count=${#dumps[@]}"
exit 0
