# Database workflow

Canonical reference for how schema changes flow from code → dev DB → production. Optimised for in-repo lookup (AI agents and humans). For the condensed must-not-break rules — which load automatically when you touch `src/models/Schema.ts` or `migrations/` — see [`.claude/rules/database.md`](../.claude/rules/database.md).

---

## TL;DR

The database state lives in **three** homes — pick the right one and most pitfalls disappear:

| Where | What lives here |
|---|---|
| `src/models/Schema.ts` | Tables, columns, indexes, intra-schema FKs, UNIQUE constraints, drizzle-expressible CHECKs. **Drizzle generates the migration on `main`.** |
| `supabase/prod-setup.sql` | Schema grants, cross-schema FKs to `auth.users`, RLS policies, auth triggers, CHECK guards, the `updated_at` trigger. **Idempotent bootstrap, applied manually.** |
| `supabase/pending-migrations/` | One-shot data migrations (cleanup, backfill, dedup). **Applied manually, then deleted.** |

⚠️ **Critical**: `drizzle-kit migrate` is **journal-driven**, not file-driven. It reads `migrations/meta/_journal.json` and applies only the `.sql` file for each journal entry. A hand-written `migrations/0099_foo.sql` not in the journal is silently skipped — **including in prod**. Source: `node_modules/drizzle-orm/migrator.js` (the migrate runner iterates `journal.entries` and reads `${tag}.sql` per entry).

---

## Not the Supabase CLI

Schema and migrations here are **Drizzle's**: migration files live in `./migrations/` (set by `drizzle.config.ts`) and apply via `pnpm db:migrate`. The Supabase CLI's own migration system (`supabase/migrations/`) is **not** used, and that directory is empty.

⚠️ **`supabase db push` will silently report "up to date".** It only reads `supabase/migrations/` (empty), so it never sees the Drizzle migrations in `./migrations/` — it cannot apply your schema. Use `pnpm db:migrate` (prod / build-time) or the Supabase MCP / SQL editor (dev) instead. The `supabase/` directory here holds only `prod-setup.sql` and `pending-migrations/`, both applied by hand/MCP — never by `supabase db push`.

---

## Drizzle commands

| Command | Consults live DB? | Behaviour | When to use |
|---|---|---|---|
| `db:push` | ✅ introspects DB | Diffs DB ↔ `Schema.ts`, applies SQL directly | ⛔ **NEVER**. See warning below. |
| `db:generate` | ❌ snapshot only | Diffs `Schema.ts` ↔ `migrations/meta/<latest>_snapshot.json`, writes a new migration file + snapshot | On `main` only, after schema changes have merged |
| `db:migrate` / `db:migrate:ci` | ✅ connects to apply | Iterates `_journal.json` entries, applies each `<tag>.sql` not yet recorded in the DB's `__drizzle_migrations` table | Vercel runs `db:migrate:ci` automatically on prod builds; do not run locally against shared dev unless you know what you're doing |

> `db:migrate` runs under `dotenv -c production` (it targets the prod DB by design); `db:migrate:ci` is the bare runner Vercel invokes during the production build. See `package.json`.

### Why `db:push` is banned

`db:push` introspects the live DB and diffs against `src/models/Schema.ts`. Anything Drizzle can't see in code looks like drift — and it will emit `DROP POLICY`, `DROP TRIGGER`, `DROP CONSTRAINT`, etc. for the cross-schema FKs, RLS policies, triggers, and CHECK constraints that live in `prod-setup.sql`. The confirmation prompt is not safe — destructive ops are easy to miss in a long list.

Because of this, **there is no `db:push` npm script** so it can't be fat-fingered. The underlying `drizzle-kit push` binary still exists, but there is no legitimate reason to run it against any environment — apply dev schema changes via the Supabase MCP / SQL editor instead (see Feature-branch workflow below).

### Why `db:migrate` is journal-driven, not file-driven

