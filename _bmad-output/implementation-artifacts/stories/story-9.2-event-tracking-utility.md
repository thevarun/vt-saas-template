# Story 9.2: Event Tracking Utility

Status: ready

## Story

As a developer implementing features,
I want a simple, type-safe way to track events,
so that I can instrument features without friction.

## Acceptance Criteria

### AC1: Type-Safe trackEvent Utility
**Given** the trackEvent utility
**When** I call it in my code
**Then** signature is `trackEvent(eventName, properties?)`
**And** eventName is typed (string literal union or enum)
**And** properties are typed per event

### AC2: Event Tracking with Auto-Context
**Given** tracking an event
**When** I call `trackEvent('signup_completed', { method: 'email' })`
**Then** event is sent to analytics provider
**And** user context is automatically attached
**And** timestamp is automatically added

### AC3: Event Type Definitions
**Given** the event types
**When** I review the type definitions
**Then** all standard events are defined
**And** properties for each event are typed
**And** TypeScript catches incorrect usage

### AC4: Event Categories and Naming
**Given** event categories
**When** I review the event schema
**Then** events are organized by category (auth, onboarding, feature)
**And** naming convention is consistent (snake_case)
**And** event names are descriptive and specific

### AC5: Enhanced Development Mode
**Given** development mode
**When** analytics provider is not configured
**Then** events are logged to console with full details
**And** console output shows: event name, properties, timestamp
**And** helps debugging without sending real events

### AC6: Server-Side Tracking
**Given** server-side tracking needs
**When** I need to track from API routes
**Then** server-side tracking utility exists
**And** uses PostHog server-side API
**And** includes user identification if available

## Tasks / Subtasks

