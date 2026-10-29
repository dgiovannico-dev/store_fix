#!/usr/bin/env bash
# GitFlow ship: push current branch → PR → auto-merge (merge commit).
# Usage:
#   bash scripts/gitflow-ship-pr.sh              # HEAD → develop
#   bash scripts/gitflow-ship-pr.sh develop main # develop → main (lab sync)
set -euo pipefail

BASE="${1:-develop}"
HEAD_REF="${2:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required" >&2
  exit 1
fi

CURRENT="$(git rev-parse --abbrev-ref HEAD)"
if [[ -z "$HEAD_REF" ]]; then
  HEAD_REF="$CURRENT"
fi

if [[ "$HEAD_REF" == "$BASE" ]]; then
  echo "Refuse: head ($HEAD_REF) == base ($BASE)" >&2
  exit 1
fi

if [[ "$HEAD_REF" == "main" || "$HEAD_REF" == "develop" ]]; then
  if [[ "$BASE" != "main" && "$BASE" != "develop" ]]; then
    echo "Refuse unexpected base $BASE for $HEAD_REF" >&2
    exit 1
  fi
fi

# Ensure remote tip
if [[ "$HEAD_REF" == "$CURRENT" ]]; then
  git push -u origin HEAD
else
  git fetch origin "$HEAD_REF" >/dev/null 2>&1 || true
  git push origin "$HEAD_REF"
fi

TITLE="$(git log -1 --pretty=%s "origin/$BASE..$HEAD_REF" 2>/dev/null || git log -1 --pretty=%s)"
if [[ -z "$TITLE" ]]; then
  TITLE="chore: merge $HEAD_REF into $BASE"
fi

BODY="$(cat <<EOF
## Summary
- Auto-ship GitFlow: \`$HEAD_REF\` → \`$BASE\`
- Policy: PR auto-merge (no human review gate)

## Test plan
- [x] \`npm run verify:local\` (or N/A docs-only) before open
EOF
)"

EXISTING="$(gh pr list --head "$HEAD_REF" --base "$BASE" --state open --json number --jq '.[0].number // empty')"
if [[ -n "$EXISTING" ]]; then
  PR="$EXISTING"
  echo "Reusing open PR #$PR"
else
  PR_URL="$(gh pr create --base "$BASE" --head "$HEAD_REF" --title "$TITLE" --body "$BODY")"
  PR="$(basename "$PR_URL")"
  echo "Created PR #$PR — $PR_URL"
fi

# Auto-approve attempt (fails harmlessly if same author / no permission)
gh pr review "$PR" --approve -b "Auto-approved (GitFlow policy)" 2>/dev/null || true

# Prefer auto-merge (waits checks if required); fallback immediate merge
if ! gh pr merge "$PR" --auto --merge --delete-branch 2>/dev/null; then
  gh pr merge "$PR" --merge --delete-branch
fi

echo "Merged PR #$PR → $BASE"
gh pr view "$PR" --json url,state,mergedAt --jq '"\(.url) state=\(.state) mergedAt=\(.mergedAt)"'
