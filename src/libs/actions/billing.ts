'use server';

import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

import { withActionAuth } from '@/libs/api/withActionAuth';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { getStripe } from '@/libs/stripe/client';
import type { BillingInterval } from '@/models/Schema';
import { subscriptionTiers, userSubscriptions } from '@/models/Schema';
import { getBaseUrl } from '@/utils/Helpers';

import type { ActionResult } from './types';

// Where Stripe redirects the user back to after checkout / the billing portal.
// A product repoints this to its own billing page (it's the only product-route
// coupling in this file).
const BILLING_RETURN_PATH = '/subscriptions';

type CheckoutOptions = {
  /** Default 'monthly'. Determines which Stripe price ID is used. */
  interval?: BillingInterval;
};

function priceIdForInterval(
  tier: { stripePriceIdMonthly: string | null; stripePriceIdYearly: string | null },
  interval: BillingInterval,
): string | null {
  return interval === 'yearly' ? tier.stripePriceIdYearly : tier.stripePriceIdMonthly;
}

const createCheckoutSessionInner = withActionAuth(async (
  { user },
  input: { tierName: string; options: CheckoutOptions },
): Promise<ActionResult<{ checkoutUrl: string }>> => {
  const { tierName, options } = input;
  const interval = options.interval ?? 'monthly';

  try {
    const [tier] = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.name, tierName))
      .limit(1);

    if (!tier) {
      return { data: null, error: { message: 'This tier is not available for purchase', code: 'FORBIDDEN' } };
    }

    if (!tier.stripePriceIdMonthly && !tier.stripePriceIdYearly) {
      return { data: null, error: { message: 'This tier is not available for purchase', code: 'FORBIDDEN' } };
    }

    const priceId = priceIdForInterval(tier, interval);
    if (!priceId) {
      return { data: null, error: { message: 'This billing interval is not available for this tier', code: 'FORBIDDEN' } };
    }

    const [sub] = await db
      .select({ stripeCustomerId: userSubscriptions.stripeCustomerId })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, user.id))
      .limit(1);

    const appUrl = getBaseUrl();

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(sub?.stripeCustomerId
        ? { customer: sub.stripeCustomerId }
        : { customer_email: user.email }),
      metadata: { user_id: user.id, billing_interval: interval },
      success_url: `${appUrl}${BILLING_RETURN_PATH}?checkout=success`,
      cancel_url: `${appUrl}${BILLING_RETURN_PATH}`,
    });

    if (!session.url) {
      logger.error('Stripe checkout session created but no URL returned');
      return { data: null, error: { message: 'Failed to create checkout session', code: 'SERVICE_UNAVAILABLE' } };
    }

    return { data: { checkoutUrl: session.url }, error: null };
  } catch (err) {
    Sentry.captureException(err, {
      contexts: { billing: { tierName, action: 'createCheckoutSession' } },
    });
    if (err instanceof Stripe.errors.StripeError) {
      logger.error({ err }, 'Stripe API error in createCheckoutSession');
      return { data: null, error: { message: 'Payment service error. Please try again.', code: 'SERVICE_UNAVAILABLE' } };
    }
    logger.error({ err }, 'Unexpected error in createCheckoutSession');
    return { data: null, error: { message: 'Failed to create checkout session', code: 'INTERNAL_ERROR' } };
  }
});

export async function createCheckoutSession(
  tierName: string,
  options: CheckoutOptions = {},
): Promise<ActionResult<{ checkoutUrl: string }>> {
  return createCheckoutSessionInner({ tierName, options });
}

const createPortalSessionInner = withActionAuth(async (
  { user },
  options: { intent?: 'reactivate' | 'manage' },
): Promise<ActionResult<{ portalUrl: string }>> => {
  try {
    const [sub] = await db
      .select({ stripeCustomerId: userSubscriptions.stripeCustomerId })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, user.id))
      .limit(1);

    if (!sub?.stripeCustomerId) {
      return { data: null, error: { message: 'No billing account found. Please subscribe first.', code: 'NOT_FOUND' } };
    }

    const appUrl = getBaseUrl();

    // Tag the return URL with the portal intent so the UI can show the right
    // toast when the user returns. Validates against a fixed allow-list.
    const validIntents = ['reactivate', 'manage'] as const;
    const intent = validIntents.includes(options.intent as typeof validIntents[number])
      ? options.intent
      : undefined;
    const returnUrl = intent
      ? `${appUrl}${BILLING_RETURN_PATH}?portal=${intent}`
      : `${appUrl}${BILLING_RETURN_PATH}`;

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });

    return { data: { portalUrl: portalSession.url }, error: null };
  } catch (err) {
    Sentry.captureException(err, {
      contexts: { billing: { action: 'createPortalSession' } },
    });
    if (err instanceof Stripe.errors.StripeError) {
      logger.error({ err }, 'Stripe API error in createPortalSession');
      return { data: null, error: { message: 'Payment service error. Please try again.', code: 'SERVICE_UNAVAILABLE' } };
    }
    logger.error({ err }, 'Unexpected error in createPortalSession');
    return { data: null, error: { message: 'Failed to create billing portal session', code: 'INTERNAL_ERROR' } };
  }
});

export async function createPortalSession(
  options: { intent?: 'reactivate' | 'manage' } = {},
): Promise<ActionResult<{ portalUrl: string }>> {
  return createPortalSessionInner(options);
}
