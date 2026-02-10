# Story 9.5: Founder Analytics Dashboard

**Epic:** Epic 9 - Analytics & Founder Dashboard
**Story ID:** 9.5
**Created:** 2026-02-10
**Status:** ready-for-dev

## User Story

As a **product owner (founder)**,
I want **an internal dashboard with key metrics**,
So that **I can monitor the business without external tools**.

## Context

Stories 9.1-9.4 established the analytics foundation:
- **9.1**: Analytics infrastructure with PostHog, provider abstraction
- **9.2**: Type-safe event tracking with helpers
- **9.3**: Core user flows instrumented (auth, onboarding, feedback, profile, errors)
- **9.4**: Conversion funnel tracking (landing, signup, activation, referral, feature adoption)

**This story adds:**
1. **Admin-only analytics dashboard page** at `/admin/analytics`
2. **Key business metrics** pulled directly from PostgreSQL (not PostHog)
3. **Responsive UI components** with trend indicators, charts, and completion rates
4. **Fast loading experience** with skeleton states and caching

**Important:** This dashboard displays **real-time data from the database**, not PostHog analytics. PostHog is for behavioral tracking; this dashboard is for business KPIs.

## Acceptance Criteria

### AC1: Dashboard Route and Access Control

**Given** the analytics dashboard route
**When** I navigate to `/admin/analytics` (or `/{locale}/admin/analytics`)
**Then** the route exists under the existing admin panel structure
**And** only users with admin role can access it
**And** non-admin users are redirected to main dashboard
**And** middleware protects this route automatically

**Given** the admin navigation
**When** I view the admin panel sidebar
**Then** I see an "Analytics" navigation item
**And** the item is active when on analytics page
**And** clicking it navigates to `/admin/analytics`

### AC2: Key Metrics Display

**Given** the analytics dashboard
**When** the page loads
**Then** I see the following metrics in card format:
- Total Users (all-time count)
- Signups (7 days)
- Signups (30 days)
- Active Users (7 days)
- Activation Rate (percentage)

**Given** each metric card
**When** displayed
**Then** the card shows:
- Label (metric name)
- Value (prominently displayed)
- Trend indicator (up/down/neutral with percentage change)
- Trend comparison vs previous period (e.g., "+12% vs last 7 days")

**Given** the metrics grid
**When** viewed on desktop (≥1200px)
**Then** metrics display in a single row (5 columns)
**And** all cards are equal width

**Given** the metrics grid
**When** viewed on tablet (768px - 1199px)
**Then** metrics wrap to 2 rows (3 + 2 layout)

**Given** the metrics grid
**When** viewed on mobile (<768px)
**Then** metrics stack vertically (1 column)

### AC3: Completion Rates Section

**Given** the completion rates card
**When** displayed on the dashboard
**Then** I see the following rates:
- Onboarding Completion Rate (percentage + progress bar)
- Activation Rate (percentage + progress bar)
- Total Feedback Count (plain number)

**Given** each completion rate
**When** displayed
**Then** the rate shows:
- Label
- Percentage value (e.g., "78%")
- Progress bar visualization
- Clean, scannable layout

**Given** the feedback count
**When** displayed
**Then** it shows total count only (no progress bar)
**And** format is "X total" (e.g., "42 total")

### AC4: Signups Over Time Chart

**Given** the signups chart
**When** displayed on the dashboard
**Then** I see a chart showing daily signups for last 30 days
**And** chart type is area chart with gradient fill
**And** X-axis shows dates
**And** Y-axis shows signup count (auto-scaled)
**And** chart includes tooltip on hover showing date + count

**Given** the chart visual style
**When** I review the design
**Then** it uses primary color gradient fill
**And** line stroke is 2px
**And** chart height is appropriate (300px)
**And** chart works in dark mode

**Given** the chart on desktop (≥1200px)
**When** displayed
**Then** chart takes 2/3 width of the section
**And** completion rates card takes 1/3 width
**And** both are side-by-side

