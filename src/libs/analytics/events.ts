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
    | 'referred_signup'
  // Onboarding events
    | 'onboarding_started'
    | 'onboarding_step_completed'
    | 'onboarding_completed'
    | 'onboarding_skipped'
  // Feature events
    | 'feedback_submitted'
    | 'profile_updated'
    | 'feature_first_use'
    | 'user_activated'
    | 'platform_connected'
  // Error events
    | 'error_occurred'
  // Page events
    | 'page_viewed'
    | 'landing_viewed'
    | 'pseo_page_viewed';

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
 * Properties for landing_viewed event
 */
export type LandingViewedProperties = {
  page_url: string;
  locale: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref?: string;
};

/**
 * Properties for pseo_page_viewed event
 * Tracks programmatic SEO page views for growth analysis
 */
export type PseoPageViewedProperties = {
  /** pSEO category (e.g., 'tools', 'templates', 'guides') */
  category: string;
  /** Page slug identifier (e.g., 'password-generator') */
  slug: string;
  /** Traffic source from document.referrer */
  referrer?: string;
};

/**
 * Properties for user_activated event
 */
export type UserActivatedProperties = {
  activation_time_seconds: number;
  activation_trigger: string;
};

/**
 * Properties for referred_signup event
 */
export type ReferredSignupProperties = {
  referral_source: string;
  referrer_user_id?: string;
};

/**
 * Properties for platform_connected event
 * Tracks a successful third-party OAuth connection.
 */
export type PlatformConnectedProperties = {
  provider: string;
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
  referred_signup: ReferredSignupProperties;
  onboarding_started: Record<string, never>;
  onboarding_step_completed: OnboardingStepCompletedProperties;
  onboarding_completed: OnboardingCompletedProperties;
  onboarding_skipped: Record<string, never>;
  feedback_submitted: FeedbackSubmittedProperties;
  profile_updated: ProfileUpdatedProperties;
  feature_first_use: FeatureFirstUseProperties;
  user_activated: UserActivatedProperties;
  platform_connected: PlatformConnectedProperties;
  error_occurred: ErrorOccurredProperties;
  page_viewed: PageViewedProperties;
  landing_viewed: LandingViewedProperties;
  pseo_page_viewed: PseoPageViewedProperties;
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
  referred_signup: EventCategory.Auth,
  onboarding_started: EventCategory.Onboarding,
  onboarding_step_completed: EventCategory.Onboarding,
  onboarding_completed: EventCategory.Onboarding,
  onboarding_skipped: EventCategory.Onboarding,
  feedback_submitted: EventCategory.Feature,
  profile_updated: EventCategory.Feature,
  feature_first_use: EventCategory.Feature,
  user_activated: EventCategory.Feature,
  platform_connected: EventCategory.Feature,
  error_occurred: EventCategory.Error,
  page_viewed: EventCategory.Page,
  landing_viewed: EventCategory.Page,
  pseo_page_viewed: EventCategory.Page,
};
