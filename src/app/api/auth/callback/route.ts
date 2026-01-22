import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
              // Cookie setting can fail in middleware
              // This is safe to ignore as cookies are set by the browser
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {
              // Cookie removal can fail in middleware
              // This is safe to ignore
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully exchanged code for session
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return the user to an error page with instructions
  // Extract locale from the 'next' parameter or default to 'en'
  const localeMatch = next.match(/^\/([^/]+)\//);
  const locale = localeMatch?.[1] ?? 'en';
  return NextResponse.redirect(new URL(`/${locale}/auth-code-error`, request.url));
}
