import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAnalyticsProvider } from '../client';
import { ConsoleProvider } from '../providers/console';
import { PostHogProvider } from '../providers/posthog';

// Mock the providers
vi.mock('../providers/posthog');
vi.mock('../providers/console');

describe('getAnalyticsProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    // Reset singleton
    vi.resetModules();
  });

  it('returns PostHog provider when API key exists', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';

    // Re-import to get fresh singleton
    const { getAnalyticsProvider: freshGet } = await import('../client');
    const provider = freshGet();

    expect(provider).toBeInstanceOf(PostHogProvider);
  });

  it('returns Console provider when API key is missing', async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    // Re-import to get fresh singleton
    const { getAnalyticsProvider: freshGet } = await import('../client');
    const provider = freshGet();

    expect(provider).toBeInstanceOf(ConsoleProvider);
  });

  it('returns same instance on multiple calls (singleton)', () => {
    const provider1 = getAnalyticsProvider();
    const provider2 = getAnalyticsProvider();

    expect(provider1).toBe(provider2);
  });
});
