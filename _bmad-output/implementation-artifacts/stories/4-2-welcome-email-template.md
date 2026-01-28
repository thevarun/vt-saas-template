# Story 4.2: Welcome Email Template

**Epic:** Epic 4 - Email Communication System
**Story ID:** 4.2
**Status:** ready-for-dev
**Assigned To:** backend-developer
**Priority:** High
**Estimate:** 3 story points

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

---

## User Story

As a **new user who just signed up**,
I want **to receive a professional welcome email**,
So that **I feel welcomed and know my account was created**.

---

## Acceptance Criteria

### AC1: Email Sent on Account Creation
**Given** a user completes registration
**When** their account is created
**Then** a welcome email is sent to their address
**And** the email arrives within 30 seconds

### AC2: Email Metadata
**Given** the welcome email
**When** I view it in my inbox
**Then** subject line is welcoming (e.g., "Welcome to VT SaaS Template!")
**And** sender name is the application name
**And** email renders correctly in major clients (Gmail, Outlook)

### AC3: Email Content
**Given** the welcome email content
**When** I read the email
**Then** I see a personalized greeting (if name available)
**And** I see brief info about getting started
**And** I see a CTA button to access the app
**And** I see contact/support information

### AC4: Template Implementation
**Given** the welcome email template
**When** I review the code
**Then** template is built with React Email
**And** template is in `src/libs/email/templates/`
**And** template uses consistent branding (colors, logo)
**And** template is responsive (mobile-friendly)

### AC5: Mobile Responsiveness
**Given** the welcome email
**When** I view it on mobile
**Then** layout adapts properly
**And** CTA button is tap-friendly
**And** text is readable without zooming

---

## Context

### Epic Context

**Note:** Email verification and password reset emails are handled natively by Supabase Auth. These templates can be customized via Supabase Dashboard -> Authentication -> Email Templates. This epic focuses on **app-specific transactional emails** only (welcome, receipts, notifications).

### Prerequisites

Story 4.1 (Email Infrastructure Setup) is **complete**. The following infrastructure is available:

- **Email Service**: `src/libs/email/` with `sendEmail()` function
- **Types**: `WelcomeEmailData` type already defined in `src/libs/email/types.ts`
- **Templates Directory**: `src/libs/email/templates/` ready for templates
- **Preview Server**: `npm run email:dev` for hot-reload template development
- **Configuration**: Sender name, FROM address configured via environment variables

### Architecture Decision: Welcome Email Trigger Point

There are multiple options for triggering the welcome email:

**Option A: Supabase Database Webhook (Recommended)**
- Create a webhook trigger on `auth.users` INSERT
- Send welcome email from API route called by webhook
- Pros: Reliable, captures all registration methods (email, OAuth)
- Cons: Requires Supabase webhook configuration

**Option B: Auth Callback Route Enhancement**
- Modify `/api/auth/callback/route.ts` to send welcome email after OAuth success
- For email signup, create API route called after email verification
- Pros: No external webhook config needed
- Cons: Need to handle multiple trigger points

**Option C: Client-side trigger after signup (Not Recommended)**
- Call API endpoint from sign-up page after successful registration
- Cons: Can be bypassed, doesn't work for OAuth, unreliable

**Recommended Approach**: Use Option B initially (simpler setup), with the trigger happening in the auth callback route for OAuth users and via a new API endpoint for email/password users after they verify their email.

### Email Client Compatibility

React Email components are tested for:
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop, iOS, Android)
- Apple Mail (macOS, iOS)
- Yahoo Mail

---

## Tasks

### Task 1: Create Welcome Email React Component (AC: #3, #4, #5)
**Description:** Build the welcome email template using React Email components

#### 1.1: Create Welcome Email Template
- [ ] File: `src/libs/email/templates/WelcomeEmail.tsx`
- [ ] Import React Email components:
  ```typescript
  import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
  } from '@react-email/components';
  ```
