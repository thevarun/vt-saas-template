import { logger } from '../Logger';

/**
 * Email event types for structured logging
 */
export type EmailEventType
  = | 'email_queued'
    | 'email_sent'
    | 'email_failed'
    | 'email_retry'
    | 'email_dev_mode';

/**
 * Email log context
 */
export type EmailLogContext = {
  type: EmailEventType;
  emailType: string; // 'welcome', 'receipt', etc.
  recipient: string; // Hashed email
  subject?: string;
  messageId?: string;
  status: 'success' | 'failure' | 'retry' | 'dev_mode';
  attempt?: number;
  totalAttempts?: number;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
};

/**
 * Hash email address for privacy-aware logging
 * Format: first 2 chars + *** + @domain
 */
export function hashEmailForLog(email: string | string[]): string {
  const addr = Array.isArray(email) ? email[0] : email;
  if (!addr) {
    return 'unknown';
  }

  const [local, domain] = addr.split('@');
  if (!local || !domain) {
    return 'invalid';
  }

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
