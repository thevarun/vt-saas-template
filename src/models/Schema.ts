// Back-compat barrel: table/enum definitions now live in `./schema/*`.
//
// To modify the database schema:
// 1. Edit the relevant file under `src/models/schema/` (or add a new one).
// 2. Generate a new migration by running: `npm run db:generate`.
//
// This file is kept so the `@/models/Schema` import path keeps resolving
// unchanged. The `.claude/rules/database.md` glob now also lists
// `src/models/schema/**`, so editing any split module (e.g. `schema/feedback.ts`)
// still triggers the database safety rules.
//
// NOTE: imports the explicit `./schema/index`, not the bare `./schema`
// directory — on case-insensitive filesystems (macOS) `./schema` would
// resolve back to this `Schema.ts` file (a self-import that exports nothing).

export * from './schema/index';