- [ ] Define props interface using existing `WelcomeEmailData` type:
  ```typescript
  import type { WelcomeEmailData } from '../types';

  type WelcomeEmailProps = WelcomeEmailData;
  ```
- [ ] Implement component with sections:
  - Preview text (inbox snippet)
  - Header with app branding
  - Personalized greeting ("Hi {name}," or "Hi there,")
  - Welcome message explaining the app
  - Getting started bullet points
  - CTA button to dashboard
  - Support/contact footer
  - Unsubscribe note (best practice)

#### 1.2: Apply Branding Styles
- [ ] Use inline styles (email client compatibility)
- [ ] Brand colors:
  - Primary: `#2563eb` (blue-600)
  - Text: `#1e293b` (slate-800)
  - Muted: `#64748b` (slate-500)
  - Background: `#f8fafc` (slate-50)
- [ ] Font family: System font stack for email compatibility
- [ ] Ensure minimum tap target size: 44x44px for CTA button

#### 1.3: Make Template Responsive
- [ ] Container max-width: 600px (email standard)
- [ ] Use percentage widths for content
- [ ] Button padding: min 16px vertical, 24px horizontal
- [ ] Font sizes: min 16px for body text (mobile readability)

**Dev Notes:**
- Preview with `npm run email:dev` during development
- Test in multiple email clients before marking complete
- Keep template simple - complex layouts break in email clients

---

### Task 2: Create Welcome Email Helper Function (AC: #1, #2)
**Description:** Create a dedicated function to send welcome emails

#### 2.1: Create Helper Function
- [ ] File: `src/libs/email/sendWelcomeEmail.ts`
- [ ] Implement function:
  ```typescript
  import { sendEmail } from './sendEmail';
  import { WelcomeEmail } from './templates/WelcomeEmail';
  import type { EmailSendResult } from './types';

  /**
   * Send welcome email to a new user
   *
   * @param email - Recipient email address
   * @param name - Optional user name for personalization
   * @returns Email send result
   */
  export async function sendWelcomeEmail(
    email: string,
    name?: string,
  ): Promise<EmailSendResult> {
    const appName = process.env.EMAIL_FROM_NAME || 'VT SaaS Template';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return sendEmail(
      email,
      `Welcome to ${appName}!`,
      <WelcomeEmail
        recipientEmail={email}
        recipientName={name}
        appName={appName}
        appUrl={appUrl}
      />,
      {
        tags: [{ name: 'type', value: 'welcome' }],
      },
    );
  }
  ```

#### 2.2: Export from Index
- [ ] File: `src/libs/email/index.ts`
- [ ] Add export:
  ```typescript
  export { sendWelcomeEmail } from './sendWelcomeEmail';
  ```

**Dev Notes:**
- Subject line follows best practices (clear, branded)
- Tag added for email analytics/filtering
- Environment variables provide defaults for development

---

### Task 3: Create Welcome Email API Endpoint (AC: #1)
**Description:** Create an API route to trigger welcome email sending

#### 3.1: Create API Route
- [ ] File: `src/app/api/email/welcome/route.ts`
- [ ] Implement POST handler:
  ```typescript
  import { createClient } from '@/libs/supabase/server';
  import { sendWelcomeEmail } from '@/libs/email';
  import { NextResponse } from 'next/server';
  import { cookies } from 'next/headers';

  export async function POST(request: Request) {
    try {
      // Verify the request is authenticated
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Send welcome email
      const result = await sendWelcomeEmail(
        user.email!,
        user.user_metadata?.name || user.user_metadata?.full_name,
      );

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to send email', details: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, messageId: result.messageId });
    } catch (error) {
      console.error('Welcome email error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  ```

**Dev Notes:**
- Requires authenticated user (session validation)
- Returns structured response with success/failure
- Logs errors for debugging

---

### Task 4: Integrate Welcome Email into Auth Flow (AC: #1)
**Description:** Trigger welcome email automatically when users complete signup

