/**
 * PostHog Analytics Provider
 * Production analytics provider using PostHog (lazy-loaded)
 */

import type { PostHog } from 'posthog-js';

import type { EventName, EventPropertiesMap } from '../events';
import type {
  AnalyticsConfig,
  AnalyticsProvider,
  EventProperties,
  UserProperties,
} from '../types';

/**
 * Opt-in cookieless mode. When truthy, PostHog is initialized with
 * `cookieless_mode: 'always'` (no cookies / localStorage / sessionStorage, so no
 * consent banner is required — ePrivacy Art. 5(3)), and client-side `identify()`
 * becomes a no-op. Off by default, so forks keep the standard cookie-based
 * stance. Identified product analytics must be sent server-side via
 * `trackEventServer()` (see src/libs/analytics/server.ts).
 */
function isCookielessEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS;

  return flag === 'true' || flag === '1';
}

export class PostHogProvider implements AnalyticsProvider {
  private initialized = false;
  private posthogInstance: PostHog | null = null;
  private cookieless = false;

  async init(config: AnalyticsConfig): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.initialized) {
      return;
    }

    this.cookieless = isCookielessEnabled();

    const { default: posthog } = await import('posthog-js');
    this.posthogInstance = posthog;

    posthog.init(config.apiKey, {
      api_host: config.apiHost || 'https://us.i.posthog.com',
      loaded: (_posthogInstance) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console -- dev-only PostHog initialization log
          console.log('[Analytics] PostHog initialized');
        }
      },
      ip: false,
      // Cookieless mode counts anonymous users via a rotating server-side hash
      // instead of device storage; session replay and surveys are unavailable.
      ...(this.cookieless
        ? { cookieless_mode: 'always' as const }
        : { disable_session_recording: true }),
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: UserProperties): void {
    if (
      typeof window === 'undefined'
      || !this.initialized
      || !this.posthogInstance
    ) {
      return;
    }

    // No-op under cookieless mode: `posthog.identify()` is disabled (and would
    // warn) when no device storage is available. Identified analytics are sent
    // server-side via `trackEventServer()`, keyed by the real user id.
    if (this.cookieless) {
      return;
    }

    this.posthogInstance.identify(userId, properties);
  }

  track<T extends EventName>(
    eventName: T,
    properties?: EventPropertiesMap[T] & EventProperties,
  ): void {
    if (
      typeof window === 'undefined'
      || !this.initialized
      || !this.posthogInstance
    ) {
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
      };

      this.posthogInstance.capture(eventName, enrichedProperties);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Analytics] PostHog tracking error:', error);
      }
    }
  }

  reset(): void {
    if (
      typeof window === 'undefined'
      || !this.initialized
      || !this.posthogInstance
    ) {
      return;
    }

    this.posthogInstance.reset();
  }
}
