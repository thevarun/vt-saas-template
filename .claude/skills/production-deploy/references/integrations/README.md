# Integration references

One file per integration. Each captures **project-specific conventions, dashboard paths, and gotchas** — deliberately NOT a mirror of the provider's public docs (those are fetched fresh via context7 at deploy time).

## Structure of an integration file

```markdown
# {Provider Name}

**Purpose in this codebase**: {one line — what the integration does for the app}
**Used for**: {which flows / features consume it}
**Tool**: {MCP / CLI / API that automates it; "dashboard only" if none}

## Project-specific conventions

- env var names we use: {list — cross-reference Env.ts}
- how we configure it: {unique choices — e.g., "subdomain for Resend sending to isolate reputation"}
- any dual-use patterns: {e.g., an OAuth provider used for both sign-in AND platform-connect — needs two callback URLs}

## Setup during first prod deploy

Numbered steps specific to this provider + this project shape. Not generic docs — the version that matches our conventions.

## Gotchas (dated)

- **{YYYY-MM-DD}**: {specific issue + fix}

## Dashboards & links

- Admin console: {url}
- Typical pages: {specific dashboard deep-links that matter}

## Current-docs fallback

If this file is stale, run `context7` with library id `{provider/docs}` to fetch current setup. Reconcile against this file and update.
```

## When to create vs update

- **Create a new file** when an integration is added to the project that isn't listed here. The production-deploy skill's Phase 5 prompts you at phase close if a new integration was handled.
- **Update an existing file** when something material changes (dashboard path moves, conventions shift, a new gotcha surfaces). Always add a `last-updated` note in the file's top matter if material changes happen.

## Current inventory

- `supabase.md` — PostgreSQL + Auth + Storage; all tables in non-public schema (group A)
- `vercel.md` — Hosting + functions + CDN + per-env env vars; Deployment Protection gotcha (group A)
- `resend.md` — Transactional email via subdomain; explicit Supabase SMTP wire-up warning (group A)
- `sentry.md` — Error tracking + source maps; auth token is org-level not project-level (group A)
- `posthog.md` — Product analytics; env var name has drifted historically — always context7 check (group A)
- _(more integrations get seeded as each new deploy encounters them — OAuth providers, Stripe, Inngest, n8n, Langfuse, etc.)_
