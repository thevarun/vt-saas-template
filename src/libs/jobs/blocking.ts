import { and, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { scheduledTasks } from '@/models/Schema';

/**
 * Transitions all of a user's currently-`scheduled` tasks to `blocked`.
 *
 * Called when a user is demoted (trial expiry, promotion expiry, paid
 * cancellation) so their queued background tasks don't run without an active
 * subscription. This is the documented use of the `scheduled_tasks.blocked`
 * status (see `src/models/schema/scheduled-tasks.ts`). `reason` is free text —
 * the `blocked_reason` column carries no subscription/product enum so this
 * helper stays decoupled from any specific policy.
 *
 * Returns the number of rows affected.
 */
export async function blockScheduledTasksForUser(
  userId: string,
  reason: string,
): Promise<number> {
  const updated = await db
    .update(scheduledTasks)
    .set({
      status: 'blocked',
      blockedReason: reason,
      updatedAt: new Date(),
    })
    .where(and(eq(scheduledTasks.userId, userId), eq(scheduledTasks.status, 'scheduled')))
    .returning();

  if (updated.length > 0) {
    logger.info(
      { userId, reason, count: updated.length },
      'blockScheduledTasksForUser: blocked scheduled tasks',
    );
  }

  return updated.length;
}
