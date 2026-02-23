import { NextResponse } from 'next/server';

import {
  forbiddenError,
  internalError,
  invalidRequestError,
  logApiError,
  notFoundError,
} from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { createAdminClient } from '@/libs/supabase/admin';
import { isValidUuid } from '@/utils/validation';

/**
 * DELETE /api/admin/users/[userId]
 *
 * Permanently deletes a user account.
 * Requires admin authentication.
 * Cannot delete own account (self-preservation).
 */
export const DELETE = withAdminAuth(async (_request, { user, params }) => {
  try {
    const { userId } = params;

    if (!isValidUuid(userId)) {
      return invalidRequestError('Invalid user ID format');
    }

    if (userId === user.id) {
      return forbiddenError('Cannot delete your own account');
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      logApiError(error, {
        endpoint: `/api/admin/users/${userId}`,
        method: 'DELETE',
        userId: user.id,
        metadata: { targetUserId: userId },
      });

      if (error.message?.includes('not found') || error.message?.includes('User not found')) {
        return notFoundError('User');
      }

      return internalError('Failed to delete user');
    }

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
});
