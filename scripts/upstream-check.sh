#!/bin/bash
# upstream-check.sh - Check for upstream VT SaaS Template updates
# Usage: ./scripts/upstream-check.sh [--merge vX.Y.Z]

set -e

UPSTREAM_URL="https://github.com/thevarun/vt-saas-template.git"
UPSTREAM_REMOTE="upstream"
MERGE_TAG=""

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --merge)
      MERGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./scripts/upstream-check.sh [--merge vX.Y.Z]"
      exit 1
      ;;
  esac
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Upstream Template Sync"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# --- Step 1: Verify git repo ---
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ Not a git repository"
  exit 1
fi

# --- Step 2: Setup upstream remote (idempotent) ---
if ! git remote | grep -q "^${UPSTREAM_REMOTE}$"; then
  echo "📡 Adding upstream remote..."
  git remote add "$UPSTREAM_REMOTE" "$UPSTREAM_URL"
  echo "   Added: $UPSTREAM_URL"
else
  echo "📡 Upstream remote exists: $(git remote get-url "$UPSTREAM_REMOTE")"
fi
echo ""

# --- Step 3: Fetch upstream ---
echo "📥 Fetching upstream tags and branches..."
git fetch "$UPSTREAM_REMOTE" --tags --quiet
echo "   Done"
echo ""

# --- Step 4: Show available releases ---
echo "📦 Recent upstream releases:"
git tag --sort=-version:refname | head -10 | while read -r tag; do
  echo "   $tag"
done
echo ""

# --- Step 5: Show what's new since last sync ---
LAST_COMMON=$(git merge-base HEAD "${UPSTREAM_REMOTE}/main" 2>/dev/null || echo "")
if [ -n "$LAST_COMMON" ]; then
  NEW_COMMITS=$(git log --oneline "${LAST_COMMON}..${UPSTREAM_REMOTE}/main" 2>/dev/null | wc -l | tr -d ' ')
  echo "📊 Commits since last sync: $NEW_COMMITS"
  if [ "$NEW_COMMITS" -gt 0 ]; then
    echo ""
    echo "   Recent changes:"
    git log --oneline "${LAST_COMMON}..${UPSTREAM_REMOTE}/main" 2>/dev/null | head -20 | while read -r line; do
      echo "   $line"
    done
  else
    echo "   You're up to date!"
  fi
else
  echo "📊 No common history found with upstream (first sync)"
fi
echo ""

# --- Step 6: Merge or print instructions ---
if [ -n "$MERGE_TAG" ]; then
  # Verify the tag exists
  if ! git rev-parse "$MERGE_TAG" > /dev/null 2>&1; then
    echo "❌ Tag $MERGE_TAG not found"
    exit 1
  fi

  echo "🔀 Merging $MERGE_TAG..."
  git merge "$MERGE_TAG" -m "chore: sync upstream $MERGE_TAG"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Merged $MERGE_TAG"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Next steps:"
  echo "  npm install"
  echo "  npm run lint && npm run check-types && npm test && npm run build"
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 To merge a specific release:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  npm run upstream:check -- --merge vX.Y.Z"
  echo ""
  echo "  Or manually:"
  echo "  git merge vX.Y.Z"
  echo "  npm install"
  echo "  npm run lint && npm run check-types && npm test && npm run build"
  echo ""
  echo "See docs/upstream-sync-guide.md for conflict resolution strategies."
fi
