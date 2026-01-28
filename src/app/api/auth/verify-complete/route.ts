import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { sendWelcomeEmail } from '@/libs/email';

/**
 * GET /api/auth/verify-complete
 *
 * Handles email verification completion for email/password signups.
 * Exchanges the verification code for a session and sends welcome email.
 *
 * Query params:
 * - code: Verification code from email link
 * - next: URL to redirect to after verification (default: /)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/en/sign-in', request.url));
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.email) {
      // Send welcome email (fire and forget)
      sendWelcomeEmail(
        user.email,
        user.user_metadata?.name,
      ).catch(err => console.error('Failed to send welcome email:', err));
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  // Extract locale from next path or default to 'en'
  const localeMatch = next.match(/^\/([^/]+)\//);
  const locale = localeMatch?.[1] ?? 'en';
  return NextResponse.redirect(new URL(`/${locale}/auth-code-error`, request.url));
}
