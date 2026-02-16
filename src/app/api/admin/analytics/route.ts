import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAnalyticsMetrics } from '@/libs/api/admin/analytics';
import { forbiddenError, internalError, unauthorizedError } from '@/libs/api/errors';
import { isAdmin } from '@/libs/auth/isAdmin';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/admin/analytics
 * Returns analytics metrics for the admin dashboard
 * Requires admin authentication
 */
export async function GET(_request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return unauthorizedError('Authentication required');
    }

    if (!isAdmin(user)) {
      return forbiddenError('Admin access required');
    }

    // Fetch analytics metrics
    const metrics = await getAnalyticsMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return internalError('Failed to fetch analytics');
  }
}
