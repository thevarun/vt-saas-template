/**
 * Analytics Provider Types
 * Defines the interface for analytics providers (PostHog, Amplitude, Mixpanel, etc.)
 */

import type { EventName, EventPropertiesMap } from './events';

/**
 * Event properties type - key-value pairs for event metadata
 */
export type EventProperties = {
  [key: string]: string | number | boolean | Date | null;
};

/**
 * User properties type - attributes for user identification
 */
export type UserProperties = {
  email?: string;
  name?: string;
  createdAt?: Date;
  [key: string]: string | number | boolean | Date | undefined;
};

/**
 * Analytics configuration options
 */
export type AnalyticsConfig = {
  apiKey: string;
  apiHost?: string;
  enabled: boolean;
};

/**
 * Event context - automatically attached metadata
 */
export type EventContext = {
  timestamp?: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined;
};

/**
 * Event metadata - system-level information
 */
export type EventMetadata = {
  timestamp: string;
  source: 'client' | 'server';
};

/**
 * Analytics Provider interface
 * Implement this interface to create a new analytics provider
 */
export type AnalyticsProvider = {
  /**
   * Initialize the analytics provider
   * @param config - Configuration options
   */
  init: (config: AnalyticsConfig) => void;

  /**
   * Identify a user in analytics
   * @param userId - Unique user identifier
   * @param properties - Additional user properties
   */
  identify: (userId: string, properties?: UserProperties) => void;

  /**
   * Track an analytics event (type-safe with generics)
   * @param eventName - Name of the event (typed)
   * @param properties - Event properties (typed per event)
   */
  track: <T extends EventName>(
    eventName: T,
    properties?: EventPropertiesMap[T] & EventProperties,
  ) => void;

  /**
   * Reset user identity (call on logout)
   */
  reset: () => void;
};
