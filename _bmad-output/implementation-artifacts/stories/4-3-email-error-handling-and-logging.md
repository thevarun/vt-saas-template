# Story 4.3: Email Error Handling & Logging

**Epic:** Epic 4 - Email Communication System
**Story ID:** 4.3
**Status:** done
**Assigned To:** backend-developer
**Priority:** High
**Estimate:** 3 story points

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

---

## User Story

As a **developer maintaining the application**,
I want **robust error handling for email sending**,
So that **I can diagnose issues and ensure reliability**.

---

## Acceptance Criteria

### AC1: Graceful Error Handling
**Given** an email send fails
**When** the Resend API returns an error
**Then** the error is caught gracefully
**And** error details are logged with context
**And** the calling code receives failure status
**And** user experience degrades gracefully (no crash)

### AC2: Structured Logging
**Given** email sending
**When** any email is sent (success or failure)
**Then** event is logged with: type, recipient (hashed), status, timestamp
**And** logs are structured (JSON format)
**And** sensitive data is not logged (full email, tokens)

### AC3: Retry Logic with Exponential Backoff
**Given** a transient email failure
**When** Resend returns a retryable error
**Then** retry is attempted (up to 3 times)
**And** exponential backoff is used between retries
**And** final failure is logged if all retries fail

### AC4: Critical Email Failure Handling
**Given** critical email failures (welcome, receipts)
**When** emails fail to send
**Then** failure is logged with full context for debugging
**And** user action completes successfully (email is non-blocking)
**And** no silent failures - all failures are tracked

### AC5: Development Mode Console Output
**Given** email sending in development
**When** RESEND_API_KEY is not set
**Then** emails are logged to console instead of sending
**And** developer can see email content locally
**And** no errors thrown for missing API key in dev

---

## Context

### Epic Context

**Note:** Email verification and password reset emails are handled natively by Supabase Auth. These templates can be customized via Supabase Dashboard -> Authentication -> Email Templates. This epic focuses on **app-specific transactional emails** only (welcome, receipts, notifications).

### Prerequisites

Stories 4.1 and 4.2 are **complete**. The following infrastructure is available:

- **Email Service**: `src/libs/email/` with `EmailClient` class
- **Existing Error Handling**: Basic try-catch with logging in `client.ts`
- **Types**: `EmailSendResult` discriminated union (success/failure)
- **Dev Mode**: Already logs to console when `RESEND_API_KEY` is missing
- **Privacy**: Email hashing already implemented (`hashEmail` method)
- **Logger**: Pino logger at `src/libs/Logger.ts` with JSON structured output

### Current State Analysis

**What Already Exists (Story 4.1/4.2):**

```typescript
// src/libs/email/client.ts - Current error handling
private async handleResendSend(payload, from, replyTo): Promise<EmailSendResult> {
  try {
    const { data, error } = await this.resend!.emails.send({...});

    if (error) {
      logger.error({ error, to: this.hashEmail(payload.to), subject: payload.subject }, 'Email send failed');
      return { success: false, error: error.message, code: error.name };
    }

    logger.info({ type: 'email_sent', messageId: data?.id, ... }, 'Email sent successfully');
    return { success: true, messageId: data?.id || 'unknown' };
  } catch (err) {
    logger.error({ error: errorMessage, ... }, 'Email send exception');
    return { success: false, error: errorMessage, code: 'SEND_EXCEPTION' };
  }
}
```

**What This Story Adds:**

1. **Retry Logic**: Wrap send operation with configurable retry mechanism
2. **Enhanced Logging**: More structured fields, email type tracking
3. **Error Classification**: Identify retryable vs non-retryable errors
4. **Dev Mode Enhancement**: Show rendered email content in console
5. **Non-blocking Pattern**: Document and enhance fire-and-forget pattern

### Resend API Error Types

Reference for implementing retry logic:

| Error Type | Retryable | Description |
|------------|-----------|-------------|
| `rate_limit_exceeded` | Yes | Too many requests, retry after delay |
| `temporarily_unavailable` | Yes | Service temporarily down |
| `internal_server_error` | Yes | Resend internal error |
| `validation_error` | No | Invalid request data |
| `missing_required_fields` | No | Missing required fields |
| `invalid_api_key` | No | Authentication error |
| `domain_not_verified` | No | Domain configuration issue |

