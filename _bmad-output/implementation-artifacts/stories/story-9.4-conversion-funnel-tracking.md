# Story 9.4: Conversion Funnel Tracking

**Epic:** Epic 9 - Analytics & Founder Dashboard
**Story ID:** 9.4
**Created:** 2026-02-10
**Status:** ready-for-dev

## User Story

As a **product owner**,
I want **to track conversion funnels**,
So that **I can identify and fix drop-off points**.

## Context

Stories 9.1-9.3 established the analytics foundation:
- **9.1**: Analytics infrastructure with PostHog provider, console provider
- **9.2**: Type-safe event tracking with helpers (trackSignupCompleted, trackLoginCompleted, etc.)
- **9.3**: Core user flows instrumented (auth, onboarding, feedback, profile, errors)

Many funnel events already exist from Story 9.3:
- `signup_completed` - tracked in auth callback
- `onboarding_started` - tracked in onboarding flow
- `onboarding_completed` - tracked on onboarding completion
- `feature_first_use` - helper exists, used in various features

**This story adds:**
1. **New funnel stage events**: `landing_viewed`, `signup_started`, `user_activated`, `referred_signup`
2. **Referral source tracking**: Capture and pass UTM parameters and referral codes
3. **Activation definition and tracking**: Define what "activated" means and track it
4. **PostHog funnel configuration documentation**: Guide for setting up funnels in PostHog

## Acceptance Criteria

### AC1: Landing Page Tracking

**Given** a user visits the landing page (home page, locale root)
**When** the page loads
**Then** `landing_viewed` event is tracked
**And** properties include: `page_url`, `locale`, `referrer` (from document.referrer)
**And** UTM parameters are captured if present: `utm_source`, `utm_medium`, `utm_campaign`

**Given** the landing page component
**When** I review the code
**Then** tracking happens client-side in a useEffect
**And** tracking fires only once per session (not on every render)
**And** event is tracked using the analytics utility

### AC2: Signup Started Tracking

**Given** a user navigates to the signup page
**When** the signup form component mounts
**Then** `signup_started` event is tracked
**And** properties include: `referral_source` (if present from URL params)

**Given** the signup form
**When** I review the instrumentation
**Then** event fires when form loads (not on submit)
**And** differentiates from `signup_completed` (which fires on successful registration)

### AC3: User Activation Tracking

**Given** the activation criteria definition
**When** I review the documentation
**Then** activation is defined as: completed onboarding + performed first meaningful action
**And** "meaningful action" is defined (e.g., submitted feedback, used chat, updated profile)

**Given** a user completes the activation criteria
**When** the activation condition is met
**Then** `user_activated` event is tracked
**And** properties include: `activation_time_seconds` (time from signup to activation)
**And** properties include: `activation_trigger` (what action triggered activation)

