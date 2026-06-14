# Upstream Sync Guide

How to pull new features and fixes from the VT SaaS Template into your project.

## Overview

GitHub's "Use this template" creates an independent repo with no link back to the original. This guide sets up that link so you can pull upstream updates when new releases are available.

The template uses [semantic versioning](https://semver.org/) with auto-generated releases. Each release is a git tag (e.g., `v3.2.0`) with a changelog entry.

## How (and how often) to sync

A template is a **scaffold, not a library** — downstream products are *expected* to diverge heavily (remove features, add product code). So syncing is **periodic and selective**, not frequent or wholesale. Match the mechanism to the kind of code:

| Bucket | Examples | How it should flow downstream |
|---|---|---|
| **Stable shared core** (fixes must propagate) | crypto/token utils, auth middleware, error/API spine, DB guardrails | Ideally a **versioned package** (`npm`) → `npm update`, zero conflicts. Until extracted: selective sync, high priority. |
| **Scaffold / boilerplate** | app shell, config wiring, example pages, folder layout | **Copied once at fork.** Diverge freely; don't sync back. |
| **Cross-cutting deltas** | a new CI workflow, a doc, a one-off pattern | **Periodic, selective re-apply** per release (below). |

### Products graduate from wholesale merge → selective sync

- **Early (low divergence):** the `git merge <tag>` flow (Quick Start / Detailed Workflow) is fine and cheapest.
- **Mature (heavy divergence):** a wholesale merge of an old base **explodes** — it re-introduces features you deleted and collides your migration history. Stop merging the tag; **sync selectively.**
- **Heuristic:** dry-run `git merge --no-ff <tag>` then `git merge --abort`. If it shows more than ~20–30 conflicts, or touches `migrations/` or removed-feature files, you've graduated → go selective.

### Selective sync (the realistic default once you've diverged)

1. `git fetch upstream --tags`
2. See the delta since your last sync: `git log --oneline <last-synced-tag>..<new-tag>` (or read the template CHANGELOG).
3. Build a short **pull-list** — only the changes relevant to THIS product (a security fix, a useful util). Skip anything tied to features you don't have.
4. Apply each: try `git cherry-pick <sha>`; if the surrounding code has diverged it won't apply cleanly — **re-apply the change by hand, using the upstream commit as the spec.** (Barely-touched shared code often cherry-picks; product-customized code needs re-application.)
5. Verify (`lint && check-types && test && build`) + QA the touched flow.
6. Record what you pulled (e.g., commit `sync: <fix> from template vX`) so the next sync knows where you stand.

## Quick Start

```bash
# Using Claude Code (recommended):
/upstream-sync

# Or manually:
git remote add upstream https://github.com/thevarun/vt-saas-template.git
git fetch upstream --tags
git merge v3.2.0
npm install
npm run lint && npm run check-types && npm test && npm run build
```

## Downstream Project Setup

If you forked or templated this project, run the `/init-downstream` Claude Code command first. It handles:

1. **Schema rename** — regenerates a clean migration under your project's schema name
2. **Merge strategies** — configures `.gitattributes` with `merge=ours` for files you customize
3. **gh CLI targeting** — runs `gh repo set-default` so PRs/issues target your repo, not the template
4. **Template cleanup** — removes template-only artifacts (`.template-cleanup` manifest)

### Two Protection Mechanisms

**For files you keep but customize** (e.g., `README.md`, `AppConfig.ts`):
- `.gitattributes` with `merge=ours` keeps your version during upstream merges
- Setup: `git config merge.ours.driver true` (done by `/init-downstream`)

**For files you delete** (e.g., removed features):
- `/upstream-sync` auto-detects re-added files by checking git history for previous deletions
- After merge, it shows which deleted files came back and offers to remove them
- No config file needed — git history is the source of truth

### Manual Equivalent (without Claude Code)

If you're not using Claude Code, here's the manual setup:

```bash
# 1. Rename schema: update .env.example, delete migrations/*, regenerate
DB_SCHEMA=my_app npm run db:generate

# 2. Configure merge strategies
git config merge.ours.driver true
cp .gitattributes.downstream .gitattributes
# Edit .gitattributes — remove lines for features you deleted

# 3. Fix gh CLI targeting
gh repo set-default

# 4. Clean template artifacts (see .template-cleanup for list)
# Remove files listed in .template-cleanup, then delete the manifest
```

## Integrating into an Existing Project

If you already have a project and want to adopt the template (instead of starting from "Use this template"):

```bash
# Add the template as upstream
git remote add upstream https://github.com/thevarun/vt-saas-template.git
git fetch upstream --tags

# Merge a release into your existing repo
git merge v3.3.0 --allow-unrelated-histories
```

The `--allow-unrelated-histories` flag is required because the two repos have no common ancestor. This initial merge will be the largest — expect many files to appear as additions. Resolve conflicts carefully using the file classification table below, then verify:

```bash
npm install
npm run lint && npm run check-types && npm test && npm run build
```

After this first merge, future syncs follow the normal workflow below (no `--allow-unrelated-histories` needed).

## Detailed Workflow

### First-Time Setup

Add the upstream remote:

```bash
git remote add upstream https://github.com/thevarun/vt-saas-template.git
git fetch upstream --tags
```

Or use the `/upstream-sync` Claude Code command — it handles this automatically.

### Checking for Updates

```bash
git fetch upstream --tags
git log --oneline $(git merge-base HEAD upstream/main)..upstream/main
```

Or run `/upstream-sync` which shows releases, new commits, and release notes.

### Performing a Sync

1. **Review what changed** — check the [CHANGELOG](https://github.com/thevarun/vt-saas-template/blob/main/docs/CHANGELOG.md) for the release you want to merge

2. **Merge the release tag** (not `upstream/main`):
   ```bash
   git checkout -b sync/v3.2.0
   git merge v3.2.0
   ```

3. **Resolve any conflicts** — see the file classification table below

4. **Update dependencies and verify:**
   ```bash
   npm install
   npm run lint && npm run check-types && npm test && npm run build
   ```

5. **Commit** (if you merged manually):
   ```bash
   git commit -m "chore: sync upstream v3.2.0"
   ```

## File Classification

Use this table to decide how to resolve merge conflicts:

| Category | Files | Resolution Strategy |
|----------|-------|---------------------|
| **Core — Accept Upstream** | `src/proxy.ts`, `src/libs/supabase/*`, `src/libs/api/*`, `src/libs/DB.ts`, `src/models/Schema.ts`, `next.config.mjs`, `drizzle.config.ts` | Accept upstream changes. You rarely modify these. |
| **Core — Review Carefully** | `src/app/[locale]/layout.tsx`, `package.json`, `tsconfig.json`, `.github/workflows/*` | Merge manually. Keep both your additions and upstream updates. |
| **Branding — Keep Yours** | `src/styles/global.css`, `public/*` (logo, favicon, og-image), `src/utils/AppConfig.ts`, `src/libs/seo/constants.ts` | Keep your version. Cherry-pick upstream changes if needed. |
| **Content — Keep Yours** | `src/templates/Navbar.tsx`, `src/templates/Footer.tsx`, `src/locales/*`, `README.md` | Keep your version. These are fully customized for your product. |
| **Your Product Code** | `src/app/[locale]/(auth)/dashboard/*`, `src/features/*`, your custom routes | No conflict expected — upstream won't have these files. |
| **Infrastructure** | `package-lock.json` | See "Common Conflicts" below. |

## Common Conflicts

### package-lock.json

This will conflict on almost every sync. The easiest approach:

```bash
git checkout --theirs package-lock.json
npm install
git add package-lock.json
```

### package.json

If upstream added new dependencies, accept both sides: keep your additions and take theirs. Then run `npm install` to regenerate the lock file.

### Database Schema (src/models/Schema.ts)

If upstream added new tables and you also modified the schema:

1. Accept both sets of changes (your tables + upstream's new tables)
2. Run `npm run db:generate` to create a clean migration
3. Test with `npm run dev`

### Migrations / migration history (`migrations/`, `drizzle/meta/*`)

**Migrations are product-owned — never merge the template's migration history.** Your product has its own lineage (SQL files, snapshots, `_journal.json`). On conflict, **keep yours** and reject the template's migration files. To adopt a schema change the template introduced, re-create it as a **new migration in your own lineage** (`db:generate`) — don't import the template's.

### .env.example

Accept upstream changes to get new environment variable documentation, then re-add any custom variables your project needs.

## Best Practices

- **Sync to tagged releases**, not `upstream/main` — tags are tested and stable
- **Sync periodically, and selectively once you've diverged** — small frequent merges are easiest *early*; mature, heavily-diverged products sync selectively (see "How (and how often) to sync") instead of merging whole tags
- **Read the changelog first** — understand what changed before merging
- **Run the full CI check after every sync**: `npm run lint && npm run check-types && npm test && npm run build`
- **Minimize edits to core files** — the less you modify template infrastructure, the fewer conflicts you'll encounter
- **Use a dedicated branch** for the sync if you're nervous:
  ```bash
  git checkout -b sync/v3.2.0
  git merge v3.2.0
  # resolve conflicts, test, then merge to your main branch
  ```

## Troubleshooting

### Too many conflicts

If a large version jump causes overwhelming conflicts:
- Skip intermediate versions — merge directly to the latest tag
- Or cherry-pick specific commits instead of merging the whole tag:
  ```bash
  git log --oneline v3.1.0..v3.2.0  # see what changed
  git cherry-pick <commit-hash>       # pick specific fixes
  ```

### npm install fails after merge

```bash
rm -rf node_modules package-lock.json
npm install
```

### Upstream remote not working

```bash
git remote -v                    # check current remotes
git remote remove upstream       # remove broken remote
git remote add upstream https://github.com/thevarun/vt-saas-template.git
git fetch upstream --tags
```

---

## Endgame: extract must-not-diverge core into a package

When you have multiple products **and** a shared piece that must never drift (security/correctness-critical — crypto, auth, error handling), graduate it from copied scaffold to a **versioned package** (`@org/core` on npm / GitHub Packages). Then fixes propagate via `npm update` with zero merge conflicts. Do it lazily — only when the propagation pain is real, and prefer one small package over many.

## Contributing changes back to the template

The template is the **source of truth for shared code** — anything generic enough to help the *next* product belongs here, not just in one fork. Keeping a single lineage (rather than divergent copies across forks) is the whole point of the template.

### Principle: template-first

- **Build it in the template first** when you already know a change is generic — tooling, CI, build config, infra, auth, DB workflow, shared UI/primitives, error/API conventions. It lands once and every fork inherits it on the next sync. Per-fork edits multiply the work N times.
- **Contribute it back** when something built inside a product turns out to be reusable. Don't leave two copies drifting.

### Flow for contributing back (product → template)

1. Branch the **template** repo (not the product).
2. Copy the file(s) over and **strip product specifics** — branding, copy, product-domain endpoints, hardcoded routes — until it's generic.
3. Open a PR on the template, review, merge, and let semantic-release **tag** it.
4. Pull it back into the product via `/upstream-sync` (or `git fetch upstream --tags` + merge the new tag). Resolve the one conflict where your local copy meets the now-generic version, then delete the product-local copy.

### Anti-patterns

- ❌ Editing shared code in the product and cherry-picking commits up to the template — it works (shared history), but it inverts ownership and you'll fight drift forever.
- ❌ Maintaining a product-local fork of code that also lives in the template — pick one home (the template) and sync.
- ✅ **Exception:** product-specific, urgent (security/outage), or experimental/unproven changes may land in the product first; promote to the template once stable.