---

## Tasks

### Task 1: Create Retry Utility Module (AC: #3)
**Description:** Create a reusable retry utility with exponential backoff

#### 1.1: Create Retry Utility
- [ ] File: `src/libs/email/retry.ts`
- [ ] Implement retry utility:
  ```typescript
  import { logger } from '../Logger';

  /**
   * Retry configuration
   */
  export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    retryableErrors: string[];
  }

  /**
   * Default retry configuration for email sending
   */
  export const DEFAULT_EMAIL_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,      // 1 second
    maxDelayMs: 10000,      // 10 seconds max
    retryableErrors: [
      'rate_limit_exceeded',
      'temporarily_unavailable',
      'internal_server_error',
      'SEND_EXCEPTION',     // Network errors, timeouts
    ],
  };

  /**
   * Calculate exponential backoff delay
   * Formula: min(baseDelay * 2^attempt, maxDelay) + jitter
   */
  export function calculateBackoffDelay(
    attempt: number,
    config: RetryConfig
  ): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
    // Add jitter (0-25% of delay) to prevent thundering herd
    const jitter = cappedDelay * Math.random() * 0.25;
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Check if an error is retryable
   */
  export function isRetryableError(
    errorCode: string | undefined,
    config: RetryConfig
  ): boolean {
    if (!errorCode) return false;
    return config.retryableErrors.includes(errorCode);
  }

  /**
   * Sleep for specified milliseconds
   */
  export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute an async operation with retry logic
   */
  export async function withRetry<T>(
    operation: () => Promise<T>,
    isSuccess: (result: T) => boolean,
    getErrorCode: (result: T) => string | undefined,
    config: RetryConfig = DEFAULT_EMAIL_RETRY_CONFIG,
    context?: Record<string, unknown>
  ): Promise<{ result: T; attempts: number }> {
    let lastResult: T;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      lastResult = await operation();

      if (isSuccess(lastResult)) {
        if (attempt > 0) {
          logger.info({
            type: 'retry_success',
            attempt: attempt + 1,
            ...context,
          }, 'Operation succeeded after retry');
        }
        return { result: lastResult, attempts: attempt + 1 };
      }

      const errorCode = getErrorCode(lastResult);
      const isLastAttempt = attempt === config.maxAttempts - 1;

      if (!isRetryableError(errorCode, config) || isLastAttempt) {
        if (isLastAttempt && isRetryableError(errorCode, config)) {
          logger.error({
            type: 'retry_exhausted',
            attempts: config.maxAttempts,
            errorCode,
            ...context,
          }, 'All retry attempts exhausted');
        }
        return { result: lastResult, attempts: attempt + 1 };
      }

      const delay = calculateBackoffDelay(attempt, config);
      logger.warn({
        type: 'retry_attempt',
        attempt: attempt + 1,
        nextAttempt: attempt + 2,
        delayMs: delay,
        errorCode,
        ...context,
      }, 'Retrying operation after transient failure');

      await sleep(delay);
    }

    return { result: lastResult!, attempts: config.maxAttempts };
  }
  ```

#### 1.2: Write Retry Utility Tests
- [ ] File: `src/libs/email/retry.test.ts`
- [ ] Test cases:
  - [ ] `calculateBackoffDelay` returns increasing delays
  - [ ] `calculateBackoffDelay` caps at maxDelay
  - [ ] `isRetryableError` correctly identifies retryable errors
  - [ ] `withRetry` succeeds on first attempt (no retry)
  - [ ] `withRetry` retries on retryable error
  - [ ] `withRetry` stops on non-retryable error
  - [ ] `withRetry` exhausts all attempts on persistent failure
  - [ ] Backoff delay includes jitter

**Dev Notes:**
- Generic retry utility can be reused for other API calls
- Jitter prevents thundering herd problem
- Configurable for different retry strategies

---

### Task 2: Create Enhanced Email Logger (AC: #2, #4)
**Description:** Create a dedicated email logging module with structured output

