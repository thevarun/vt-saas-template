/**
 * Analytics Event Constants
 * Organized lists of events by category
 */

import type { EventName } from './events';
import { EventCategory } from './events';

/**
 * Authentication events
 */
export const AUTH_EVENTS: EventName[] = [
  'signup_started',
  'signup_completed',
  'login_completed',
  'logout_completed',
];

/**
 * Onboarding events
 */
export const ONBOARDING_EVENTS: EventName[] = [
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_completed',
  'onboarding_skipped',
];

/**
 * Feature events
 */
export const FEATURE_EVENTS: EventName[] = [
  'feedback_submitted',
  'profile_updated',
  'feature_first_use',
];

/**
 * Error events
 */
export const ERROR_EVENTS: EventName[] = [
  'error_occurred',
];

/**
 * Page view events
 */
export const PAGE_EVENTS: EventName[] = [
  'page_viewed',
];

/**
 * All events (union of all categories)
 */
export const ALL_EVENTS: EventName[] = [
  ...AUTH_EVENTS,
  ...ONBOARDING_EVENTS,
  ...FEATURE_EVENTS,
  ...ERROR_EVENTS,
  ...PAGE_EVENTS,
];

/**
 * Get category for an event
 * @param eventName - Event name
 * @returns Event category
 */
export function getEventCategory(eventName: EventName): EventCategory {
  if (AUTH_EVENTS.includes(eventName)) {
    return EventCategory.Auth;
  }
  if (ONBOARDING_EVENTS.includes(eventName)) {
    return EventCategory.Onboarding;
  }
  if (FEATURE_EVENTS.includes(eventName)) {
    return EventCategory.Feature;
  }
  if (ERROR_EVENTS.includes(eventName)) {
    return EventCategory.Error;
  }
  if (PAGE_EVENTS.includes(eventName)) {
    return EventCategory.Page;
  }

  return EventCategory.Feature; // Default fallback
}