**Given** the chart on tablet/mobile
**When** displayed
**Then** chart and rates card stack vertically
**And** both are full width

### AC5: Data Source and Queries

**Given** the metrics data source
**When** metrics are calculated
**Then** all data comes from PostgreSQL (NOT PostHog)
**And** queries use Drizzle ORM
**And** queries are efficient (use indexed columns)

**Given** the data fetching approach
**When** I review the implementation
**Then** data is fetched server-side in page component
**And** API endpoint exists at `GET /api/admin/analytics`
**And** endpoint is protected (admin-only)
**And** data fetching logic is in `src/libs/api/admin/analytics.ts`

**Given** the database queries
**When** calculating metrics
**Then** queries include:
- Total Users: `COUNT(*)` from `auth.users`
- Signups (7d): `COUNT(*)` WHERE `created_at > NOW() - 7 days`
- Signups (30d): `COUNT(*)` WHERE `created_at > NOW() - 30 days`
- Active Users (7d): `COUNT(*)` WHERE `last_sign_in_at > NOW() - 7 days`
- Activation Rate: Calculated from onboarding completion or activation events
- Onboarding Completion: Based on user metadata or separate tracking
- Feedback Count: `COUNT(*)` from `health_companion.feedback`

**Given** trend calculations
**When** displaying trend indicators
**Then** trends compare current period vs previous period:
- 7d metrics: Compare to previous 7 days (days -14 to -7)
- 30d metrics: Compare to previous 30 days (days -60 to -30)
- Rates: Compare to previous period calculation

### AC6: Loading States

**Given** the dashboard on initial load
**When** page renders before data arrives
**Then** skeleton loading states are displayed
**And** skeleton layout matches final layout
**And** metric cards show skeleton for label, value, trend
**And** chart shows skeleton block
**And** rates card shows skeleton for each rate

**Given** the skeleton pattern
**When** I review the implementation
**Then** skeleton components are separate, reusable
**And** skeleton uses shadcn `Skeleton` component
**And** loading state doesn't shift layout (CLS prevention)

### AC7: Mobile Responsiveness

**Given** the dashboard on mobile devices
**When** I view on small screens (<768px)
**Then** all metrics are readable and accessible
**And** cards stack vertically
**And** chart maintains aspect ratio
**And** text sizes are appropriate
**And** touch targets are at least 44x44px

**Given** the dashboard on tablet devices
**When** I view on medium screens (768px - 1199px)
**Then** layout adapts to 2-column where appropriate
**And** chart remains readable
**And** no horizontal scrolling occurs

### AC8: Performance and Caching

**Given** the dashboard performance
**When** page loads
**Then** initial load is fast (skeleton appears immediately)
**And** heavy queries don't block page render
**And** React Suspense is used for async data loading

**Given** the API endpoint
**When** metrics are requested
**Then** response is fast (<500ms for typical dataset)
**And** appropriate database indexes exist
**And** queries are optimized (no N+1 queries)

**Given** caching strategy
**When** I review the implementation
**Then** metrics are cached appropriately (e.g., 1-5 minute cache)
**And** cache invalidation is documented
**And** fresh data is available on refresh

## Implementation Plan

### Phase 1: Install Chart Component

**Command to run:**
```bash
npx shadcn@latest add chart
```

This installs `recharts` library and shadcn chart primitives.

### Phase 2: Create Component Structure

**New files to create:**

```
src/components/admin/analytics/
├── MetricCard.tsx              # Reusable metric card with trend
├── MetricCardSkeleton.tsx      # Loading state for metric card
├── SignupsChart.tsx            # Area chart for signups over time
├── SignupsChartSkeleton.tsx    # Loading state for chart
├── CompletionRatesCard.tsx     # Progress bars for rates
├── AnalyticsDashboard.tsx      # Main dashboard layout component
└── AnalyticsSkeleton.tsx       # Full dashboard skeleton
```

