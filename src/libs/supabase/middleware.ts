import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

import { Env } from '@/libs/Env';

export function createClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    },
  );
}

export type UpdateSessionResult = {
  response: NextResponse;
  user: import('@supabase/supabase-js').User | null;
};

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<UpdateSessionResult> {
  const supabase = createClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  return { response, user };
}
