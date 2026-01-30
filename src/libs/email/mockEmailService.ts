/**
 * Mock Email Service
 *
 * Stub implementation for email testing in the admin panel.
 * Always returns success deterministically for testability.
 *
 * TODO: Replace with Resend integration when Epic 4 is implemented.
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
 *
 * TODO: Replace with actual Resend API call when Epic 4 is implemented.
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
