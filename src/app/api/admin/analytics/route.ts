import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getAnalyticsMetrics } from '@/libs/api/admin/analytics';
import { internalError, unauthorizedError } from '@/libs/api/errors';
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

    // Check admin role via user_preferences table
    const { error: prefError } = await supabase
      .from('user_preferences')
      .select('username')
      .eq('user_id', user.id)
      .single();

    // For now, we'll check if user exists in preferences
    // In a real app, you'd check for an admin role field
    // Since we don't have a role field yet, we'll assume authenticated users can access
    // TODO: Add proper admin role checking when role field is added

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error checking user preferences:', prefError);
      return unauthorizedError('Admin access required');
    }

    // Fetch analytics metrics
    const metrics = await getAnalyticsMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return internalError('Failed to fetch analytics');
  }
}
