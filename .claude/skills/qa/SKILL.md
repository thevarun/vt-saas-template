---
name: qa
description: On-demand manual-QA runner for a vt-saas-template-derived SaaS. Drives flows that unit/E2E tests can't cover — real browser via Playwright MCP, real third-party providers, real env plumbing — across two targets (`--dev` for the local stack, `--prod` for the deployed production URL). Verifies email delivery via Gmail MCP, supports SQL time-travel for date-driven flows, captures key-frame screenshots on prod runs, and reports pass/fail split into verified vs unit-only vs not-tested with cleanup reminders for any test accounts created. Use before releases, after touching auth code, or whenever the user asks to QA something. Triggers on `/qa`, `/qa --dev`, `/qa --prod`, `/qa <runbook>`, `/qa <runbook> --dev`, `/qa <runbook> --prod`, or natural-language requests.
---

# QA Runner

## Purpose

Pre-release QA for flows that unit/E2E tests can't cover: real browser, real email rendering, real third-party providers, real production env plumbing. Describe **what to verify**; let the model figure out the tool calls.

## Resolving the production URL

`--prod` runs target the project's deployed production URL. This is not hardcoded — resolve `<PRODUCTION_URL>` once per run, in this order:

1. The project's public app-URL env var in `.env.local` (e.g. `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`).
2. If absent, ask the user once for the production URL and use it for the run.

`<TARGET>` in a runbook resolves to `http://localhost:<port>` under `--dev` and to `<PRODUCTION_URL>` under `--prod`.

## Invocation model

| Form | App URL | Behavior |
|---|---|---|
| `/qa --dev` (no runbook) | `http://localhost:<port>` | Runs all dev-eligible runbooks against the local stack |
| `/qa --prod` (no runbook) | `<PRODUCTION_URL>` | Runs all prod-eligible runbooks chained on one fresh `+qa-` alias |
| `/qa <runbook> --dev` | as above | Single runbook on dev |
| `/qa <runbook> --prod` | as above | Single runbook on prod |
| `/qa list` | — | Print the menu of runbooks |

Default if neither flag is given: `--dev`. Dev runs are cheaper, safer, and surface integration bugs (email render pipeline, webhooks, etc.) earlier.

Natural language matches against summaries.

### Resolved-environment manifest (always shown before destructive actions)

The `--dev` / `--prod` flag chooses defaults but isn't sufficient — in practice the boundary between local and prod can be split per service (backend on local but background jobs in prod cloud, Resend with prod keys while everything else is local, etc.). Each split has different blast-radius implications.

Before any destructive action, print a manifest derived from `.env.local` and connected MCPs, then ask the user to confirm once for the whole run:

```
Resolved environment for this run:
  App                http://localhost:3000             (dev server, port from the running process)
  Database           Supabase project <project-id>     (dev / prod — derived from DATABASE_URL host)
  Auth               Supabase project <project-id>     (matches DATABASE_URL)
  Background jobs     <local dev server | cloud prod>   (derived from the jobs provider's base-URL env, or default)
  Email (Resend)     <test key | prod key | console>   (derived from RESEND_API_KEY metadata, or "console-only" if unset)
  Email destination  <Gmail account from Gmail MCP>    (the inbox we'll be searching)

Proceed? (y/n)
```

Each backing service gets its own line — the per-service split is the point, so you can spot a "local" run that would actually fire against a prod backing service. Flag inconsistencies inline before the prompt (e.g. "⚠️  --dev was requested but Resend has a prod key — emails would go through prod infra"). Don't re-prompt per runbook.

### Dependency order for `/qa --prod`

Runbooks chain on a single browser session and a single `+alias` account:

1. **`auth-cookies`** — read-only. Needs an existing prod user; uses base `QA_EMAIL`. If that user doesn't exist in prod, skip gracefully and continue.
2. **`auth-magic-signup`** — creates a fresh `+signup-<ts>` alias, signs up, verifies both magic-link + welcome emails. Leaves the session authenticated.
3. **`auth-magic-signin`** — signs out, then signs back in with the same alias to exercise the returning-user magic-link path.
4. **`auth-password-reset`** — runs the forgot-password flow on the same alias.
5. **`auth-admin-access`** — with the signed-in non-admin session, verifies `/admin` redirect gating.

