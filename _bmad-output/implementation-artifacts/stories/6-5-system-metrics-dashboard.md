# Story 6.5: System Metrics Dashboard

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to see key system metrics at a glance,
so that I can monitor the health of the application.

## Acceptance Criteria

### AC1: Metrics Display
**Given** I am on the admin dashboard
**When** the page loads
**Then** I see key metrics displayed as cards
**And** metrics include: Total Users, New Signups (7d), Active Users (7d)
**And** metrics include: Pending Feedback, Error Count (if available)

### AC2: Metric Card Design
**Given** each metric card
**When** I view it
**Then** I see the metric name
**And** I see the current value (large, prominent)
**And** I see trend indicator if applicable (+5% this week)
**And** design is clean and scannable

### AC3: Total Users Metric
**Given** the Total Users metric
**When** I view it
**Then** I see count of all registered users
**And** count is accurate and real-time

### AC4: New Signups Metric
**Given** the New Signups metric
**When** I view it
**Then** I see count of users registered in last 7 days
**And** I can optionally see daily breakdown

### AC5: Active Users Metric
**Given** the Active Users metric
**When** I view it
**Then** I see count of users who logged in last 7 days
**And** metric is based on session/login data

### AC6: Pending Feedback Metric
**Given** the Pending Feedback metric
**When** I view it
**Then** I see count of unreviewed feedback
**And** clicking navigates to feedback page

### AC7: Loading States
**Given** the admin dashboard
**When** data is loading
**Then** I see skeleton loaders for each metric
**And** dashboard remains usable during loading

### AC8: Responsive Layout
**Given** the dashboard layout
**When** I view on different screen sizes
**Then** metric cards reflow appropriately
**And** 4 columns on desktop, 2 on tablet, 1 on mobile

## Tasks / Subtasks

