import { Env } from '../Env';
import type { EmailConfig } from './types';

/**
 * Email configuration loaded from environment variables
 * Provides sensible defaults for development
 */
export const EMAIL_CONFIG: EmailConfig = {
  apiKey: Env.RESEND_API_KEY,
  fromAddress: Env.EMAIL_FROM_ADDRESS,
  fromName: Env.EMAIL_FROM_NAME,
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
