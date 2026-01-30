import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  forbiddenError,
  internalError,
  invalidRequestError,
  logApiError,
  notFoundError,
  unauthorizedError,
} from '@/libs/api/errors';
import { isAdmin } from '@/libs/auth/isAdmin';
import { createAdminClient } from '@/libs/supabase/admin';
import { createClient } from '@/libs/supabase/server';
import { isValidUuid } from '@/utils/validation';

/**
 * DELETE /api/admin/users/[userId]
 *
 * Permanently deletes a user account.
 * Requires admin authentication.
 * Cannot delete own account (self-preservation).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    if (!isAdmin(user)) {
      return forbiddenError('Admin access required');
    }

    // 2. Get userId from params
    const { userId } = await params;

    // Validate userId format
    if (!isValidUuid(userId)) {
      return invalidRequestError('Invalid user ID format');
    }

    // 3. Prevent self-deletion
    if (userId === user.id) {
      return forbiddenError('Cannot delete your own account');
    }

    // 4. Delete user using admin client
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      logApiError(error, {
        endpoint: `/api/admin/users/${userId}`,
        method: 'DELETE',
        userId: user.id,
        metadata: { targetUserId: userId },
      });

      // Handle user not found
      if (error.message?.includes('not found') || error.message?.includes('User not found')) {
        return notFoundError('User');
      }

      return internalError(error.message || 'Failed to delete user');
    }

    // 5. Return success
    // Note: Audit logging integration point for Story 6.6
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/users/[userId]',
      method: 'DELETE',
    });
    return internalError();
  }
}