#### 2.1: Create Email Logger
- [ ] File: `src/libs/email/emailLogger.ts`
- [ ] Implement structured email logging:
  ```typescript
  import { logger } from '../Logger';

  /**
   * Email event types for structured logging
   */
  export type EmailEventType =
    | 'email_queued'
    | 'email_sent'
    | 'email_failed'
    | 'email_retry'
    | 'email_dev_mode';

  /**
   * Email log context
   */
  export interface EmailLogContext {
    type: EmailEventType;
    emailType: string;           // 'welcome', 'receipt', etc.
    recipient: string;           // Hashed email
    subject?: string;
    messageId?: string;
    status: 'success' | 'failure' | 'retry' | 'dev_mode';
    attempt?: number;
    totalAttempts?: number;
    errorCode?: string;
    errorMessage?: string;
    durationMs?: number;
  }

  /**
   * Hash email address for privacy-aware logging
   * Format: first 2 chars + *** + @domain
   */
  export function hashEmailForLog(email: string | string[]): string {
    const addr = Array.isArray(email) ? email[0] : email;
    if (!addr) return 'unknown';

    const [local, domain] = addr.split('@');
    if (!local || !domain) return 'invalid';

    const maskedLocal = `${local.substring(0, 2)}***`;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Log email event with structured context
   */
  export function logEmailEvent(context: EmailLogContext): void {
    const logData = {
      ...context,
      timestamp: new Date().toISOString(),
    };

    switch (context.status) {
      case 'success':
        logger.info(logData, `Email sent: ${context.emailType}`);
        break;
      case 'failure':
        logger.error(logData, `Email failed: ${context.emailType}`);
        break;
      case 'retry':
        logger.warn(logData, `Email retry: ${context.emailType}`);
        break;
      case 'dev_mode':
        logger.info(logData, `Email logged (dev mode): ${context.emailType}`);
        break;
    }
  }

  /**
   * Log email send attempt start (for duration tracking)
   */
  export function createEmailTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
  ```

#### 2.2: Write Email Logger Tests
- [ ] File: `src/libs/email/emailLogger.test.ts`
- [ ] Test cases:
  - [ ] `hashEmailForLog` masks email correctly
  - [ ] `hashEmailForLog` handles array of emails
  - [ ] `hashEmailForLog` handles invalid/missing email
  - [ ] `logEmailEvent` logs success with correct level
  - [ ] `logEmailEvent` logs failure with correct level
  - [ ] `logEmailEvent` includes timestamp
  - [ ] `createEmailTimer` measures duration

**Dev Notes:**
- Structured logging enables log aggregation and querying
- Email type field enables filtering by email category
- Duration tracking helps identify slow sends

---

### Task 3: Update EmailClient with Retry Logic (AC: #1, #3, #4)
**Description:** Integrate retry logic into the EmailClient class

