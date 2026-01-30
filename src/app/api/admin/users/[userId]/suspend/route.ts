import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  forbiddenError,
  internalError,
  invalidRequestError,
  logApiError,
  unauthorizedError,
} from '@/libs/api/errors';
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { createAdminClient } from '@/libs/supabase/admin';
import { createClient } from '@/libs/supabase/server';
import { isValidUuid } from '@/utils/validation';

/**
 * POST /api/admin/users/[userId]/suspend
 *
 * Suspends a user by setting ban_duration to forever.
 * Requires admin authentication.
 * Cannot suspend own account (self-preservation).
 */
export async function POST(
  request: NextRequest,
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

    // 3. Prevent self-suspension
    if (userId === user.id) {
      return forbiddenError('Cannot suspend your own account');
    }

    // 4. Suspend user using admin client
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' }, // ~100 years (effectively permanent)
    );

    if (error) {
      logApiError(error, {
        endpoint: `/api/admin/users/${userId}/suspend`,
        method: 'POST',
        userId: user.id,
        metadata: { targetUserId: userId },
      });
      return internalError(error.message || 'Failed to suspend user');
    }

    // 5. Parse optional reason from request body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = typeof body.reason === 'string' ? body.reason : undefined;
    } catch {
      // Body is optional, ignore parse errors
    }

    // 6. Log audit entry (fire and forget - don't await)
    void logAdminAction({
      action: 'suspend_user',
      targetType: 'user',
      targetId: userId,
      adminId: user.id,
      metadata: reason ? { reason } : undefined,
    });

    // 7. Return success with updated user data
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
}