### Phase 3: Implement MetricCard Component

**File:** `src/components/admin/analytics/MetricCard.tsx`

**Interface:**
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string; // e.g., "+12%" or "No change"
    percentage: number; // Raw percentage for calculations
  };
  isLoading?: boolean;
}
```

**Visual specifications:**
- Use shadcn `Card` component
- Trend up: Green text + `TrendingUp` icon from lucide-react
- Trend down: Red text + `TrendingDown` icon
- Trend neutral: Gray text + `Minus` icon
- Hover effect: subtle shadow
- Padding: p-6
- Label: text-sm text-muted-foreground
- Value: text-3xl font-bold
- Trend: text-sm with icon

**File:** `src/components/admin/analytics/MetricCardSkeleton.tsx`

**Skeleton structure:**
```typescript
<Card className="p-6">
  <Skeleton className="h-4 w-24 mb-2" /> {/* Label */}
  <Skeleton className="h-8 w-16 mb-2" /> {/* Value */}
  <Skeleton className="h-4 w-32" /> {/* Trend */}
</Card>
```

### Phase 4: Implement SignupsChart Component

**File:** `src/components/admin/analytics/SignupsChart.tsx`

**Dependencies:**
```typescript
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
```

**Data interface:**
```typescript
interface ChartData {
  date: string;      // "Jan 1", "Jan 2", etc.
  signups: number;
}

interface SignupsChartProps {
  data: ChartData[];
  isLoading?: boolean;
}
```

**Chart configuration:**
- Type: Area chart
- Fill: Gradient from primary color to transparent
- Stroke: Primary color, 2px
- Height: 300px
- Responsive: Use ResponsiveContainer
- Tooltip: Show date + signup count
- Grid: Light grid lines
- X-axis: Date labels (abbreviated)
- Y-axis: Auto-scaled signup count

**File:** `src/components/admin/analytics/SignupsChartSkeleton.tsx`

**Skeleton structure:**
```typescript
<Card className="xl:col-span-2 p-6">
  <Skeleton className="h-6 w-48 mb-4" /> {/* Title */}
  <Skeleton className="h-[300px] w-full" /> {/* Chart area */}
</Card>
```

### Phase 5: Implement CompletionRatesCard Component

**File:** `src/components/admin/analytics/CompletionRatesCard.tsx`

**Interface:**
```typescript
interface CompletionRatesCardProps {
  onboardingCompletion: number; // Percentage
  activationRate: number; // Percentage
  feedbackCount: number; // Total count
  isLoading?: boolean;
}
```

**Visual structure:**
- Use shadcn `Card` component
- Use shadcn `Progress` component for progress bars
- Layout: Vertical stack with spacing
- Each rate:
  - Label (text-sm text-muted-foreground)
  - Progress bar (full width)
  - Percentage (text-lg font-semibold)
- Feedback count:
  - Label
  - Count value (no progress bar)
  - Format: "X total"

**Styling:**
```typescript
// Progress bar colors
onboarding: primary
activation: primary
```

### Phase 6: Create API Endpoint

**File:** `src/app/api/admin/analytics/route.ts`

**Route handler:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/libs/supabase/server';
import { getAnalyticsMetrics } from '@/libs/api/admin/analytics';
import { unauthorizedError, internalError } from '@/libs/api/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedError('Authentication required');
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return unauthorizedError('Admin access required');
    }

    // Fetch metrics
    const metrics = await getAnalyticsMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return internalError('Failed to fetch analytics');
  }
}
```

### Phase 7: Implement Data Fetching Logic

**File:** `src/libs/api/admin/analytics.ts`

**Functions to implement:**

