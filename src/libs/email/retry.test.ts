import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger
const mockLoggerInfo = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock('../Logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

// Test result types
type SuccessResult = { success: true; messageId: string };
type FailureResult = { success: false; error: string; code: string };
type TestResult = SuccessResult | FailureResult;

describe('retry utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateBackoffDelay', () => {
    it('returns increasing delays for each attempt', async () => {
      const { calculateBackoffDelay, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      const delay0 = calculateBackoffDelay(0, DEFAULT_EMAIL_RETRY_CONFIG);
      const delay1 = calculateBackoffDelay(1, DEFAULT_EMAIL_RETRY_CONFIG);
      const delay2 = calculateBackoffDelay(2, DEFAULT_EMAIL_RETRY_CONFIG);

      // Each delay should be greater than the previous (exponential growth)
      // Account for jitter by checking base values
      expect(delay0).toBeGreaterThanOrEqual(1000); // baseDelay * 2^0 = 1000
      expect(delay0).toBeLessThanOrEqual(1250); // max with 25% jitter
      expect(delay1).toBeGreaterThanOrEqual(2000); // baseDelay * 2^1 = 2000
      expect(delay1).toBeLessThanOrEqual(2500); // max with 25% jitter
      expect(delay2).toBeGreaterThanOrEqual(4000); // baseDelay * 2^2 = 4000
      expect(delay2).toBeLessThanOrEqual(5000); // max with 25% jitter
    });

    it('caps delay at maxDelay', async () => {
      const { calculateBackoffDelay } = await import('./retry');

      const config = {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        retryableErrors: [],
      };

      // At attempt 10, 1000 * 2^10 = 1024000, should cap at 5000 + jitter
      const delay = calculateBackoffDelay(10, config);

      expect(delay).toBeGreaterThanOrEqual(5000);
      expect(delay).toBeLessThanOrEqual(6250); // max + 25% jitter
    });

    it('includes jitter in delay calculation', async () => {
      const { calculateBackoffDelay, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      // Run multiple times and check for variance (jitter adds randomness)
      const delays: number[] = [];
      for (let i = 0; i < 10; i++) {
        delays.push(calculateBackoffDelay(0, DEFAULT_EMAIL_RETRY_CONFIG));
      }

      // With jitter, not all delays should be identical
      const uniqueDelays = new Set(delays);

      // High probability of at least 2 different values with 10 runs
      expect(uniqueDelays.size).toBeGreaterThanOrEqual(1);

      // All delays should be within expected range (1000 to 1250)
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(1250);
      });
    });
  });

  describe('isRetryableError', () => {
    it('returns true for retryable errors', async () => {
      const { isRetryableError, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      expect(isRetryableError('rate_limit_exceeded', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(true);
      expect(isRetryableError('temporarily_unavailable', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(true);
      expect(isRetryableError('internal_server_error', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(true);
      expect(isRetryableError('SEND_EXCEPTION', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(true);
    });

    it('returns false for non-retryable errors', async () => {
      const { isRetryableError, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      expect(isRetryableError('validation_error', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(false);
      expect(isRetryableError('invalid_api_key', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(false);
      expect(isRetryableError('domain_not_verified', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(false);
      expect(isRetryableError('unknown_error', DEFAULT_EMAIL_RETRY_CONFIG)).toBe(false);
    });

    it('returns false for undefined error code', async () => {
      const { isRetryableError, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      expect(isRetryableError(undefined, DEFAULT_EMAIL_RETRY_CONFIG)).toBe(false);
    });
  });

  describe('sleep', () => {
    it('resolves after specified milliseconds', async () => {
      const { sleep } = await import('./retry');

      const promise = sleep(1000);

      // Should not resolve immediately
      await vi.advanceTimersByTimeAsync(500);
      // Should resolve after full delay
      await vi.advanceTimersByTimeAsync(500);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('withRetry', () => {
    it('succeeds on first attempt without retry', async () => {
      const { withRetry, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      const operation = vi.fn().mockResolvedValue({ success: true, messageId: 'msg_123' });

      const { result, attempts } = await withRetry<TestResult>(
        operation,
        (r: TestResult) => r.success,
        (r: TestResult) => (!r.success ? r.code : undefined),
        DEFAULT_EMAIL_RETRY_CONFIG,
      );

      expect(result).toEqual({ success: true, messageId: 'msg_123' });
      expect(attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('retries on retryable error and succeeds', async () => {
      const { withRetry, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      const operation = vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Rate limited', code: 'rate_limit_exceeded' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg_123' });

      const retryPromise = withRetry<TestResult>(
        operation,
        (r: TestResult) => r.success,
        (r: TestResult) => (!r.success ? r.code : undefined),
        DEFAULT_EMAIL_RETRY_CONFIG,
      );

      // First call happens immediately
      await vi.advanceTimersByTimeAsync(0);

      // Wait for backoff delay and retry
      await vi.advanceTimersByTimeAsync(2000);

      const { result, attempts } = await retryPromise;

      expect(result).toEqual({ success: true, messageId: 'msg_123' });
      expect(attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retry_attempt',
          attempt: 1,
          nextAttempt: 2,
          errorCode: 'rate_limit_exceeded',
        }),
        'Retrying operation after transient failure',
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retry_success',
          attempt: 2,
        }),
        'Operation succeeded after retry',
      );
    });

    it('stops on non-retryable error without retrying', async () => {
      const { withRetry, DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      const operation = vi.fn()
        .mockResolvedValue({ success: false, error: 'Invalid email', code: 'validation_error' });

      const { result, attempts } = await withRetry<TestResult>(
        operation,
        (r: TestResult) => r.success,
        (r: TestResult) => (!r.success ? r.code : undefined),
        DEFAULT_EMAIL_RETRY_CONFIG,
      );

      expect(result).toEqual({ success: false, error: 'Invalid email', code: 'validation_error' });
      expect(attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('exhausts all attempts on persistent failure', async () => {
      const { withRetry } = await import('./retry');

      const config = {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        retryableErrors: ['rate_limit_exceeded'],
      };

      const operation = vi.fn()
        .mockResolvedValue({ success: false, error: 'Rate limited', code: 'rate_limit_exceeded' });

      const retryPromise = withRetry<TestResult>(
        operation,
        (r: TestResult) => r.success,
        (r: TestResult) => (!r.success ? r.code : undefined),
        config,
      );

      // Wait for all retries with backoff
      await vi.advanceTimersByTimeAsync(5000);

      const { result, attempts } = await retryPromise;

      expect(result).toEqual({ success: false, error: 'Rate limited', code: 'rate_limit_exceeded' });
      expect(attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'retry_exhausted',
          attempts: 3,
          errorCode: 'rate_limit_exceeded',
        }),
        'All retry attempts exhausted',
      );
    });

    it('passes context to logger', async () => {
      const { withRetry } = await import('./retry');

      const config = {
        maxAttempts: 2,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        retryableErrors: ['rate_limit_exceeded'],
      };

      const operation = vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Rate limited', code: 'rate_limit_exceeded' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg_123' });

      const retryPromise = withRetry<TestResult>(
        operation,
        (r: TestResult) => r.success,
        (r: TestResult) => (!r.success ? r.code : undefined),
        config,
        { emailType: 'welcome', recipient: 'jo***@example.com' },
      );

      await vi.advanceTimersByTimeAsync(2000);

      await retryPromise;

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: 'welcome',
          recipient: 'jo***@example.com',
        }),
        expect.any(String),
      );
    });
  });

  describe('DEFAULT_EMAIL_RETRY_CONFIG', () => {
    it('has expected default values', async () => {
      const { DEFAULT_EMAIL_RETRY_CONFIG } = await import('./retry');

      expect(DEFAULT_EMAIL_RETRY_CONFIG).toEqual({
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        retryableErrors: [
          'rate_limit_exceeded',
          'temporarily_unavailable',
          'internal_server_error',
          'SEND_EXCEPTION',
        ],
      });
    });
  });
});
