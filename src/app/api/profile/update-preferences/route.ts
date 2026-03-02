import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { formatZodErrors, internalError, invalidRequestError, logApiError, saveFailedError, unauthorizedError, validationError } from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { usernameSchema } from '@/libs/validations/username';
import { userPreferences } from '@/models/Schema';

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  language: z.enum(['en', 'hi', 'bn']).optional(),
  username: usernameSchema.optional(),
  isNewUser: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(formatZodErrors(parsed.error), 'Invalid request data');
    }

    const validated = parsed.data;

    // Upsert preferences: insert if new, update if existing
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (validated.emailNotifications !== undefined) {
      updateData.emailNotifications = validated.emailNotifications;
    }
    if (validated.language !== undefined) {
      updateData.language = validated.language;
    }

    const [result] = await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        username: validated.username,
        emailNotifications: validated.emailNotifications ?? true,
        language: validated.language ?? 'en',
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: updateData,
      })
      .returning();

    if (!result) {
      return saveFailedError('Failed to save preferences');
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
    logApiError(error, {
      endpoint: '/api/profile/update-preferences',
      method: 'PATCH',
    });
    return internalError();
  }
}