```typescript
import { db } from '@/libs/DB';
import { sql } from 'drizzle-orm';
import { feedback } from '@/models/Schema';

export interface AnalyticsMetrics {
  totalUsers: { value: number; trend: TrendData };
  signups7d: { value: number; trend: TrendData };
  signups30d: { value: number; trend: TrendData };
  activeUsers7d: { value: number; trend: TrendData };
  activationRate: { value: number; trend: TrendData };
  onboardingCompletion: { value: number; trend: TrendData };
  feedbackCount: { value: number; trend: TrendData };
  signupsChart: Array<{ date: string; signups: number }>;
}

export interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  value: string; // e.g., "+12%"
  percentage: number;
}

export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics>;
async function getTotalUsers(): Promise<{ current: number; previous: number }>;
async function getSignups7d(): Promise<{ current: number; previous: number }>;
async function getSignups30d(): Promise<{ current: number; previous: number }>;
async function getActiveUsers7d(): Promise<{ current: number; previous: number }>;
async function getActivationRate(): Promise<{ current: number; previous: number }>;
async function getOnboardingCompletion(): Promise<{ current: number; previous: number }>;
async function getFeedbackCount(): Promise<{ current: number; previous: number }>;
async function getSignupsChartData(): Promise<Array<{ date: string; signups: number }>>;
function calculateTrend(current: number, previous: number): TrendData;
```

**Implementation notes:**
- Use Supabase client with service role for auth.users queries
- Use Drizzle ORM for application schema queries (feedback)
- All date calculations use PostgreSQL date functions (NOW(), interval)
- Trend calculation: `((current - previous) / previous) * 100`
- Handle division by zero in trend calculation
- Format trend value: "+12%", "-8%", "No change"

**Query examples:**

```typescript
// Total users (from auth.users)
const totalUsers = await supabase.rpc('count_total_users');

// Signups 7d
const signups7d = await supabase.rpc('count_signups', { days: 7 });

// Active users (last_sign_in_at)
const activeUsers = await supabase.rpc('count_active_users', { days: 7 });

// Feedback count (from health_companion.feedback)
const feedbackCount = await db.select({ count: sql<number>`count(*)` }).from(feedback);

// Signups chart (daily aggregation for 30 days)
const signupsChart = await supabase.rpc('get_daily_signups', { days: 30 });
```

**Note:** Database functions (RPCs) may need to be created in Supabase for optimal performance and to access auth.users.

### Phase 8: Create Database Functions (Supabase)

**SQL migrations to create:**

**File:** Create migration or run in Supabase SQL editor

```sql
-- Count total users
CREATE OR REPLACE FUNCTION count_total_users()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM auth.users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count signups in last N days
CREATE OR REPLACE FUNCTION count_signups(days INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM auth.users
    WHERE created_at > NOW() - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count active users (last sign in within N days)
CREATE OR REPLACE FUNCTION count_active_users(days INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM auth.users
    WHERE last_sign_in_at > NOW() - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get daily signups for chart (last N days)
CREATE OR REPLACE FUNCTION get_daily_signups(days INTEGER)
RETURNS TABLE(date TEXT, signups BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(created_at::DATE, 'Mon DD') AS date,
    COUNT(*) AS signups
  FROM auth.users
  WHERE created_at > NOW() - (days || ' days')::INTERVAL
  GROUP BY created_at::DATE
  ORDER BY created_at::DATE ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** These functions require `SECURITY DEFINER` to access auth.users from application code.

### Phase 9: Create Main Dashboard Page

**File:** `src/app/[locale]/(admin)/admin/analytics/page.tsx`

**Page structure:**
```typescript
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { AnalyticsDashboard } from '@/components/admin/analytics/AnalyticsDashboard';
import { AnalyticsSkeleton } from '@/components/admin/analytics/AnalyticsSkeleton';

type AnalyticsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin.Analytics' });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Dashboard with Suspense */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
```

**File:** `src/components/admin/analytics/AnalyticsDashboard.tsx`

**Component structure:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from './MetricCard';
import { SignupsChart } from './SignupsChart';
import { CompletionRatesCard } from './CompletionRatesCard';
import type { AnalyticsMetrics } from '@/libs/api/admin/analytics';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          label="Total Users"
          value={metrics.totalUsers.value}
          trend={metrics.totalUsers.trend}
        />
        <MetricCard
          label="Signups (7d)"
          value={metrics.signups7d.value}
          trend={metrics.signups7d.trend}
        />
        <MetricCard
          label="Signups (30d)"
          value={metrics.signups30d.value}
          trend={metrics.signups30d.trend}
        />
        <MetricCard
          label="Active Users (7d)"
          value={metrics.activeUsers7d.value}
          trend={metrics.activeUsers7d.trend}
        />
        <MetricCard
          label="Activation Rate"
          value={`${metrics.activationRate.value}%`}
          trend={metrics.activationRate.trend}
        />
      </div>

      {/* Chart + Rates Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SignupsChart data={metrics.signupsChart} />
        <CompletionRatesCard
          onboardingCompletion={metrics.onboardingCompletion.value}
          activationRate={metrics.activationRate.value}
          feedbackCount={metrics.feedbackCount.value}
        />
      </div>
    </div>
  );
}
```

**File:** `src/components/admin/analytics/AnalyticsSkeleton.tsx`

**Skeleton structure:**
```typescript
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCardSkeleton } from './MetricCardSkeleton';
import { SignupsChartSkeleton } from './SignupsChartSkeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Chart + Rates Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SignupsChartSkeleton />
        <Card className="p-6">
          <Skeleton className="h-6 w-36 mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### Phase 10: Add Navigation Item

**File:** `src/app/[locale]/(admin)/admin/layout.tsx` (or sidebar component)

**Add navigation item:**
```typescript
{
  name: t('navigation.analytics'),
  href: '/admin/analytics',
  icon: BarChartIcon, // from lucide-react
}
```

**Note:** Exact location depends on existing admin layout structure. Check `src/app/[locale]/(admin)/admin/layout.tsx` or `src/components/admin/AdminSidebar.tsx`.

### Phase 11: Add Translations

**Files to modify:**
- `src/locales/en/Admin.json`
- `src/locales/hi/Admin.json`
- `src/locales/bn/Admin.json`

**Add translations:**
```json
{
  "Analytics": {
    "title": "Analytics Dashboard",
    "description": "Monitor key business metrics and user activity",
    "metrics": {
      "totalUsers": "Total Users",
      "signups7d": "Signups (7d)",
      "signups30d": "Signups (30d)",
      "activeUsers7d": "Active Users (7d)",
      "activationRate": "Activation Rate"
    },
    "chart": {
      "signupsOverTime": "Signups Over Time",
      "last30Days": "Last 30 days"
    },
    "completionRates": {
      "title": "Completion Rates",
      "onboardingCompletion": "Onboarding Completion",
      "activationRate": "Activation Rate",
      "feedbackSubmitted": "Feedback Submitted"
    },
    "trends": {
      "vsLast7d": "vs last 7 days",
      "vsLast30d": "vs last 30 days",
      "noChange": "No change"
    }
  }
}
```

## Testing Requirements

### Unit Tests

**File:** `src/components/admin/analytics/__tests__/MetricCard.test.tsx`

Test cases:
- Renders label and value correctly
- Shows trend up with green color and TrendingUp icon
- Shows trend down with red color and TrendingDown icon
- Shows trend neutral with gray color and Minus icon
- Handles missing trend gracefully
- Matches snapshot

**File:** `src/libs/api/admin/__tests__/analytics.test.ts`

Test cases:
- `calculateTrend` handles positive trend correctly
- `calculateTrend` handles negative trend correctly
- `calculateTrend` handles zero change (neutral)
- `calculateTrend` handles division by zero (previous = 0)
- `getAnalyticsMetrics` returns correct structure
- Trend percentages are calculated correctly

### Integration Tests

**Test scenario: Dashboard loading**
1. Navigate to `/admin/analytics` as admin user
2. Skeleton states appear immediately
3. API is called with correct authentication
4. Metrics are displayed after data loads
5. All components render without errors

**Test scenario: Non-admin access**
1. Navigate to `/admin/analytics` as regular user
2. User is redirected to main dashboard
3. Or 403 error is displayed
4. No data is leaked

### Manual Testing Checklist

- [ ] Dashboard loads for admin users
- [ ] Non-admin users cannot access dashboard
- [ ] All 5 metrics display correctly
- [ ] Trend indicators show correct direction and color
- [ ] Signups chart displays with 30 days of data
- [ ] Chart tooltip shows date and count on hover
- [ ] Completion rates card displays all 3 metrics
- [ ] Progress bars render correctly
- [ ] Feedback count shows as "X total"
- [ ] Skeleton states appear during loading
- [ ] No layout shift when data loads
- [ ] Desktop layout: metrics in 1 row, chart 2/3 + rates 1/3
- [ ] Tablet layout: metrics in 2 rows, chart and rates stacked
- [ ] Mobile layout: all components stacked vertically
- [ ] Dark mode works correctly
- [ ] Translations work for all locales
- [ ] Navigation item appears in admin sidebar
- [ ] Navigation item is highlighted when on analytics page
- [ ] Page is responsive on all breakpoints
- [ ] No console errors
- [ ] API endpoint returns data in <500ms

### E2E Test

**File:** `tests/admin-analytics.spec.ts`

```typescript
test.describe('Admin Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await loginAsAdmin(page);
  });

  test('should display analytics dashboard for admin', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Check page title
    await expect(page.locator('h2')).toContainText('Analytics Dashboard');

    // Check metric cards appear
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Signups (7d)')).toBeVisible();

    // Check chart appears
    await expect(page.locator('text=Signups Over Time')).toBeVisible();

    // Check completion rates card
    await expect(page.locator('text=Completion Rates')).toBeVisible();
  });

  test('should show trend indicators', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Wait for data to load
    await page.waitForSelector('[data-testid="metric-card"]');

    // Check for trend icon (up, down, or neutral)
    const trendIcon = page.locator('svg[class*="lucide"]').first();
    await expect(trendIcon).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    const metricsGrid = page.locator('.grid').first();
    await expect(metricsGrid).toHaveClass(/xl:grid-cols-5/);

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(metricsGrid).toHaveClass(/grid-cols-1/);
  });
});

