# Known deployment pitfalls

Experience log from production deploys of vt-saas-template forks. Each entry is a thing that actually bit a real deploy — not a hypothetical. Local truth, not a mirror of provider docs.

**Freshness rule**: entries older than 6 months need re-validation via context7 before being relied on. If you find an entry stale or resolved upstream, update the `last-verified` date or remove it.

---

## Supabase

### Non-`public` schema not exposed in Data API
- **First seen**: a fork's first deploy
- **Symptom**: Client-side queries return "schema does not exist" or 404. Server-side Drizzle queries work (they use direct connection), so the bug hides until client hits the PostgREST API.
- **Fix**: Supabase Dashboard → Project Settings → Data API → Exposed Schemas → add the schema name (`DB_SCHEMA`, any non-public schema).
- **Also**: confirm internal schemas (e.g., `drizzle`) are **not** exposed.

### Custom SMTP: Resend DNS verified ≠ Supabase Auth sending from branded address
- **First seen**: a fork's first deploy
- **Symptom**: Magic-link signup emails arrive from `noreply@mail.app.supabase.io` instead of the project's branded sender, even though Resend shows the domain as verified.
- **Cause**: Supabase Auth SMTP must be explicitly toggled and configured in the dashboard; Resend DNS verification is independent of the Supabase wire-up.
- **Fix**: Supabase Dashboard → Project Settings → Auth → SMTP Settings. Enable custom SMTP. Host `smtp.resend.com`, port 465, user `resend`, password = Resend API key, sender = branded address.
- **Verify**: trigger a test signup and inspect the received email's `From` field. Don't trust "DNS verified" status alone.

### Migration order dependency
- **First seen**: a fork's first deploy
- **Symptom**: `prod-setup.sql` fails with "row does not exist" or trigger creation errors.
- **Cause**: Triggers in `prod-setup.sql` reference rows that `seed.sql` inserts.
- **Fix**: Run in this exact order: `db:migrate` → `seed.sql` → `prod-setup.sql`. Never skip or reorder.

---

## Vercel

### Deployment Protection silently blocks Inngest sync
- **First seen**: a fork's first deploy
- **Symptom**: Inngest functions don't appear after a successful Vercel deploy. Inngest dashboard shows no sync errors; it simply never saw the functions.
- **Cause**: Inngest's sync process hits `/api/inngest` from an external origin. If Vercel Deployment Protection is on (default for new projects), it blocks the request.
- **Fix**: Generate a Deployment Protection bypass key in Vercel project settings → Deployment Protection → Protection Bypass for Automation. Configure this key in the Inngest integration.

### TypeScript 6 `baseUrl` deprecation breaks Vercel build while local passes
- **First seen**: a fork's first deploy
- **Symptom**: `vercel build` fails with TS6504 "baseUrl is deprecated". Local `pnpm build` passes fine.
- **Cause**: Vercel's build uses a newer TS version than the locally pinned one; the deprecation is now a hard error.
- **Fix**: In `tsconfig.json`, add `"ignoreDeprecations": "6.0"`. Also pin the TS version in `package.json` to reduce future drift.
- **Upstream**: Track TS version in `package.json` alongside Vercel's current default (check context7 `/reference/nextjs/typescript`).

### Module resolution failures on first Vercel build
- **First seen**: a fork's first deploy
- **Symptom**: First Vercel build fails with "Cannot find module @/libs/..." or similar.
- **Fix**: Confirm `tsconfig.json` paths and `next.config.*` are committed. Run `pnpm build` locally first — treat a green local build as the gate before creating the Vercel project.

---

## PostHog

### Env var name drift (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` vs `NEXT_PUBLIC_POSTHOG_KEY`)
- **First seen**: a fork's first deploy
- **Symptom**: PostHog receives no events despite code running in prod. Client-side init silently no-ops when the expected env var is missing.
- **Cause**: PostHog renamed the env var in their current Next.js setup docs. Older template code uses the legacy name.
- **Fix**: Run context7 fetch against PostHog's current Next.js integration guide during Phase 1. If rename detected, bulk-update `src/libs/Env.ts`, `.env.example`, analytics client/server files, and test files to the new name. Then set env var in Vercel under the new name.

---

## GitHub

### Branch protection needs Pro plan for private repos
- **First seen**: a fork's first deploy
- **Symptom**: Branch protection rules can be configured but not enforced on private repos on Free plan.
- **Fix**: Either upgrade to Pro, make the repo public (if suitable), or rely on pre-commit hooks + CI as the primary safety net. Still configure the rule; when you upgrade, enforcement is automatic.

---

## Dependabot

### Linting group major bumps are silent landmines
- **First seen**: a fork's first deploy
- **Symptom**: Dependabot PR #N (linting group) merged during deployment prep. Nothing seemed to break. Weeks later, a routine commit triggers lint-staged failures rooted in `@eslint-react/eslint-plugin` v2→v4 incompatibility with `@antfu/eslint-config` v7.
- **Fix**: Major bumps in the linting group require manual testing. Either defer them, or set up a dedicated CI job that runs `lint-staged` against a representative committed file.
- **Preventative**: Dependabot config should split `eslint`-family plugins into their own group with `update-types: ["minor", "patch"]` only.

---

## Sentry

### Auth token location is buried
- **First seen**: a fork's first deploy
- **Symptom**: User searches Project Settings for an auth token, finds nothing actionable.
- **Cause**: Sentry auth tokens live at **Organization Settings → Developer Settings → Custom Integrations / Organization Tokens**, not under the project.
- **Fix**: Go to the org-level settings. Create an org token scoped to `project:releases` (narrowest for Vercel source map uploads).

---

## Deployment ceremony

### Pre-commit hook blocks migration files on feature branches
- **First seen**: a fork's first deploy
- **Symptom**: Committing a migration file on a feature branch fails with a hook error.
- **Cause**: This project generates migration files on main only, so the hook blocks committing them on feature branches (this is intentional).
- **Fix**: Do schema work on a feature branch and apply it to dev via Supabase MCP `apply_migration` (never `db:push` — it's banned and the script is removed). Merge to main. On main, run `db:generate` to produce the canonical migration, then commit. Prod runs `db:migrate:ci` via the Vercel build.

### Vercel spend cap not set by default
- **First seen**: a fork's first deploy (no real damage, but flagged)
- **Fix**: Immediately after Vercel project creation, set on-demand spend cap. $200/mo is a reasonable alpha default.

---

## How to add a new pitfall

When a deploy surfaces something avoidable-in-hindsight, append it here with:
- **First seen**: {YYYY-MM-DD} + (source project name)
- **Symptom**: what the user observes
- **Cause**: root explanation
- **Fix**: exact steps or commands
- **Last verified**: update when re-confirmed

If the pitfall is template-generic (most are), also raise a GitHub issue on `thevarun/vt-saas-template` via Phase 8 backport so future forks inherit the fix.
