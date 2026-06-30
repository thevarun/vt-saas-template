import type { AnalyticsMetrics } from '@/libs/api/admin/analytics';
import { queryKeys } from '@/libs/queries/keys';

/**
 * Client fetch function for the admin analytics metrics, paired with the
 * `useAdminAnalytics` hook (same key from the query-keys factory). The payload
 * is assembled server-side and exposed over `GET /api/admin/analytics`.
 */

export const adminAnalyticsQueryKey = queryKeys.admin.analytics;

export async function fetchAdminAnalytics(): Promise<AnalyticsMetrics> {
  const res = await fetch('/api/admin/analytics', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load analytics (${res.status})`);
  }
  return res.json() as Promise<AnalyticsMetrics>;
}
