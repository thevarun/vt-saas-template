#!/usr/bin/env bash
# detect-context.sh — resolve the runtime context for step-01 of upstream-contribute.
#
# Prints a greppable KEY=VALUE summary: repo IDENTITY (template | product | unknown),
# package manager, gh auth, tree cleanliness, and SOURCE/TARGET hints. Identity is
# decided by git remote + template marker — NEVER by folder name (worktrees lie).
#
# FAIL-CLOSED: if identity can't be resolved, role=unknown + a note. step-01 STOPS
# and asks; it never guesses SOURCE/TARGET. Exit 0 always — the summary is the product.
#
# Usage: detect-context.sh [REPO_DIR]   (defaults to cwd)

set -u

# The canonical template. Identity hinges on this slug, not on any path.
TEMPLATE_SLUG="vt-saas-template"

REPO="${1:-$PWD}"

# --- helpers -----------------------------------------------------------------
# Run git scoped to REPO without an interactive cd (keeps the harness happy).
g() { git -C "$REPO" "$@" 2>/dev/null; }
have() { command -v "$1" >/dev/null 2>&1; }

# --- not even a repo? bail clean --------------------------------------------
if ! g rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "role=unknown"
  echo "note=not a git work tree at ${REPO} — cannot resolve identity"
  exit 0
fi
ROOT="$(g rev-parse --show-toplevel)"

# --- identity: remote + marker, never the directory name ---------------------
ORIGIN="$(g remote get-url origin || true)"
UPSTREAM="$(g remote get-url upstream || true)"
PKG_NAME="$(have node && [ -f "$ROOT/package.json" ] && node -p "require('$ROOT/package.json').name" 2>/dev/null || true)"

ROLE="unknown"
NOTE=""
# Template signature: origin is the template slug, OR the cleanup marker exists,
# OR package.json self-identifies. Any one is sufficient.
if printf '%s' "$ORIGIN" | grep -q "$TEMPLATE_SLUG" \
   || [ -f "$ROOT/.template-cleanup" ] \
   || [ "$PKG_NAME" = "$TEMPLATE_SLUG" ]; then
  ROLE="template"
# Product signature: a fork — an `upstream` remote points at the template and
# origin is something else.
elif printf '%s' "$UPSTREAM" | grep -q "$TEMPLATE_SLUG" \
     && ! printf '%s' "$ORIGIN" | grep -q "$TEMPLATE_SLUG"; then
  ROLE="product"
else
  NOTE="no template slug in origin/upstream and no marker — add an 'upstream' remote pointing at ${TEMPLATE_SLUG}, or confirm identity by hand"
fi

# Product name from the origin slug (display only; never a decision input).
PRODUCT_NAME=""
[ "$ROLE" = "product" ] && PRODUCT_NAME="$(basename -s .git "$ORIGIN" 2>/dev/null)"

# --- package manager: lockfile-driven ---------------------------------------
if   [ -f "$ROOT/pnpm-lock.yaml" ];   then PKG_MGR="pnpm"
elif [ -f "$ROOT/package-lock.json" ]; then PKG_MGR="npm"
else PKG_MGR="unknown"; fi
NODE_MODULES="absent"; [ -d "$ROOT/node_modules" ] && NODE_MODULES="present"

# --- gh auth + tree state ----------------------------------------------------
GH_AUTH="missing"
have gh && gh auth status >/dev/null 2>&1 && GH_AUTH="ok"
TREE="clean"; [ -n "$(g status --porcelain)" ] && TREE="dirty"

# --- SOURCE/TARGET hints from the resolved role ------------------------------
# TARGET is always the template. SOURCE is the product. We only know the half we
# are standing in; the other side is a hint for step-01 to confirm, not assert.
case "$ROLE" in
  template) SOURCE_HINT="(unknown — point at the product repo)"; TARGET_HINT="$ROOT" ;;
  product)  SOURCE_HINT="$ROOT"; TARGET_HINT="(unknown — point at ${TEMPLATE_SLUG})" ;;
  *)        SOURCE_HINT="(unresolved)"; TARGET_HINT="(unresolved)" ;;
esac

# --- summary -----------------------------------------------------------------
echo "role=${ROLE}"
[ -n "$PRODUCT_NAME" ] && echo "product=${PRODUCT_NAME}"
echo "repo_root=${ROOT}"
echo "origin=${ORIGIN:-none}"
echo "upstream=${UPSTREAM:-none}"
echo "pkg_mgr=${PKG_MGR}"
echo "node_modules=${NODE_MODULES}"
echo "gh_auth=${GH_AUTH}"
echo "tree=${TREE}"
echo "source_hint=${SOURCE_HINT}"
echo "target_hint=${TARGET_HINT}"
[ -n "$NOTE" ] && echo "note=${NOTE}"
exit 0
