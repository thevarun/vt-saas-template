import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { internalError, invalidRequestError, logApiError, validationError } from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { db } from '@/libs/DB';
import { usernameSchema } from '@/libs/validations/username';
import { userPreferences } from '@/models/Schema';

const checkUsernameSchema = z.object({
  username: usernameSchema,
});

export const POST = withAuth(async (request, { user }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const validation = checkUsernameSchema.safeParse(body);
    if (!validation.success) {
      return validationError(
        { _error: [validation.error.issues[0]?.message || 'Invalid username format'] },
      );
    }

    const { username } = validation.data;

    const existingProfile = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.username, username))
      .limit(1);

    const existingUser = existingProfile[0];
    if (existingUser) {
      const isCurrentUser = existingUser.userId === user.id;
      return NextResponse.json({ available: isCurrentUser });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/profile/check-username',
      method: 'POST',
    });
    return internalError();
  }
});