#### 3.1: Update EmailClient
- [ ] File: `src/libs/email/client.ts`
- [ ] Add retry support:
  ```typescript
  import { Resend } from 'resend';

  import { logger } from '../Logger';
  import { EMAIL_CONFIG, getFromAddress, isEmailEnabled } from './config';
  import {
    createEmailTimer,
    hashEmailForLog,
    logEmailEvent,
  } from './emailLogger';
  import {
    DEFAULT_EMAIL_RETRY_CONFIG,
    type RetryConfig,
    withRetry,
  } from './retry';
  import type { EmailPayload, EmailSendResult } from './types';

  /**
   * Email send options
   */
  export interface EmailSendOptions {
    /** Email type for logging/tracking (e.g., 'welcome', 'receipt') */
    emailType?: string;
    /** Custom retry configuration */
    retryConfig?: Partial<RetryConfig>;
    /** Disable retry for this send */
    disableRetry?: boolean;
  }

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
     * Send an email with optional retry logic
     * In development without API key: logs email to console
     * In production without API key: returns error
     */
    async send(
      payload: EmailPayload,
      options: EmailSendOptions = {}
    ): Promise<EmailSendResult> {
      const from = getFromAddress();
      const replyTo = payload.replyTo || EMAIL_CONFIG.replyTo;
      const emailType = options.emailType || 'generic';
      const getTimer = createEmailTimer();

      // Development mode without API key: log to console
      if (!this.resend) {
        return this.handleDevModeSend(payload, from, replyTo, emailType);
      }

      // Production mode: send via Resend with retry
      if (options.disableRetry) {
        return this.handleResendSend(payload, from, replyTo, emailType, getTimer);
      }

      // Send with retry logic
      const retryConfig = {
        ...DEFAULT_EMAIL_RETRY_CONFIG,
        ...options.retryConfig,
      };

      const { result, attempts } = await withRetry(
        () => this.handleResendSend(payload, from, replyTo, emailType, getTimer),
        (result) => result.success,
        (result) => (!result.success ? result.code : undefined),
        retryConfig,
        { emailType, recipient: hashEmailForLog(payload.to) }
      );

      // Log final result with attempt info
      if (!result.success && attempts > 1) {
        logEmailEvent({
          type: 'email_failed',
          emailType,
          recipient: hashEmailForLog(payload.to),
          subject: payload.subject,
          status: 'failure',
          totalAttempts: attempts,
          errorCode: result.code,
          errorMessage: result.error,
        });
      }

      return result;
    }

    /**
     * Development mode: log email to console instead of sending
     * Enhanced to show more details for debugging
     */
    private handleDevModeSend(
      payload: EmailPayload,
      from: string,
      replyTo?: string,
      emailType: string = 'generic'
    ): EmailSendResult {
      if (!this.isDevelopment) {
        logEmailEvent({
          type: 'email_failed',
          emailType,
          recipient: hashEmailForLog(payload.to),
          subject: payload.subject,
          status: 'failure',
          errorCode: 'API_KEY_MISSING',
          errorMessage: 'Email API key not configured',
        });
        return {
          success: false,
          error: 'Email API key not configured',
          code: 'API_KEY_MISSING',
        };
      }

      // Enhanced dev mode logging with email content preview
      console.log('\n' + '='.repeat(60));
      console.log('EMAIL (DEV MODE - NOT SENT)');
      console.log('='.repeat(60));
      console.log(`Type:     ${emailType}`);
      console.log(`From:     ${from}`);
      console.log(`To:       ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`);
      console.log(`Subject:  ${payload.subject}`);
      if (replyTo) console.log(`Reply-To: ${replyTo}`);
      if (payload.cc) console.log(`CC:       ${Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc}`);
      if (payload.bcc) console.log(`BCC:      ${Array.isArray(payload.bcc) ? payload.bcc.join(', ') : payload.bcc}`);
      console.log('-'.repeat(60));
      if (payload.text) {
        console.log('CONTENT (Plain Text):');
        console.log(payload.text.substring(0, 500) + (payload.text.length > 500 ? '...' : ''));
      }
      if (payload.react) {
        console.log('CONTENT: React Email template (render with npm run email:dev)');
      }
      if (payload.html) {
        console.log('CONTENT (HTML): [HTML content truncated]');
      }
      console.log('='.repeat(60) + '\n');

      logEmailEvent({
        type: 'email_dev_mode',
        emailType,
        recipient: Array.isArray(payload.to) ? payload.to[0] || 'unknown' : payload.to,
        subject: payload.subject,
        status: 'dev_mode',
      });

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
      replyTo?: string,
      emailType: string = 'generic',
      getTimer?: () => number
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

        const durationMs = getTimer?.();

        if (error) {
          logEmailEvent({
            type: 'email_failed',
            emailType,
            recipient: hashEmailForLog(payload.to),
            subject: payload.subject,
            status: 'failure',
            errorCode: error.name,
            errorMessage: error.message,
            durationMs,
          });

          return {
            success: false,
            error: error.message,
            code: error.name,
          };
        }

        logEmailEvent({
          type: 'email_sent',
          emailType,
          recipient: hashEmailForLog(payload.to),
          subject: payload.subject,
          messageId: data?.id,
          status: 'success',
          durationMs,
        });

        return {
          success: true,
          messageId: data?.id || 'unknown',
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const durationMs = getTimer?.();

        logEmailEvent({
          type: 'email_failed',
          emailType,
          recipient: hashEmailForLog(payload.to),
          subject: payload.subject,
          status: 'failure',
          errorCode: 'SEND_EXCEPTION',
          errorMessage,
          durationMs,
        });

        return {
          success: false,
          error: errorMessage,
          code: 'SEND_EXCEPTION',
        };
      }
    }
  }

  // ... rest of existing exports (createEmailClient, getEmailClient, resetEmailClient)
  ```

