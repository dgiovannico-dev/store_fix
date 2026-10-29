#!/usr/bin/env bash
# Guardrail secret in tree tracked (US-E14-03 / T5.7)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Skip known safe placeholders
PATTERN='(AUTH_SECRET=|POSTGRES_PASSWORD=|S3_SECRET_KEY=|password\s*=\s*["'\''][^"'\'']{8,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----)'

# Escludi template env, docs ops e questo script (PATTERN self-match)
HITS=$(git ls-files -z | xargs -0 grep -nE "$PATTERN" 2>/dev/null | grep -vE '\.env(\.prod)?\.example|secrets-scan\.sh|SECRETS\.md|SEED_PILOT\.md|seed-pilot\.ts|seed-stress\.ts|seed\.ts|COMPOSE_PROD\.md|docs/ops/AUTH\.md' || true)

if [[ -n "$HITS" ]]; then
  echo "secrets-scan FAIL — possibili secret in file tracked:"
  echo "$HITS"
  exit 1
fi

echo "secrets-scan OK"
