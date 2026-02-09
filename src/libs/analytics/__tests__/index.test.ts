import { beforeEach, describe, expect, it, vi } from 'vitest';

import { identifyUser, initAnalytics, resetUser, trackEvent } from '../index';

// Mock the client
const mockProvider = {
  init: vi.fn(),
  identify: vi.fn(),
  track: vi.fn(),
  reset: vi.fn(),
};

vi.mock('../client', () => ({
  getAnalyticsProvider: () => mockProvider,
}));

describe('analytics utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://test.posthog.com';
  });

  describe('initAnalytics', () => {
    it('calls provider.init with correct config', () => {
      initAnalytics();

      expect(mockProvider.init).toHaveBeenCalledWith({
        apiKey: 'test-key',
        apiHost: 'https://test.posthog.com',
        enabled: true,
      });
    });

    it('sets enabled to false when API key is missing', () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

      initAnalytics();

      expect(mockProvider.init).toHaveBeenCalledWith({
        apiKey: '',
        apiHost: 'https://test.posthog.com',
        enabled: false,
      });
    });
  });

  describe('identifyUser', () => {
    it('calls provider.identify with userId and properties', () => {
      const userId = 'user-123';
      const properties = { email: 'test@example.com', name: 'Test User' };

      identifyUser(userId, properties);

      expect(mockProvider.identify).toHaveBeenCalledWith(userId, properties);
    });

    it('calls provider.identify with userId only', () => {
      const userId = 'user-123';

      identifyUser(userId);

      expect(mockProvider.identify).toHaveBeenCalledWith(userId, undefined);
    });
  });

  describe('trackEvent', () => {
    it('calls provider.track with eventName and properties', () => {
      trackEvent('signup_completed', { method: 'email' });

      expect(mockProvider.track).toHaveBeenCalledWith(
        'signup_completed',
        expect.objectContaining({
          method: 'email',
          timestamp: expect.any(String),
        }),
      );
    });

    it('calls provider.track with eventName only', () => {
      trackEvent('signup_started', {});

      expect(mockProvider.track).toHaveBeenCalledWith(
        'signup_started',
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('resetUser', () => {
    it('calls provider.reset', () => {
      resetUser();

      expect(mockProvider.reset).toHaveBeenCalled();
    });
  });
});
