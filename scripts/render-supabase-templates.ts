/**
 * Renders React Email templates to static HTML files that can be pasted into
 * the Supabase Dashboard → Authentication → Email Templates.
 *
 * Re-run with: `pnpm exec tsx scripts/render-supabase-templates.ts`
 * Regenerate after any template content or layout changes, then paste the
 * resulting HTML into the Supabase Dashboard.
 *
 * Also renders a preview of every in-app Resend template (e.g. welcome) for
 * local eyeballing — written to the same directory with a leading `_`,
 * never pasted anywhere.
 *
 * Output dir (`email-templates/`) is git-ignored.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import * as React from 'react';

import { EmailChangeEmail } from '../src/libs/email/templates/EmailChangeEmail';
import { InviteUserEmail } from '../src/libs/email/templates/InviteUserEmail';
import { MagicLinkEmail } from '../src/libs/email/templates/MagicLinkEmail';
import { PasswordResetEmail } from '../src/libs/email/templates/PasswordResetEmail';
import { ReauthenticationEmail } from '../src/libs/email/templates/ReauthenticationEmail';
import { SignupConfirmationEmail } from '../src/libs/email/templates/SignupConfirmationEmail';
import { WelcomeEmail } from '../src/libs/email/templates/WelcomeEmail';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'email-templates');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://example.com';
const APP_NAME = process.env.EMAIL_FROM_NAME ?? 'My App';

/**
 * Routes the Supabase email link through our own /auth/confirm handler instead
 * of the legacy {{ .ConfirmationURL }} (which exposes the *.supabase.co host
 * and project ref). Our route verifies the token via verifyOtp({ token_hash })
 * and redirects to `next`.
 */
function confirmUrl(type: string, next: string) {
  return `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`;
}

/**
 * Each entry becomes one HTML file. `supabase` entries go into the Supabase
 * Dashboard; `preview` entries are local-only (prefixed with `_`).
 */
const TEMPLATES: {
  file: string;
  kind: 'supabase' | 'preview';
  node: ReactElement;
}[] = [
  {
    file: 'signup-confirmation.html',
    kind: 'supabase',
    node: React.createElement(SignupConfirmationEmail, {
      appName: APP_NAME,
      appUrl: APP_URL,
      confirmationUrl: confirmUrl('signup', '/dashboard'),
    }),
  },
  {
    file: 'magic-link.html',
    kind: 'supabase',
    node: React.createElement(MagicLinkEmail, {
      appName: APP_NAME,
      appUrl: APP_URL,
      confirmationUrl: confirmUrl('magiclink', '/dashboard'),
    }),
  },
  {
    file: 'password-reset.html',
    kind: 'supabase',
    node: React.createElement(PasswordResetEmail, {
      appName: APP_NAME,
      appUrl: APP_URL,
      confirmationUrl: confirmUrl('recovery', '/reset-password'),
    }),
  },
  {
    file: 'email-change.html',
    kind: 'supabase',
    node: React.createElement(EmailChangeEmail, {
      appName: APP_NAME,
      appUrl: APP_URL,
      confirmationUrl: confirmUrl('email_change', '/settings'),
      newEmail: '{{ .NewEmail }}',
    }),
  },
  {
    file: 'reauthentication.html',
    kind: 'supabase',
    node: React.createElement(ReauthenticationEmail, {
      appName: APP_NAME,
      appUrl: APP_URL,
      token: '{{ .Token }}',
    }),
  },
  {
    file: 'invite-user.html',
    kind: 'supabase',
    node: React.createElement(InviteUserEmail, {
      appName: APP_NAME,
      appUrl: APP_URL,
      confirmationUrl: confirmUrl('invite', '/dashboard'),
    }),
  },
  {
    file: '_welcome-preview.html',
    kind: 'preview',
    node: React.createElement(WelcomeEmail, {
      recipientEmail: 'preview@example.com',
      recipientName: 'Alex',
      appName: APP_NAME,
      appUrl: APP_URL,
    }),
  },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const written: string[] = [];
  for (const tpl of TEMPLATES) {
    const html = await render(tpl.node);
    const outPath = path.join(OUT_DIR, tpl.file);
    await fs.writeFile(outPath, html, 'utf8');
    written.push(path.relative(ROOT, outPath));
  }

  console.log(`Rendered:\n  ${written.join('\n  ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
