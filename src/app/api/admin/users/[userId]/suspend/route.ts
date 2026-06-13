import { NextResponse } from 'next/server';

import {
  forbiddenError,
  internalError,
  invalidRequestError,
  logApiError,
} from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { createAdminClient } from '@/libs/supabase/admin';
import { isValidUuid } from '@/utils/validation';

/**
 * POST /api/admin/users/[userId]/suspend
 *
 * Suspends a user by setting ban_duration to forever.
 * Requires admin authentication.
 * Cannot suspend own account (self-preservation).
 */
export const POST = withAdminAuth<{ userId: string }>(async (request, { user, params }) => {
  try {
    const { userId } = params ?? { userId: '' };

    if (!isValidUuid(userId)) {
      return invalidRequestError('Invalid user ID format');
    }

    if (userId === user.id) {
      return forbiddenError('Cannot suspend your own account');
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' },
    );

    if (error) {
      logApiError(error, {
        endpoint: `/api/admin/users/${userId}/suspend`,
        method: 'POST',
        userId: user.id,
        metadata: { targetUserId: userId },
      });
      return internalError('Failed to suspend user');
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = typeof body.reason === 'string' ? body.reason : undefined;
    } catch {
      // Body is optional, ignore parse errors
    }

    void logAdminAction({
      action: 'suspend_user',
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
      endpoint: '/api/admin/users/[userId]/suspend',
      method: 'POST',
    });
    return internalError();
  }
});
