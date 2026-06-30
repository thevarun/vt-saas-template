# supabase/

This directory holds Supabase-specific assets — bootstrap SQL, seed data, and the queue for ad-hoc migrations applied via Supabase MCP / SQL editor.

## Files

| Path | Purpose |
|---|---|
| `config.toml` | Supabase CLI config (exposes the project schema over REST, sets auth redirect URLs). Rarely edited. |
| `seed.sql` | Optional dev/lookup seed data. Run after `db:migrate` on fresh envs (or via `supabase db reset`). Empty by default. |
| `prod-setup.sql` | Idempotent bootstrap: schema grants, the `handle_new_user` auth trigger, cross-schema FKs to `auth.users`, RLS policies, CHECK guards, the generic `updated_at` trigger. Re-runnable; uses `IF NOT EXISTS` / `DROP ... IF EXISTS` guards. |
| `pending-migrations/` | Hand-written SQL queued for **manual application** (Supabase MCP `apply_migration` or the SQL editor). Not auto-applied by `db:migrate` (drizzle's runner is journal-driven). Delete files after applying. |

## Where does my schema change go?

| Change | Home |
|---|---|
| Column / index / intra-schema FK / UNIQUE / drizzle-expressible CHECK | `src/models/Schema.ts` — drizzle generates the migration on `main` |
| Cross-schema FK, RLS, trigger, function, CHECK guard for fresh envs | `prod-setup.sql` — wrap in idempotent `DO $$ IF NOT EXISTS ... END $$;` |
| One-shot data cleanup, backfill, dedup | `pending-migrations/NNNN_*.sql` — apply manually, then delete |

See [`docs/database-workflow.md`](../docs/database-workflow.md) for command semantics, gotchas, and the full rationale. For the must-not-break rules an AI agent loads automatically when touching `src/models/Schema.ts` or `migrations/`, see [`.claude/rules/database.md`](../.claude/rules/database.md).