#### 3.2: Update EmailClient Tests
- [ ] File: `src/libs/email/client.test.ts`
- [ ] Add test cases:
  - [ ] Retries on retryable error
  - [ ] Does not retry on non-retryable error
  - [ ] Exhausts all retries on persistent failure
  - [ ] Logs retry attempts
  - [ ] Logs final failure with attempt count
  - [ ] Dev mode shows enhanced console output
  - [ ] `disableRetry` option works
  - [ ] Custom retry config is applied

**Dev Notes:**
- Preserve backward compatibility with existing API
- Options parameter makes retry behavior explicit
- Timer tracks total send duration including retries

---

### Task 4: Update Send Email Helpers (AC: #4)
**Description:** Update helper functions to pass email type for logging

#### 4.1: Update sendEmail Function
- [ ] File: `src/libs/email/sendEmail.ts`
- [ ] Add emailType parameter:
  ```typescript
  import type { ReactElement } from 'react';

  import type { EmailSendOptions } from './client';
  import { getEmailClient } from './client';
  import type { EmailSendResult, EmailTag } from './types';

  /**
   * Send an email with React Email template
   *
   * @param to - Recipient email address(es)
   * @param subject - Email subject line
   * @param template - React Email component
   * @param options - Optional settings (replyTo, cc, bcc, tags, emailType)
   * @returns Email send result
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
      emailType?: string;
      disableRetry?: boolean;
    },
  ): Promise<EmailSendResult> {
    const { emailType, disableRetry, ...payloadOptions } = options || {};

    return getEmailClient().send(
      {
        to,
        subject,
        react: template,
        ...payloadOptions,
      },
      { emailType, disableRetry }
    );
  }

  /**
   * Send a plain text email (no template)
   */
  export async function sendPlainEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
    options?: EmailSendOptions,
  ): Promise<EmailSendResult> {
    return getEmailClient().send(
      {
        to,
        subject,
        text,
        html,
      },
      options
    );
  }
  ```

#### 4.2: Update sendWelcomeEmail
- [ ] File: `src/libs/email/sendWelcomeEmail.tsx`
- [ ] Add email type:
  ```typescript
  import { sendEmail } from './sendEmail';
  import { WelcomeEmail } from './templates/WelcomeEmail';
  import type { EmailSendResult } from './types';

  /**
   * Send welcome email to a new user
   * Non-blocking: use fire-and-forget pattern for best UX
   *
   * @example
   * // Fire and forget (recommended - don't block user flow)
   * sendWelcomeEmail(user.email, user.name)
   *   .catch(err => console.error('Failed to send welcome email:', err));
   *
   * // Await result (only if you need confirmation)
   * const result = await sendWelcomeEmail('user@example.com', 'John');
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
        emailType: 'welcome',  // For logging
      },
    );
  }
  ```

#### 4.3: Update sendEmail Tests
- [ ] File: `src/libs/email/sendEmail.test.ts`
- [ ] Add test cases:
  - [ ] emailType is passed to client
  - [ ] disableRetry option works

**Dev Notes:**
- emailType enables filtering logs by email category
- Fire-and-forget pattern documented in JSDoc

---

### Task 5: Update Module Exports (AC: All)
**Description:** Export new modules from index