**Given** activation tracking logic
**When** I review the implementation
**Then** activation is tracked only once per user
**And** activation state is checked/stored to prevent duplicate events
**And** implementation is performant (doesn't add overhead to every action)

### AC4: Referral Tracking

**Given** a user arrives via a referral link
**When** the link includes referral parameters (e.g., `?ref=user123` or `?utm_source=friend`)
**Then** referral source is captured and stored
**And** referral info persists through signup process (sessionStorage or cookie)

**Given** a referred user completes signup
**When** `signup_completed` event is tracked
**Then** event properties include: `referral_source`, `referrer_user_id` (if applicable)
**And** optional: separate `referred_signup` event is tracked for easier filtering

**Given** referral parameter handling
**When** I review the code
**Then** common referral parameters are supported: `ref`, `referrer`, `utm_source`
**And** parameter is URL-decoded and sanitized
**And** referral info is cleared after successful signup

### AC5: Feature Adoption Tracking (Validation)

**Given** the existing `feature_first_use` event (from Story 9.2)
**When** I validate its usage
**Then** it's being called when user uses a feature for the first time
**And** examples exist in codebase: feedback, chat, profile features

**Given** feature adoption rate calculation
**When** I review the PostHog documentation
**Then** instructions explain how to calculate adoption rate
**And** formula is: (users who used feature / total users) * 100

### AC6: Funnel Configuration Documentation

**Given** the PostHog funnel setup guide
**When** I review the documentation
**Then** it includes step-by-step instructions for creating funnels in PostHog
**And** example funnel is provided: Signup-to-Activation

**Given** the Signup-to-Activation funnel example
**When** I review the funnel definition
**Then** stages are clearly defined in order:
1. `landing_viewed`
2. `signup_started`
3. `signup_completed`
4. `onboarding_started`
5. `onboarding_completed`
6. `user_activated`

**Given** the funnel configuration guide
**When** I review the PostHog setup
**Then** it explains how to set time windows (e.g., 30-day conversion window)
**And** it explains how to filter by properties (e.g., signup method)
**And** it shows how to identify drop-off stages

## Implementation Plan

### Phase 1: Event Type Definitions

**Files to modify:**
- `src/libs/analytics/events.ts` - Add new event types

**Changes:**
```typescript
// Add to EventName type:
| 'landing_viewed'
| 'user_activated'
| 'referred_signup'

// Add property types:
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

export type UserActivatedProperties = {
  activation_time_seconds: number;
  activation_trigger: string;
};

export type ReferredSignupProperties = {
  referral_source: string;
  referrer_user_id?: string;
};

// Add to EventPropertiesMap:
landing_viewed: LandingViewedProperties;
user_activated: UserActivatedProperties;
referred_signup: ReferredSignupProperties;

// Add to EVENT_CATEGORIES:
landing_viewed: EventCategory.Page,
user_activated: EventCategory.Feature,
referred_signup: EventCategory.Auth,
```

### Phase 2: Helper Functions

**Files to modify:**
- `src/libs/analytics/helpers.ts` - Add new helper functions

**New helpers:**
```typescript
export function trackLandingViewed(properties: LandingViewedProperties): void;
export function trackUserActivated(activationTrigger: string, activationTimeSeconds: number): void;
export function trackReferredSignup(referralSource: string, referrerUserId?: string): void;
```

### Phase 3: Referral Utilities

**New file:**
- `src/libs/analytics/referral.ts`

**Functions to implement:**
```typescript
// Capture referral params from URL
export function captureReferralParams(): void;

// Get stored referral info
export function getReferralInfo(): { source?: string; userId?: string } | null;

// Clear referral info
export function clearReferralInfo(): void;

// Extract UTM params from URL
export function extractUtmParams(): Record<string, string>;
```

**Implementation notes:**
- Use sessionStorage for temporary referral storage
- Sanitize all URL parameters
- Handle missing parameters gracefully

### Phase 4: Landing Page Instrumentation

**Files to modify:**
- `src/app/[locale]/page.tsx` (home/landing page)

**Changes:**
```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackLandingViewed, captureReferralParams, extractUtmParams } from '@/libs/analytics';

export default function LandingPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track landing view only once per session
    const hasTrackedLanding = sessionStorage.getItem('landing_tracked');
    if (hasTrackedLanding) return;

    // Capture referral params for later use
    captureReferralParams();

    // Track landing view
    const utmParams = extractUtmParams();
    trackLandingViewed({
      page_url: window.location.href,
      locale: pathname.split('/')[1] || 'en',
      referrer: document.referrer || undefined,
      ...utmParams,
    });

    sessionStorage.setItem('landing_tracked', 'true');
  }, [pathname, searchParams]);

  return (
    // ... existing landing page content
  );
}
```

### Phase 5: Signup Started Instrumentation

**Files to modify:**
- `src/app/[locale]/(unauth)/sign-up/page.tsx` (signup page)

**Changes:**
```typescript
'use client';

import { useEffect } from 'react';
import { trackEvent, getReferralInfo } from '@/libs/analytics';

export default function SignUpPage() {
  useEffect(() => {
    // Track signup started when page loads
    const referralInfo = getReferralInfo();
    trackEvent('signup_started', {
      referral_source: referralInfo?.source,
    });
  }, []);

  return (
    // ... existing signup form
  );
}
```

### Phase 6: Referred Signup Tracking

**Files to modify:**
- `src/app/api/auth/callback/route.ts` (existing auth callback)

**Changes:**
```typescript
// In the section that tracks signup_completed:
import { getReferralInfo, clearReferralInfo, trackReferredSignup } from '@/libs/analytics/referral';

// After signup_completed tracking:
const referralInfo = getReferralInfo();
if (referralInfo?.source) {
  // Track referred signup
  trackReferredSignup(referralInfo.source, referralInfo.userId);
}
clearReferralInfo(); // Clean up
```

### Phase 7: User Activation Tracking

**New file:**
- `src/libs/analytics/activation.ts`

**Functions to implement:**
```typescript
// Check if user is activated
export async function checkUserActivation(userId: string): Promise<boolean>;

// Mark user as activated
export function trackActivation(trigger: string, signupTimestamp: Date): void;

// Check if activation criteria met
export function shouldTrackActivation(userId: string): boolean;
```

**Implementation approach:**
- Store activation state in localStorage (client-side) or database (server-side)
- Activation triggers: completed onboarding + one of (feedback_submitted, chat_used, profile_updated)
- Calculate activation time: current timestamp - user signup timestamp

**Files to modify:**
- `src/app/[locale]/(auth)/onboarding/page.tsx` - Check activation after onboarding complete
- Feature components (feedback, profile) - Check activation after first use

**Example integration:**
```typescript
// In onboarding completion handler:
import { shouldTrackActivation, trackActivation } from '@/libs/analytics/activation';

if (shouldTrackActivation(user.id)) {
  trackActivation('onboarding_completed', user.createdAt);
}

// In feedback submission handler:
if (shouldTrackActivation(user.id)) {
  trackActivation('feedback_submitted', user.createdAt);
}
```

### Phase 8: PostHog Funnel Documentation

**New file:**
- `docs/analytics-funnels.md`

**Documentation sections:**
1. **Introduction**: What are funnels and why track them
2. **Signup-to-Activation Funnel**: Step-by-step PostHog setup
3. **Event Reference**: All funnel events and their properties
4. **Interpreting Results**: How to identify drop-off points
5. **Advanced Filtering**: Filter by signup method, referral source, locale

**Content outline:**
```markdown
# Analytics Funnels

## Signup-to-Activation Funnel

### Steps
1. landing_viewed
2. signup_started
3. signup_completed
4. onboarding_started
5. onboarding_completed
6. user_activated

### PostHog Configuration
1. Navigate to Insights > New Funnel
2. Add events in order (listed above)
3. Set conversion window: 30 days
4. Optional filters: method=email, locale=en, etc.

### Drop-off Analysis
- Between landing_viewed and signup_started: Landing page effectiveness
- Between signup_started and signup_completed: Form friction
- Between signup_completed and onboarding_started: Post-signup drop-off
- Between onboarding_started and onboarding_completed: Onboarding friction
- Between onboarding_completed and user_activated: Product value perception

### Feature Adoption Tracking
- Use feature_first_use event in PostHog
- Filter by feature_name property
- Calculate adoption rate: (users with event / total users) * 100
```

## Testing Requirements

### Unit Tests

**File:** `src/libs/analytics/__tests__/referral.test.ts`

Test cases:
- `captureReferralParams` captures ref parameter
- `captureReferralParams` captures utm_source
- `getReferralInfo` returns stored info
- `clearReferralInfo` removes stored info
- `extractUtmParams` extracts all UTM parameters
- Handles missing parameters gracefully
- Sanitizes malicious input

**File:** `src/libs/analytics/__tests__/activation.test.ts`

Test cases:
- `checkUserActivation` returns true for activated users
- `shouldTrackActivation` returns false if already activated
- `trackActivation` calculates correct activation time
- Activation triggers only once per user

**File:** `src/libs/analytics/__tests__/helpers.test.ts` (add to existing)

Test cases:
- `trackLandingViewed` calls trackEvent with correct properties
- `trackUserActivated` includes activation time
- `trackReferredSignup` includes referral source

### Integration Tests

**Test scenario: Referral flow**
1. User lands on site with `?ref=friend123`
2. Referral info is captured in sessionStorage
3. User navigates to signup page
4. `signup_started` includes referral_source
5. User completes signup
6. `signup_completed` includes referral_source
7. `referred_signup` event is tracked
8. Referral info is cleared

**Test scenario: Activation tracking**
1. User completes signup
2. User completes onboarding
3. User submits feedback (first meaningful action)
4. `user_activated` event is tracked
5. Subsequent actions don't trigger activation again

### Manual Testing Checklist

- [ ] Landing page view tracked on first visit
- [ ] Landing view not tracked on subsequent visits in same session
- [ ] UTM parameters captured from URL
- [ ] Referral parameter captured from URL
- [ ] `signup_started` tracked on signup page load
- [ ] Referral info persists from landing to signup
- [ ] `referred_signup` tracked for referred users
- [ ] Referral info cleared after signup
- [ ] `user_activated` tracked after completing activation criteria
- [ ] Activation not tracked multiple times for same user
- [ ] All events visible in PostHog (or console in dev mode)
- [ ] Funnel can be created in PostHog with documented steps

## Dev Notes

### UX Design References

**No UI work required for this story.** This story focuses on analytics instrumentation (backend event tracking). The Founder Dashboard UI will be built in Story 9.5.

**Related Design Document:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-9-analytics-dashboard-design.md` (for future reference in Story 9.5)

### Dependencies

**Completed (from Stories 9.1-9.3):**
- Analytics infrastructure (`src/libs/analytics/`)
- PostHog provider integration
- Event tracking utility (`trackEvent`)
- Existing events: `signup_completed`, `onboarding_started`, `onboarding_completed`, `feature_first_use`
- Server-side tracking capability

**No external dependencies required.**

### Technical Considerations

**Referral Persistence:**
- Use sessionStorage for referral info (cleared on browser close)
- Alternative: Use cookies with 30-day expiry for cross-session tracking
- Ensure GDPR compliance (referral tracking with consent)

**Activation State Management:**
- Client-side approach: localStorage (simpler, works offline)
- Server-side approach: database column `is_activated` (more reliable)
- **Recommended:** Hybrid - localStorage for quick checks, database for source of truth

**Performance:**
- Landing view tracking: Runs once per session, minimal impact
- Activation checks: Only run when activation-eligible actions occur
- Avoid blocking user actions for analytics tracking

**Privacy:**
- Sanitize all URL parameters before storing
- Don't capture PII in UTM parameters
- Respect Do Not Track headers (if applicable)

### Edge Cases

**Multiple referral sources:**
- User lands via UTM link, then shares referral code
- **Solution:** First-touch attribution (capture first referral source, ignore subsequent)

**Activation before onboarding:**
- User uses feature before completing onboarding
- **Solution:** Activation requires onboarding completion + feature use

**Browser privacy mode:**
- sessionStorage/localStorage may be disabled
- **Solution:** Graceful degradation, skip referral tracking if storage unavailable

**Time zone handling:**
- Activation time calculation across time zones
- **Solution:** Use UTC timestamps consistently

### PostHog Funnel Best Practices

**Conversion windows:**
- Signup-to-activation: 30 days (industry standard for SaaS)
- Landing-to-signup: 7 days (shorter window for acquisition)

**Exclusion steps:**
- Consider excluding users who churned between steps
- Use PostHog's exclusion feature for cleaner funnels

**Cohort analysis:**
- Create cohorts based on signup date
- Compare funnel performance across cohorts
- Identify trends over time

**A/B testing:**
- Track experiment variants in event properties
- Filter funnels by variant to compare conversion rates

### Code Quality Standards

**Type safety:**
- All new events must have TypeScript types in `events.ts`
- Helper functions must enforce type constraints
- No `any` types allowed

**Testing:**
- Unit tests for all utility functions
- Integration tests for referral flow
- Mock sessionStorage in tests

**Documentation:**
- JSDoc comments for all public functions
- Inline comments for complex logic
- README updates for new utilities

**Error handling:**
- Gracefully handle missing URL parameters
- Catch and log errors in analytics tracking (don't break app)
- Fallback to console logging if PostHog unavailable

## Definition of Done

- [ ] Event types defined: `landing_viewed`, `user_activated`, `referred_signup`
- [ ] Helper functions implemented: `trackLandingViewed`, `trackUserActivated`, `trackReferredSignup`
- [ ] Referral utilities implemented: capture, get, clear, extract UTM
- [ ] Landing page instrumented with `landing_viewed` tracking
- [ ] Signup page instrumented with `signup_started` tracking
- [ ] Referral tracking integrated into signup flow
- [ ] User activation tracking implemented with helper
- [ ] Activation state management prevents duplicate events
- [ ] PostHog funnel documentation created in `docs/analytics-funnels.md`
- [ ] Unit tests pass for all new utilities
- [ ] Integration test validates referral flow
- [ ] Integration test validates activation tracking
- [ ] Manual testing checklist completed
- [ ] All events visible in PostHog (or console in dev mode)
- [ ] Code reviewed and approved
- [ ] TypeScript types are strict (no `any`)
- [ ] JSDoc comments added for public functions
- [ ] No breaking changes to existing analytics code

## Related Stories

- **Story 9.1**: Analytics Infrastructure Setup (PostHog) - ✅ Completed
- **Story 9.2**: Event Tracking Utility - ✅ Completed
- **Story 9.3**: Core User Flow Instrumentation - ✅ Completed
- **Story 9.5**: Founder Analytics Dashboard - ⏳ Next (will visualize funnel metrics)
- **Story 9.6**: pSEO Traffic Instrumentation - 🔜 Future (extends funnel tracking to SEO pages)

## References

- **Epic File:** `_bmad-output/planning-artifacts/epics/epic-9-analytics-founder-dashboard.md`
- **Design Brief:** `_bmad-output/planning-artifacts/ux-design/epic-9-analytics-dashboard-design.md`
- **PostHog Funnels Docs:** https://posthog.com/docs/product-analytics/funnels
- **UTM Parameter Best Practices:** https://ga-dev-tools.google/campaign-url-builder/
- **Analytics Events Reference:** `src/libs/analytics/events.ts`
