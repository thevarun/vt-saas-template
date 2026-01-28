import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  language: z.enum(['en', 'hi', 'bn']),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/).optional(),
  isNewUser: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = preferencesSchema.parse(body);

    // Check if user already has preferences
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    let result;

    if (existing.length === 0) {
      // New user - insert new record
      const inserted = await db
        .insert(userPreferences)
        .values({
          userId: user.id,
          username: validated.username,
          emailNotifications: validated.emailNotifications,
          language: validated.language,
        })
        .returning();

      result = inserted[0];
    } else {
      // Existing user - update record
      const updated = await db
        .update(userPreferences)
        .set({
          emailNotifications: validated.emailNotifications,
          language: validated.language,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id))
        .returning();

      result = updated[0];
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save preferences', code: 'SAVE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        emailNotifications: result.emailNotifications,
        language: result.language,
        username: result.username,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
