import * as Sentry from '@sentry/nextjs';

import { claimDueTasks } from '@/libs/jobs/claim';
import type {
  ScheduledTaskLoaded,
  ScheduledTaskWrite,
} from '@/libs/jobs/types';
import { createAdminClient } from '@/libs/supabase/admin';

import { inngest } from '../client';

/**
 * Minimal logger surface consumed by the job handlers. Matches the subset of the
 * Inngest logger the handlers use, declared structurally so tests can pass a
 * plain mock and any pino-like logger satisfies it.
 */
type JobLogger = {
  info: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
};

/** Event the cron fans out — one per claimed task — to the single-task worker. */
const TASK_PROCESS_EVENT = 'vt-saas/task.process' as const;

/**
 * Cron handler body — extracted as a named export so tests can exercise the step
 * graph directly. Inngest registration below wraps this with metadata.
 *
 * Each `step.run` is independently memoized by Inngest: on retry, an already
 * completed step is replayed from its recorded result rather than re-executed,
 * so the claim runs at most once per cron invocation.
 *
 * @internal
 */
export async function cronHandler({
  step,
  logger,
}: {
  step: {
    run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
    sendEvent: (name: string, events: unknown[]) => Promise<unknown>;
  };
  logger: JobLogger;
}): Promise<{ dispatched: number }> {
  const taskIds = await step.run('claim-due-tasks', async () => {
    return claimDueTasks();
  });

  if (taskIds.length === 0) {
    logger.info('[scheduled-tasks-cron] No tasks due');
    return { dispatched: 0 };
  }

  logger.info(
    `[scheduled-tasks-cron] Dispatching ${taskIds.length} task(s)`,
  );

  // Fan out: one event per task so each retries in isolation — a single failing
  // task can't block or re-run its siblings.
  await step.sendEvent(
    'dispatch-task-events',
    taskIds.map(taskId => ({
      name: TASK_PROCESS_EVENT,
      data: { taskId },
    })),
  );

  return { dispatched: taskIds.length };
}

/**
 * Single-task handler body — extracted as a named export so tests can verify the
 * (intentional) absence of `step.run()` inside the per-task flow: isolated
 * retry-per-item is the whole point of the fan-out, so the work runs inline.
 *
 * @internal
 */
export async function singleTaskHandler({
  event,
  logger,
}: {
  event: { data: { taskId: string } };
  logger: JobLogger;
}): Promise<void> {
  const { taskId } = event.data;
  const supabase = createAdminClient();

  logger.info('[scheduled-tasks] Processing task', { taskId });

  // Load the claimed task.
  const { data, error } = await supabase
    .from('scheduled_tasks')
    .select('id, status')
    .eq('id', taskId)
    .single();

  if (error || !data) {
    throw new Error(
      `[scheduled-tasks] Failed to load task ${taskId}: ${error?.message ?? 'not found'}`,
    );
  }

  // Cast at the boundary — the supabase client isn't schema-typed (see
  // src/libs/jobs/types.ts for why).
  const task = data as unknown as ScheduledTaskLoaded;

  // ── 3-layer at-most-once guard ──────────────────────────────────────────
  // Layer 1: the atomic claim UPDATE (`scheduled` -> `claimed`) ran in the cron
  //          before this event was sent, so only one worker can ever be here.
  // Layer 2: done-skip — a duplicate event or a retry that lands after the work
  //          already completed must not run it again.
  if (task.status === 'done') {
    logger.info('[scheduled-tasks] Skipping — task already done', { taskId });
    return;
  }
  // Layer 3: status guard — anything other than 'claimed' (e.g. 'running' from a
  //          live sibling, or 'blocked'/'failed') means another run already owns
  //          or settled this task; do nothing.
  if (task.status !== 'claimed') {
    logger.warn('[scheduled-tasks] Skipping — task not in claimed state', {
      taskId,
      status: task.status,
    });
    return;
  }

  // Mark in-flight so the stale-reset can recover this task if the worker crashes.
  const runningPayload: ScheduledTaskWrite = {
    status: 'running',
    updated_at: new Date().toISOString(),
  };
  const { error: runningErr } = await supabase
    .from('scheduled_tasks')
    .update(runningPayload as never)
    .eq('id', taskId);
  if (runningErr) {
    // Throw so Inngest retries rather than proceeding from an unknown state.
    throw new Error(
      `[scheduled-tasks] Failed to mark task ${taskId} running: ${runningErr.message}`,
    );
  }

  // ── product-specific work goes here ─────────────────────────────────────
  // Replace this seam with the real job (send an email, call an API, refresh a
  // token, …). Throwing from here triggers Inngest's per-task retry; once
  // retries are exhausted, `onFailure` (below) flips the task to 'failed'.
  // The work MUST be idempotent: a failed 'done' write below throws, so Inngest
  // re-runs this whole handler (including the work) to preserve at-most-once.

  // Mark complete. If this write fails the task stays 'running' and Inngest would
  // treat the function as complete — breaking the at-most-once guarantee (the
  // stale-reset would later re-queue it). Throw so Inngest retries instead.
  const donePayload: ScheduledTaskWrite = {
    status: 'done',
    updated_at: new Date().toISOString(),
  };
  const { error: doneErr } = await supabase
    .from('scheduled_tasks')
    .update(donePayload as never)
    .eq('id', taskId);
  if (doneErr) {
    throw new Error(
      `[scheduled-tasks] Failed to mark task ${taskId} done: ${doneErr.message}`,
    );
  }

  logger.info('[scheduled-tasks] Task done', { taskId });
}

/**
 * Cron function: runs every 10 minutes, claims due tasks, and dispatches one
 * event per task. The fan-out gives each task its own retry isolation.
 *
 * `cronHandler` is cast to `never` because Inngest's step-context type is wider
 * than the structural slice the handler depends on; tests exercise the named
 * handler directly with a typed step double.
 */
export const scheduledTasksCron = inngest.createFunction(
  {
    id: 'scheduled-tasks-cron',
    name: 'Scheduled Tasks Cron',
    triggers: [{ cron: '*/10 * * * *' }],
  },
  cronHandler as never,
);

/**
 * Event handler: processes a single task with retries. On retries-exhausted,
 * `onFailure` flips the task to 'failed', records the error, and reports it.
 */
export const processSingleTask = inngest.createFunction(
  {
    id: 'process-single-task',
    name: 'Process Single Task',
    retries: 3,
    onFailure: async ({ event, error, logger }) => {
      // For onFailure the payload is wrapped: { event: { data: { taskId } }, error }.
      const taskId = (event.data.event.data as { taskId: string }).taskId;
      const errorMessage = error.message;

      logger.error(
        '[scheduled-tasks] All retries exhausted — marking task failed',
        { taskId, error: errorMessage },
      );
      Sentry.captureException(error, {
        contexts: { job: { taskId, action: 'inngest/processSingleTask' } },
      });

      try {
        const supabase = createAdminClient();
        const failedPayload: ScheduledTaskWrite = {
          status: 'failed',
          last_error: errorMessage,
          updated_at: new Date().toISOString(),
        };
        await supabase
          .from('scheduled_tasks')
          .update(failedPayload as never)
          .eq('id', taskId);

        logger.info('[scheduled-tasks] Task status updated to failed', {
          taskId,
        });
      } catch (dbErr) {
        logger.error(
          '[scheduled-tasks] Failed to mark task failed in onFailure',
          { taskId, error: (dbErr as Error).message },
        );
        // Do not throw — onFailure must complete without throwing.
      }
    },
    triggers: [{ event: TASK_PROCESS_EVENT }],
  },
  singleTaskHandler as never,
);
