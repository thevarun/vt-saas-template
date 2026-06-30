import { bigint, index, integer, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';
import { subscriptionTiers } from './subscription-tiers';

/**
 * Per-tier resource limits backing the quota framework.
 *
 * GENERIC TWO-POOL METERING MODEL. Each `(tier, resource_type)` row defines two
 * pools that a request draws from in order:
 *   - `premium`  — the preferred pool, used while budget remains
 *     (`premium_units_used < premium_period_limit`).
 *   - `fallback` — the always-configured pool used once premium is exhausted.
 *
 * `premiumUnitKey` / `fallbackUnitKey` are opaque labels for what each pool
 * meters — the framework never interprets them. A product mapping this to AI
 * models simply sets the keys to model ids (e.g. premium = `gpt-4o`,
 * fallback = `gpt-4o-mini`); a product metering API calls sets them to
 * `metered` / `rate_limited`, etc. Units are generic integers (tokens, calls,
 * generations, …) — see `resource_usage`.
 *
 * A pool with a zero `period_limit` is explicitly disabled for that tier (never
 * "infinite budget"); `premiumUnitKey` is nullable so a tier can omit the
 * premium pool entirely and run fallback-only.
 */
export const tierQuotas = vtSaasSchema.table(
  'tier_quotas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tierId: uuid('tier_id')
      .notNull()
      .references(() => subscriptionTiers.id, { onDelete: 'cascade' }),
    resourceType: text('resource_type').notNull(), // e.g. 'generation', 'api_call'
    premiumUnitKey: text('premium_unit_key'), // null = no premium pool for this tier
    premiumPeriodLimit: bigint('premium_period_limit', { mode: 'number' }).notNull().default(0),
    fallbackUnitKey: text('fallback_unit_key').notNull(),
    fallbackPeriodLimit: bigint('fallback_period_limit', { mode: 'number' }).notNull(),
    warningThresholdPct: integer('warning_threshold_pct').notNull().default(90),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    tierResourceUnique: unique('tier_quotas_tier_resource_unique').on(table.tierId, table.resourceType),
    tierIdIdx: index('idx_tier_quotas_tier_id').on(table.tierId),
    tierResourceIdx: index('idx_tier_quotas_tier_resource').on(table.tierId, table.resourceType),
  }),
);

export type TierQuota = typeof tierQuotas.$inferSelect;
export type InsertTierQuota = typeof tierQuotas.$inferInsert;
