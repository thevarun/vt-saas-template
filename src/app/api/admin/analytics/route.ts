import { NextResponse } from 'next/server';

import { getAnalyticsMetrics } from '@/libs/api/admin/analytics';
import { internalError, logApiError } from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';

/**
 * GET /api/admin/analytics
 * Returns analytics metrics for the admin dashboard
 * Requires admin authentication
 */
export const GET = withAdminAuth(async () => {
  try {
    const metrics = await getAnalyticsMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/analytics',
      method: 'GET',
    });
    return internalError('Failed to fetch analytics');
  }
});
