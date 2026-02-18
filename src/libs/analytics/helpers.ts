/**
 * Analytics Event Helper Functions
 * Convenient wrappers for common events
 */

import type { EventPropertiesMap } from './events';
import { trackEvent } from './index';
import { sanitizeErrorMessage } from './validation';

/**
 * Track signup completion
 *
 * @param method - Authentication method used
 *
 * @example
 * ```tsx
 * trackSignupCompleted('email')
 * trackSignupCompleted('google')
 * ```
 */
export function trackSignupCompleted(
  method: EventPropertiesMap['signup_completed']['method'],
): void {
  trackEvent('signup_completed', { method });
}

/**
 * Track login completion
 *
 * @param method - Authentication method used
 *
 * @example
 * ```tsx
 * trackLoginCompleted('email')
 * trackLoginCompleted('github')
 * ```
 */
export function trackLoginCompleted(
  method: EventPropertiesMap['login_completed']['method'],
): void {
  trackEvent('login_completed', { method });
}

/**
 * Track onboarding step completion
 *
 * @param stepNumber - Step number (1-indexed)
 * @param stepName - Name of the step
 *
 * @example
 * ```tsx
 * trackOnboardingStepCompleted(1, 'username')
 * trackOnboardingStepCompleted(2, 'preferences')
 * ```
 */
export function trackOnboardingStepCompleted(
  stepNumber: number,
  stepName: string,
): void {
  trackEvent('onboarding_step_completed', {
    step_number: stepNumber,
    step_name: stepName,
  });
}

/**
 * Track onboarding completion
 *
 * @param totalSteps - Total number of steps completed
 * @param durationSeconds - Time taken to complete onboarding
 *
 * @example
 * ```tsx
 * trackOnboardingCompleted(3, 120)
 * ```
 */
export function trackOnboardingCompleted(
  totalSteps: number,
  durationSeconds: number,
): void {
  trackEvent('onboarding_completed', {
    total_steps: totalSteps,
    duration_seconds: durationSeconds,
  });
}

/**
 * Track first use of a feature
 *
 * @param featureName - Name of the feature
 *
 * @example
 * ```tsx
 * trackFeatureFirstUse('feedback')
 * trackFeatureFirstUse('chat')
 * ```
 */
export function trackFeatureFirstUse(featureName: string): void {
  trackEvent('feature_first_use', { feature_name: featureName });
}

/**
 * Track error occurrence
 * Automatically sanitizes error message to remove sensitive data
 *
 * @param errorType - Type/category of error
 * @param errorMessage - Error message (will be sanitized)
 * @param errorLocation - Optional location where error occurred
 *
 * @example
 * ```tsx
 * trackError('api_error', 'Failed to fetch user data')
 * trackError('validation_error', error.message, 'signup_form')
 * ```
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  errorLocation?: string,
): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: sanitizeErrorMessage(errorMessage),
    error_location: errorLocation,
  });
}

/**
 * Track feedback submission
 *
 * @param feedbackType - Type of feedback
 * @param hasScreenshot - Whether screenshot was included
 *
 * @example
 * ```tsx
 * trackFeedbackSubmitted('bug', true)
 * trackFeedbackSubmitted('feature', false)
 * ```
 */
export function trackFeedbackSubmitted(
  feedbackType: EventPropertiesMap['feedback_submitted']['feedback_type'],
  hasScreenshot: boolean,
): void {
  trackEvent('feedback_submitted', {
    feedback_type: feedbackType,
    has_screenshot: hasScreenshot,
  });
}

/**
 * Track profile update
 *
 * @param fieldsUpdated - Array of field names that were updated
 *
 * @example
 * ```tsx
 * trackProfileUpdated(['name', 'avatar'])
 * ```
 */
export function trackProfileUpdated(fieldsUpdated: string[]): void {
  trackEvent('profile_updated', {
    fields_updated: fieldsUpdated,
  });
}

/**
 * Track landing page view
 *
 * @param properties - Landing view properties
 *
 * @example
 * ```tsx
 * trackLandingViewed({
 *   page_url: window.location.href,
 *   locale: 'en',
 *   referrer: document.referrer,
 *   utm_source: 'google',
 *   utm_medium: 'cpc'
 * })
 * ```
 */
export function trackLandingViewed(
  properties: EventPropertiesMap['landing_viewed'],
): void {
  trackEvent('landing_viewed', properties);
}

/**
 * Track user activation
 *
 * @param activationTrigger - What action triggered activation
 * @param activationTimeSeconds - Time from signup to activation (in seconds)
 *
 * @example
 * ```tsx
 * trackUserActivated('feedback_submitted', 120)
 * trackUserActivated('onboarding_completed', 60)
 * ```
 */
export function trackUserActivated(
  activationTrigger: string,
  activationTimeSeconds: number,
): void {
  trackEvent('user_activated', {
    activation_trigger: activationTrigger,
    activation_time_seconds: activationTimeSeconds,
  });
}

/**
 * Track referred signup
 *
 * @param referralSource - Referral source identifier
 * @param referrerUserId - Optional ID of referring user
 *
 * @example
 * ```tsx
 * trackReferredSignup('friend123')
 * trackReferredSignup('utm_social', 'user-456')
 * ```
 */
export function trackReferredSignup(
  referralSource: string,
  referrerUserId?: string,
): void {
  trackEvent('referred_signup', {
    referral_source: referralSource,
    referrer_user_id: referrerUserId,
  });
}
