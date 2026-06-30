import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Env module before importing config
vi.mock('../Env', () => ({
  Env: {
    RESEND_API_KEY: undefined,
    EMAIL_FROM_ADDRESS: 'test@example.com',
    EMAIL_FROM_NAME: 'Test App',
    EMAIL_LIFECYCLE_FROM_NAME: 'Team at Test App',
    EMAIL_REPLY_TO: undefined,
  },
}));

describe('Email Config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('EMAIL_CONFIG', () => {
    it('loads configuration from environment variables', async () => {
      const { EMAIL_CONFIG } = await import('./config');

      expect(EMAIL_CONFIG.fromAddress).toBe('test@example.com');
      expect(EMAIL_CONFIG.fromName).toBe('Test App');
    });

    it('handles undefined API key', async () => {
      const { EMAIL_CONFIG } = await import('./config');

      expect(EMAIL_CONFIG.apiKey).toBeUndefined();
    });

    it('handles undefined reply-to', async () => {
      const { EMAIL_CONFIG } = await import('./config');

      expect(EMAIL_CONFIG.replyTo).toBeUndefined();
    });
  });

  describe('isEmailEnabled', () => {
    it('returns false when API key is not configured', async () => {
      const { isEmailEnabled } = await import('./config');

      expect(isEmailEnabled()).toBe(false);
    });

    it('returns true when API key is configured', async () => {
      vi.doMock('../Env', () => ({
        Env: {
          RESEND_API_KEY: 're_test_key',
          EMAIL_FROM_ADDRESS: 'test@example.com',
          EMAIL_FROM_NAME: 'Test App',
          EMAIL_REPLY_TO: undefined,
        },
      }));

      const { isEmailEnabled } = await import('./config');

      expect(isEmailEnabled()).toBe(true);
    });
  });

  describe('getFromAddress', () => {
    it('formats FROM address correctly', async () => {
      const { getFromAddress } = await import('./config');

      expect(getFromAddress()).toBe('Test App <test@example.com>');
    });

    it('handles different name and address combinations', async () => {
      vi.doMock('../Env', () => ({
        Env: {
          RESEND_API_KEY: undefined,
          EMAIL_FROM_ADDRESS: 'noreply@domain.com',
          EMAIL_FROM_NAME: 'My SaaS',
          EMAIL_REPLY_TO: undefined,
        },
      }));

      const { getFromAddress } = await import('./config');

      expect(getFromAddress()).toBe('My SaaS <noreply@domain.com>');
    });
  });

  describe('getLifecycleFromAddress', () => {
    it('formats the lifecycle FROM with the lifecycle display name', async () => {
      vi.doMock('../Env', () => ({
        Env: {
          RESEND_API_KEY: undefined,
          EMAIL_FROM_ADDRESS: 'test@example.com',
          EMAIL_FROM_NAME: 'Test App',
          EMAIL_LIFECYCLE_FROM_NAME: 'Team at Test App',
          EMAIL_REPLY_TO: undefined,
        },
      }));

      const { getLifecycleFromAddress } = await import('./config');

      expect(getLifecycleFromAddress()).toBe('Team at Test App <test@example.com>');
    });

    it('shares the system FROM address but uses a different name', async () => {
      vi.doMock('../Env', () => ({
        Env: {
          RESEND_API_KEY: undefined,
          EMAIL_FROM_ADDRESS: 'noreply@domain.com',
          EMAIL_FROM_NAME: 'My SaaS',
          EMAIL_LIFECYCLE_FROM_NAME: 'Alex at My SaaS',
          EMAIL_REPLY_TO: undefined,
        },
      }));

      const { getFromAddress, getLifecycleFromAddress } = await import('./config');

      expect(getFromAddress()).toBe('My SaaS <noreply@domain.com>');
      expect(getLifecycleFromAddress()).toBe('Alex at My SaaS <noreply@domain.com>');
    });
  });
});
