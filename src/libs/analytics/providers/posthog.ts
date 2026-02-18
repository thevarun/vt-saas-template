/**
 * PostHog Analytics Provider
 * Production analytics provider using PostHog
 */

import posthog from 'posthog-js';

import type { EventName, EventPropertiesMap } from '../events';
import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types';

export class PostHogProvider implements AnalyticsProvider {
  private initialized = false;

  init(config: AnalyticsConfig): void {
    // Only run client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Skip if already initialized
    if (this.initialized) {
      return;
    }

    // Initialize PostHog with privacy-first settings
    posthog.init(config.apiKey, {
      api_host: config.apiHost || 'https://us.i.posthog.com',
      loaded: (_posthogInstance) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[Analytics] PostHog initialized');
        }
      },
      // Privacy settings
      ip: false, // Anonymize IP addresses
      disable_session_recording: true, // Session recording opt-in only
      // Auto-capture settings
      autocapture: true, // Enable autocapture for page views
      capture_pageview: true, // Automatically capture page views
      capture_pageleave: true, // Capture when users leave pages
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.identify(userId, properties);
  }

  track<T extends EventName>(
    eventName: T,
    properties?: EventPropertiesMap[T] & EventProperties,
  ): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    try {
      // Merge automatic context with provided properties
      const enrichedProperties = {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
      };

      posthog.capture(eventName, enrichedProperties);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Analytics] PostHog tracking error:', error);
      }
      // Don't throw - analytics should never break the app
    }
  }

  reset(): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.reset();
  }
}
