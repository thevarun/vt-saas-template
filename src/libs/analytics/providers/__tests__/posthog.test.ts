import posthog from 'posthog-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostHogProvider } from '../posthog';

// Mock posthog-js
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    reset: vi.fn(),
  },
}));

describe('PostHogProvider', () => {
  let provider: PostHogProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new PostHogProvider();
  });

  describe('init', () => {
    it('initializes PostHog with correct config', () => {
      const config = {
        apiKey: 'test-key',
        apiHost: 'https://test.posthog.com',
        enabled: true,
      };

      provider.init(config);

      expect(posthog.init).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          api_host: 'https://test.posthog.com',
          ip: false,
          disable_session_recording: true,
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
        }),
      );
    });

    it('enables IP anonymization by default', () => {
      provider.init({ apiKey: 'test', enabled: true });

      expect(posthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          ip: false,
        }),
      );
    });

    it('disables session recording by default', () => {
      provider.init({ apiKey: 'test', enabled: true });

      expect(posthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          disable_session_recording: true,
        }),
      );
    });

    it('uses default host if not provided', () => {
      provider.init({ apiKey: 'test', enabled: true });

      expect(posthog.init).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          api_host: 'https://us.i.posthog.com',
        }),
      );
    });

    it('does not initialize twice', () => {
      provider.init({ apiKey: 'test', enabled: true });
      provider.init({ apiKey: 'test', enabled: true });

      expect(posthog.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('identify', () => {
    it('identifies user with properties', () => {
      provider.init({ apiKey: 'test', enabled: true });

      const userId = 'user-123';
      const properties = { email: 'test@example.com' };

      provider.identify(userId, properties);

      expect(posthog.identify).toHaveBeenCalledWith(userId, properties);
    });

    it('does not call posthog if not initialized', () => {
      provider.identify('user-123');

      expect(posthog.identify).not.toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('tracks event with properties', () => {
      provider.init({ apiKey: 'test', enabled: true });

      const eventName = 'signup_completed';
      const properties = { method: 'email' as const, timestamp: '2024-01-01T00:00:00.000Z' };

      provider.track(eventName, properties);

      expect(posthog.capture).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          method: 'email',
          timestamp: expect.any(String),
        }),
      );
    });

    it('does not call posthog if not initialized', () => {
      provider.track('signup_completed', { method: 'email' });

      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('resets user identity', () => {
      provider.init({ apiKey: 'test', enabled: true });

      provider.reset();

      expect(posthog.reset).toHaveBeenCalled();
    });

    it('does not call posthog if not initialized', () => {
      provider.reset();

      expect(posthog.reset).not.toHaveBeenCalled();
    });
  });
});
