import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Pure, server-free helpers for the overlay auth-dialog flow.
 *
 * Deliberately imports NO server-only module (`next/headers`, `next-intl/server`,
 * `@/libs/supabase/*`) so this file stays safe to import from middleware
 * (`src/proxy.ts`) and API route handlers without dragging the Supabase server
 * client into those bundles. The server-component variant that needs the cached
 * user lives in `auth-redirects.ts` (`requireAuthOrRedirectToLanding`) — keep it
 * that way, mirroring the pure `safe-path.ts` ↔ server `auth-redirects.ts` split.
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
export function resolveLocaleFromCookie(cookieValue: string | undefined): string {
  if (cookieValue && AllLocales.includes(cookieValue as (typeof AllLocales)[number])) {
    return cookieValue;
  }
  return AppConfig.defaultLocale;
}

/**
 * For API routes (NextRequest) — redirect an unauthenticated user back to the
 * marketing landing page with the auth dialog open. `backTo` is the unprefixed
 * path the user should return to after signing in (e.g. `'dashboard'`,
 * `'settings'`); the locale prefix is added automatically.
 *
 * @example
 *   if (!user) return redirectUnauthToLanding(request, 'settings');
 */
export function redirectUnauthToLanding(
  request: NextRequest,
  backTo: string,
  tab: 'signin' | 'signup' = 'signin',
): NextResponse {
  const locale = resolveLocaleFromCookie(request.cookies.get('NEXT_LOCALE')?.value);
  const cleanBackTo = backTo.startsWith('/') ? backTo : `/${backTo}`;
  const landingPath = buildLandingAuthUrl({
    locale,
    redirect: `/${locale}${cleanBackTo}`,
    tab,
  });
  return NextResponse.redirect(new URL(landingPath, request.url));
}
