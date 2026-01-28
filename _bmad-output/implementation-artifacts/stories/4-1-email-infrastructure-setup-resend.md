# Story 4.1: Email Infrastructure Setup (Resend)

**Epic:** Epic 4 - Email Communication System
**Story ID:** 4.1
**Status:** ready-for-dev
**Assigned To:** backend-developer
**Priority:** High
**Estimate:** 3 story points

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

---

## User Story

As a **template user (developer)**,
I want **email sending infrastructure configured with Resend**,
So that **I can send transactional emails from my application**.

---

## Acceptance Criteria

### AC1: Environment Variable Configuration
**Given** the email system setup
**When** I configure Resend
**Then** RESEND_API_KEY environment variable is documented
**And** .env.example includes the required variable
**And** email sender address is configurable via env var

### AC2: Email Service Module Structure
**Given** the email library setup
**When** I review the code structure
**Then** there is an email service module at `src/libs/email/`
**And** the service abstracts the provider (swappable later)
**And** TypeScript types are defined for email payloads

### AC3: Sender Configuration
**Given** email configuration
**When** I review the sender setup
**Then** FROM address uses a configurable domain
**And** reply-to address is configurable
**And** sender name matches application branding

### AC4: Email Sending Verification
**Given** a test email send
**When** I trigger an email in development
**Then** email is sent successfully via Resend API
**And** delivery status is logged
**And** errors are caught and logged appropriately

### AC5: Email Service API
**Given** the email service
**When** I review the API
**Then** there is a `sendEmail` function accepting template + data
**And** function returns success/failure status
**And** function is async and properly typed

### AC6: Template Development Workflow
**Given** template development workflow
**When** I want to preview email templates
**Then** `npm run email:dev` starts React Email dev server
**And** templates render with hot-reload
**And** I can preview across Gmail, Outlook, Apple Mail views

---

## Context

### Epic Context

**Note:** Email verification and password reset emails are handled natively by Supabase Auth. These templates can be customized via Supabase Dashboard -> Authentication -> Email Templates. This epic focuses on **app-specific transactional emails** only (welcome, receipts, notifications).

**One-off broadcasts:** Use Resend's Audiences feature in their dashboard for marketing emails. No code needed for occasional broadcasts - this keeps the codebase focused on transactional emails.

### Why Resend?

Resend is chosen for this template because:
1. **Developer Experience**: React Email support with hot-reload preview
2. **Modern API**: Simple, well-documented REST API
3. **Generous Free Tier**: 3,000 emails/month free (sufficient for development and small apps)
4. **Deliverability**: Strong focus on deliverability with built-in DKIM, SPF support
5. **React Integration**: Native support for React Email components

### Architecture Pattern

Following the existing pattern established by `src/libs/dify/`:
- Separate `client.ts` for API interaction
- Separate `types.ts` for TypeScript types
- Separate `config.ts` for configuration
- Provider-agnostic interface (swappable implementation)

---

## Tasks

### Task 1: Install Required Dependencies (AC: #2, #6)
**Description:** Install Resend SDK and React Email for template development

#### 1.1: Install Production Dependencies
- [ ] Install Resend SDK: `npm install resend`
- [ ] Install React Email components: `npm install @react-email/components`
- [ ] Verify package.json updated correctly

#### 1.2: Install Development Dependencies
- [ ] Install React Email dev server: `npm install -D react-email`
- [ ] Verify packages install without conflicts

**Dev Notes:**
- React Email provides pre-built components optimized for email clients
- Dev server enables live preview of templates
- Keep production dependencies minimal (only `resend` and `@react-email/components`)

---

### Task 2: Configure Environment Variables (AC: #1, #3)
**Description:** Set up environment variables for Resend configuration

#### 2.1: Update Env Schema
- [ ] File: `src/libs/Env.ts`
- [ ] Add server-side environment variables:
  ```typescript
  // In server section:
  RESEND_API_KEY: z.string().optional(), // Optional for dev mode (console logging)
  EMAIL_FROM_ADDRESS: z.string().email().optional().default('noreply@example.com'),
  EMAIL_FROM_NAME: z.string().optional().default('VT SaaS Template'),
  EMAIL_REPLY_TO: z.string().email().optional(),
  ```
- [ ] Add to runtimeEnv mapping:
  ```typescript
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  ```

