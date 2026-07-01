#!/bin/bash
# ci-local.sh - Run CI checks locally before pushing
# Usage: ./scripts/ci-local.sh [--skip-e2e]

set -e

SKIP_E2E=false

for arg in "$@"; do
  case $arg in
    --skip-e2e)
      SKIP_E2E=true
      ;;
  esac
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Local CI Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

START_TIME=$(date +%s)

echo "📋 Lint & Types..."
pnpm lint || { echo "❌ Lint failed"; exit 1; }
pnpm check-types || { echo "❌ Type check failed"; exit 1; }
echo "✅ Lint & Types passed"
echo ""

echo "🧪 Unit Tests..."
pnpm test || { echo "❌ Unit tests failed"; exit 1; }
echo "✅ Unit tests passed"
echo ""

echo "🏗️  Build..."
pnpm build || { echo "❌ Build failed"; exit 1; }
echo "✅ Build passed"
echo ""

if [ "$SKIP_E2E" = false ]; then
  echo "🎭 E2E Tests..."
  pnpm test:e2e || { echo "❌ E2E tests failed"; exit 1; }
  echo "✅ E2E tests passed"
  echo ""
else
  echo "⏭️  E2E Tests (skipped)"
  echo ""
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready to push! (${DURATION}s)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
