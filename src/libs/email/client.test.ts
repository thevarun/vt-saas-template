import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create mock functions that persist across tests
const mockSend = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerInfo = vi.fn();
const mockLoggerError = vi.fn();
const mockConsoleLog = vi.fn();

// Track mock config state
let mockApiKey: string | undefined;
let mockIsEnabled = false;

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: mockSend,
    };
  },
}));

vi.mock('../Logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

vi.mock('./config', () => ({
  get EMAIL_CONFIG() {
    return {
      apiKey: mockApiKey,
      fromAddress: 'test@example.com',
      fromName: 'Test App',
      replyTo: 'reply@example.com',
    };
  },
  isEmailEnabled: () => mockIsEnabled,
  getFromAddress: () => 'Test App <test@example.com>',
}));

describe('EmailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSend.mockReset();
    mockApiKey = undefined;
    mockIsEnabled = false;
    // Mock console.log for dev mode tests
    vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('logs warning when API key is not configured in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { EmailClient } = await import('./client');
      const _client = new EmailClient();

      expect(_client).toBeDefined();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Email API key not configured - emails will be logged to console',
      );
    });

    it('does not log warning when API key is configured', async () => {
      mockApiKey = 're_test_key';
      mockIsEnabled = true;

      const { EmailClient } = await import('./client');
      const _client = new EmailClient();

      expect(_client).toBeDefined();
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });
  });

  describe('send - development mode without API key', () => {
    it('logs email to console and returns mock success in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      const result = await client.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.messageId).toMatch(/^dev_\d+_[a-z0-9]+$/);
      }

      // Should log email details to console
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('EMAIL (DEV MODE - NOT SENT)'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Type:     generic'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('To:       recipient@example.com'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Subject:  Test Subject'));
    });

    it('returns error when API key missing in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      const result = await client.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toBe('Email API key not configured');
        expect(result.code).toBe('API_KEY_MISSING');
      }
    });

    it('dev mode shows enhanced console output with emailType', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      await client.send(
        {
          to: 'recipient@example.com',
          subject: 'Welcome!',
          text: 'Welcome to our app',
        },
        { emailType: 'welcome' },
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Type:     welcome'));
    });

    it('dev mode shows CC and BCC fields', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      await client.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Body',
        cc: 'cc@example.com',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('CC:       cc@example.com'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('BCC:      bcc1@example.com, bcc2@example.com'));
    });
  });

  describe('send - with API key', () => {
    beforeEach(() => {
      mockApiKey = 're_test_key';
      mockIsEnabled = true;
    });

    it('sends email via Resend and returns success', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'msg_123abc' },
        error: null,
      });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      const result = await client.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.messageId).toBe('msg_123abc');
      }

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Test App <test@example.com>',
          to: 'recipient@example.com',
          subject: 'Test Subject',
          text: 'Test body',
        }),
      );
    });

    it('returns error when Resend API returns error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: {
          name: 'validation_error',
          message: 'Invalid recipient',
        },
      });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      const result = await client.send({
        to: 'invalid-email',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toBe('Invalid recipient');
        expect(result.code).toBe('validation_error');
      }
    });

    it('handles exception during send', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      // Use disableRetry to test exception handling without retry delays
      const result = await client.send(
        {
          to: 'recipient@example.com',
          subject: 'Test Subject',
          text: 'Test body',
        },
        { disableRetry: true },
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toBe('Network error');
        expect(result.code).toBe('SEND_EXCEPTION');
      }
    });

    it('uses payload replyTo over config replyTo', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'msg_123' },
        error: null,
      });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();
      await client.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Body',
        replyTo: 'custom-reply@example.com',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'custom-reply@example.com',
        }),
      );
    });
  });

  describe('send - retry logic', () => {
    beforeEach(() => {
      mockApiKey = 're_test_key';
      mockIsEnabled = true;
    });

    it('retries on retryable error and succeeds', async () => {
      mockSend
        .mockResolvedValueOnce({
          data: null,
          error: { name: 'rate_limit_exceeded', message: 'Rate limited' },
        })
        .mockResolvedValueOnce({
          data: { id: 'msg_123' },
          error: null,
        });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      const sendPromise = client.send({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Body',
      });

      // Wait for retry delay
      await vi.advanceTimersByTimeAsync(5000);

      const result = await sendPromise;

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-retryable error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { name: 'validation_error', message: 'Invalid email' },
      });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      const result = await client.send({
        to: 'invalid',
        subject: 'Test',
        text: 'Body',
      });

      expect(result.success).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('exhausts all retries on persistent failure', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { name: 'rate_limit_exceeded', message: 'Rate limited' },
      });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      const sendPromise = client.send(
        {
          to: 'recipient@example.com',
          subject: 'Test',
          text: 'Body',
        },
        {
          retryConfig: {
            maxAttempts: 3,
            baseDelayMs: 100,
            maxDelayMs: 1000,
          },
        },
      );

      // Wait for all retries
      await vi.advanceTimersByTimeAsync(5000);

      const result = await sendPromise;

      expect(result.success).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('disableRetry option prevents retries', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { name: 'rate_limit_exceeded', message: 'Rate limited' },
      });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      const result = await client.send(
        {
          to: 'recipient@example.com',
          subject: 'Test',
          text: 'Body',
        },
        { disableRetry: true },
      );

      expect(result.success).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('custom retry config is applied', async () => {
      mockSend
        .mockResolvedValueOnce({
          data: null,
          error: { name: 'internal_server_error', message: 'Server error' },
        })
        .mockResolvedValueOnce({
          data: { id: 'msg_123' },
          error: null,
        });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      const sendPromise = client.send(
        {
          to: 'recipient@example.com',
          subject: 'Test',
          text: 'Body',
        },
        {
          retryConfig: {
            maxAttempts: 5,
            baseDelayMs: 50,
          },
        },
      );

      await vi.advanceTimersByTimeAsync(1000);

      const result = await sendPromise;

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('passes emailType to retry context', async () => {
      mockSend
        .mockResolvedValueOnce({
          data: null,
          error: { name: 'temporarily_unavailable', message: 'Service down' },
        })
        .mockResolvedValueOnce({
          data: { id: 'msg_123' },
          error: null,
        });

      const { EmailClient } = await import('./client');
      const client = new EmailClient();

      const sendPromise = client.send(
        {
          to: 'recipient@example.com',
          subject: 'Test',
          text: 'Body',
        },
        { emailType: 'welcome' },
      );

      await vi.advanceTimersByTimeAsync(5000);

      await sendPromise;

      // Verify retry logging includes emailType
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: 'welcome',
        }),
        expect.any(String),
      );
    });
  });

  describe('createEmailClient', () => {
    it('creates a new EmailClient instance', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { createEmailClient, EmailClient } = await import('./client');
      const client = createEmailClient();

      expect(client).toBeInstanceOf(EmailClient);
    });
  });

  describe('getEmailClient', () => {
    it('returns singleton instance', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { getEmailClient, resetEmailClient } = await import('./client');

      resetEmailClient();
      const client1 = getEmailClient();
      const client2 = getEmailClient();

      expect(client1).toBe(client2);
    });

    it('creates new instance after reset', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockApiKey = undefined;
      mockIsEnabled = false;

      const { getEmailClient, resetEmailClient } = await import('./client');

      const client1 = getEmailClient();
      resetEmailClient();
      const client2 = getEmailClient();

      expect(client1).not.toBe(client2);
    });
  });
});
