# Email System

This document covers the transactional email system built with [Resend](https://resend.com) and [React Email](https://react.email).

> **Note:** Email verification and password reset emails are sent by Supabase Auth.
> This template ships on-brand React Email templates for those flows — render them
> to HTML and paste into Supabase Dashboard → Authentication → Email Templates.
> See [Supabase Auth emails](#supabase-auth-emails) below.

## Quick Start

### Development Mode (No API Key)

Emails are logged to the console in development - no configuration needed:

```bash
pnpm dev
```

Console output shows email details:
```
============================================================
EMAIL (DEV MODE - NOT SENT)
============================================================
Type:     welcome
From:     VT SaaS Template <noreply@example.com>
To:       user@example.com
Subject:  Welcome to VT SaaS Template!
------------------------------------------------------------
CONTENT: React Email template (render with pnpm email:dev)
============================================================
```

### Preview Templates

```bash
pnpm email:dev
```

Opens React Email dev server with hot-reload for template development.

## Production Setup

### 1. Get Resend API Key

1. Sign up at https://resend.com
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_`)

### 2. Configure Environment

Add to `.env.local`:

```bash
# Required for sending emails
RESEND_API_KEY=re_your_api_key_here

# Optional - defaults provided
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
EMAIL_REPLY_TO=support@yourdomain.com
```

### 3. Verify Domain (Production)

For production sends, verify your domain in Resend:
1. Resend Dashboard → Domains → Add Domain
2. Add the DNS records to your domain
3. Wait for verification

> **Testing:** Resend allows sending to your own email from `onboarding@resend.dev` without domain verification.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | Production only | None | Resend API key |
| `EMAIL_FROM_ADDRESS` | No | `noreply@example.com` | Sender email address (shared by both personas) |
| `EMAIL_FROM_NAME` | No | `VT SaaS Template` | System-sender display name |
| `EMAIL_LIFECYCLE_FROM_NAME` | No | `Team at VT SaaS Template` | Lifecycle-sender display name (welcome/nurture) |
| `EMAIL_REPLY_TO` | No | None | Reply-to address |

## Sender personas

Every outbound email uses a single FROM **address** (`EMAIL_FROM_ADDRESS`); only the display **name** varies by voice. This avoids verifying multiple addresses in Resend while still letting transactional and lifecycle email read differently in the inbox.

| Persona       | Display-name env var        | Helper                      | Used for                   |
| ------------- | --------------------------- | --------------------------- | -------------------------- |
| **System**    | `EMAIL_FROM_NAME`           | `getFromAddress()`          | Auth, transactional alerts |
| **Lifecycle** | `EMAIL_LIFECYCLE_FROM_NAME` | `getLifecycleFromAddress()` | Welcome / nurture emails   |

Both helpers live in `src/libs/email/config.ts`. `EMAIL_CONFIG` is a lazy `Proxy` — it defers reading `Env` until a field is accessed, so client/RSC modules that transitively import the email barrel don't trip env validation at import time.

A per-send override flows through `EmailPayload.from` (and the `from` option on `sendEmail`). `client.ts` uses `payload.from || getFromAddress()`, so passing `from: getLifecycleFromAddress()` switches the persona for a single send (this is exactly what `sendWelcomeEmail` does).

## Testing Emails

### Via API Endpoint

```bash
curl -X POST http://localhost:3000/api/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "name": "Test User"}'
```

### Via User Flows

- **Sign up:** Complete email verification → Welcome email sent
- **OAuth:** First Google/GitHub sign-in → Welcome email sent

### Admin test-send catalog (`/api/admin/email/test`)

`POST /api/admin/email/test` (admin-only, via `withAdminAuth`) sends any template through the real pipeline using its `PreviewProps`, so a real inbox renders identically to `pnpm email:dev`. The admin UI (`EmailTestForm`) exposes the same catalog as a dropdown.

| `template` value      | Sender              | Helper              |
| --------------------- | ------------------- | ------------------- |
| `welcome`             | Lifecycle persona   | `sendWelcomeEmail`  |
| `signup-confirmation` | System persona      | `sendEmail`         |
| `magic-link`          | System persona      | `sendEmail`         |
| `password-reset`      | System persona      | `sendEmail`         |
| `email-change`        | System persona      | `sendEmail`         |
| `reauthentication`    | System persona      | `sendEmail`         |
| `invite-user`         | System persona      | `sendEmail`         |

## Supabase Auth emails

Supabase Auth (not this app) sends the confirmation / magic-link / password-reset / email-change / reauthentication / invite emails. To make them on-brand, this template ships React Email templates in `src/libs/email/templates/` and a render script that turns them into static HTML for the Supabase Dashboard.

```bash
pnpm email:render
# or: pnpm exec tsx scripts/render-supabase-templates.ts
```

This writes `email-templates/*.html` (git-ignored). Paste each into Supabase Dashboard → Authentication → Email Templates. Supabase placeholders (`{{ .ConfirmationURL }}`, `{{ .TokenHash }}`, `{{ .Token }}`, `{{ .NewEmail }}`) pass through React Email unescaped and are substituted by Supabase at send time.

**Re-paste whenever** a template, `EmailLayout.tsx`, `styles.ts`, or the brand/app name changes.

See [`src/libs/email/README.md`](../src/libs/email/README.md) for the paste-target table and dormant-template notes.

## Email layout & primitives

Branded templates compose via `src/libs/email/templates/EmailLayout.tsx`, which provides:

- `EmailLayout` — card chrome, header (centered `apple-touch-icon.png` logo by default, or a full-bleed `headerImageUrl`), and a prop-driven footer. `brandName` renders into the footer; `includePreferencesLink` + `preferencesUrl` add an opt-out link for lifecycle emails.
- Typed primitives: `EmailHeading`, `EmailText`, `EmailMutedText`, `EmailSignoff`, `EmailButton`, `EmailSteps` / `EmailStepItem`, `EmailFallbackLink`, `EmailOtpCode`.
- Inline, email-safe styles in `templates/styles.ts` (palette, type scale, button, OTP).
- `safeGreeting(name)` in `templates/helpers.ts` — falls back to "Hi there," when the name is blank or looks like an email address.

### PreviewProps pattern

Every template exports `PreviewProps` (typed via `satisfies`). This powers two things at once:

1. `pnpm email:dev` renders realistic data without crashing on `undefined`.
2. The admin test-send route spreads `PreviewProps` into the template, so test inboxes match the preview.

When adding a template, export `PreviewProps` and use the `EmailLayout` primitives.

## Architecture

### File Structure

```
src/libs/email/
├── index.ts                # Barrel exports
├── types.ts                # TypeScript types (incl. EmailPayload.from override)
├── config.ts               # Sender config + persona helpers (lazy Proxy)
├── client.ts               # EmailClient class (provider abstraction)
├── sendEmail.ts            # Main send helper
├── sendEmailAsync.ts       # Fire-and-forget wrapper
├── retry.ts                # Retry with exponential backoff
├── emailLogger.ts          # Structured logging
├── sendWelcomeEmail.tsx    # Welcome email helper (lifecycle persona)
├── README.md               # Subsystem quick reference
└── templates/
    ├── EmailLayout.tsx     # Shared chrome + typed primitives
    ├── styles.ts           # Email-safe inline styles
    ├── helpers.ts          # safeGreeting()
    ├── WelcomeEmail.tsx    # Welcome template
    ├── SignupConfirmationEmail.tsx
    ├── MagicLinkEmail.tsx
    ├── PasswordResetEmail.tsx
    ├── EmailChangeEmail.tsx
    ├── ReauthenticationEmail.tsx
    └── InviteUserEmail.tsx

scripts/render-supabase-templates.ts  # Renders auth templates → HTML for Supabase
```

### Key Components

**EmailClient** (`client.ts`)
- Abstracts email provider (currently Resend)
- Handles dev mode (console logging)
- Integrates retry logic

**sendEmail** (`sendEmail.ts`)
- Simple helper function for sending emails
- Accepts template + data

**sendEmailAsync** (`sendEmailAsync.ts`)
- Fire-and-forget pattern for non-blocking sends
- Logs failures but doesn't throw

**Retry Logic** (`retry.ts`)
- Up to 3 retry attempts
- Exponential backoff with jitter
- Configurable per-send

## Usage Examples

### Send Email (Blocking)

```typescript
import { sendEmail } from '@/libs/email';
import { WelcomeEmail } from '@/libs/email/templates/WelcomeEmail';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Hello!',
  react: <WelcomeEmail userName="John" />,
});

if (result.success) {
  console.log('Sent:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

### Send Email (Non-Blocking)

```typescript
import { sendEmailAsync } from '@/libs/email';
import { sendWelcomeEmail } from '@/libs/email';

// Fire and forget - continues immediately
sendEmailAsync(
  () => sendWelcomeEmail('user@example.com', 'John'),
  { emailType: 'welcome', recipientHint: 'user@example.com' }
);

// User action completes without waiting for email
```

### Custom Retry Config

```typescript
import { sendEmail } from '@/libs/email';

const result = await sendEmail(
  { to: 'user@example.com', subject: 'Important', text: 'Hello' },
  {
    emailType: 'notification',
    retryConfig: { maxAttempts: 5 },
  }
);
```

### Disable Retry

```typescript
const result = await sendEmail(
  { to: 'user@example.com', subject: 'Quick', text: 'Hi' },
  { disableRetry: true }
);
```

## Creating New Templates

1. Create template in `src/libs/email/templates/`:

```tsx
// src/libs/email/templates/ReceiptEmail.tsx
import { Html, Head, Body, Container, Text } from '@react-email/components';

type ReceiptEmailProps = {
  userName: string;
  amount: string;
  date: string;
};

export function ReceiptEmail({ userName, amount, date }: ReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Hi {userName},</Text>
          <Text>Your payment of {amount} on {date} was successful.</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

2. Create helper function:

```typescript
// src/libs/email/sendReceiptEmail.tsx
import { sendEmail } from './sendEmail';
import { ReceiptEmail } from './templates/ReceiptEmail';

export async function sendReceiptEmail(
  to: string,
  userName: string,
  amount: string,
  date: string,
) {
  return sendEmail(
    {
      to,
      subject: `Receipt for ${amount}`,
      react: <ReceiptEmail userName={userName} amount={amount} date={date} />,
    },
    { emailType: 'receipt' }
  );
}
```

3. Export from `index.ts`:

```typescript
export { sendReceiptEmail } from './sendReceiptEmail';
```

4. Preview with `pnpm email:dev`

## Logging

Emails are logged with structured JSON:

```json
{
  "type": "email_sent",
  "emailType": "welcome",
  "recipient": "us***@example.com",
  "subject": "Welcome to VT SaaS Template!",
  "messageId": "abc123",
  "status": "success",
  "durationMs": 245
}
```

**Log Types:**
- `email_sent` - Successful send
- `email_failed` - Failed send with error details
- `email_dev_mode` - Dev mode (not actually sent)
- `email_retry` - Retry attempt
- `email_async_failure` - Async send failure

**Privacy:** Email addresses are hashed in logs (`us***@example.com`).

## Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set in `.env.local`
2. Verify domain is configured in Resend dashboard
3. Check logs for error messages

### API Key Not Working

- Ensure key starts with `re_`
- Check key hasn't been revoked in Resend dashboard
- Verify no extra whitespace in `.env.local`

### Template Not Rendering

- Run `pnpm email:dev` to debug
- Check for missing props
- Verify imports from `@react-email/components`
