import {
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailOtpCode,
  EmailText,
} from './EmailLayout';

type ReauthenticationEmailProps = {
  appName: string;
  appUrl: string;
  token: string;
};

/**
 * Supabase reauthentication email — sent when a signed-in user performs a
 * sensitive action that requires re-verifying identity via a 6-digit code.
 * Paste into Dashboard → Authentication → Email Templates → "Reauthentication".
 */
export function ReauthenticationEmail({
  appName,
  appUrl,
  token,
}: ReauthenticationEmailProps) {
  return (
    <EmailLayout
      previewText="Enter this code to continue"
      appUrl={appUrl}
      brandName={appName}
    >
      <EmailHeading>Your verification code</EmailHeading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        Enter this code in
        {' '}
        {appName}
        {' '}
        to verify it's you:
      </EmailText>

      <EmailOtpCode code={token} />

      <EmailMutedText>
        This code expires in 1 hour. If you didn't request this, someone may be
        trying to access your account — consider changing your password.
      </EmailMutedText>

    </EmailLayout>
  );
}

ReauthenticationEmail.PreviewProps = {
  appName: 'My App',
  appUrl: 'https://example.com',
  token: '482913',
} satisfies ReauthenticationEmailProps;

export default ReauthenticationEmail;
