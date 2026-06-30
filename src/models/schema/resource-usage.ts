import { bigint, date, index, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

/**
 * Rolling-period usage ledger for the quota framework. One row per
 * `(user, resource_type, period_start)`, tracking units drawn from each of the
 * two pools defined in `tier_quotas` (see that table for the two-pool model).
 *
 * Units are generic integers (tokens, API calls, generations, …) — the column
 * names are pool-agnostic on purpose. Server-only: usage is recorded by trusted
 * server code, so this table has RLS ON with no policy in prod-setup.sql. The
 * cross-schema FK (user_id -> auth.users) is added in prod-setup.sql.
 */
export const resourceUsage = vtSaasSchema.table(
  'resource_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // user_id references auth.users(id) ON DELETE CASCADE — cross-schema FK added
    // in supabase/prod-setup.sql.
    userId: uuid('user_id').notNull(),
    resourceType: text('resource_type').notNull(), // e.g. 'generation', 'api_call'
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    premiumUnitsUsed: bigint('premium_units_used', { mode: 'number' }).notNull().default(0),
    fallbackUnitsUsed: bigint('fallback_units_used', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userResourcePeriodUnique: unique('resource_usage_user_resource_period_unique')
      .on(table.userId, table.resourceType, table.periodStart),
    userIdIdx: index('idx_resource_usage_user_id').on(table.userId),
    userResourcePeriodIdx: index('idx_resource_usage_user_resource_period')
      .on(table.userId, table.resourceType, table.periodStart),
  }),
);

export type ResourceUsage = typeof resourceUsage.$inferSelect;
export type InsertResourceUsage = typeof resourceUsage.$inferInsert;
