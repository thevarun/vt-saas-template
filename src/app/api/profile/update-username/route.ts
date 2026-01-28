import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores'),
});

export async function PATCH(request: Request) {
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
    const validation = updateUsernameSchema.safeParse(body);
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

    // Check if username is already taken by another user
    const existingProfile = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.username, username))
      .limit(1);

    const existingUser = existingProfile[0];
    if (existingUser && existingUser.userId !== user.id) {
      return NextResponse.json(
        { error: 'Username is already taken', code: 'USERNAME_TAKEN' },
        { status: 409 },
      );
    }

    // Get current user preferences
    const currentProfile = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const profile = currentProfile[0];
    if (profile) {
      // Update existing profile
      await db
        .update(userPreferences)
        .set({
          username,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id));
    } else {
      // Create new profile with default preferences
      await db.insert(userPreferences).values({
        userId: user.id,
        username,
        emailNotifications: true,
        language: 'en',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update username error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
