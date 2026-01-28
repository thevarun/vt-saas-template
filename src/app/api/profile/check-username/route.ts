import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores'),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate username format
    const validation = usernameSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || 'Invalid username format',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    const { username } = validation.data;

    // Check if username exists in database
    const existingProfile = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.username, username))
      .limit(1);

    // If username exists and belongs to current user, it's available
    const existingUser = existingProfile[0];
    if (existingUser) {
      const isCurrentUser = existingUser.userId === user.id;
      return NextResponse.json({ available: isCurrentUser });
    }

    // Username doesn't exist, it's available
    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
