import { Buffer } from "node:buffer";

import * as Sentry from "@sentry/nextjs";
import { eq, or } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { trackEventServer } from "@/libs/analytics/server";
import { db } from "@/libs/DB";
import {
  sendSubscriptionEndedEmail,
  sendSubscriptionStartedEmail,
} from "@/libs/email/sendSubscriptionEmails";
import { Env } from "@/libs/Env";
import { blockScheduledTasksForUser } from "@/libs/jobs/blocking";
import { logger } from "@/libs/Logger";
import { getStripe } from "@/libs/stripe/client";
import { invalidateQuotaCache } from "@/libs/subscriptions/quota";
import { createAdminClient } from "@/libs/supabase/admin";
import type { BillingInterval } from "@/models/Schema";
import {
  stripeWebhookEvents,
  subscriptionTiers,
  tierQuotas,
  userSubscriptions,
} from "@/models/Schema";

// Stripe verifies the request with its OWN signature scheme (constructEvent
// below), so this route is intentionally NOT routed through withWebhookSecret
// (that guards X-Webhook-Secret inbound hooks — a different mechanism).
export const runtime = "nodejs"; // Required for Buffer and crypto

// ---------------------------------------------------------------------------
// POST handler — Stripe webhook
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = Env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = Buffer.from(await request.arrayBuffer());
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    Sentry.captureException(err, {
      contexts: { stripe: { action: "webhook/signatureVerification" } },
    });
    logger.error({ err }, "Stripe webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: claim this event.id before dispatch, then mark it processed only
  // after the handler succeeds. Stripe retries on any non-2xx (and may redeliver
  // on its own); the status writes are idempotent, but the side effects (analytics
  // + lifecycle emails) are not. Dedupe is keyed on COMPLETION (processed_at), not
  // mere existence — a leftover claim from an attempt that threw (processed_at
  // NULL) is reprocessed, so we never delete and can't orphan a claim by a delete
  // that itself fails (which would permanently drop the event → paid-but-not-
  // provisioned).
  try {
    const claimed = await db
      .insert(stripeWebhookEvents)
      .values({ eventId: event.id, eventType: event.type })
      .onConflictDoNothing({ target: stripeWebhookEvents.eventId })
      .returning();

    if (claimed.length === 0) {
      // Row already exists. Only a fully-processed row is a true duplicate; a
      // still-pending row (processed_at NULL) is a prior attempt that threw.
      const [existing] = await db
        .select({ processedAt: stripeWebhookEvents.processedAt })
        .from(stripeWebhookEvents)
        .where(eq(stripeWebhookEvents.eventId, event.id))
        .limit(1);

      if (existing?.processedAt) {
        logger.info(
          { eventId: event.id, eventType: event.type },
          "Stripe webhook: duplicate event — skipping",
        );
        return NextResponse.json(
          { received: true, duplicate: true },
          { status: 200 },
        );
      }
    }
  } catch (err) {
    // Fail closed: if the ledger read/write itself fails, return 500 so Stripe
    // retries rather than dispatching without a dedupe guard.
    Sentry.captureException(err, {
      contexts: {
        stripe: { eventType: event.type, action: "webhook/claimEvent" },
      },
    });
    logger.error(
      { err, eventType: event.type },
      "Stripe webhook: failed to claim event",
    );
    return NextResponse.json(
      { error: "Webhook ledger error" },
      { status: 500 },
    );
  }

  try {
    await handleWebhookEvent(event);
  } catch (err) {
    // Do NOT delete the claim — leaving processed_at NULL keeps the event
    // reprocessable on Stripe's retry (no delete that could itself fail and
    // permanently orphan the row).
    Sentry.captureException(err, {
      contexts: {
        stripe: { eventType: event.type, action: "webhook/handleEvent" },
      },
    });
    logger.error(
      { err, eventType: event.type },
      "Stripe webhook handler error",
    );
    // Return 500 for transient errors so Stripe retries.
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 },
    );
  }

  // Mark processed so redeliveries short-circuit. Best-effort: the handler has
  // already succeeded, so a mark failure is swallowed (a 500 here would force a
  // retry that re-runs the side effects). A still-NULL row only reprocesses if
  // Stripe independently redelivers, which is rare.
  try {
    await db
      .update(stripeWebhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(stripeWebhookEvents.eventId, event.id));
  } catch (markErr) {
    Sentry.captureException(markErr, {
      contexts: {
        stripe: { eventType: event.type, action: "webhook/markProcessed" },
      },
    });
    logger.error(
      { markErr, eventId: event.id },
      "Stripe webhook: failed to mark event processed",
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Event dispatch
// ---------------------------------------------------------------------------

async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      logger.info(
        { eventType: event.type },
        "Unhandled Stripe webhook event type",
      );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a Stripe price ID to a tier row + billing interval. The tier table
 * has separate `stripe_price_id_monthly` / `stripe_price_id_yearly` columns;
 * both map to the same tier.
 */
async function resolveTierByPriceId(priceId: string): Promise<{
  tierId: string;
  billingInterval: BillingInterval;
} | null> {
  const [tier] = await db
    .select({
      id: subscriptionTiers.id,
      stripePriceIdMonthly: subscriptionTiers.stripePriceIdMonthly,
      stripePriceIdYearly: subscriptionTiers.stripePriceIdYearly,
    })
    .from(subscriptionTiers)
    .where(
      or(
        eq(subscriptionTiers.stripePriceIdMonthly, priceId),
        eq(subscriptionTiers.stripePriceIdYearly, priceId),
      ),
    )
    .limit(1);

  if (!tier) {
    return null;
  }

  const billingInterval: BillingInterval =
    tier.stripePriceIdYearly === priceId ? "yearly" : "monthly";

  return { tierId: tier.id, billingInterval };
}

/**
 * Invalidates every cached quota state for a user. Generic: iterates the
 * resource types defined across all tiers (the quota cache is keyed by
 * user+resourceType) rather than a hardcoded resource list.
 */
async function invalidateAllQuotaCaches(userId: string): Promise<void> {
  const rows = await db
    .selectDistinct({ resourceType: tierQuotas.resourceType })
    .from(tierQuotas);
  for (const { resourceType } of rows) {
    invalidateQuotaCache(userId, resourceType);
  }
}

async function getUserEmailAndName(
  userId: string,
): Promise<{ email: string; name?: string } | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) {
      return null;
    }
    const userMeta = data.user.user_metadata as
      Record<string, unknown> | undefined;
    const name =
      typeof userMeta?.display_name === "string"
        ? userMeta.display_name
        : typeof userMeta?.full_name === "string"
          ? userMeta.full_name
          : undefined;
    return { email: data.user.email, name };
  } catch (err) {
    logger.error({ err, userId }, "getUserEmailAndName: failed to fetch user");
    return null;
  }
}