#### 4.1: Enhance Auth Callback for OAuth Users
- [ ] File: `src/app/api/auth/callback/route.ts`
- [ ] After successful session exchange, check if user is new:
  ```typescript
  // After successful exchangeCodeForSession
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if this is a new user (created in last 5 minutes)
    const createdAt = new Date(user.created_at);
    const isNewUser = Date.now() - createdAt.getTime() < 5 * 60 * 1000;

    if (isNewUser) {
      // Send welcome email (fire and forget - don't block redirect)
      sendWelcomeEmail(
        user.email!,
        user.user_metadata?.name || user.user_metadata?.full_name,
      ).catch(err => console.error('Failed to send welcome email:', err));
    }
  }
  ```

#### 4.2: Create Verify-Complete Handler for Email Signup
- [ ] File: `src/app/api/auth/verify-complete/route.ts`
- [ ] Implement GET handler (called after email verification link):
  ```typescript
  import { createServerClient } from '@supabase/ssr';
  import { cookies } from 'next/headers';
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';
  import { sendWelcomeEmail } from '@/libs/email';

  export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (!code) {
      return NextResponse.redirect(new URL('/en/sign-in', request.url));
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {}
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        // Send welcome email (fire and forget)
        sendWelcomeEmail(
          user.email,
          user.user_metadata?.name,
        ).catch(err => console.error('Failed to send welcome email:', err));
      }

      return NextResponse.redirect(new URL(next, request.url));
    }

    const localeMatch = next.match(/^\/([^/]+)\//);
    const locale = localeMatch?.[1] ?? 'en';
    return NextResponse.redirect(new URL(`/${locale}/auth-code-error`, request.url));
  }
  ```

#### 4.3: Update Sign-Up Email Redirect
- [ ] File: `src/app/[locale]/(unauth)/(center)/sign-up/page.tsx`
- [ ] Update emailRedirectTo to use verify-complete route:
  ```typescript
  emailRedirectTo: `${window.location.origin}/api/auth/verify-complete?next=/${locale}/onboarding`,
  ```

**Dev Notes:**
- OAuth users: Email sent immediately after first login
- Email/password users: Email sent after email verification
- Fire-and-forget pattern prevents blocking user flow
- Errors logged but don't affect user experience

---

### Task 5: Add Environment Variables (AC: #1)
**Description:** Add any additional environment variables needed

#### 5.1: Update Environment Schema
- [ ] File: `src/libs/Env.ts`
- [ ] Add NEXT_PUBLIC_APP_URL if not present:
  ```typescript
  // In client section (if needed for URLs in emails)
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  ```

#### 5.2: Update .env.example
- [ ] File: `.env.example`
- [ ] Add variable if not present:
  ```bash
  # Application URL (for email links)
  NEXT_PUBLIC_APP_URL=https://your-domain.com
  ```

**Dev Notes:**
- App URL needed for CTA button links in emails
- Defaults to localhost for development

---

### Task 6: Write Unit Tests (AC: All)
**Description:** Create test coverage for welcome email functionality

#### 6.1: Test Welcome Email Template
- [ ] File: `src/libs/email/templates/WelcomeEmail.test.tsx`
- [ ] Test cases:
  - [ ] Renders with name provided
  - [ ] Renders without name (fallback greeting)
  - [ ] Contains CTA button with correct URL
  - [ ] Contains app name in content
  - [ ] Contains required sections (greeting, getting started, footer)

#### 6.2: Test sendWelcomeEmail Helper
- [ ] File: `src/libs/email/sendWelcomeEmail.test.ts`
- [ ] Test cases:
  - [ ] Calls sendEmail with correct subject
  - [ ] Passes name to template when provided
  - [ ] Handles missing name gracefully
  - [ ] Includes welcome tag
  - [ ] Returns success/failure correctly