End state: one prod test user to clean up (the alias).

### Dependency order for `/qa --dev`

Auth runbooks tagged `dev: true` chain the same way as on `--prod`. Each destructive runbook provisions and tears down its own test user (via `/api/auth/dev-login` + Supabase MCP cleanup).

## Prerequisites (checked at run start)

Abort with a clear message if any required check fails. The capabilities check from "Cross-cutting practices" runs **first** — these are the additional environment-specific checks that follow.

### Environment variables (both modes)

Read from `.env.local`:

- `QA_EMAIL` — Gmail inbox base address. The `+alias` suffix is generated per run.
- `QA_PASSWORD` — password for the base account (only needed by runbooks that sign in to the base user).

### Prod mode (`--prod`)

- **Playwright MCP** — available for driving the live site.
- **Gmail MCP** — connected to `QA_EMAIL`. Inbox checks go through Gmail MCP; the browser is only used to design-review rendered email bodies.
- **Inbox guard** — call `search_threads` once with a benign query (e.g. `from:gmail`) to confirm the connected account corresponds to `QA_EMAIL`. If the response is empty or the account doesn't match, abort with the actual vs expected.

### Dev mode (`--dev`)

- **Dev server** — running and reachable (`npm run dev`, default port 3000). Read the actual port from the running dev-server process rather than hard-coding it.
- **Supabase MCP** — connected to the dev project (project ID derived from `.env.local`).
- **Gmail MCP** — connected. Same role as in prod mode.
- **Playwright MCP (only if a runbook needs UI)** — many dev-mode steps don't need a browser at all (API-path invocations via `/api/auth/dev-login` + DB inspection cover most checkpoints).

## Running a sequence

1. Capabilities check + baseline check (see "Cross-cutting practices" → pre-flight). Abort on missing capability.
2. Generate the session's alias: `${QA_EMAIL_LOCAL}+qa-${unixTimestamp}@${QA_EMAIL_DOMAIN}`. Log it prominently — the user needs it for cleanup.
3. **Print the resolved-environment manifest** (see "Invocation model") and confirm once with the user. Proceed only on affirmative.
4. For each runbook in dependency order, emit a one-line progress gate: `[N/M] <runbook-name> — running…`, then execute.
5. After each runbook, emit `[N/M] <runbook-name> — ✅ PASS | 🟡 PARTIAL | ❌ FAIL` with a one-line note. Continue to next runbook even on failure (unless the failure precludes chaining).
6. Emit the final report (see below).

## Running a single runbook

Same shape, but skip the sequence loop.

## Safety

- **Destructive prod runs must use `+alias` emails.** Never touch the base `QA_EMAIL` account for signups.
- **Ask once before a destructive prod sequence**, not per-runbook. One alias serves the whole chain.
- **Never echo passwords** in logs, screenshots, or reports.
- **Don't close the browser tabs on success** — the user may want to inspect state. On failure, capture one frame of the failing state and stop.

## Screenshots

Use the template's Playwright MCP convention: capture key-frame screenshots to `_bmad-output/implementation-artifacts/screenshots` (use the `downloadsDir` parameter and `savePng: true`, per `CLAUDE.md` → "Visual Development & Inspection"). On prod runs, capture the key frames the runbook calls out (signup confirmation, rendered email body, post-auth dashboard, any failure state). Don't screenshot every routine checkpoint — capture frames that are worth calling out inline in the report or that serve as design-review artifacts.

## Defensive patterns when driving the browser

Browser automation is lossy — tool/MCP behavior shifts, frameworks intercept events, email providers restructure DOM. Treat these patterns as the default, and only deviate when you have evidence the happy path worked.

**Verify the outcome of any action you can't observe directly.**
After clicking a link that should open a new tab, read tab state immediately — don't navigate elsewhere first and check later. After submitting a form, read the next-state signal (URL change, new text on page) before assuming success. Don't let a silent "no-op" cascade into downstream steps.

