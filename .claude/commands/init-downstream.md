---
description: "Interactive post-fork initialization for downstream projects. Renames DB schema, resets project identity, configures git + GitHub repo, cleans template artifacts."
---

# Init Downstream

Set up a freshly forked/templated project as an independent downstream project.

**Usage**: `/init-downstream`

---

## Step 1: Validate Environment

```
1. Verify we are inside a git repository
   - If not → OUTPUT: "ERROR: Not a git repository." → HALT
2. Check for clean working tree (no uncommitted changes)
   - If dirty → OUTPUT: "ERROR: Working tree has uncommitted changes. Commit or stash first." → HALT
3. Check if already initialized:
   - Read .env.local and check if DB_SCHEMA is set to something other than 'vt_saas'
   - If yes → ASK: "This project appears already initialized (DB_SCHEMA=<value>). Continue anyway?"
   - If user declines → HALT
```

---

## Step 2: Rename Database Schema

```
1. ASK the user: "What should your database schema be named?"
   - Suggest format: lowercase, alphanumeric + underscores (e.g., 'my_app', 'acme_saas')
   - Validate: must match /^[a-z][a-z0-9_]*$/ and not be 'public' or 'vt_saas'
   - If invalid → re-ask with explanation
   - Remember this value as <new_schema> for the rest of the workflow.

2. Delete all existing migration files:
   - Delete all files in migrations/*.sql
   - Delete all files in migrations/meta/

3. Sweep the old schema literal EVERYWHERE. 'vt_saas' is NOT confined to
   Schema.ts — replace it in every file below. This list is a starting point,
   not the definition of done; the grep-verify in sub-step 7 is:
   - .env.example              → DB_SCHEMA= and NEXT_PUBLIC_DB_SCHEMA= defaults
   - supabase/seed.sql         → every INSERT INTO "vt_saas".* statement
                                 (missed in a real fork: the seed then lands in
                                 ANOTHER fork's schema on shared dev and blocks
                                 that instance's signups — upstream issue #405)
   - supabase/prod-setup.sql   → grants, RLS, FKs, CHECKs, the `schema_name`
                                 variable, AND the schema-namespaced auth
                                 trigger/function names (vt_saas_on_auth_user_created
                                 → <new_schema>_on_auth_user_created, vt_saas.handle_new_user
                                 → <new_schema>.handle_new_user, etc.)
   - .github/workflows/*.yml   → DB_SCHEMA / NEXT_PUBLIC_DB_SCHEMA env defaults
                                 in CI jobs
   - src/** (incl. *.test.ts)  → test env stubs, comments, error-message examples
                                 (e.g. src/models/schema/_db-schema.ts)

4. Trim optional feature tables (pick only what this project needs):
   - The template schema is modular — one file per feature under src/models/schema/,
     re-exported by src/models/schema/index.ts. The regenerated migration below
     contains EXACTLY the tables exported there, so dropping a feature now keeps it
     out of the new project's baseline migration (and its DB) entirely.
   - SHOW the optional feature modules and ASK which to keep. Typical optional ones:
     - platform-connections (third-party OAuth) → platform-connections.ts
     - scheduled-tasks (background-job queue) → scheduled-tasks.ts
     - subscriptions/billing/quota (subscription-tiers, tier-quotas, user-subscriptions,
       resource-usage, stripe-webhook-events) → keep or drop as a SET (they reference
       each other via FKs)
     - vercel-chat (AI chat history) → vercel-chat.ts
   - Usually-core (keep): preferences, audit, feedback, threads, share-links.
   - For each feature the user drops, trace the FULL blast radius — schema + RLS
     alone is not enough (a real fork shipped green with an orphaned cron 404ing
     every 5 min, live code querying a dropped table, and dead env vars — upstream
     issue #378). Walk EVERY layer:
     a. Schema module file(s) under src/models/schema/ + export line(s) in index.ts
     b. supabase/prod-setup.sql — the feature's RLS/policy block AND its
        cross-schema FK block(s); supabase/seed.sql — the feature's seed rows
     c. Libs that query the dropped table(s) (e.g. src/libs/<feature>/)
     d. Route handlers and pages importing those libs (src/app/api/**,
        src/app/[locale]/**)
     e. Job/cron registrations — the layer real forks miss:
        - Inngest functions (src/libs/inngest/functions/*.ts) AND their
          registration in src/app/api/inngest/route.ts
        - vercel.json crons[] entries pointing at routes deleted above
          (a stale cron 404s on schedule forever after deploy)
     f. Env vars used ONLY by the feature: src/libs/Env.ts (both the schema
        block and runtimeEnv) + .env.example
     g. .claude/rules/<feature>.md and doc references
     h. Co-located unit tests + E2E specs (they fail CI otherwise).
        Feature → spec map (adjust to what actually exists in tests/):
          - vercel-chat           → tests/e2e/chat.spec.ts, chat-history.spec.ts,
                                     multi-thread-chat.spec.ts, chat-selection.spec.ts
          - platform-connections  → any tests/e2e/*platform*.spec.ts
          - subscriptions/billing → any tests/e2e/*billing*|*subscription*.spec.ts
     i. .github/workflows/*.yml jobs/steps referencing the feature
     SHOW the full matched file list for the feature (all layers a–i) and ASK once;
     on confirm, delete them all (git rm). If the user declines, keep the schema
     module too — a half-dropped feature is worse than a kept one.
   - GREP-VERIFY each dropped feature before moving to the next:
       grep -rn "<dropped_table>|libs/<feature>" src/ tests/ vercel.json .github/
     must come back clean. Any hit = a missed layer; fix and re-grep.
   - If unsure, keep everything — extra tables are harmless; you can drop later.
   - SEQUENCING: any docs/rebrand sweep must run AFTER all code deletion (do it
     as the LAST init step) — run earlier it can't see which references are dead,
     and you pay for a second pass.

5. Generate fresh migration:
   - Run: DB_SCHEMA=<new_schema> pnpm db:generate
   - This creates a single clean migration for the new schema name
   - NOTE: drizzle-kit generate does NOT need DATABASE_URL — it reads Schema.ts only

6. Verify idempotency:
   - Run: DB_SCHEMA=<new_schema> pnpm db:generate
   - Confirm output says "No schema changes, nothing to migrate"
   - If a second migration was generated → OUTPUT: "WARNING: Schema generation is not idempotent. Check Schema.ts."

7. GREP-VERIFY the rename — the exit criterion for this whole step:
   - Run: grep -rn "vt_saas" --exclude-dir=node_modules --exclude-dir=.git .
   - Expected remaining hits: ONLY files that talk about the upstream template
     by name (this command file, upstream-sync docs/config).
   - ANY hit in src/, supabase/, migrations/, tests/, .github/, vercel.json or
     .env* is a missed rename — fix it and re-run the grep until clean.
     (This catches files added to the template after this list was written.)

8. OUTPUT: "Schema renamed to '<new_schema>'. Migration regenerated. Grep-verify clean."
```

