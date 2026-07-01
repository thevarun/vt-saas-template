# Legacy Columns — Deprecation Plan

Status: **template (no active deprecations)**

This document tracks columns marked `@deprecated` in `src/models/Schema.ts` and the
plan for removing each one safely. It is the per-column ledger the
destructive-change checklist in [`.claude/rules/database.md`](../.claude/rules/database.md)
refers to. The discipline below — deploy-then-drop, grep both naming conventions —
is what keeps a column removal from compiling clean and then 400-ing every query in
prod.

When you have a column to deprecate, copy the **skeleton** below, fill in the
brackets, and remove this "no active deprecations" status line.

---

## `<table>.<old_column>` → `<new_column>`

> Copy-paste skeleton. Replace every `<…>` placeholder.

### Background

Why the column is going away: what replaced it (`<new_column>`, or a normalized
table, or a computed value), and when the successor landed. Note whether the
publish/write path **dual-wrote** old + new during the transition.

### Current state

- **Writers:** `<file>` — does it still populate `<old_column>`? (List every
  `.insert({ … })` / `.set({ … })` / `column:` literal that writes it.)
- **Readers (confirmed migrated):** the call sites already reading `<new_column>`.
- **Readers (unconfirmed):** anything that selects `*` and may still consume
  `<old_column>` — admin views, exports, external dashboards.

### Deprecation contract during the window

- **New code:** consume `<new_column>` directly. NEVER read `<old_column>` in a
  new code path.
- **Existing code:** OK to keep reading `<old_column>`; do NOT add new references.
- **Writers:** the write path may keep dual-writing during the window (cost is a
  tiny extra `UPDATE` payload). The dual-write is removed in the same PR that
  drops the column.

### Drop plan

1. **Now:** mark `@deprecated` on the field in `src/models/Schema.ts` with a
   comment linking here. Done when you add the section above.
2. **Reader audit:** grep the codebase for **both** naming conventions — the
   Drizzle camelCase (`<oldColumn>`) **and** the Supabase-JS / `types.ts` /
   `.select()` snake_case (`<old_column>`). The snake_case grep is where the
   misses hide; a camelCase-only "0 usages" is a false negative. Audit external
   consumers (exports, BI dashboards) too. Migrate every remaining reader to
   `<new_column>`.
3. **Wait N weeks** (suggested: 4 weeks after the audit) to catch ad-hoc
   consumers (e.g. someone exporting a CSV monthly).
4. **Drop the column** via a dedicated migration:

   ```sql
   ALTER TABLE "vt_saas"."<table>"
     DROP COLUMN <old_column>;
   ```

   In the same PR, remove:
   - The `@deprecated` field from `src/models/Schema.ts`
   - The dual-write logic in `<writer file>`
   - Any backfill / migration code that referenced the column
   - Regenerate `src/libs/supabase/types.ts` (`db:gen-types`) so the runtime
     query types drop the column too

5. Run `pnpm db:generate` on `main` to materialize the drop migration, then
   ship it through a **preview deploy first** (smoke-check the affected screen)
   before prod applies it via `db:migrate:ci`. Route destructive DDL through a
   deploy — never hand-drop a prod column ahead of the matching app deploy (see
   the destructive-change checklist in [`.claude/rules/database.md`](../.claude/rules/database.md)).

### Roll-back

If a regression surfaces after the drop, re-add the column and backfill from its
successor:

```sql
ALTER TABLE "vt_saas"."<table>"
  ADD COLUMN <old_column> text;

-- Backfill from the successor column(s):
UPDATE "vt_saas"."<table>"
SET <old_column> = <new_column>
WHERE <new_column> IS NOT NULL;
```

Note any **lossiness**: if `<old_column>` collapsed multiple successor columns
(e.g. a per-variant split), the backfill must pick a winner — document the
default (and that it's lossy) here.

---

## Adding new entries to this file

When marking a column `@deprecated` in the schema:

1. Add a section here following the skeleton above.
2. Document: background, current state (writers + readers, both naming
   conventions), what new code should do, the drop plan with concrete steps, and
   a rollback path.
3. Link the deprecation comment in `src/models/Schema.ts` back to this file.
