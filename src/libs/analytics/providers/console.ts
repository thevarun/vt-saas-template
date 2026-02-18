/**
 * Console Analytics Provider
 * Development-only provider that logs analytics events to console with enhanced formatting
 */

import type { EventName } from '../events';
import { EVENT_CATEGORIES } from '../events';
import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types';

export class ConsoleProvider implements AnalyticsProvider {
  private eventCount = 0;

  init(_config: AnalyticsConfig): void {
    // eslint-disable-next-line no-console
    console.log(
      '%c📊 [Analytics] Console mode enabled (no API key configured)',
      'color: #FFA500; font-weight: bold',
    );
  }

  identify(userId: string, properties?: UserProperties): void {
    // eslint-disable-next-line no-console
    console.group('%c👤 [Analytics] Identify User', 'color: #00A6FF; font-weight: bold');
    // eslint-disable-next-line no-console
    console.log('User ID:', userId);
    if (properties && Object.keys(properties).length > 0) {
      // eslint-disable-next-line no-console
      console.table(properties);
    }
    // eslint-disable-next-line no-console
    console.log('Timestamp:', new Date().toISOString());
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  track(eventName: string, properties?: EventProperties): void {
    this.eventCount++;

    const category = EVENT_CATEGORIES[eventName as EventName] || 'unknown';

    // Color-coded by category
    const colors: Record<string, string> = {
      auth: '#4CAF50',
      onboarding: '#2196F3',
      feature: '#FF9800',
      error: '#F44336',
      page: '#9C27B0',
      unknown: '#888888',
    };
    const color = colors[category] || colors.unknown;

    // eslint-disable-next-line no-console
    console.group(
      `%c📊 [Analytics] Event #${this.eventCount}: ${eventName}`,
      `color: ${color}; font-weight: bold`,
    );
    // eslint-disable-next-line no-console
    console.log('Category:', category);
    // eslint-disable-next-line no-console
    console.log('Timestamp:', new Date().toISOString());

    if (properties && Object.keys(properties).length > 0) {
      // eslint-disable-next-line no-console
      console.log('Properties:');
      // eslint-disable-next-line no-console
      console.table(properties);
    }

    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  reset(): void {
    // eslint-disable-next-line no-console
    console.log(
      '%c🔄 [Analytics] User reset',
      'color: #FFA500; font-weight: bold',
    );
    this.eventCount = 0;
  }
}
