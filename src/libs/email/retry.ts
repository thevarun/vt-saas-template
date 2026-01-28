import { logger } from '../Logger';

/**
 * Retry configuration
 */
export type RetryConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
};

/**
 * Default retry configuration for email sending
 */
export const DEFAULT_EMAIL_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds max
  retryableErrors: [
    'rate_limit_exceeded',
    'temporarily_unavailable',
    'internal_server_error',
    'SEND_EXCEPTION', // Network errors, timeouts
  ],
};

/**
 * Calculate exponential backoff delay
 * Formula: min(baseDelay * 2^attempt, maxDelay) + jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig,
): number {
  const exponentialDelay = config.baseDelayMs * (2 ** attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  // Add jitter (0-25% of delay) to prevent thundering herd
  const jitter = cappedDelay * Math.random() * 0.25;
  return Math.floor(cappedDelay + jitter);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(
  errorCode: string | undefined,
  config: RetryConfig,
): boolean {
  if (!errorCode) {
    return false;
  }
  return config.retryableErrors.includes(errorCode);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic
 *
 * @param operation - The async operation to execute
 * @param isSuccess - Function to determine if result is successful
 * @param getErrorCode - Function to extract error code from result
 * @param config - Retry configuration
 * @param context - Optional context for logging
 * @returns Result and number of attempts made
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  isSuccess: (result: T) => boolean,
  getErrorCode: (result: T) => string | undefined,
  config: RetryConfig = DEFAULT_EMAIL_RETRY_CONFIG,
  context?: Record<string, unknown>,
): Promise<{ result: T; attempts: number }> {
  let lastResult: T;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    lastResult = await operation();

    if (isSuccess(lastResult)) {
      if (attempt > 0) {
        logger.info({
          type: 'retry_success',
          attempt: attempt + 1,
          ...context,
        }, 'Operation succeeded after retry');
      }
      return { result: lastResult, attempts: attempt + 1 };
    }

    const errorCode = getErrorCode(lastResult);
    const isLastAttempt = attempt === config.maxAttempts - 1;

    if (!isRetryableError(errorCode, config) || isLastAttempt) {
      if (isLastAttempt && isRetryableError(errorCode, config)) {
        logger.error({
          type: 'retry_exhausted',
          attempts: config.maxAttempts,
          errorCode,
          ...context,
        }, 'All retry attempts exhausted');
      }
      return { result: lastResult, attempts: attempt + 1 };
    }

    const delay = calculateBackoffDelay(attempt, config);
    logger.warn({
      type: 'retry_attempt',
      attempt: attempt + 1,
      nextAttempt: attempt + 2,
      delayMs: delay,
      errorCode,
      ...context,
    }, 'Retrying operation after transient failure');

    await sleep(delay);
  }

  return { result: lastResult!, attempts: config.maxAttempts };
}
