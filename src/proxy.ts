/* eslint-disable simple-import-sort/imports */
import type { NextFetchEvent, NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {

  NextResponse,
} from 'next/server';
/* eslint-enable simple-import-sort/imports */

import { isAdmin } from '@/libs/auth/isAdmin';
import { updateSession } from '@/libs/supabase/middleware';
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
  '/admin',
  '/settings',
];

// Routes that require admin privileges
const adminPaths = ['/admin'];

// Routes that don't require email verification
const verificationWhitelist = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/auth/',
  '/forgot-password',
  '/reset-password',
];

/**
 * Extracts the locale prefix from a pathname, if present.
 * Returns e.g. '/en', '/hi', '/bn', or '' for paths without a locale segment.
 */
function getLocalePrefix(pathname: string): string {
  const segment = pathname.match(/^\/([^/]+)/)?.at(1) ?? '';
  return AllLocales.includes(segment as any) ? `/${segment}` : '';
}

/**
 * Returns true if pathname contains the path as a distinct path segment
 * (after optional locale prefix). E.g., '/en/dashboard' matches '/dashboard',
 * '/api/chat' matches '/chat', but '/en/chatty' does NOT match '/chat'.
 *
 * Since all segments start with '/', endsWith/includes naturally enforce
 * boundary checks (e.g., '/chatty'.endsWith('/chat') is false).
 */
function containsSegment(pathname: string, segment: string): boolean {
  const localePrefix = getLocalePrefix(pathname);
  const stripped = localePrefix ? pathname.slice(localePrefix.length) : pathname;
  return stripped.endsWith(segment) || stripped.includes(`${segment}/`);
}

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some(path => containsSegment(pathname, path));
}

function requiresVerification(pathname: string): boolean {
  return !verificationWhitelist.some(path => containsSegment(pathname, path));
}

function isAdminRoute(pathname: string): boolean {
  return adminPaths.some(path => containsSegment(pathname, path));
}

export async function proxy(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  // Apply internationalization middleware first
  const response = intlMiddleware(request);

  // Single getUser() call — session update and auth check combined
  const { user } = await updateSession(request, response);

  // Check if route requires authentication
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!user) {
      // For API routes, return a JSON 401 instead of redirecting so
      // client-side fetches don't try to parse an HTML error page.
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 },
        );
      }

      const localePrefix = getLocalePrefix(request.nextUrl.pathname);
      const signInUrl = new URL(`${localePrefix}/sign-in`, request.url);
      // Store intended destination for redirect after sign-in
      signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check email verification for protected routes
    if (user && !user.email_confirmed_at && requiresVerification(request.nextUrl.pathname)) {
      const localePrefix = getLocalePrefix(request.nextUrl.pathname);
      const verifyUrl = new URL(`${localePrefix}/verify-email`, request.url);
      verifyUrl.searchParams.set('email', user.email || '');
      return NextResponse.redirect(verifyUrl);
    }

    // Check admin routes - redirect non-admins to dashboard
    if (user && isAdminRoute(request.nextUrl.pathname)) {
      if (!isAdmin(user)) {
        const localePrefix = getLocalePrefix(request.nextUrl.pathname);
        const dashboardUrl = new URL(`${localePrefix}/dashboard?error=access_denied`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
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