**When a click appears to do nothing, don't retry it blindly.**
Frameworks like React sometimes don't see tool-dispatched clicks as a "real" submit. Try the framework's own mechanism (e.g. triggering the form's native submit event directly) before concluding the UI is broken. Similarly, if an element was found but clicking has no effect, check whether it's actually visible and laid-out — some email clients collapse repeated messages in a thread and leave their anchors in the DOM as non-interactive.

**URL inspection from page JS may be blocked for safety.**
You often can't read `href` values containing tokens or cookies directly. Clicking the visible anchor is usually the only path. Rely on the resulting navigation, not on URL extraction.

**Single-use token ⚠️ — don't touch links twice.**
Supabase verification/magic-link URLs are single-use. Any interaction that fetches the URL (a programmatic click, a JS navigation, even some inspection patterns) consumes it. If a runbook step "re-checks" a link after an earlier touch, that second read will look expired even though the flow was fine. If a fresh link lands on an expired/error page, assume the token was already spent somewhere upstream before concluding a product bug.

**Human-click fallback is not a failure mode — it's a valid completion path.**
When MCP-driven clicks of a verification link consistently fail to produce an authenticated session, ask the user to click the link manually once and continue from the resulting signed-in state. That preserves the value of the runbook (you still verify email delivery, rendering, and the final app state) without burning time fighting tooling. Clearly mark findings as `✅ PASS via human click` vs `✅ PASS` so future runs can tell the difference.

**Distinguish product findings from tooling quirks in the report.**
If a behavior is surprising — a page doesn't advance, a link looks expired — consider whether a tooling quirk is the likeliest cause before concluding a product bug. State the hypothesis in the finding and name what would invalidate it ("verify by clicking manually / by opening in a fresh context / by running on preview").

## Cross-cutting practices

These apply to every runbook, regardless of domain. Read them once before authoring or running anything.

### Decoupling — describe outcomes, not implementation

Runbooks describe **user-observable outcomes**, not implementation. Examples of stable contracts you can reference: route paths (`/sign-up`, `/admin`), public API shapes, observable lifecycle states, email sender domain. Examples of brittle implementation details to avoid: button labels, banner copy, CSS selectors, element ordering, internal helper function names. When a checkpoint is naturally about copy, pattern-match loosely (substring or sender + recency), not exact-string. The point is that a UI redesign or copy refresh should not silently break runbooks.

### Pre-flight: capabilities first, baseline second

Pre-flight has two purposes, in this order:

1. **Capabilities check** — every runbook declares its `requires` (e.g. `gmail-mcp`, `supabase-mcp`, `dev-server`, `playwright-mcp`). Before starting, walk that list and confirm each is actually reachable in the current session. **If any required tool/MCP is missing or not connected, stop with a clear message naming the missing capability and how to bring it in** (e.g. "Dev server is not running — run `npm run dev`, then re-invoke `/qa`"). Do not partially run a runbook with missing dependencies — partial runs produce false negatives.
2. **Baseline check** — run `npm run check-types` and `npm run test`, note the pass/fail counts as the baseline. Abort if either is broken in a way the runbook can't possibly cause. This catches "tests were already red" so you don't conflate pre-existing breakage with run findings. Skipping the baseline is OK if explicitly opted out (e.g. `/qa --skip-baseline`); skipping capabilities is never OK.

### Real-send verification for any email-emitting step

When a step triggers an email, verification has three layers and you do all three:

1. **Server logs** — grep dev/prod logs for `Email sent: <type>` (success line in `src/libs/email/emailLogger.ts`) and `Email failed:` (Resend rejection). A render-pipeline regression is visible here from the very first send — log inspection catches it before any inbox check.
2. **Inbox via Gmail MCP** — `search_threads` with sender + recipient + recency. No browser navigation. Example query: `from:<configured-sender-domain> to:<alias> newer_than:5m`.
3. **Body via Gmail MCP** — only if the runbook is design-reviewing the rendered email. `get_thread` with `messageFormat: FULL_CONTENT`. Optionally render in a browser tab for a screenshot if a visual artifact is requested.

Layers 1 + 2 are required for every email-emitting runbook step. Layer 3 only when the email itself is the deliverable being verified.

The configured sender domain comes from the project's Resend / Supabase-Auth sender config (derived from env, e.g. `EMAIL_FROM_ADDRESS`), not a hardcoded address.

### Time-travel for date-driven flows

For flows that depend on dates (countdowns, period-end windows, retention windows), don't wait for real time to pass. Use small targeted SQL `UPDATE` statements that move the user into the lifecycle state you want to verify. Always restore or delete test rows in teardown. (A shared `_fixtures.md` reference doc with canonical time-travel templates ships alongside date-driven runbooks when those land.)

### Skeptical "what did we actually verify" audit

Every report must explicitly distinguish, per checkpoint:

* `verified` — exercised end-to-end against real systems
* `unit-only` — the code path is covered by tests but real delivery / rendering / integration was not exercised in this session
* `not tested` — out of scope or skipped

This forces honesty. A run that looks like 12/12 PASS can split out to 8 verified, 3 unit-only, 1 not tested — and a critical bug can hide in the unit-only column.

### Routine server-log inspection between steps

Don't only check logs when something looks wrong. Between scenarios that emit webhooks, queue jobs, or send emails, do a quick grep for `error|exception|fail|warn` in the dev-server output (or production log stream) and surface anything new. Silent failures (fire-and-forget sends, swallowed exceptions) are the most common bugs that pass UI-only checks.

## Report format

```
## QA run — <single runbook OR "full <sequence-name> sequence"> — <YYYY-MM-DD HH:MM>

Mode: dev | prod
Resolved env (manifest): see header above
Test user: <alias>  (or "<dev test alias>")
Screenshots: _bmad-output/implementation-artifacts/screenshots  (key frames)

Per-runbook results:
[1/N] runbook-name          ✅ PASS  (5 verified, 0 unit-only, 0 not tested)
[2/N] runbook-name          🟡 PARTIAL — <one-line note>  (3 verified, 1 unit-only, 1 not tested)
…

Verification breakdown:
  ✅ verified    — exercised end-to-end against real systems
  🟡 unit-only   — code path covered by tests, but real delivery / integration not exercised
  ⚪ not tested — out of scope or skipped this run

Findings:
- F1: [title] — [1-2 sentence description, file refs if applicable]
- F2: [title] — [...]
```

The verification breakdown is mandatory. If everything came back PASS but every checkpoint was unit-only, that's a yellow run, not a green one.

For destructive prod runs, append:

```
🧹 Cleanup required (prod):
  Test user: <alias>
  Delete via: <PRODUCTION_URL>/<locale>/admin/users
  Requires admin auth; self-delete is blocked.
```

For destructive dev runs, append:

```
🧹 Cleanup required (dev):
  Test user: <uuid>  (<alias>)
  Delete via Supabase MCP: DELETE FROM auth.users WHERE id = '<uuid>';
  Cascades clean up any rows the user owns.
```

## Adding a runbook

Drop `runbooks/<domain>-<flow>.md` with frontmatter:

* `name` — the slug used in `/qa <name>`.
* `domain` — `auth`, etc.
* `destructive` — `true` if the run creates or mutates real user state.
* `prod` — `true` if safe to run on `<PRODUCTION_URL>`.
* `dev` — `true` if supported under `--dev` against the local stack.
* `requires` — array of capabilities. Allowed values: `playwright-mcp`, `gmail-mcp`, `supabase-mcp`, `dev-server`, `qa-email`, `qa-password`. The capabilities check at pre-flight reads this list.
* `summary` — one-line description for `/qa list`.

Prose body covers **goal, preconditions, checkpoints (outcome-keyed, not implementation-keyed), known failure modes, teardown / cleanup pointer**. Avoid step-by-step tool recipes — let the model figure out the calls. `/qa list` picks the runbook up automatically.

Reference docs (no frontmatter; filename starts with `_`) are not runbooks — they're shared snippets that runbooks can reference.