#### 6.3: Test Welcome Email API
- [ ] File: `src/app/api/email/welcome/route.test.ts`
- [ ] Test cases:
  - [ ] Returns 401 without authentication
  - [ ] Returns 200 on successful send
  - [ ] Returns 500 on send failure
  - [ ] Logs errors appropriately

**Dev Notes:**
- Mock Resend SDK to avoid actual sends
- Mock Supabase client for auth tests
- Test React Email render output for content validation

---

### Task 7: Manual Testing & Preview (AC: #2, #5)
**Description:** Verify email template in development environment

#### 7.1: Preview Template
- [ ] Run `npm run email:dev`
- [ ] Navigate to welcome email template
- [ ] Verify all content displays correctly
- [ ] Test with/without recipient name

#### 7.2: Test Email Client Rendering
- [ ] Use React Email preview mode
- [ ] Check Gmail preview
- [ ] Check Outlook preview
- [ ] Check mobile viewport

#### 7.3: Test End-to-End Flow
- [ ] Start development server with `npm run dev`
- [ ] Create new account via email signup
- [ ] Verify email logged to console (dev mode)
- [ ] Check email content includes all required elements

**Dev Notes:**
- If RESEND_API_KEY is set, actual email will be sent
- Without API key, email details logged to console
- Verify console output matches expected template content

---

## Technical Requirements

### Dependencies

**Already Installed (from Story 4.1):**
- `resend` - Resend SDK
- `@react-email/components` - React Email components
- `react-email` (dev) - Development server

### File Structure

```
src/libs/email/
├── templates/
│   └── WelcomeEmail.tsx        # Welcome email template (NEW)
│   └── WelcomeEmail.test.tsx   # Template tests (NEW)
├── sendWelcomeEmail.ts         # Welcome email helper (NEW)
├── sendWelcomeEmail.test.ts    # Helper tests (NEW)
└── index.ts                    # Updated exports

src/app/api/
├── email/
│   └── welcome/
│       ├── route.ts            # Welcome email API (NEW)
│       └── route.test.ts       # API tests (NEW)
├── auth/
│   ├── callback/
│   │   └── route.ts            # Updated for OAuth welcome email
│   └── verify-complete/
│       └── route.ts            # New verification completion handler (NEW)
```

### Email Template Structure

```
+--------------------------------------------------+
|  [App Logo]                                       |
|                                                   |
|  Welcome to VT SaaS Template!                     |
|                                                   |
|  Hi {name},                                       |
|                                                   |
|  Thanks for signing up! We're excited to have    |
|  you on board.                                    |
|                                                   |
|  Here's what you can do next:                    |
|  - Complete your profile                          |
|  - Explore the dashboard                          |
|  - Try the AI assistant                           |
|                                                   |
|  [  Get Started  ]  <-- CTA Button               |
|                                                   |
|  Need help? Reply to this email or visit our     |
|  support page.                                    |
|                                                   |
|  Cheers,                                         |
|  The VT SaaS Template Team                       |
|                                                   |
|  ─────────────────────────────────────────────── |
|  You're receiving this because you signed up     |
|  for VT SaaS Template.                           |
+--------------------------------------------------+
```

### TypeScript Patterns

**Using Existing WelcomeEmailData Type:**
```typescript
// Already defined in src/libs/email/types.ts
export type WelcomeEmailData = BaseTemplateData & {
  appUrl: string;
  appName: string;
};
```

**Fire-and-Forget Email Pattern:**
```typescript
// Don't block user flow for email sending
sendWelcomeEmail(email, name)
  .catch(err => console.error('Failed to send welcome email:', err));
```

---

## Dev Notes

### Welcome Email Best Practices

**Content Guidelines:**
1. **Subject Line**: Clear, welcoming, includes app name (35-50 chars)
2. **Preview Text**: Compelling snippet for inbox preview
3. **Personalization**: Use name if available, graceful fallback if not
4. **CTA**: Single, prominent call-to-action (dashboard/get started)
5. **Mobile-First**: Design for mobile, test on small screens
6. **Footer**: Include why they received email, support info

