---
name: auth-magic-signin
domain: auth
destructive: false
prod: true
dev: true
requires: [playwright-mcp, gmail-mcp, qa-email]
summary: Magic-link sign-in round-trip — request link, open from inbox, land on dashboard.
---

# Magic-link sign-in

## Goal

Verify the full magic-link sign-in flow on the target environment (dev or prod): request a link from the sign-in page, receive the email, click through, and land authenticated on the dashboard.

## Preconditions

- The alias from `auth-magic-signup` exists as a confirmed Supabase user and the browser context has been signed out. (Standalone: any confirmed user whose inbox the Gmail MCP can read works — pass it in as the session alias.)
- The browser context starts signed-out (no existing session). If reusing a context, clear cookies/localStorage first.

## Checkpoints

1. `<TARGET>/en/sign-in` renders with an email input (and any configured OAuth sign-in option(s)).
2. Submitting `<alias>` transitions the page to a "check your inbox" confirmation surface that displays the submitted address.
3. **Magic-link delivery (Gmail MCP, layer 2):** within ~60 seconds, `search_threads` with `to:<alias> from:<sender-domain> newer_than:5m` returns a thread. Sender domain is the configured Resend / Auth sender (derived from project config). Don't pin the subject — pattern-match on sender + recency.
4. **Server-log layer (1):** dev/prod logs show `Email sent: magic_link` (or the project's equivalent emailType). For prod runs, confirming this is best-effort since logs may not be tailable; the inbox arrival itself is sufficient evidence on prod.
5. Opening the magic link via Playwright MCP resolves to the post-auth surface (typically `/dashboard`, possibly via an auth-callback intermediary).
6. The post-auth surface renders for a signed-in user (no sign-in CTA, user menu present).

## Screenshots to capture

- `01-signin-form` — the sign-in page before submission.
- `02-confirmation-sent` — the "check your inbox" view with the email displayed.
- `03-dashboard` — the post-auth dashboard.

Capture an extra `99-failure-<reason>` if any checkpoint misses.

## Teardown

- Sign out to free the session for other runbooks, OR note that the context is now authenticated so downstream runbooks that need a clean state should start a new context.

## Known failure modes

- Email delivery delayed beyond 60s (per Gmail MCP `search_threads` returning empty) → Supabase SMTP misconfiguration on the target env, or Gmail filtered to Trash. Retry the search with `includeTrash: true` to discriminate before failing.
- Magic link redirects to `/auth-code-error` → expired or reused code. Don't touch the link twice (single-use). Retry once with a freshly requested link before failing.
