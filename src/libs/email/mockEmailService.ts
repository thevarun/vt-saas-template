/**
 * Mock Email Service
 *
 * Intentional stub used in development mode when RESEND_API_KEY is not set.
 * Always returns success deterministically for testability.
 * In production, emails are sent via the Resend integration in src/libs/email/.
 */

export type EmailTemplate = 'welcome' | 'password-reset' | 'verify-email';

export type SendEmailParams = {
  template: EmailTemplate;
  to: string;
  data?: Record<string, unknown>;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Sends a test email using the mock service.
 * Always succeeds deterministically - no random failures.
 * Used automatically in development when RESEND_API_KEY is not configured.
 */
export async function sendTestEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // Log what would be sent for debugging/verification
  // eslint-disable-next-line no-console
  console.log('[MockEmailService] Sending test email:', {
    template: params.template,
    to: params.to,
    data: params.data,
  });

  const messageId = `mock-${Date.now()}-${params.template}`;

  return {
    success: true,
    messageId,
  };
}
