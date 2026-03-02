# Epic 4: Email Communication System

**Goal:** Users receive professional transactional emails

> **Note:** Email verification and password reset emails are handled natively by Supabase Auth.
> These templates can be customized via Supabase Dashboard → Authentication → Email Templates.
> This epic focuses on **app-specific transactional emails** only (welcome, receipts, notifications).

> **One-off broadcasts:** Use Resend's Audiences feature in their dashboard for marketing emails.
> No code needed for occasional broadcasts - this keeps the codebase focused on transactional emails.

## Story 4.1: Email Infrastructure Setup (Resend)

As a **template user (developer)**,
I want **email sending infrastructure configured with Resend**,
So that **I can send transactional emails from my application**.

**Acceptance Criteria:**

**Given** the email system setup
**When** I configure Resend
**Then** RESEND_API_KEY environment variable is documented
**And** .env.example includes the required variable
**And** email sender address is configurable via env var

**Given** the email library setup
**When** I review the code structure
**Then** there is an email service module at `src/libs/email/`
**And** the service abstracts the provider (swappable later)
**And** TypeScript types are defined for email payloads

**Given** email configuration
**When** I review the sender setup
**Then** FROM address uses a configurable domain
**And** reply-to address is configurable
**And** sender name matches application branding

**Given** a test email send
**When** I trigger an email in development
**Then** email is sent successfully via Resend API
**And** delivery status is logged
**And** errors are caught and logged appropriately

**Given** the email service
**When** I review the API
**Then** there is a `sendEmail` function accepting template + data
**And** function returns success/failure status
**And** function is async and properly typed

**Given** template development workflow
**When** I want to preview email templates
**Then** `npm run email:dev` starts React Email dev server
**And** templates render with hot-reload
**And** I can preview across Gmail, Outlook, Apple Mail views

---

## Story 4.2: Welcome Email Template

As a **new user who just signed up**,
I want **to receive a professional welcome email**,
So that **I feel welcomed and know my account was created**.

**Acceptance Criteria:**

**Given** a user completes registration
**When** their account is created
**Then** a welcome email is sent to their address
**And** the email arrives within 30 seconds

**Given** the welcome email
**When** I view it in my inbox
**Then** subject line is welcoming (e.g., "Welcome to VT SaaS Template!")
**And** sender name is the application name
**And** email renders correctly in major clients (Gmail, Outlook)

**Given** the welcome email content
**When** I read the email
**Then** I see a personalized greeting (if name available)
**And** I see brief info about getting started
**And** I see a CTA button to access the app
**And** I see contact/support information

**Given** the welcome email template
**When** I review the code
**Then** template is built with React Email
**And** template is in `src/libs/email/templates/`
**And** template uses consistent branding (colors, logo)
**And** template is responsive (mobile-friendly)

**Given** the welcome email
**When** I view it on mobile
**Then** layout adapts properly
**And** CTA button is tap-friendly
**And** text is readable without zooming

---

## Story 4.3: Email Error Handling & Logging

As a **developer maintaining the application**,
I want **robust error handling for email sending**,
So that **I can diagnose issues and ensure reliability**.

**Acceptance Criteria:**

**Given** an email send fails
**When** the Resend API returns an error
**Then** the error is caught gracefully
**And** error details are logged with context
**And** the calling code receives failure status
**And** user experience degrades gracefully (no crash)

**Given** email sending
**When** any email is sent (success or failure)
**Then** event is logged with: type, recipient (hashed), status, timestamp
**And** logs are structured (JSON format)
**And** sensitive data is not logged (full email, tokens)

**Given** a transient email failure
**When** Resend returns a retryable error
**Then** retry is attempted (up to 3 times)
**And** exponential backoff is used between retries
**And** final failure is logged if all retries fail

**Given** critical email failures (welcome, receipts)
**When** emails fail to send
**Then** failure is logged with full context for debugging
**And** user action completes successfully (email is non-blocking)
**And** no silent failures - all failures are tracked

**Given** email sending in development
**When** RESEND_API_KEY is not set
**Then** emails are logged to console instead of sending
**And** developer can see email content locally
**And** no errors thrown for missing API key in dev

---
