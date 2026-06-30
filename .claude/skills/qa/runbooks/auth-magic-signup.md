---
name: auth-magic-signup
domain: auth
destructive: true
prod: true
dev: true
requires: [playwright-mcp, gmail-mcp, qa-email]
summary: Magic-link signup + welcome email — creates a new account using a +alias and verifies email rendering end-to-end.
---

# Magic-link sign-up

## Goal

Verify the full sign-up flow including real email rendering: request magic link → receive and screenshot the email → click link → land on dashboard → receive welcome email → screenshot welcome email for design review.

Safe to run against production because it uses Gmail's `+alias` trick to create a unique, traceable, cleanable account every run.

## Alias generation

Construct the signup email before starting:

```
alias = `${QA_EMAIL_LOCAL}+signup-${unixTimestamp}@${QA_EMAIL_DOMAIN}`
```

Example: if `QA_EMAIL=my-qa@gmail.com`, alias = `my-qa+signup-1745400000@gmail.com`.

Log the alias prominently before the first browser action — the user needs it for cleanup.

## Preconditions

- Playwright MCP for driving the sign-up form and the magic-link click-through.
- Gmail MCP connected to `QA_EMAIL`. Inbox checks go through `search_threads` / `get_thread` — no Gmail browser tab needed.
- Clean app context: no existing session for the alias (true by construction — alias is fresh every run).

## Confirm before running on prod

Ask the user once: "This will create a real Supabase auth user at `<alias>` on `<PRODUCTION_URL>`. Proceed? (y/n)"

## Session chaining

On success, **leave the authenticated session open** (don't sign out in teardown). Subsequent runbooks in a `/qa --prod` sequence can reuse this session:

- `auth-magic-signin` — sign out, then sign back in as the same alias to exercise the returning-user magic-link path.
- `auth-password-reset` — use the same alias to request a reset; Supabase's flow works regardless of whether the user has a password yet (it sets one).
- `auth-admin-access` — hit `/admin` from the signed-in session to verify non-admin gating.

The cleanup pointer at the end of the sequence should reference this single alias (one row to delete, not one per runbook).

## Checkpoints

1. `<TARGET>/en/sign-up` renders with an email input (and any configured OAuth sign-in option(s)).
2. Submitting the alias transitions the page to a "check your inbox" confirmation surface that displays the alias.
3. **Magic-link delivery (Gmail MCP, layer 2):** within ~60 seconds, `search_threads` returns a thread matching `to:<alias> from:<sender-domain> newer_than:5m`. Sender domain is the configured Supabase SMTP sender (derived from the project's Resend / Auth config, e.g. `EMAIL_FROM_ADDRESS`). Don't pin the subject — Supabase's default template and brand-customized templates differ.
4. **Magic-link design review (layer 3, prod only):** call `get_thread` with `messageFormat: FULL_CONTENT` to fetch the rendered HTML; render in a browser tab and screenshot the body. Skippable when the run isn't focused on email design.
5. Clicking the magic link in the email (use Playwright MCP to open the URL — Gmail MCP only reads, it doesn't navigate) opens an auth-callback route and lands on the post-signup app surface (typically `/dashboard` with a "verified" indicator). Note any redirect surface that differs from the documented routing.
6. The post-signup surface renders for a fresh user — no sign-in CTA visible, user menu present, onboarding state appropriate for a brand-new account.
7. **Welcome email (Gmail MCP layers 1+2):** within ~60 seconds of landing on the dashboard, dev-server logs show `Email sent: welcome` (server log layer) and `search_threads` returns a thread with subject pattern-matching "welcome" (loosely). Layer 3 screenshot of the welcome email is the intended design-review artifact for prod runs.

## Screenshots to capture

- `01-signup-form` — empty sign-up page
- `02-confirmation-sent` — "check your inbox" with the alias visible
- `03-email-magic-link-body` — rendered magic-link email body (design review frame, prod only)
- `04-dashboard` — fresh-user dashboard
- `05-email-welcome-body` — rendered welcome email body (design review frame, prod only)

Save these to `_bmad-output/implementation-artifacts/screenshots` (Playwright MCP `downloadsDir` + `savePng: true`). Name failure captures `99-failure-<reason>.png`. Inbox-list screenshots from a Gmail browser tab are not necessary — the Gmail MCP `search_threads` result is the equivalent record.

## Teardown

None required inside the browser (account intentionally lives on).

## Cleanup reminder (prod only)

After a prod run, emit:

```
🧹 Cleanup required (prod):
  Test user: <alias>
  Delete via: <PRODUCTION_URL>/<locale>/admin/users
  Search/filter by the full alias, then open the row and choose Delete.
  Requires admin auth; self-delete is blocked server-side.
```

## Known failure modes

- **Magic-link email not received within 60s (per Gmail MCP)** — Supabase SMTP misconfiguration on the target env, or Gmail routing to Spam. Pass `includeTrash: false` in `search_threads`, then retry without it; if the message is in Trash, that's a Gmail-side filter, not a product bug.
- **Magic link opens `/auth-code-error`** — expired or previously-consumed code. Should not happen with a fresh alias; if it does, capture the error page and stop. Note from cross-cutting practices: don't touch the link twice — that itself can cause this.
- **Welcome email missing** — the fire-and-forget send in the callback silently failed. The layer-1 server-log check (`Email failed:` for emailType `welcome`) is what catches this when the inbox check times out. Report as partial pass with the log evidence.
- **Post-signup landing page 404 or broken** — onboarding defaults not provisioned for fresh users. Capture and report.
