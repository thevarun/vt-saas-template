---
name: auth-cookies
domain: auth
destructive: false
prod: true
dev: true
requires: [playwright-mcp, qa-email, qa-password]
summary: Post-login cookie flag inspection — verifies sb-* cookies carry HttpOnly, Secure, SameSite=Lax.
---

# Cookie flag inspection

## Goal

After a successful sign-in, confirm the Supabase session cookies (`sb-*-auth-token`) are set with the correct security flags. Regression guard against domain/secure-flag misconfiguration that's only visible on deployed origins.

Production-safe: read-only inspection.

## Preconditions

- `QA_EMAIL` + `QA_PASSWORD` work.
- If running `--prod`, use `<PRODUCTION_URL>`. Otherwise use the local dev server (`http://localhost:<port>`).

## Checkpoints

1. Sign in via password mode (toggle magic-link → password, enter creds, submit).
2. Lands on `/en/dashboard`.
3. Retrieve cookies via Playwright's context (e.g. `playwright_evaluate` to dump `document.cookie` for the non-HttpOnly subset, AND use the devtools Application → Cookies panel screenshot for the HttpOnly view).
4. For each cookie whose name starts with `sb-`:
   - `HttpOnly` is true
   - `Secure` is true (required on prod; should also be true on Vercel preview since it's HTTPS)
   - `SameSite` is `Lax`
   - `Domain` matches the current origin (not `.localhost` on a deployed env, not an unexpected parent domain)
5. No `sb-*` cookie appears in `document.cookie` (because HttpOnly) — if any do, flag it.

## Screenshots

- `01-signin-form`
- `02-dashboard`
- `03-cookies-panel` — devtools Application → Cookies filtered to `sb-*`, showing the flag columns.

## Teardown

- Sign out if desired.

## Known failure modes

- `Secure: false` in production → deployment behind non-HTTPS or proxy stripping the flag. Incident-level finding.
- `SameSite: None` or missing → cross-site request protection weakened. Flag.
- `Domain: .<prod-domain>` (leading dot) vs `<prod-domain>` → can cause subdomain leak. Capture exact value.
