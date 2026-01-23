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
      const redirectPath = getLocalePath(locale, next);
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return the user to a locale-aware error page
  const errorPath = getLocalePath(locale, '/auth-code-error');
  return NextResponse.redirect(`${origin}${errorPath}`);
}
