/**
 * Analytics Client Singleton
 * Factory that returns the appropriate analytics provider (PostHog or Console)
 */

import { ConsoleProvider } from './providers/console';
import { PostHogProvider } from './providers/posthog';
import type { AnalyticsProvider } from './types';

let analyticsInstance: AnalyticsProvider | null = null;

/**
 * Get the analytics provider instance (singleton)
 * Returns PostHog provider if API key exists, otherwise Console provider
 */
export function getAnalyticsProvider(): AnalyticsProvider {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (apiKey) {
    analyticsInstance = new PostHogProvider();
  } else {
    analyticsInstance = new ConsoleProvider();
  }

  return analyticsInstance;
}
