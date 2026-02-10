/**
 * User Activation Tracking
 * Tracks when users reach activation milestone
 *
 * Activation Criteria:
 * - Completed onboarding
 * - Performed first meaningful action (feedback, chat, profile update)
 */

import { trackUserActivated } from './helpers';

const ACTIVATION_STORAGE_KEY = 'user_activated';
const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

/**
 * Meaningful actions that count towards activation
 */
export const ACTIVATION_TRIGGERS = [
  'feedback_submitted',
  'profile_updated',
  'chat_used',
] as const;

export type ActivationTrigger = typeof ACTIVATION_TRIGGERS[number] | 'onboarding_completed';

/**
 * Check if localStorage is available
 *
 * @returns True if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user has already been activated
 *
 * @returns True if user is already activated
 */
export function isUserActivated(): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return false;
  }

  return localStorage.getItem(ACTIVATION_STORAGE_KEY) === 'true';
}

/**
 * Mark onboarding as completed
 * Call this when user completes onboarding
 *
 * @example
 * ```tsx
 * // In onboarding completion handler
 * markOnboardingCompleted()
 * ```
 */
export function markOnboardingCompleted(): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return;
  }

  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

/**
 * Check if user has completed onboarding
 *
 * @returns True if onboarding is completed
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return false;
  }

  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

/**
 * Check if activation criteria are met and should track activation
 *
 * @returns True if should track activation event
 */
export function shouldTrackActivation(): boolean {
  // Already activated - don't track again
  if (isUserActivated()) {
    return false;
  }

  // Must complete onboarding first
  if (!hasCompletedOnboarding()) {
    return false;
  }

  return true;
}

/**
 * Track user activation event
 * Calculates activation time from user creation timestamp
 *
 * @param trigger - What action triggered activation
 * @param userCreatedAt - User signup timestamp
 *
 * @example
 * ```tsx
 * // After user submits first feedback
 * if (shouldTrackActivation()) {
 *   trackActivation('feedback_submitted', user.created_at)
 * }
 * ```
 */
export function trackActivation(
  trigger: ActivationTrigger,
  userCreatedAt: Date | string,
): void {
  if (!shouldTrackActivation()) {
    return;
  }

  // Calculate activation time
  const createdAtDate = typeof userCreatedAt === 'string'
    ? new Date(userCreatedAt)
    : userCreatedAt;
  const now = new Date();
  const activationTimeSeconds = Math.floor(
    (now.getTime() - createdAtDate.getTime()) / 1000,
  );

  // Track activation event
  trackUserActivated(trigger, activationTimeSeconds);

  // Mark as activated to prevent duplicate events
  if (isStorageAvailable()) {
    localStorage.setItem(ACTIVATION_STORAGE_KEY, 'true');
  }
}

/**
 * Reset activation state (for testing purposes)
 * DO NOT use in production code
 */
export function resetActivationState(): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return;
  }

  localStorage.removeItem(ACTIVATION_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
