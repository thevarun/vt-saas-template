import {
  EmailButton,
  EmailFallbackLink,
  EmailHeading,
  EmailLayout,
  EmailMutedText,
  EmailText,
} from './EmailLayout';

type InviteUserEmailProps = {
  appName: string;
  appUrl: string;
  confirmationUrl: string;
};

/**
 * Supabase "Invite user" email — sent when an admin invites someone via
 * `supabase.auth.admin.inviteUserByEmail` or the Supabase Dashboard. The
 * recipient's account is created on click; they can set a password after.
 *
 * Often not triggered anywhere in the app — the template is kept wired up
 * in Supabase so an ad-hoc invite from the Dashboard renders on-brand
 * instead of the generic Supabase default.
 *
 * Paste into Dashboard → Authentication → Email Templates → "Invite user".
 */
export function InviteUserEmail({
  appName,
  appUrl,
  confirmationUrl,
}: InviteUserEmailProps) {
  return (
    <EmailLayout
      previewText="Accept this invite to activate your account"
      appUrl={appUrl}
      brandName={appName}
    >
      <EmailHeading>
        You're invited to
        {' '}
        {appName}
      </EmailHeading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        You've been invited to join
        {' '}
        {appName}
        . Click below to accept and activate your account — no password needed
        upfront.
      </EmailText>

      <EmailButton href={confirmationUrl}>Accept invite</EmailButton>

      <EmailFallbackLink href={confirmationUrl} />

      <EmailMutedText>
        This invite expires in 24 hours. If you weren't expecting it, you can
        safely ignore this email.
      </EmailMutedText>

    </EmailLayout>
  );
}

InviteUserEmail.PreviewProps = {
  appName: 'My App',
  appUrl: 'https://example.com',
  confirmationUrl: 'https://example.com/auth/accept-invite?token=preview',
} satisfies InviteUserEmailProps;

export default InviteUserEmail;
