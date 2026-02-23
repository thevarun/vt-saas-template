import { NextResponse } from 'next/server';

import {
  internalError,
  invalidRequestError,
  logApiError,
} from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { createAdminClient } from '@/libs/supabase/admin';
import { isValidUuid } from '@/utils/validation';

/**
 * POST /api/admin/users/[userId]/unsuspend
 *
 * Unsuspends a user by clearing ban_duration.
 * Requires admin authentication.
 */
export const POST = withAdminAuth(async (request, { user, params }) => {
  try {
    const { userId } = params;

    if (!isValidUuid(userId)) {
      return invalidRequestError('Invalid user ID format');
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: 'none' },
    );

    if (error) {
      logApiError(error, {
        endpoint: `/api/admin/users/${userId}/unsuspend`,
        method: 'POST',
        userId: user.id,
        metadata: { targetUserId: userId },
      });
      return internalError('Failed to unsuspend user');
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = typeof body.reason === 'string' ? body.reason : undefined;
    } catch {
      // Body is optional, ignore parse errors
    }

    void logAdminAction({
      action: 'unsuspend_user',
      targetType: 'user',
      targetId: userId,
      adminId: user.id,
      metadata: reason ? { reason } : undefined,
    });

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/users/[userId]/unsuspend',
      method: 'POST',
    });
    return internalError();
  }
});
