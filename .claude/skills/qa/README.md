# qa skill — on-demand manual QA runner

Runs the QA flows that unit/E2E tests can't cover — real browser via Playwright MCP, real third-party providers, real env plumbing — across two targets:

* **`/qa --dev`** — local stack: dev server + dev Supabase + Gmail MCP. Cheap, fast, catches the integration bugs that escape unit tests.
* **`/qa --prod`** — the deployed production URL: a full chained auth sequence on a fresh `+alias` test user. One alias to clean up at the end.

Default if you don't specify a flag: `--dev`.

The production URL is not hardcoded. The skill resolves `<PRODUCTION_URL>` from the project's public app-URL env var (`NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`) in `.env.local`, or asks you once if it can't find one.

## One-time setup

### 1. Environment variables

Add to `.env.local` (git-ignored):

```
QA_EMAIL=<your-gmail>@gmail.com
QA_PASSWORD=<only needed if you want auth-cookies to sign in to the base user>
```

Destructive runbooks generate per-run aliases like `<your-gmail>+qa-<timestamp>@gmail.com` automatically — the base `QA_EMAIL` is only used for non-destructive sign-in flows (and only if that base user exists in the target Supabase project).

### 2. Gmail MCP

Connect the Gmail MCP and sign it into `QA_EMAIL`. The skill uses `search_threads` / `get_thread` for inbox checks — no browser navigation to mail.google.com. Confirm by asking the skill to run a benign `search_threads` call once; if the connected account isn't `QA_EMAIL`, reconnect.

### 3. Playwright MCP

Driving the sign-up/sign-in forms and clicking magic-links uses the template's Playwright MCP convention (see `CLAUDE.md` → "Visual Development & Inspection"). Screenshots land in `_bmad-output/implementation-artifacts/screenshots` via the `downloadsDir` parameter with `savePng: true`.

### 4. (Dev only) Local services

Boot whatever the runbook needs. The skill's pre-flight will tell you precisely what's missing if any of these aren't ready:

* **Dev server** — `pnpm dev`. The skill reads the actual port from the running process (default 3000).
* **Supabase MCP** — connected to your dev project.

### 5. (Optional) Supabase base user for `auth-cookies`

If you want `auth-cookies` (the read-only smoke that inspects `sb-*` cookie flags) to run on prod, create `QA_EMAIL` as a confirmed Supabase user in the prod project once. Otherwise the skill skips it and continues.

## How to invoke

- `/qa` or `/qa --dev` — run all dev-eligible runbooks against the local stack.
- `/qa --prod` — run the full chained auth sequence on prod. One alias, one report.
- `/qa <runbook>` — run a single runbook (uses the default mode).
- `/qa <runbook> --dev` / `/qa <runbook> --prod` — single runbook against the chosen target.
- `/qa list` — menu of available runbooks.
- Natural-language: "qa the auth flows on prod", "run the signup flow on dev".

Before any destructive action, the skill prints the **resolved environment manifest** — which Supabase project, which background-jobs target, which Resend keys, which Gmail account — and asks once for confirmation. The dev/prod flag chooses defaults, but the manifest shows what's actually wired up so you don't accidentally fire against a prod backing service from a "local" run.

## Output

- Inline report in chat with per-runbook pass/fail, broken down by `verified` / `unit-only` / `not-tested`.
- Key-frame screenshots in `_bmad-output/implementation-artifacts/screenshots` (signup confirmation, rendered email body, post-auth dashboard, any failure state).
- A trailing cleanup pointer references either the prod admin UI or a Supabase MCP DELETE statement, depending on mode.

## Cleanup after a destructive run

**Prod:** sign into `<PRODUCTION_URL>/<locale>/admin/users`, search for the alias from the report (or the `+qa-` substring to see all QA users), open the row, and delete. The admin delete flow invokes `supabase.auth.admin.deleteUser`.

**Dev:** the report includes a single SQL statement you can run via Supabase MCP `execute_sql`:

```sql
DELETE FROM auth.users WHERE id = '<uuid-from-report>';
```

Cascades take care of any rows the user owns.

## Adding a runbook

Drop a new `runbooks/<domain>-<flow>.md` with frontmatter (`name`, `domain`, `destructive`, `prod`, `dev`, `requires`, `summary`) and a prose body covering goal / preconditions / outcome-keyed checkpoints / known failure modes / cleanup. `/qa list` picks it up automatically.

Two rules:

1. **Prose, not step-by-step.** Let the model figure out the tool calls.
2. **Outcomes, not implementation.** Say "user reaches the post-auth dashboard," not "click the button labeled `Continue`." See `SKILL.md` → "Cross-cutting practices" → "Decoupling" for the long form.

Reference docs (filename starts with `_`, no frontmatter) aren't runbooks — they're shared snippets that runbooks can link to.
