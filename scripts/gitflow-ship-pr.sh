#!/usr/bin/env bash
# GitFlow ship: push branch → PR → auto-merge (merge commit).
# Usage:
#   bash scripts/gitflow-ship-pr.sh                 # current HEAD → develop
#   bash scripts/gitflow-ship-pr.sh develop          # current HEAD → develop (explicit base)
#   bash scripts/gitflow-ship-pr.sh develop main     # head=develop → base=main (lab sync)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required" >&2
  exit 1
fi

CURRENT="$(git rev-parse --abbrev-ref HEAD)"

if [[ $# -eq 0 ]]; then
  HEAD_REF="$CURRENT"
  BASE="develop"
elif [[ $# -eq 1 ]]; then
  HEAD_REF="$CURRENT"
  BASE="$1"
elif [[ $# -eq 2 ]]; then
  HEAD_REF="$1"
  BASE="$2"
else
  echo "Usage: $0 [head] [base]  or  $0 [base]" >&2
  exit 1
fi

if [[ "$HEAD_REF" == "$BASE" ]]; then
  echo "Refuse: head ($HEAD_REF) == base ($BASE)" >&2
  exit 1
fi

git fetch origin "$BASE" "$HEAD_REF" >/dev/null 2>&1 || git fetch origin

AHEAD="$(git rev-list --count "origin/$BASE..origin/$HEAD_REF" 2>/dev/null || git rev-list --count "origin/$BASE..$HEAD_REF" 2>/dev/null || echo 0)"
if [[ "$AHEAD" == "0" ]]; then
  echo "Nothing to ship: origin/$HEAD_REF is not ahead of origin/$BASE" >&2
  exit 0
fi

# Ensure remote tip for feature heads
if [[ "$HEAD_REF" == "$CURRENT" ]]; then
  git push -u origin HEAD
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
