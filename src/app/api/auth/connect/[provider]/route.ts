import crypto from 'node:crypto';

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getOAuthProvider } from '@/libs/platforms/oauth-provider';
import { createClient } from '@/libs/supabase/server';

/**
 * Extracts the locale prefix from a path (e.g. '/en'), defaulting to '/en'.
 * Mirrors the inline sign-in redirect convention in `src/proxy.ts`.
 */
function getLocalePrefix(pathname: string): string {
  return pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[0]?.replace(/\/$/, '') ?? '/en';
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const localePrefix = getLocalePrefix(request.nextUrl.pathname);
  return NextResponse.redirect(new URL(`${localePrefix}/sign-in`, request.url));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;

  const provider = getOAuthProvider(providerId);
  if (!provider) {
    const localePrefix = getLocalePrefix(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`${localePrefix}/dashboard?error=unknown_provider`, request.url),
    );
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return redirectToSignIn(request);
  }

  // Generate and store a CSRF state token in a short-lived, per-provider cookie
  // (per-provider name so concurrent connects don't clobber each other).
  // `getAuthUrl` throws if the provider's credentials aren't configured — turn
  // that into a clean redirect instead of an unhandled 500 (mirrors the
  // unknown-provider branch above).
  try {
    const state = crypto.randomBytes(16).toString('hex');
    cookieStore.set(`oauth_state_${provider.id}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });

    return NextResponse.redirect(provider.getAuthUrl(state));
  } catch (err) {
    logger.error({ error: err, provider: provider.id }, 'OAuth connect: provider not configured');
    const localePrefix = getLocalePrefix(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`${localePrefix}/dashboard?error=provider_not_configured`, request.url),
    );
  }
}
