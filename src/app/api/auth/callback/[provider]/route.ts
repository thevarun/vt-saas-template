import { createHash, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { trackEventServer } from '@/libs/analytics/server';
import { logger } from '@/libs/Logger';
import { getOAuthProvider } from '@/libs/platforms/oauth-provider';
import { storeOAuthTokens } from '@/libs/platforms/oauth-token-storage';
import { createClient } from '@/libs/supabase/server';

// Generic post-connect destination. Forks can point this at their own page;
// the success/error result is carried as a query param.
const CONNECT_REDIRECT_PATH = '/dashboard';

/**
 * Extracts the locale prefix from a path (e.g. '/en'), defaulting to '/en'.
 * Mirrors the inline sign-in redirect convention in `src/proxy.ts`.
 */
function getLocalePrefix(pathname: string): string {
  return pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[0]?.replace(/\/$/, '') ?? '/en';
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

function connectRedirect(request: NextRequest, query: string): NextResponse {
  const localePrefix = getLocalePrefix(request.nextUrl.pathname);
  return redirectTo(request, `${localePrefix}${CONNECT_REDIRECT_PATH}?${query}`);
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const localePrefix = getLocalePrefix(request.nextUrl.pathname);
  return redirectTo(request, `${localePrefix}/sign-in`);
}

/**
 * Timing-safe equality for the CSRF state value. Hash both sides to a fixed
 * 32-byte digest first, mirroring the `withWebhookSecret` guard, so the
 * equal-length requirement of `timingSafeEqual` can't leak length via timing.
 */
function statesMatch(a: string, b: string): boolean {
  const expected = createHash('sha256').update(a).digest();
  const received = createHash('sha256').update(b).digest();
  return timingSafeEqual(expected, received);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;

  const provider = getOAuthProvider(providerId);
  if (!provider) {
    return connectRedirect(request, 'error=unknown_provider');
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const stateCookieName = `oauth_state_${provider.id}`;

  // Handle provider-side errors (user denied, etc.). Clear the state cookie on
  // the way out — no code is issued here, so leaving it alive is just hygiene
  // debt until its 5-minute maxAge expires.
  if (error) {
    cookieStore.delete(stateCookieName);
    return connectRedirect(
      request,
      `error=${error === 'access_denied' ? 'access_denied' : 'oauth_error'}`,
    );
  }

  // CSRF state validation (constant-time compare, then clear the cookie)
  const savedState = cookieStore.get(stateCookieName)?.value;
  cookieStore.delete(stateCookieName);

  if (!state || !savedState || !statesMatch(state, savedState)) {
    return connectRedirect(request, 'error=invalid_state');
  }

  if (!code) {
    return connectRedirect(request, 'error=missing_code');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await provider.exchangeCode(code);

    // Get authenticated user
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return redirectToSignIn(request);
    }

    // Store tokens via the provider seam
    const result = await storeOAuthTokens({
      provider,
      userId: user.id,
      providerToken: tokenResponse.access_token,
      providerRefreshToken: tokenResponse.refresh_token,
      scope: tokenResponse.scope ?? null,
      supabase,
      expiresIn: tokenResponse.expires_in,
    });

    if (!result.success) {
      return connectRedirect(request, 'error=db_error');
    }

    trackEventServer(
      'platform_connected',
      { provider: provider.id },
      user.id,
    ).catch((err: unknown) => {
      logger.warn({ err }, 'platform_connected tracking failed');
    });

    return connectRedirect(
      request,
      `success=${provider.id}_connected&name=${encodeURIComponent(result.username)}`,
    );
  } catch (err) {
    logger.error({ error: err }, 'OAuth callback error');
    return connectRedirect(request, 'error=token_exchange_failed');
  }
}
