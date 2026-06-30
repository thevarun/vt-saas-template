#!/usr/bin/env bash
# verify-pushed-pr.sh — deterministic byte-verify helpers for step-05 (verify) + step-06 (merge).
#
# These are *checks*, not judgment. The merge gate is a fresh, produce-blind verify subagent
# (SKILL.md HARD RULE 1); these subcommands give it — and the merge step — scriptable, trustworthy
# facts to reason over: does the claimed change exist in the *pushed* bytes, does a new file really
# land on the branch, did the test count rise (not silently fall), is the JSON parseable, are the
# required checks conclusively green. Each prints `PASS`/`FAIL <evidence>` and exits 0/1 so a caller
# can branch on it. The JUDGMENT — is this change correct, stripped-to-pattern, exploit-closed —
# stays with the subagent. Trust bytes, never reports.
#
# Usage: verify-pushed-pr.sh <subcommand> [args]
#   diff-has   <repo> <base> <branch> <regex>   change appears in pushed branch..base diff
#   file-on-branch <repo> <branch> <path>       a claimed new file exists on the pushed branch
#   test-count <repo> <branch>                  print the test count on a ref (for a human/agent)
#   test-delta <repo> <base> <branch>           assert branch's test count >= base (rising-count integrity)
#   json-ok    <file>...                        every file JSON.parse-es cleanly (registries/journals)
#   ci-poll    <repo> <pr>                       poll required checks to a conclusive state
#
# Conventions: <repo> is an absolute path (engine addresses repos by path). Refs are resolved against
# `origin/` first (we verify what was *pushed*, not local state), falling back to the bare ref.
set -uo pipefail

die()  { echo "FAIL $*" >&2; exit 1; }
pass() { echo "PASS $*"; exit 0; }

# Resolve a ref to what was pushed: prefer origin/<ref>, else <ref>. Echoes the resolved ref.
resolve_ref() {
  local repo="$1" ref="$2"
  if git -C "$repo" rev-parse --verify --quiet "origin/$ref" >/dev/null; then
    echo "origin/$ref"
  elif git -C "$repo" rev-parse --verify --quiet "$ref" >/dev/null; then
    echo "$ref"
  else
    return 1
  fi
}

# Count test cases on a ref without checking it out: grep test/it( across the tree at that ref.
# Heuristic but monotonic — we only ever compare it to itself across base vs branch, so the
# absolute number doesn't matter; a *drop* is the smell (tests clobbered in a rebase/port).
count_tests() {
  local repo="$1" ref="$2"
  git -C "$repo" grep -hoE "\b(it|test)(\.(only|skip|each))?\s*\(" "$ref" -- \
    '*.test.ts' '*.test.tsx' '*.spec.ts' '*.spec.tsx' 2>/dev/null | wc -l | tr -d ' '
}

