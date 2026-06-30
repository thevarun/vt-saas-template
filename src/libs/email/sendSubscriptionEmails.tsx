import { render } from '@react-email/render';

import { getBaseUrl } from '@/utils/Helpers';

import { getLifecycleFromAddress } from './config';
import { sendEmail } from './sendEmail';
import { sendEmailAsync } from './sendEmailAsync';
import { ExpiryReminderEmail } from './templates/ExpiryReminderEmail';
import { PromotionGrantedEmail } from './templates/PromotionGrantedEmail';
import { SubscriptionEndedEmail } from './templates/SubscriptionEndedEmail';
import { SubscriptionStartedEmail } from './templates/SubscriptionStartedEmail';
import type { ExpiryDaysRemaining, ExpiryReminderKind } from './types';

// Subscription emails are lifecycle/nurture — use the human-named lifecycle
// sender persona (same as the welcome email). All product/brand copy lives in
// template props: appName comes from EMAIL_FROM_NAME, tierName from the caller.
function appName(): string {
  return process.env.EMAIL_FROM_NAME || 'VT SaaS Template';
}

function subjectForExpiry(
  kind: ExpiryReminderKind,
  daysRemaining: ExpiryDaysRemaining,
): string {
  const noun = kind === 'trial' ? 'trial' : 'promotion';
  if (daysRemaining === -1) {
    return `Your ${noun} has ended`;
  }
  if (daysRemaining === 0) {
    return `Your ${noun} ends today`;
  }
  return `Your ${noun} ends in 3 days`;
}

/**
 * Send a T-3, day-of, or T+1 expiry email for either a trial or promotion.
 * Fire-and-forget — failures are logged but do not block the caller.
 */
export function sendExpiryReminderEmail(args: {
  email: string;
  name?: string;
  tierName: string;
  kind: ExpiryReminderKind;
  daysRemaining: ExpiryDaysRemaining;
}): void {
  const { email, name, tierName, kind, daysRemaining } = args;
  const appUrl = getBaseUrl();
  const template = (
    <ExpiryReminderEmail
      recipientEmail={email}
      recipientName={name}
      appName={appName()}
      appUrl={appUrl}
      tierName={tierName}
      kind={kind}
      daysRemaining={daysRemaining}
    />
  );

  sendEmailAsync(
    async () => {
      const text = await render(template, { plainText: true });
      return sendEmail(email, subjectForExpiry(kind, daysRemaining), template, {
        from: getLifecycleFromAddress(),
        text,
        tags: [
          { name: 'type', value: 'expiry_reminder' },
          { name: 'kind', value: kind },
          { name: 'days_remaining', value: String(daysRemaining) },
        ],
        emailType: 'expiry_reminder',
      });
    },
    { emailType: 'expiry_reminder', recipientHint: email },
  );
}

export function sendSubscriptionStartedEmail(args: {
  email: string;
  name?: string;
  tierName: string;
  billingInterval: 'monthly' | 'yearly';
}): void {
  const { email, name, tierName, billingInterval } = args;
  const appUrl = getBaseUrl();
  const template = (
    <SubscriptionStartedEmail
      recipientEmail={email}
      recipientName={name}
      appName={appName()}
      appUrl={appUrl}
      tierName={tierName}
      billingInterval={billingInterval}
    />
  );

  sendEmailAsync(
    async () => {
      const text = await render(template, { plainText: true });
      return sendEmail(email, `You're on ${tierName}`, template, {
        from: getLifecycleFromAddress(),
        text,
        tags: [
          { name: 'type', value: 'subscription_started' },
          { name: 'billing_interval', value: billingInterval },
        ],
        emailType: 'subscription_started',
      });
    },
    { emailType: 'subscription_started', recipientHint: email },
  );
}

export function sendSubscriptionEndedEmail(args: {
  email: string;
  name?: string;
  tierName: string;
}): void {
  const { email, name, tierName } = args;
  const appUrl = getBaseUrl();
  const template = (
    <SubscriptionEndedEmail
      recipientEmail={email}
      recipientName={name}
      appName={appName()}
      appUrl={appUrl}
      tierName={tierName}
    />
  );

  sendEmailAsync(
    async () => {
      const text = await render(template, { plainText: true });
      return sendEmail(email, `Your ${tierName} subscription has ended`, template, {
        from: getLifecycleFromAddress(),
        text,
        tags: [{ name: 'type', value: 'subscription_ended' }],
        emailType: 'subscription_ended',
      });
    },
    { emailType: 'subscription_ended', recipientHint: email },
  );
}

export function sendPromotionGrantedEmail(args: {
  email: string;
  name?: string;
  tierName: string;
  expiresAt: string;
}): void {
  const { email, name, tierName, expiresAt } = args;
  const appUrl = getBaseUrl();
  const template = (
    <PromotionGrantedEmail
      recipientEmail={email}
      recipientName={name}
      appName={appName()}
      appUrl={appUrl}
      tierName={tierName}
      expiresAt={expiresAt}
    />
  );

  sendEmailAsync(
    async () => {
      const text = await render(template, { plainText: true });
      return sendEmail(email, `You've been granted ${tierName} access`, template, {
        from: getLifecycleFromAddress(),
        text,
        tags: [{ name: 'type', value: 'promotion_granted' }],
        emailType: 'promotion_granted',
      });
    },
    { emailType: 'promotion_granted', recipientHint: email },
  );
}