#### 5.1: Update Index Exports
- [ ] File: `src/libs/email/index.ts`
- [ ] Add new exports:
  ```typescript
  /**
   * Email Module
   * ... existing documentation ...
   */

  // Client
  export {
    createEmailClient,
    EmailClient,
    getEmailClient,
    resetEmailClient,
    type EmailSendOptions,
  } from './client';

  // Configuration
  export { EMAIL_CONFIG, getFromAddress, isEmailEnabled } from './config';

  // Logging
  export {
    createEmailTimer,
    hashEmailForLog,
    logEmailEvent,
    type EmailEventType,
    type EmailLogContext,
  } from './emailLogger';

  // Retry
  export {
    calculateBackoffDelay,
    DEFAULT_EMAIL_RETRY_CONFIG,
    isRetryableError,
    type RetryConfig,
    withRetry,
  } from './retry';

  // Helpers
  export { sendEmail, sendPlainEmail } from './sendEmail';
  export { sendWelcomeEmail } from './sendWelcomeEmail';

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
- Export retry utilities for potential reuse
- Export logging utilities for consistency

---

### Task 6: Create Non-Blocking Email Utility (AC: #4)
**Description:** Document and provide utility for fire-and-forget email sending

#### 6.1: Create Fire-and-Forget Wrapper
- [ ] File: `src/libs/email/sendEmailAsync.ts`
- [ ] Implement non-blocking wrapper:
  ```typescript
  import { logger } from '../Logger';
  import { hashEmailForLog } from './emailLogger';
  import type { EmailSendResult } from './types';

  /**
   * Send email in fire-and-forget mode
   *
   * Use this for non-critical emails where you don't want to block
   * the user's action. The email will be sent in the background,
   * and any failures will be logged but not thrown.
   *
   * @param sendFn - Async function that sends the email
   * @param context - Context for error logging (email type, recipient hint)
   *
   * @example
   * ```typescript
   * // In an API route or action:
   * sendEmailAsync(
   *   () => sendWelcomeEmail(user.email, user.name),
   *   { emailType: 'welcome', recipientHint: user.email }
   * );
   * // Continues immediately without waiting
   * ```
   */
  export function sendEmailAsync(
    sendFn: () => Promise<EmailSendResult>,
    context: { emailType: string; recipientHint?: string }
  ): void {
    sendFn()
      .then((result) => {
        if (!result.success) {
          logger.error({
            type: 'email_async_failure',
            emailType: context.emailType,
            recipient: context.recipientHint ? hashEmailForLog(context.recipientHint) : 'unknown',
            error: result.error,
            code: result.code,
          }, 'Async email send failed');
        }
      })
      .catch((err) => {
        logger.error({
          type: 'email_async_exception',
          emailType: context.emailType,
          recipient: context.recipientHint ? hashEmailForLog(context.recipientHint) : 'unknown',
          error: err instanceof Error ? err.message : 'Unknown error',
        }, 'Async email send exception');
      });
  }
  ```

#### 6.2: Export from Index
- [ ] File: `src/libs/email/index.ts`
- [ ] Add export:
  ```typescript
  export { sendEmailAsync } from './sendEmailAsync';
  ```

#### 6.3: Write Tests
- [ ] File: `src/libs/email/sendEmailAsync.test.ts`
- [ ] Test cases:
  - [ ] Returns immediately (doesn't block)
  - [ ] Logs failure on send failure
  - [ ] Logs exception on thrown error
  - [ ] Handles missing recipient hint

**Dev Notes:**
- Provides explicit pattern for non-blocking sends
- Ensures all failures are tracked in logs
- Context parameter required for debugging

---

### Task 7: Update Documentation (AC: All)
**Description:** Document error handling patterns in CLAUDE.md

#### 7.1: Update CLAUDE.md
- [ ] File: `CLAUDE.md`
- [ ] Add Email Error Handling section under "Email Integration":
  ```markdown
  ### Email Error Handling

  **Retry Logic:**
  - Email sending automatically retries on transient failures
  - Default: 3 attempts with exponential backoff (1s, 2s, 4s)
  - Retryable errors: rate_limit_exceeded, temporarily_unavailable, internal_server_error
  - Non-retryable errors: validation_error, invalid_api_key, domain_not_verified

  **Logging:**
  - All email events logged with structured JSON format
  - Fields: type, emailType, recipient (hashed), status, messageId, durationMs
  - Privacy: Email addresses hashed in logs (e.g., jo***@example.com)

  **Non-Blocking Pattern (Critical Emails):**
  ```typescript
  import { sendEmailAsync, sendWelcomeEmail } from '@/libs/email';

  // Fire and forget - doesn't block user flow
  sendEmailAsync(
    () => sendWelcomeEmail(user.email, user.name),
    { emailType: 'welcome', recipientHint: user.email }
  );
  ```

  **Development Mode:**
  - Without RESEND_API_KEY: Emails logged to console with full details
  - Shows: type, from, to, subject, content preview
  - Returns mock success for testing
  ```

---

## Technical Requirements

### Dependencies

**No new dependencies required** - Uses existing packages:
- `resend` - Already installed (Story 4.1)
- `pino` - Already installed (existing Logger)

### File Structure

```
src/libs/email/
├── index.ts                    # Updated exports
├── client.ts                   # Updated with retry integration
├── client.test.ts              # Updated tests
├── config.ts                   # Unchanged
├── config.test.ts              # Unchanged
├── types.ts                    # Unchanged
├── sendEmail.ts                # Updated with emailType
├── sendEmail.test.ts           # Updated tests
├── sendWelcomeEmail.tsx        # Updated with emailType
├── sendWelcomeEmail.test.ts    # Unchanged
├── emailLogger.ts              # NEW - Structured logging
├── emailLogger.test.ts         # NEW - Logger tests
├── retry.ts                    # NEW - Retry utility
├── retry.test.ts               # NEW - Retry tests
├── sendEmailAsync.ts           # NEW - Fire-and-forget utility
├── sendEmailAsync.test.ts      # NEW - Async tests
└── templates/
    └── WelcomeEmail.tsx        # Unchanged
