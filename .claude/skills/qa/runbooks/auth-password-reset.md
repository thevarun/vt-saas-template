---
name: auth-password-reset
domain: auth
destructive: true
prod: true
dev: true
requires: [playwright-mcp, gmail-mcp, qa-email]
summary: Forgot-password → reset → auto sign-out → re-login with new password. Uses disposable +alias account for prod runs.
---

# Password reset

## Goal

Verify the full forgot/reset-password flow including real email rendering: request reset → receive email → screenshot for design review → click link → set new password → confirm auto-sign-out security behavior → sign back in with new password.

Safe against production because it only ever exercises a disposable `+alias` account — the session alias from `auth-magic-signup` when chained, or a freshly-provisioned `+reset-<ts>` alias when standalone. The base `QA_EMAIL` is never touched.

## Setup & alias generation

This runbook needs a user before it can test the reset flow. It runs in one of two modes:

- **Chained** (inside `/qa --prod`, preceded by `auth-magic-signup`): reuse the session alias from the prior runbook — do **not** provision a fresh user. The reset flow works regardless of whether that user already has a password (it sets one). This keeps the sequence's end state at **one** prod test user to clean up, as `SKILL.md` documents.
- **Standalone**: provision a disposable user first, since no session alias exists. Create `alias = ${QA_EMAIL_LOCAL}+reset-${unixTimestamp}@${QA_EMAIL_DOMAIN}` with a known initial password via the real sign-up flow (local dev: `/api/auth/dev-login` with `action: 'signup'`), then run the reset flow against it.

If the caller passes an `existing-alias`, use it and skip the Provision phase entirely. Log the alias prominently either way.

## Preconditions

- Playwright MCP available for driving the password forms and reset-link click-through.
- Gmail MCP connected to `QA_EMAIL`. Inbox lookups go through `search_threads` / `get_thread`.

## Confirm before running on prod

"This will create a disposable Supabase user at `<alias>` on `<PRODUCTION_URL>` and run the password-reset flow on it. Proceed? (y/n)"

## Checkpoints

### Phase 1 — Provision the test user

**Skip this entire phase when chained** (a session alias from `auth-magic-signup` already exists, or an `existing-alias` was passed in). Sign that user out and jump to Phase 2.

Standalone only:

1. On local dev: POST `<TARGET>/api/auth/dev-login` with `{email: alias, password: 'InitialP@ss1', action: 'signup'}`. Expect 200. This endpoint only works on the LOCAL dev server (`NODE_ENV !== 'production'` and `ALLOW_DEV_LOGIN` set); on Vercel preview/prod `NODE_ENV=production`, so it returns 403 — use the prod-safe real-signup path below instead.
2. On prod (or preview): sign up through `/en/sign-up` (magic-link flow, alias) → verify email (capture here too, reuses `auth-magic-signup` pattern).
3. Confirm the alias can sign in with its initial password on `<TARGET>/en/sign-in` (password-mode toggle). Screenshot dashboard to confirm.
4. Sign out.

### Phase 2 — Reset flow

5. Navigate to `<TARGET>/en/forgot-password`. Form renders.
6. Submit the alias. UI shows the **generic** success message (should not reveal whether the email exists — security feature, verify this literal behavior).
7. **Reset email delivery (Gmail MCP):** within ~60s, `search_threads` with `to:<alias> from:<sender-domain> newer_than:5m` returns the reset thread. Sender domain is the configured Resend / Auth sender (derived from project config). For design review, fetch the body via `get_thread` (FULL_CONTENT) and screenshot it in a browser tab.
8. Click the reset link → `<TARGET>/en/reset-password` loads with a valid token (no error state).
9. Enter a new valid password (8+ chars, upper, lower, digit — e.g. `NewP@ssw0rd1`). Submit.
10. UI shows success message.
11. Navigate to `<TARGET>/en/dashboard` → redirected to `/en/sign-in` (auto-sign-out after password update is a security invariant — critical to verify).
12. Sign in as the alias with the **new** password. Dashboard renders.

## Screenshots to capture

- `01-forgot-form`
- `02-generic-success`
- `03-email-reset` — Gmail, opened email, design review frame
- `04-reset-form`
- `05-reset-success`
- `06-auto-signout-redirect` — confirms session invalidation
- `07-signin-with-new-password`
- `08-dashboard-after-relogin`

## Teardown

None inside the browser — alias stays for cleanup step.

## Cleanup reminder (prod only)

```
🧹 Cleanup required (prod):
  Test user: <alias>
  Delete via: <PRODUCTION_URL>/<locale>/admin/users
  Search for the alias and delete. (The fresh signup and its password-reset state
  are the same user row — one delete is enough.)
```

## Known failure modes

- **Reset link shows "invalid or expired token"** — expired by rate-limit or re-use. Fresh alias should prevent; if it happens, capture and retry once.
- **Auto sign-out fails** (checkpoint 11) — critical security regression. Flag prominently.
- **Generic success message leaks email existence** (checkpoint 6) — do a negative case: submit a clearly nonexistent email (`nonexistent+QA-nothing@gmail.com`) and compare UI response. Should be identical.
