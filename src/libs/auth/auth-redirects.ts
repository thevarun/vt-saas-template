import { redirect as nextRedirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getLocale } from 'next-intl/server';

import { getCachedUser } from '@/libs/supabase/cached-user';
import { AppConfig } from '@/utils/AppConfig';

import { resolveLocaleFromCookie } from './landing-auth-url';

// Re-export the pure open-redirect guards so server callers that already import
// from this module don't have to reach into `safe-path.ts` directly. The
// sanitizer itself lives in `safe-path.ts` (no `next/headers` / server-only
// imports) so it stays importable from client components.
export { isSafeInternalPath, toSafeInternalPath } from './safe-path';

// `resolveLocaleFromCookie` now has a single source of truth in
// `landing-auth-url.ts`; re-export it here so existing server callers (and this
// module's own guards) keep importing it from `auth-redirects`.
export { resolveLocaleFromCookie };

/**
 * Build a locale-aware URL to the sign-in page.
 *
 * The `redirect` query param is the contract the sign-in form already reads
 * (see `SignInFormClient` → `searchParams.get('redirect')` and the same param
 * set by `src/proxy.ts` when it bounces an unauthenticated user). Preserving it
 * is what sends the user back to where they intended after authenticating.
 *
 * Locale prefixing follows `localePrefix: 'as-needed'` (see {@link AppConfig}) —
 * the default locale is unprefixed, every other locale gets a `/<locale>`
 * prefix.
 *
 * Most callers should use one of the higher-level helpers in this module
 * (`redirectUnauthToSignIn`, `requireAuthOrRedirect`) — this is the low-level
 * builder they delegate to.
 */
export function buildSignInUrl({
  locale,
  redirect,
}: {
  locale: string;
  /** Path to return to after sign-in. Must start with `/`. */
  redirect: string;
}): string {
  const localePrefix = locale === AppConfig.defaultLocale ? '' : `/${locale}`;
  const params = new URLSearchParams({ redirect });
  return `${localePrefix}/sign-in?${params.toString()}`;
}

/**
 * For API routes (NextRequest) — redirect an unauthenticated user to the
 * sign-in page with their intended destination preserved. `backTo` is the
 * unprefixed path the user should return to after signing in (e.g.
 * `'dashboard'`, `'/settings'`); the locale prefix is added automatically.
 *
 * @example
 *   if (!user) return redirectUnauthToSignIn(request, 'dashboard');
 */
export function redirectUnauthToSignIn(
  request: NextRequest,
  backTo: string,
): NextResponse {
  const locale = resolveLocaleFromCookie(
    request.cookies.get('NEXT_LOCALE')?.value,
  );
  const cleanBackTo = backTo.startsWith('/') ? backTo : `/${backTo}`;
  const signInPath = buildSignInUrl({
    locale,
    redirect: `/${locale}${cleanBackTo}`,
  });
  return NextResponse.redirect(new URL(signInPath, request.url));
}

/**
 * For server components — combined auth check + redirect. Returns the
 * authenticated user (and a ready-to-use Supabase client + locale) if signed
 * in; otherwise calls `redirect()` to send them to the sign-in page with
 * `returnPath` preserved.
 *
 * `returnPath` is the unprefixed path the user should return to after signing
 * in (e.g. `'/settings'`); locale is added automatically.
 *
 * Reuses {@link getCachedUser} so this hits React's per-request cache instead
 * of issuing a second `supabase.auth.getUser()` round-trip (a cross-region hop
 * in prod) when an ancestor layout has already validated the session.
 *
 * @example
 *   const { user, supabase } = await requireAuthOrRedirect('/settings');
 */
export async function requireAuthOrRedirect(returnPath: string) {
  const { user, supabase } = await getCachedUser();

  if (!user) {
    const locale = await getLocale();
    const cleanReturnPath = returnPath.startsWith('/')
      ? returnPath
      : `/${returnPath}`;
    nextRedirect(
      buildSignInUrl({
        locale,
        redirect: `/${locale}${cleanReturnPath}`,
      }),
    );
  }

  const locale = await getLocale();
  return { user, supabase, locale };
}
