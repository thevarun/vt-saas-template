/**
 * Analytics Event Types and Definitions
 * Type-safe event tracking system with discriminated unions
 */

/**
 * Event categories for organization
 */
export enum EventCategory {
  Auth = 'auth',
  Onboarding = 'onboarding',
  Feature = 'feature',
  Error = 'error',
  Page = 'page',
}

/**
 * All possible event names (string literal union)
 */
export type EventName
  // Auth events
  = | 'signup_started'
    | 'signup_completed'
    | 'login_completed'
    | 'logout_completed'
  // Onboarding events
    | 'onboarding_started'
    | 'onboarding_step_completed'
    | 'onboarding_completed'
    | 'onboarding_skipped'
  // Feature events
    | 'feedback_submitted'
    | 'profile_updated'
    | 'feature_first_use'
  // Error events
    | 'error_occurred'
  // Page events
    | 'page_viewed';

/**
 * Properties for signup_completed event
 */
export type SignupCompletedProperties = {
  method: 'email' | 'google' | 'github';
};

/**
 * Properties for login_completed event
 */
export type LoginCompletedProperties = {
  method: 'email' | 'google' | 'github';
};

/**
 * Properties for onboarding_step_completed event
 */
export type OnboardingStepCompletedProperties = {
  step_number: number;
  step_name: string;
};

/**
 * Properties for onboarding_completed event
 */
export type OnboardingCompletedProperties = {
  total_steps: number;
  duration_seconds: number;
};

/**
 * Properties for feedback_submitted event
 */
export type FeedbackSubmittedProperties = {
  feedback_type: 'bug' | 'feature' | 'general';
  has_screenshot: boolean;
};

/**
 * Properties for profile_updated event
 */
export type ProfileUpdatedProperties = {
  fields_updated: string[];
};

/**
 * Properties for feature_first_use event
 */
export type FeatureFirstUseProperties = {
  feature_name: string;
};

/**
 * Properties for error_occurred event
 */
export type ErrorOccurredProperties = {
  error_type: string;
  error_message: string;
  error_location?: string;
};

/**
 * Properties for page_viewed event
 */
export type PageViewedProperties = {
  page_url: string;
  page_title?: string;
  referrer?: string;
};

/**
 * Type mapping from event names to their property types
 * This enables type-safe event tracking with TypeScript generics
 */
export type EventPropertiesMap = {
  signup_started: Record<string, never>;
  signup_completed: SignupCompletedProperties;
  login_completed: LoginCompletedProperties;
  logout_completed: Record<string, never>;
  onboarding_started: Record<string, never>;
  onboarding_step_completed: OnboardingStepCompletedProperties;
  onboarding_completed: OnboardingCompletedProperties;
  onboarding_skipped: Record<string, never>;
  feedback_submitted: FeedbackSubmittedProperties;
  profile_updated: ProfileUpdatedProperties;
  feature_first_use: FeatureFirstUseProperties;
  error_occurred: ErrorOccurredProperties;
  page_viewed: PageViewedProperties;
};

/**
 * Event category mapping
 * Maps each event to its category for organization and filtering
 */
export const EVENT_CATEGORIES: Record<EventName, EventCategory> = {
  signup_started: EventCategory.Auth,
  signup_completed: EventCategory.Auth,
  login_completed: EventCategory.Auth,
  logout_completed: EventCategory.Auth,
  onboarding_started: EventCategory.Onboarding,
  onboarding_step_completed: EventCategory.Onboarding,
  onboarding_completed: EventCategory.Onboarding,
  onboarding_skipped: EventCategory.Onboarding,
  feedback_submitted: EventCategory.Feature,
  profile_updated: EventCategory.Feature,
  feature_first_use: EventCategory.Feature,
  error_occurred: EventCategory.Error,
  page_viewed: EventCategory.Page,
};
