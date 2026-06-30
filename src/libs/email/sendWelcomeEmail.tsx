import { getBaseUrl } from '@/utils/Helpers';

import { getLifecycleFromAddress } from './config';
import { sendEmail } from './sendEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';
import type { EmailSendResult } from './types';

/**
 * Send welcome email to a new user
 * Non-blocking: use fire-and-forget pattern for best UX
 *
 * @param email - Recipient email address
 * @param name - Optional user name for personalization
 * @returns Email send result
 *
 * @example
 * ```typescript
 * // Fire and forget (recommended - don't block user flow)
 * sendWelcomeEmail(user.email, user.name)
 *   .catch(err => console.error('Failed to send welcome email:', err));
 *
 * // Await result (only if you need confirmation)
 * const result = await sendWelcomeEmail('user@example.com', 'John');
 * if (result.success) {
 *   console.log('Welcome email sent:', result.messageId);
 * }
 * ```
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string,
): Promise<EmailSendResult> {
  const appName = process.env.EMAIL_FROM_NAME || 'VT SaaS Template';
  const appUrl = getBaseUrl();

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
      // Welcome uses the lifecycle sender persona (human-named display name).
      from: getLifecycleFromAddress(),
      tags: [{ name: 'type', value: 'welcome' }],
      emailType: 'welcome', // For logging
    },
  );
}
