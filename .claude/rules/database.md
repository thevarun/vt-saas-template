---
paths:
  - "src/models/Schema.ts"
  - "src/models/schema/**"
  - "migrations/**"
---

# Database rules

The must-not-break rules for schema changes and migrations. Self-contained — no external doc required.

- **Never `db:push`.** It diffs the live DB against `Schema.ts`, sees RLS / triggers / cross-schema FKs as drift, and emits `DROP POLICY` / `DROP TRIGGER` / `DROP CONSTRAINT`. There is no `db:push` npm script; don't add one, and don't invoke the raw `drizzle-kit push`.
- **`db:migrate` is journal-driven, not file-driven.** It applies only the `.sql` files listed in `migrations/meta/_journal.json`. A hand-written `migrations/0099_foo.sql` not in the journal is silently skipped — don't `git mv` files in and expect them to run.
- **Commit migrations on the feature branch, alongside the `Schema.ts` change.** The migration rides with its schema edit in one PR, so code + DB land in the same merge → the prod build's `db:migrate:ci` applies it before the new code deploys (closes the code-before-DB window where prod queries a column that doesn't exist yet). _(This used to be blocked by a `.husky/pre-commit` guard that forced migrations onto `main`; the guard was removed once `main` became PR-only — a direct push to `main` is rejected, so "generate on `main`" was unworkable.)_
- **Generate the migration on the feature branch, after rebasing onto latest `main`** (`db:generate`). It diffs `Schema.ts` against `migrations/meta/*_snapshot.json` (no live DB), so it works on any branch. Inspect the SQL (`DROP POLICY` / `DROP CONSTRAINT fk_*_auth_users` = drift → abort), then commit `.sql` + `_journal.json` + `NNNN_snapshot.json` **together with the `Schema.ts` change**. Two schema PRs in flight at once collide on `_journal.json` / the `NNNN` index — rebase the later one onto `main` and regenerate.
- **Build-time `db:migrate` is opt-in (`RUN_PROD_MIGRATIONS=true`) and off by default.** Production applies migrations at build time via `db:migrate:ci` — but **only** when `RUN_PROD_MIGRATIONS=true` is set in the deploy environment. Off by default so a deploy never runs `drizzle-kit migrate` against an unintended database. `/init-downstream` turns it on for a real downstream (which has its own dedicated DB). Two consequences:
  - **Never enable build-time migrate against a _shared_ database.** `drizzle-kit migrate`'s ledger lives in the **shared** `drizzle.__drizzle_migrations` table — if several in-development projects point at one Postgres (e.g. a shared "dev-mode" Supabase), a build-time migrate from one corrupts the migration history for all of them, and a regenerated/renumbered journal makes `migrate` try to re-`CREATE TABLE` objects that already exist → the build fails. The template's _own_ demo deploy is exactly this case (it shares the dev DB), so it leaves `RUN_PROD_MIGRATIONS` unset and schema changes for the demo are applied **manually to its schema only** (never touching other schemas' tables). A downstream with a dedicated DB sets `RUN_PROD_MIGRATIONS=true` and lets the build migrate normally.
  - **Existing downstreams must set `RUN_PROD_MIGRATIONS=true`** when they sync this change, or their production build will (loudly) skip migrations.
- **Enable RLS on EVERY table — deny by default.** The schema is exposed over the Supabase REST API (`supabase/config.toml`) and `supabase/prod-setup.sql` grants `anon` SELECT + `authenticated` full CRUD on all tables. RLS is the only barrier: a table with RLS **ON and no policy** denies all non-service-role access (fails closed); a granted, REST-exposed table with RLS **OFF** leaks every user's rows to anyone holding the public anon key. When you add a table, add its `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (plus owner policies for client-readable tables) to `prod-setup.sql` in the same change. Service-role/server code (Drizzle over `DATABASE_URL`, admin clients) bypasses RLS, so server-only tables can have RLS on with no policy.

## Destructive-change checklist (DROP / RENAME column or table)

`db:generate` is **app-blind** — it diffs `Schema.ts` → DB and will happily emit `DROP COLUMN` for a column the app still queries. `check-types` won't save you either: tables are read via the **Supabase-JS client** (snake_case `.select('…')` strings, the generated `src/libs/supabase/types.ts`, and per-query local row types) — none of which is bound to the Drizzle schema you edited. A drop that compiles can still 400 every query at runtime. Before any drop/rename:

- **Grep BOTH naming conventions.** The same column appears as camelCase (Drizzle: `displayName`) _and_ snake_case (Supabase-JS / `types.ts` / `.select()` strings: `display_name`). Search `*.ts`/`*.tsx` for the **snake_case** name too — that's where the misses hide. A camelCase-only grep returning "0 usages" is a false negative.
- **Grep writers, not just readers** (`column:` literals, `.set({ … })`, `.insert({ … })`). `@deprecated` comments lie — verify nothing still writes it.
- **Route drops through a deploy, not a hand-applied prod change.** Additive/idempotent guards (CHECKs, triggers, new nullable columns) are safe to apply ahead of the app. **Destructive** DDL must flow `Schema.ts → committed migration → preview deploy → smoke-check the affected screen → prod via `db:migrate:ci`` so a 400 surfaces in preview, not prod. Never hand-drop a prod column ahead of the matching app deploy.
- **When you DO edit `Schema.ts`, update the parallel type sources in the same change** — regenerate `src/libs/supabase/types.ts` and fix any per-query local row types — or the drift is invisible until runtime.

## Client roles: one query client, Drizzle for DDL only

The app has two DB libraries; they are **not** two interchangeable query clients. Use each for its role:

- **Supabase-JS** (`supabase.from(...)`, `supabase.auth.*`, `supabase.storage.*`) → **the query client for runtime data**, plus auth + storage (which only it can do). Query code lives in `src/libs/queries/`. **New query code uses supabase-js.**
- **Drizzle** (`Schema.ts`, `db:generate`, `db:migrate`) → **schema-as-code + migrations only**. Its value is version-controlled, diff-based DDL — not querying. Don't reach for `db.select()` in new query code; prefer supabase-js for consistency.

Because of this split, **`src/libs/supabase/types.ts` is the runtime query type source and must be generated, not hand-written**: `npm run db:gen-types` (`supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema "$DB_SCHEMA"`) after every applied migration. The generated `Database` type feeds the `TableRow` / `TableInsert` / `TableUpdate` helpers in `src/libs/supabase/db-types.ts`, which type Supabase-JS write payloads against the live schema — that's the safety net that turns a dropped/renamed column into a `tsc` error instead of a prod 400. Regenerate after every migration so it stays in sync.
