import { boolean, index, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';
import { subscriptionTiers } from './subscription-tiers';

// Status + billing-interval unions are stored as plain `text` (TS-side $type<>),
// NOT pg enums — prod-setup.sql adds a CHECK guard for each. This keeps the table
// migration-portable without an `ALTER TYPE ... ADD VALUE` dance when a fork adds
// a status. The cross-schema FK (user_id -> auth.users) is added in prod-setup.sql.
export const userSubscriptionStatusEnum = ['active', 'trial', 'expired', 'cancelled'] as const;
export type UserSubscriptionStatus = typeof userSubscriptionStatusEnum[number];

export const billingIntervalEnum = ['monthly', 'yearly'] as const;
export type BillingInterval = typeof billingIntervalEnum[number];

/**
 * Per-user subscription state + lifecycle anchors. One row per user (created by
 * the signup trigger in prod-setup.sql). The spine the quota/Stripe/cron code
 * reads and writes.
 */
export const userSubscriptions = vtSaasSchema.table(
  'user_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // user_id references auth.users(id) ON DELETE CASCADE — cross-schema FK added
    // in supabase/prod-setup.sql (Drizzle can't express it).
    userId: uuid('user_id').notNull(),
    tierId: uuid('tier_id')
      .notNull()
      .references(() => subscriptionTiers.id),
    status: text('status')
      .$type<UserSubscriptionStatus>()
      .notNull()
      .default('active'),
    billingInterval: text('billing_interval').$type<BillingInterval>(),
    hasTrialed: boolean('has_trialed').notNull().default(false),
    trialExpiresAt: timestamp('trial_expires_at', { withTimezone: true }),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeCustomerId: text('stripe_customer_id'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    // Anchor for the rolling quota window — reset on every tier transition so a
    // user's first period after upgrading begins at the moment of upgrade.
    currentPeriodAnchorAt: timestamp('current_period_anchor_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    // 12h-idempotency markers for the expiry-warning cron (trial vs promotion).
    lastTrialWarningSentAt: timestamp('last_trial_warning_sent_at', { withTimezone: true }),
    lastPromotionWarningSentAt: timestamp('last_promotion_warning_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userIdUnique: unique('user_subscriptions_user_id_unique').on(table.userId),
    userIdIdx: index('idx_user_subscriptions_user_id').on(table.userId),
    tierIdIdx: index('idx_user_subscriptions_tier_id').on(table.tierId),
    statusIdx: index('idx_user_subscriptions_status').on(table.status),
  }),
);

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
