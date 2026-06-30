# PostHog

**Purpose in this codebase**: Product analytics — page views, feature usage, conversion funnels.
**Used for**: alpha/beta usage telemetry, retention tracking, feature flag rollouts (if used).
**Tool**: PostHog REST API via `curl` → dashboard (last resort). No official MCP as of 2026-04-21.
**Dependency group**: A (infra). Parallel with Sentry.
**Last updated**: 2026-04-21

---

## Project-specific conventions

- **Single project across envs** — events tagged with env property, not separate projects.
- **Lazy client-side load** — PostHog JS is initialized after user interaction, not on first paint, to keep landing page TTFB clean.
- **Env var name**: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (current) and `NEXT_PUBLIC_POSTHOG_HOST`. See gotcha below re: historical `NEXT_PUBLIC_POSTHOG_KEY`.

---

## Setup during first prod deploy

### Sub-steps (track each in state file)

1. **Create PostHog project** (or use shared project for this codebase's portfolio).
2. **⚠️ Fetch current env var name via context7** `/posthog/posthog-js` — the canonical name has changed historically; verify before setting.
3. **Copy project token** to Vercel env under the current name (as of 2026-04-21: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`).
4. **Set `NEXT_PUBLIC_POSTHOG_HOST`** to the appropriate region URL (typically `https://us.i.posthog.com` or `https://eu.i.posthog.com`).
5. **Cross-check code vs env**: grep `NEXT_PUBLIC_POSTHOG_` in the repo. Code and env must use the same var name. If code uses a legacy name and docs use a new name, reconcile by updating code (see gotcha).
6. **Verify capture post-deploy**: trigger a page view, check PostHog live events panel within ~30 seconds.

---

## Gotchas

- **2026-04-16 (THE big one)**: PostHog renamed the client-side env var from `NEXT_PUBLIC_POSTHOG_KEY` (legacy) to `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (current) at some point in their Next.js integration docs. Older template code may still reference the legacy name. Fix: context7 `/posthog/posthog-js` for the current canonical name, then bulk-rename across `src/libs/Env.ts`, `.env.example`, analytics client + server + test files. Then set the Vercel env under the NEW name. If code and env diverge, PostHog silently no-ops with no error.
- **Lazy-load matters for TTFB**: importing the PostHog SDK at module scope on the landing page is what keeps landing page SSG in name only. Load PostHog after first interaction or on `requestIdleCallback`.
- **EU vs US region**: pick based on where most users are. Wrong region silently sends to the US default; events appear in a PostHog project you don't own if you're using a placeholder host.

---

## Dashboards & links

- Project: `https://us.posthog.com/project/{id}` or `https://eu.posthog.com/project/{id}`
- Events (live): `https://us.posthog.com/project/{id}/activity`
- Settings (where the token lives): `https://us.posthog.com/project/{id}/settings`

---

## Current-docs fallback

- **Context7 (primary)**: `/posthog/posthog-js` — re-check the current env var name here every deploy, given history of renames.
- WebFetch: https://posthog.com/docs/libraries/next-js
- WebFetch: https://posthog.com/docs/getting-started/install
