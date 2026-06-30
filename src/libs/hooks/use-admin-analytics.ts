'use client';

import { useQuery } from '@tanstack/react-query';

import { adminAnalyticsQueryKey, fetchAdminAnalytics } from '@/libs/queries/admin-analytics';

/**
 * Reads the admin analytics dashboard metrics (total users, signups, activation
 * rate, charts) for `AnalyticsDashboard`. Reuses the shared query key so any
 * future invalidation is typo-proof, and inherits the global QueryClient
 * `staleTime` (60s) so navigating away and back within the window serves cached
 * data instead of refetching.
 */
export function useAdminAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsQueryKey,
    queryFn: fetchAdminAnalytics,
  });
}
