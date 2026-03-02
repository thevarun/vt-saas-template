# Epic 9: Analytics & Founder Dashboard

**Goal:** Product owner can track user behavior and key conversion metrics

**Design Artifact:** [epic-9-analytics-dashboard-design.md](../ux-design/epic-9-analytics-dashboard-design.md)

**Parallel Development Notes:**
- Epic 9 can run in parallel with Epic 8
- **Analytics hook points from Epic 8**: When Epic 9 analytics infrastructure is ready, wire up the documented hook points in Epic 8 components
- **Dependency**: Story 9.6 requires Epic 8.5 (pSEO pages) to exist

## Story 9.1: Analytics Infrastructure Setup (PostHog)

As a **template user (developer)**,
I want **analytics infrastructure configured with PostHog**,
So that **I can track user behavior and make data-driven decisions**.

**Acceptance Criteria:**

**Given** the analytics setup
**When** I configure PostHog
**Then** NEXT_PUBLIC_POSTHOG_KEY environment variable is documented
**And** NEXT_PUBLIC_POSTHOG_HOST is configurable
**And** .env.example includes required variables

**Given** the analytics library setup
**When** I review the code structure
**Then** there is an analytics module at `src/libs/analytics/`
**And** the module abstracts the provider (swappable later)
**And** TypeScript types are defined for events

**Given** PostHog initialization
**When** the app loads
**Then** PostHog client is initialized
**And** initialization happens client-side only
**And** user is identified when authenticated

**Given** privacy considerations
**When** analytics is configured
**Then** IP anonymization is enabled by default
**And** session recording is opt-in (not default)
**And** cookie consent integration is documented

**Given** development mode
**When** NEXT_PUBLIC_POSTHOG_KEY is not set
**Then** analytics events are logged to console
**And** no errors are thrown
**And** developer can see what would be tracked

**Given** the analytics provider abstraction
**When** I want to swap to Amplitude or custom
**Then** interface is clearly defined
**And** implementation can be swapped without app changes
**And** documentation explains how to swap providers

---

## Story 9.2: Event Tracking Utility

As a **developer implementing features**,
I want **a simple, type-safe way to track events**,
So that **I can instrument features without friction**.

**Acceptance Criteria:**

**Given** the trackEvent utility
**When** I call it in my code
**Then** signature is `trackEvent(eventName, properties?)`
**And** eventName is typed (string literal union or enum)
**And** properties are typed per event

**Given** tracking an event
**When** I call `trackEvent('signup_completed', { method: 'email' })`
**Then** event is sent to analytics provider
**And** user context is automatically attached
**And** timestamp is automatically added

**Given** the event types
**When** I review the type definitions
**Then** all standard events are defined
**And** properties for each event are typed
**And** TypeScript catches incorrect usage

**Given** event categories
**When** I review the event schema
**Then** events are organized by category (auth, onboarding, feature)
**And** naming convention is consistent (snake_case)
**And** event names are descriptive and specific

**Given** development mode
**When** analytics provider is not configured
**Then** events are logged to console with full details
**And** console output shows: event name, properties, timestamp
**And** helps debugging without sending real events

**Given** server-side tracking needs
**When** I need to track from API routes
**Then** server-side tracking utility exists
**And** uses PostHog server-side API
**And** includes user identification if available

---

## Story 9.3: Core User Flow Instrumentation

As a **product owner**,
I want **key user actions automatically tracked**,
So that **I understand how users interact with the product**.

**Acceptance Criteria:**

**Given** user signup
**When** registration is completed
**Then** `signup_completed` event is tracked
**And** properties include: method (email/google/github)
**And** user is identified in analytics

**Given** user login
**When** login is successful
**Then** `login_completed` event is tracked
**And** properties include: method (email/google/github)
**And** session context is updated

**Given** onboarding flow
**When** user progresses through steps
**Then** `onboarding_step_completed` is tracked for each step
**And** properties include: step_number, step_name
**And** `onboarding_completed` is tracked on finish
**And** `onboarding_skipped` is tracked if skipped

**Given** core feature usage
**When** user uses key features
**Then** relevant events are tracked
**And** examples: feedback_submitted, profile_updated
**And** events include contextual properties