---

## Step 3: Reset Project Identity

```
1. ASK: "What is your product/package name?" (kebab-case, e.g. 'acme-app').
   - Default suggestion: <new_schema> with underscores → dashes.

2. Update package.json:
   - name        → <package_name>
   - version     → 0.1.0   (semantic-release will manage bumps from here)
   - description  → ASK for a one-line product description (or blank it)
   - repository.url, bugs.url, homepage → point at the downstream repo if known
     (derive from `git remote get-url origin`); otherwise leave for the user to fill.
   - author       → ASK or leave as-is.

3. Reset the changelog:
   - Overwrite docs/changelog.json with an empty seed: {"versions": []}
     (this is the humanized, user-facing changelog rendered at /changelog). The
     Changelog Sync workflow reads the GitHub Releases API and humanizes every
     release NEWER than the newest entry here — an empty seed means it starts
     from your product's very first release. Do NOT carry over the template's
     high-water marker entry (e.g. 3.28.0); left in place it sits ABOVE all your
     0.x releases and changelog-sync would skip them forever.
   - Note: semantic-release is tag-only and does NOT write a docs/CHANGELOG.md
     file — release notes live on the GitHub Release page. There is no CHANGELOG.md
     to reset.

4. OUTPUT: "Project identity reset — package '<package_name>' @ 0.1.0."
```

