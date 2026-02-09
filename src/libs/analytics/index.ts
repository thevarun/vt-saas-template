/**
 * Analytics Library
 * Main export for analytics functionality
 */

import { getAnalyticsProvider } from './client';
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
 * Track an analytics event
 * Use for tracking user actions and behaviors
 *
 * @param eventName - Name of the event
 * @param properties - Event properties
 *
 * @example
 * ```tsx
 * trackEvent('button_clicked', {
 *   buttonName: 'Sign Up',
 *   location: 'header'
 * })
 * ```
 */
export function trackEvent(eventName: string, properties?: EventProperties): void {
  const provider = getAnalyticsProvider();
  provider.track(eventName, properties);
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

// Re-export types
export type { EventProperties, UserProperties } from './types';
