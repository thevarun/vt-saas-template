# Story 9.1: Analytics Infrastructure Setup (PostHog)

Status: done

## Story

As a template user (developer),
I want analytics infrastructure configured with PostHog,
so that I can track user behavior and make data-driven decisions.

## Acceptance Criteria

### AC1: Environment Configuration
**Given** the analytics setup
**When** I configure PostHog
**Then** NEXT_PUBLIC_POSTHOG_KEY environment variable is documented
**And** NEXT_PUBLIC_POSTHOG_HOST is configurable
**And** .env.example includes required variables

### AC2: Analytics Library Structure
**Given** the analytics library setup
**When** I review the code structure
**Then** there is an analytics module at `src/libs/analytics/`
**And** the module abstracts the provider (swappable later)
**And** TypeScript types are defined for events

### AC3: PostHog Initialization
**Given** PostHog initialization
**When** the app loads
**Then** PostHog client is initialized
**And** initialization happens client-side only
**And** user is identified when authenticated

### AC4: Privacy Features
**Given** privacy considerations
**When** analytics is configured
**Then** IP anonymization is enabled by default
**And** session recording is opt-in (not default)
**And** cookie consent integration is documented

### AC5: Development Mode
**Given** development mode
**When** NEXT_PUBLIC_POSTHOG_KEY is not set
**Then** analytics events are logged to console
**And** no errors are thrown
**And** developer can see what would be tracked

### AC6: Provider Abstraction
**Given** the analytics provider abstraction
**When** I want to swap to Amplitude or custom
**Then** interface is clearly defined
**And** implementation can be swapped without app changes
**And** documentation explains how to swap providers

## Tasks / Subtasks

