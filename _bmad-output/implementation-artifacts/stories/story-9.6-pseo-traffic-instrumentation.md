# Story 9.6: pSEO Traffic Instrumentation

Status: done

## Story

As a growth-focused product owner,
I want pSEO pages instrumented with analytics,
so that I can measure which pages drive traffic and conversions.

## Acceptance Criteria

### AC1: pSEO Event Type Definition
**Given** the analytics event system
**When** I review the event definitions
**Then** `pseo_page_viewed` event type exists in EventName union
**And** event properties are typed with: category, slug, referrer
**And** event is categorized under EventCategory.Page
**And** event follows snake_case naming convention

### AC2: Reusable Tracking Component
**Given** the pSEO tracking implementation
**When** Epic 8 team implements pSEO pages
**Then** a reusable PseoPageTracker component exists
**And** component accepts: category (string), slug (string) as props
**And** component tracks `pseo_page_viewed` on mount
**And** component automatically captures referrer from document.referrer
**And** component is client-side only ("use client" directive)
**And** component is documented with usage examples

### AC3: Alternative Hook-Based Tracking
**Given** the pSEO tracking implementation
**When** Epic 8 team prefers hook-based approach
**Then** a usePseoTracking hook exists as alternative
**And** hook accepts: category (string), slug (string) as parameters
**And** hook tracks event on mount via useEffect
**And** hook automatically captures referrer
**And** hook is documented with usage examples

### AC4: Google Search Console Documentation
**Given** the pSEO setup documentation
**When** I review the setup guide
**Then** Google Search Console setup is documented
**And** documentation includes: property verification steps
**And** documentation includes: sitemap submission process
**And** documentation includes: URL inspection tool usage
**And** documentation includes: indexing status verification steps
**And** documentation includes: search performance monitoring setup
**And** documentation is in markdown format

### AC5: Epic 8 Integration Guide
**Given** the integration documentation
**When** Epic 8 team needs to wire up tracking
**Then** integration guide exists with clear instructions
**And** guide includes: component import examples
**And** guide includes: hook import examples
**And** guide includes: property mapping (where category/slug come from)
**And** guide includes: example integration in page component
**And** guide includes: testing checklist
**And** guide references PostHog event verification

### AC6: PostHog Dashboard Setup
**Given** the analytics dashboard documentation
**When** I want to view pSEO metrics
**Then** PostHog dashboard setup guide exists
**And** guide includes: creating pSEO events insight
**And** guide includes: filtering by category property
**And** guide includes: top pages by views query
**And** guide includes: referral sources breakdown
**And** guide includes: conversion funnel setup (pSEO view → signup)
**And** guide provides screenshots or step-by-step instructions

### AC7: Unit Tests for Tracking Utilities
**Given** the tracking implementation
**When** tests are run
**Then** tests exist for PseoPageTracker component
**And** tests verify event is tracked with correct properties
**And** tests verify referrer is captured correctly
**And** tests exist for usePseoTracking hook
**And** tests verify hook tracks on mount only once
**And** all tests pass successfully

### AC8: Development Mode Testing
**Given** development mode (no PostHog key)
**When** tracking code is executed
**Then** events are logged to console
**And** console output shows: event name, category, slug, referrer
**And** no errors are thrown
**And** developer can verify tracking works

## Dependencies

**Depends On:**
- Story 9.1: Analytics Infrastructure Setup (COMPLETED)
- Story 9.2: Event Tracking Utility (COMPLETED)
- Epic 8.5: pSEO pages exist (IN PARALLEL - Epic 8 worktree)

**Blocks:**
- None (Epic 8 team will integrate when pSEO pages are ready)

**Parallel Development Note:**
This story creates the ANALYTICS-SIDE infrastructure for pSEO tracking. Epic 8 team is developing pSEO pages in a separate worktree. When Epic 8 pages are ready, they will wire up the tracking using the utilities created in this story.

## Tasks / Subtasks

