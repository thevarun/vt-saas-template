# Sentry

**Purpose in this codebase**: Error tracking (client + server + edge) + performance tracing + source-map uploads for readable stack traces.
**Used for**: production error capture, edge-case debugging, alpha/beta incident response.
**Tool**: Sentry REST API via `curl` → dashboard (last resort). No official MCP as of 2026-04-21.
**Dependency group**: A (infra). Can run in parallel with PostHog / Langfuse.
**Last updated**: 2026-04-21

---

## Project-specific conventions

- **Env-aware sample rates**:
  - `tracesSampleRate`: 0.1 in production, 1.0 in development.
  - `replaysOnErrorSampleRate`: 0 in alpha/beta production, higher after traffic justifies it.
  - `replaysSessionSampleRate`: always 0 (no blanket session replay).
- **Auth token scope**: narrowest possible — `project:releases` only, for source-map uploads from Vercel builds.
- **Alert rule**: auto-created "high-priority issue" notification on project creation; keep.
- **DSN in env**: `NEXT_PUBLIC_SENTRY_DSN` (client-side safe).

---

## Setup during first prod deploy

### Sub-steps (track each in state file)

1. **Create Sentry project** for this app. Platform: Next.js. Team: per account convention.
2. **Copy DSN + org slug + project slug** to Vercel env:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
3. **Create auth token** — this is the step that confuses people:
   - Navigate to **Organization Settings → Developer Settings → Custom Integrations / Organization Tokens** (NOT under project settings).
   - Create a new org-level auth token with scope `project:releases`.
   - Add to Vercel env as `SENTRY_AUTH_TOKEN` (production + preview + dev — all envs use it for source-map uploads).
4. **Verify env-aware sample rates in code** (grep `Sentry.init` in `src/libs/` or `sentry.*.config.ts` — should be env-gated, not hardcoded).
5. **Confirm alert rule exists** (auto-created but verify).
6. **Trigger a test event** post-deploy (via Phase 6 smoke test) to confirm capture.

---

## Gotchas

- **2026-04-16**: Auth token location is buried. Users search Project Settings, find nothing useful. The token is at **Organization Settings → Developer Settings → Custom Integrations / Organization Tokens**. Org-level, not project-level.
- **Replays are expensive**: `replaysSessionSampleRate > 0` on a busy app can eat the Sentry quota fast. Keep off during alpha.
- **Vercel integration vs manual**: the Vercel+Sentry Marketplace integration auto-sets some env vars but not `SENTRY_AUTH_TOKEN`. Either way, set the token manually.
- **Source maps only upload on build**: if you deploy without the auth token set, stack traces in Sentry will be minified forever for that release. Set the token BEFORE the first prod deploy.

---

## Dashboards & links

- Project: `https://{org}.sentry.io/projects/{project}/`
- Issues: `https://{org}.sentry.io/issues/`
- Alerts: `https://{org}.sentry.io/alerts/rules/`
- Auth tokens: `https://{org}.sentry.io/settings/auth-tokens/`  (org-level)
- Project settings: `https://{org}.sentry.io/settings/projects/{project}/`

---

## Current-docs fallback

- Context7: `/getsentry/sentry-javascript` — for SDK init patterns, env-aware config.
- WebFetch: https://docs.sentry.io/platforms/javascript/guides/nextjs/ — for current Next.js integration.
- WebFetch: https://docs.sentry.io/cli/configuration/#auth-token — for token scope documentation.
