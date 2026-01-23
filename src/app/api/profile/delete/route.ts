import * as Sentry from '@sentry/nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  internalError,
  logApiError,
  serviceUnavailableError,
  unauthorizedError,
} from '@/libs/api/errors';
import { logger } from '@/libs/Logger';
import { createAdminClient } from '@/libs/supabase/admin';
import { createClient } from '@/libs/supabase/server';

/**
 * DELETE /api/profile/delete
 * Deletes the authenticated user's account
 *
 * This endpoint requires:
 * 1. Valid Supabase session (user must be authenticated)
 * 2. SUPABASE_SERVICE_ROLE_KEY configured (admin operations require service role)
 *
 * Returns:
 * - 200: Account deleted successfully
 * - 401: User not authenticated
 * - 503: Service role key not configured
 * - 500: Unexpected error during deletion
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    // Verify user is authenticated using regular client
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    Sentry.addBreadcrumb({
      category: 'profile',
      message: 'Account deletion initiated',
      data: { userId: user.id },
    });

    // Create admin client for user deletion
    // This requires SUPABASE_SERVICE_ROLE_KEY
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      logger.error('SUPABASE_SERVICE_ROLE_KEY not configured for account deletion');
      return serviceUnavailableError(
        'Account deletion service is not configured. Please contact support.',
      );
    }

    // Delete user using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      logApiError(deleteError, {
        endpoint: '/api/profile/delete',
        method: 'DELETE',
        errorCode: 'DB_ERROR',
        statusCode: 500,
        userId: user.id,
      });
      Sentry.captureException(deleteError);
      return internalError('Failed to delete account. Please try again.');
    }

    logger.info({ userId: user.id }, 'User account deleted successfully');

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    logApiError(error, {
      endpoint: '/api/profile/delete',
      method: 'DELETE',
      errorCode: 'INTERNAL_ERROR',
      statusCode: 500,
    });
    Sentry.captureException(error);
    return internalError();
  }
}
