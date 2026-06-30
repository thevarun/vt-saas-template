import { boolean, index, integer, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

/**
 * Per-tier plan catalogue. A lookup table read by every signed-in user (the
 * pricing grid + the quota resolver), so it gets a read-only RLS policy in
 * prod-setup.sql.
 *
 * `name` is a stable slug used in code branches (e.g. the free-tier safety net
 * and the trial trigger). Generic placeholders: `'free'`, `'pro'`, and the
 * optional admin-granted `'promotion'`. A product keeps these slugs and fills in
 * its own `display_name` / `description` / Stripe price ids via seed.sql.
 */
export const subscriptionTiers = vtSaasSchema.table(
  'subscription_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(), // slug: 'free' | 'pro' | 'promotion'
    displayName: text('display_name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents'), // nullable — free/promotion have no listed price
    stripePriceIdMonthly: text('stripe_price_id_monthly'), // nullable — free/promotion have no Stripe product
    stripePriceIdYearly: text('stripe_price_id_yearly'), // nullable — free/promotion have no Stripe product
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    nameIdx: unique('subscription_tiers_name_unique').on(table.name),
    sortOrderIdx: index('idx_subscription_tiers_sort_order').on(table.sortOrder),
  }),
);

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = typeof subscriptionTiers.$inferInsert;
