import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';

type PasswordResetEmailProps = {
  appName: string;
  appUrl: string;
  confirmationUrl: string;
};

/**
 * Supabase password reset email.
 * Paste into Dashboard → Authentication → Email Templates → "Reset Password".
 */
export function PasswordResetEmail({
  appName,
  appUrl,
  confirmationUrl,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      previewText="Use this link to set a new password"
      appUrl={appUrl}
      brandName={appName}
    >
      <EmailHeading>Reset your password</EmailHeading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        We received a request to reset the password on your
        {' '}
        {appName}
        {' '}
        account. Click below to choose a new one.
      </EmailText>

      <EmailButton href={confirmationUrl}>Reset password</EmailButton>

      <EmailFallbackLink href={confirmationUrl} />

      <EmailMutedText>
        This link expires in 1 hour. If you didn't request a password reset, you
        can safely ignore this email — your password stays the same.
      </EmailMutedText>

    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  appName: 'My App',
  appUrl: 'https://example.com',
  confirmationUrl: 'https://example.com/auth/reset?token=preview',
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
