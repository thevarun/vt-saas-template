'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchSubscriptionUsage,
  subscriptionUsageQueryKey,
} from '@/libs/queries/subscription-usage';

export type { SubscriptionUsageResponse } from '@/libs/queries/subscription-usage';

/**
 * Reads the current user's subscription + tier + quota + usage. Powers the
 * expiry banner, trial pill, and plan cards. Reuses the same query key as the
 * fetch function so any invalidation (e.g. after Stripe checkout returns) is
 * typo-proof.
 */
export function useSubscriptionUsage() {
  return useQuery({
    queryKey: subscriptionUsageQueryKey,
    queryFn: fetchSubscriptionUsage,
  });
}

/**
 * Returns a callback that invalidates the subscription-usage cache — call it
 * after a billing action (checkout success, portal return) so the UI re-reads
 * the freshest plan state.
 */
export function useInvalidateSubscriptionUsage() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: subscriptionUsageQueryKey });
}
