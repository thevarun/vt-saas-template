---
name: auth-admin-access
domain: auth
destructive: false
prod: true
dev: true
requires: [playwright-mcp]
summary: Admin route gating — non-admin user is redirected away from /admin with access_denied. No admin account needed.
---

# Admin route gating

## Goal

Verify the middleware-level gate on `/admin`: a signed-in non-admin user gets redirected to `/dashboard?error=access_denied` (and, ideally, sees a visible error banner or toast). This is a security invariant — if it regresses, non-admins could read admin data.

We only test the deny branch. The admin-success branch is covered by unit tests (`src/libs/auth/isAdmin.test.ts`, `src/proxy.test.ts`) and isn't worth the cost of provisioning an admin account.

## Preconditions

- Browser already has a signed-in non-admin session. Easiest: chain after `auth-magic-signup` / `auth-magic-signin` / `auth-password-reset` in the same `/qa --prod` run.
- If invoked standalone: sign in as the QA user first (magic-link or password), then proceed.

## What to verify

1. Navigate to `<TARGET>/en/admin`.
2. Browser ends on `/en/dashboard` with `error=access_denied` in the URL (or an equivalent banner/toast surfaced by the dashboard).
3. The admin page content never renders — no flash of admin UI before the redirect.

Capture one frame showing the final redirected state (URL bar visible + whatever error affordance the dashboard renders).

## Known failure modes

- **Non-admin reaches `/admin` with no redirect** → critical authorization regression. Flag.
- **Flash of admin UI before redirect** → middleware running too late; user briefly sees content they shouldn't. Flag.
- **No visible error indicator on dashboard** → the query param is set but the dashboard doesn't surface it. Minor UX, not security.
