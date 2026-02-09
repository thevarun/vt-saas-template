/**
 * Analytics Provider Types
 * Defines the interface for analytics providers (PostHog, Amplitude, Mixpanel, etc.)
 */

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
   * Track an analytics event
   * @param eventName - Name of the event
   * @param properties - Event properties
   */
  track: (eventName: string, properties?: EventProperties) => void;

  /**
   * Reset user identity (call on logout)
   */
  reset: () => void;
};
