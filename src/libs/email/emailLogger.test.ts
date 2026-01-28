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

describe('emailLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-28T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('hashEmailForLog', () => {
    it('masks email address correctly', async () => {
      const { hashEmailForLog } = await import('./emailLogger');

      expect(hashEmailForLog('john.doe@example.com')).toBe('jo***@example.com');
      expect(hashEmailForLog('ab@test.com')).toBe('ab***@test.com');
      expect(hashEmailForLog('a@domain.org')).toBe('a***@domain.org');
    });

    it('handles array of emails (takes first)', async () => {
      const { hashEmailForLog } = await import('./emailLogger');

      expect(hashEmailForLog(['john@example.com', 'jane@example.com'])).toBe('jo***@example.com');
    });

    it('handles empty array', async () => {
      const { hashEmailForLog } = await import('./emailLogger');

      expect(hashEmailForLog([])).toBe('unknown');
    });

    it('handles empty string email', async () => {
      const { hashEmailForLog } = await import('./emailLogger');

      // Empty string is treated as missing/falsy
      expect(hashEmailForLog('')).toBe('unknown');
    });

    it('handles invalid email format (no @)', async () => {
      const { hashEmailForLog } = await import('./emailLogger');

      expect(hashEmailForLog('notanemail')).toBe('invalid');
    });

    it('handles email with empty local part', async () => {
      const { hashEmailForLog } = await import('./emailLogger');

      expect(hashEmailForLog('@domain.com')).toBe('invalid');
    });
  });

  describe('logEmailEvent', () => {
    it('logs success event with info level', async () => {
      const { logEmailEvent } = await import('./emailLogger');

      logEmailEvent({
        type: 'email_sent',
        emailType: 'welcome',
        recipient: 'jo***@example.com',
        subject: 'Welcome!',
        messageId: 'msg_123',
        status: 'success',
        durationMs: 245,
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email_sent',
          emailType: 'welcome',
          recipient: 'jo***@example.com',
          subject: 'Welcome!',
          messageId: 'msg_123',
          status: 'success',
          durationMs: 245,
          timestamp: '2026-01-28T12:00:00.000Z',
        }),
        'Email sent: welcome',
      );
    });

    it('logs failure event with error level', async () => {
      const { logEmailEvent } = await import('./emailLogger');

      logEmailEvent({
        type: 'email_failed',
        emailType: 'receipt',
        recipient: 'jo***@example.com',
        subject: 'Your Receipt',
        status: 'failure',
        errorCode: 'validation_error',
        errorMessage: 'Invalid recipient',
      });

      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email_failed',
          emailType: 'receipt',
          status: 'failure',
          errorCode: 'validation_error',
          errorMessage: 'Invalid recipient',
          timestamp: '2026-01-28T12:00:00.000Z',
        }),
        'Email failed: receipt',
      );
    });

    it('logs retry event with warn level', async () => {
      const { logEmailEvent } = await import('./emailLogger');

      logEmailEvent({
        type: 'email_retry',
        emailType: 'notification',
        recipient: 'jo***@example.com',
        status: 'retry',
        attempt: 2,
        totalAttempts: 3,
        errorCode: 'rate_limit_exceeded',
      });

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email_retry',
          emailType: 'notification',
          status: 'retry',
          attempt: 2,
          totalAttempts: 3,
          timestamp: '2026-01-28T12:00:00.000Z',
        }),
        'Email retry: notification',
      );
    });

    it('logs dev_mode event with info level', async () => {
      const { logEmailEvent } = await import('./emailLogger');

      logEmailEvent({
        type: 'email_dev_mode',
        emailType: 'welcome',
        recipient: 'john@example.com',
        subject: 'Welcome!',
        status: 'dev_mode',
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email_dev_mode',
          emailType: 'welcome',
          status: 'dev_mode',
          timestamp: '2026-01-28T12:00:00.000Z',
        }),
        'Email logged (dev mode): welcome',
      );
    });

    it('includes timestamp in all logs', async () => {
      const { logEmailEvent } = await import('./emailLogger');

      logEmailEvent({
        type: 'email_sent',
        emailType: 'test',
        recipient: 'te***@test.com',
        status: 'success',
      });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: '2026-01-28T12:00:00.000Z',
        }),
        expect.any(String),
      );
    });
  });

  describe('createEmailTimer', () => {
    it('measures duration correctly', async () => {
      const { createEmailTimer } = await import('./emailLogger');

      const getTimer = createEmailTimer();

      // Advance time by 250ms
      vi.advanceTimersByTime(250);

      const duration = getTimer();

      expect(duration).toBe(250);
    });

    it('can be called multiple times', async () => {
      const { createEmailTimer } = await import('./emailLogger');

      const getTimer = createEmailTimer();

      vi.advanceTimersByTime(100);
      const duration1 = getTimer();

      vi.advanceTimersByTime(100);
      const duration2 = getTimer();

      expect(duration1).toBe(100);
      expect(duration2).toBe(200);
    });
  });
});
