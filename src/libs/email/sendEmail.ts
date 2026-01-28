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
 * @param options - Optional settings
 * @param options.replyTo - Reply-to email address
 * @param options.cc - CC recipient(s)
 * @param options.bcc - BCC recipient(s)
 * @param options.tags - Email tags for analytics
 * @param options.emailType - Email type for logging (e.g., 'welcome', 'receipt')
 * @param options.disableRetry - Disable retry logic for this email
 * @returns Email send result
 *
 * @example
 * ```typescript
 * const result = await sendEmail(
 *   'user@example.com',
 *   'Welcome!',
 *   <WelcomeEmail name="John" />,
 *   { emailType: 'welcome' }
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
    { emailType, disableRetry },
  );
}

/**
 * Send a plain text email (no template)
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param text - Plain text content
 * @param html - Optional HTML content
 * @param options - Optional email send options
 * @returns Email send result
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
    options,
  );
}