#### 2.2: Update .env.example
- [ ] File: `.env.example`
- [ ] Add documented variables:
  ```bash
  # Email (Resend)
  # Get your API key from https://resend.com/api-keys
  RESEND_API_KEY=re_xxxxxxxx
  # Sender configuration (optional - defaults provided)
  EMAIL_FROM_ADDRESS=noreply@yourdomain.com
  EMAIL_FROM_NAME=Your App Name
  EMAIL_REPLY_TO=support@yourdomain.com
  ```

#### 2.3: Document in CLAUDE.md
- [ ] File: `CLAUDE.md`
- [ ] Add email configuration section under Environment Variables:
  ```markdown
  # Email (Resend - Server-side only)
  RESEND_API_KEY=           # Resend API key (optional in dev - logs to console)
  EMAIL_FROM_ADDRESS=       # Sender email (default: noreply@example.com)
  EMAIL_FROM_NAME=          # Sender name (default: VT SaaS Template)
  EMAIL_REPLY_TO=           # Reply-to address (optional)
  ```

**Dev Notes:**
- RESEND_API_KEY is optional to allow development without credentials
- Default values provided for local development
- Keep API key server-side only (never expose to client)

---

### Task 3: Create Email Service Types (AC: #2, #5)
**Description:** Define TypeScript types for email service

#### 3.1: Create Type Definitions
- [ ] File: `src/libs/email/types.ts`
- [ ] Define types:
  ```typescript
  /**
   * Email Service TypeScript Types
   * Provider-agnostic types for email sending
   */

  /**
   * Base email payload (provider-agnostic)
   */
  export type EmailPayload = {
    to: string | string[];
    subject: string;
    react?: React.ReactElement;
    html?: string;
    text?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    tags?: EmailTag[];
  };

  /**
   * Email tag for tracking/categorization
   */
  export type EmailTag = {
    name: string;
    value: string;
  };

  /**
   * Send result (success case)
   */
  export type EmailSendSuccess = {
    success: true;
    messageId: string;
  };

  /**
   * Send result (failure case)
   */
  export type EmailSendFailure = {
    success: false;
    error: string;
    code?: string;
  };

  /**
   * Send result (union type)
   */
  export type EmailSendResult = EmailSendSuccess | EmailSendFailure;

  /**
   * Email configuration
   */
  export type EmailConfig = {
    apiKey?: string;
    fromAddress: string;
    fromName: string;
    replyTo?: string;
  };

  /**
   * Template data types (extend per template)
   */
  export type BaseTemplateData = {
    recipientEmail: string;
    recipientName?: string;
  };

  /**
   * Welcome email template data
   */
  export type WelcomeEmailData = BaseTemplateData & {
    appUrl: string;
    appName: string;
  };
  ```

**Dev Notes:**
- Types are provider-agnostic (no Resend-specific types exposed)
- `react` property allows React Email components
- `html` and `text` provide fallback options
- Result type uses discriminated union for type-safe error handling

---

### Task 4: Create Email Configuration (AC: #3)
**Description:** Create configuration module for email settings

#### 4.1: Create Configuration Module
- [ ] File: `src/libs/email/config.ts`
- [ ] Implement configuration:
  ```typescript
  import { Env } from '../Env';
  import type { EmailConfig } from './types';

  /**
   * Email configuration loaded from environment variables
   * Provides sensible defaults for development
   */
  export const EMAIL_CONFIG: EmailConfig = {
    apiKey: Env.RESEND_API_KEY,
    fromAddress: Env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    fromName: Env.EMAIL_FROM_NAME || 'VT SaaS Template',
    replyTo: Env.EMAIL_REPLY_TO,
  };

  /**
   * Check if email sending is enabled (API key present)
   */
  export function isEmailEnabled(): boolean {
    return !!EMAIL_CONFIG.apiKey;
  }

  /**
   * Get formatted FROM address (e.g., "App Name <email@domain.com>")
   */
  export function getFromAddress(): string {
    return `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromAddress}>`;
  }
  ```

**Dev Notes:**
- Configuration centralized similar to `src/libs/dify/config.ts` pattern
- Helper functions for common operations
- Development mode detection via API key presence

---

### Task 5: Create Email Client (AC: #2, #4, #5)
**Description:** Create the main email client with provider abstraction

