/**
 * PostHog Analytics Provider
 * Production analytics provider using PostHog (lazy-loaded)
 */

import type { PostHog } from 'posthog-js';

import type { EventName, EventPropertiesMap } from '../events';
import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types';

export class PostHogProvider implements AnalyticsProvider {
  private initialized = false;
  private posthogInstance: PostHog | null = null;

  async init(config: AnalyticsConfig): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.initialized) {
      return;
    }

    const { default: posthog } = await import('posthog-js');
    this.posthogInstance = posthog;

    posthog.init(config.apiKey, {
      api_host: config.apiHost || 'https://us.i.posthog.com',
      loaded: (_posthogInstance) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[Analytics] PostHog initialized');
        }
      },
      ip: false,
      disable_session_recording: true,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.initialized || !this.posthogInstance) {
      return;
    }

    this.posthogInstance.identify(userId, properties);
  }

  track<T extends EventName>(
    eventName: T,
    properties?: EventPropertiesMap[T] & EventProperties,
  ): void {
    if (typeof window === 'undefined' || !this.initialized || !this.posthogInstance) {
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
    if (typeof window === 'undefined' || !this.initialized || !this.posthogInstance) {
      return;
    }

    this.posthogInstance.reset();
  }
}