- [ ] Task 1: Add pSEO event type definition (AC: #1)
  - [ ] Subtask 1.1: Open `src/libs/analytics/events.ts`
  - [ ] Subtask 1.2: Add `pseo_page_viewed` to EventName type union
  - [ ] Subtask 1.3: Create PseoPageViewedProperties interface
  - [ ] Subtask 1.4: Add required properties: category (string), slug (string)
  - [ ] Subtask 1.5: Add optional property: referrer (string | undefined)
  - [ ] Subtask 1.6: Add pseo_page_viewed to EventPropertiesMap type
  - [ ] Subtask 1.7: Add pseo_page_viewed to EVENT_CATEGORIES with EventCategory.Page
  - [ ] Subtask 1.8: Add JSDoc comments explaining pSEO event purpose
  - [ ] Subtask 1.9: Export PseoPageViewedProperties type
  - [ ] Subtask 1.10: Verify TypeScript compilation succeeds

- [ ] Task 2: Create PseoPageTracker component (AC: #2, #7)
  - [ ] Subtask 2.1: Create file `src/libs/analytics/components/PseoPageTracker.tsx`
  - [ ] Subtask 2.2: Add "use client" directive at top of file
  - [ ] Subtask 2.3: Import trackEvent from '@/libs/analytics'
  - [ ] Subtask 2.4: Import useEffect from React
  - [ ] Subtask 2.5: Define PseoPageTrackerProps interface with category, slug
  - [ ] Subtask 2.6: Create functional component accepting props
  - [ ] Subtask 2.7: Add useEffect to track event on mount
  - [ ] Subtask 2.8: Capture document.referrer in useEffect
  - [ ] Subtask 2.9: Call trackEvent('pseo_page_viewed', { category, slug, referrer })
  - [ ] Subtask 2.10: Add empty dependency array to useEffect (mount only)
  - [ ] Subtask 2.11: Return null (invisible component)
  - [ ] Subtask 2.12: Add JSDoc with usage example
  - [ ] Subtask 2.13: Export component as default and named export

- [ ] Task 3: Create usePseoTracking hook (AC: #3, #7)
  - [ ] Subtask 3.1: Create file `src/libs/analytics/hooks/usePseoTracking.ts`
  - [ ] Subtask 3.2: Import trackEvent from '@/libs/analytics'
  - [ ] Subtask 3.3: Import useEffect from React
  - [ ] Subtask 3.4: Define hook signature: usePseoTracking(category: string, slug: string)
  - [ ] Subtask 3.5: Implement useEffect to track on mount
  - [ ] Subtask 3.6: Capture document.referrer inside useEffect
  - [ ] Subtask 3.7: Call trackEvent('pseo_page_viewed', { category, slug, referrer })
  - [ ] Subtask 3.8: Add dependencies: [category, slug] to useEffect
  - [ ] Subtask 3.9: Add JSDoc with usage example
  - [ ] Subtask 3.10: Export hook as default and named export

- [ ] Task 4: Add unit tests for PseoPageTracker (AC: #7)
  - [ ] Subtask 4.1: Create file `src/libs/analytics/components/__tests__/PseoPageTracker.test.tsx`
  - [ ] Subtask 4.2: Import @testing-library/react utilities
  - [ ] Subtask 4.3: Mock trackEvent function from analytics module
  - [ ] Subtask 4.4: Test: component renders without errors
  - [ ] Subtask 4.5: Test: trackEvent is called on mount
  - [ ] Subtask 4.6: Test: trackEvent receives correct event name
  - [ ] Subtask 4.7: Test: trackEvent receives category and slug props
  - [ ] Subtask 4.8: Test: trackEvent captures referrer from document.referrer
  - [ ] Subtask 4.9: Test: event is tracked only once (not on re-renders)
  - [ ] Subtask 4.10: Run tests and verify all pass

- [ ] Task 5: Add unit tests for usePseoTracking hook (AC: #7)
  - [ ] Subtask 5.1: Create file `src/libs/analytics/hooks/__tests__/usePseoTracking.test.ts`
  - [ ] Subtask 5.2: Import @testing-library/react-hooks utilities
  - [ ] Subtask 5.3: Mock trackEvent function
  - [ ] Subtask 5.4: Test: hook tracks event on mount
  - [ ] Subtask 5.5: Test: hook receives correct parameters
  - [ ] Subtask 5.6: Test: hook captures referrer
  - [ ] Subtask 5.7: Test: hook re-tracks if category/slug change
  - [ ] Subtask 5.8: Test: hook doesn't track on unmount
  - [ ] Subtask 5.9: Run tests and verify all pass

- [ ] Task 6: Create Google Search Console setup guide (AC: #4)
  - [ ] Subtask 6.1: Create file `docs/google-search-console-setup.md`
  - [ ] Subtask 6.2: Add section: "Overview" - what GSC is and why it matters
  - [ ] Subtask 6.3: Add section: "Prerequisites" - domain ownership requirements
  - [ ] Subtask 6.4: Add section: "Property Verification" with step-by-step instructions
  - [ ] Subtask 6.5: Document verification methods: HTML file, DNS, meta tag
  - [ ] Subtask 6.6: Add section: "Sitemap Submission" with XML sitemap URL format
  - [ ] Subtask 6.7: Document how to submit sitemap via GSC interface
  - [ ] Subtask 6.8: Add section: "URL Inspection Tool" usage
  - [ ] Subtask 6.9: Document how to request indexing for new pSEO pages
  - [ ] Subtask 6.10: Add section: "Indexing Status Verification" with screenshots
  - [ ] Subtask 6.11: Document how to check coverage report
  - [ ] Subtask 6.12: Add section: "Search Performance Monitoring" setup
  - [ ] Subtask 6.13: Document key metrics to track: impressions, clicks, CTR, position
  - [ ] Subtask 6.14: Add troubleshooting tips for common indexing issues
  - [ ] Subtask 6.15: Add links to official Google documentation

- [ ] Task 7: Create Epic 8 integration guide (AC: #5)
  - [ ] Subtask 7.1: Create file `docs/pseo-tracking-integration.md`
  - [ ] Subtask 7.2: Add section: "Overview" - purpose of pSEO tracking
  - [ ] Subtask 7.3: Add section: "Quick Start" with minimal example
  - [ ] Subtask 7.4: Document component-based approach with import example
  - [ ] Subtask 7.5: Show PseoPageTracker usage in page component
  - [ ] Subtask 7.6: Explain where category and slug values come from (route params)
  - [ ] Subtask 7.7: Document hook-based approach with import example
  - [ ] Subtask 7.8: Show usePseoTracking usage in page component
  - [ ] Subtask 7.9: Add section: "Testing Your Integration" checklist
  - [ ] Subtask 7.10: Document how to verify events in browser console (dev mode)
  - [ ] Subtask 7.11: Document how to verify events in PostHog (production)
  - [ ] Subtask 7.12: Add section: "Common Pitfalls" and solutions
  - [ ] Subtask 7.13: Add examples for different pSEO page types
  - [ ] Subtask 7.14: Add section: "Advanced Usage" for custom properties
  - [ ] Subtask 7.15: Link to PostHog dashboard setup guide

- [ ] Task 8: Create PostHog dashboard setup guide (AC: #6)
  - [ ] Subtask 8.1: Create file `docs/posthog-pseo-dashboard.md`
  - [ ] Subtask 8.2: Add section: "Overview" - pSEO metrics overview
  - [ ] Subtask 8.3: Add section: "Creating Basic Insights"
  - [ ] Subtask 8.4: Document how to create "pSEO Page Views" insight (total count)
  - [ ] Subtask 8.5: Document how to filter events by event name = 'pseo_page_viewed'
  - [ ] Subtask 8.6: Add section: "Top Pages by Category"
  - [ ] Subtask 8.7: Document how to break down by 'category' property
  - [ ] Subtask 8.8: Add section: "Top Individual Pages"
  - [ ] Subtask 8.9: Document how to break down by 'slug' property
  - [ ] Subtask 8.10: Add section: "Referral Sources Analysis"
  - [ ] Subtask 8.11: Document how to break down by 'referrer' property
  - [ ] Subtask 8.12: Add section: "Conversion Funnel Setup"
  - [ ] Subtask 8.13: Document funnel steps: pseo_page_viewed → signup_started → signup_completed
  - [ ] Subtask 8.14: Add section: "Time Series Analysis"
  - [ ] Subtask 8.15: Document how to create trend charts for pSEO traffic
  - [ ] Subtask 8.16: Add screenshots or numbered steps for each insight type
  - [ ] Subtask 8.17: Add section: "Dashboard Organization" best practices
  - [ ] Subtask 8.18: Link to PostHog official documentation

- [ ] Task 9: Update main analytics index exports (AC: #2, #3)
  - [ ] Subtask 9.1: Open `src/libs/analytics/index.ts`
  - [ ] Subtask 9.2: Export PseoPageTracker component
  - [ ] Subtask 9.3: Export usePseoTracking hook
  - [ ] Subtask 9.4: Export PseoPageViewedProperties type
  - [ ] Subtask 9.5: Add JSDoc comments for new exports
  - [ ] Subtask 9.6: Verify all exports are accessible from '@/libs/analytics'

- [ ] Task 10: Manual testing in development mode (AC: #8)
  - [ ] Subtask 10.1: Create test page using PseoPageTracker component
  - [ ] Subtask 10.2: Start dev server without NEXT_PUBLIC_POSTHOG_KEY
  - [ ] Subtask 10.3: Navigate to test page
  - [ ] Subtask 10.4: Open browser console
  - [ ] Subtask 10.5: Verify `pseo_page_viewed` event is logged
  - [ ] Subtask 10.6: Verify console shows category, slug, referrer
  - [ ] Subtask 10.7: Verify no errors in console
  - [ ] Subtask 10.8: Test with hook-based approach
  - [ ] Subtask 10.9: Verify same behavior as component
  - [ ] Subtask 10.10: Document test results

## Dev Notes

### Context
This story creates the analytics infrastructure for pSEO (Programmatic SEO) tracking. Epic 8 is developing pSEO pages in a separate worktree in parallel. This story focuses on:
1. Event type definitions
2. Reusable tracking utilities (component + hook)
3. Documentation for integration and analysis
4. Unit tests

The actual integration into pSEO pages will be done by Epic 8 team using the utilities created here.

### Technical Approach

**Event Definition:**
- Add `pseo_page_viewed` to existing event system
- Follows same patterns as existing events (page_viewed, landing_viewed)
- Type-safe properties: category, slug, referrer

**Tracking Options:**
Two approaches provided for Epic 8 team flexibility:
1. **Component-based**: `<PseoPageTracker category="tools" slug="password-generator" />`
2. **Hook-based**: `usePseoTracking('tools', 'password-generator')`

Both capture referrer automatically from `document.referrer`.

**Documentation Strategy:**
- Google Search Console: External SEO infrastructure
- Integration Guide: For Epic 8 developers
- PostHog Dashboard: For product owner analytics

### File Structure
```
src/libs/analytics/
├── components/
│   ├── PseoPageTracker.tsx
│   └── __tests__/
│       └── PseoPageTracker.test.tsx
├── hooks/
│   ├── usePseoTracking.ts
│   └── __tests__/
│       └── usePseoTracking.test.ts
├── events.ts (updated)
└── index.ts (updated)

docs/
├── google-search-console-setup.md
├── pseo-tracking-integration.md
└── posthog-pseo-dashboard.md
```

### Testing Strategy
- Unit tests for component and hook using React Testing Library
- Mock trackEvent function to verify calls
- Test referrer capture
- Test mount-only tracking (no re-tracking on re-render)
- Manual console testing in dev mode

### Integration Example (for Epic 8)
```tsx
// Option 1: Component-based (recommended for simple cases)
import { PseoPageTracker } from '@/libs/analytics';

export default async function PseoPage({ params }) {
  const { category, slug } = await params;

  return (
    <>
      <PseoPageTracker category={category} slug={slug} />
      {/* page content */}
    </>
  );
}

// Option 2: Hook-based (recommended for complex logic)
'use client';
import { usePseoTracking } from '@/libs/analytics';

export function PseoPageClient({ category, slug }) {
  usePseoTracking(category, slug);

  return (
    {/* page content */}
  );
}
```

### PostHog Analysis Examples

**Top Pages Query:**
```
Event: pseo_page_viewed
Breakdown: properties.slug
Sort: Count descending
Limit: 20
```

**Category Performance:**
```
Event: pseo_page_viewed
Breakdown: properties.category
Visualization: Bar chart
```

**Conversion Funnel:**
```
Step 1: pseo_page_viewed
Step 2: signup_started
Step 3: signup_completed
Breakdown: properties.category (to see which categories convert best)
```

### Caveats & Considerations

1. **No pSEO Pages Yet**: This story creates utilities only. Integration happens when Epic 8 pages are ready.
2. **Referrer Limitations**: `document.referrer` is empty for direct traffic or same-origin navigation
3. **Client-Side Only**: Tracking requires JavaScript enabled (SEO pages should still work without JS)
4. **Privacy**: No PII captured, just category/slug/referrer
5. **Testing**: Use console logs in dev, PostHog in production

### Definition of Done
- [x] pSEO event type added to events.ts
- [x] PseoPageTracker component created and tested
- [x] usePseoTracking hook created and tested
- [x] All unit tests passing
- [x] Google Search Console setup guide written
- [x] Epic 8 integration guide written
- [x] PostHog dashboard guide written
- [x] Manual dev mode testing completed
- [x] Code review completed
- [x] Documentation reviewed

### Notes
- This is the final story in Epic 9 (Analytics & Founder Dashboard)
- No UI changes in this story - purely infrastructure and docs
- Epic 8 team has been notified of tracking utilities availability
- Consider adding pSEO metrics to founder dashboard in future iteration
