import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendTestEmail } from '../mockEmailService';

describe('mockEmailService', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('returns success with messageId', async () => {
    const result = await sendTestEmail({
      template: 'welcome',
      to: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('messageId starts with mock-', async () => {
    const result = await sendTestEmail({
      template: 'welcome',
      to: 'test@example.com',
    });

    expect(result.messageId).toMatch(/^mock-/);
  });

  it('works with welcome template', async () => {
    const result = await sendTestEmail({
      template: 'welcome',
      to: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain('welcome');
  });

  it('works with password-reset template', async () => {
    const result = await sendTestEmail({
      template: 'password-reset',
      to: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain('password-reset');
  });

  it('works with verify-email template', async () => {
    const result = await sendTestEmail({
      template: 'verify-email',
      to: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain('verify-email');
  });

  it('works with optional data parameter', async () => {
    const result = await sendTestEmail({
      template: 'welcome',
      to: 'test@example.com',
      data: { name: 'John Doe', plan: 'premium' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('console.log is called with params', async () => {
    const params = {
      template: 'welcome' as const,
      to: 'test@example.com',
      data: { name: 'Test' },
    };

    await sendTestEmail(params);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[MockEmailService] Sending test email:',
      {
        template: 'welcome',
        to: 'test@example.com',
        data: { name: 'Test' },
      },
    );
  });
});
