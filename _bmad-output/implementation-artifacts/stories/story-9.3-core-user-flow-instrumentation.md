# Story 9.3: Core User Flow Instrumentation

Status: completed

## Story

As a product owner,
I want key user actions automatically tracked,
so that I understand how users interact with the product.

## Acceptance Criteria

### AC1: Signup Flow Tracking
**Given** user signup
**When** registration is completed
**Then** `signup_completed` event is tracked
**And** properties include: method (email/google/github)
**And** user is identified in analytics

### AC2: Login Flow Tracking
**Given** user login
**When** login is successful
**Then** `login_completed` event is tracked
**And** properties include: method (email/google/github)
**And** session context is updated

### AC3: Onboarding Flow Tracking
**Given** onboarding flow
**When** user progresses through steps
**Then** `onboarding_step_completed` is tracked for each step
**And** properties include: step_number, step_name
**And** `onboarding_completed` is tracked on finish
**And** `onboarding_skipped` is tracked if skipped

### AC4: Feature Usage Tracking
**Given** core feature usage
**When** user uses key features
**Then** relevant events are tracked
**And** examples: feedback_submitted, profile_updated
**And** events include contextual properties

### AC5: Page View Tracking
**Given** page views
**When** user navigates between pages
**Then** page views are tracked automatically
**And** PostHog autocapture handles this
**And** custom page view events optional

### AC6: Error Tracking
**Given** error occurrences
**When** significant errors happen
**Then** error events are tracked
**And** properties include: error_type, error_message (sanitized)
**And** sensitive data is NOT included

## Tasks / Subtasks

