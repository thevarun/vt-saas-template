# Upstream Sync Guide

How to pull new features and fixes from the VT SaaS Template into your project.

## Overview

GitHub's "Use this template" creates an independent repo with no link back to the original. This guide sets up that link so you can pull upstream updates when new releases are available.

The template uses [semantic versioning](https://semver.org/) with auto-generated releases. Each release is a git tag (e.g., `v3.2.0`) with a changelog entry.

## Quick Start

```bash
# 1. Check for updates (sets up remote on first run)
npm run upstream:check

# 2. Merge a specific release
git merge v3.2.0

# 3. Verify everything works
npm install
npm run lint && npm run check-types && npm test && npm run build
```

## Detailed Workflow

### First-Time Setup

Run the check script — it automatically adds the upstream remote:

```bash
npm run upstream:check
```

This does three things:
1. Adds `upstream` remote pointing to `https://github.com/thevarun/vt-saas-template.git`
2. Fetches all upstream tags
3. Shows available releases and what's changed since your last sync

### Checking for Updates

Run `npm run upstream:check` anytime. It shows:
- Recent release tags
- Number of new commits since your last sync
- One-line summary of recent changes

### Performing a Sync

1. **Review what changed** — check the [CHANGELOG](https://github.com/thevarun/vt-saas-template/blob/main/docs/CHANGELOG.md) for the release you want to merge

2. **Merge the release tag** (not `upstream/main`):
   ```bash
   npm run upstream:check -- --merge v3.2.0
   ```
   Or manually:
   ```bash
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

### .env.example

Accept upstream changes to get new environment variable documentation, then re-add any custom variables your project needs.

## Best Practices

- **Sync to tagged releases**, not `upstream/main` — tags are tested and stable
- **Sync regularly** — smaller, frequent merges have fewer conflicts than large catch-up merges
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

### Script can't find upstream remote

```bash
git remote -v                    # check current remotes
git remote remove upstream       # remove broken remote
npm run upstream:check           # re-adds it automatically
```
