import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  formatZodErrors,
  internalError,
  invalidRequestError,
  logApiError,
  saveFailedError,
  validationError,
} from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { db } from '@/libs/DB';
import { userPreferences } from '@/models/Schema';

// This route owns the notification/language preference surface. Username is set
// once at onboarding via the dedicated flow and is intentionally not writable
// here, so it stays out of the schema (the `.unique()` column has its own
// conflict semantics that don't belong on this idempotent preference write).
const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  language: z.enum(['en', 'hi', 'bn']).optional(),
});

type PreferencesResponse = {
  emailNotifications: boolean;
  language: string;
  username: string | null;
};

/**
 * GET — returns the signed-in user's preferences. If no row exists yet
 * (new user), returns the schema defaults without inserting.
 *
 * Returns the bare `{ emailNotifications, language, username }` payload (no
 * `{ success, data }` envelope) because `use-user-preferences` reads these
 * fields at the top level of the JSON response.
 */
export const GET = withAuth(async (_request, { user }) => {
  try {
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    const row = existing[0];
    const payload: PreferencesResponse = row
      ? {
          emailNotifications: row.emailNotifications,
          language: row.language,
          username: row.username,
        }
      : {
          emailNotifications: true,
          language: 'en',
          username: null,
        };

    return NextResponse.json(payload);
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/profile/preferences',
      method: 'GET',
    });
    return internalError();
  }
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
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

    // Atomic upsert: insert defaults for a brand-new user, or update only the
    // fields the caller actually sent. A single statement avoids the
    // check-then-write race two concurrent first-time writes would hit on the
    // `user_id` unique constraint. Mirrors `/api/profile/update-preferences`.
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

    const payload: PreferencesResponse = {
      emailNotifications: result.emailNotifications,
      language: result.language,
      username: result.username,
    };

    return NextResponse.json(payload);
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/profile/preferences',
      method: 'PATCH',
    });
    return internalError();
  }
});
