import type { scheduledTaskStatusEnum } from '@/models/Schema';

/**
 * Local row/write shapes for the `scheduled_tasks` table (NOT `TableRow`/`TableUpdate`).
 *
 * The generated `src/libs/supabase/types.ts` is a placeholder stub with no real
 * tables (see `src/libs/queries/item.ts`), so the supabase clients aren't
 * schema-typed and `.from('scheduled_tasks')` resolves to `never`. We declare the
 * shapes here and cast at the DB boundary. The status union is sourced from the
 * Drizzle enum so a value added/removed there is reflected automatically. Once a
 * fork generates real types it can switch to `TableRow`/`TableUpdate<'scheduled_tasks'>`.
 */
export type ScheduledTaskStatus = (typeof scheduledTaskStatusEnum.enumValues)[number];

// Columns the job handlers read off a loaded task.
export type ScheduledTaskLoaded = {
  id: string;
  status: ScheduledTaskStatus;
};

// snake_case write payload for status transitions (matches the DB column names).
export type ScheduledTaskWrite = {
  status: ScheduledTaskStatus;
  updated_at: string;
  last_error?: string;
};
