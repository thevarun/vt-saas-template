import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  conflictError,
  internalError,
  invalidRequestError,
  logApiError,
  unauthorizedError,
} from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';

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

    const { username, displayName } = body;

    if (!username || !displayName) {
      return invalidRequestError('Username and display name are required');
    }

    if (!/^\w+$/.test(username) || username.length < 3 || username.length > 20) {
      return invalidRequestError('Invalid username format');
    }

    // Check if username is already taken by another user
    if (user.user_metadata?.username !== username) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        logApiError(listError, {
          endpoint: '/api/profile/update',
          method: 'POST',
          userId: user.id,
          metadata: { operation: 'check_username' },
        });
        return internalError('Failed to check username availability');
      }

      const usernameTaken = users.users.some(
        u => u.id !== user.id && u.user_metadata?.username === username,
      );

      if (usernameTaken) {
        return conflictError('Username is already taken');
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
