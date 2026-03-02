---
description: 'Interactive upstream sync — fetches template releases, merges with conflict resolution, auto-detects re-added deleted files.'
---

# Upstream Sync

Pull new features and fixes from the VT SaaS Template into your downstream project.

**Usage**: `/upstream-sync`

---

## Step 1: Setup

```
1. Verify we are inside a git repository
   - If not → OUTPUT: "ERROR: Not a git repository." → HALT

2. Check for clean working tree
   - If dirty → OUTPUT: "ERROR: Working tree has uncommitted changes. Commit or stash first." → HALT

3. Add upstream remote if not present:
   - Check: git remote | grep -q "^upstream$"
   - If not found → Run: git remote add upstream https://github.com/thevarun/vt-saas-template.git
   - OUTPUT: "Upstream remote configured."

4. Fix gh CLI repo targeting:
   - If gh CLI is available → Run: gh repo set-default
   - This ensures gh CLI targets the downstream repo, not the template

5. Fetch upstream:
   - Run: git fetch upstream --tags
   - OUTPUT: "Fetched upstream tags and branches."
```

---

## Step 2: Show What's New

```
1. List recent upstream releases (tags):
   - Run: git tag --sort=-version:refname | head -10
   - Display as numbered list

2. Show commits since last sync:
   - Find merge base: git merge-base HEAD upstream/main
   - Count new commits: git log --oneline <merge-base>..upstream/main
   - Display count and recent commit summaries

3. If there are new releases, fetch release notes:
   - Run: gh release view <latest-tag> --repo thevarun/vt-saas-template 2>/dev/null
   - Display release notes summary if available
   - If gh fails → fall back to showing git log between tags
```

---

## Step 3: Choose Release

```
1. ASK: "Which release do you want to merge?"
   - Show available tags as options
   - Recommend the latest release
   - User can also specify a custom tag

2. Confirm the chosen tag exists:
   - Run: git rev-parse <tag> 2>/dev/null
   - If not found → OUTPUT: "ERROR: Tag <tag> not found." → re-ask

3. Create a sync branch:
   - Run: git checkout -b sync/<tag>
   - OUTPUT: "Created branch sync/<tag>"
```

---

## Step 4: Merge & Resolve

```
1. Run: git merge <tag>
   - If no conflicts → OUTPUT: "Clean merge!" → continue to Step 4.4

2. If conflicts detected:
   a. List conflicted files: git diff --name-only --diff-filter=U
   b. Classify each file using the file classification from docs/upstream-sync-guide.md:
      - Core (Accept Upstream): src/proxy.ts, src/libs/supabase/*, src/libs/api/*, etc.
      - Core (Review Carefully): layout.tsx, package.json, tsconfig.json, workflows
      - Branding (Keep Yours): global.css, public/*, AppConfig.ts, seo/constants.ts
      - Content (Keep Yours): Navbar, Footer, locales, README.md
      - Infrastructure: package-lock.json
   c. Show classification to user with recommended resolution per file
   d. For package-lock.json conflicts:
      - Auto-resolve: git checkout --theirs package-lock.json && npm install && git add package-lock.json
   e. For other conflicts:
      - Help user resolve interactively, reading conflict markers and suggesting resolutions
      - Apply the classification strategy as default recommendation

3. After all conflicts resolved:
   - Run: git add -A && git commit (continue the merge)

4. Auto-detect re-added files (files the downstream project previously deleted):
   a. Find all files ever deleted in downstream history:
      - Run: git log --diff-filter=D --name-only --pretty=format:"" HEAD | sort -u
   b. Check which of those deleted files now exist in the working tree after merge
   c. Filter out files that were intentionally re-created (check if they were added back before this merge)
   d. If re-added files found:
      - Group by feature area (e.g., "Codex workflows", "Template docs", etc.)
      - Show the list to the user
      - ASK: "These files were previously deleted but came back from upstream. Remove them?"
      - If confirmed → git rm <files> && git commit -m "chore: re-remove files deleted in downstream"
   e. If no re-added files → OUTPUT: "No previously deleted files were re-added."
```

---

## Step 5: Verify

```
1. Run the full CI check suite:
   - npm run lint
   - npm run check-types
   - npm test
   - npm run build

2. Report results for each check:
   - If all pass → OUTPUT: "All checks passed!"
   - If any fail → show which failed and help debug

3. Print summary:
   ────────────────────────────────────
   Upstream sync complete!
   ────────────────────────────────────
   - Merged: <tag>
   - Branch: sync/<tag>
   - Conflicts resolved: <count>
   - Re-added files removed: <count>
   - CI checks: all passed / <failures>

   Next steps:
   1. Review the changes: git log --oneline main..sync/<tag>
   2. Merge to your main branch:
      git checkout main
      git merge sync/<tag>
   3. Push: git push origin main
   ────────────────────────────────────
```
