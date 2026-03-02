import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { internalError, invalidRequestError, logApiError, unauthorizedError, validationError } from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { usernameSchema } from '@/libs/validations/username';
import { userPreferences } from '@/models/Schema';

const checkUsernameSchema = z.object({
  username: usernameSchema,
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
}