cmd="${1:-}"; shift || true
case "$cmd" in

  # --- diff-has: the claimed change is present in the pushed diff (branch vs base) ----------------
  diff-has)
    repo="$1"; base="$2"; branch="$3"; regex="$4"
    rb=$(resolve_ref "$repo" "$base")   || die "base ref not found: $base"
    rh=$(resolve_ref "$repo" "$branch") || die "branch ref not found: $branch"
    # Match against added lines only (leading '+', excluding the +++ file header).
    hit=$(git -C "$repo" diff "$rb...$rh" | grep -E '^\+' | grep -vE '^\+\+\+' | grep -E "$regex" | head -3)
    [ -n "$hit" ] || die "regex not in $rh...$rb added lines: /$regex/"
    pass "diff-has /$regex/ in $rh (vs $rb):\n$hit"
    ;;

  # --- file-on-branch: a claimed new file actually exists on the pushed branch -------------------
  file-on-branch)
    repo="$1"; branch="$2"; path="$3"
    rh=$(resolve_ref "$repo" "$branch") || die "branch ref not found: $branch"
    if git -C "$repo" cat-file -e "$rh:$path" 2>/dev/null; then
      bytes=$(git -C "$repo" cat-file -s "$rh:$path" 2>/dev/null)
      pass "file-on-branch $path on $rh (${bytes}B)"
    fi
    die "file absent on $rh: $path"
    ;;

  # --- test-count: report the count on a ref (informational; pairs with test-delta) -------------
  test-count)
    repo="$1"; branch="$2"
    rh=$(resolve_ref "$repo" "$branch") || die "ref not found: $branch"
    pass "test-count $rh = $(count_tests "$repo" "$rh")"
    ;;

  # --- test-delta: rising-test-count integrity (branch must not lose tests vs base) -------------
  test-delta)
    repo="$1"; base="$2"; branch="$3"
    rb=$(resolve_ref "$repo" "$base")   || die "base ref not found: $base"
    rh=$(resolve_ref "$repo" "$branch") || die "branch ref not found: $branch"
    cb=$(count_tests "$repo" "$rb"); ch=$(count_tests "$repo" "$rh")
    [ "$ch" -ge "$cb" ] || die "test count fell: $rb=$cb -> $rh=$ch (tests clobbered?)"
    pass "test-delta non-regressing: $rb=$cb -> $rh=$ch"
    ;;

  # --- json-ok: every file parses (additive registries, migration journals, locale catalogs) ----
  json-ok)
    [ "$#" -ge 1 ] || die "json-ok needs >=1 file"
    bad=0
    for f in "$@"; do
      if node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$f" 2>/dev/null; then
        echo "  ok   $f"
      else
        echo "  FAIL $f"; bad=1
      fi
    done
    [ "$bad" -eq 0 ] || die "json-ok: one or more files did not parse"
    pass "json-ok: $# file(s) parse"
    ;;

  # --- ci-poll: poll required checks to a conclusive state --------------------------------------
  # Treats bucket=skipping as success (path filters legitimately skip docs/CI on a code-only PR).
  # Handles the post-force-push pending race: a fresh push leaves checks briefly stale/pending, so
  # we never trust the first read — we require a poll where NOTHING is pending before judging.
  ci-poll)
    repo="$1"; pr="$2"
    deadline=$(( $(date +%s) + ${CI_POLL_TIMEOUT:-600} ))   # bounded loop; default 10m
    interval="${CI_POLL_INTERVAL:-20}"
    while :; do
      # bucket ∈ pass | fail | pending | skipping | cancel  (gh categorizes state for us)
      buckets=$(gh pr checks "$pr" -R "$(git -C "$repo" remote get-url origin 2>/dev/null)" \
                  --json bucket -q '.[].bucket' 2>/dev/null) \
        || buckets=$(gh pr checks "$pr" --json bucket -q '.[].bucket' 2>/dev/null) \
        || die "ci-poll: gh pr checks failed for #$pr"
      [ -n "$buckets" ] || die "ci-poll: no checks reported for #$pr (none registered yet?)"
      pend=$(grep -c '^pending$'  <<<"$buckets")
      fail=$(grep -cE '^(fail|cancel)$' <<<"$buckets")
      # Force-push race: don't judge until the new run has registered (no pending left).
      if [ "$pend" -eq 0 ]; then
        [ "$fail" -eq 0 ] || die "ci-poll: #$pr has $fail failing/cancelled check(s) — red gate is signal, do NOT --admin"
        pass "ci-poll: #$pr conclusive — $(grep -c '^pass$' <<<"$buckets") pass, $(grep -c '^skipping$' <<<"$buckets") skipping (treated as success)"
      fi
      [ "$(date +%s)" -lt "$deadline" ] || die "ci-poll: #$pr still pending after timeout ($pend pending)"
      sleep "$interval"
    done
    ;;

  *)
    die "unknown subcommand: '$cmd' — see header for usage"
    ;;
esac
