import { NextResponse } from 'next/server';

import {
  forbiddenError,
  internalError,
  invalidRequestError,
  logApiError,
  notFoundError,
} from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { createAdminClient } from '@/libs/supabase/admin';
import { getBaseUrl } from '@/utils/Helpers';
import { isValidUuid } from '@/utils/validation';

/**
 * POST /api/admin/users/[userId]/reset-password
 *
 * Sends a password reset email to a user.
 * Requires admin authentication.
 * Cannot reset own password (self-preservation).
 */
export const POST = withAdminAuth(async (_request, { user, params }) => {
  try {
    const { userId } = params;

    if (!isValidUuid(userId)) {
      return invalidRequestError('Invalid user ID format');
    }

    if (userId === user.id) {
      return forbiddenError('Cannot reset your own password via admin API');
    }

    const supabaseAdmin = createAdminClient();
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !targetUser.user) {
      logApiError(getUserError || new Error('User not found'), {
        endpoint: `/api/admin/users/${userId}/reset-password`,
        method: 'POST',
        userId: user.id,
        metadata: { targetUserId: userId },
      });
      return notFoundError('User');
    }

    if (!targetUser.user.email) {
      return invalidRequestError('User does not have an email address');
    }

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      targetUser.user.email,
      {
        redirectTo: `${getBaseUrl()}/auth/reset-password`,
      },
    );

    if (resetError) {
      logApiError(resetError, {
        endpoint: `/api/admin/users/${userId}/reset-password`,
        method: 'POST',
        userId: user.id,
        metadata: { targetUserId: userId },
      });
      return internalError('Failed to send reset email');
    }

    void logAdminAction({
      action: 'reset_password',
      targetType: 'user',
      targetId: userId,
      adminId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/users/[userId]/reset-password',
      method: 'POST',
    });
    return internalError();
  }
});
