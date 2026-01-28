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
 *
 * Fire-and-forget pattern (non-blocking):
 * ```typescript
 * import { sendEmailAsync, sendWelcomeEmail } from '@/libs/email';
 *
 * // Non-blocking - doesn't wait for email to send
 * sendEmailAsync(
 *   () => sendWelcomeEmail(user.email, user.name),
 *   { emailType: 'welcome', recipientHint: user.email }
 * );
 * ```
 */

// Client
export {
  createEmailClient,
  EmailClient,
  type EmailSendOptions,
  getEmailClient,
  resetEmailClient,
} from './client';

// Configuration
export { EMAIL_CONFIG, getFromAddress, isEmailEnabled } from './config';

// Logging
export {
  createEmailTimer,
  type EmailEventType,
  type EmailLogContext,
  hashEmailForLog,
  logEmailEvent,
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
export { sendEmailAsync } from './sendEmailAsync';
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
