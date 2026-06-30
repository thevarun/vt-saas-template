---
description: 'Interactive post-fork initialization for downstream projects. Renames DB schema, configures merge strategies, cleans template artifacts.'
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

2. Delete all existing migration files:
   - Delete all files in migrations/*.sql
   - Delete all files in migrations/meta/

3. Update .env.example:
   - Change DB_SCHEMA=vt_saas → DB_SCHEMA=<new_schema>

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
   - For each feature the user drops:
     a. Remove its export line(s) from src/models/schema/index.ts
     b. Delete the module file(s) under src/models/schema/
     c. Remove the matching ENABLE ROW LEVEL SECURITY / policy block from supabase/prod-setup.sql
     d. Flag the now-orphaned app code (features/routes/libs that import the dropped tables)
        for the user to delete — don't auto-delete app code here.
   - If unsure, keep everything — extra tables are harmless; you can drop later.

5. Generate fresh migration:
   - Run: DB_SCHEMA=<new_schema> npm run db:generate
   - This creates a single clean migration for the new schema name
   - NOTE: drizzle-kit generate does NOT need DATABASE_URL — it reads Schema.ts only

6. Verify idempotency:
   - Run: DB_SCHEMA=<new_schema> npm run db:generate
   - Confirm output says "No schema changes, nothing to migrate"
   - If a second migration was generated → OUTPUT: "WARNING: Schema generation is not idempotent. Check Schema.ts."

7. OUTPUT: "Schema renamed to '<new_schema>'. Migration regenerated."
```

---

## Step 3: Configure Merge Strategies

```
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

## Step 4: Fix gh CLI Default Repo

```
1. Check if gh CLI is available:
   - Run: which gh
   - If not found → OUTPUT: "Skipping gh CLI setup (gh not installed)." → continue to Step 5

2. Run: gh repo set-default
   - This prompts the user to select their downstream repo as the default
   - It writes gh-resolved=base to the origin remote config
   - This prevents gh CLI from targeting the upstream template repo

3. OUTPUT: "gh CLI now targets your downstream repo for PRs, issues, etc."
```

---

## Step 5: Clean Up Template Artifacts

```
1. Read the .template-cleanup manifest file
   - If not found → OUTPUT: "No .template-cleanup manifest found. Skipping cleanup." → continue to Step 6

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

## Step 6: Verify

```
1. Run: DB_SCHEMA=<new_schema> npm run db:generate
   - Confirm: "No schema changes, nothing to migrate"

2. Run: npm run build
   - If build fails → OUTPUT: "WARNING: Build failed. Review errors above."
   - If build succeeds → OUTPUT: "Build passed."

3. Print summary:
   ────────────────────────────────────
   Downstream initialization complete!
   ────────────────────────────────────
   - DB schema: <new_schema>
   - Migration: single clean migration generated
   - Merge strategies: .gitattributes configured
   - gh CLI: default repo set (if available)
   - Template artifacts: cleaned up

   Next steps:
   1. Create .env.local with your DB_SCHEMA=<new_schema> and other secrets
   2. Set up your database and run: npm run db:migrate
   3. Enable build-time migrations for production: set RUN_PROD_MIGRATIONS=true in your
      deploy environment (e.g. Vercel → Production env). The template ships with this OFF
      so a build never migrates an unintended DB; your downstream has its own dedicated DB,
      so turn it on. (Required, or production builds skip migrations — see .claude/rules/database.md.)
      Only enable this when DATABASE_URL points at a database THIS project owns — never a
      shared/dev DB whose drizzle ledger other projects also use.
   4. Commit these changes: git add -A && git commit -m "chore: initialize downstream project"
   5. Add upstream remote for future syncs: git remote add upstream https://github.com/thevarun/vt-saas-template.git
   ────────────────────────────────────
```
