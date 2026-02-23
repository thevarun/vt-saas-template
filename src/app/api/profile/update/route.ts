import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  conflictError,
  formatZodErrors,
  internalError,
  logApiError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be at most 50 characters')
    .regex(/^[\w\s'-]+$/, 'Display name contains invalid characters'),
});

export async function POST(request: Request) {
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
      return validationError('Invalid JSON in request body');
    }

    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      const errors = formatZodErrors(validation.error);
      return validationError(errors);
    }
    const { username, displayName } = validation.data;

    // Check if username is already taken by another user
    if (user.user_metadata?.username !== username) {
      try {
        const existingProfile = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.username, username))
          .limit(1);

        const existingUser = existingProfile[0];
        if (existingUser && existingUser.userId !== user.id) {
          return conflictError('Username is already taken');
        }
      } catch (dbError) {
        logApiError(dbError, {
          endpoint: '/api/profile/update',
          method: 'POST',
          userId: user.id,
          metadata: { operation: 'check_username' },
        });
        return internalError('Failed to check username availability');
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        username,
        display_name: displayName,
      },
    });

    if (updateError) {
      logApiError(updateError, {
        endpoint: '/api/profile/update',
        method: 'POST',
        userId: user.id,
        metadata: { operation: 'update_profile' },
      });
      return internalError('Failed to update profile');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/profile/update',
      method: 'POST',
    });
    return internalError();
  }
}
