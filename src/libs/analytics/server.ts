/**
 * Server-Side Analytics Tracking
 * Use this module for tracking events from API routes and server components
 */

import { PostHog } from 'posthog-node';

import { logger } from '@/libs/Logger';

import type { EventName, EventPropertiesMap } from './events';

let posthogInstance: PostHog | null = null;

/**
 * Get PostHog server-side instance (singleton)
 * Initializes on first call and reuses for subsequent calls
 *
 * @returns PostHog instance or null if no API key
 */
function getServerAnalytics(): PostHog | null {
  if (posthogInstance) {
    return posthogInstance;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost
    = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[Analytics Server] PostHog disabled: no API key');
    }
    return null;
  }

  posthogInstance = new PostHog(apiKey, {
    host: apiHost,
  });

  return posthogInstance;
}

/**
 * Options for server-side event tracking.
 */
export type TrackServerOptions = {
  /** PostHog $set — update person properties (overwrite). */
  personSet?: Record<string, unknown>;
  /** PostHog $set_once — set person properties only if not already set. */
  personSetOnce?: Record<string, unknown>;
};

/**
 * Track event from server-side (API routes, server components)
 * Type-safe with automatic timestamp and source tracking
 *
 * @param eventName - Name of the event (type-checked)
 * @param properties - Event properties (typed per event)
 * @param userId - User ID for identification (optional)
 * @param options - Optional $set/$set_once for person properties
 *
 * @example
 * ```tsx
 * // In an API route
 * await trackEventServer('signup_completed', { method: 'email' }, user.id)
 *
 * // With person property updates
 * await trackEventServer(
 *   'profile_updated',
 *   { fields_updated: ['name', 'avatar'] },
 *   user.id,
 *   { personSet: { name: 'Ada', plan: 'pro' } },
 * )
 * ```
 */
export async function trackEventServer<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T],
  userId?: string,
  options?: TrackServerOptions,
): Promise<void> {
  const client = getServerAnalytics();

  if (!client) {
    // Log in development (console mode)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        '[Analytics Server]',
        eventName,
        properties,
        userId ? `(User: ${userId})` : '(No user)',
      );
    }
    return;
  }

  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    source: 'server' as const,
  };

  try {
    client.capture({
      distinctId: userId || 'anonymous',
      event: eventName,
      properties: enrichedProperties,
      ...(options?.personSet && { $set: options.personSet }),
      ...(options?.personSetOnce && { $set_once: options.personSetOnce }),
    });

    // Important: Flush events in serverless environments
    // This ensures events are sent before function terminates
    await client.flush();
  } catch (error) {
    logger.error(
      { error, eventName },
      '[Analytics Server] Failed to track event',
    );
    // Don't throw - analytics should never break the app
  }
}

/**
 * Shutdown PostHog client (call on server shutdown)
 * Only needed for long-running servers, not serverless
 *
 * @example
 * ```tsx
 * process.on('SIGTERM', async () => {
 *   await shutdownServerAnalytics()
 *   process.exit(0)
 * })
 * ```
 */
export async function shutdownServerAnalytics(): Promise<void> {
  if (posthogInstance) {
    await posthogInstance.shutdown();
    posthogInstance = null;
  }
}
