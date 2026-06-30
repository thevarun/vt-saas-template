---
name: step-06-smoke-test
description: End-to-end smoke test of the production deployment via Playwright MCP. Covers landing, signup/magic link (verifying branded sender), sign-in, OAuth connect flows, admin gate, dev-login blocked, plus a final cost-posture review gate.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-06-smoke-test.md
nextStepFile: .claude/skills/production-deploy/steps/step-07-document.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
---

# Phase 6 — Smoke Test

## STEP GOAL

Walk every critical user path on the live production URL. Catch silent failures: default-sender emails, OAuth 404s, admin bypasses, sampling not actually applied. Archive screenshots at `_bmad-output/implementation-artifacts/screenshots/deploy/` for the record. Close with a final cost-posture review gate.

## MANDATORY EXECUTION RULES

- Use Playwright MCP for all browser flows. If unavailable, prompt to authenticate it before starting.
- Screenshot at every significant assertion.
- Verify by observed behavior, not by "status says configured." Example: confirm the magic-link email sender is the branded address by inspecting the received email, not by "Resend DNS verified".
- Treat any failed check as a phase blocker. Fix, redeploy, re-run just that check.

## Sequence of Instructions

### 1. Landing page

- Navigate to `https://{PRODUCTION_DOMAIN}`.
- Screenshot full page.
- Confirm: SSG (view-source has rendered HTML, no client-fetch flash), no console errors, meta tags present (OG image, title).
- Record response status, TTFB.

### 2. Signup + magic link

- Navigate to sign-up page.
- Submit a fresh test email (use a real inbox you control — disposable mail services often block magic links).
- Screenshot confirmation state.
- Wait for email. **Inspect the `From` field.** Must be branded (`noreply@mail.{PRODUCTION_DOMAIN}`), not `noreply@mail.app.supabase.io`.
- Click magic link. Confirm lands on dashboard. Screenshot.
- Verify: new user has the expected trial subscription (DB query via Supabase MCP or dashboard).

### 3. Sign-in (existing user)

- Log out. Sign in with the same email. Screenshot dashboard.
- Confirm session persists across refresh.

### 4. OAuth connects (per configured provider)

For each OAuth provider the app uses:

- Navigate to connection settings.
- Click Connect.
- Complete provider OAuth flow.
- Screenshot at each step.
- **Special check**: if Google Safe Browsing flagged the domain earlier, expect the scary screen on provider redirect. Record that review is pending if so.
- Verify token encrypted at rest (spot check the credentials table that stores third-party tokens via Supabase MCP — tokens should be opaque strings, not readable keys; see `.claude/rules/platforms.md`).

### 5. Core feature path (project-specific)

Pick the 1-2 features that represent the app's primary value. Exercise them on production with the test user:
- Create a record / submit a form / run an AI call
- Confirm it persists, completes, and shows in UI

### 6. Admin gate

- Discover the project's admin route(s) and admin-determination mechanism by reading the routing structure and middleware.
- As the test user (non-admin): confirm 403/redirect.
- As a user with admin privileges: confirm access.

### 7. Dev-only auth bypass blocked

Verify any development-only authentication endpoint is blocked in production. Discover the endpoint by reading auth route handlers (look for environment guards).

_e.g. (vt-saas-template projects with `/api/auth/dev-login`):_

```bash
curl -sS -o /dev/null -w "%{http_code}" \
  -X POST "https://{PRODUCTION_DOMAIN}/api/auth/dev-login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"password"}'
```

Expected: `403` or `404`. Any success response is a production security bug — halt, fix, redeploy, re-verify.

### 8. Observability check

- Trigger a test Sentry event (small client-side error or `Sentry.captureException` via server action). Confirm it appears in Sentry.
- Trigger an AI call. Confirm a Langfuse trace appears (if Langfuse detected).
- Confirm PostHog captures a page view (check live events in PostHog).

### 9. Cost posture final gate (the gap that the initial session missed)

Verify **observed** (not configured) cost posture:

| Check | Pass criteria |
|---|---|
| Landing page SSG | No function invocation in Vercel logs for landing page view |
| Sentry prod trace sample rate | Actual traces being sampled at configured rate (visible in Sentry usage) |
| Sentry replay off | 0 replay events in Sentry for alpha |
| DB auto-migrate not running in prod | `vercel logs` shows no migration line on cold start |
| AI quota gating live | Free-tier test call uses fallback model (verify via Langfuse trace model field) |
| Vercel spend cap set | `vercel teams ls` or dashboard shows cap active |
| OpenAI cap set | Dashboard shows monthly cap + alert thresholds active |

### 10. Phase 6 Gate

Spawn `deploy-risk-reviewer` with final rubric: "all five dimensions. This is the last-chance review before the deploy is declared successful."

```
=== PHASE 6: SMOKE TEST — SUMMARY ===

Flow coverage:
  Landing:            ✓ (SSG verified)
  Signup + magic link:✓ (branded sender confirmed: noreply@mail.{PRODUCTION_DOMAIN})
  Sign-in:            ✓
  OAuth connects:     {per provider status}
  Core feature path:  ✓
  Admin gate:         ✓
  Dev-login blocked:  ✓ (403 returned)
  Observability:      Sentry ✓, PostHog ✓, {Langfuse ✓ if applicable}

Cost posture: {pass / N gaps}

Screenshots archived: _bmad-output/implementation-artifacts/screenshots/deploy/

Final risk review: HIGH {n} | MEDIUM {n} | LOW {n}

[C] Continue to Phase 7 (documentation)
[R] Re-run a specific flow
[X] Exit
```
