import { sql } from 'drizzle-orm';
import { index, pgEnum, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

// Generic background-job lifecycle. Generic replacements for a product's own
// status flow: the cron claim flips `scheduled` -> `claimed`; `running` is the
// in-flight state the >30min stale-reset recovers after a worker crash;
// `blocked` is the target when a downgrade/policy stops a task from running.
export const scheduledTaskStatusEnum = pgEnum('scheduled_task_status', [
  'scheduled',
  'claimed',
  'running',
  'done',
  'failed',
  'blocked',
]);

/**
 * Generic example job table backing the background-job patterns documented in
 * `docs/patterns/background-jobs.md` (atomic claim, fan-out, the 3-layer
 * at-most-once guard, stale-reset crash recovery).
 *
 * Server-only: no RLS policy (service role bypasses RLS) — see prod-setup.sql.
 * It carries only the columns those patterns need; copy this shape and add your
 * own product columns for a real job table.
 */
export const scheduledTasks = vtSaasSchema.table(
  'scheduled_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    status: scheduledTaskStatusEnum('status').default('scheduled').notNull(),
    // The due-time the atomic claim filters on (`scheduled_at <= now()`).
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    // Set when a downgrade/policy blocks the task. Free-text (no enum) so this
    // table carries no subscription/product dependency.
    blockedReason: text('blocked_reason'),
    // Last error message after retries are exhausted (status -> 'failed').
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userIdIdx: index('idx_scheduled_tasks_user_id').on(table.userId),
    // Partial index backing the claim query
    // (`WHERE status = 'scheduled' AND scheduled_at <= now()`).
    dueIdx: index('idx_scheduled_tasks_due')
      .on(table.status, table.scheduledAt)
      .where(sql`status = 'scheduled'`),
  }),
);

export type ScheduledTaskRow = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = typeof scheduledTasks.$inferInsert;