**Given** page views
**When** user navigates between pages
**Then** page views are tracked automatically
**And** PostHog autocapture handles this
**And** custom page view events optional

**Given** error occurrences
**When** significant errors happen
**Then** error events are tracked
**And** properties include: error_type, error_message (sanitized)
**And** sensitive data is NOT included

---

## Story 9.4: Conversion Funnel Tracking

As a **product owner**,
I want **to track conversion funnels**,
So that **I can identify and fix drop-off points**.

**Acceptance Criteria:**

**Given** the signup-to-activation funnel
**When** I review tracked events
**Then** funnel stages are trackable
**And** stages: landing_viewed → signup_started → signup_completed → onboarding_started → onboarding_completed → first_action

**Given** each funnel stage
**When** user reaches that stage
**Then** corresponding event is tracked
**And** events are ordered correctly
**And** timestamps enable time-based analysis

**Given** funnel configuration in PostHog
**When** I set up funnel analysis
**Then** events align with PostHog funnel requirements
**And** conversion rates are calculable
**And** drop-off points are visible

**Given** activation metrics
**When** user completes key action
**Then** `user_activated` event is tracked
**And** activation is defined (e.g., completed onboarding + first feature use)
**And** activation time from signup is calculable

**Given** referral tracking
**When** user arrives via referral link
**Then** referral source is captured
**And** `referred_signup` event includes referrer info
**And** referral conversions are trackable

**Given** feature adoption tracking
**When** user uses a feature for first time
**Then** `feature_first_use` event is tracked
**And** properties include: feature_name
**And** feature adoption rates are calculable

---

## Story 9.5: Founder Analytics Dashboard

As a **product owner (founder)**,
I want **an internal dashboard with key metrics**,
So that **I can monitor the business without external tools**.

**Acceptance Criteria:**

**Given** the founder dashboard
**When** I access /admin/analytics (or /founder)
**Then** I see key metrics displayed
**And** metrics are pulled from PostgreSQL (not PostHog)
**And** dashboard is admin-only protected

**Given** the key metrics displayed
**When** I view the dashboard
**Then** I see: Total Users, Signups (7d, 30d), Active Users (7d)
**And** I see: Activation Rate, Onboarding Completion Rate
**And** I see: Feedback Count, optional: Error Count

**Given** each metric
**When** displayed on dashboard
**Then** current value is shown prominently
**And** trend indicator shows change vs previous period
**And** sparkline or mini-chart shows recent trend (optional)

**Given** signups over time
**When** I view the signups section
**Then** I see a chart showing daily signups (last 30 days)
**And** chart is simple and clear (line or bar)
**And** total for period is shown

**Given** the data source
**When** metrics are calculated
**Then** queries run against PostgreSQL directly
**And** queries are efficient (indexed columns)
**And** data is real-time or near-real-time

**Given** the dashboard on mobile
**When** I view on small screens
**Then** layout adapts appropriately
**And** metrics stack vertically
**And** charts resize or simplify

**Given** dashboard performance
**When** page loads
**Then** initial load is fast (skeleton states)
**And** heavy queries don't block render
**And** caching is used where appropriate

---

## Story 9.6: pSEO Traffic Instrumentation

As a **growth-focused product owner**,
I want **pSEO pages instrumented with analytics**,
So that **I can measure which pages drive traffic and conversions**.

**Acceptance Criteria:**

**Given** pSEO page analytics
**When** a user views a pSEO page
**Then** `pseo_page_viewed` event is tracked via analytics utility (from 9.1-9.2)
**And** properties include: category, slug, referrer

**Given** search indexing documentation
**When** I review the setup guide
**Then** Google Search Console setup is documented
**And** steps for verifying pSEO page indexing are included

**Given** pSEO performance visibility
**When** I review analytics
**Then** dashboard or PostHog view shows pSEO page performance metrics
**And** metrics include: page views, top pages, referral sources

**Given** dependencies
**When** I review the implementation order
**Then** depends on: Story 8.5 (pSEO pages exist)
**And** depends on: Stories 9.1-9.2 (analytics infrastructure)

---
