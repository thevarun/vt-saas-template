import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';

type SignupConfirmationEmailProps = {
  appName: string;
  appUrl: string;
  confirmationUrl: string;
};

/**
 * Sent by Supabase Auth → Resend when a new user signs up with email.
 *
 * This template is rendered to static HTML via
 * `scripts/render-supabase-templates.ts` and pasted into the Supabase
 * Dashboard → Authentication → Email Templates → "Confirm signup".
 * Supabase substitutes `{{ .ConfirmationURL }}` with the actual link at
 * send time — do not URL-encode it.
 */
export function SignupConfirmationEmail({
  appName,
  appUrl,
  confirmationUrl,
}: SignupConfirmationEmailProps) {
  return (
    <EmailLayout
      previewText="Confirm your email to activate your account."
      appUrl={appUrl}
      brandName={appName}
    >
      <EmailHeading>Confirm your email</EmailHeading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        Thanks for signing up for
        {' '}
        {appName}
        . Confirm your email address to activate your account.
      </EmailText>

      <EmailButton href={confirmationUrl}>Confirm email</EmailButton>

      <EmailFallbackLink href={confirmationUrl} />

      <EmailMutedText>This link expires in 24 hours.</EmailMutedText>

      <EmailMutedText>
        Didn't sign up? You can safely ignore this email.
      </EmailMutedText>

    </EmailLayout>
  );
}

SignupConfirmationEmail.PreviewProps = {
  appName: 'My App',
  appUrl: 'https://example.com',
  confirmationUrl: 'https://example.com/auth/confirm?token=preview',
} satisfies SignupConfirmationEmailProps;

export default SignupConfirmationEmail;
