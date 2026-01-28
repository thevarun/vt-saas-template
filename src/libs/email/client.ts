import { Resend } from 'resend';

import { logger } from '../Logger';
import { EMAIL_CONFIG, getFromAddress, isEmailEnabled } from './config';
import {
  createEmailTimer,
  hashEmailForLog,
  logEmailEvent,
} from './emailLogger';
import type { RetryConfig } from './retry';
import {
  DEFAULT_EMAIL_RETRY_CONFIG,
  withRetry,
} from './retry';
import type { EmailPayload, EmailSendResult } from './types';

/**
 * Email send options
 */
export type EmailSendOptions = {
  /** Email type for logging/tracking (e.g., 'welcome', 'receipt') */
  emailType?: string;
  /** Custom retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Disable retry for this send */
  disableRetry?: boolean;
};

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
    options: EmailSendOptions = {},
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

    const { result } = await withRetry(
      () => this.handleResendSend(payload, from, replyTo, emailType, getTimer),
      result => result.success,
      result => (!result.success ? result.code : undefined),
      retryConfig,
      { emailType, recipient: hashEmailForLog(payload.to) },
    );

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
    emailType: string = 'generic',
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
    /* eslint-disable no-console -- Intentional: Dev mode output for debugging */
    console.log(`\n${'='.repeat(60)}`);
    console.log('EMAIL (DEV MODE - NOT SENT)');
    console.log('='.repeat(60));
    console.log(`Type:     ${emailType}`);
    console.log(`From:     ${from}`);
    console.log(`To:       ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`);
    console.log(`Subject:  ${payload.subject}`);
    if (replyTo) {
      console.log(`Reply-To: ${replyTo}`);
    }
    if (payload.cc) {
      console.log(`CC:       ${Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc}`);
    }
    if (payload.bcc) {
      console.log(`BCC:      ${Array.isArray(payload.bcc) ? payload.bcc.join(', ') : payload.bcc}`);
    }
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
    console.log(`${'='.repeat(60)}\n`);
    /* eslint-enable no-console */

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
    getTimer?: () => number,
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

/**
 * Reset singleton (for testing)
 */
export function resetEmailClient(): void {
  emailClient = null;
}
