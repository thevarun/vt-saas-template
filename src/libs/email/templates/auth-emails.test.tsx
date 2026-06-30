/* eslint-disable testing-library/render-result-naming-convention -- uses @react-email/render, not @testing-library */
import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';

import { EmailChangeEmail } from './EmailChangeEmail';
import { InviteUserEmail } from './InviteUserEmail';
import { MagicLinkEmail } from './MagicLinkEmail';
import { PasswordResetEmail } from './PasswordResetEmail';
import { ReauthenticationEmail } from './ReauthenticationEmail';
import { SignupConfirmationEmail } from './SignupConfirmationEmail';

// Render to plain text so JSX whitespace expressions ({' '}) collapse into real
// spaces — the HTML render interleaves `<!-- -->` comment markers between them.
// The plain-text renderer uppercases headings, so heading assertions are
// case-insensitive.

describe('Supabase auth email templates', () => {
  it('SignupConfirmationEmail renders the confirmation URL and app name', async () => {
    const html = await render(
      <SignupConfirmationEmail {...SignupConfirmationEmail.PreviewProps} />,
    );
    const text = await render(
      <SignupConfirmationEmail {...SignupConfirmationEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(html).toContain(SignupConfirmationEmail.PreviewProps.confirmationUrl);
    expect(text).toContain('Confirm your email');
    expect(text).toContain('Thanks for signing up for My App');
  });

  it('MagicLinkEmail renders the confirmation URL and app name', async () => {
    const html = await render(
      <MagicLinkEmail {...MagicLinkEmail.PreviewProps} />,
    );
    const text = await render(
      <MagicLinkEmail {...MagicLinkEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(html).toContain(MagicLinkEmail.PreviewProps.confirmationUrl);
    expect(text).toContain('Sign in to My App');
  });

  it('PasswordResetEmail renders the confirmation URL and app name', async () => {
    const html = await render(
      <PasswordResetEmail {...PasswordResetEmail.PreviewProps} />,
    );
    const text = await render(
      <PasswordResetEmail {...PasswordResetEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(html).toContain(PasswordResetEmail.PreviewProps.confirmationUrl);
    expect(text).toMatch(/Reset your password/i);
    expect(text).toContain('My App');
  });

  it('EmailChangeEmail renders the confirmation URL, new email, and app name', async () => {
    const html = await render(
      <EmailChangeEmail {...EmailChangeEmail.PreviewProps} />,
    );
    const text = await render(
      <EmailChangeEmail {...EmailChangeEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(html).toContain(EmailChangeEmail.PreviewProps.confirmationUrl);
    expect(text).toContain(EmailChangeEmail.PreviewProps.newEmail);
    expect(text).toContain('My App');
  });

  it('ReauthenticationEmail renders the OTP token and app name', async () => {
    const text = await render(
      <ReauthenticationEmail {...ReauthenticationEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(text).toContain(ReauthenticationEmail.PreviewProps.token);
    expect(text).toContain('My App');
  });

  it('InviteUserEmail renders the confirmation URL and app name', async () => {
    const html = await render(
      <InviteUserEmail {...InviteUserEmail.PreviewProps} />,
    );
    const text = await render(
      <InviteUserEmail {...InviteUserEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(html).toContain(InviteUserEmail.PreviewProps.confirmationUrl);
    expect(text).toMatch(/You're invited to My App/i);
  });
});
