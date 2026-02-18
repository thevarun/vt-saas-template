# Analytics Funnels

This document describes the conversion funnels implemented in VT SaaS Template and how to analyze them in PostHog.

## Overview

Funnels help you understand user conversion at each stage of critical journeys. By tracking drop-off points, you can identify friction and optimize conversion rates.

---

## Signup-to-Activation Funnel

The primary funnel tracking user journey from first landing to product activation.

### Funnel Steps

1. **landing_viewed** - User visits the landing page
2. **signup_started** - User navigates to signup page
3. **signup_completed** - User successfully signs up (email/OAuth)
4. **onboarding_started** - User begins onboarding flow
5. **onboarding_completed** - User finishes onboarding
6. **user_activated** - User performs first meaningful action

### PostHog Configuration

#### Creating the Funnel

1. Navigate to PostHog → **Insights** → **New Funnel**
2. Add events in order:
   - Step 1: `landing_viewed`
   - Step 2: `signup_started`
   - Step 3: `signup_completed`
   - Step 4: `onboarding_started`
   - Step 5: `onboarding_completed`
   - Step 6: `user_activated`
3. Set **Conversion Window**: 30 days (industry standard for SaaS activation)
4. Click **Save & Run**

#### Optional Filters

Filter by properties to segment analysis:

- **Signup Method**: `method = email` vs `method = google` vs `method = github`
- **Locale**: `locale = en` vs `locale = hi` vs `locale = bn`
- **Referral Source**: `utm_source = google`, `ref = friend123`, etc.
- **Activation Trigger**: `activation_trigger = feedback_submitted` vs `profile_updated`

**Example filter:**
```
Where signup_completed.method = 'email'
```

---

## Drop-off Analysis

Understanding where users abandon the funnel helps prioritize improvements.

### Common Drop-off Points

#### Landing → Signup Started
**Indicates:** Landing page effectiveness
- Low conversion? Landing page may not communicate value clearly
- Check: Messaging, CTA placement, page load speed
- Benchmark: 15-30% conversion rate

#### Signup Started → Signup Completed
**Indicates:** Signup form friction
- Low conversion? Form may be too complex or have errors
- Check: Form validation, error messages, OAuth flow
- Benchmark: 60-80% conversion rate

#### Signup Completed → Onboarding Started
**Indicates:** Post-signup drop-off
- Low conversion? Verification email issues or redirect problems
- Check: Email delivery, verification flow, automatic redirects
- Benchmark: 85-95% conversion rate

#### Onboarding Started → Onboarding Completed
**Indicates:** Onboarding friction
- Low conversion? Onboarding may be too long or confusing
- Check: Number of steps, clarity of instructions, skip option usage
- Benchmark: 70-85% conversion rate

#### Onboarding Completed → User Activated
**Indicates:** Product value perception
- Low conversion? Users may not understand product value
- Check: Feature discovery, empty states, onboarding guidance
- Benchmark: 40-60% conversion rate within 30 days

---

## Feature Adoption Tracking

Track which features users engage with after activation.

### Feature First Use Event

All features are instrumented with `feature_first_use` event:

```typescript
trackFeatureFirstUse('feedback_widget')
trackFeatureFirstUse('profile_edit')
trackFeatureFirstUse('chat')
```

### Calculating Adoption Rate in PostHog

1. Navigate to **Insights** → **Trends**
2. Select event: `feature_first_use`
3. Add filter: `feature_name = 'feedback_widget'`
4. Change visualization to **Unique users**
5. Compare to total user count

**Formula:**
```
Adoption Rate = (Users with feature_first_use / Total Users) × 100
```

### Feature Adoption Funnel

Track progression through features:

1. `onboarding_completed`
2. `feature_first_use` (filter: `feature_name = 'feedback_widget'`)
3. `feature_first_use` (filter: `feature_name = 'profile_edit'`)

---

## Referred Signup Analysis

Measure effectiveness of referral campaigns.

### Events

- **referred_signup** - Tracks signups with referral source
- Properties: `referral_source`, `referrer_user_id`

### PostHog Analysis

#### Referral Conversion Rate

1. Create funnel: `landing_viewed` → `signup_completed`
2. Add filter: `landing_viewed.utm_source exists` or `landing_viewed.ref exists`
3. Compare conversion vs. non-referred users

#### Referral Source Breakdown

1. Navigate to **Insights** → **Trends**
2. Select event: `referred_signup`
3. Break down by: `referral_source`
4. Visualization: Bar chart

**Common referral sources:**
- `utm_source=google` - Paid ads
- `utm_source=facebook` - Social media
- `ref=user-{id}` - User referral links

---

## Time-Based Analysis

### Conversion Windows

Different funnels have different natural timeframes:

- **Landing → Signup**: 7 days (acquisition)
- **Signup → Activation**: 30 days (onboarding + first value)
- **Activation → Feature Adoption**: 60 days (product exploration)

### Cohort Analysis

Compare funnel performance across user cohorts:

1. Create funnel (as above)
2. Navigate to **Insights** → **Funnels**
3. Add **Cohort**: Group by signup date (weekly/monthly)
4. Identify trends: Are newer cohorts converting better?

