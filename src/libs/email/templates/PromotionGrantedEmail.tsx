import type { PromotionGrantedEmailData } from '../types';
import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';
import { safeGreeting } from './helpers';

type PromotionGrantedEmailProps = PromotionGrantedEmailData;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PromotionGrantedEmail({
  recipientName,
  appUrl,
  appName,
  tierName,
  expiresAt,
}: PromotionGrantedEmailProps) {
  const dashboardUrl = `${appUrl}/dashboard`;

  return (
    <EmailLayout
      previewText={`You've been granted ${tierName} access`}
      appUrl={appUrl}
      brandName={appName}
      includePreferencesLink
    >
      <EmailHeading>
        You've been granted
        {' '}
        {tierName}
        {' '}
        access
      </EmailHeading>
      <EmailText>{safeGreeting(recipientName)}</EmailText>
      <EmailText>
        Your account now has full
        {' '}
        {tierName}
        {' '}
        access through
        {' '}
        <strong>{formatDate(expiresAt)}</strong>
        .
      </EmailText>
      <EmailText>
        After that, your account will move to the free tier. We'll send a
        reminder 3 days before so it doesn't catch you off guard.
      </EmailText>
      <EmailButton href={dashboardUrl}>
        Open
        {' '}
        {appName}
      </EmailButton>
      <EmailMutedText>
        If you have any questions, reply to this email.
      </EmailMutedText>
    </EmailLayout>
  );
}

PromotionGrantedEmail.PreviewProps = {
  recipientEmail: 'preview@example.com',
  recipientName: 'Alex',
  appName: 'VT SaaS Template',
  appUrl: 'https://example.com',
  tierName: 'Pro',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
} satisfies PromotionGrantedEmailProps;

export default PromotionGrantedEmail;