This is the single most-misunderstood thing about this setup. The runner reads `_journal.json`:

```js
// node_modules/drizzle-orm/migrator.js
for (const journalEntry of journal.entries) {
  const migrationPath = `${migrationFolderTo}/${journalEntry.tag}.sql`;
  ...
}
```

**A `.sql` file without a journal entry is invisible.** If you `git mv` a hand-written file into `migrations/` and commit it, Vercel will not apply it on the next deploy — even though pre-commit hooks let it through and the file is right there.

The pattern that *does* work for a hand-written migration (when drizzle structurally can't express the change): run `db:generate` first to mint a journal entry + snapshot, then replace the generated file's contents with your hand-written SQL. The journal entry stays valid because drizzle's `migrate` runner only checks the entry → file mapping, not the file's contents (the content hash recorded in `__drizzle_migrations` is just for change detection). Use this sparingly — for anything drizzle can express, let `db:generate` write the SQL.

---

## Feature-branch workflow

1. **Edit `src/models/Schema.ts`.** Use the `vtSaasSchema` / `DB_SCHEMA_NAME` helpers for the schema namespace (the `DB_SCHEMA` env var, default `vt_saas`).
2. **Apply the equivalent SQL to dev** via one of:
   - **Supabase MCP** — call `apply_migration` against the dev project. Preferred when an agent is driving.
   - **Supabase SQL Editor** — paste the SQL by hand. Preferred when the change is risky.
3. **Don't commit migration files** on a feature branch. A pre-commit hook blocks `migrations/` writes on non-`main` branches.
4. *(Optional)* Run `db:generate` locally as a sanity check to preview what SQL drizzle would emit on main. Discard the output.

A pre-commit hook (`.husky/pre-commit`) enforces step 3. If you trip it, you're applying something that should have gone through the MCP / SQL-editor path.

---

## Main-branch / production workflow

1. **After the feature PR merges to `main`**, run `pnpm db:generate` once on main locally. Interactively confirm any rename prompts (see Gotchas).
2. **Inspect the generated SQL carefully.** It should contain only the schema diff (columns/indexes/FKs/UNIQUE/expressible CHECKs). Red flags: `DROP POLICY`, `DROP TRIGGER`, `DROP CONSTRAINT fk_*_auth_users` → abort; `Schema.ts` and the committed snapshot have drifted, or you're missing changes that belong in `prod-setup.sql`.
3. **Commit** the migration `.sql` file + the updated `migrations/meta/_journal.json` + the new `migrations/meta/NNNN_snapshot.json` together.
4. **Deploy.** Vercel's build script runs `db:migrate:ci` against prod *before* `next build`:
   ```jsonc
   // package.json
   "build": "if [ \"$VERCEL_ENV\" = 'production' ]; then ... && pnpm db:migrate:ci; fi && next build"
   ```
   This guarantees schema is in place before the new app code is live — solving the "atomic deploy" concern without hand-written migrations.

---

## What lives in `supabase/prod-setup.sql`

Anything drizzle *structurally cannot generate* but that fresh environments need on bootstrap:

- **Schema grants** — Supabase only auto-grants `public`; a custom schema needs explicit grants for `anon` / `authenticated` / `service_role` or supabase-js gets "permission denied"
- **Cross-schema FKs to `auth.users`** — drizzle has no model of the `auth` namespace
- **RLS policies** — drizzle's `pgPolicy()` exists, but policies are maintained here for now
- **Auth triggers** (e.g. `handle_new_user`) and **stored procedures**
- **CHECK guards** that need to exist in fresh envs (e.g. text-typed enum-column constraints enforced at the DB level)
- **The generic `updated_at` trigger** — one function auto-attached to every table with an `updated_at` column

**Idiom**: each addition is wrapped in an idempotent `DO $$ ... IF NOT EXISTS ... END $$;` block. See `supabase/prod-setup.sql` § 3 for cross-schema FKs and § 5 for CHECK constraints — both follow this pattern. The file is **safe to re-run** on any environment; the guards no-op when the object already exists.

**Application order for a fresh environment**:
1. `db:migrate` (drizzle migrations create the schema + tables)
2. `psql -f supabase/seed.sql` (optional seed data)
3. `psql -f supabase/prod-setup.sql` (grants, trigger, FKs, RLS, CHECKs, updated_at)

For an existing prod environment: just re-run `prod-setup.sql` after changes. The `IF NOT EXISTS` guards handle the rest.

---

## What lives in `supabase/pending-migrations/`

One-shot SQL that drizzle can't generate **and** doesn't belong in `prod-setup.sql` (because fresh envs don't need it):

- **Data cleanup** — delete orphan rows, NULL out stale references, deduplicate by composite key
- **Data backfills** — populate a new column from a derived expression for existing rows
- **Cutover ops** — reassign rows, transform data shape

These files exist as a **queue for manual application** (Supabase MCP `apply_migration` or the SQL editor). They are **not** "promoted" into `migrations/` — that doesn't work (journal-driven, see above). The correct flow:

1. Write the `.sql` file as `supabase/pending-migrations/NNNN_<name>.sql`. Wrap in `BEGIN/COMMIT`, include a header explaining why it can't be a drizzle migration, and include verification queries at the bottom.
2. Apply to **dev** via Supabase MCP `apply_migration` (during feature development).
3. After merge to main, apply to **prod** via Supabase MCP `apply_migration`. Preview destructive ops first (see next section).
4. **Delete the file.** Git history preserves it as a recipe; the directory should not accumulate.

If a fresh environment needs the *outcome* of one of these (e.g. a CHECK constraint that the cleanup precedes), the persistent part belongs in `prod-setup.sql`. The data-cleanup part stays in `pending-migrations/` and never goes to fresh envs because they have no orphan data.

**Pattern**: when a one-shot file mixes data cleanup with a persistent constraint, split it — apply the cleanup via this queue, then mirror the constraint into `prod-setup.sql` (idempotent) so fresh envs get it. Delete the queued file once applied to all environments.

---

## Preview-before-apply

Always preview destructive migrations before running them. The Supabase MCP gives you a tight feedback loop — run one read-only query that returns **one COUNT row per DELETE/UPDATE the migration will do**:

```sql
-- Run via mcp__supabase__execute_sql (READ ONLY — safe).
-- One row per destructive op, so you see the blast radius at a glance.
SELECT 'op1: feedback to be archived' AS op,
       COUNT(*) AS rows_affected
FROM "vt_saas"."feedback"
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 year'
UNION ALL
SELECT 'op2: orphan user_preferences',
       COUNT(*) FROM "vt_saas"."user_preferences" up
       WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = up.user_id);
-- ... one row per DELETE/UPDATE the migration does
```

A 5-second preview turns a "this is risky" call into a "this is trivial" decision (most ops typically return `0`). Bake these queries into the migration file's header as commented-out queries so the next person doesn't have to re-derive them. After applying, re-run the orphan COUNTs — they should all return `0`.

---

## Dev DB drift

Preview deploys (Vercel PRs) and local dev often share one Supabase project. The dev DB can slowly diverge from prod:

- Branch A applies a schema change via MCP → dev DB has the change.
- Branch A gets abandoned or reverted → dev DB still has the change; prod never got it.
- Later, migrations generated on main are computed from the committed snapshot, which doesn't match dev DB's actual state.
- Bugs that only reproduce in dev OR only in prod become frustratingly common.

**Mitigations** (least to most invasive):

- **Discipline**: don't apply throwaway schema changes to dev DB. If you need to experiment, prefix columns with `_experiment_` or use a local Postgres you can blow away.
- **Periodic resync**: `pg_dump --schema-only` from prod → apply to dev DB.
- **Supabase Pro branches**: per-PR DB clones eliminate drift entirely. Worth the upgrade if drift becomes painful.

---

## Gotchas

**Schema-as-code drift from MCP applications.** If you apply a schema change via MCP without updating the drizzle snapshot, the next `db:generate` will "discover" it and try to re-emit. Options: edit the duplicate out before commit; or update the snapshot to match. A hand-written `ADD COLUMN` applied to dev is the most common cause — see below.

**Avoid hand-written migrations for things drizzle can express.** A standalone hand-written `ADD COLUMN` migration creates exactly this drift problem. Drizzle handles `ADD COLUMN` natively. The "atomic deploy" concern (app code + schema land together) is already solved by Vercel's `db:migrate:ci` running before `next build` — see `package.json`'s `build` script. Only hand-write a migration when drizzle *structurally* can't express the change.

**Drizzle's interactive rename prompts.** When schema changes look like potential renames (drop X + add Y close together), `db:generate` prompts: *"Is `old_col` renamed to `new_col` or a separate add+drop?"* This can't be piped reliably — it needs a TTY. **Always answer "rename"** if you want to preserve data; otherwise drizzle emits DROP + ADD and silently loses it. Plan for human-in-the-loop after big schema reshuffles.

**Idempotent migration patterns.** Standard guards for re-runnable SQL (use these in `prod-setup.sql` and in `pending-migrations/` headers):

```sql
ALTER TABLE foo ADD COLUMN IF NOT EXISTS bar TEXT;
CREATE INDEX IF NOT EXISTS idx_foo_bar ON foo(bar);
ALTER TABLE foo DROP CONSTRAINT IF EXISTS old_check;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'vt_saas' AND constraint_name = 'fk_foo_bar')
  THEN
    ALTER TABLE foo ADD CONSTRAINT fk_foo_bar
      FOREIGN KEY (bar_id) REFERENCES bar(id) ON DELETE CASCADE;
  END IF;
END $$;
```

Drizzle's auto-generated migrations are **not** idempotent. Don't try to make them re-runnable; rely on the journal + `__drizzle_migrations` to track applied state.

**Unexpected DROPs in a generated migration → stop and investigate.** Most common cause: a column was added to dev DB manually but never declared in `Schema.ts` (or was removed from `Schema.ts`). Drizzle's diff thinks it should be dropped. Align `Schema.ts` with intended state, not what's currently in dev. See the destructive-change checklist in [`.claude/rules/database.md`](../.claude/rules/database.md) before any drop/rename.

**`db:migrate` against shared dev** records migrations in dev's `__drizzle_migrations` table that don't match prod's. Generally: let Vercel run `db:migrate:ci` against prod; for dev, apply changes via MCP. If you must run `db:migrate` against dev (e.g. to sync schema after manual MCP changes), make the migration idempotent first.

---

## Quick reference: where does my change go?

| Change | Home | Applied by |
|---|---|---|
| Add/drop column, change type | `src/models/Schema.ts` | `db:migrate:ci` on prod build (Vercel) |
| Add index, intra-schema FK, UNIQUE | Same | Same |
| Rename column / table | `supabase/pending-migrations/NNNN_*.sql` (hand-written, preserves data) + update `Schema.ts` to match end-state | MCP for dev/prod, then delete file |
| Schema grants | `supabase/prod-setup.sql` | Manual re-run of `prod-setup.sql` |
| Cross-schema FK to `auth.users` | Same | Same |
| RLS policy / trigger / function | Same | Same |
| CHECK constraint (guard for fresh envs) | Same | Same |
| Data cleanup, backfill, dedup | `supabase/pending-migrations/NNNN_*.sql` | MCP, then delete file |
| Anything else / unsure | Hand-write under `pending-migrations/` and discuss in PR | — |

For the rules-only condensed version, see [`.claude/rules/database.md`](../.claude/rules/database.md).