- [ ] Task 1: Create database query utilities for metrics (AC: #3, #4, #5, #6)
  - [ ] Subtask 1.1: Create `src/libs/queries/metrics.ts` for Supabase queries
  - [ ] Subtask 1.2: Implement `getTotalUsersCount()` - count all auth.users
  - [ ] Subtask 1.3: Implement `getNewSignupsCount()` - count users created in last 7 days
  - [ ] Subtask 1.4: Implement `getActiveUsersCount()` - count users with last_sign_in_at in last 7 days
  - [ ] Subtask 1.5: Implement `getPendingFeedbackCount()` - count feedback where status != 'reviewed'
  - [ ] Subtask 1.6: Add error handling for all query functions
  - [ ] Subtask 1.7: Use Supabase service role client for admin queries

- [ ] Task 2: Create MetricCard component (AC: #1, #2, #7)
  - [ ] Subtask 2.1: Create `src/components/admin/MetricCard.tsx`
  - [ ] Subtask 2.2: Use shadcn Card components (Card, CardHeader, CardTitle, CardDescription)
  - [ ] Subtask 2.3: Add props: title, value, trend, icon, loading
  - [ ] Subtask 2.4: Display metric title as CardDescription (small text)
  - [ ] Subtask 2.5: Display metric value as CardTitle (large 3xl font)
  - [ ] Subtask 2.6: Add optional trend indicator with arrow and percentage
  - [ ] Subtask 2.7: Add optional icon with color (Lucide icons)
  - [ ] Subtask 2.8: Add loading state with Skeleton component
  - [ ] Subtask 2.9: Add hover effect (subtle shadow increase)

- [ ] Task 3: Create trend calculation utility (AC: #2, #4)
  - [ ] Subtask 3.1: Create `src/libs/utils/calculateTrend.ts`
  - [ ] Subtask 3.2: Implement trend comparison logic (current vs previous period)
  - [ ] Subtask 3.3: Return percentage change and direction (up/down/neutral)
  - [ ] Subtask 3.4: Handle edge cases (divide by zero, no previous data)
  - [ ] Subtask 3.5: Add TypeScript types for TrendData

- [ ] Task 4: Fetch metrics for New Signups with trend (AC: #4)
  - [ ] Subtask 4.1: Add `getNewSignupsCountWithTrend()` to metrics.ts
  - [ ] Subtask 4.2: Query users created in last 7 days (current period)
  - [ ] Subtask 4.3: Query users created in previous 7 days (7-14 days ago)
  - [ ] Subtask 4.4: Calculate trend percentage using utility
  - [ ] Subtask 4.5: Return object with count and trend data

- [ ] Task 5: Fetch metrics for Active Users with trend (AC: #5)
  - [ ] Subtask 5.1: Add `getActiveUsersCountWithTrend()` to metrics.ts
  - [ ] Subtask 5.2: Query users with last_sign_in_at in last 7 days (current)
  - [ ] Subtask 5.3: Query users with last_sign_in_at in previous 7 days (7-14 days ago)
  - [ ] Subtask 5.4: Calculate trend percentage
  - [ ] Subtask 5.5: Return object with count and trend data

- [ ] Task 6: Update admin dashboard page with real metrics (AC: #1, #3-#6)
  - [ ] Subtask 6.1: Import metric query functions in dashboard page
  - [ ] Subtask 6.2: Fetch Total Users count server-side
  - [ ] Subtask 6.3: Fetch New Signups count with trend server-side
  - [ ] Subtask 6.4: Fetch Active Users count with trend server-side
  - [ ] Subtask 6.5: Fetch Pending Feedback count server-side
  - [ ] Subtask 6.6: Replace placeholder cards with MetricCard components
  - [ ] Subtask 6.7: Pass real data and trends to each MetricCard
  - [ ] Subtask 6.8: Add appropriate icons for each metric (Users, UserPlus, Activity, MessageSquare)
  - [ ] Subtask 6.9: Handle query errors gracefully (show "--" on error)

- [ ] Task 7: Add Pending Feedback click navigation (AC: #6)
  - [ ] Subtask 7.1: Make Pending Feedback MetricCard clickable
  - [ ] Subtask 7.2: Wrap card in Link component to `/admin/feedback`
  - [ ] Subtask 7.3: Add hover cursor-pointer styling
  - [ ] Subtask 7.4: Add visual indicator (arrow icon or hover effect)
  - [ ] Subtask 7.5: Maintain card styling while being clickable

- [ ] Task 8: Implement loading states (AC: #7)
  - [ ] Subtask 8.1: Install shadcn Skeleton component if not present
  - [ ] Subtask 8.2: Add loading prop to MetricCard component
  - [ ] Subtask 8.3: Render Skeleton for value when loading is true
  - [ ] Subtask 8.4: Show static title even during loading
  - [ ] Subtask 8.5: Create DashboardSkeleton component for full page loading
  - [ ] Subtask 8.6: Use Suspense boundary for streaming metrics (optional)

- [ ] Task 9: Add responsive grid layout (AC: #8)
  - [ ] Subtask 9.1: Verify existing grid classes in dashboard page
  - [ ] Subtask 9.2: Ensure grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - [ ] Subtask 9.3: Test layout on mobile (320px - 767px) - 1 column
  - [ ] Subtask 9.4: Test layout on tablet (768px - 1023px) - 2 columns
  - [ ] Subtask 9.5: Test layout on desktop (1024px+) - 4 columns
  - [ ] Subtask 9.6: Verify gap spacing is consistent (gap-4 or gap-6)

- [ ] Task 10: Add error handling and empty states (AC: #3-#6)
  - [ ] Subtask 10.1: Add try-catch blocks in metric query functions
  - [ ] Subtask 10.2: Return null or default values on query errors
  - [ ] Subtask 10.3: Display "--" in MetricCard when data is null/undefined
  - [ ] Subtask 10.4: Add error toast if critical metrics fail (optional)
  - [ ] Subtask 10.5: Log errors to Sentry for monitoring

- [ ] Task 11: Add i18n translations (AC: #1-#6)
  - [ ] Subtask 11.1: Add dashboard metric translations to `src/locales/en.json`
  - [ ] Subtask 11.2: Add metric titles, descriptions, and trend labels
  - [ ] Subtask 11.3: Add loading state messages
  - [ ] Subtask 11.4: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 11.5: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 11.6: Use `useTranslations('Admin.Dashboard')` in components

- [ ] Task 12: Write component tests (AC: #1, #2, #7, #8)
  - [ ] Subtask 12.1: Create `src/components/admin/MetricCard.test.tsx`
  - [ ] Subtask 12.2: Test MetricCard renders with title and value
  - [ ] Subtask 12.3: Test trend indicator displays correctly (positive/negative)
  - [ ] Subtask 12.4: Test loading state shows Skeleton
  - [ ] Subtask 12.5: Test icon displays when provided
  - [ ] Subtask 12.6: Test card is clickable when wrapped in Link

- [ ] Task 13: Write query utility tests (AC: #3-#6)
  - [ ] Subtask 13.1: Create `src/libs/queries/metrics.test.ts`
  - [ ] Subtask 13.2: Test getTotalUsersCount() returns correct count
  - [ ] Subtask 13.3: Test getNewSignupsCount() filters by date correctly
  - [ ] Subtask 13.4: Test getActiveUsersCount() filters by last_sign_in_at
  - [ ] Subtask 13.5: Test getPendingFeedbackCount() filters by status
  - [ ] Subtask 13.6: Test trend calculation utilities
  - [ ] Subtask 13.7: Mock Supabase client for all tests
  - [ ] Subtask 13.8: Test error handling in query functions

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The admin dashboard metrics UI is already designed in SuperDesign prototype with complete HTML/CSS implementation.

| Screen/Component | Design Tool | Location | Files to Adapt |
|------------------|-------------|----------|----------------|
| Dashboard Metrics Grid | SuperDesign | `.superdesign/design_iterations/admin_layout_1.html` | Metrics cards section |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`

**Adaptation Checklist:**
- [ ] Extract metrics card structure from `.superdesign/design_iterations/admin_layout_1.html`
- [ ] Convert CSS classes to Tailwind utility classes
- [ ] Replace custom metric cards with shadcn Card components
- [ ] Add MetricCard component with icon, value, trend props
- [ ] Integrate real data from Supabase queries
- [ ] Add loading states with Skeleton components
- [ ] Wire up Pending Feedback card click to navigation
- [ ] Add proper TypeScript types for all metric data
- [ ] Implement responsive grid matching design (4-2-1 columns)
- [ ] Test dark mode appearance
- [ ] Add trend indicators with up/down arrows and colors

**shadcn Components to Install:**
```bash
npx shadcn@latest add skeleton
```

**Key Design Tokens from Prototype:**
- Card padding: 24px (p-6)
- Metric value font size: 3xl (30px)
- Metric title font size: sm (14px)
- Grid gap: 16px (gap-4) or 24px (gap-6)
- Trend indicator: text-xs with arrow icon
- Positive trend color: green-600
- Negative trend color: red-600
- Card hover: subtle shadow increase (hover:shadow-md)

### Critical Architecture Requirements

**Supabase Queries for Metrics:**

The metrics data comes from two sources:
1. **User data**: Supabase `auth.users` table (requires service role client)
2. **Feedback data**: Custom `feedback` table in public schema

**Service Role Client (CRITICAL):**
- Admin metrics queries MUST use Supabase service role client
- Service role bypasses RLS policies to access all users
- Client located at: `src/libs/supabase/server.ts` (service role method)
- Initialize with: `const supabase = createClient(cookieStore, { admin: true })`

**Query Patterns:**

```typescript
// Total Users
const { count } = await supabase
  .from('auth.users')
  .select('*', { count: 'exact', head: true })

// New Signups (last 7 days)
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

const { count } = await supabase
  .from('auth.users')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', sevenDaysAgo.toISOString())

// Active Users (last 7 days)
const { count } = await supabase
  .from('auth.users')
  .select('*', { count: 'exact', head: true })
  .gte('last_sign_in_at', sevenDaysAgo.toISOString())

// Pending Feedback
const { count } = await supabase
  .from('feedback')
  .select('*', { count: 'exact', head: true })
  .or('status.is.null,status.neq.reviewed')
```

**Trend Calculation Logic:**

```typescript
interface TrendData {
  percentage: number // e.g., 12.5 for +12.5%
  direction: 'up' | 'down' | 'neutral'
  isPositive: boolean
}

function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    return { percentage: 0, direction: 'neutral', isPositive: false }
  }

  const change = current - previous
  const percentage = (change / previous) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  const isPositive = change > 0

  return {
    percentage: Math.abs(parseFloat(percentage.toFixed(1))),
    direction,
    isPositive
  }
}
```

**Server-Side Data Fetching (Next.js 15):**

Dashboard page is a Server Component by default - fetch data directly:

```typescript
// src/app/[locale]/(admin)/admin/page.tsx
export default async function AdminDashboardPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Admin' });

  // Fetch metrics server-side
  const [totalUsers, newSignups, activeUsers, pendingFeedback] = await Promise.all([
    getTotalUsersCount(),
    getNewSignupsCountWithTrend(),
    getActiveUsersCountWithTrend(),
    getPendingFeedbackCount()
  ])

  return (
    <div className="space-y-6">
      {/* ... */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('dashboard.totalUsers')}
          value={totalUsers ?? 0}
          icon={Users}
        />
        <MetricCard
          title={t('dashboard.newSignups')}
          value={newSignups?.count ?? 0}
          trend={newSignups?.trend}
          icon={UserPlus}
        />
        {/* ... */}
      </div>
    </div>
  )
}
```

**Error Handling Strategy:**

```typescript
// In query functions
async function getTotalUsersCount(): Promise<number | null> {
  try {
    const supabase = await createClient(await cookies(), { admin: true })
    const { count, error } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count ?? 0
  } catch (error) {
    console.error('Failed to fetch total users:', error)
    // Log to Sentry in production
    return null
  }
}
```

**MetricCard Component Structure:**

```typescript
// src/components/admin/MetricCard.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | null
  trend?: {
    percentage: number
    direction: 'up' | 'down' | 'neutral'
    isPositive: boolean
  }
  icon?: LucideIcon
  loading?: boolean
  clickable?: boolean
  href?: string
}

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  loading = false,
  clickable = false,
  href
}: MetricCardProps) {
  const content = (
    <Card className={clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>

        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <CardTitle className="text-3xl font-bold">
            {value ?? '--'}
          </CardTitle>
        )}

        {trend && !loading && (
          <div className={`flex items-center gap-1 text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            <span>{trend.percentage}%</span>
          </div>
        )}
      </CardHeader>
    </Card>
  )

  if (clickable && href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
```

### Implementation Strategy

**Phase 1: Database Query Layer**

1. Create `src/libs/queries/metrics.ts`:
   - Add all metric query functions
   - Use Supabase service role client
   - Implement proper error handling
   - Add TypeScript types for return values

2. Create `src/libs/utils/calculateTrend.ts`:
   - Implement trend calculation logic
   - Handle edge cases (zero division)
   - Return TrendData interface

**Phase 2: MetricCard Component**

1. Create `src/components/admin/MetricCard.tsx`:
   - Build reusable metric card component
   - Support icon, value, trend, loading props
   - Add clickable variant with Link wrapper
   - Style with Tailwind matching design system

2. Install Skeleton component if needed:
   ```bash
   npx shadcn@latest add skeleton
   ```

**Phase 3: Dashboard Integration**

1. Update `src/app/[locale]/(admin)/admin/page.tsx`:
   - Import metric query functions
   - Fetch all metrics server-side with Promise.all
   - Replace placeholder cards with MetricCard components
   - Pass real data and trends to each card
   - Handle loading and error states

2. Add navigation for Pending Feedback card:
   - Wrap in Link to `/admin/feedback`
   - Add hover styling

**Phase 4: Translations**

Add to `src/locales/en.json`:
```json
{
  "Admin": {
    "Dashboard": {
      "totalUsers": "Total Users",
      "newSignups": "New Signups (7d)",
      "activeUsers": "Active Users (7d)",
      "pendingFeedback": "Pending Feedback",
      "trend": {
        "up": "Up from last week",
        "down": "Down from last week"
      }
    }
  }
}
```

Duplicate for `hi.json` and `bn.json` with appropriate translations.

### Testing Strategy

**Component Unit Tests:**

```typescript
// src/components/admin/MetricCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'
import { Users } from 'lucide-react'

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Total Users" value={1234} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(
      <MetricCard title="Total Users" value={1234} loading />
    )

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('displays positive trend', () => {
    const trend = { percentage: 12.5, direction: 'up' as const, isPositive: true }
    render(<MetricCard title="New Signups" value={50} trend={trend} />)

    expect(screen.getByText('12.5%')).toBeInTheDocument()
    expect(screen.getByText('12.5%')).toHaveClass('text-green-600')
  })

  it('displays negative trend', () => {
    const trend = { percentage: 8.2, direction: 'down' as const, isPositive: false }
    render(<MetricCard title="Active Users" value={100} trend={trend} />)

    expect(screen.getByText('8.2%')).toBeInTheDocument()
    expect(screen.getByText('8.2%')).toHaveClass('text-red-600')
  })

  it('renders with icon', () => {
    const { container } = render(
      <MetricCard title="Total Users" value={1234} icon={Users} />
    )

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows "--" when value is null', () => {
    render(<MetricCard title="Error Metric" value={null} />)

    expect(screen.getByText('--')).toBeInTheDocument()
  })
})
```

**Query Utility Tests:**

```typescript
// src/libs/queries/metrics.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTotalUsersCount, getNewSignupsCountWithTrend } from './metrics'

// Mock Supabase client
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn()
}))

describe('metrics queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTotalUsersCount', () => {
    it('returns user count', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            count: 1234,
            error: null
          })
        })
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const count = await getTotalUsersCount()
      expect(count).toBe(1234)
    })

    it('returns null on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            count: null,
            error: new Error('Database error')
          })
        })
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const count = await getTotalUsersCount()
      expect(count).toBeNull()
    })
  })

  describe('getNewSignupsCountWithTrend', () => {
    it('calculates positive trend', async () => {
      // Mock current week: 50 signups
      // Mock previous week: 40 signups
      // Expected trend: +25%

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lt: vi.fn()
                .mockResolvedValueOnce({ count: 50, error: null }) // current
                .mockResolvedValueOnce({ count: 40, error: null }) // previous
            })
          })
        })
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const result = await getNewSignupsCountWithTrend()
      expect(result?.count).toBe(50)
      expect(result?.trend.percentage).toBe(25)
      expect(result?.trend.isPositive).toBe(true)
    })
  })
})
```

### Project Structure Notes

**New Files:**
```
src/
  libs/
    queries/
      metrics.ts                # Metric query functions
      metrics.test.ts           # Query tests
    utils/
      calculateTrend.ts         # Trend calculation utility
      calculateTrend.test.ts    # Trend tests
  components/admin/
    MetricCard.tsx              # Reusable metric card
    MetricCard.test.tsx         # Component tests
```

**Updated Files:**
```
src/
  app/[locale]/(admin)/admin/
    page.tsx                    # Dashboard with real metrics (replace placeholders)
  locales/
    en.json                     # Dashboard translations
    hi.json                     # Hindi translations
    bn.json                     # Bengali translations
```

**Import Pattern:**
```typescript
import { MetricCard } from '@/components/admin/MetricCard'
import { getTotalUsersCount, getNewSignupsCountWithTrend } from '@/libs/queries/metrics'
import { calculateTrend } from '@/libs/utils/calculateTrend'
```

**Dependencies:**
- shadcn Skeleton component (install if not present)
- Lucide icons: Users, UserPlus, Activity, MessageSquare, TrendingUp, TrendingDown
- Supabase service role client (already exists)
- next/link for clickable cards

### Previous Story Intelligence

**Learnings from Stories 6.1-6.4:**

1. **Supabase Admin API Pattern:**
   - Stories 6.3 and 6.4 established Supabase Admin API usage
   - Service role client bypasses RLS for admin operations
   - Pattern: `createClient(cookieStore, { admin: true })`
   - Queries return objects with `data`, `error`, `count` properties

2. **Component Patterns:**
   - Consistent use of shadcn components (Card, Badge, etc.)
   - "use client" directive for components with hooks/state
   - Server Components for pages with data fetching
   - Co-located test files for all components

3. **Translation Pattern:**
   - Nested namespace structure: `Admin.Dashboard.totalUsers`
   - Server-side: `await getTranslations({ locale, namespace })`
   - Client-side: `useTranslations('Admin.Dashboard')`
   - All 3 locales updated simultaneously

4. **Error Handling:**
   - Try-catch blocks in query functions
   - Return null on errors for graceful degradation
   - Display "--" or fallback values in UI
   - Log errors to console (Sentry in production)

5. **TypeScript Conventions:**
   - Strict mode enabled
   - Explicit interface definitions for all data
   - Async function return types specified
   - Props interfaces for all components

6. **Testing Approach:**
   - Vitest for unit tests
   - Mock Supabase client in all query tests
   - Test loading states, error states, success states
   - Test responsive behavior with window.matchMedia mocks

### Security Considerations

**Access Control:**
- Dashboard page protected by middleware (Story 6.1)
- Only admins can access `/admin/*` routes
- Service role queries run server-side only (never exposed to client)
- No sensitive user data displayed (only counts/aggregates)

**Data Privacy:**
- Metrics show aggregate counts, not individual user data
- User emails/names not displayed in metrics
- Trend data is calculated server-side
- No PII (Personally Identifiable Information) in metrics

**Performance:**
- Use `count: 'exact', head: true` for count-only queries (no data transfer)
- Parallel queries with Promise.all for faster loading
- Server-side caching could be added in future (optional)
- Queries are read-only (no mutations in metrics)

**Environment Variables:**
- SUPABASE_SERVICE_ROLE_KEY required for admin queries
- Already set up in project from previous stories
- Never exposed to client-side code

### References

- [Source: Epic 6 Story 6.5] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: .superdesign/design_iterations/admin_layout_1.html] - Dashboard prototype
- [Source: Story 6.2] - Admin layout and dashboard placeholder
- [Source: Story 6.3] - Supabase Admin API query patterns
- [Source: Story 6.4] - Server-side data fetching patterns
- [Source: src/app/[locale]/(admin)/admin/page.tsx] - Current dashboard placeholder
- [Source: CLAUDE.md#Database] - Drizzle ORM and Supabase integration
- [Source: PRD#FR-ADMIN-002] - System monitoring requirements

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