/** Display name for the tier behind a Stripe subscription (for emails/analytics). */
async function getTierName(tierId: string): Promise<string> {
  const [tier] = await db
    .select({
      displayName: subscriptionTiers.displayName,
      name: subscriptionTiers.name,
    })
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.id, tierId))
    .limit(1);
  return tier?.displayName ?? tier?.name ?? "Pro";
}

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.user_id;
  if (!userId) {
    logger.warn(
      { sessionId: session.id },
      "checkout.session.completed: missing user_id in metadata",
    );
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!stripeSubscriptionId || !stripeCustomerId) {
    logger.warn(
      { sessionId: session.id },
      "checkout.session.completed: missing subscription or customer",
    );
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(
    stripeSubscriptionId,
    {
      expand: ["items.data.price"],
    },
  );

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    logger.warn(
      { stripeSubscriptionId },
      "checkout.session.completed: no price ID on subscription",
    );
    return;
  }

  const tierInfo = await resolveTierByPriceId(priceId);
  if (!tierInfo) {
    logger.warn(
      { priceId },
      "checkout.session.completed: no tier matched price ID",
    );
    return;
  }

  const isTrialing = subscription.status === "trialing";
  const trialExpiresAt =
    isTrialing && subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

  await db
    .update(userSubscriptions)
    .set({
      tierId: tierInfo.tierId,
      status: isTrialing ? "trial" : "active",
      billingInterval: tierInfo.billingInterval,
      hasTrialed: true,
      trialExpiresAt,
      stripeSubscriptionId,
      stripeCustomerId,
      currentPeriodAnchorAt: new Date(),
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  await invalidateAllQuotaCaches(userId);

  if (!isTrialing) {
    const tierName = await getTierName(tierInfo.tierId);

    // Welcome email for the first paid subscription. Stripe sends its own receipt.
    const userInfo = await getUserEmailAndName(userId);
    if (userInfo) {
      sendSubscriptionStartedEmail({
        email: userInfo.email,
        name: userInfo.name,
        tierName,
        billingInterval: tierInfo.billingInterval,
      });
    }

    trackEventServer(
      "subscription_converted",
      {
        billing_interval: tierInfo.billingInterval,
        tier_name: tierName,
        conversion_source: "checkout",
      },
      userId,
    ).catch((err) =>
      logger.warn({ err, userId }, "subscription_converted tracking failed"),
    );
  }

  logger.info(
    {
      userId,
      tierId: tierInfo.tierId,
      billingInterval: tierInfo.billingInterval,
      isTrialing,
    },
    "Subscription activated via checkout",
  );
}

// ---------------------------------------------------------------------------
// invoice.paid
// ---------------------------------------------------------------------------

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId = typeof subRef === "string" ? subRef : subRef?.id;

  if (!stripeSubscriptionId) {
    return;
  }

  const [sub] = await db
    .select({
      userId: userSubscriptions.userId,
      currentStatus: userSubscriptions.status,
      billingInterval: userSubscriptions.billingInterval,
      tierId: userSubscriptions.tierId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (!sub) {
    logger.warn(
      { stripeSubscriptionId },
      "invoice.paid: no matching user_subscriptions row",
    );
    return;
  }

  // Order-independent trial→active conversion. The anchor reset + the
  // trial_upgrade conversion event must fire exactly once, regardless of whether
  // invoice.paid or customer.subscription.updated arrives first. We key the
  // transition on the LOCAL status: whichever event observes status==='trial'
  // performs it and flips the row to 'active'; the later event sees 'active' and
  // skips. (Previously this lived ONLY in handleSubscriptionUpdated, so an
  // invoice.paid arriving first silently dropped both.)
  const isTrialUpgrade = sub.currentStatus === "trial";

  await db
    .update(userSubscriptions)
    .set({
      status: "active",
      // Reset the rolling quota window to start at conversion.
      ...(isTrialUpgrade ? { currentPeriodAnchorAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId));

  await invalidateAllQuotaCaches(sub.userId);

  if (isTrialUpgrade && sub.billingInterval) {
    const tierName = await getTierName(sub.tierId);
    trackEventServer(
      "subscription_converted",
      {
        billing_interval: sub.billingInterval,
        tier_name: tierName,
        conversion_source: "trial_upgrade",
      },
      sub.userId,
    ).catch((err) =>
      logger.warn(
        { err, userId: sub.userId },
        "subscription_converted tracking failed",
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// ---------------------------------------------------------------------------

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id;

  const [sub] = await db
    .select({
      userId: userSubscriptions.userId,
      currentStatus: userSubscriptions.status,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!sub) {
    logger.warn(
      { subscriptionId: subscription.id },
      "customer.subscription.updated: no matching row",
    );
    return;
  }

  // Map Stripe status to local status.
  const statusMap: Record<
    string,
    "active" | "cancelled" | "expired" | "trial"
  > = {
    active: "active",
    trialing: "trial",
    past_due: "active", // Still has access while Stripe retries payment
    canceled: "cancelled",
    unpaid: "expired",
  };
  const localStatus = statusMap[subscription.status] ?? "active";

  // Re-resolve tier in case the plan changed.
  const updates: Partial<typeof userSubscriptions.$inferInsert> = {
    status: localStatus,
    updatedAt: new Date(),
  };

  let tierName = "Pro";
  if (priceId) {
    const tierInfo = await resolveTierByPriceId(priceId);
    if (tierInfo) {
      updates.tierId = tierInfo.tierId;
      updates.billingInterval = tierInfo.billingInterval;
      tierName = await getTierName(tierInfo.tierId);
    }
  }

  // Trial → active conversion: reset the period anchor so the user gets a fresh
  // quota window starting at conversion.
  if (sub.currentStatus === "trial" && localStatus === "active") {
    updates.currentPeriodAnchorAt = new Date();
  }

  // Pending cancellation: trust `cancel_at`. Stripe's flexible billing encodes
  // "cancel at period end" by setting `cancel_at` to the period-end timestamp
  // while leaving the legacy `cancel_at_period_end` flag false, so read
  // `cancel_at` directly.
  updates.expiresAt = subscription.cancel_at
    ? new Date(subscription.cancel_at * 1000)
    : null;

  // Keep trial_expires_at in sync for trialing subs.
  if (localStatus === "trial" && subscription.trial_end) {
    updates.trialExpiresAt = new Date(subscription.trial_end * 1000);
  }

  await db
    .update(userSubscriptions)
    .set(updates)
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  await invalidateAllQuotaCaches(sub.userId);

  // Track trial → active conversion.
  if (
    sub.currentStatus === "trial" &&
    localStatus === "active" &&
    updates.billingInterval
  ) {
    trackEventServer(
      "subscription_converted",
      {
        billing_interval: updates.billingInterval,
        tier_name: tierName,
        conversion_source: "trial_upgrade",
      },
      sub.userId,
    ).catch((err) =>
      logger.warn(
        { err, userId: sub.userId },
        "subscription_converted tracking failed",
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------------

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const [sub] = await db
    .select({
      userId: userSubscriptions.userId,
      tierId: userSubscriptions.tierId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!sub) {
    logger.warn(
      { subscriptionId: subscription.id },
      "customer.subscription.deleted: no matching row",
    );
    return;
  }

  const [freeTier] = await db
    .select({ id: subscriptionTiers.id })
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.name, "free"))
    .limit(1);

  if (!freeTier) {
    logger.error("customer.subscription.deleted: free tier not found in DB");
    return;
  }

  const tierName = await getTierName(sub.tierId);

  await db
    .update(userSubscriptions)
    .set({
      tierId: freeTier.id,
      status: "cancelled",
      billingInterval: null,
      stripeSubscriptionId: null,
      currentPeriodAnchorAt: new Date(),
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  // Block any in-flight scheduled tasks so they don't run without an active
  // subscription.
  await blockScheduledTasksForUser(sub.userId, "subscription_cancelled");

  await invalidateAllQuotaCaches(sub.userId);

  const userInfo = await getUserEmailAndName(sub.userId);
  if (userInfo) {
    sendSubscriptionEndedEmail({
      email: userInfo.email,
      name: userInfo.name,
      tierName,
    });
  }

  trackEventServer(
    "subscription_cancelled",
    { tier_name: tierName },
    sub.userId,
  ).catch((err) =>
    logger.warn(
      { err, userId: sub.userId },
      "subscription_cancelled tracking failed",
    ),
  );

  logger.info(
    { userId: sub.userId },
    "User downgraded to free tier after subscription deletion",
  );
}