- [ ] Task 1: Define event type system (AC: #1, #3, #4)
  - [ ] Subtask 1.1: Create `src/libs/analytics/events.ts` for event definitions
  - [ ] Subtask 1.2: Define EventCategory enum: Auth, Onboarding, Feature, Error
  - [ ] Subtask 1.3: Define EventName type as string literal union for all events
  - [ ] Subtask 1.4: Create type mapping for event properties per event name
  - [ ] Subtask 1.5: Define auth events: signup_started, signup_completed, login_completed, logout_completed
  - [ ] Subtask 1.6: Define onboarding events: onboarding_started, onboarding_step_completed, onboarding_completed, onboarding_skipped
  - [ ] Subtask 1.7: Define feature events: feedback_submitted, profile_updated, feature_first_use
  - [ ] Subtask 1.8: Define error events: error_occurred
  - [ ] Subtask 1.9: Define page view events: page_viewed
  - [ ] Subtask 1.10: Use snake_case naming convention for all events
  - [ ] Subtask 1.11: Export all event types and enums

- [ ] Task 2: Create typed event properties (AC: #1, #3)
  - [ ] Subtask 2.1: Define SignupCompletedProperties interface with method field
  - [ ] Subtask 2.2: Define LoginCompletedProperties interface with method field
  - [ ] Subtask 2.3: Define OnboardingStepCompletedProperties with step_number, step_name
  - [ ] Subtask 2.4: Define FeatureFirstUseProperties with feature_name
  - [ ] Subtask 2.5: Define ErrorOccurredProperties with error_type, error_message (sanitized)
  - [ ] Subtask 2.6: Define PageViewedProperties with page_url, page_title, referrer
  - [ ] Subtask 2.7: Create EventPropertiesMap type mapping event names to property types
  - [ ] Subtask 2.8: Ensure all properties use snake_case naming
  - [ ] Subtask 2.9: Add JSDoc comments for all property types
  - [ ] Subtask 2.10: Export all property types

- [ ] Task 3: Create type-safe trackEvent function (AC: #1, #2, #5)
  - [ ] Subtask 3.1: Update `src/libs/analytics/index.ts` with new trackEvent signature
  - [ ] Subtask 3.2: Use generic type parameter to enforce event-property matching
  - [ ] Subtask 3.3: Import EventName and EventPropertiesMap from events.ts
  - [ ] Subtask 3.4: Implement trackEvent<T extends EventName>(event: T, properties: EventPropertiesMap[T])
  - [ ] Subtask 3.5: Add automatic timestamp to all events
  - [ ] Subtask 3.6: Get user context from analytics provider if available
  - [ ] Subtask 3.7: Merge user context with event properties
  - [ ] Subtask 3.8: Call provider.track() with merged properties
  - [ ] Subtask 3.9: Add error handling for tracking failures
  - [ ] Subtask 3.10: Log tracking errors to console in development
  - [ ] Subtask 3.11: Add JSDoc with usage examples

- [ ] Task 4: Enhance console provider logging (AC: #5)
  - [ ] Subtask 4.1: Update `src/libs/analytics/providers/console.ts`
  - [ ] Subtask 4.2: Format console output with color-coded emoji prefixes
  - [ ] Subtask 4.3: Show event name prominently in console output
  - [ ] Subtask 4.4: Display properties in a formatted table
  - [ ] Subtask 4.5: Show timestamp in human-readable format
  - [ ] Subtask 4.6: Include event category in console output
  - [ ] Subtask 4.7: Use console.group for better organization
  - [ ] Subtask 4.8: Add collapsible event details
  - [ ] Subtask 4.9: Show event count/sequence number
  - [ ] Subtask 4.10: Differentiate between event types with visual cues

- [ ] Task 5: Create server-side tracking utility (AC: #6)
  - [ ] Subtask 5.1: Install posthog-node package (`npm install posthog-node`)
  - [ ] Subtask 5.2: Create `src/libs/analytics/server.ts` for server-side tracking
  - [ ] Subtask 5.3: Import PostHog from posthog-node
  - [ ] Subtask 5.4: Create getServerAnalytics() singleton function
  - [ ] Subtask 5.5: Initialize PostHog with server-side API key
  - [ ] Subtask 5.6: Use NEXT_PUBLIC_POSTHOG_KEY for backward compatibility
  - [ ] Subtask 5.7: Create trackEventServer() function
  - [ ] Subtask 5.8: Add userId parameter for user identification
  - [ ] Subtask 5.9: Use same EventName and EventPropertiesMap types
  - [ ] Subtask 5.10: Add automatic timestamp to server events
  - [ ] Subtask 5.11: Include server-side context (e.g., user_agent from headers)
  - [ ] Subtask 5.12: Handle missing API key gracefully (console log in dev)
  - [ ] Subtask 5.13: Export trackEventServer function
  - [ ] Subtask 5.14: Add JSDoc with usage examples

- [ ] Task 6: Add event validation (AC: #1, #3)
  - [ ] Subtask 6.1: Create validation helper in `src/libs/analytics/validation.ts`
  - [ ] Subtask 6.2: Validate event name is a known EventName
  - [ ] Subtask 6.3: Validate required properties are present
  - [ ] Subtask 6.4: Validate property types match expected types
  - [ ] Subtask 6.5: Sanitize error messages before tracking
  - [ ] Subtask 6.6: Remove PII from tracked data
  - [ ] Subtask 6.7: Truncate long string values
  - [ ] Subtask 6.8: Log validation errors in development
  - [ ] Subtask 6.9: Allow tracking to continue even with validation errors
  - [ ] Subtask 6.10: Export validation utilities

- [ ] Task 7: Create event helper functions (AC: #1, #2)
  - [ ] Subtask 7.1: Create `src/libs/analytics/helpers.ts`
  - [ ] Subtask 7.2: Export trackSignupCompleted(method) helper
  - [ ] Subtask 7.3: Export trackLoginCompleted(method) helper
  - [ ] Subtask 7.4: Export trackOnboardingStepCompleted(stepNumber, stepName) helper
  - [ ] Subtask 7.5: Export trackOnboardingCompleted() helper
  - [ ] Subtask 7.6: Export trackFeatureFirstUse(featureName) helper
  - [ ] Subtask 7.7: Export trackError(errorType, errorMessage) helper
  - [ ] Subtask 7.8: Each helper calls trackEvent with correct types
  - [ ] Subtask 7.9: Add JSDoc comments with examples
  - [ ] Subtask 7.10: Re-export from main index.ts

- [ ] Task 8: Update analytics types (AC: #1, #3)
  - [ ] Subtask 8.1: Update `src/libs/analytics/types.ts`
  - [ ] Subtask 8.2: Import EventName and EventPropertiesMap
  - [ ] Subtask 8.3: Update AnalyticsProvider.track() signature to use EventName
  - [ ] Subtask 8.4: Add generic type parameter to track method
  - [ ] Subtask 8.5: Ensure backward compatibility with existing code
  - [ ] Subtask 8.6: Add EventContext type for auto-attached context
  - [ ] Subtask 8.7: Add EventMetadata type for timestamps, user info
  - [ ] Subtask 8.8: Export new types
  - [ ] Subtask 8.9: Update JSDoc comments

- [ ] Task 9: Update PostHog provider (AC: #2)
  - [ ] Subtask 9.1: Update `src/libs/analytics/providers/posthog.ts`
  - [ ] Subtask 9.2: Update track() method signature to use EventName
  - [ ] Subtask 9.3: Add generic type parameter to track method
  - [ ] Subtask 9.4: Merge automatic context with provided properties
  - [ ] Subtask 9.5: Ensure timestamp is included
  - [ ] Subtask 9.6: Pass merged properties to posthog.capture()
  - [ ] Subtask 9.7: Handle tracking errors gracefully
  - [ ] Subtask 9.8: Log errors in development mode

- [ ] Task 10: Create event constants (AC: #4)
  - [ ] Subtask 10.1: Create `src/libs/analytics/constants.ts`
  - [ ] Subtask 10.2: Export AUTH_EVENTS constant array
  - [ ] Subtask 10.3: Export ONBOARDING_EVENTS constant array
  - [ ] Subtask 10.4: Export FEATURE_EVENTS constant array
  - [ ] Subtask 10.5: Export ERROR_EVENTS constant array
  - [ ] Subtask 10.6: Export ALL_EVENTS constant array (union of all)
  - [ ] Subtask 10.7: Export event category map (event -> category)
  - [ ] Subtask 10.8: Add JSDoc comments explaining usage

- [ ] Task 11: Write event tracking tests (AC: #1, #2, #3)
  - [ ] Subtask 11.1: Create `src/libs/analytics/__tests__/events.test.ts`
  - [ ] Subtask 11.2: Test trackEvent() with valid event and properties
  - [ ] Subtask 11.3: Test trackEvent() adds automatic timestamp
  - [ ] Subtask 11.4: Test trackEvent() merges user context
  - [ ] Subtask 11.5: Test TypeScript catches invalid event names (type-level test)
  - [ ] Subtask 11.6: Test TypeScript catches invalid properties (type-level test)
  - [ ] Subtask 11.7: Test event helpers call trackEvent correctly
  - [ ] Subtask 11.8: Mock analytics provider for tests
  - [ ] Subtask 11.9: Verify correct properties are passed to provider

- [ ] Task 12: Write server-side tracking tests (AC: #6)
  - [ ] Subtask 12.1: Create `src/libs/analytics/__tests__/server.test.ts`
  - [ ] Subtask 12.2: Test trackEventServer() sends events
  - [ ] Subtask 12.3: Test trackEventServer() includes user ID
  - [ ] Subtask 12.4: Test trackEventServer() adds timestamp
  - [ ] Subtask 12.5: Test trackEventServer() handles missing API key
  - [ ] Subtask 12.6: Test server-side context is attached
  - [ ] Subtask 12.7: Mock posthog-node for tests
  - [ ] Subtask 12.8: Verify events are sent to PostHog API

- [ ] Task 13: Write validation tests (AC: #3)
  - [ ] Subtask 13.1: Create `src/libs/analytics/__tests__/validation.test.ts`
  - [ ] Subtask 13.2: Test event name validation
  - [ ] Subtask 13.3: Test required property validation
  - [ ] Subtask 13.4: Test property type validation
  - [ ] Subtask 13.5: Test error message sanitization
  - [ ] Subtask 13.6: Test PII removal from tracked data
  - [ ] Subtask 13.7: Test string value truncation
  - [ ] Subtask 13.8: Test validation errors don't prevent tracking

- [ ] Task 14: Update console provider tests (AC: #5)
  - [ ] Subtask 14.1: Update `src/libs/analytics/providers/__tests__/console.test.ts`
  - [ ] Subtask 14.2: Test enhanced console output format
  - [ ] Subtask 14.3: Test event name is displayed prominently
  - [ ] Subtask 14.4: Test properties are formatted as table
  - [ ] Subtask 14.5: Test timestamp is shown
  - [ ] Subtask 14.6: Test console.group is used
  - [ ] Subtask 14.7: Mock console methods

- [ ] Task 15: Create event tracking documentation (AC: #4)
  - [ ] Subtask 15.1: Create `docs/analytics-events.md`
  - [ ] Subtask 15.2: Document all event categories
  - [ ] Subtask 15.3: List all events with descriptions
  - [ ] Subtask 15.4: Show example usage for each event
  - [ ] Subtask 15.5: Document event naming conventions
  - [ ] Subtask 15.6: Explain event properties
  - [ ] Subtask 15.7: Document how to add new events
  - [ ] Subtask 15.8: Include TypeScript examples
  - [ ] Subtask 15.9: Document server-side tracking
  - [ ] Subtask 15.10: Add event validation guidelines

- [ ] Task 16: Update main analytics documentation (AC: #1, #6)
  - [ ] Subtask 16.1: Update `docs/analytics-setup.md`
  - [ ] Subtask 16.2: Add section on event tracking utility
  - [ ] Subtask 16.3: Document trackEvent() usage
  - [ ] Subtask 16.4: Document event helpers
  - [ ] Subtask 16.5: Document server-side tracking setup
  - [ ] Subtask 16.6: Add code examples
  - [ ] Subtask 16.7: Link to analytics-events.md

## Dev Notes

### Critical Architecture Requirements

**IMPORTANT CONTEXT: Building on Story 9.1**
- Story 9.1 created the analytics provider abstraction at `src/libs/analytics/`
- This story adds type-safe event tracking on top of that foundation
- Story 9.3 will use these utilities to instrument core user flows
- All subsequent stories (9.4-9.6) depend on this event tracking system

**Type-Safe Event System:**

The event tracking system uses TypeScript's type system to ensure type safety:

```typescript
// src/libs/analytics/events.ts

export enum EventCategory {
  Auth = 'auth',
  Onboarding = 'onboarding',
  Feature = 'feature',
  Error = 'error',
  Page = 'page',
}

// Event names as string literal union
export type EventName =
  // Auth events
  | 'signup_started'
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

// Event properties per event
export interface SignupCompletedProperties {
  method: 'email' | 'google' | 'github';
}

export interface LoginCompletedProperties {
  method: 'email' | 'google' | 'github';
}

export interface OnboardingStepCompletedProperties {
  step_number: number;
  step_name: string;
}

export interface OnboardingCompletedProperties {
  total_steps: number;
  duration_seconds: number;
}

export interface FeatureFirstUseProperties {
  feature_name: string;
}

export interface FeedbackSubmittedProperties {
  feedback_type: 'bug' | 'feature' | 'general';
  has_screenshot: boolean;
}

export interface ProfileUpdatedProperties {
  fields_updated: string[];
}

export interface ErrorOccurredProperties {
  error_type: string;
  error_message: string; // Sanitized, no stack traces
  error_location?: string;
}

export interface PageViewedProperties {
  page_url: string;
  page_title?: string;
  referrer?: string;
}

// Map event names to their property types
export type EventPropertiesMap = {
  signup_started: Record<string, never>; // No properties
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

// Event category mapping
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
```

**Type-Safe trackEvent Function:**

```typescript
// src/libs/analytics/index.ts (updated from 9.1)

import { getAnalyticsProvider } from './client';
import type { EventName, EventPropertiesMap } from './events';
import type { UserProperties } from './types';

/**
 * Track a type-safe analytics event
 * @param eventName - Name of the event (type-checked)
 * @param properties - Event properties (typed per event)
 *
 * @example
 * trackEvent('signup_completed', { method: 'email' });
 * trackEvent('onboarding_step_completed', { step_number: 1, step_name: 'username' });
 */
export function trackEvent<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T]
): void {
  const provider = getAnalyticsProvider();

  // Add automatic context
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    // User context is automatically attached by the provider
  };

  try {
    provider.track(eventName, enrichedProperties);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Failed to track event:', eventName, error);
    }
    // Don't throw - analytics should never break the app
  }
}

// Keep existing functions from 9.1
export { initAnalytics, identifyUser, resetUser } from './client';
export type { EventProperties, UserProperties } from './types';
export type { EventName, EventPropertiesMap } from './events';
```

**Event Helper Functions:**

```typescript
// src/libs/analytics/helpers.ts

import { trackEvent } from './index';
import type { EventPropertiesMap } from './events';

/**
 * Track signup completion
 * @param method - Authentication method used
 */
export function trackSignupCompleted(
  method: EventPropertiesMap['signup_completed']['method']
): void {
  trackEvent('signup_completed', { method });
}

/**
 * Track login completion
 * @param method - Authentication method used
 */
export function trackLoginCompleted(
  method: EventPropertiesMap['login_completed']['method']
): void {
  trackEvent('login_completed', { method });
}

/**
 * Track onboarding step completion
 * @param stepNumber - Step number (1-indexed)
 * @param stepName - Name of the step
 */
export function trackOnboardingStepCompleted(
  stepNumber: number,
  stepName: string
): void {
  trackEvent('onboarding_step_completed', {
    step_number: stepNumber,
    step_name: stepName,
  });
}

/**
 * Track onboarding completion
 * @param totalSteps - Total number of steps
 * @param durationSeconds - Time taken in seconds
 */
export function trackOnboardingCompleted(
  totalSteps: number,
  durationSeconds: number
): void {
  trackEvent('onboarding_completed', {
    total_steps: totalSteps,
    duration_seconds: durationSeconds,
  });
}

/**
 * Track first use of a feature
 * @param featureName - Name of the feature
 */
export function trackFeatureFirstUse(featureName: string): void {
  trackEvent('feature_first_use', { feature_name: featureName });
}

/**
 * Track error occurrence
 * @param errorType - Type/category of error
 * @param errorMessage - Sanitized error message (no stack traces)
 * @param errorLocation - Optional location where error occurred
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  errorLocation?: string
): void {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: sanitizeErrorMessage(errorMessage),
    error_location: errorLocation,
  });
}

/**
 * Sanitize error message to remove sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  // Remove stack traces
  const withoutStack = message.split('\n')[0];

  // Truncate to 200 characters
  const truncated = withoutStack.slice(0, 200);

  // Remove potential file paths
  return truncated.replace(/\/[^\s]+/g, '[path]');
}
```

**Enhanced Console Provider:**

```typescript
// src/libs/analytics/providers/console.ts (updated from 9.1)

import type { AnalyticsProvider, AnalyticsConfig, EventProperties, UserProperties } from '../types';
import { EVENT_CATEGORIES, type EventName } from '../events';

export class ConsoleProvider implements AnalyticsProvider {
  private eventCount = 0;

  init(config: AnalyticsConfig): void {
    console.log(
      '%c[Analytics] Console mode enabled (no API key configured)',
      'color: #FFA500; font-weight: bold'
    );
  }

  identify(userId: string, properties?: UserProperties): void {
    console.group('%c👤 [Analytics] Identify User', 'color: #00A6FF; font-weight: bold');
    console.log('User ID:', userId);
    console.table(properties);
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
    };
    const color = colors[category] || '#888888';

    console.group(
      `%c📊 [Analytics] Event #${this.eventCount}: ${eventName}`,
      `color: ${color}; font-weight: bold`
    );
    console.log('Category:', category);
    console.log('Timestamp:', new Date().toISOString());

    if (properties && Object.keys(properties).length > 0) {
      console.log('Properties:');
      console.table(properties);
    }

    console.groupEnd();
  }

  reset(): void {
    console.log(
      '%c🔄 [Analytics] User reset',
      'color: #FFA500; font-weight: bold'
    );
    this.eventCount = 0;
  }
}
```

**Server-Side Tracking:**

```typescript
// src/libs/analytics/server.ts

import { PostHog } from 'posthog-node';
import type { EventName, EventPropertiesMap } from './events';

let posthogInstance: PostHog | null = null;

/**
 * Get PostHog server-side instance (singleton)
 */
function getServerAnalytics(): PostHog | null {
  if (posthogInstance) {
    return posthogInstance;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('[Analytics] Server-side tracking disabled: no API key');
    return null;
  }

  posthogInstance = new PostHog(apiKey, {
    host: apiHost,
  });

  return posthogInstance;
}

/**
 * Track event from server-side (API routes, server components)
 * @param eventName - Name of the event
 * @param properties - Event properties
 * @param userId - User ID for identification
 *
 * @example
 * await trackEventServer('signup_completed', { method: 'email' }, user.id);
 */
export async function trackEventServer<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T],
  userId?: string
): Promise<void> {
  const client = getServerAnalytics();

  if (!client) {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[Analytics Server]',
        eventName,
        properties,
        userId ? `(User: ${userId})` : '(No user)'
      );
    }
    return;
  }

  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    source: 'server',
  };

  try {
    if (userId) {
      client.capture({
        distinctId: userId,
        event: eventName,
        properties: enrichedProperties,
      });
    } else {
      // Track without user ID (anonymous)
      client.capture({
        distinctId: 'anonymous',
        event: eventName,
        properties: enrichedProperties,
      });
    }

    // Important: Flush events in serverless environments
    await client.flush();
  } catch (error) {
    console.error('[Analytics Server] Failed to track event:', eventName, error);
  }
}

/**
 * Shutdown PostHog client (call on server shutdown)
 */
export async function shutdownServerAnalytics(): Promise<void> {
  if (posthogInstance) {
    await posthogInstance.shutdown();
    posthogInstance = null;
  }
}
```

**Event Validation:**

```typescript
// src/libs/analytics/validation.ts

import type { EventName, EventPropertiesMap } from './events';

/**
 * Sanitize error message to remove sensitive data
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove stack traces
  const withoutStack = message.split('\n')[0];

  // Truncate to 200 characters
  const truncated = withoutStack.slice(0, 200);

  // Remove potential file paths and email addresses
  let sanitized = truncated.replace(/\/[^\s]+/g, '[path]');
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+/g, '[email]');

  return sanitized;
}

/**
 * Truncate string value if too long
 */
export function truncateString(value: string, maxLength = 500): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength) + '...';
}

/**
 * Remove potentially sensitive data from properties
 */
export function sanitizeProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip sensitive fields
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('key')
    ) {
      sanitized[key] = '[redacted]';
      continue;
    }

    // Truncate long strings
    if (typeof value === 'string') {
      sanitized[key] = truncateString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate event properties (non-blocking)
 */
export function validateEventProperties<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T]
): boolean {
  // Basic validation - just check properties exist
  if (!properties || typeof properties !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Analytics] Invalid properties for event ${eventName}:`, properties);
    }
    return false;
  }

  return true;
}
```

**Usage Examples:**

```typescript
// In a signup component
import { trackEvent } from '@/libs/analytics';

async function handleSignup(email: string, password: string) {
  try {
    const user = await signupUser(email, password);

    // Type-safe event tracking
    trackEvent('signup_completed', { method: 'email' });

    router.push('/onboarding');
  } catch (error) {
    // Track error
    trackError('signup_error', error.message);
  }
}

// In an onboarding component
import { trackOnboardingStepCompleted } from '@/libs/analytics/helpers';

function handleStepComplete() {
  trackOnboardingStepCompleted(currentStep, stepName);
  setCurrentStep(currentStep + 1);
}

// In an API route
import { trackEventServer } from '@/libs/analytics/server';

export async function POST(request: Request) {
  const user = await getCurrentUser();

  // Server-side tracking
  await trackEventServer('profile_updated', {
    fields_updated: ['name', 'avatar'],
  }, user.id);

  return Response.json({ success: true });
}
```

### Implementation Strategy

**Phase 1: Type System**

1. Create event types and enums
2. Define event properties interfaces
3. Create EventPropertiesMap
4. Add event category mapping
5. Export all types

**Phase 2: Tracking Functions**

1. Update trackEvent with generic type parameter
2. Add automatic timestamp and context
3. Create event helper functions
4. Implement validation utilities
5. Add error handling

**Phase 3: Server-Side Tracking**

1. Install posthog-node
2. Create server.ts module
3. Implement trackEventServer function
4. Add user identification support
5. Handle serverless flush

**Phase 4: Enhanced Logging**

1. Update console provider
2. Add color-coded output
3. Implement event counters
4. Format properties as tables
5. Add category indicators

**Phase 5: Documentation and Testing**

1. Write comprehensive tests
2. Document all events
3. Create usage guide
4. Add validation tests
5. Test server-side tracking

### Testing Strategy

**Type Tests:**

```typescript
// src/libs/analytics/__tests__/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import { trackEvent } from '../index';

describe('Event tracking types', () => {
  it('enforces correct event properties', () => {
    // Should compile
    trackEvent('signup_completed', { method: 'email' });

    // Should not compile (TypeScript error)
    // @ts-expect-error - invalid method
    trackEvent('signup_completed', { method: 'invalid' });

    // @ts-expect-error - missing required property
    trackEvent('onboarding_step_completed', { step_number: 1 });
  });
});
```

**Unit Tests:**

```typescript
// src/libs/analytics/__tests__/tracking.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent } from '../index';
import { getAnalyticsProvider } from '../client';

vi.mock('../client');

describe('trackEvent', () => {
  const mockProvider = {
    track: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnalyticsProvider).mockReturnValue(mockProvider as any);
  });

  it('calls provider.track with event and properties', () => {
    trackEvent('signup_completed', { method: 'email' });

    expect(mockProvider.track).toHaveBeenCalledWith(
      'signup_completed',
      expect.objectContaining({
        method: 'email',
        timestamp: expect.any(String),
      })
    );
  });

  it('adds automatic timestamp', () => {
    const beforeTime = new Date().toISOString();
    trackEvent('signup_completed', { method: 'email' });
    const afterTime = new Date().toISOString();

    const call = mockProvider.track.mock.calls[0];
    const timestamp = call[1].timestamp;

    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });

  it('handles tracking errors gracefully', () => {
    mockProvider.track.mockImplementation(() => {
      throw new Error('Network error');
    });

    // Should not throw
    expect(() => {
      trackEvent('signup_completed', { method: 'email' });
    }).not.toThrow();
  });
});
```

**Server Tests:**

```typescript
// src/libs/analytics/__tests__/server.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostHog } from 'posthog-node';
import { trackEventServer } from '../server';

vi.mock('posthog-node');

describe('trackEventServer', () => {
  const mockCapture = vi.fn();
  const mockFlush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PostHog).mockImplementation(() => ({
      capture: mockCapture,
      flush: mockFlush,
    } as any));
  });

  it('tracks events with user ID', async () => {
    await trackEventServer('signup_completed', { method: 'email' }, 'user-123');

    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: 'user-123',
      event: 'signup_completed',
      properties: expect.objectContaining({
        method: 'email',
        timestamp: expect.any(String),
        source: 'server',
      }),
    });
  });

  it('flushes events after tracking', async () => {
    await trackEventServer('signup_completed', { method: 'email' }, 'user-123');

    expect(mockFlush).toHaveBeenCalled();
  });

  it('handles missing API key gracefully', async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    await expect(
      trackEventServer('signup_completed', { method: 'email' })
    ).resolves.not.toThrow();
  });
});
```

### Project Structure Notes

**New Files:**
```
src/
  libs/analytics/
    events.ts                     # Event types, names, and properties
    helpers.ts                    # Event helper functions
    validation.ts                 # Event validation and sanitization
    server.ts                     # Server-side tracking utility
    constants.ts                  # Event constants and mappings
    __tests__/
      events.test.ts              # Event type tests
      tracking.test.ts            # trackEvent tests
      helpers.test.ts             # Helper function tests
      validation.test.ts          # Validation tests
      server.test.ts              # Server tracking tests
      types.test.ts               # TypeScript type tests
docs/
  analytics-events.md             # Event catalog and usage guide
```

**Updated Files:**
```
src/
  libs/analytics/
    index.ts                      # Updated with type-safe trackEvent
    types.ts                      # Updated with EventName support
    providers/
      console.ts                  # Enhanced console logging
      posthog.ts                  # Updated track method signature
      __tests__/
        console.test.ts           # Updated tests for new format
docs/
  analytics-setup.md              # Updated with event tracking docs
package.json                      # Add posthog-node dependency
```

**Dependencies:**
- posthog-node (new install via npm)
- posthog-js (already installed in 9.1)
- TypeScript 5.x (for advanced type features)

### Event Naming Conventions

**Naming Rules:**

1. Use snake_case for all event names
2. Use past tense for completed actions: `signup_completed`, not `signup_complete`
3. Be specific: `onboarding_step_completed`, not `step_done`
4. Include entity: `feedback_submitted`, not `submitted`
5. Use consistent verbs: started, completed, skipped, viewed

**Property Naming Rules:**

1. Use snake_case for all property names
2. Be descriptive: `step_number`, not `num`
3. Use consistent units: `duration_seconds`, not `duration`
4. Boolean properties: `has_screenshot`, not `screenshot`
5. Enums for fixed values: `method: 'email' | 'google' | 'github'`

### Privacy and Security Considerations

**Data Sanitization:**

1. Never track passwords, tokens, or secrets
2. Sanitize error messages (remove stack traces, file paths)
3. Truncate long strings to prevent data bloat
4. Remove PII before tracking (use validation.ts)

**Error Tracking:**

1. Only track sanitized error messages
2. Include error type and location
3. Never include full stack traces
4. Use error categories, not raw exceptions

**Server-Side Tracking:**

1. Always flush events in serverless (await flush())
2. Handle missing API key gracefully
3. Don't block API responses waiting for analytics
4. Use try-catch to prevent tracking failures from breaking APIs

### Performance Considerations

**Client-Side:**

1. trackEvent is synchronous but non-blocking
2. Errors don't propagate to caller
3. Console provider has minimal overhead
4. PostHog batches events automatically

**Server-Side:**

1. Always await flush() in serverless environments
2. Consider fire-and-forget for non-critical events
3. Use async/await for proper error handling
4. Don't block user-facing responses

**Bundle Size:**

1. posthog-node is server-side only (no client bundle impact)
2. Event types are compile-time only (zero runtime cost)
3. Helper functions are tree-shakeable

### References

- [Source: Epic 9] - Full epic context and requirements
- [Source: Epic 9 Story 9.2] - Full acceptance criteria
- [Source: Story 9.1] - Analytics infrastructure foundation
- [PostHog Events Documentation] - https://posthog.com/docs/product-analytics/capture-events
- [PostHog Node.js SDK] - https://posthog.com/docs/libraries/node
- [TypeScript Generics] - Type-safe event tracking pattern
- [Source: CLAUDE.md] - Project patterns and conventions

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Desk Check

**Status:** pending
**Date:**
**Full Report:**

### Verification Summary
