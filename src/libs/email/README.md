# Email

All outbound email from the app. Read this when adding a new template, changing sender config, or updating Supabase auth emails. See also [`docs/email-system.md`](../../../docs/email-system.md) for the full reference (dev mode, Resend setup, retry/logging).

## Shared chrome

Every branded email composes via `src/libs/email/templates/EmailLayout.tsx` — it owns the card container, header (logo or full-bleed image), button, step list, OTP code, fallback link, and footer. New templates should use those primitives rather than hand-rolling HTML. Inline styles live in `templates/styles.ts`.

## Sender personas (neither accepts replies)

Every outbound email uses a single FROM address (`EMAIL_FROM_ADDRESS`). Only the display NAME varies by voice:

| Persona       | Env var for name            | Default name                | Used for                          |
| ------------- | --------------------------- | --------------------------- | --------------------------------- |
| **System**    | `EMAIL_FROM_NAME`           | `VT SaaS Template`          | Auth, transactional alerts        |
| **Lifecycle** | `EMAIL_LIFECYCLE_FROM_NAME` | `Team at VT SaaS Template`  | Welcome / nurture emails          |

Gmail/Apple Mail show the display name prominently and the address in smaller type, so the name shift carries the persona cleanly without needing multiple verified addresses in Resend. A per-send override flows through `EmailPayload.from` (see `getFromAddress()` / `getLifecycleFromAddress()` in `config.ts`); `client.ts` honors it.

## Header image

`EmailLayout` falls back to the centered `apple-touch-icon.png` logo when no header image is supplied, so the system ships with zero new assets. To use a full-bleed branded header, pass `headerImageUrl` to `EmailLayout` (e.g. a generated wordmark at `${appUrl}/email/header.png`). A branded-header generator is optional and not included here.

## Supabase auth emails

Templates live in this repo and are pasted into the Supabase Dashboard by hand. Render locally first:

```bash
pnpm email:render
# or: pnpm exec tsx scripts/render-supabase-templates.ts
```

Outputs to top-level `email-templates/*.html` (git-ignored). Supabase variables like `{{ .ConfirmationURL }}`, `{{ .TokenHash }}`, `{{ .Token }}`, `{{ .NewEmail }}` pass through React Email unescaped.

The rendered links point at the app's own `/auth/confirm` route (`src/app/auth/confirm/route.ts`) rather than the legacy `{{ .ConfirmationURL }}`, so users stay on your domain and the Supabase project ref is never exposed. That route calls `verifyOtp({ token_hash })` and redirects to `next`; it ships with the template, so the verify flow works out of the box once the rendered HTML is pasted into the Dashboard.

| Template file              | Paste into (Dashboard → Auth → Email Templates) | Subject                       |
| -------------------------- | ----------------------------------------------- | ----------------------------- |
| `signup-confirmation.html` | Confirm signup                                  | _Confirm your email_          |
| `magic-link.html`          | Magic Link                                      | _Sign in to {App}_            |
| `password-reset.html`      | Reset Password                                  | _Reset your password_         |
| `email-change.html`        | Change Email Address                            | _Confirm your new email_      |
| `reauthentication.html`    | Reauthentication                                | _Your verification code_      |
| `invite-user.html`         | Invite user                                     | _You're invited to {App}_     |

### Re-paste whenever

- Any `*.tsx` template in `src/libs/email/templates/` changes
- `EmailLayout.tsx` or `styles.ts` changes
- The app name / brand changes (templates render `appName` into headings, body, and footer)

## Testing

`/admin/email` test-sends any template through the real pipeline using each template's `PreviewProps`:

- **welcome** → lifecycle sender (via `sendWelcomeEmail`)
- the 6 auth templates → system sender (via `sendEmail` with `getFromAddress()`)

Without `RESEND_API_KEY`, emails log to console (dev). With a key, they go through Resend.

## React Email preview server (`pnpm email:dev`)

Runs at http://localhost:3001 and renders every template from `src/libs/email/templates/`.

- Each template exports `PreviewProps` so the preview server has realistic data (URLs, tokens, names) without crashing on `undefined`.
- With the apple-touch-icon fallback the logo resolves to `${appUrl}/apple-touch-icon.png`, which 404s in local preview until deployed — broken logo in local preview is expected.

## Dormant templates

Two templates are kept on-brand in the Supabase Dashboard even when not triggered anywhere in the app:

- **`ReauthenticationEmail`** — only fires if `supabase.auth.reauthenticate()` is called.
- **`InviteUserEmail`** — only fires for `supabase.auth.admin.inviteUserByEmail()` or ad-hoc invites from the Supabase Dashboard.

Leaving them wired up costs nothing and guarantees any future use (or one-off admin action) renders on-brand instead of the generic Supabase default.