---

## Step 4: Configure Git Behavior & Merge Strategies

```
0. Configure local git behavior for a solo rebase-first workflow:
   - Run: git config pull.rebase true
     - Makes `git pull` rebase instead of creating merge commits (linear history).
   - Run: git config rebase.autoStash true
     - Auto-stashes uncommitted changes before a rebase/pull and re-applies after, so a
       dirty tree never blocks a pull. (A conflict on re-apply leaves the stash intact for
       manual resolution — nothing is lost.)
   - NOTE: git config is LOCAL to this clone — a fork does NOT inherit it, so we set it here.

1. Run: git config merge.ours.driver true
   - This registers the 'ours' merge driver (keeps local version during merges)

2. Check if .gitattributes.downstream exists
   - If not → OUTPUT: "WARNING: .gitattributes.downstream not found. Skipping merge strategy setup."
   - If yes → Copy .gitattributes.downstream to .gitattributes

3. Show the user the contents of .gitattributes
4. ASK: "Have you removed any features listed above? If so, remove those lines — merge=ours only works for files you KEEP but customize. For deleted files, /upstream-sync auto-detects re-additions."
5. Let user edit if needed, or confirm as-is
```

---

## Step 5: Configure GitHub Repo

```
1. Check if gh CLI is available AND authenticated:
   - Run: which gh   (if not found → OUTPUT: "Skipping GitHub setup (gh not installed)." → continue to Step 6)
   - Run: gh auth status   (if not authed → OUTPUT: "Skipping GitHub setup (gh not authenticated)." → continue to Step 6)
   - Resolve the repo: REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

2. Set the default repo so gh targets THIS repo, not the upstream template:
   - Run: gh repo set-default
   - Writes gh-resolved=base to the origin remote config.

3. Configure merge strategy — squash-only + auto-delete branch (all NON-BLOCKING; on any
   failure, warn and continue). Squash-and-merge gives one clean Conventional Commit per PR,
   which is exactly what semantic-release reads to bump the version and write the changelog:
   - Run: gh api repos/$REPO -X PATCH \
       -F allow_squash_merge=true \
       -F allow_merge_commit=false \
       -F allow_rebase_merge=false \
       -F delete_branch_on_merge=true \
       -f squash_merge_commit_title=PR_TITLE \
       -f squash_merge_commit_message=PR_BODY
   - This disables merge-commit + rebase-merge, enables squash, sets the squash commit
     title to the PR title, and auto-deletes the branch after merge.

4. Dependabot during bootstrap (advisory): a fresh fork inherits .github/dependabot.yml,
   and Dependabot PRs landing mid-bootstrap repeatedly rebase-conflict your init branch
   on package.json / pnpm-lock.yaml. RECOMMEND pausing it until the init commit lands:
   set `open-pull-requests-limit: 0` on each ecosystem in .github/dependabot.yml now,
   and restore the original limits in a follow-up commit once bootstrap is merged.
   ASK before editing; skip freely — this is a papercut, not a blocker.

5. OUTPUT: "GitHub repo configured — squash-only merge, auto-delete branch on merge,
   default repo set to $REPO."
   - NOTE: `main` branch protection is intentionally NOT set here — a fresh fork has no
     green CI yet. The /launch-checklist audit verifies branch protection at launch time.
```

---

## Step 6: Clean Up Template Artifacts

```
1. Read the .template-cleanup manifest file
   - If not found → OUTPUT: "No .template-cleanup manifest found. Skipping cleanup." → continue to Step 7

2. For each glob pattern in the manifest:
   - Scan for matching files/directories
   - Collect all matches

3. Show the user what was found:
   - Group by pattern
   - Show file counts per pattern
   - List specific files

4. ASK: "Remove these template artifacts? (They are not needed for downstream projects)"
   - If user confirms → delete all matched files using git rm (for tracked files) or rm (for untracked)
   - If user declines → skip

5. After cleanup, remove the .template-cleanup manifest itself:
   - Run: git rm .template-cleanup

6. OUTPUT: "Template artifacts cleaned up."
```

---

