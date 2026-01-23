import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createClient } from '@/libs/supabase/server';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Build locale-prefixed path
 * Only adds prefix for non-default locales (as-needed mode)
 */
function getLocalePath(locale: string, path: string): string {
  // Don't prefix for default locale
  if (locale === AppConfig.defaultLocale) {
    return path;
  }
  return `/${locale}${path}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error_code = searchParams.get('error_code');
  const error_description = searchParams.get('error_description');

  // Handle error from email link (e.g., expired token)
  if (error_code || error_description) {
    // Check if it's an expired token error
    if (error_description?.includes('expired') || error_code === 'otp_expired') {
      return NextResponse.redirect(`${origin}/verify-email/expired`);
    }
    // Other errors go to generic error page
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Get locale from query param, fallback to default
  const localeParam = searchParams.get('locale');
  const locale = localeParam && AllLocales.includes(localeParam as any)
    ? localeParam
    : AppConfig.defaultLocale;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user to check if this is email verification
      const { data: { user } } = await supabase.auth.getUser();

      // Build locale-aware redirect path
      const redirectPath = getLocalePath(locale, next);

      // If user just verified email, add success query param
      if (user?.email_confirmed_at) {
        const dashboardUrl = new URL(redirectPath, origin);
        dashboardUrl.searchParams.set('verified', 'true');
        return NextResponse.redirect(dashboardUrl.toString());
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }

    // Check if error is due to expired token
    if (error.message?.includes('expired')) {
      return NextResponse.redirect(`${origin}/verify-email/expired`);
    }
  }

  // Return the user to a locale-aware error page
  const errorPath = getLocalePath(locale, '/auth-code-error');
  return NextResponse.redirect(`${origin}${errorPath}`);
}
