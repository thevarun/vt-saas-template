import type { SubscriptionStartedEmailData } from '../types';
import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';
import { safeGreeting } from './helpers';

type SubscriptionStartedEmailProps = SubscriptionStartedEmailData;

export function SubscriptionStartedEmail({
  recipientName,
  appUrl,
  appName,
  tierName,
  billingInterval,
}: SubscriptionStartedEmailProps) {
  const dashboardUrl = `${appUrl}/dashboard`;
  const intervalLabel = billingInterval === 'yearly' ? 'yearly' : 'monthly';

  return (
    <EmailLayout
      previewText={`Your ${tierName} subscription is now active`}
      appUrl={appUrl}
      brandName={appName}
      includePreferencesLink
    >
      <EmailHeading>
        You're on
        {' '}
        {tierName}
      </EmailHeading>
      <EmailText>{safeGreeting(recipientName)}</EmailText>
      <EmailText>
        Your
        {' '}
        {intervalLabel}
        {' '}
        {tierName}
        {' '}
        subscription is active. You now have full access.
      </EmailText>
      <EmailButton href={dashboardUrl}>
        Open
        {' '}
        {appName}
      </EmailButton>
      <EmailMutedText>
        Stripe will email you a separate receipt. You can manage billing or
        cancel anytime from the subscriptions page.
      </EmailMutedText>
    </EmailLayout>
  );
}

SubscriptionStartedEmail.PreviewProps = {
  recipientEmail: 'preview@example.com',
  recipientName: 'Alex',
  appName: 'VT SaaS Template',
  appUrl: 'https://example.com',
  tierName: 'Pro',
  billingInterval: 'monthly',
} satisfies SubscriptionStartedEmailProps;

export default SubscriptionStartedEmail;
