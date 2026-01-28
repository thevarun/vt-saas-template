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
 * @param context - Context for error logging
 * @param context.emailType - Type of email for logging (e.g., 'welcome', 'receipt')
 * @param context.recipientHint - Optional email for logging (will be hashed)
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
  context: { emailType: string; recipientHint?: string },
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
