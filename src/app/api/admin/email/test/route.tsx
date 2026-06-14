import { render } from '@react-email/render';
import { NextResponse } from 'next/server';
import type { ReactElement } from 'react';
import { z } from 'zod';

import {
  internalError,
  invalidRequestError,
  logApiError,
  validationError,
} from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { getFromAddress } from '@/libs/email/config';
import { sendEmail } from '@/libs/email/sendEmail';
import { sendWelcomeEmail } from '@/libs/email/sendWelcomeEmail';
import { EmailChangeEmail } from '@/libs/email/templates/EmailChangeEmail';
import { InviteUserEmail } from '@/libs/email/templates/InviteUserEmail';
import { MagicLinkEmail } from '@/libs/email/templates/MagicLinkEmail';
import { PasswordResetEmail } from '@/libs/email/templates/PasswordResetEmail';
import { ReauthenticationEmail } from '@/libs/email/templates/ReauthenticationEmail';
import { SignupConfirmationEmail } from '@/libs/email/templates/SignupConfirmationEmail';
import { Env } from '@/libs/Env';

const APP_NAME = Env.EMAIL_FROM_NAME;

/**
 * System-voice template catalog: every email the admin dashboard can test-send
 * that uses the system FROM address. Covers the Supabase auth emails (rendered
 * locally here, actually sent by Supabase in prod). Fake data comes from each
 * template's `PreviewProps`, so the test inbox renders identically to
 * `npm run email:dev`.
 */
const SYSTEM_TEMPLATES = {
  'signup-confirmation': {
    subject: 'Confirm your email',
    node: (
      <SignupConfirmationEmail
        {...SignupConfirmationEmail.PreviewProps}
        appName={APP_NAME}
      />
    ),
  },
  'magic-link': {
    subject: `Sign in to ${APP_NAME}`,
    node: <MagicLinkEmail {...MagicLinkEmail.PreviewProps} appName={APP_NAME} />,
  },
  'password-reset': {
    subject: 'Reset your password',
    node: (
      <PasswordResetEmail
        {...PasswordResetEmail.PreviewProps}
        appName={APP_NAME}
      />
    ),
  },
  'email-change': {
    subject: 'Confirm your new email',
    node: (
      <EmailChangeEmail {...EmailChangeEmail.PreviewProps} appName={APP_NAME} />
    ),
  },
  'reauthentication': {
    subject: 'Your verification code',
    node: (
      <ReauthenticationEmail
        {...ReauthenticationEmail.PreviewProps}
        appName={APP_NAME}
      />
    ),
  },
  'invite-user': {
    subject: `You're invited to ${APP_NAME}`,
    node: (
      <InviteUserEmail {...InviteUserEmail.PreviewProps} appName={APP_NAME} />
    ),
  },
} as const satisfies Record<string, { subject: string; node: ReactElement }>;

type SystemTemplate = keyof typeof SYSTEM_TEMPLATES;

const TEMPLATE_VALUES = [
  'welcome',
  ...(Object.keys(SYSTEM_TEMPLATES) as SystemTemplate[]),
] as const;

const TestEmailSchema = z.object({
  template: z.enum(TEMPLATE_VALUES),
  email: z.string().email(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withAdminAuth(async (request) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const parsed = TestEmailSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.message);
    }

    const { template, email, data } = parsed.data;

    // Welcome is the only non-Supabase template — uses the lifecycle sender
    // persona (human-named display name) via sendWelcomeEmail.
    if (template === 'welcome') {
      const name = typeof data?.name === 'string' ? data.name : undefined;
      const result = await sendWelcomeEmail(email, name);
      if (!result.success) {
        logApiError(result.error, {
          endpoint: '/api/admin/email/test',
          method: 'POST',
          metadata: { template },
        });
        return internalError('Failed to send test email');
      }
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `Test welcome email sent to ${email}.`,
      });
    }

    // Everything else is a system-voice template sent directly via Resend
    // using the system FROM. For Supabase-owned templates, the real
    // Supabase-triggered send will substitute `{{ .ConfirmationURL }}` /
    // `{{ .Token }}` / `{{ .NewEmail }}`; this admin test uses the
    // template's PreviewProps instead.
    const { subject, node } = SYSTEM_TEMPLATES[template];
    const text = await render(node, { plainText: true });
    const result = await sendEmail(email, subject, node, {
      from: getFromAddress(),
      text,
      tags: [{ name: 'type', value: template }],
      emailType: template,
    });

    if (!result.success) {
      logApiError(result.error, {
        endpoint: '/api/admin/email/test',
        method: 'POST',
        metadata: { template },
      });
      return internalError('Failed to send test email');
    }
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test ${template} email sent to ${email}.`,
    });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/email/test',
      method: 'POST',
    });
    return internalError();
  }
});
