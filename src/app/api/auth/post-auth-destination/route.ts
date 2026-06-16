import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { buildSignInUrl } from '@/libs/auth/auth-redirects';
import { getPostAuthDestination } from '@/libs/auth/post-auth-destination';
import { createClient } from '@/libs/supabase/server';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * GET /api/auth/post-auth-destination?locale=en&next=/en/dashboard
 *
 * Returns `{ destination: string }` — the path the client should navigate to
 * after a successful sign-in. Client callers (e.g. the password sign-in form
 * via `fetchPostAuthDestination`) hit this before `router.push` so they respect
 * the onboarding gate instead of pushing straight to a naive `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get('locale');
  const locale = localeParam && AllLocales.includes(localeParam as (typeof AllLocales)[number])
    ? localeParam
    : AppConfig.defaultLocale;
  const preferredPath = searchParams.get('next');

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const fallbackRedirect = preferredPath && preferredPath.startsWith('/')
      ? preferredPath
      : `/${locale}/dashboard`;
    return NextResponse.json(
      { destination: buildSignInUrl({ locale, redirect: fallbackRedirect }) },
      { status: 401 },
    );
  }

  const destination = await getPostAuthDestination({
    supabase,
    userId: user.id,
    locale,
    preferredPath,
  });

  return NextResponse.json({ destination });
}
