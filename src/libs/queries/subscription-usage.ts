import { queryKeys } from '@/libs/queries/keys';
import type { SubscriptionUsageResponse } from '@/libs/subscriptions/get-subscription-usage';

/**
 * Client fetch function for the subscription usage payload, paired with the
 * `useSubscriptionUsage` hook (same key from the query-keys factory). The data
 * itself is assembled server-side by `getSubscriptionUsage` (it reads via the
 * Drizzle `db` client) and exposed over `GET /api/subscriptions/usage`.
 */

export type { SubscriptionUsageResponse } from '@/libs/subscriptions/get-subscription-usage';

export const subscriptionUsageQueryKey = queryKeys.subscription.usage;

export async function fetchSubscriptionUsage(): Promise<SubscriptionUsageResponse> {
  const res = await fetch('/api/subscriptions/usage', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load subscription usage (${res.status})`);
  }
  return res.json() as Promise<SubscriptionUsageResponse>;
}