test('non-admin cannot access analytics dashboard', async ({ page }) => {
  // Login as regular user
  await loginAsUser(page, 'user@example.com', 'password');

  await page.goto('/admin/analytics');

  // Should be redirected or see error
  await expect(page.url()).not.toContain('/admin/analytics');
});
```

## Dev Notes

### UX Design References

**CRITICAL: This story has comprehensive UX design specifications.**

The complete design specification is available at:
`_bmad-output/planning-artifacts/ux-design/epic-9-analytics-dashboard-design.md`

**Key Design Artifacts:**

| Element | Specification | Notes |
|---------|---------------|-------|
| Route | `/admin/analytics` | Under existing admin panel |
| Component Mapping | shadcn `Card`, `Skeleton`, `Progress`, `chart` | Chart requires installation |
| Layout Breakpoints | Desktop (≥1200px), Tablet (768-1199px), Mobile (<768px) | Fully responsive grid system |
| Metric Cards | 5 cards with trend indicators | TrendingUp/Down/Minus icons from lucide-react |
| Chart Type | Area chart with gradient fill | Uses recharts via shadcn |
| Color Tokens | Trend colors, primary accent | Light/dark mode compatible |

**Installation Command:**
```bash
npx shadcn@latest add chart
```

**Component Specifications from Design Doc:**

**MetricCard:**
- Props: `label`, `value`, `trend` (direction, value, percentage)
- Visual states: Loading (skeleton), Trend Up (green), Trend Down (red), Neutral (gray)
- Tailwind classes documented in design spec

**SignupsChart:**
- Type: Area chart with gradient fill from primary-500 to transparent
- Data: Last 30 days, daily aggregation
- Config: 300px height, responsive container, tooltip on hover
- X-axis: Date labels, Y-axis: Auto-scaled signup count

**CompletionRatesCard:**
- Metrics: Onboarding Completion (progress bar), Activation Rate (progress bar), Feedback Count (plain number)
- Visual: Vertical stack with labeled progress bars
- Format: "78%" for percentages, "42 total" for counts

**Responsive Grid Classes:**
```css
.metrics-grid {
  grid-cols-1 (mobile)
  sm:grid-cols-2 (small tablets)
  lg:grid-cols-3 (tablets)
  xl:grid-cols-5 (desktop)
}

