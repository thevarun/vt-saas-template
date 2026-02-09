/**
 * PostHog Analytics Provider
 * Production analytics provider using PostHog
 */

import posthog from 'posthog-js';

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

  track(eventName: string, properties?: EventProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.capture(eventName, properties);
  }

  reset(): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.reset();
  }
}
