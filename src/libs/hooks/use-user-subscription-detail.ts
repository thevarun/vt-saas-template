'use client';

import { useQuery } from '@tanstack/react-query';

import { getUserSubscriptionDetail } from '@/libs/actions/subscriptions';

/**
 * Reads a single user's subscription summary for the admin detail panel. Powers
 * the "Subscription" section and pre-fills the Assign Tier dialog. Shares its
 * query key with the invalidation call in `UserDetailDialog` so a grant refreshes
 * the panel immediately.
 *
 * A NOT_FOUND result means the user simply has no subscription row — surfaced as
 * `null` data, not an error.
 */
export function useUserSubscriptionDetail(userId: string | null) {
  return useQuery({
    queryKey: ['user-subscription-detail', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('No userId');
      }
      const result = await getUserSubscriptionDetail(userId);
      if (result.error) {
        // NOT_FOUND means the user simply has no subscription row — not an error.
        if (result.error.code === 'NOT_FOUND') {
          return null;
        }
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 30_000, // 30s — subscription data changes infrequently.
  });
}