.chart-grid {
  grid-cols-1 (mobile/tablet)
  xl:grid-cols-3 (desktop: chart=2cols, rates=1col)
}
```

**Skeleton Loading Pattern:**
The design doc includes complete skeleton structure with exact sizing. All skeleton states must match final layout to prevent CLS (Cumulative Layout Shift).

**Design Decisions Documented:**
1. 5 metrics (not 6) - Combined signup metrics in one row
2. Area chart over bar chart - Better for trend visualization
3. Completion rates in separate card - Groups related conversion metrics
4. No sparklines in metric cards - Keeps metrics clean
5. Recharts via shadcn - Consistent with project ecosystem

**Implementation Checklist from Design Doc:**
- [ ] Install shadcn chart component
- [ ] Create MetricCard with loading state
- [ ] Create SignupsChart with recharts
- [ ] Create CompletionRatesCard
- [ ] Create API endpoint `/api/admin/analytics`
- [ ] Add database queries for metrics
- [ ] Create analytics page at `/admin/analytics`
- [ ] Add "Analytics" nav item to admin sidebar
- [ ] Test responsive behavior
- [ ] Test skeleton loading states
- [ ] Test dark mode

**Reference Documents:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-9-analytics-dashboard-design.md`
- Epic File: `_bmad-output/planning-artifacts/epics/epic-9-analytics-founder-dashboard.md`

### Dependencies

**Completed (from Stories 9.1-9.4):**
- Analytics infrastructure (Stories 9.1-9.2)
- Event tracking and instrumentation (Stories 9.3-9.4)
- Admin panel structure (Epic 6)
- Database schema with feedback table (Epic 5)

**External dependencies:**
- shadcn chart component (recharts) - installed in Phase 1
- Supabase database functions - created in Phase 8

### Technical Considerations

**Database Access:**
- Use Supabase service role to query auth.users (not accessible from application schema)
- Create database functions with SECURITY DEFINER for optimal performance
- Index columns used in WHERE clauses: created_at, last_sign_in_at

**Onboarding Completion Tracking:**
- **Option 1:** Use user metadata in auth.users (e.g., `raw_user_meta_data.onboarding_completed`)
- **Option 2:** Track via analytics events (count users with `onboarding_completed` event)
- **Recommended:** Use metadata for faster queries, sync with analytics events

**Activation Rate:**
- Definition: Users who completed onboarding + performed meaningful action
- Can be calculated from analytics events (Story 9.4) or database flags
- For this dashboard, use a simplified version (e.g., onboarding completion rate)

**Caching:**
- Implement caching at API level (Next.js cache, Redis, or SWR)
- Cache duration: 1-5 minutes for real-time feel without DB load
- Use `revalidate` in Next.js fetch or React Query for client-side caching

**Performance:**
- Database functions are more efficient than client-side aggregation
- Use indexes on created_at and last_sign_in_at
- Consider materialized views for complex aggregations (future optimization)

### Edge Cases

**No data scenarios:**
- New deployment with zero users: Show "0" gracefully, no division errors
- Empty chart data: Show empty state or "No data available"
- Missing trend data: Show "No change" or hide trend indicator

**Large datasets:**
- Chart with 30 days of data should be performant
- If dataset grows, consider pagination or date range selector

