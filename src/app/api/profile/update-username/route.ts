import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { internalError, invalidRequestError, logApiError, usernameTakenError, validationError } from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { db } from '@/libs/DB';
import { usernameSchema } from '@/libs/validations/username';
import { userPreferences } from '@/models/Schema';

const updateUsernameSchema = z.object({
  username: usernameSchema,
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const validation = updateUsernameSchema.safeParse(body);
    if (!validation.success) {
      return validationError(
        { _error: [validation.error.issues[0]?.message || 'Invalid username format'] },
      );
    }

    const { username } = validation.data;

    // Check username availability and get current profile in parallel
    const [existingProfile, currentProfile] = await Promise.all([
      db.select().from(userPreferences).where(eq(userPreferences.username, username)).limit(1),
      db.select().from(userPreferences).where(eq(userPreferences.userId, user.id)).limit(1),
    ]);

    const existingUser = existingProfile[0];
    if (existingUser && existingUser.userId !== user.id) {
      return usernameTakenError();
    }

    const profile = currentProfile[0];
    try {
      if (profile) {
        await db
          .update(userPreferences)
          .set({
            username,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, user.id));
      } else {
        await db.insert(userPreferences).values({
          userId: user.id,
          username,
          emailNotifications: true,
          language: 'en',
        });
      }
    } catch (dbError: unknown) {
      // Catch UNIQUE constraint violation (race condition safety net)
      const code = (dbError as Record<string, unknown>)?.code;
      if (code === '23505') {
        return usernameTakenError();
      }
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/profile/update-username',
      method: 'PATCH',
    });
    return internalError();
  }
});
