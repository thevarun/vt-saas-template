import { db } from '@/libs/DB';
import { tierQuotas } from '@/models/Schema';

import { invalidateQuotaCache } from './quota';

/**
 * Invalidates every cached quota state for a user — iterates the resource types
 * defined across all tiers (the cache is keyed by user+resourceType).
 *
 * Shared by the force-expire cron and the admin tier-grant action so both drop
 * the same set of caches after mutating a user's subscription.
 */
export async function invalidateAllQuotaCaches(userId: string): Promise<void> {
  const rows = await db
    .selectDistinct({ resourceType: tierQuotas.resourceType })
    .from(tierQuotas);
  for (const { resourceType } of rows) {
    invalidateQuotaCache(userId, resourceType);
  }
}
