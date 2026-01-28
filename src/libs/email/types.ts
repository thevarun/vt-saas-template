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
