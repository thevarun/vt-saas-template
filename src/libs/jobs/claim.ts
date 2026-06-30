import type { ScheduledTaskWrite } from '@/libs/jobs/types';
import { createAdminClient } from '@/libs/supabase/admin';

/**
 * Reset window for tasks stuck in an in-flight state (`claimed`/`running`)
 * after a worker crashed mid-dispatch. The next cron tick re-claims them.
 */
export const STALE_TASK_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Queries the DB for tasks that are scheduled and due. Returns the list of task
 * IDs that should be dispatched as events.
 *
 * Atomic-claim semantics: a single UPDATE … RETURNING claims rows in one
 * statement so a concurrent cron tick can't double-dispatch.
 *
 * Also runs a stale-reset for rows stuck in an in-flight state for longer than
 * `STALE_TASK_THRESHOLD_MS` (worker crashed mid-dispatch). The next cron tick
 * re-claims them.
 *
 * Backed by partial index `idx_scheduled_tasks_due` (see
 * `src/models/schema/scheduled-tasks.ts`).
 *
 * @internal
 */
export async function claimDueTasks(): Promise<string[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Atomically claim due tasks by flipping status to 'claimed' — the single
  // UPDATE … RETURNING is what prevents duplicate dispatch under concurrent ticks.
  const claimPayload: ScheduledTaskWrite = {
    status: 'claimed',
    updated_at: new Date().toISOString(),
  };
  const { data: tasks, error } = await supabase
    .from('scheduled_tasks')
    .update(claimPayload as never)
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .select('id');

  if (error) {
    throw new Error(
      `[scheduled-tasks-cron] Failed to claim due tasks: ${error.message}`,
    );
  }

  // Safety net: reset tasks stuck in an in-flight state ('claimed'/'running')
  // longer than the stale threshold (worker crash mid-dispatch). The next cron
  // tick picks them up again.
  const staleThreshold = new Date(
    Date.now() - STALE_TASK_THRESHOLD_MS,
  ).toISOString();
  const resetPayload: ScheduledTaskWrite = {
    status: 'scheduled',
    updated_at: new Date().toISOString(),
  };
  await supabase
    .from('scheduled_tasks')
    .update(resetPayload as never)
    .in('status', ['claimed', 'running'])
    .lte('updated_at', staleThreshold);

  return (tasks ?? []).map((t: { id: string }) => t.id);
}
