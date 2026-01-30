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
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { createAdminClient } from '@/libs/supabase/admin';
import { createClient } from '@/libs/supabase/server';
import { getBaseUrl } from '@/utils/Helpers';
import { isValidUuid } from '@/utils/validation';

/**
 * POST /api/admin/users/[userId]/reset-password
 *
 * Sends a password reset email to a user.
 * Requires admin authentication.
 * Cannot reset own password (self-preservation).
 */
export async function POST(
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

    // 3. Prevent self-reset
    if (userId === user.id) {
      return forbiddenError('Cannot reset your own password via admin API');
    }

    // 4. Get user email from admin API
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

    // 5. Send password reset email
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
      return internalError(resetError.message || 'Failed to send reset email');
    }

    // 6. Log audit entry (fire and forget - don't await)
    void logAdminAction({
      action: 'reset_password',
      targetType: 'user',
      targetId: userId,
      adminId: user.id,
    });

    // 7. Return success
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
}
