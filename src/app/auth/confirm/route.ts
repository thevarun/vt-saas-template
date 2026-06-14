import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { sendWelcomeEmail } from '@/libs/email';
import { logger } from '@/libs/Logger';

/**
 * GET /auth/confirm
 *
 * Handles email-link verification for Supabase auth flows that use the
 * `{{ .TokenHash }}` template variable: signup, magic link, password reset,
 * email change, invite, reauthentication. The Supabase email templates rendered
 * by `scripts/render-supabase-templates.ts` link here instead of the legacy
 * `{{ .ConfirmationURL }}` (which points at `*.supabase.co` and exposes the
 * project ref), so the user stays on the app's own domain.
 *
 * The OAuth code-exchange flow (Google/GitHub/etc.) still goes through
 * `/api/auth/callback` — that handles `?code=` and is not touched by this route.
 *
 * Query params:
 * - token_hash: the `{{ .TokenHash }}` from the email link
 * - type: the Supabase OTP type (signup, magiclink, recovery, …)
 * - next: relative path to redirect to after verification (default: /)
 */

const VALID_OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next') ?? '/';

  // Open-redirect guard — only allow same-origin relative paths.
  const safeNext
    = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  // Best-effort locale prefix for error redirects, taken from `next`.
  const localeMatch = safeNext.match(/^\/([^/]+)\//);
  const locale = localeMatch?.[1] ?? 'en';

  if (!tokenHash || !type || !VALID_OTP_TYPES.includes(type)) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth-code-error`, origin),
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Cookie setting can fail, safe to ignore
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Cookie removal can fail, safe to ignore
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth-code-error`, origin),
    );
  }

  // Fire-and-forget welcome email for new signups/invites.
  if (type === 'signup' || type === 'invite') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      sendWelcomeEmail(
        user.email,
        user.user_metadata?.name || user.user_metadata?.full_name,
      ).catch(err =>
        logger.error({ error: err }, 'Failed to send welcome email'),
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
