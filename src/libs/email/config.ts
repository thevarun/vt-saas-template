import { Env } from '../Env';
import type { EmailConfig } from './types';

/**
 * System-sender config (auth, transactional alerts).
 * No reply-to by default — these emails are not meant to be replied to.
 *
 * Lazy proxy: Env access deferred until a field is actually read. Prevents
 * Env validation from firing at module-load time, which would break any
 * transitive importer that runs outside a fully-configured environment
 * (e.g., client component tests, RSC pages that don't send email).
 */
export const EMAIL_CONFIG: EmailConfig = new Proxy({} as EmailConfig, {
  get(_target, prop) {
    switch (prop) {
      case 'apiKey': return Env.RESEND_API_KEY;
      case 'fromAddress': return Env.EMAIL_FROM_ADDRESS;
      case 'fromName': return Env.EMAIL_FROM_NAME;
      case 'replyTo': return Env.EMAIL_REPLY_TO;
      default: return undefined;
    }
  },
});

/**
 * Lifecycle-sender config (welcome, nurture). Uses the same FROM address
 * as the system sender but with a human-named display name. Replies aren't
 * monitored — users are directed to social channels in the email body.
 */
export const EMAIL_LIFECYCLE_CONFIG: EmailConfig = new Proxy({} as EmailConfig, {
  get(_target, prop) {
    switch (prop) {
      case 'apiKey': return Env.RESEND_API_KEY;
      case 'fromAddress': return Env.EMAIL_FROM_ADDRESS;
      case 'fromName': return Env.EMAIL_LIFECYCLE_FROM_NAME;
      default: return undefined;
    }
  },
});

/**
 * Check if email sending is enabled (API key present)
 */
export function isEmailEnabled(): boolean {
  return !!EMAIL_CONFIG.apiKey;
}

function formatFrom(cfg: EmailConfig): string {
  return `${cfg.fromName} <${cfg.fromAddress}>`;
}

/** Formatted system FROM address (e.g., "My App <noreply@…>") */
export function getFromAddress(): string {
  return formatFrom(EMAIL_CONFIG);
}

/** Formatted lifecycle FROM address (e.g., "Team at My App <hello@…>") */
export function getLifecycleFromAddress(): string {
  return formatFrom(EMAIL_LIFECYCLE_CONFIG);
}