#### 5.1: Create Email Client
- [ ] File: `src/libs/email/client.ts`
- [ ] Implement client:
  ```typescript
  import { Resend } from 'resend';

  import { logger } from '../Logger';
  import { EMAIL_CONFIG, getFromAddress, isEmailEnabled } from './config';
  import type { EmailPayload, EmailSendResult } from './types';

  /**
   * Email Client
   * Abstracts email provider (currently Resend) with development fallback
   */
  export class EmailClient {
    private readonly resend: Resend | null;
    private readonly isDevelopment: boolean;

    constructor() {
      this.isDevelopment = process.env.NODE_ENV === 'development';

      if (isEmailEnabled()) {
        this.resend = new Resend(EMAIL_CONFIG.apiKey);
      } else {
        this.resend = null;
        if (this.isDevelopment) {
          logger.warn('Email API key not configured - emails will be logged to console');
        }
      }
    }

    /**
     * Send an email
     * In development without API key: logs email to console
     * In production without API key: returns error
     */
    async send(payload: EmailPayload): Promise<EmailSendResult> {
      const from = getFromAddress();
      const replyTo = payload.replyTo || EMAIL_CONFIG.replyTo;

      // Development mode without API key: log to console
      if (!this.resend) {
        return this.handleDevModeSend(payload, from, replyTo);
      }

      // Production mode: send via Resend
      return this.handleResendSend(payload, from, replyTo);
    }

    /**
     * Development mode: log email to console instead of sending
     */
    private handleDevModeSend(
      payload: EmailPayload,
      from: string,
      replyTo?: string
    ): EmailSendResult {
      if (!this.isDevelopment) {
        logger.error({ payload }, 'Email sending failed: API key not configured');
        return {
          success: false,
          error: 'Email API key not configured',
          code: 'API_KEY_MISSING',
        };
      }

      // Log email details for development
      logger.info({
        type: 'email_dev_mode',
        from,
        to: payload.to,
        subject: payload.subject,
        replyTo,
        hasReact: !!payload.react,
        hasHtml: !!payload.html,
        hasText: !!payload.text,
      }, 'Email logged (dev mode - not sent)');

      // Return mock success with fake message ID
      return {
        success: true,
        messageId: `dev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    /**
     * Production mode: send via Resend API
     */
    private async handleResendSend(
      payload: EmailPayload,
      from: string,
      replyTo?: string
    ): Promise<EmailSendResult> {
      try {
        const { data, error } = await this.resend!.emails.send({
          from,
          to: payload.to,
          subject: payload.subject,
          react: payload.react,
          html: payload.html,
          text: payload.text,
          replyTo,
          cc: payload.cc,
          bcc: payload.bcc,
          tags: payload.tags,
        });

        if (error) {
          logger.error({
            error,
            to: this.hashEmail(payload.to),
            subject: payload.subject,
          }, 'Email send failed');

          return {
            success: false,
            error: error.message,
            code: error.name,
          };
        }

        logger.info({
          type: 'email_sent',
          messageId: data?.id,
          to: this.hashEmail(payload.to),
          subject: payload.subject,
        }, 'Email sent successfully');

        return {
          success: true,
          messageId: data?.id || 'unknown',
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        logger.error({
          error: errorMessage,
          to: this.hashEmail(payload.to),
          subject: payload.subject,
        }, 'Email send exception');

        return {
          success: false,
          error: errorMessage,
          code: 'SEND_EXCEPTION',
        };
      }
    }

    /**
     * Hash email for logging (privacy)
     */
    private hashEmail(email: string | string[]): string {
      const addr = Array.isArray(email) ? email[0] : email;
      if (!addr) return 'unknown';

      const [local, domain] = addr.split('@');
      if (!local || !domain) return 'invalid';

      const maskedLocal = local.substring(0, 2) + '***';
      return `${maskedLocal}@${domain}`;
    }
  }

  /**
   * Create email client instance
   */
  export function createEmailClient(): EmailClient {
    return new EmailClient();
  }

  /**
   * Singleton email client for convenience
   */
  let emailClient: EmailClient | null = null;

  export function getEmailClient(): EmailClient {
    if (!emailClient) {
      emailClient = createEmailClient();
    }
    return emailClient;
  }
  ```

**Test Coverage:**
- Unit test for development mode (console logging)
- Unit test for error handling (API key missing in production)
- Unit test for email hashing function
- Mock Resend SDK for API tests

**Dev Notes:**
- Follows DifyClient pattern from `src/libs/dify/client.ts`
- Privacy-aware logging (hashed email addresses)
- Graceful development mode (no API key required)
- Singleton pattern for convenience, factory for testing

---

### Task 6: Create Module Index Export (AC: #2)
**Description:** Create clean public API for email module

#### 6.1: Create Index File
- [ ] File: `src/libs/email/index.ts`
- [ ] Export public API:
  ```typescript
  /**
   * Email Module
   *
   * Usage:
   * ```typescript
   * import { getEmailClient, type EmailPayload } from '@/libs/email';
   *
   * const result = await getEmailClient().send({
   *   to: 'user@example.com',
   *   subject: 'Hello',
   *   react: <WelcomeEmail name="John" />,
   * });
   *
   * if (result.success) {
   *   console.log('Sent:', result.messageId);
   * } else {
   *   console.error('Failed:', result.error);
   * }
   * ```
   */

  // Client
  export { createEmailClient, EmailClient, getEmailClient } from './client';

  // Configuration
  export { EMAIL_CONFIG, getFromAddress, isEmailEnabled } from './config';

  // Types
  export type {
    BaseTemplateData,
    EmailConfig,
    EmailPayload,
    EmailSendFailure,
    EmailSendResult,
    EmailSendSuccess,
    EmailTag,
    WelcomeEmailData,
  } from './types';
  ```

**Dev Notes:**
- Clean barrel export pattern
- JSDoc with usage example
- Types exported for consumers

---

### Task 7: Add NPM Script for Email Development (AC: #6)
**Description:** Configure React Email dev server for template preview

#### 7.1: Update package.json
- [ ] File: `package.json`
- [ ] Add script:
  ```json
  {
    "scripts": {
      "email:dev": "email dev --dir src/libs/email/templates --port 3001"
    }
  }
  ```

#### 7.2: Create Templates Directory Structure
- [ ] Create directory: `src/libs/email/templates/`
- [ ] Create placeholder file: `src/libs/email/templates/.gitkeep`

**Dev Notes:**
- Port 3001 to avoid conflict with Next.js dev server (3000)
- Templates directory will hold React Email components
- Story 4.2 will add actual welcome email template

---

### Task 8: Create Utility Functions (AC: #5)
**Description:** Create convenience functions for common email operations

#### 8.1: Create Send Email Helper
- [ ] File: `src/libs/email/sendEmail.ts`
- [ ] Implement helper:
  ```typescript
  import type { ReactElement } from 'react';

  import { getEmailClient } from './client';
  import type { EmailSendResult, EmailTag } from './types';

  /**
   * Send an email with React Email template
   *
   * @param to - Recipient email address(es)
   * @param subject - Email subject line
   * @param template - React Email component
   * @param options - Optional settings (replyTo, cc, bcc, tags)
   * @returns Email send result
   *
   * @example
   * ```typescript
   * const result = await sendEmail(
   *   'user@example.com',
   *   'Welcome!',
   *   <WelcomeEmail name="John" />
   * );
   * ```
   */
  export async function sendEmail(
    to: string | string[],
    subject: string,
    template: ReactElement,
    options?: {
      replyTo?: string;
      cc?: string | string[];
      bcc?: string | string[];
      tags?: EmailTag[];
    }
  ): Promise<EmailSendResult> {
    return getEmailClient().send({
      to,
      subject,
      react: template,
      ...options,
    });
  }

  /**
   * Send a plain text email (no template)
   *
   * @param to - Recipient email address(es)
   * @param subject - Email subject line
   * @param text - Plain text content
   * @param html - Optional HTML content
   * @returns Email send result
   */
  export async function sendPlainEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string
  ): Promise<EmailSendResult> {
    return getEmailClient().send({
      to,
      subject,
      text,
      html,
    });
  }
  ```

#### 8.2: Update Index Exports
- [ ] File: `src/libs/email/index.ts`
- [ ] Add exports:
  ```typescript
  export { sendEmail, sendPlainEmail } from './sendEmail';
  ```

**Test Coverage:**
- Unit test sendEmail function with mock client
- Unit test sendPlainEmail function
- Test options are properly passed through

**Dev Notes:**
- Convenience wrapper for common use case
- JSDoc with usage examples
- Maintains full flexibility via options

---

### Task 9: Write Unit Tests (AC: All)
**Description:** Create comprehensive test coverage for email module

#### 9.1: Test Email Client
- [ ] File: `src/libs/email/client.test.ts`
- [ ] Test cases:
  - [ ] Development mode logs email to console (no API key)
  - [ ] Production mode returns error without API key
  - [ ] Successful email send returns messageId
  - [ ] Failed email send returns error details
  - [ ] Email hashing function masks addresses correctly
  - [ ] Configuration is properly loaded

#### 9.2: Test Email Configuration
- [ ] File: `src/libs/email/config.test.ts`
- [ ] Test cases:
  - [ ] Default values used when env vars missing
  - [ ] isEmailEnabled returns correct value
  - [ ] getFromAddress formats correctly

#### 9.3: Test Send Email Helpers
- [ ] File: `src/libs/email/sendEmail.test.ts`
- [ ] Test cases:
  - [ ] sendEmail calls client with correct payload
  - [ ] sendPlainEmail includes text and html
  - [ ] Options are passed through correctly

**Dev Notes:**
- Mock Resend SDK to avoid actual API calls
- Test both success and failure paths
- Verify logging output in dev mode

---

### Task 10: Update Documentation (AC: #1)
**Description:** Document email infrastructure for template users

#### 10.1: Update CLAUDE.md
- [ ] File: `CLAUDE.md`
- [ ] Add Email section under "Core Architecture":
  ```markdown
  ### Email Integration
  - **Provider**: Resend (https://resend.com)
  - **Email Service**: `src/libs/email/`
    - Client for sending emails (provider-agnostic interface)
    - React Email templates in `templates/` subdirectory
    - TypeScript types for email payloads
  - **Development**: `npm run email:dev` starts template preview server
  - **Configuration**: Environment variables for sender settings
  ```

#### 10.2: Add Email Handling Guide
- [ ] Add section to CLAUDE.md - "Adding New Email Templates":
  ```markdown
  ### Adding New Email Templates
  1. Create template in `src/libs/email/templates/YourTemplate.tsx`
  2. Use React Email components from `@react-email/components`
  3. Preview with `npm run email:dev` (hot-reload)
  4. Send with:
     ```typescript
     import { sendEmail } from '@/libs/email';
     import { YourTemplate } from '@/libs/email/templates/YourTemplate';

     await sendEmail(
       'recipient@example.com',
       'Subject Line',
       <YourTemplate data={yourData} />
     );
     ```
  ```

**Dev Notes:**
- Keep documentation concise but complete
- Include code examples
- Link to Resend and React Email docs

---

## Technical Requirements

### Dependencies

**Production:**
- `resend` - Resend SDK for email sending
- `@react-email/components` - Pre-built email components

**Development:**
- `react-email` - Development server for template preview

### File Structure

```
src/libs/email/
├── index.ts                    # Public API exports
├── client.ts                   # EmailClient class
├── client.test.ts              # Client unit tests
├── config.ts                   # Configuration module
├── config.test.ts              # Config unit tests
├── types.ts                    # TypeScript types
├── sendEmail.ts                # Convenience functions
├── sendEmail.test.ts           # Helper unit tests
└── templates/
    └── .gitkeep                # Placeholder (Story 4.2 adds templates)
```

### Environment Variables

```bash
# Required for production
RESEND_API_KEY=re_xxxxxxxx

# Optional (defaults provided)
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
EMAIL_REPLY_TO=support@yourdomain.com
```

### TypeScript Patterns

**Discriminated Union for Results:**
```typescript
type EmailSendResult = EmailSendSuccess | EmailSendFailure;

// Type-safe handling:
if (result.success) {
  console.log(result.messageId); // TypeScript knows messageId exists
} else {
  console.error(result.error);   // TypeScript knows error exists
}
```

**React Email Templates:**
```typescript
import { Html, Head, Body, Container, Text } from '@react-email/components';

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Welcome, {name}!</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Dev Notes

### Architecture Pattern Alignment

**Following Existing Patterns:**
This module follows the established pattern from `src/libs/dify/`:
- `client.ts` - Main API client class
- `config.ts` - Environment-based configuration
- `types.ts` - TypeScript type definitions
- `index.ts` - Clean barrel exports

**Provider Abstraction:**
The EmailClient interface is provider-agnostic. To switch from Resend to another provider (e.g., SendGrid, AWS SES):
1. Create new implementation in `client.ts`
2. Keep same `EmailPayload` and `EmailSendResult` types
3. No changes needed in consuming code

### Development Mode Behavior

**Without API Key:**
- Emails logged to console with full details
- Returns mock success with fake message ID
- Allows development without Resend account
- Warning logged on client initialization

**With API Key:**
- Full email functionality
- Real delivery via Resend API
- Proper logging with hashed email addresses

### Logging Strategy

**Privacy-Aware Logging:**
- Email addresses hashed in logs: `jo***@example.com`
- Full subject lines logged (useful for debugging)
- Message IDs logged for tracking
- Structured JSON logs for parsing

**Log Levels:**
- `info` - Successful sends, dev mode logging
- `warn` - API key missing in development
- `error` - Send failures, exceptions

### Error Handling

**Error Types:**
- `API_KEY_MISSING` - No API key in production
- `SEND_EXCEPTION` - Unexpected error during send
- Resend error codes pass through (e.g., `validation_error`)

**Graceful Degradation:**
- Never throw exceptions from send
- Always return `EmailSendResult`
- Calling code can decide how to handle failures

### Testing Strategy

**Unit Tests:**
- Mock Resend SDK
- Test all code paths
- Verify logging output
- Test configuration loading

**Integration Tests (Manual):**
- Send test email in development
- Verify console output
- Send real email with API key
- Verify delivery

### Common Pitfalls to Avoid

1. **Exposing API Key:**
   - Never use NEXT_PUBLIC_ prefix
   - Only access in server-side code
   - API key is optional for client import safety

2. **Logging Sensitive Data:**
   - Hash email addresses
   - Don't log email content
   - Don't log API keys

3. **Blocking Operations:**
   - Email sending is async
   - Don't await in request handlers unless needed
   - Consider background jobs for bulk sends

4. **Template Development:**
   - Use React Email dev server for preview
   - Test in multiple email clients
   - Keep styles inline (email client compatibility)

### React Email Best Practices

**Supported Components:**
- `Html`, `Head`, `Body` - Document structure
- `Container`, `Section`, `Row`, `Column` - Layout
- `Text`, `Heading`, `Link`, `Button` - Content
- `Img` - Images (use absolute URLs)
- `Preview` - Email preview text (inbox snippet)

**Email Client Compatibility:**
- Inline styles only (most email clients strip `<style>`)
- Tables for complex layouts (Outlook compatibility)
- Test in Gmail, Outlook, Apple Mail
- Use React Email preview for cross-client testing

---

## Definition of Done

- [ ] Resend and React Email packages installed
- [ ] Environment variables configured in Env.ts
- [ ] .env.example updated with email variables
- [ ] Email service module created at `src/libs/email/`
- [ ] EmailClient class implements provider abstraction
- [ ] TypeScript types defined for all payloads
- [ ] Configuration supports FROM, reply-to, sender name
- [ ] Development mode logs emails to console
- [ ] Production mode sends via Resend API
- [ ] `npm run email:dev` script works
- [ ] Unit tests written and passing
- [ ] CLAUDE.md documentation updated
- [ ] All automated tests pass (`npm test`)
- [ ] TypeScript check passes (`npm run check-types`)
- [ ] Linting passes (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Manual verification: dev mode console logging works
- [ ] Story marked complete in sprint-status.yaml

---

## Dependencies

**Depends On:**
- Story 1.1: Next.js 15 (for latest patterns)
- Story 1.4: TypeScript 5.7+ (for strict type safety)
- Story 1.7: API Error Handling (for consistent error patterns)

**Blocks:**
- Story 4.2: Welcome Email Template (needs infrastructure)
- Story 4.3: Email Error Handling & Logging (builds on this)

**External Dependencies:**
- Resend account (free tier: https://resend.com)
- Domain verification (for production sends)

---

## References

**Architecture Documents:**
- [Source: /architecture/core-architectural-decisions.md] - Service abstraction patterns
- [Source: src/libs/dify/client.ts] - Similar client pattern to follow
- [Source: src/libs/Env.ts] - Environment variable patterns

**External Documentation:**
- Resend SDK: https://resend.com/docs/sdks/node-js
- React Email: https://react.email/docs/introduction
- React Email Components: https://react.email/docs/components/html

**Related Stories:**
- Story 4.2: Welcome Email Template (next in epic)
- Story 4.3: Email Error Handling & Logging (enhancement)

---

## Story Metadata

**Created:** 2026-01-28
**Epic:** Epic 4 - Email Communication System
**Sprint:** Sprint 4
**Story Points:** 3
**Risk Level:** Low (standard library integration)
**Technical Debt:** None (greenfield implementation)
**Review Required:** Yes (new infrastructure module)

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