## Step 7: Scaffold CI Secrets Manifest (advisory)

```
This does NOT set any secrets (the services may not exist yet at fork time). It produces a
checklist of what CI/deploy will need, so your first CI run doesn't fail on missing secrets.

1. Parse .github/workflows/*.yml for every `${{ secrets.* }}` reference; dedupe the names.
   - Ignore GITHUB_TOKEN (GitHub injects it automatically).

2. Filter by the features KEPT in Step 2:
   - Drop DIFY_API_KEY / DIFY_API_URL if the Dify chat stack was removed.
   - Drop SENTRY_* if Sentry was removed.

3. If gh is authed, run `gh secret list` and mark each required secret ✅ (set) or ❌ (missing).

4. Print the manifest, LABELED BY STORE (secrets live in two different places):
   - GitHub Actions secrets  → needed for CI (`gh secret set NAME`)
   - Vercel env vars         → needed for build/runtime (Vercel dashboard or `vercel env add`)
   Some names live in BOTH (e.g. NEXT_PUBLIC_SUPABASE_URL). Note that per row.

5. OUTPUT this as a "before your first CI run / deploy" to-do. NON-BLOCKING — never halt.
```

---

## Step 8: Verify

```
1. Run: DB_SCHEMA=<new_schema> pnpm db:generate
   - Confirm: "No schema changes, nothing to migrate"

2. Run: pnpm build
   - If build fails → OUTPUT: "WARNING: Build failed. Review errors above."
   - If build succeeds → OUTPUT: "Build passed."

3. Run: pnpm smoke   (scripts/fork-smoke.sh — the first-boot gate)
   - Boots the REAL `pnpm dev` (run-p + all dev:* sidecars) with .env.example-shaped
     env: required keys get fake values, DATABASE_URL is blanked so DB.ts uses
     in-memory PGlite. Needs NO .env.local and NO secrets — safe right now,
     before the user has configured anything.
   - Asserts / returns 200 and the dev log has no fatal boot errors. A green
     build does NOT imply this passes (env validation, run-p forwarding, and
     sidecar bins only surface on a real boot — upstream issues #379/#380).
   - If it fails → OUTPUT: "WARNING: fork smoke failed — the app builds but does
     not BOOT. Review the log above." (warn, don't halt)
   - Requires ports 3000 + 8969 free; if occupied, re-run with SMOKE_PORT=<free port>.

4. Print summary:
   ────────────────────────────────────
   Downstream initialization complete!
   ────────────────────────────────────
   - DB schema: <new_schema> (rename grep-verified clean)
   - Migration: single clean migration generated
   - Boot check: pnpm smoke (dev server boots, / returns 200)
   - Project identity: package renamed, version reset to 0.1.0, changelog cleared
   - Git behavior: pull.rebase + rebase.autoStash + merge.ours configured
   - GitHub repo: squash-only merge + auto-delete branch + default repo (if gh available)
   - Merge strategies: .gitattributes configured
   - Template artifacts: cleaned up
   - CI secrets: manifest printed (fill before first CI run)

   Next steps:
   1. Create .env.local with your DB_SCHEMA=<new_schema> and other secrets,
      then boot for real: pnpm dev (the smoke above used fake env + PGlite;
      this is the first boot against YOUR env)
   2. Set up your database and run: pnpm db:migrate
   3. Enable build-time migrations for production: set RUN_PROD_MIGRATIONS=true in your
      deploy environment (e.g. Vercel → Production env). The template ships with this OFF
      so a build never migrates an unintended DB; your downstream has its own dedicated DB,
      so turn it on. (Required, or production builds skip migrations — see .claude/rules/database.md.)
      Only enable this when DATABASE_URL points at a database THIS project owns — never a
      shared/dev DB whose drizzle ledger other projects also use.
   4. Set the CI secrets from the Step 7 manifest (`gh secret set …` + Vercel env).
   5. Commit these changes: git add -A && git commit -m "chore: initialize downstream project"
   6. Add upstream remote for future syncs: git remote add upstream https://github.com/thevarun/vt-saas-template.git
   7. Before launch, run /launch-checklist to verify branch protection, CI status, and prod env.
   ────────────────────────────────────
```
