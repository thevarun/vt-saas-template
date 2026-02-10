/**
 * Analytics Library
 * Main export for analytics functionality with type-safe event tracking
 */

import { getAnalyticsProvider } from './client';
import type { EventName, EventPropertiesMap } from './events';
import type { EventProperties, UserProperties } from './types';

/**
 * Initialize analytics provider
 * Call this once on app startup (client-side only)
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   initAnalytics()
 * }, [])
 * ```
 */
export function initAnalytics(): void {
  const provider = getAnalyticsProvider();
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  provider.init({
    apiKey,
    apiHost,
    enabled: !!apiKey,
  });
}

/**
 * Identify a user in analytics
 * Call when user signs in or user properties change
 *
 * @param userId - Unique user identifier
 * @param properties - Additional user properties
 *
 * @example
 * ```tsx
 * identifyUser(user.id, {
 *   email: user.email,
 *   createdAt: new Date(user.created_at)
 * })
 * ```
 */
export function identifyUser(userId: string, properties?: UserProperties): void {
  const provider = getAnalyticsProvider();
  provider.identify(userId, properties);
}

/**
 * Track a type-safe analytics event
 * TypeScript enforces correct event names and properties
 *
 * @param eventName - Name of the event (type-checked)
 * @param properties - Event properties (typed per event)
 *
 * @example
 * ```tsx
 * // Type-safe - TypeScript validates method is valid
 * trackEvent('signup_completed', { method: 'email' })
 *
 * // Type-safe - TypeScript requires all properties
 * trackEvent('onboarding_step_completed', {
 *   step_number: 1,
 *   step_name: 'username'
 * })
 *
 * // Type error - invalid method
 * trackEvent('signup_completed', { method: 'invalid' }) // ❌ TypeScript error
 * ```
 */
export function trackEvent<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T],
): void {
  const provider = getAnalyticsProvider();

  // Add automatic context
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    // User context is automatically attached by the provider
  } as EventPropertiesMap[T] & EventProperties;

  try {
    provider.track(eventName, enrichedProperties);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Failed to track event:', eventName, error);
    }
    // Don't throw - analytics should never break the app
  }
}

/**
 * Reset user identity
 * Call when user logs out
 *
 * @example
 * ```tsx
 * await supabase.auth.signOut()
 * resetUser()
 * ```
 */
export function resetUser(): void {
  const provider = getAnalyticsProvider();
  provider.reset();
}

export type { EventName, EventPropertiesMap } from './events';

// Re-export helper functions
export {
  trackError,
  trackFeatureFirstUse,
  trackFeedbackSubmitted,
  trackLandingViewed,
  trackLoginCompleted,
  trackOnboardingCompleted,
  trackOnboardingStepCompleted,
  trackProfileUpdated,
  trackReferredSignup,
  trackSignupCompleted,
  trackUserActivated,
} from './helpers';

// Re-export referral utilities
export {
  captureReferralParams,
  clearReferralInfo,
  extractUtmParams,
  getReferralInfo,
} from './referral';

// Re-export types
export type { EventProperties, UserProperties } from './types';
