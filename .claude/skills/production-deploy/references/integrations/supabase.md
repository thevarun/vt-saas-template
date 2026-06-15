# Supabase

**Purpose in this codebase**: PostgreSQL + Auth + RLS for the entire app.
**Used for**: user auth (magic link + OAuth), app data, admin analytics, and any product-specific tables a fork adds.
**Tool**: Supabase MCP (preferred) → `psql` via pooled URL (fallback) → Dashboard + SQL Editor (last resort).
**Last updated**: 2026-04-21

---

## Project-specific conventions

- **Schema**: This project uses `DB_SCHEMA={schema-name}` (not `public`). Set via env var. See `CLAUDE.md` for the actual schema name.
- **Drizzle + Supabase co-exist**: Drizzle for server-side table queries (admin, SSG). Supabase JS client for auth + RLS-scoped client queries. Supabase Admin client for `auth.admin.*` only.
- **Tokens (forward-looking)**: the template ships no third-party OAuth integration yet, but per `.claude/rules/platforms.md`, any fork that stores external-platform access/refresh tokens must encrypt them at rest with `TOKEN_ENCRYPTION_KEY` before insert into its credentials table. Key differs per env.
- **Migration strategy**: never `db:push` — apply dev schema via Supabase MCP `apply_migration`; migrations are generated on `main` (`db:generate`); no migration files on feature branches. See `.claude/rules/database.md` for details (push emits `DROP POLICY`/`DROP TRIGGER`/`DROP CONSTRAINT` against RLS/triggers/cross-schema FKs).
- **Auth auto-migration disabled in prod**: `src/libs/DB.ts` skips `migratePg()` when `NODE_ENV=production`. Migrations only run via CI/CD.

---

## Setup during first prod deploy

1. **Create prod project**. Via Supabase MCP or dashboard. Name: `{project}-prod`. Free tier OK for alpha.
2. **Copy credentials**. Project URL, anon key, service role key, pooled DB connection string. These go to Vercel env (never chat).
3. **Expose the schema** in Data API. Dashboard → Project Settings → Data API → Exposed Schemas. Add your `DB_SCHEMA`. Confirm `drizzle` and other internal schemas are NOT exposed.
4. **Run migrations** against prod DB:
   ```bash
   DATABASE_URL="<prod-pooler>" DB_SCHEMA="<schema>" npx drizzle-kit migrate
   ```
5. **Seed** — `supabase/seed.sql` via SQL Editor. Preview SQL → confirm → execute.
6. **Prod-setup** — `supabase/prod-setup.sql` via SQL Editor. Handles triggers, cross-schema FKs, RLS policies, GRANTs. **Depends on seed data**. Preview → fresh-eyes review → confirm → execute.
7. **Auth config**:
   - Site URL: `https://{PRODUCTION_DOMAIN}`
   - Redirect URLs: `https://{PRODUCTION_DOMAIN}/**`
   - Providers (OAuth): configure each provider the app uses
   - **Custom SMTP**: defer to the Resend phase. When ready, Project Settings → Auth → SMTP Settings. Don't trust "DNS verified" — verify a test signup email's `From` field shows the branded sender.

---

## Gotchas

- **2026-04-15**: Exposing `DB_SCHEMA` in the Data API is easy to miss — it's under Data API settings, not under Database. Client queries silently fail if this is skipped.
- **2026-04-16**: Custom SMTP toggle is a separate step from Resend DNS verification. Neither verifies the other. Must test by signup.
- **2026-04-15**: `prod-setup.sql` depends on seed data (triggers reference tier IDs). Migration order `migrate → seed → prod-setup` is mandatory.
- **2026-04-14**: `psql` is not installed on macOS by default. Prefer the Supabase SQL Editor or Supabase MCP.

---

## Dashboards & links

- Project: https://app.supabase.com/project/{project-ref}
- Data API schema exposure: https://app.supabase.com/project/{project-ref}/settings/api
- Auth URLs: https://app.supabase.com/project/{project-ref}/auth/url-configuration
- Auth providers: https://app.supabase.com/project/{project-ref}/auth/providers
- SMTP: https://app.supabase.com/project/{project-ref}/settings/auth (scroll to SMTP)
- SQL Editor: https://app.supabase.com/project/{project-ref}/sql/new
- Logs: https://app.supabase.com/project/{project-ref}/logs/explorer

---

## Current-docs fallback

If this file is stale, run context7 with library id `/supabase/supabase-js` and `/supabase/docs` for the latest setup flows and env var names. Cross-check: Supabase docs occasionally move dashboard paths and rename settings without changelog entries.
