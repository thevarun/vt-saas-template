/**
 * Shared types for database query functions
 */

/**
 * Structured error type for database query failures.
 * Replaces `error: any` in all query return types.
 */
export type DbQueryError = {
  code?: string;
  message: string;
  detail?: string;
};

/**
 * Valid statuses for memory extraction jobs.
 */
export type MemoryJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Wraps a caught unknown error into a DbQueryError.
 */
export function toDbQueryError(error: unknown): DbQueryError {
  return {
    message: error instanceof Error ? error.message : String(error),
    code: (error as Record<string, unknown>)?.code as string | undefined,
    detail: (error as Record<string, unknown>)?.detail as string | undefined,
  };
}
