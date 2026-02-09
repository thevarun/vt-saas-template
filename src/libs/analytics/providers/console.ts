/**
 * Console Analytics Provider
 * Development-only provider that logs analytics events to console
 */

import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types';

export class ConsoleProvider implements AnalyticsProvider {
  init(_config: AnalyticsConfig): void {
    // eslint-disable-next-line no-console
    console.log('📊 [Analytics] Console mode enabled (no API key configured)');
  }

  identify(userId: string, properties?: UserProperties): void {
    // eslint-disable-next-line no-console
    console.group('👤 [Analytics] Identify User');
    // eslint-disable-next-line no-console
    console.log('User ID:', userId);
    // eslint-disable-next-line no-console
    console.log('Properties:', properties);
    // eslint-disable-next-line no-console
    console.log('Timestamp:', new Date().toISOString());
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  track(eventName: string, properties?: EventProperties): void {
    // eslint-disable-next-line no-console
    console.group(`📈 [Analytics] Track Event: ${eventName}`);
    // eslint-disable-next-line no-console
    console.log('Event:', eventName);
    // eslint-disable-next-line no-console
    console.log('Properties:', properties);
    // eslint-disable-next-line no-console
    console.log('Timestamp:', new Date().toISOString());
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  reset(): void {
    // eslint-disable-next-line no-console
    console.log('🔄 [Analytics] User reset');
  }
}
