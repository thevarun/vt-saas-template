import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Pure, server-free helpers for the overlay auth-dialog flow.
 *
 * Deliberately imports NO server-only module (`next/headers`, `next-intl/server`,
 * `@/libs/supabase/*`) so this file stays safe to import from middleware
 * (`src/proxy.ts`) and API route handlers without dragging the Supabase server
 * client into those bundles. Server-component variants that need the cached user
 * live in `auth-redirects.ts` — keep it that way, mirroring the pure
 * `safe-path.ts` ↔ server `auth-redirects.ts` split.
 */

/**
 * Build a landing-page URL that auto-opens the overlay auth dialog.
 *
 * The landing page's `AuthDialogAutoOpener` reads `auth` to open the dialog
 * with the right tab; `redirect` is preserved so the user lands back where
 * they intended after authenticating. Locale prefixing follows
 * `localePrefix: 'as-needed'` — the default locale is unprefixed, others get a
 * `/<locale>` prefix.
 *
 * Query contract: `?auth=signin|signup&redirect=/path`.
 */
export function buildLandingAuthUrl({
  locale,
  redirect,
  tab = 'signin',
}: {
  locale: string;
  redirect: string;
  tab?: 'signin' | 'signup';
}): string {
  const localePrefix = locale === AppConfig.defaultLocale ? '' : `/${locale}`;
  const params = new URLSearchParams({ auth: tab, redirect });
  return `${localePrefix || '/'}?${params.toString()}`;
}

/**
 * Resolve a user's locale from the `NEXT_LOCALE` cookie, falling back to the
 * default locale. Used in API routes where `getLocale()` isn't available.
 */
export function resolveLocaleFromCookie(
  cookieValue: string | undefined,
): string {
  if (
    cookieValue
    && AllLocales.includes(cookieValue as (typeof AllLocales)[number])
  ) {
    return cookieValue;
  }
  return AppConfig.defaultLocale;
}

/**
 * Resolve the request's locale from the URL path prefix (e.g. `/hi/…`), falling
 * back to the `NEXT_LOCALE` cookie and then the default locale. Page requests
 * carry the locale in the path; API routes carry it only in the cookie.
 */
function resolveRequestLocale(request: NextRequest): string {
  const segment = request.nextUrl.pathname.match(/^\/([^/]+)/)?.[1];
  if (segment && AllLocales.includes(segment as (typeof AllLocales)[number])) {
    return segment;
  }
  return resolveLocaleFromCookie(request.cookies.get('NEXT_LOCALE')?.value);
}

/**
 * For request handlers (middleware / NextRequest) — redirect an unauthenticated
 * user back to the marketing landing page with the overlay auth dialog open.
 *
 * `backTo` is the full intended path to return to after signing in, INCLUDING
 * any query string (e.g. `/settings?tab=billing`). It is preserved verbatim in
 * the `redirect` param (URL-encoded by {@link buildLandingAuthUrl}) so a deep
 * link's query survives the round-trip — the landing page's read-side guard
 * (`toSafeInternalPath`) accepts a same-origin path that carries a `?query`.
 * The landing URL's locale prefix is derived from the request (path prefix,
 * falling back to the `NEXT_LOCALE` cookie).
 *
 * @example
 *   if (!user) return redirectUnauthToLanding(request, "/settings?tab=billing");
 */
export function redirectUnauthToLanding(
  request: NextRequest,
  backTo: string,
  tab: 'signin' | 'signup' = 'signin',
): NextResponse {
  const locale = resolveRequestLocale(request);
  const landingPath = buildLandingAuthUrl({ locale, redirect: backTo, tab });
  return NextResponse.redirect(new URL(landingPath, request.url));
}