```

### Environment Variables

**No new environment variables required** - Uses existing:
- `RESEND_API_KEY` - Optional for dev mode
- `EMAIL_FROM_*` - Sender configuration
- `NODE_ENV` - Dev mode detection

### TypeScript Patterns

**Retry Result Type:**
```typescript
type RetryResult<T> = {
  result: T;
  attempts: number;
};
```

**Email Log Context (Structured):**
```typescript
{
  type: 'email_sent',
  emailType: 'welcome',
  recipient: 'jo***@example.com',
  subject: 'Welcome to VT SaaS Template!',
  messageId: 'msg_abc123',
  status: 'success',
  durationMs: 245,
  timestamp: '2026-01-28T12:00:00.000Z'
}
```

---

## Dev Notes

### Error Classification

**Retryable Errors (transient):**
- `rate_limit_exceeded` - Too many requests
- `temporarily_unavailable` - Service temporarily down
- `internal_server_error` - Resend internal error
- `SEND_EXCEPTION` - Network errors, timeouts

**Non-Retryable Errors (permanent):**
- `validation_error` - Invalid request data
- `missing_required_fields` - Bad input
- `invalid_api_key` - Auth error
- `domain_not_verified` - Config issue

### Exponential Backoff Strategy

**Formula:** `min(baseDelay * 2^attempt, maxDelay) + jitter`

**Example with defaults (baseDelay=1000ms, maxDelay=10000ms):**
- Attempt 1 fails: Wait ~1000-1250ms
- Attempt 2 fails: Wait ~2000-2500ms
- Attempt 3: Final attempt, no wait after

**Jitter:** 0-25% random addition prevents thundering herd when multiple emails fail simultaneously.

### Non-Blocking Email Pattern

**When to use fire-and-forget:**
- Welcome emails (user action already complete)
- Notification emails (informational, not blocking)
- Any email where user flow should not wait

**When to await result:**
- Receipt emails (may need to record in DB)
- Password reset (may need to show confirmation)
- Any email where you need the messageId

### Logging Best Practices

**DO Log:**
- Email type (welcome, receipt, notification)
- Hashed recipient
- Subject line
- Message ID (for tracking)
- Duration (performance monitoring)
- Error codes and messages
- Retry attempts

**DO NOT Log:**
- Full email addresses
- Email body content
- API keys or tokens
- PII from email content

### Testing Strategy

**Unit Tests:**
- Mock Resend SDK
- Test retry logic independently
- Test logger output format
- Test backoff calculations

**Integration Tests (Manual):**
- Test with real Resend API key
- Verify retry behavior with rate limiting
- Check console output in dev mode

### Common Pitfalls to Avoid

1. **Blocking User Actions:**
   - Always use fire-and-forget for non-critical emails
   - Don't await email send in request handlers unless necessary

2. **Silent Failures:**
   - Always log failures, even in fire-and-forget mode
   - Use `sendEmailAsync` wrapper for consistent error tracking

3. **Retry Storms:**
   - Cap max retries (default: 3)
   - Use exponential backoff with jitter
   - Don't retry on validation errors

4. **Logging Sensitive Data:**
   - Always hash email addresses
   - Never log email body content
   - Never log API keys

---

## Definition of Done

- [x] Retry utility created at `src/libs/email/retry.ts`
- [x] Retry utility tests written and passing
- [x] Email logger created at `src/libs/email/emailLogger.ts`
- [x] Email logger tests written and passing
- [x] EmailClient updated with retry integration
- [x] EmailClient tests updated and passing
- [x] sendEmail helpers updated with emailType
- [x] sendEmailAsync utility created
- [x] Module exports updated in index.ts
- [x] CLAUDE.md documentation updated
- [x] Dev mode shows enhanced console output
- [x] All email events logged with structured format
- [x] Retry logic works with exponential backoff
- [x] Non-retryable errors don't trigger retry
- [x] All automated tests pass (`npm test`)
- [x] TypeScript check passes (`npm run check-types`)
- [x] Linting passes (`npm run lint`)
- [x] Production build succeeds (`npm run build`)
- [x] Manual verification: retry logic works (mock transient failure)
- [x] Manual verification: dev mode console output is readable
- [x] Story marked complete in sprint-status.yaml

---

## Dependencies

**Depends On:**
- Story 4.1: Email Infrastructure Setup (COMPLETE)
  - EmailClient base implementation
  - Types and configuration
  - Logger integration
- Story 4.2: Welcome Email Template (COMPLETE)
  - sendWelcomeEmail function
  - Email sending integration

**Blocks:**
- No blocking dependencies

**External Dependencies:**
- Resend API (for production testing)

---

## References

**Architecture Documents:**
- [Source: Epic 4 - Email Communication System] - Epic requirements
- [Source: Story 4.1 - Email Infrastructure Setup] - Infrastructure details
- [Source: implementation-patterns-consistency-rules.md] - Logging and error patterns

**Codebase References:**
- `src/libs/email/client.ts` - Current EmailClient implementation
- `src/libs/email/types.ts` - EmailSendResult type
- `src/libs/Logger.ts` - Pino logger configuration

**External Documentation:**
- Resend API Errors: https://resend.com/docs/api-reference/errors
- Exponential Backoff: https://en.wikipedia.org/wiki/Exponential_backoff

---

## Story Metadata

**Created:** 2026-01-28
**Epic:** Epic 4 - Email Communication System
**Sprint:** Sprint 4
**Story Points:** 3
**Risk Level:** Low (enhancement to existing infrastructure)
**Technical Debt:** None (improves reliability)
**Review Required:** Yes (error handling patterns)

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101 (email-specialist agent)

### Debug Log References

None - implementation validated through comprehensive test suite

### Completion Notes List

1. **Task 1 (Retry Utility)**: Created `retry.ts` with exponential backoff, jitter, and `withRetry` generic function. All 13 test cases pass.

2. **Task 2 (Email Logger)**: Created `emailLogger.ts` with structured JSON logging, email hashing for privacy, and timer utility. All 12 test cases pass.

3. **Task 3 (EmailClient Update)**: Integrated retry logic with configurable options (`emailType`, `retryConfig`, `disableRetry`). Enhanced dev mode console output. All 18 client tests pass.

4. **Task 4 (Send Email Helpers)**: Updated `sendEmail.ts` and `sendWelcomeEmail.tsx` to pass `emailType` for logging context. Tests pass.

5. **Task 5 (Module Exports)**: Updated `index.ts` to export retry utilities, logger functions, and types.

6. **Task 6 (Fire-and-Forget)**: Created `sendEmailAsync.ts` for non-blocking email sends with error logging. All 5 tests pass.

7. **Task 7 (Documentation)**: Added "Email Error Handling" section to CLAUDE.md with retry logic, logging, non-blocking pattern, and dev mode details.

### File List

- src/libs/email/retry.ts (NEW)
- src/libs/email/retry.test.ts (NEW)
- src/libs/email/emailLogger.ts (NEW)
- src/libs/email/emailLogger.test.ts (NEW)
- src/libs/email/sendEmailAsync.ts (NEW)
- src/libs/email/sendEmailAsync.test.ts (NEW)
- src/libs/email/client.ts (UPDATED)
- src/libs/email/client.test.ts (UPDATED)
- src/libs/email/sendEmail.ts (UPDATED)
- src/libs/email/sendEmail.test.ts (UPDATED)
- src/libs/email/sendWelcomeEmail.tsx (UPDATED)
- src/libs/email/index.ts (UPDATED)
- CLAUDE.md (UPDATED)