---

## Activation Criteria

Users are marked as "activated" when they meet these criteria:

1. **Completed onboarding** (all steps finished)
2. **Performed first meaningful action**:
   - Submitted feedback (`activation_trigger = 'feedback_submitted'`)
   - Updated profile (`activation_trigger = 'profile_updated'`)
   - Used chat feature (`activation_trigger = 'chat_used'`)

### Activation Time Distribution

Analyze how quickly users activate:

1. Navigate to **Insights** → **Trends**
2. Select event: `user_activated`
3. Break down by: `activation_time_seconds`
4. Create histogram with buckets:
   - 0-3600s (< 1 hour)
   - 3600-86400s (1-24 hours)
   - 86400-604800s (1-7 days)
   - 604800-2592000s (7-30 days)

---

## Advanced Filtering

### A/B Test Analysis

If running experiments, filter funnels by variant:

```
Where experiment_variant = 'control'
vs
Where experiment_variant = 'treatment'
```

### Exclusion Steps

Remove users who churned mid-funnel:

1. In funnel editor, click **Add exclusion step**
2. Select event: `account_deleted`
3. Apply between steps 3-6

This gives cleaner conversion rates by excluding users who intentionally left.

---

## Event Reference

### Funnel Events

| Event | Properties | Description |
|-------|-----------|-------------|
| `landing_viewed` | `page_url`, `locale`, `referrer`, `utm_*`, `ref` | User visits landing page |
| `signup_started` | (none) | User loads signup form |
| `signup_completed` | `method` | User completes signup |
| `referred_signup` | `referral_source`, `referrer_user_id` | Referred user signs up |
| `onboarding_started` | (none) | User begins onboarding |
| `onboarding_step_completed` | `step_number`, `step_name` | User completes onboarding step |
| `onboarding_completed` | `total_steps`, `duration_seconds` | User finishes onboarding |
| `user_activated` | `activation_trigger`, `activation_time_seconds` | User reaches activation milestone |

### UTM Parameters

All landing page views capture UTM parameters:

- `utm_source` - Traffic source (google, facebook, email)
- `utm_medium` - Medium (cpc, social, email)
- `utm_campaign` - Campaign name
- `utm_content` - Ad content identifier
- `utm_term` - Paid search keyword

### Referral Parameters

- `ref` - Referral code (e.g., `friend123`, `user-456`)
- `referrer` - Alternative referral parameter

---

## Best Practices

### 1. Regular Monitoring

Check funnels weekly to catch degradation early:
- Set up PostHog alerts for drop-off rate increases
- Compare week-over-week performance
- Investigate sudden changes immediately

### 2. Segmentation

Don't analyze aggregate data only:
- Break down by signup method (email vs OAuth)
- Compare referral sources
- Analyze by locale/language

### 3. Attribution

Funnel uses **first-touch attribution**:
- First referral source is captured and persists through signup
- Subsequent referral parameters are ignored
- This prevents attribution hijacking

### 4. Data Quality

Ensure clean tracking:
- Test all funnel steps in staging before deploying
- Use PostHog's data validation to catch tracking issues
- Monitor event volume daily

---

## Implementation Details

### Client-Side Tracking

Most events are tracked client-side using the analytics utility:

```typescript
import { trackEvent, trackLandingViewed } from '@/libs/analytics'

// Generic event
trackEvent('signup_started', {})

// Helper function
trackLandingViewed({
  page_url: window.location.href,
  locale: 'en',
  utm_source: 'google'
})
```

### Referral Persistence

Referral information is stored in sessionStorage:
- Captured on landing page load
- Persists through signup flow
- Cleared after signup completion

### Activation State

Activation is tracked in localStorage to prevent duplicate events:
- `onboarding_completed` - Set when onboarding finishes
- `user_activated` - Set when activation event fires
- State checked before tracking activation

---

## Troubleshooting

### Event Not Appearing in PostHog

1. Check browser console for tracking errors
2. Verify PostHog API key is configured (`NEXT_PUBLIC_POSTHOG_KEY`)
3. Check network tab for PostHog requests
4. In dev mode, events are logged to console (PostHog disabled)

### Funnel Conversion Seems Wrong

1. Verify conversion window is appropriate (30 days for activation)
2. Check for duplicate events (user refreshing page)
3. Ensure events are tracked in correct order
4. Review exclusion steps that might filter users

### Referral Attribution Missing

1. Verify URL parameters are present: `?ref=xyz` or `?utm_source=xyz`
2. Check sessionStorage has `analytics_referral` key
3. Ensure `SignupCompletedTracker` is mounted in onboarding
4. Confirm referral info is cleared after signup

---

## Related Documentation

- [Analytics Infrastructure](./analytics-infrastructure.md) - PostHog setup and provider configuration
- [Event Tracking Guide](./event-tracking.md) - How to add new events
- [Privacy & Compliance](./analytics-privacy.md) - GDPR and data handling

---

**Last Updated:** 2026-02-10
**Story:** Epic 9.4 - Conversion Funnel Tracking
