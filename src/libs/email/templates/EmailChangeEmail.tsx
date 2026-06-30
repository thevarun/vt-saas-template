import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';

type EmailChangeEmailProps = {
  appName: string;
  appUrl: string;
  confirmationUrl: string;
  /** The new email address requested on the account. */
  newEmail: string;
};

/**
 * Supabase email-change confirmation. Sent to BOTH the old address and the
 * new address (Supabase fills {{ .NewEmail }} appropriately per send).
 * Paste into Dashboard → Authentication → Email Templates → "Change Email Address".
 */
export function EmailChangeEmail({
  appName,
  appUrl,
  confirmationUrl,
  newEmail,
}: EmailChangeEmailProps) {
  return (
    <EmailLayout
      previewText="Click to confirm this email change"
      appUrl={appUrl}
      brandName={appName}
    >
      <EmailHeading>Confirm your new email</EmailHeading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        A request was made to change the email address on your
        {' '}
        {appName}
        {' '}
        account to
        {' '}
        <strong>{newEmail}</strong>
        . Click below to confirm.
      </EmailText>

      <EmailButton href={confirmationUrl}>Confirm change</EmailButton>

      <EmailFallbackLink href={confirmationUrl} />

      <EmailMutedText>
        If you didn't request this change, you can safely ignore this email or
        contact support.
      </EmailMutedText>

    </EmailLayout>
  );
}

EmailChangeEmail.PreviewProps = {
  appName: 'My App',
  appUrl: 'https://example.com',
  confirmationUrl: 'https://example.com/auth/confirm-change?token=preview',
  newEmail: 'new@example.com',
} satisfies EmailChangeEmailProps;

export default EmailChangeEmail;
