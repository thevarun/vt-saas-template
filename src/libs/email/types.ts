/**
 * Email Service TypeScript Types
 * Provider-agnostic types for email sending
 */

import type { ReactElement } from 'react';

/**
 * Email tag for tracking/categorization
 */
export type EmailTag = {
  name: string;
  value: string;
};

/**
 * Base email payload (provider-agnostic)
 */
export type EmailPayload = {
  to: string | string[];
  subject: string;
  /** Overrides the default system FROM address. Used for lifecycle emails. */
  from?: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: EmailTag[];
};

/**
 * Send result (success case)
 */
export type EmailSendSuccess = {
  success: true;
  messageId: string;
};

/**
 * Send result (failure case)
 */
export type EmailSendFailure = {
  success: false;
  error: string;
  code?: string;
};

/**
 * Send result (union type)
 */
export type EmailSendResult = EmailSendSuccess | EmailSendFailure;

/**
 * Email configuration
 */
export type EmailConfig = {
  apiKey?: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
};

/**
 * Template data types (extend per template)
 */
export type BaseTemplateData = {
  recipientEmail: string;
  recipientName?: string;
};

/**
 * Welcome email template data
 */
export type WelcomeEmailData = BaseTemplateData & {
  appUrl: string;
  appName: string;
};

/**
 * Subscription-lifecycle email template data. All product copy lives in props
 * (`appName`, `tierName`, `billingInterval`, …) so these templates carry no
 * brand or feature copy — a fork passes its own.
 */

/**
 * 3  = T-3 reminder (3 days remaining)
 * 0  = day-of expiry (last day of access)
 * -1 = T+1 follow-up (the day after expiry)
 */
export type ExpiryDaysRemaining = 3 | 0 | -1;

export type ExpiryReminderKind = 'trial' | 'promotion';

export type ExpiryReminderEmailData = BaseTemplateData & {
  appUrl: string;
  appName: string;
  /** Paid tier the user can upgrade to (e.g. 'Pro'). */
  tierName: string;
  kind: ExpiryReminderKind;
  daysRemaining: ExpiryDaysRemaining;
};

export type SubscriptionStartedEmailData = BaseTemplateData & {
  appUrl: string;
  appName: string;
  tierName: string;
  billingInterval: 'monthly' | 'yearly';
};

export type SubscriptionEndedEmailData = BaseTemplateData & {
  appUrl: string;
  appName: string;
  tierName: string;
};

export type PromotionGrantedEmailData = BaseTemplateData & {
  appUrl: string;
  appName: string;
  tierName: string;
  /** ISO date string for when the promotional access ends. */
  expiresAt: string;
};
