#!/usr/bin/env bash
# fork-smoke.sh — prove a fresh clone actually BOOTS, not just builds.
#
# `pnpm build` structurally cannot catch first-run failures: it loads no
# populated env file, never invokes `run-p`, and never starts the Spotlight
# sidecar (see issues #379/#380 — three latent boot bugs shipped green through
# the build gate). This script simulates a brand-new fork's first `pnpm dev`:
#
#   - env comes from .env.example — optional keys stay blank, exactly like a
#     fresh fork that filled only the required keys
#   - required keys get fake-but-valid values; DATABASE_URL is blanked so
#     src/libs/DB.ts uses in-memory PGlite — no database, no secrets, safe to
#     run in CI and on a fork that hasn't configured anything yet
#   - runs the real `pnpm dev` (run-p + all dev:* sidecars), the exact command
#     a developer types first
#
# Asserts: / responds 200 and the log contains no fatal boot errors.
#
# Usage: pnpm smoke            (or: bash scripts/fork-smoke.sh)
#        SMOKE_PORT=3210 pnpm smoke
set -euo pipefail

PORT="${SMOKE_PORT:-3000}"
SPOTLIGHT_PORT=8969 # fixed by @spotlightjs/spotlight
TIMEOUT_SECONDS="${SMOKE_TIMEOUT:-180}"
LOG="$(mktemp -t fork-smoke.XXXXXX.log)"
BASE_URL="http://127.0.0.1:${PORT}"

fail() {
  echo ""
  echo "✗ FORK SMOKE FAILED: $1"
  echo "── last 40 log lines (${LOG}) ──"
  tail -40 "$LOG" || true
  exit 1
}

for p in "$PORT" "$SPOTLIGHT_PORT"; do
  if lsof -ti "tcp:${p}" >/dev/null 2>&1; then
    echo "✗ Port ${p} is in use — stop your dev server (or set SMOKE_PORT) and re-run."
    exit 1
  fi
done

# Fake-but-valid required env. Exported vars win over .env.example (dotenv-cli
# does not override existing env) and over .env.local (Next.js never overrides
# process env). localhost Supabase URL makes any accidental network call fail
# fast instead of hanging on DNS.
export PORT
export DATABASE_URL=""
export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="smoke-placeholder-anon-key"

echo "▶ Booting 'pnpm dev' with .env.example (PGlite, no secrets); log: ${LOG}"
pnpm exec dotenv -e .env.example -- pnpm dev >"$LOG" 2>&1 &
DEV_PID=$!
disown # suppress bash job-control noise when the trap kills the tree

cleanup() {
  # run-p forwards signals to its children; port-based kill is the fallback
  # for anything detached from the process group.
  kill "$DEV_PID" >/dev/null 2>&1 || true
  sleep 1
  for p in "$PORT" "$SPOTLIGHT_PORT"; do
    lsof -ti "tcp:${p}" 2>/dev/null | xargs kill >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT

# Fatal patterns that killed real first boots (#379): env validation, run-p
# flag-forwarding under pnpm, missing sidecar bin, a dev:* script dying.
FATAL_PATTERN='Invalid environment variables|Unknown option|command not found|ERR_PNPM|exited with 1'

STATUS="000"
for _ in $(seq 1 $((TIMEOUT_SECONDS / 2))); do
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    fail "'pnpm dev' exited before the server came up"
  fi
  if grep -qE "$FATAL_PATTERN" "$LOG"; then
    fail "fatal boot error in dev log"
  fi
  STATUS=$(curl -sL -o /dev/null -w '%{http_code}' --max-time 10 "$BASE_URL/" || echo "000")
  [ "$STATUS" = "200" ] && break
  sleep 2
done

if [ "$STATUS" != "200" ]; then
  fail "GET / returned ${STATUS} (expected 200) within ${TIMEOUT_SECONDS}s"
fi

# One more log sweep now that the page rendered (compile errors can surface late).
if grep -qE "$FATAL_PATTERN" "$LOG"; then
  fail "fatal boot error in dev log (post-render sweep)"
fi

echo "✓ FORK SMOKE PASSED — 'pnpm dev' boots clean and / returns 200."
