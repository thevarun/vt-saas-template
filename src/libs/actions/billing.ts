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

    // Look up the user's current subscription so we can reuse their Stripe
    // customer AND block double-subscribe. A query error throws and is caught
    // below as INTERNAL_ERROR — fail-closed, so we never create a checkout we
    // couldn't dedupe against an existing live subscription.
    const [sub] = await db
      .select({
        stripeCustomerId: userSubscriptions.stripeCustomerId,
        stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
        status: userSubscriptions.status,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, user.id))
      .limit(1);

    // Block double-subscribe. Anyone who already has a live Stripe subscription
    // must change plans via the billing portal, not by creating a second
    // subscription on the same customer. The UI routes them there, but this
    // Server Action is directly callable and a stale tab / double-submit /
    // back-nav would otherwise orphan a second paid subscription that keeps
    // billing. Expired/cancelled users have a null id (the deletion webhook
    // clears it) and fall through to checkout normally.
    if (sub?.stripeSubscriptionId) {
      return {
        data: null,
        error: {
          message: 'You already have an active subscription. Manage it from the billing portal.',
          code: 'CONFLICT',
        },
      };
    }

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
