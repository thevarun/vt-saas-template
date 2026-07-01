import { render } from '@react-email/render';

import { getBaseUrl } from '@/utils/Helpers';

import { getLifecycleFromAddress } from './config';
import { sendEmail } from './sendEmail';
import { sendEmailAsync } from './sendEmailAsync';
import type { ReconnectDaysRemaining } from './templates/ReconnectReminderEmail';
import { ReconnectReminderEmail } from './templates/ReconnectReminderEmail';

// Reconnect reminders are notification/nurture emails gated by connection
// state — use the human-named lifecycle sender. All product/brand copy lives
// in template props: appName comes from EMAIL_FROM_NAME, platform from the
// caller, so the template stays provider-neutral.
function appName(): string {
  return process.env.EMAIL_FROM_NAME || 'VT SaaS Template';
}

function subjectForReconnect(
  platform: string,
  daysRemaining: ReconnectDaysRemaining,
): string {
  return daysRemaining <= 1
    ? `Your ${platform} connection expires tomorrow`
    : `Your ${platform} connection expires in ${daysRemaining} days`;
}

/**
 * Send a reminder to reconnect an expiring OAuth connection (e.g. T-7 / T-1).
 * Fire-and-forget — failures are logged but do not block the caller.
 */
export function sendReconnectReminderEmail(args: {
  email: string;
  name?: string;
  platform: string;
  daysRemaining: ReconnectDaysRemaining;
}): void {
  const { email, name, platform, daysRemaining } = args;
  const appUrl = getBaseUrl();
  const template = (
    <ReconnectReminderEmail
      recipientEmail={email}
      recipientName={name}
      appName={appName()}
      appUrl={appUrl}
      platform={platform}
      daysRemaining={daysRemaining}
    />
  );

  sendEmailAsync(
    async () => {
      const text = await render(template, { plainText: true });
      return sendEmail(email, subjectForReconnect(platform, daysRemaining), template, {
        from: getLifecycleFromAddress(),
        text,
        tags: [
          { name: 'type', value: 'reconnect_reminder' },
          { name: 'platform', value: platform },
          { name: 'days_remaining', value: String(daysRemaining) },
        ],
        emailType: 'reconnect_reminder',
      });
    },
    { emailType: 'reconnect_reminder', recipientHint: email },
  );
}
