import { NextResponse } from 'next/server';

import { internalError, logApiError } from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { getSubscriptionUsage } from '@/libs/subscriptions/get-subscription-usage';

/**
 * GET /api/subscriptions/usage
 *
 * Returns the authenticated user's subscription + tier + quota + usage payload —
 * the single read powering every subscription UI surface (the
 * `useSubscriptionUsage` hook, expiry banner, trial pill, plan cards).
 */
export const GET = withAuth(async (_request, { user }): Promise<Response> => {
  try {
    const usage = await getSubscriptionUsage(user.id);
    if (!usage) {
      // null = a fatal data-integrity issue (e.g. the free tier isn't seeded).
      return internalError('Failed to load subscription usage');
    }
    return NextResponse.json(usage);
  } catch (error: unknown) {
    logApiError(error, {
      endpoint: '/api/subscriptions/usage',
      method: 'GET',
    });
    return internalError();
  }
});
