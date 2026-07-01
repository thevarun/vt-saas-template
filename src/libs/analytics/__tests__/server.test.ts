/**
 * Server-Side Tracking Tests
 * Tests for server-side analytics functionality
 */

import { PostHog } from 'posthog-node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shutdownServerAnalytics, trackEventServer } from '../server';

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('posthog-node');

describe('trackEventServer', () => {
  const mockCapture = vi.fn();
  const mockFlush = vi.fn();
  const mockShutdown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PostHog as a constructor function
    const MockPostHog = vi.fn(function (this: any) {
      this.capture = mockCapture;
      this.flush = mockFlush;
      this.shutdown = mockShutdown;
      return this;
    });

    vi.mocked(PostHog).mockImplementation(MockPostHog as any);

    // Set API key for tests
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';
  });

  afterEach(async () => {
    // Reset the singleton instance between tests
    await shutdownServerAnalytics();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  it('tracks events with user ID', async () => {
    await trackEventServer('signup_completed', { method: 'email' }, 'user-123');

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'user-123',
      event: 'signup_completed',
      properties: expect.objectContaining({
        method: 'email',
        timestamp: expect.any(String),
        source: 'server',
      }),
    });
  });

  it('flushes events after tracking', async () => {
    await trackEventServer('signup_completed', { method: 'email' }, 'user-123');

    expect(mockFlush).toHaveBeenCalled();
  });

  it('tracks events without user ID as anonymous', async () => {
    await trackEventServer('page_viewed', {
      page_url: '/landing',
    });

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'anonymous',
      event: 'page_viewed',
      properties: expect.objectContaining({
        page_url: '/landing',
        timestamp: expect.any(String),
        source: 'server',
      }),
    });
  });

  it('adds automatic timestamp', async () => {
    const beforeTime = Date.now();
    await trackEventServer('signup_completed', { method: 'email' });
    const afterTime = Date.now();

    const call = mockCapture.mock.calls[0];
    const properties = call?.[0]?.properties;
    const timestamp = properties?.timestamp as string;

    expect(timestamp).toBeDefined();

    const timestampMs = new Date(timestamp).getTime();

    expect(timestampMs).toBeGreaterThanOrEqual(beforeTime);
    expect(timestampMs).toBeLessThanOrEqual(afterTime);
  });

  it('adds source: server to all events', async () => {
    await trackEventServer('login_completed', { method: 'google' }, 'user-456');

    expect(mockCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          source: 'server',
        }),
      }),
    );
  });

  it('handles missing API key gracefully', async () => {
    await shutdownServerAnalytics();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    // Mock console.warn to avoid test failure
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Should not throw
    await expect(
      trackEventServer('signup_completed', { method: 'email' }),
    ).resolves.not.toThrow();

    // Should not call PostHog
    expect(mockCapture).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('handles tracking errors gracefully', async () => {
    // Mock console.error to avoid test failure
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockCapture.mockImplementation(() => {
      throw new Error('Network error');
    });

    // Should not throw
    await expect(
      trackEventServer('signup_completed', { method: 'email' }),
    ).resolves.not.toThrow();

    errorSpy.mockRestore();
  });

  it('tracks onboarding events with correct properties', async () => {
    // Clear error mock from previous test
    mockCapture.mockClear();
    mockCapture.mockImplementation(() => {});

    await trackEventServer(
      'onboarding_step_completed',
      {
        step_number: 2,
        step_name: 'preferences',
      },
      'user-789',
    );

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'user-789',
      event: 'onboarding_step_completed',
      properties: expect.objectContaining({
        step_number: 2,
        step_name: 'preferences',
      }),
    });
  });

  it('forwards personSet as $set on capture', async () => {
    mockCapture.mockClear();
    mockCapture.mockImplementation(() => {});

    await trackEventServer(
      'signup_completed',
      { method: 'email' },
      'user-123',
      { personSet: { plan: 'pro' } },
    );

    expect(mockCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: 'user-123',
        $set: { plan: 'pro' },
      }),
    );
  });

  it('forwards personSetOnce as $set_once on capture', async () => {
    mockCapture.mockClear();
    mockCapture.mockImplementation(() => {});

    await trackEventServer(
      'signup_completed',
      { method: 'email' },
      'user-123',
      { personSetOnce: { first_seen: '2026-01-01' } },
    );

    expect(mockCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        $set_once: { first_seen: '2026-01-01' },
      }),
    );
  });

  it('omits $set/$set_once when no options are passed', async () => {
    mockCapture.mockClear();
    mockCapture.mockImplementation(() => {});

    await trackEventServer('signup_completed', { method: 'email' }, 'user-123');

    const payload = mockCapture.mock.calls[0]?.[0];

    expect(payload).not.toHaveProperty('$set');
    expect(payload).not.toHaveProperty('$set_once');
  });

  it('tracks error events with correct properties', async () => {
    // Clear error mock from previous test
    mockCapture.mockClear();
    mockCapture.mockImplementation(() => {});

    await trackEventServer(
      'error_occurred',
      {
        error_type: 'api_error',
        error_message: 'Failed to fetch',
        error_location: 'api/users',
      },
      'user-123',
    );

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'user-123',
      event: 'error_occurred',
      properties: expect.objectContaining({
        error_type: 'api_error',
        error_message: 'Failed to fetch',
        error_location: 'api/users',
      }),
    });
  });
});