### Email Client Quirks

**Gmail:**
- Clips emails over 102KB
- Dark mode inverts some colors

**Outlook:**
- Uses Word rendering engine (limited CSS)
- Tables required for complex layouts
- Some CSS properties ignored

**Apple Mail:**
- Best CSS support
- Dark mode support varies

### Development Workflow

1. Start React Email dev server: `npm run email:dev`
2. Edit template with hot-reload
3. Test in preview mode
4. Run unit tests
5. Test end-to-end with actual signup

### Email Delivery Timing

**Requirement:** Email arrives within 30 seconds

**How to Achieve:**
- Fire-and-forget sending (non-blocking)
- Resend API typically delivers in <10 seconds
- No queuing/batching for welcome emails

### Trigger Point Decision

**Chosen Approach: Auth Flow Integration**

Why this approach:
1. Works for both email/password and OAuth signups
2. No external webhook configuration needed
3. User has verified identity before receiving email
4. Can include user metadata (name) in personalization

**Trade-offs:**
- Slightly more complex than single trigger point
- OAuth: email sent after first successful login
- Email/password: email sent after verification click

### Security Considerations

1. **No PII in URLs**: CTA button links to dashboard, not personalized pages
2. **No Sensitive Data**: Email doesn't contain passwords, tokens
3. **Rate Limiting**: Consider adding rate limiting to API endpoint
4. **Authenticated Endpoint**: Manual trigger requires valid session

---

## Definition of Done

- [ ] Welcome email template created at `src/libs/email/templates/WelcomeEmail.tsx`
- [ ] Template uses React Email components
- [ ] Template includes all required content sections
- [ ] Template is responsive (mobile-friendly)
- [ ] Template follows brand colors and styling
- [ ] `sendWelcomeEmail` helper function created
- [ ] Welcome email API endpoint created
- [ ] OAuth callback sends welcome email to new users
- [ ] Email verification flow sends welcome email
- [ ] Environment variables added/updated
- [ ] Unit tests written and passing
- [ ] Template previewed in React Email dev server
- [ ] Email renders correctly in Gmail, Outlook previews
- [ ] Manual E2E test completed (signup -> email received)
- [ ] All automated tests pass (`npm test`)
- [ ] TypeScript check passes (`npm run check-types`)
- [ ] Linting passes (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Story marked complete in sprint-status.yaml

---

## Dependencies

**Depends On:**
- Story 4.1: Email Infrastructure Setup (COMPLETE)
  - Email service module at `src/libs/email/`
  - `sendEmail()` function
  - `WelcomeEmailData` type
  - React Email dev server

**Blocks:**
- Story 4.3: Email Error Handling & Logging (enhanced patterns)

**External Dependencies:**
- Resend API key (optional for development)
- NEXT_PUBLIC_APP_URL for production email links

---

## References

**Architecture Documents:**
- [Source: Epic 4 - Email Communication System] - Epic requirements
- [Source: Story 4.1 - Email Infrastructure Setup] - Infrastructure details

**Codebase References:**
- `src/libs/email/types.ts` - WelcomeEmailData type definition
- `src/libs/email/sendEmail.ts` - Email sending helper
- `src/app/api/auth/callback/route.ts` - OAuth callback flow
- `src/app/[locale]/(unauth)/(center)/sign-up/page.tsx` - Signup page

**External Documentation:**
- React Email Docs: https://react.email/docs/introduction
- React Email Components: https://react.email/docs/components/html
- Resend Docs: https://resend.com/docs

---

## Story Metadata

**Created:** 2026-01-28
**Epic:** Epic 4 - Email Communication System
**Sprint:** Sprint 4
**Story Points:** 3
**Risk Level:** Low (standard template implementation)
**Technical Debt:** None (greenfield implementation)
**Review Required:** Yes (new transactional email)

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
