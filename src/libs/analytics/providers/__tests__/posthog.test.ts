// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PostHogProvider } from '../posthog';

// Mock posthog-js as a dynamic import
const mockPosthog = {
  init: vi.fn(),
  identify: vi.fn(),
  capture: vi.fn(),
  reset: vi.fn(),
};

vi.mock('posthog-js', () => ({
  default: mockPosthog,
}));

describe('PostHogProvider', () => {
  let provider: PostHogProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new PostHogProvider();
  });

  describe('init', () => {
    it('initializes PostHog with correct config', async () => {
      const config = {
        apiKey: 'test-key',
        apiHost: 'https://test.posthog.com',
        enabled: true,
      };

      await provider.init(config);

      expect(mockPosthog.init).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          api_host: 'https://test.posthog.com',
          ip: false,
          disable_session_recording: true,
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: true,
        }),
      );
    });

    it('disables autocapture', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      expect(mockPosthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          autocapture: false,
        }),
      );
    });

    it('disables automatic pageview capture', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      expect(mockPosthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          capture_pageview: false,
        }),
      );
    });

    it('enables IP anonymization by default', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      expect(mockPosthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          ip: false,
        }),
      );
    });

    it('disables session recording by default', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      expect(mockPosthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          disable_session_recording: true,
        }),
      );
    });

    it('uses default host if not provided', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      expect(mockPosthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          api_host: 'https://us.i.posthog.com',
        }),
      );
    });

    it('does not initialize twice', async () => {
      await provider.init({ apiKey: 'test', enabled: true });
      await provider.init({ apiKey: 'test', enabled: true });

      expect(mockPosthog.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('identify', () => {
    it('identifies user with properties', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      const userId = 'user-123';
      const properties = { email: 'test@example.com' };

      provider.identify(userId, properties);

      expect(mockPosthog.identify).toHaveBeenCalledWith(userId, properties);
    });

    it('does not call posthog if not initialized', () => {
      provider.identify('user-123');

      expect(mockPosthog.identify).not.toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('tracks event with properties', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      const eventName = 'signup_completed';
      const properties = {
        method: 'email' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      provider.track(eventName, properties);

      expect(mockPosthog.capture).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          method: 'email',
          timestamp: expect.any(String),
        }),
      );
    });

    it('does not call posthog if not initialized', () => {
      provider.track('signup_completed', { method: 'email' });

      expect(mockPosthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('cookieless mode (opt-in)', () => {
    const original = process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS;

    afterEach(() => {
      process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS = original;
    });

    it('enables cookieless_mode and drops disable_session_recording when flag is truthy', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS = 'true';

      await provider.init({ apiKey: 'test', enabled: true });

      const config = mockPosthog.init.mock.calls[0]?.[1];

      expect(config).toMatchObject({ cookieless_mode: 'always' });
      expect(config).not.toHaveProperty('disable_session_recording');
    });

    it('makes identify a no-op under cookieless mode', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS = '1';

      await provider.init({ apiKey: 'test', enabled: true });
      provider.identify('user-123', { email: 'test@example.com' });

      expect(mockPosthog.identify).not.toHaveBeenCalled();
    });

    it('keeps cookie-based behavior when flag is unset', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS;

      await provider.init({ apiKey: 'test', enabled: true });
      provider.identify('user-123');

      const config = mockPosthog.init.mock.calls[0]?.[1];

      expect(config).toMatchObject({ disable_session_recording: true });
      expect(config).not.toHaveProperty('cookieless_mode');
      expect(mockPosthog.identify).toHaveBeenCalledWith('user-123', undefined);
    });
  });

  describe('reset', () => {
    it('resets user identity', async () => {
      await provider.init({ apiKey: 'test', enabled: true });

      provider.reset();

      expect(mockPosthog.reset).toHaveBeenCalled();
    });

    it('does not call posthog if not initialized', () => {
      provider.reset();

      expect(mockPosthog.reset).not.toHaveBeenCalled();
    });
  });
});
