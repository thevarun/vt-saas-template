import type { ExpiryDaysRemaining, ExpiryReminderEmailData, ExpiryReminderKind } from '../types';
import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
} from './EmailLayout';
import { safeGreeting } from './helpers';

export type { ExpiryDaysRemaining, ExpiryReminderKind } from '../types';

type ExpiryReminderEmailProps = ExpiryReminderEmailData;

function copy(
  kind: ExpiryReminderKind,
  daysRemaining: ExpiryDaysRemaining,
  tierName: string,
) {
  const noun = kind === 'trial' ? 'trial' : 'promotion';

  if (daysRemaining === -1) {
    return {
      preview: `You're back on the free tier — resubscribe to keep ${tierName} access`,
      heading: `Your ${noun} has ended`,
      body: `Your ${noun} has ended and your account is now on the free tier. Subscribe to ${tierName} to pick up where you left off.`,
      cta: `Subscribe to ${tierName}`,
    };
  }

  if (daysRemaining === 0) {
    return {
      preview: `Last chance to keep ${tierName} without interruption`,
      heading: `Your ${noun} ends today`,
      body: `Today is the last day of your ${noun}. Subscribe to ${tierName} now to keep full access without interruption.`,
      cta: `Subscribe to ${tierName}`,
    };
  }

  // T-3
  return {
    preview: `Subscribe before then to keep ${tierName} access`,
    heading: `Your ${noun} ends in 3 days`,
    body: `Your ${noun} ends in 3 days. Subscribe to ${tierName} before then to keep full access without a gap. After that your account moves to the free tier.`,
    cta: `Subscribe to ${tierName}`,
  };
}

export function ExpiryReminderEmail(props: ExpiryReminderEmailProps) {
  const { recipientName, appUrl, appName, tierName, kind, daysRemaining } = props;
  const c = copy(kind, daysRemaining, tierName);
  const subscribeUrl = `${appUrl}/subscriptions`;

  return (
    <EmailLayout
      previewText={c.preview}
      appUrl={appUrl}
      brandName={appName}
      includePreferencesLink
    >
      <EmailHeading>{c.heading}</EmailHeading>
      <EmailText>{safeGreeting(recipientName)}</EmailText>
      <EmailText>{c.body}</EmailText>
      <EmailButton href={subscribeUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}

ExpiryReminderEmail.PreviewProps = {
  recipientEmail: 'preview@example.com',
  recipientName: 'Alex',
  appName: 'VT SaaS Template',
  appUrl: 'https://example.com',
  tierName: 'Pro',
  kind: 'trial',
  daysRemaining: 3,
} satisfies ExpiryReminderEmailProps;

export default ExpiryReminderEmail;