- [ ] Task 1: Instrument Authentication Flows (AC: #1, #2)
  - [ ] Subtask 1.1: Identify auth callback route at `src/app/[locale]/(unauth)/auth/callback/route.ts`
  - [ ] Subtask 1.2: Add trackEvent import from `@/libs/analytics`
  - [ ] Subtask 1.3: Detect signup vs login using database check or session metadata
  - [ ] Subtask 1.4: Determine auth method (email/google/github) from provider metadata
  - [ ] Subtask 1.5: Track `signup_completed` event after successful signup with method
  - [ ] Subtask 1.6: Track `login_completed` event after successful login with method
  - [ ] Subtask 1.7: Call identifyUser() with user ID after both signup and login
  - [ ] Subtask 1.8: Handle errors gracefully (don't break auth flow if tracking fails)
  - [ ] Subtask 1.9: Add JSDoc comments explaining tracking logic
  - [ ] Subtask 1.10: Test signup and login flows verify events are tracked

- [ ] Task 2: Instrument Onboarding Flow (AC: #3)
  - [ ] Subtask 2.1: Locate onboarding step components in `src/app/[locale]/(auth)/onboarding/`
  - [ ] Subtask 2.2: Import trackOnboardingStepCompleted from `@/libs/analytics/helpers`
  - [ ] Subtask 2.3: Add tracking to Step 1 completion (username step)
  - [ ] Subtask 2.4: Add tracking to Step 2 completion (feature tour)
  - [ ] Subtask 2.5: Add tracking to Step 3 completion (preferences)
  - [ ] Subtask 2.6: Include step_number (1, 2, 3) and step_name in properties
  - [ ] Subtask 2.7: Track `onboarding_completed` on final step with total_steps and duration_seconds
  - [ ] Subtask 2.8: Track `onboarding_skipped` if user skips onboarding
  - [ ] Subtask 2.9: Calculate duration from onboarding start timestamp (use localStorage or state)
  - [ ] Subtask 2.10: Test all onboarding paths verify tracking works

- [ ] Task 3: Instrument Feedback Feature (AC: #4)
  - [ ] Subtask 3.1: Locate feedback widget component(s) in `src/components/`
  - [ ] Subtask 3.2: Find feedback submission handler (likely in widget or API route)
  - [ ] Subtask 3.3: Import trackEvent from `@/libs/analytics`
  - [ ] Subtask 3.4: Track `feedback_submitted` event after successful submission
  - [ ] Subtask 3.5: Include properties: feedback_type (bug/feature/general), has_screenshot (boolean)
  - [ ] Subtask 3.6: Use server-side tracking if submission happens in API route
  - [ ] Subtask 3.7: Import trackEventServer from `@/libs/analytics/server` if needed
  - [ ] Subtask 3.8: Test feedback submission verify event is tracked
  - [ ] Subtask 3.9: Verify screenshot attachment status is correctly tracked

- [ ] Task 4: Instrument Profile Updates (AC: #4)
  - [ ] Subtask 4.1: Locate profile page at `src/app/[locale]/(auth)/dashboard/profile/`
  - [ ] Subtask 4.2: Find profile update form submission handler
  - [ ] Subtask 4.3: Import trackEvent from `@/libs/analytics`
  - [ ] Subtask 4.4: Track `profile_updated` event after successful update
  - [ ] Subtask 4.5: Calculate fields_updated array from form changes
  - [ ] Subtask 4.6: Include properties: fields_updated (array of field names)
  - [ ] Subtask 4.7: Use server-side tracking if update happens in API route
  - [ ] Subtask 4.8: Test profile updates verify tracking works
  - [ ] Subtask 4.9: Verify fields_updated array is accurate

- [ ] Task 5: Instrument Error Boundaries (AC: #6)
  - [ ] Subtask 5.1: Locate error boundary components in `src/components/errors/`
  - [ ] Subtask 5.2: Import trackError from `@/libs/analytics/helpers`
  - [ ] Subtask 5.3: Add tracking in ErrorBoundary componentDidCatch method
  - [ ] Subtask 5.4: Extract error type from error object
  - [ ] Subtask 5.5: Sanitize error message using validation.ts utilities
  - [ ] Subtask 5.6: Include error_location (component stack or route)
  - [ ] Subtask 5.7: Track `error_occurred` event with sanitized properties
  - [ ] Subtask 5.8: Ensure no stack traces or sensitive data are tracked
  - [ ] Subtask 5.9: Test error boundaries verify error tracking works
  - [ ] Subtask 5.10: Verify sensitive data is properly sanitized

- [ ] Task 6: Configure PostHog Autocapture (AC: #5)
  - [ ] Subtask 6.1: Review PostHog initialization in `src/libs/analytics/client.ts`
  - [ ] Subtask 6.2: Verify autocapture is enabled by default in PostHog config
  - [ ] Subtask 6.3: Configure autocapture settings if needed (capture_pageview, capture_pageleave)
  - [ ] Subtask 6.4: Add autocapture documentation to analytics setup guide
  - [ ] Subtask 6.5: Document which events use autocapture vs manual tracking
  - [ ] Subtask 6.6: Test page navigation verify autocapture works
  - [ ] Subtask 6.7: Review PostHog dashboard to see autocaptured events

- [ ] Task 7: Add Onboarding Start Tracking (AC: #3)
  - [ ] Subtask 7.1: Find onboarding entry point (likely first onboarding page mount)
  - [ ] Subtask 7.2: Import trackEvent from `@/libs/analytics`
  - [ ] Subtask 7.3: Track `onboarding_started` event on first step mount
  - [ ] Subtask 7.4: Store onboarding start timestamp in localStorage or state
  - [ ] Subtask 7.5: Use timestamp for duration calculation in onboarding_completed
  - [ ] Subtask 7.6: Ensure event only fires once per onboarding session
  - [ ] Subtask 7.7: Test onboarding start verify tracking works

- [ ] Task 8: Add Logout Tracking (AC: #2)
  - [ ] Subtask 8.1: Find logout handler (likely in layout or auth utility)
  - [ ] Subtask 8.2: Import trackEvent from `@/libs/analytics`
  - [ ] Subtask 8.3: Track `logout_completed` event before session cleanup
  - [ ] Subtask 8.4: Call resetUser() after logout to clear analytics identity
  - [ ] Subtask 8.5: Handle errors gracefully (don't block logout if tracking fails)
  - [ ] Subtask 8.6: Test logout verify tracking and reset work

- [ ] Task 9: Implement Feature First Use Tracking (AC: #4)
  - [ ] Subtask 9.1: Identify key features that need first-use tracking
  - [ ] Subtask 9.2: Create localStorage tracking for feature first-use flags
  - [ ] Subtask 9.3: Import trackFeatureFirstUse from `@/libs/analytics/helpers`
  - [ ] Subtask 9.4: Track `feature_first_use` event on first interaction with each feature
  - [ ] Subtask 9.5: Store feature usage flag to prevent duplicate tracking
  - [ ] Subtask 9.6: Features to track: feedback widget, profile edit, chat (if applicable)
  - [ ] Subtask 9.7: Test feature first use verify tracking works only once per feature

- [ ] Task 10: Add Signup Start Tracking (AC: #1)
  - [ ] Subtask 10.1: Locate signup form page at `src/app/[locale]/(unauth)/sign-up/`
  - [ ] Subtask 10.2: Import trackEvent from `@/libs/analytics`
  - [ ] Subtask 10.3: Track `signup_started` event when signup form is submitted (not just mounted)
  - [ ] Subtask 10.4: Or track on form mount if that's preferred pattern
  - [ ] Subtask 10.5: Document decision in code comments
  - [ ] Subtask 10.6: Test signup start verify tracking works

- [ ] Task 11: Write Integration Tests for Tracking (AC: #1, #2, #3, #4, #6)
  - [ ] Subtask 11.1: Create E2E test file `tests/analytics-tracking.spec.ts`
  - [ ] Subtask 11.2: Test signup flow tracks signup_completed event
  - [ ] Subtask 11.3: Test login flow tracks login_completed event
  - [ ] Subtask 11.4: Test onboarding flow tracks step events and completion
  - [ ] Subtask 11.5: Test feedback submission tracks feedback_submitted
  - [ ] Subtask 11.6: Test profile update tracks profile_updated
  - [ ] Subtask 11.7: Mock PostHog or use console provider for tests
  - [ ] Subtask 11.8: Verify event properties are correct
  - [ ] Subtask 11.9: Add test documentation

- [ ] Task 12: Update Analytics Documentation (AC: all)
  - [ ] Subtask 12.1: Update `docs/analytics-setup.md` with instrumentation details
  - [ ] Subtask 12.2: Document which flows are instrumented
  - [ ] Subtask 12.3: List all tracked events in user flows
  - [ ] Subtask 12.4: Add code examples for each instrumentation point
  - [ ] Subtask 12.5: Document testing approach for analytics
  - [ ] Subtask 12.6: Add troubleshooting section
  - [ ] Subtask 12.7: Link to event catalog from analytics-events.md (from 9.2)
  - [ ] Subtask 12.8: Document PostHog autocapture vs manual tracking

- [ ] Task 13: Add Analytics to Error Handling (AC: #6)
  - [ ] Subtask 13.1: Review global error handler if exists
  - [ ] Subtask 13.2: Add error tracking to unhandled promise rejections
  - [ ] Subtask 13.3: Add error tracking to window.onerror if needed
  - [ ] Subtask 13.4: Ensure error tracking doesn't create infinite loops
  - [ ] Subtask 13.5: Test error tracking with various error types
  - [ ] Subtask 13.6: Verify Sentry integration doesn't conflict with analytics

- [ ] Task 14: Performance Optimization (AC: all)
  - [ ] Subtask 14.1: Review all tracking calls for performance impact
  - [ ] Subtask 14.2: Ensure tracking is non-blocking
  - [ ] Subtask 14.3: Verify no tracking on critical render path
  - [ ] Subtask 14.4: Test app performance with analytics enabled
  - [ ] Subtask 14.5: Document any performance considerations
  - [ ] Subtask 14.6: Add console warnings if tracking takes too long

- [ ] Task 15: Verify User Identification (AC: #1, #2)
  - [ ] Subtask 15.1: Review auth callback for identifyUser() call
  - [ ] Subtask 15.2: Ensure user ID is passed to analytics
  - [ ] Subtask 15.3: Verify user properties are set (email, name, etc.)
  - [ ] Subtask 15.4: Test user identification in PostHog dashboard
  - [ ] Subtask 15.5: Verify events are attributed to correct users
  - [ ] Subtask 15.6: Test resetUser() on logout clears identity

## Dev Notes

### Critical Architecture Requirements

**IMPORTANT CONTEXT: Building on Stories 9.1 and 9.2**
- Story 9.1 created analytics infrastructure at `src/libs/analytics/`
- Story 9.2 created type-safe event tracking utilities and helpers
- This story USES those utilities to instrument actual application code
- DO NOT create new tracking functions - use existing helpers from 9.2
- Story 9.4 will use this instrumentation to analyze conversion funnels

**Instrumentation Points:**

This story adds tracking calls to existing application code at specific touchpoints:

1. **Authentication Flows** (`src/app/[locale]/(unauth)/auth/callback/`)
2. **Onboarding Steps** (`src/app/[locale]/(auth)/onboarding/`)
3. **Profile Updates** (`src/app/[locale]/(auth)/dashboard/profile/`)
4. **Feedback Widget** (`src/components/`)
5. **Error Boundaries** (`src/components/errors/`)

**Key Files to Modify:**

```
src/
  app/
    [locale]/
      (unauth)/
        auth/callback/route.ts          # Add signup/login tracking
        sign-up/page.tsx                # Add signup_started tracking
      (auth)/
        onboarding/                     # Add onboarding tracking
          page.tsx                      # onboarding_started
          components/                   # step tracking
        dashboard/
          profile/                      # Add profile_updated tracking
  components/
    feedback/                           # Add feedback_submitted tracking
    errors/                             # Add error_occurred tracking
      ErrorBoundary.tsx
```

### Implementation Patterns

**Pattern 1: Auth Callback Instrumentation**

The auth callback route handles both signup and login. Distinguish between them:

```typescript
// src/app/[locale]/(unauth)/auth/callback/route.ts

import { trackEvent, identifyUser } from '@/libs/analytics';
import { createClient } from '@/libs/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { user } = data.session;

      // Determine if signup or login
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .single();

      const isNewUser = userData &&
        new Date(userData.created_at).getTime() > Date.now() - 60000; // Within last minute

      // Get auth provider method
      const provider = user.app_metadata.provider || 'email';
      const method = provider === 'email' ? 'email' : provider; // google, github, etc.

      try {
        // Track signup or login
        if (isNewUser) {
          trackEvent('signup_completed', { method });
        } else {
          trackEvent('login_completed', { method });
        }

        // Identify user in analytics
        identifyUser(user.id, {
          email: user.email,
          name: user.user_metadata?.name,
          created_at: userData?.created_at,
        });
      } catch (analyticsError) {
        // Don't break auth flow if analytics fails
        console.error('Analytics tracking failed:', analyticsError);
      }
    }
  }

  return Response.redirect(requestUrl.origin + next);
}
```

**Pattern 2: Onboarding Step Tracking**

Track each step completion with step metadata:

```typescript
// src/app/[locale]/(auth)/onboarding/components/Step1.tsx

'use client';

import { useState, useEffect } from 'react';
import { trackEvent, trackOnboardingStepCompleted } from '@/libs/analytics';

export function OnboardingStep1() {
  useEffect(() => {
    // Track onboarding start on first step mount
    const onboardingStartTime = localStorage.getItem('onboarding_start_time');
    if (!onboardingStartTime) {
      localStorage.setItem('onboarding_start_time', Date.now().toString());
      trackEvent('onboarding_started', {});
    }
  }, []);

  const handleStepComplete = async (username: string) => {
    // Save username to database
    await saveUsername(username);

    // Track step completion
    trackOnboardingStepCompleted(1, 'username');

    // Navigate to next step
    router.push('/onboarding/step-2');
  };

  return (
    // Step UI
  );
}
```

**Pattern 3: Onboarding Completion Tracking**

Calculate duration and track completion:

```typescript
// src/app/[locale]/(auth)/onboarding/components/Step3.tsx

'use client';

import { trackOnboardingCompleted } from '@/libs/analytics/helpers';

export function OnboardingStep3() {
  const handleFinish = async () => {
    // Save preferences
    await savePreferences(preferences);

    // Calculate onboarding duration
    const startTime = localStorage.getItem('onboarding_start_time');
    const durationSeconds = startTime
      ? Math.floor((Date.now() - parseInt(startTime)) / 1000)
      : 0;

    // Track completion
    trackOnboardingCompleted(3, durationSeconds);

    // Clean up
    localStorage.removeItem('onboarding_start_time');

    // Navigate to dashboard
    router.push('/dashboard');
  };

  const handleSkip = () => {
    trackEvent('onboarding_skipped', {});
    localStorage.removeItem('onboarding_start_time');
    router.push('/dashboard');
  };

  return (
    // Step UI with finish and skip buttons
  );
}
```

**Pattern 4: Feedback Submission Tracking**

Track feedback with type and attachment info:

```typescript
// src/components/feedback/FeedbackWidget.tsx

'use client';

import { trackEvent } from '@/libs/analytics';

export function FeedbackWidget() {
  const handleSubmit = async (data: FeedbackFormData) => {
    // Submit feedback to API
    const response = await submitFeedback(data);

    if (response.success) {
      // Track submission
      trackEvent('feedback_submitted', {
        feedback_type: data.type, // 'bug' | 'feature' | 'general'
        has_screenshot: !!data.screenshot,
      });

      // Show success message
      toast.success('Feedback submitted!');
    }
  };

  return (
    // Feedback form UI
  );
}
```

**Pattern 5: Profile Update Tracking**

Track which fields were updated:

```typescript
// src/app/[locale]/(auth)/dashboard/profile/page.tsx

'use client';

import { trackEvent } from '@/libs/analytics';

export default function ProfilePage() {
  const handleUpdate = async (updatedData: ProfileData, originalData: ProfileData) => {
    // Calculate changed fields
    const fieldsUpdated = Object.keys(updatedData).filter(
      key => updatedData[key] !== originalData[key]
    );

    // Update profile in database
    const response = await updateProfile(updatedData);

    if (response.success) {
      // Track update
      trackEvent('profile_updated', {
        fields_updated: fieldsUpdated,
      });

      toast.success('Profile updated!');
    }
  };

  return (
    // Profile form UI
  );
}
```

**Pattern 6: Error Boundary Tracking**

Track errors with sanitized messages:

```typescript
// src/components/errors/ErrorBoundary.tsx

'use client';

import { Component, type ReactNode } from 'react';
import { trackError } from '@/libs/analytics/helpers';

export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error
    try {
      trackError(
        error.name || 'UnknownError',
        error.message,
        errorInfo.componentStack?.split('\n')[1]?.trim()
      );
    } catch (trackingError) {
      // Don't throw if tracking fails
      console.error('Failed to track error:', trackingError);
    }

    // Log to Sentry (existing behavior)
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    // Error UI
  }
}
```

**Pattern 7: Feature First Use Tracking**

Track first use with localStorage flag:

```typescript
// src/components/feedback/FeedbackWidget.tsx

'use client';

import { trackFeatureFirstUse } from '@/libs/analytics/helpers';

export function FeedbackWidget() {
  const handleOpen = () => {
    // Check if first use
    const hasUsedFeedback = localStorage.getItem('feature_used_feedback');
    if (!hasUsedFeedback) {
      trackFeatureFirstUse('feedback_widget');
      localStorage.setItem('feature_used_feedback', 'true');
    }

    setIsOpen(true);
  };

  return (
    <button onClick={handleOpen}>Give Feedback</button>
  );
}
```

**Pattern 8: Logout Tracking**

Track logout and reset analytics:

```typescript
// src/components/layout/Header.tsx or auth utility

'use client';

import { trackEvent, resetUser } from '@/libs/analytics';
import { createClient } from '@/libs/supabase/client';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Track logout before clearing session
      trackEvent('logout_completed', {});

      // Sign out
      const supabase = createClient();
      await supabase.auth.signOut();

      // Reset analytics identity
      resetUser();

      // Redirect to sign in
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <button onClick={handleLogout}>Log out</button>;
}
```

### Auth Provider Detection

To determine the authentication method (email, google, github):

```typescript
// Get provider from user metadata
const provider = user.app_metadata.provider || 'email';

// Map provider to event method
const methodMap: Record<string, 'email' | 'google' | 'github'> = {
  email: 'email',
  google: 'google',
  github: 'github',
};

const method = methodMap[provider] || 'email';
```

### Onboarding Duration Calculation

Store start time and calculate duration:

```typescript
// On onboarding start (first step mount)
localStorage.setItem('onboarding_start_time', Date.now().toString());

// On onboarding complete
const startTime = localStorage.getItem('onboarding_start_time');
const durationSeconds = startTime
  ? Math.floor((Date.now() - parseInt(startTime)) / 1000)
  : 0;

trackOnboardingCompleted(totalSteps, durationSeconds);

// Clean up
localStorage.removeItem('onboarding_start_time');
```

### PostHog Autocapture Configuration

PostHog automatically captures:
- Page views
- Page leaves
- Element clicks (optional)
- Form submissions (optional)

Verify autocapture is enabled in PostHog init:

```typescript
// src/libs/analytics/client.ts

posthog.init(apiKey, {
  api_host: apiHost,
  autocapture: true, // Enable autocapture
  capture_pageview: true, // Auto track page views
  capture_pageleave: true, // Track when users leave
  // capture_forms: false, // We track forms manually
  // capture_clicks: false, // We track clicks manually
});
```

### Error Handling Strategy

**Non-Blocking Tracking:**

Analytics should NEVER break user flows. Wrap all tracking in try-catch:

```typescript
try {
  trackEvent('signup_completed', { method: 'email' });
} catch (analyticsError) {
  // Log but don't throw
  console.error('Analytics tracking failed:', analyticsError);
}
```

**Error Sanitization:**

Use validation utilities from Story 9.2:

```typescript
import { sanitizeErrorMessage } from '@/libs/analytics/validation';

trackError(
  error.name,
  sanitizeErrorMessage(error.message), // Removes stack traces, PII
  componentStack
);
```

### Testing Strategy

**Unit Tests:**

Test that tracking functions are called correctly:

```typescript
// src/app/[locale]/(unauth)/auth/callback/__tests__/route.test.ts

import { describe, it, expect, vi } from 'vitest';
import { trackEvent } from '@/libs/analytics';

vi.mock('@/libs/analytics');

describe('Auth callback tracking', () => {
  it('tracks signup_completed on new user', async () => {
    // Setup new user scenario
    // Call auth callback
    // Verify trackEvent called with signup_completed
    expect(trackEvent).toHaveBeenCalledWith('signup_completed', {
      method: 'email',
    });
  });

  it('tracks login_completed on returning user', async () => {
    // Setup returning user scenario
    // Call auth callback
    // Verify trackEvent called with login_completed
    expect(trackEvent).toHaveBeenCalledWith('login_completed', {
      method: 'email',
    });
  });
});
```

**E2E Tests:**

Test full user flows with analytics:

```typescript
// tests/analytics-tracking.spec.ts

import { test, expect } from '@playwright/test';

test('tracks signup flow', async ({ page }) => {
  // Setup analytics listener
  const events: any[] = [];
  await page.route('**/api/analytics/**', async route => {
    const postData = route.request().postDataJSON();
    events.push(postData);
    await route.fulfill({ status: 200 });
  });

  // Complete signup
  await page.goto('/sign-up');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('/onboarding');

  // Verify signup event
  expect(events).toContainEqual(
    expect.objectContaining({
      event: 'signup_completed',
      properties: expect.objectContaining({
        method: 'email',
      }),
    })
  );
});
```

### Implementation Checklist

**Before Starting:**
- [ ] Verify Story 9.1 is complete (analytics infrastructure exists)
- [ ] Verify Story 9.2 is complete (event helpers exist)
- [ ] Review existing auth callback implementation
- [ ] Review existing onboarding flow implementation
- [ ] Review existing feedback and profile implementations

**During Implementation:**
- [ ] Import tracking functions from `@/libs/analytics` (never create new ones)
- [ ] Use helper functions (trackSignupCompleted, trackOnboardingStepCompleted, etc.)
- [ ] Wrap all tracking in try-catch
- [ ] Test each instrumentation point individually
- [ ] Verify events appear in console provider output

**After Implementation:**
- [ ] Test all instrumented flows end-to-end
- [ ] Verify events in PostHog dashboard (if API key configured)
- [ ] Check that tracking doesn't impact performance
- [ ] Update analytics documentation
- [ ] Write E2E tests for critical flows

### Privacy and Security Notes

**Data to NEVER Track:**
- Passwords
- API keys or tokens
- Full error stack traces
- File system paths
- Email addresses in error messages
- User-generated content with PII

**Data Sanitization:**
- Use `sanitizeErrorMessage()` for all error tracking
- Use `sanitizeProperties()` before tracking user input
- Truncate long strings
- Remove PII from all tracked data

**User Identification:**
- Only track user ID (not email) in events
- Use identifyUser() to set user properties separately
- Call resetUser() on logout

### Performance Considerations

**Client-Side:**
- All trackEvent calls are synchronous but non-blocking
- PostHog batches events automatically
- Console provider has minimal overhead
- Don't track in render functions (use effects or handlers)

**Server-Side:**
- Use trackEventServer for API route tracking
- Always await flush() in serverless environments
- Don't block API responses waiting for analytics
- Consider fire-and-forget for non-critical events

### Project Structure Notes

**Modified Files:**
```
src/
  app/
    [locale]/
      (unauth)/
        auth/callback/route.ts          # Add signup/login tracking
        sign-up/page.tsx                # Add signup_started tracking
      (auth)/
        onboarding/
          page.tsx                      # Add onboarding_started tracking
          components/
            Step1.tsx                   # Add step tracking
            Step2.tsx                   # Add step tracking
            Step3.tsx                   # Add step tracking + completion
        dashboard/
          profile/page.tsx              # Add profile_updated tracking
  components/
    feedback/
      FeedbackWidget.tsx                # Add feedback_submitted tracking
    errors/
      ErrorBoundary.tsx                 # Add error_occurred tracking
    layout/
      Header.tsx                        # Add logout_completed tracking
```

**New Test Files:**
```
tests/
  analytics-tracking.spec.ts            # E2E tests for tracking
src/
  app/
    [locale]/
      (unauth)/
        auth/callback/
          __tests__/
            route.test.ts               # Unit tests for auth tracking
```

**Updated Documentation:**
```
docs/
  analytics-setup.md                    # Add instrumentation details
  analytics-events.md                   # Reference from 9.2, no changes needed
```

### Dependencies

**No New Dependencies:**
- All tracking utilities from Story 9.2
- All analytics providers from Story 9.1
- Existing Supabase and Next.js dependencies

### Common Pitfalls to Avoid

1. **Don't create new tracking functions** - use helpers from 9.2
2. **Don't block user flows** - wrap tracking in try-catch
3. **Don't track on render** - use effects or event handlers
4. **Don't track sensitive data** - sanitize all user input
5. **Don't forget to identify users** - call identifyUser after auth
6. **Don't forget to reset** - call resetUser on logout
7. **Don't track duplicate events** - use flags for first-use tracking
8. **Don't forget duration** - store timestamps for time-based metrics

### Success Criteria

After implementation, you should see:
- ✅ Signup events in PostHog with correct method
- ✅ Login events in PostHog with correct method
- ✅ Onboarding step events with step metadata
- ✅ Onboarding completion with duration
- ✅ Feedback submission events with type and screenshot flag
- ✅ Profile update events with changed fields
- ✅ Error events with sanitized messages
- ✅ Page views via PostHog autocapture
- ✅ User identification working (events attributed to users)
- ✅ Logout tracking and identity reset working

### References

- [Source: Epic 9] - Full epic context and requirements
- [Source: Epic 9 Story 9.3] - Full acceptance criteria
- [Source: Story 9.1] - Analytics infrastructure (PostHog setup)
- [Source: Story 9.2] - Event tracking utilities and helpers
- [Source: CLAUDE.md] - Project patterns and conventions
- [PostHog Autocapture] - https://posthog.com/docs/product-analytics/autocapture
- [PostHog User Identification] - https://posthog.com/docs/product-analytics/identify
- [Supabase Auth Events] - Understanding auth provider metadata

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
