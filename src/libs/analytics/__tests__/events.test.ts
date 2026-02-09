/**
 * Event Tracking Tests
 * Tests for type-safe event tracking functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAnalyticsProvider } from '../client';
import { trackEvent } from '../index';

vi.mock('../client');

describe('trackEvent', () => {
  const mockProvider = {
    track: vi.fn(),
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnalyticsProvider).mockReturnValue(mockProvider);
  });

  it('calls provider.track with event and properties', () => {
    trackEvent('signup_completed', { method: 'email' });

    expect(mockProvider.track).toHaveBeenCalledWith(
      'signup_completed',
      expect.objectContaining({
        method: 'email',
        timestamp: expect.any(String),
      }),
    );
  });

  it('adds automatic timestamp', () => {
    const beforeTime = new Date().getTime();
    trackEvent('signup_completed', { method: 'email' });
    const afterTime = new Date().getTime();

    const call = mockProvider.track.mock.calls[0];
    const properties = call?.[1];
    const timestamp = properties?.timestamp as string;

    expect(timestamp).toBeDefined();

    const timestampMs = new Date(timestamp).getTime();

    expect(timestampMs).toBeGreaterThanOrEqual(beforeTime);
    expect(timestampMs).toBeLessThanOrEqual(afterTime);
  });

  it('handles tracking errors gracefully', () => {
    mockProvider.track.mockImplementation(() => {
      throw new Error('Network error');
    });

    // Should not throw
    expect(() => {
      trackEvent('signup_completed', { method: 'email' });
    }).not.toThrow();
  });

  it('tracks events with no properties', () => {
    trackEvent('signup_started', {});

    expect(mockProvider.track).toHaveBeenCalledWith(
      'signup_started',
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  });

  it('tracks onboarding step completed with correct properties', () => {
    trackEvent('onboarding_step_completed', {
      step_number: 1,
      step_name: 'username',
    });

    expect(mockProvider.track).toHaveBeenCalledWith(
      'onboarding_step_completed',
      expect.objectContaining({
        step_number: 1,
        step_name: 'username',
        timestamp: expect.any(String),
      }),
    );
  });

  it('tracks error events with correct properties', () => {
    trackEvent('error_occurred', {
      error_type: 'api_error',
      error_message: 'Failed to fetch',
      error_location: 'dashboard',
    });

    expect(mockProvider.track).toHaveBeenCalledWith(
      'error_occurred',
      expect.objectContaining({
        error_type: 'api_error',
        error_message: 'Failed to fetch',
        error_location: 'dashboard',
        timestamp: expect.any(String),
      }),
    );
  });
});