- [ ] Task 1: Create analytics provider abstraction (AC: #2, #6)
  - [ ] Subtask 1.1: Create `src/libs/analytics/types.ts` with provider interface
  - [ ] Subtask 1.2: Define AnalyticsProvider interface with methods: init, identify, track, reset
  - [ ] Subtask 1.3: Define EventProperties type for event metadata
  - [ ] Subtask 1.4: Define UserProperties type for user identification
  - [ ] Subtask 1.5: Create AnalyticsConfig type for initialization options
  - [ ] Subtask 1.6: Export all types for use in implementation

- [ ] Task 2: Install and configure PostHog (AC: #1, #3)
  - [ ] Subtask 2.1: Install posthog-js package (`npm install posthog-js`)
  - [ ] Subtask 2.2: Add NEXT_PUBLIC_POSTHOG_KEY to .env.example
  - [ ] Subtask 2.3: Add NEXT_PUBLIC_POSTHOG_HOST to .env.example (default: https://us.i.posthog.com)
  - [ ] Subtask 2.4: Document environment variables in README or docs
  - [ ] Subtask 2.5: Create `src/libs/analytics/config.ts` for analytics config
  - [ ] Subtask 2.6: Export getAnalyticsConfig() that reads env vars
  - [ ] Subtask 2.7: Add validation for required config in production

- [ ] Task 3: Create PostHog provider implementation (AC: #3, #4, #5)
  - [ ] Subtask 3.1: Create `src/libs/analytics/providers/posthog.ts`
  - [ ] Subtask 3.2: Implement PostHogProvider class implementing AnalyticsProvider
  - [ ] Subtask 3.3: Implement init() method with PostHog initialization
  - [ ] Subtask 3.4: Enable IP anonymization by default (ip: false in config)
  - [ ] Subtask 3.5: Disable session recording by default (disable_session_recording: true)
  - [ ] Subtask 3.6: Add autocapture configuration (autocapture: true)
  - [ ] Subtask 3.7: Implement identify() method to set user properties
  - [ ] Subtask 3.8: Implement track() method to send events
  - [ ] Subtask 3.9: Implement reset() method to clear user identity
  - [ ] Subtask 3.10: Add client-side check (typeof window !== 'undefined')
  - [ ] Subtask 3.11: Return no-op methods when running server-side
  - [ ] Subtask 3.12: Handle missing API key gracefully (console mode)

- [ ] Task 4: Create console provider for development (AC: #5)
  - [ ] Subtask 4.1: Create `src/libs/analytics/providers/console.ts`
  - [ ] Subtask 4.2: Implement ConsoleProvider class implementing AnalyticsProvider
  - [ ] Subtask 4.3: Implement init() that logs "Analytics: Console mode enabled"
  - [ ] Subtask 4.4: Implement identify() that logs user properties to console
  - [ ] Subtask 4.5: Implement track() that logs event name and properties
  - [ ] Subtask 4.6: Implement reset() that logs "Analytics: User reset"
  - [ ] Subtask 4.7: Format console output for readability (use console.group)
  - [ ] Subtask 4.8: Include timestamp in console logs
  - [ ] Subtask 4.9: Use distinct console styling (colors/emojis) for visibility

- [ ] Task 5: Create analytics client singleton (AC: #2, #3, #5)
  - [ ] Subtask 5.1: Create `src/libs/analytics/client.ts`
  - [ ] Subtask 5.2: Create getAnalyticsProvider() factory function
  - [ ] Subtask 5.3: Check if NEXT_PUBLIC_POSTHOG_KEY exists
  - [ ] Subtask 5.4: Return PostHogProvider if key exists
  - [ ] Subtask 5.5: Return ConsoleProvider if key missing
  - [ ] Subtask 5.6: Ensure singleton pattern (initialize once)
  - [ ] Subtask 5.7: Export analytics client instance
  - [ ] Subtask 5.8: Add TypeScript types for exported client

- [ ] Task 6: Create analytics utility functions (AC: #3)
  - [ ] Subtask 6.1: Create `src/libs/analytics/index.ts` as main export
  - [ ] Subtask 6.2: Export initAnalytics() function
  - [ ] Subtask 6.3: Export identifyUser(userId, properties) function
  - [ ] Subtask 6.4: Export trackEvent(eventName, properties) function
  - [ ] Subtask 6.5: Export resetUser() function
  - [ ] Subtask 6.6: Add JSDoc comments for all functions
  - [ ] Subtask 6.7: Re-export types from types.ts
  - [ ] Subtask 6.8: Add examples in comments

- [ ] Task 7: Create PostHog initialization component (AC: #3)
  - [ ] Subtask 7.1: Create `src/components/analytics/PostHogProvider.tsx` as client component
  - [ ] Subtask 7.2: Add "use client" directive
  - [ ] Subtask 7.3: Call initAnalytics() in useEffect on mount
  - [ ] Subtask 7.4: Ensure initialization happens once (empty dependency array)
  - [ ] Subtask 7.5: Add error boundary for analytics failures
  - [ ] Subtask 7.6: Return children without wrapping (passthrough component)
  - [ ] Subtask 7.7: Add TypeScript types for props

- [ ] Task 8: Integrate PostHog into app layout (AC: #3)
  - [ ] Subtask 8.1: Import PostHogProvider in `src/app/[locale]/layout.tsx`
  - [ ] Subtask 8.2: Wrap app content with PostHogProvider
  - [ ] Subtask 8.3: Place PostHogProvider after authentication check
  - [ ] Subtask 8.4: Ensure provider runs client-side only
  - [ ] Subtask 8.5: Test that analytics initializes on app load

- [ ] Task 9: Add user identification on auth (AC: #3)
  - [ ] Subtask 9.1: Create `src/components/analytics/UserIdentifier.tsx` client component
  - [ ] Subtask 9.2: Add "use client" directive
  - [ ] Subtask 9.3: Get current user from Supabase client
  - [ ] Subtask 9.4: Call identifyUser() when user exists in useEffect
  - [ ] Subtask 9.5: Include user ID and email in identification
  - [ ] Subtask 9.6: Add user metadata (created_at, onboarding_completed, etc.)
  - [ ] Subtask 9.7: Call resetUser() when user logs out
  - [ ] Subtask 9.8: Add dependency array to re-identify on user change
  - [ ] Subtask 9.9: Handle user state changes properly

- [ ] Task 10: Integrate user identification (AC: #3)
  - [ ] Subtask 10.1: Import UserIdentifier in `src/app/[locale]/(auth)/layout.tsx`
  - [ ] Subtask 10.2: Add UserIdentifier component inside authenticated layout
  - [ ] Subtask 10.3: Ensure component only renders for authenticated users
  - [ ] Subtask 10.4: Test user identification on login
  - [ ] Subtask 10.5: Test user reset on logout

- [ ] Task 11: Document privacy features (AC: #4)
  - [ ] Subtask 11.1: Create `docs/analytics-privacy.md` documentation
  - [ ] Subtask 11.2: Document IP anonymization configuration
  - [ ] Subtask 11.3: Document session recording opt-in pattern
  - [ ] Subtask 11.4: Document how to enable session recording if needed
  - [ ] Subtask 11.5: Document data collection practices
  - [ ] Subtask 11.6: Document cookie consent integration steps
  - [ ] Subtask 11.7: Add GDPR/privacy compliance notes
  - [ ] Subtask 11.8: Document user opt-out mechanism

- [ ] Task 12: Document provider swap process (AC: #6)
  - [ ] Subtask 12.1: Create `docs/analytics-setup.md` documentation
  - [ ] Subtask 12.2: Document AnalyticsProvider interface
  - [ ] Subtask 12.3: Provide example of custom provider implementation
  - [ ] Subtask 12.4: Document how to swap PostHog for Amplitude
  - [ ] Subtask 12.5: Document how to create custom provider
  - [ ] Subtask 12.6: Document configuration differences per provider
  - [ ] Subtask 12.7: Add migration guide from PostHog to other providers
  - [ ] Subtask 12.8: Document testing strategy for new providers

- [ ] Task 13: Write analytics client tests (AC: #2, #3, #5)
  - [ ] Subtask 13.1: Create `src/libs/analytics/__tests__/client.test.ts`
  - [ ] Subtask 13.2: Test getAnalyticsProvider() returns PostHog when key exists
  - [ ] Subtask 13.3: Test getAnalyticsProvider() returns Console when key missing
  - [ ] Subtask 13.4: Test singleton pattern (same instance on multiple calls)
  - [ ] Subtask 13.5: Mock environment variables for tests
  - [ ] Subtask 13.6: Test initAnalytics() calls provider.init()
  - [ ] Subtask 13.7: Test identifyUser() calls provider.identify()
  - [ ] Subtask 13.8: Test trackEvent() calls provider.track()
  - [ ] Subtask 13.9: Test resetUser() calls provider.reset()
  - [ ] Subtask 13.10: Mock posthog-js library for tests

- [ ] Task 14: Write PostHog provider tests (AC: #3, #4)
  - [ ] Subtask 14.1: Create `src/libs/analytics/providers/__tests__/posthog.test.ts`
  - [ ] Subtask 14.2: Test init() initializes PostHog with correct config
  - [ ] Subtask 14.3: Test IP anonymization is enabled
  - [ ] Subtask 14.4: Test session recording is disabled
  - [ ] Subtask 14.5: Test identify() sets user properties
  - [ ] Subtask 14.6: Test track() sends events with properties
  - [ ] Subtask 14.7: Test reset() clears user identity
  - [ ] Subtask 14.8: Test server-side safety (no-op when window undefined)
  - [ ] Subtask 14.9: Mock posthog-js methods

- [ ] Task 15: Write console provider tests (AC: #5)
  - [ ] Subtask 15.1: Create `src/libs/analytics/providers/__tests__/console.test.ts`
  - [ ] Subtask 15.2: Test init() logs initialization message
  - [ ] Subtask 15.3: Test identify() logs user properties
  - [ ] Subtask 15.4: Test track() logs event name and properties
  - [ ] Subtask 15.5: Test reset() logs reset message
  - [ ] Subtask 15.6: Verify console output format
  - [ ] Subtask 15.7: Mock console methods (console.log, console.group)

- [ ] Task 16: Write component tests (AC: #3)
  - [ ] Subtask 16.1: Create `src/components/analytics/__tests__/PostHogProvider.test.tsx`
  - [ ] Subtask 16.2: Test component calls initAnalytics() on mount
  - [ ] Subtask 16.3: Test component only initializes once
  - [ ] Subtask 16.4: Test component renders children
  - [ ] Subtask 16.5: Create `src/components/analytics/__tests__/UserIdentifier.test.tsx`
  - [ ] Subtask 16.6: Test component calls identifyUser() when user exists
  - [ ] Subtask 16.7: Test component calls resetUser() when user logs out
  - [ ] Subtask 16.8: Test component handles user state changes
  - [ ] Subtask 16.9: Mock Supabase client for tests

## Dev Notes

### Critical Architecture Requirements

**IMPORTANT CONTEXT: Analytics Foundation for Epic 9**
- This story creates the analytics infrastructure used by all subsequent Epic 9 stories
- Story 9.2 will add trackEvent() utility and event types
- Story 9.3 will instrument core user flows using this infrastructure
- Stories 9.4-9.6 will track specific events and funnels
- This infrastructure must be provider-agnostic to allow future swaps

**Provider Abstraction Pattern:**

The analytics system uses a provider pattern to allow swapping PostHog for other services:

```typescript
// src/libs/analytics/types.ts
export interface AnalyticsProvider {
  init(config: AnalyticsConfig): void;
  identify(userId: string, properties?: UserProperties): void;
  track(eventName: string, properties?: EventProperties): void;
  reset(): void;
}

export interface EventProperties {
  [key: string]: string | number | boolean | Date | null;
}

export interface UserProperties {
  email?: string;
  name?: string;
  createdAt?: Date;
  [key: string]: string | number | boolean | Date | undefined;
}

export interface AnalyticsConfig {
  apiKey: string;
  apiHost?: string;
  enabled: boolean;
}
```

**PostHog Provider Implementation:**

```typescript
// src/libs/analytics/providers/posthog.ts
import posthog from 'posthog-js';
import type { AnalyticsProvider, AnalyticsConfig, EventProperties, UserProperties } from '../types';

export class PostHogProvider implements AnalyticsProvider {
  private initialized = false;

  init(config: AnalyticsConfig): void {
    // Only run client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Skip if already initialized
    if (this.initialized) {
      return;
    }

    // Initialize PostHog
    posthog.init(config.apiKey, {
      api_host: config.apiHost || 'https://us.i.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Analytics] PostHog initialized');
        }
      },
      // Privacy settings
      ip: false, // Anonymize IP addresses
      disable_session_recording: true, // Session recording opt-in only
      autocapture: true, // Enable autocapture for page views
      capture_pageview: true,
      capture_pageleave: true,
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.identify(userId, properties);
  }

  track(eventName: string, properties?: EventProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.capture(eventName, properties);
  }

  reset(): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return;
    }

    posthog.reset();
  }
}
```

**Console Provider for Development:**

```typescript
// src/libs/analytics/providers/console.ts
import type { AnalyticsProvider, AnalyticsConfig, EventProperties, UserProperties } from '../types';

export class ConsoleProvider implements AnalyticsProvider {
  init(config: AnalyticsConfig): void {
    console.log('[Analytics] Console mode enabled (no API key configured)');
  }

  identify(userId: string, properties?: UserProperties): void {
    console.group('[Analytics] Identify User');
    console.log('User ID:', userId);
    console.log('Properties:', properties);
    console.groupEnd();
  }

  track(eventName: string, properties?: EventProperties): void {
    console.group(`[Analytics] Track Event: ${eventName}`);
    console.log('Event:', eventName);
    console.log('Properties:', properties);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  reset(): void {
    console.log('[Analytics] User reset');
  }
}
```

**Analytics Client Singleton:**

```typescript
// src/libs/analytics/client.ts
import type { AnalyticsProvider } from './types';
import { PostHogProvider } from './providers/posthog';
import { ConsoleProvider } from './providers/console';

let analyticsInstance: AnalyticsProvider | null = null;

export function getAnalyticsProvider(): AnalyticsProvider {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (apiKey) {
    analyticsInstance = new PostHogProvider();
  } else {
    analyticsInstance = new ConsoleProvider();
  }

  return analyticsInstance;
}
```

**Analytics Utility Functions:**

```typescript
// src/libs/analytics/index.ts
import { getAnalyticsProvider } from './client';
import type { EventProperties, UserProperties } from './types';

/**
 * Initialize analytics provider
 * Call this once on app startup
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
 * @param userId - Unique user identifier
 * @param properties - Additional user properties
 */
export function identifyUser(userId: string, properties?: UserProperties): void {
  const provider = getAnalyticsProvider();
  provider.identify(userId, properties);
}

/**
 * Track an analytics event
 * @param eventName - Name of the event
 * @param properties - Event properties
 */
export function trackEvent(eventName: string, properties?: EventProperties): void {
  const provider = getAnalyticsProvider();
  provider.track(eventName, properties);
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  const provider = getAnalyticsProvider();
  provider.reset();
}

// Re-export types
export type { EventProperties, UserProperties } from './types';
```

**PostHog Provider Component:**

```typescript
// src/components/analytics/PostHogProvider.tsx
'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/libs/analytics';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return children;
}
```

**User Identification Component:**

```typescript
// src/components/analytics/UserIdentifier.tsx
'use client';

import { useEffect } from 'react';
import { createClient } from '@/libs/supabase/client';
import { identifyUser, resetUser } from '@/libs/analytics';

export function UserIdentifier() {
  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        identifyUser(user.id, {
          email: user.email,
          createdAt: new Date(user.created_at),
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        identifyUser(session.user.id, {
          email: session.user.email,
          createdAt: new Date(session.user.created_at),
        });
      } else if (event === 'SIGNED_OUT') {
        resetUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
```

**Layout Integration:**

```typescript
// src/app/[locale]/layout.tsx
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}

// src/app/[locale]/(auth)/layout.tsx
import { UserIdentifier } from '@/components/analytics/UserIdentifier';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UserIdentifier />
      {children}
    </>
  );
}
```

**Environment Variables:**

```bash
# .env.example

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=        # PostHog project API key (optional in dev)
NEXT_PUBLIC_POSTHOG_HOST=       # PostHog API host (default: https://us.i.posthog.com)
```

### Implementation Strategy

**Phase 1: Core Infrastructure**

1. Create analytics types and interfaces
2. Install posthog-js package
3. Create PostHog provider implementation
4. Create console provider for development
5. Create analytics client singleton
6. Create utility functions

**Phase 2: React Integration**

1. Create PostHogProvider component
2. Create UserIdentifier component
3. Integrate providers into app layout
4. Test initialization on app load
5. Test user identification on auth

**Phase 3: Documentation and Testing**

1. Document privacy features
2. Document provider swap process
3. Write unit tests for all modules
4. Write component tests
5. Test development mode (console logging)
6. Test production mode (PostHog tracking)

### Testing Strategy

**Unit Tests:**

```typescript
// src/libs/analytics/__tests__/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAnalyticsProvider } from '../client';
import { PostHogProvider } from '../providers/posthog';
import { ConsoleProvider } from '../providers/console';

vi.mock('../providers/posthog');
vi.mock('../providers/console');

describe('getAnalyticsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns PostHog provider when API key exists', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';
    const provider = getAnalyticsProvider();
    expect(provider).toBeInstanceOf(PostHogProvider);
  });

  it('returns Console provider when API key missing', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const provider = getAnalyticsProvider();
    expect(provider).toBeInstanceOf(ConsoleProvider);
  });

  it('returns same instance on multiple calls (singleton)', () => {
    const provider1 = getAnalyticsProvider();
    const provider2 = getAnalyticsProvider();
    expect(provider1).toBe(provider2);
  });
});
```

**Component Tests:**

```typescript
// src/components/analytics/__tests__/PostHogProvider.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PostHogProvider } from '../PostHogProvider';
import * as analytics from '@/libs/analytics';

vi.mock('@/libs/analytics');

describe('PostHogProvider', () => {
  it('calls initAnalytics on mount', () => {
    const initSpy = vi.spyOn(analytics, 'initAnalytics');
    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    );
    expect(initSpy).toHaveBeenCalledOnce();
  });

  it('renders children', () => {
    const { getByText } = render(
      <PostHogProvider>
        <div>Test Content</div>
      </PostHogProvider>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });
});
```

**Privacy Compliance Tests:**

```typescript
// src/libs/analytics/providers/__tests__/posthog.test.ts
import { describe, it, expect, vi } from 'vitest';
import posthog from 'posthog-js';
import { PostHogProvider } from '../posthog';

vi.mock('posthog-js');

describe('PostHogProvider privacy settings', () => {
  it('enables IP anonymization', () => {
    const provider = new PostHogProvider();
    provider.init({ apiKey: 'test', enabled: true });

    expect(posthog.init).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        ip: false,
      })
    );
  });

  it('disables session recording by default', () => {
    const provider = new PostHogProvider();
    provider.init({ apiKey: 'test', enabled: true });

    expect(posthog.init).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        disable_session_recording: true,
      })
    );
  });
});
```

### Project Structure Notes

**New Files:**
```
src/
  libs/analytics/
    types.ts                      # AnalyticsProvider interface and types
    config.ts                     # Analytics configuration
    client.ts                     # Analytics client singleton
    index.ts                      # Main exports and utility functions
    providers/
      posthog.ts                  # PostHog provider implementation
      console.ts                  # Console provider for development
      __tests__/
        posthog.test.ts           # PostHog provider tests
        console.test.ts           # Console provider tests
    __tests__/
      client.test.ts              # Client singleton tests
      index.test.ts               # Utility function tests
  components/analytics/
    PostHogProvider.tsx           # Analytics initialization component
    UserIdentifier.tsx            # User identification component
    __tests__/
      PostHogProvider.test.tsx    # Provider component tests
      UserIdentifier.test.tsx     # Identifier component tests
docs/
  analytics-setup.md              # Setup and provider swap guide
  analytics-privacy.md            # Privacy features documentation
```

**Updated Files:**
```
src/
  app/[locale]/
    layout.tsx                    # Add PostHogProvider
  app/[locale]/(auth)/
    layout.tsx                    # Add UserIdentifier
.env.example                      # Add analytics env vars
package.json                      # Add posthog-js dependency
```

**Dependencies:**
- posthog-js (new install via npm)
- Supabase client (already configured)
- React hooks (useEffect)
- Next.js client components

### Privacy and GDPR Considerations

**Default Privacy Settings:**

1. **IP Anonymization**: Enabled by default (ip: false)
2. **Session Recording**: Disabled by default (opt-in only)
3. **Autocapture**: Enabled for page views (can be disabled if needed)
4. **User Identification**: Only for authenticated users

**Cookie Consent Integration:**

For GDPR compliance, consider integrating with a cookie consent library:

```typescript
// Future enhancement (not in this story)
// Only initialize analytics after user consent
if (cookieConsent.analytics) {
  initAnalytics();
}
```

**Data Minimization:**

- Only track essential user properties
- Avoid tracking PII unless necessary
- Sanitize error messages before tracking
- Provide user opt-out mechanism

**Documentation Requirements:**

- Privacy policy must mention PostHog usage
- Document what data is collected
- Document user rights (opt-out, data deletion)
- Provide links to PostHog's privacy policy

### Performance Considerations

**Lazy Loading:**

PostHog is initialized client-side in useEffect, so it doesn't block SSR.

**Bundle Size:**

posthog-js adds approximately 50KB gzipped to the client bundle.

**Network Requests:**

PostHog batches events and sends them periodically to reduce network overhead.

**Server-Side Safety:**

All analytics calls check for `typeof window !== 'undefined'` to avoid SSR errors.

### Security Considerations

**API Key Protection:**

- NEXT_PUBLIC_POSTHOG_KEY is public (client-side)
- Restrict PostHog project by domain in PostHog settings
- Use separate projects for dev/staging/production

**Data Validation:**

- Validate event properties before sending
- Sanitize user inputs in tracked data
- Avoid tracking sensitive information

**Access Control:**

- Limit PostHog dashboard access to authorized team members
- Use role-based access in PostHog settings

### References

- [Source: Epic 9] - Full epic context and requirements
- [Source: Epic 9 Story 9.1] - Full acceptance criteria
- [PostHog Documentation] - https://posthog.com/docs
- [PostHog Privacy Settings] - https://posthog.com/docs/privacy
- [PostHog React SDK] - https://posthog.com/docs/libraries/react
- [Source: CLAUDE.md] - Project structure and patterns
- [Source: src/libs/supabase/client.ts] - Supabase client pattern
- [Source: src/app/[locale]/layout.tsx] - Layout structure

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
