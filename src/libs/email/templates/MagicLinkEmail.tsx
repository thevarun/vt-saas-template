import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';

type MagicLinkEmailProps = {
  appName: string;
  appUrl: string;
  confirmationUrl: string;
};

/**
 * Supabase magic link email — link-only. If the app doesn't have a
 * `verifyOtp` UI path, then even though Supabase sends a 6-digit code
 * alongside the link, we don't surface it here. Re-introduce EmailOtpCode
 * when an OTP entry form lands in the app.
 *
 * Paste into Dashboard → Authentication → Email Templates → "Magic Link".
 */
export function MagicLinkEmail({
  appName,
  appUrl,
  confirmationUrl,
}: MagicLinkEmailProps) {
  return (
    <EmailLayout
      previewText="Your one-time sign-in link inside"
      appUrl={appUrl}
      brandName={appName}
    >
      <EmailHeading>
        Sign in to
        {' '}
        {appName}
      </EmailHeading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        Click the button below to sign in to
        {' '}
        {appName}
        . No password needed.
      </EmailText>

      <EmailButton href={confirmationUrl}>
        Sign in to
        {' '}
        {appName}
      </EmailButton>

      <EmailFallbackLink href={confirmationUrl} />

      <EmailMutedText>
        This link expires in 1 hour. If you didn't try to sign in, you can
        safely ignore this email.
      </EmailMutedText>

    </EmailLayout>
  );
}

MagicLinkEmail.PreviewProps = {
  appName: 'My App',
  appUrl: 'https://example.com',
  confirmationUrl: 'https://example.com/auth/confirm?token=preview',
} satisfies MagicLinkEmailProps;

export default MagicLinkEmail;
