import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/libs/api/rateLimit';

/**
 * Dev-only auth endpoint for automated testing (AI agents, E2E, scripts).
 * Accepts email/password via POST. Supports login and signup via `action` field.
 * Blocked in production.
 *
 * Hardening:
 *   - Requires NODE_ENV !== 'production'.
 *   - Requires ALLOW_DEV_LOGIN env var explicitly set to a truthy value.
 *   - Refuses if NEXT_PUBLIC_SUPABASE_URL hostname looks like a production project
 *     (no 'localhost' and no '127.0.0.1' and listed in PRODUCTION_SUPABASE_URLS).
 *   - Per-IP rate limit: 10 attempts / 60s.
 *
 * Reads raw process.env (not the validated Env) on purpose, so the production
 * block runs before env validation can throw.
 *
 * Usage:
 *   # Login (default)
 *   curl -X POST http://localhost:3000/api/auth/dev-login \
 *     -H 'Content-Type: application/json' \
 *     -d '{"email":"test@test.com","password":"password"}'
 *
 *   # Signup
 *   curl -X POST http://localhost:3000/api/auth/dev-login \
 *     -H 'Content-Type: application/json' \
 *     -d '{"email":"new@test.com","password":"Password1","action":"signup"}'
 */

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function looksLikeProductionSupabaseUrl(supabaseUrl: string): boolean {
  if (!supabaseUrl) {
    return true; // No URL is itself suspicious — refuse.
  }
  let host: string;
  try {
    host = new URL(supabaseUrl).hostname;
  } catch {
    return true;
  }
  // Local dev (Supabase CLI) is always allowed.
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return false;
  }
  // Explicit deny-list overrides everything else.
  const denyList = (process.env.PRODUCTION_SUPABASE_URLS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (denyList.some(prodUrl => supabaseUrl === prodUrl || host === prodUrl)) {
    return true;
  }
  // Otherwise, allow — assume the operator's local .env points at a non-prod project.
  return false;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 },
    );
  }

  if (!isTruthyEnv(process.env.ALLOW_DEV_LOGIN)) {
    return NextResponse.json(
      { error: 'Dev login is disabled. Set ALLOW_DEV_LOGIN=true to enable.' },
      { status: 403 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (looksLikeProductionSupabaseUrl(supabaseUrl)) {
    return NextResponse.json(
      { error: 'Dev login is refused against the configured Supabase project.' },
      { status: 403 },
    );
  }

  // Per-IP rate limit: 10 attempts / 60s.
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`dev-login:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: 'email and password are required' },
      { status: 400 },
    );
  }

  const action = body.action === 'signup' ? 'signup' : 'login';

  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Safe to ignore in route handler
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Safe to ignore
          }
        },
      },
    },
  );

  if (action === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Account created',
      user: { id: data.user?.id, email: data.user?.email },
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Authenticated',
    user: { id: data.user.id, email: data.user.email },
  });
}
