import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger
const mockLoggerError = vi.fn();

vi.mock('../Logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

describe('sendEmailAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns immediately without blocking', async () => {
    const { sendEmailAsync } = await import('./sendEmailAsync');

    let resolved = false;
    const sendFn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve({ success: true, messageId: 'msg_123' });
          }, 1000);
        }),
    );

    sendEmailAsync(sendFn, { emailType: 'welcome' });

    // Should return immediately, not wait for promise
    expect(resolved).toBe(false);
    expect(sendFn).toHaveBeenCalled();
  });

  it('logs failure on send failure result', async () => {
    vi.useFakeTimers();
    const { sendEmailAsync } = await import('./sendEmailAsync');

    const sendFn = vi.fn().mockResolvedValue({
      success: false,
      error: 'Invalid email',
      code: 'validation_error',
    });

    sendEmailAsync(sendFn, {
      emailType: 'welcome',
      recipientHint: 'john@example.com',
    });

    // Wait for promise to resolve
    await vi.runAllTimersAsync();

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'email_async_failure',
        emailType: 'welcome',
        recipient: 'jo***@example.com',
        error: 'Invalid email',
        code: 'validation_error',
      }),
      'Async email send failed',
    );
  });

  it('logs exception on thrown error', async () => {
    vi.useFakeTimers();
    const { sendEmailAsync } = await import('./sendEmailAsync');

    const sendFn = vi.fn().mockRejectedValue(new Error('Network failure'));

    sendEmailAsync(sendFn, {
      emailType: 'notification',
      recipientHint: 'jane@example.com',
    });

    // Wait for promise to reject
    await vi.runAllTimersAsync();

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'email_async_exception',
        emailType: 'notification',
        recipient: 'ja***@example.com',
        error: 'Network failure',
      }),
      'Async email send exception',
    );
  });

  it('handles missing recipient hint', async () => {
    vi.useFakeTimers();
    const { sendEmailAsync } = await import('./sendEmailAsync');

    const sendFn = vi.fn().mockResolvedValue({
      success: false,
      error: 'Some error',
      code: 'error_code',
    });

    sendEmailAsync(sendFn, { emailType: 'test' });

    await vi.runAllTimersAsync();

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'unknown',
      }),
      expect.any(String),
    );
  });

  it('does not log on success', async () => {
    vi.useFakeTimers();
    const { sendEmailAsync } = await import('./sendEmailAsync');

    const sendFn = vi.fn().mockResolvedValue({
      success: true,
      messageId: 'msg_123',
    });

    sendEmailAsync(sendFn, { emailType: 'welcome' });

    await vi.runAllTimersAsync();

    expect(mockLoggerError).not.toHaveBeenCalled();
  });
});
