import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  formatZodErrors,
  internalError,
  invalidRequestError,
  logApiError,
  saveFailedError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  language: z.enum(['en', 'hi', 'bn']).optional(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/).optional(),
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

    // Check if user already has preferences
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    let result;

    if (existing.length === 0) {
      const inserted = await db
        .insert(userPreferences)
        .values({
          userId: user.id,
          username: validated.username,
          emailNotifications: validated.emailNotifications ?? true,
          language: validated.language ?? 'en',
        })
        .returning();

      result = inserted[0];
    } else {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (validated.emailNotifications !== undefined) {
        updateData.emailNotifications = validated.emailNotifications;
      }
      if (validated.language !== undefined) {
        updateData.language = validated.language;
      }

      const updated = await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, user.id))
        .returning();

      result = updated[0];
    }

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
