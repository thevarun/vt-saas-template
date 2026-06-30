import type { SubscriptionEndedEmailData } from '../types';
import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
} from './EmailLayout';
import { safeGreeting } from './helpers';

type SubscriptionEndedEmailProps = SubscriptionEndedEmailData;

export function SubscriptionEndedEmail({
  recipientName,
  appUrl,
  appName,
  tierName,
}: SubscriptionEndedEmailProps) {
  const subscribeUrl = `${appUrl}/subscriptions`;

  return (
    <EmailLayout
      previewText={`Your ${tierName} subscription has ended — resubscribe anytime`}
      appUrl={appUrl}
      brandName={appName}
      includePreferencesLink
    >
      <EmailHeading>
        Your
        {' '}
        {tierName}
        {' '}
        subscription has ended
      </EmailHeading>
      <EmailText>{safeGreeting(recipientName)}</EmailText>
      <EmailText>
        Your
        {' '}
        {tierName}
        {' '}
        subscription has ended and your account is now on the free tier.
      </EmailText>
      <EmailText>
        If this was unintentional, you can resume any time — your data is still
        here.
      </EmailText>
      <EmailButton href={subscribeUrl}>Resubscribe</EmailButton>
    </EmailLayout>
  );
}

SubscriptionEndedEmail.PreviewProps = {
  recipientEmail: 'preview@example.com',
  recipientName: 'Alex',
  appName: 'VT SaaS Template',
  appUrl: 'https://example.com',
  tierName: 'Pro',
} satisfies SubscriptionEndedEmailProps;

export default SubscriptionEndedEmail;
