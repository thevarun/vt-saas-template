/* eslint-disable simple-import-sort/imports */
import type { NextFetchEvent, NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {

  NextResponse,
} from 'next/server';
/* eslint-enable simple-import-sort/imports */

import { createClient, updateSession } from '@/libs/supabase/middleware';
import { AllLocales, AppConfig } from './utils/AppConfig';

const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

const protectedPaths = [
  '/dashboard',
  '/onboarding',
  '/chat',
];

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some(path => pathname.includes(path));
}

export async function middleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  // Apply internationalization middleware first
  const response = intlMiddleware(request);

  // Update Supabase session cookies on the response
  await updateSession(request, response);

  // Check if route requires authentication
  if (isProtectedRoute(request.nextUrl.pathname)) {
    const supabase = createClient(request, response);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // For API routes, return a JSON 401 instead of redirecting so
      // client-side fetches don't try to parse an HTML error page.
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 },
        );
      }

      const locale
        = request.nextUrl.pathname.match(/^\/([^/]+)/)?.at(1) ?? '';
      const isLocale = AllLocales.includes(locale as any);
      const localePrefix = isLocale ? `/${locale}` : '';

      const signInUrl = new URL(`${localePrefix}/sign-in`, request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

export const config = {
  // Important: exclude API routes and auth callback so they aren't run through locale middleware.
  // The chat API already validates auth server-side and doesn't need locale prefixes.
  // Auth callback handles locale via query param to support email verification links.
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring|api|auth|trpc).*)', '/'],
};