**Time zone handling:**
- Use UTC consistently for all date calculations
- Display dates in user's locale if needed (future enhancement)

**Dark mode:**
- Ensure chart colors work in both light and dark themes
- Test trend indicator colors for sufficient contrast

### Admin Navigation

The existing admin panel is located at `src/app/[locale]/(admin)/admin/`. Check the following for navigation integration:
- Layout file: `src/app/[locale]/(admin)/admin/layout.tsx`
- Sidebar component: May be in `src/components/admin/` directory

Add the "Analytics" navigation item with:
- Icon: `BarChart` or `LineChart` from lucide-react
- Label: Translated via i18n
- Active state: Highlight when pathname matches `/admin/analytics`

### Code Quality Standards

**Type safety:**
- All API responses must have TypeScript interfaces
- No `any` types allowed
- Use Zod for API response validation (optional but recommended)

**Component patterns:**
- Separate loading states into dedicated skeleton components
- Use React Suspense for async data loading
- Client components only where needed (interactivity, hooks)
- Server components for initial page render

**Error handling:**
- Graceful degradation if metrics fail to load
- Show error state with retry option
- Log errors to console/Sentry for debugging

**Accessibility:**
- Charts must have proper ARIA labels
- Trend indicators must be announced by screen readers
- Color is not the only indicator (use icons + text)
- Keyboard navigation works for all interactive elements

**Testing:**
- Unit tests for calculation logic
- Integration tests for API endpoints
- E2E tests for complete user flow
- Visual regression tests for charts (optional)

## Definition of Done

- [ ] shadcn chart component installed (`npx shadcn@latest add chart`)
- [ ] MetricCard component created with trend indicators
- [ ] SignupsChart component created with recharts
- [ ] CompletionRatesCard component created with progress bars
- [ ] AnalyticsDashboard main component created
- [ ] Skeleton components created for all sections
- [ ] API endpoint created at `/api/admin/analytics`
- [ ] Data fetching logic implemented in `src/libs/api/admin/analytics.ts`
- [ ] Database functions created in Supabase for auth.users queries
- [ ] Analytics page created at `/admin/analytics`
- [ ] Navigation item added to admin sidebar
- [ ] Translations added for all UI text (en, hi, bn)
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Dark mode tested and working
- [ ] Loading states appear immediately on page load
- [ ] Trend calculations are accurate
- [ ] Chart displays 30 days of data correctly
- [ ] Chart tooltip shows date and count on hover
- [ ] Admin-only access enforced
- [ ] Non-admin users redirected or blocked
- [ ] Unit tests pass for calculation logic
- [ ] Integration test validates API endpoint
- [ ] E2E test validates complete dashboard flow
- [ ] Manual testing checklist completed
- [ ] No console errors or warnings
- [ ] Code reviewed and approved
- [ ] TypeScript types are strict (no `any`)
- [ ] Documentation updated (if needed)

## Related Stories

- **Story 9.1**: Analytics Infrastructure Setup (PostHog) - ✅ Completed
- **Story 9.2**: Event Tracking Utility - ✅ Completed
- **Story 9.3**: Core User Flow Instrumentation - ✅ Completed
- **Story 9.4**: Conversion Funnel Tracking - ✅ Completed
- **Story 9.6**: pSEO Traffic Instrumentation - 🔜 Future (extends analytics tracking to SEO pages)

## References

- **Epic File:** `_bmad-output/planning-artifacts/epics/epic-9-analytics-founder-dashboard.md`
- **Design Brief:** `_bmad-output/planning-artifacts/ux-design/epic-9-analytics-dashboard-design.md`
- **Admin Panel Structure:** `src/app/[locale]/(admin)/admin/`
- **Database Schema:** `src/models/Schema.ts`
- **Existing Admin Pages:** User management, feedback admin, system metrics
- **shadcn Chart Docs:** https://ui.shadcn.com/docs/components/chart
- **Recharts Docs:** https://recharts.org/
