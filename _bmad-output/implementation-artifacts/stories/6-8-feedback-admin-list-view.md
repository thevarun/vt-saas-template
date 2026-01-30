# Story 6.8: Feedback Admin List View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin reviewing feedback,
I want to see all feedback submissions in one place,
so that I can understand user needs and issues.

## Acceptance Criteria

### AC1: Feedback List Display
**Given** I am an admin user
**When** I navigate to the admin feedback page
**Then** I see a list of all feedback submissions
**And** list is sorted by newest first (default)
**And** list shows: type, message preview, user/email, date, status

### AC2: Type and Status Filtering
**Given** the feedback list
**When** I view it
**Then** I can filter by type (Bug, Feature, Praise, All)
**And** I can filter by status (Pending, Reviewed, Archived, All)
**And** filters update the list without page reload

### AC3: Feedback Item Preview
**Given** a feedback item in the list
**When** I view the preview
**Then** I see the first ~100 characters of the message
**And** I see the feedback type with color coding
**And** I see relative timestamp ("2 hours ago")
**And** I see user email or "Anonymous"

### AC4: Feedback Detail View
**Given** I click on a feedback item
**When** the detail view opens
**Then** I see the full message
**And** I see all metadata (type, user, date, status)
**And** I can take actions (mark reviewed, delete)

### AC5: Access Control
**Given** the admin feedback page
**When** I access it as non-admin
**Then** I am redirected to dashboard
**And** I see "Access denied" or similar message

### AC6: Empty State
**Given** the feedback list is empty
**When** no feedback exists
**Then** I see an empty state
**And** message indicates no feedback yet

## Tasks / Subtasks

- [ ] Task 1: Create feedback database schema (AC: #1, #3, #4)
  - [ ] Subtask 1.1: Add `feedback` table to `src/models/Schema.ts`
  - [ ] Subtask 1.2: Define columns: id (uuid), type (enum: bug/feature/praise), message (text), email (text), status (enum: pending/reviewed/archived), userId (uuid, nullable), created_at (timestamp), reviewed_at (timestamp, nullable)
  - [ ] Subtask 1.3: Add index on created_at for sorting by newest first
  - [ ] Subtask 1.4: Add index on type for filtering
  - [ ] Subtask 1.5: Add index on status for filtering
  - [ ] Subtask 1.6: Add composite index on (status, created_at) for filtered sorting
  - [ ] Subtask 1.7: Add NOT NULL constraints on required fields (id, type, message, status, created_at)
  - [ ] Subtask 1.8: Set default value for status (pending)
  - [ ] Subtask 1.9: Set default value for created_at (defaultNow())
  - [ ] Subtask 1.10: Run `npm run db:generate` to create migration
  - [ ] Subtask 1.11: Verify migration file in drizzle/ directory

- [ ] Task 2: Create feedback query utilities (AC: #1, #2, #3)
  - [ ] Subtask 2.1: Create `src/libs/queries/feedback.ts`
  - [ ] Subtask 2.2: Define FeedbackFilters interface (type?, status?, limit?, offset?)
  - [ ] Subtask 2.3: Define FeedbackType enum: 'bug', 'feature', 'praise'
  - [ ] Subtask 2.4: Define FeedbackStatus enum: 'pending', 'reviewed', 'archived'
  - [ ] Subtask 2.5: Implement getFeedbackList(filters) function
  - [ ] Subtask 2.6: Query feedback table with Drizzle ORM
  - [ ] Subtask 2.7: Apply filters conditionally (where clauses for type, status)
  - [ ] Subtask 2.8: Order by created_at DESC (newest first)
  - [ ] Subtask 2.9: Apply pagination (limit, offset)
  - [ ] Subtask 2.10: Return feedback entries with all fields
  - [ ] Subtask 2.11: Add error handling (return null on error)
  - [ ] Subtask 2.12: Implement getFeedbackCount(filters) for pagination

- [ ] Task 3: Create feedback list page UI (AC: #1, #2, #5, #6)
  - [ ] Subtask 3.1: Create `src/app/[locale]/(auth)/admin/feedback/page.tsx`
  - [ ] Subtask 3.2: Mark as async Server Component for data fetching
  - [ ] Subtask 3.3: Fetch feedback list server-side using getFeedbackList()
  - [ ] Subtask 3.4: Parse URL search params for filters (type, status, page)
  - [ ] Subtask 3.5: Calculate pagination (limit: 20, offset from page param)
  - [ ] Subtask 3.6: Pass data to client component FeedbackList
  - [ ] Subtask 3.7: Add page title and description
  - [ ] Subtask 3.8: Wrap in Card component for consistent styling
  - [ ] Subtask 3.9: Add empty state when no feedback exists

- [ ] Task 4: Create FeedbackFilters component (AC: #2)
  - [ ] Subtask 4.1: Create `src/components/admin/FeedbackFilters.tsx` as "use client" component
  - [ ] Subtask 4.2: Use shadcn Tabs for type filter (All, Bug, Feature, Praise)
  - [ ] Subtask 4.3: Use shadcn Select for status filter (All, Pending, Reviewed, Archived)
  - [ ] Subtask 4.4: Use useRouter and usePathname to update URL search params
  - [ ] Subtask 4.5: Update filters without page reload (client-side navigation)
  - [ ] Subtask 4.6: Display active filters count badge
  - [ ] Subtask 4.7: Persist filters in URL for shareability
  - [ ] Subtask 4.8: Add "Clear Filters" button that resets to default view

- [ ] Task 5: Create FeedbackCard component (AC: #3)
  - [ ] Subtask 5.1: Create `src/components/admin/FeedbackCard.tsx` as "use client" component
  - [ ] Subtask 5.2: Use shadcn Card as base component
  - [ ] Subtask 5.3: Display feedback type with color-coded Badge (bug=red, feature=blue, praise=purple)
  - [ ] Subtask 5.4: Display message preview (first 100 characters with ellipsis)
  - [ ] Subtask 5.5: Display user email or "Anonymous" if no userId
  - [ ] Subtask 5.6: Format timestamp with relative time (e.g., "2 hours ago") using date-fns
  - [ ] Subtask 5.7: Display status badge (pending=yellow, reviewed=green, archived=gray)
  - [ ] Subtask 5.8: Make card clickable to open detail view
  - [ ] Subtask 5.9: Add hover state styling
  - [ ] Subtask 5.10: Handle long emails gracefully (truncate if needed)

- [ ] Task 6: Create FeedbackDetailDialog component (AC: #4)
  - [ ] Subtask 6.1: Create `src/components/admin/FeedbackDetailDialog.tsx` as "use client" component
  - [ ] Subtask 6.2: Use shadcn Dialog component
  - [ ] Subtask 6.3: Display full feedback message (no truncation)
  - [ ] Subtask 6.4: Display all metadata: type, user email, date, status
  - [ ] Subtask 6.5: Format created_at as full date and time
  - [ ] Subtask 6.6: Display reviewed_at if present
  - [ ] Subtask 6.7: Add "Mark as Reviewed" button (if status is pending)
  - [ ] Subtask 6.8: Add "Delete" button (always visible)
  - [ ] Subtask 6.9: Wire up action buttons to API routes (Story 6.9)
  - [ ] Subtask 6.10: Add close button to dismiss dialog

- [ ] Task 7: Add pagination controls (AC: #1)
  - [ ] Subtask 7.1: Create `src/components/admin/FeedbackPagination.tsx`
  - [ ] Subtask 7.2: Use shadcn Button for Previous/Next navigation
  - [ ] Subtask 7.3: Display current page and total pages
  - [ ] Subtask 7.4: Calculate total pages from total count and limit (20 per page)
  - [ ] Subtask 7.5: Update URL search params on page change
  - [ ] Subtask 7.6: Disable Previous on page 1, disable Next on last page
  - [ ] Subtask 7.7: Add jump to page input (optional enhancement)

- [ ] Task 8: Add feedback link to admin navigation (AC: #5)
  - [ ] Subtask 8.1: Update `src/components/admin/AdminSidebar.tsx` (from Story 6.2)
  - [ ] Subtask 8.2: Add "Feedback" nav item to Management section with MessageSquareText icon
  - [ ] Subtask 8.3: Link to `/admin/feedback` route
  - [ ] Subtask 8.4: Add active state styling when on feedback page
  - [ ] Subtask 8.5: Verify mobile navigation includes feedback link

- [ ] Task 9: Add i18n translations (AC: #1, #2, #3, #4, #6)
  - [ ] Subtask 9.1: Add feedback translations to `src/locales/en.json`
  - [ ] Subtask 9.2: Add page title, filter labels, type names, status names, column headers
  - [ ] Subtask 9.3: Add empty state messages and error messages
  - [ ] Subtask 9.4: Add action button labels and confirmation messages
  - [ ] Subtask 9.5: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 9.6: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 9.7: Use `useTranslations('Admin.Feedback')` in components
  - [ ] Subtask 9.8: Use `await getTranslations({ locale, namespace })` in server pages

- [ ] Task 10: Write database schema tests (AC: #1)
  - [ ] Subtask 10.1: Create `src/models/Schema.feedback.test.ts`
  - [ ] Subtask 10.2: Test feedback table can be queried
  - [ ] Subtask 10.3: Test all required columns exist
  - [ ] Subtask 10.4: Test indexes are created (created_at, type, status)
  - [ ] Subtask 10.5: Test NOT NULL constraints
  - [ ] Subtask 10.6: Test status default value is 'pending'
  - [ ] Subtask 10.7: Test created_at default value is set
  - [ ] Subtask 10.8: Mock Drizzle client for tests

- [ ] Task 11: Write query utility tests (AC: #1, #2, #3)
  - [ ] Subtask 11.1: Create `src/libs/queries/feedback.test.ts`
  - [ ] Subtask 11.2: Test getFeedbackList returns all feedback without filters
  - [ ] Subtask 11.3: Test getFeedbackList filters by type correctly
  - [ ] Subtask 11.4: Test getFeedbackList filters by status correctly
  - [ ] Subtask 11.5: Test getFeedbackList pagination (limit, offset)
  - [ ] Subtask 11.6: Test getFeedbackList orders by created_at DESC
  - [ ] Subtask 11.7: Test getFeedbackCount returns correct count
  - [ ] Subtask 11.8: Test error handling returns null
  - [ ] Subtask 11.9: Mock Drizzle client for tests

- [ ] Task 12: Write component tests (AC: #3, #4, #6)
  - [ ] Subtask 12.1: Create `src/components/admin/FeedbackCard.test.tsx`
  - [ ] Subtask 12.2: Test card renders with feedback data
  - [ ] Subtask 12.3: Test type badges display correct colors
  - [ ] Subtask 12.4: Test message preview truncation
  - [ ] Subtask 12.5: Test timestamp formatting (relative time)
  - [ ] Subtask 12.6: Test "Anonymous" display when no user
  - [ ] Subtask 12.7: Test card click opens detail dialog
  - [ ] Subtask 12.8: Create `src/components/admin/FeedbackDetailDialog.test.tsx`
  - [ ] Subtask 12.9: Test dialog displays full message
  - [ ] Subtask 12.10: Test metadata display
  - [ ] Subtask 12.11: Test action buttons are present
  - [ ] Subtask 12.12: Create `src/components/admin/FeedbackFilters.test.tsx`
  - [ ] Subtask 12.13: Test filter tabs update URL params
  - [ ] Subtask 12.14: Test clear filters resets to default

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The feedback admin UI is already designed in SuperDesign prototype with complete HTML/CSS implementation.

| Screen/Component | Design Tool | Location | Files to Extract |
|------------------|-------------|----------|------------------|
| Feedback List | SuperDesign | `.superdesign/design_iterations/admin_feedback_1.html` | List layout, filters, cards |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`

**Adaptation Checklist:**
- [ ] Extract feedback list layout from `admin_feedback_1.html`
- [ ] Convert CSS classes to Tailwind utility classes
- [ ] Replace custom cards with shadcn Card components
- [ ] Add filter controls using shadcn Tabs and Select components
- [ ] Add type badges using shadcn Badge with custom variants
- [ ] Implement status filtering with URL-based state
- [ ] Add pagination controls matching design
- [ ] Wire up to real feedback data from database
- [ ] Add proper TypeScript types for all feedback data
- [ ] Implement detail view dialog
- [ ] Test dark mode appearance
- [ ] Format timestamps with relative time display

**shadcn Components to Install:**
```bash
npx shadcn@latest add tabs card badge dialog
```

**Key Design Tokens from Prototype:**
- Card padding: 24px (p-6)
- Font size: 14px (text-sm)
- Badge variants: bug=red, feature=blue, praise=purple
- Status badges: pending=yellow, reviewed=green, archived=gray
- Message preview: 100 characters max
- Date format: "2 hours ago" (relative time)
- Filters layout: Tabs for type, Select for status
- Pagination: centered at bottom with gap-2

### Critical Architecture Requirements

**IMPORTANT CONTEXT: Epic 5 Dependency**
- Epic 5 (User Feedback Collection) is in BACKLOG status
- The user-facing feedback submission system does NOT exist yet
- Story 6.8 is creating the admin view BEFORE the user-facing system
- This is intentional: admin panel infrastructure is being built first
- The feedback table schema created here will be used by Epic 5 later
- For testing, you may need to create mock feedback data manually

**Database Schema (Drizzle ORM):**

Add to `src/models/Schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';

// Enum definitions
export const feedbackTypeEnum = pgEnum('feedback_type', ['bug', 'feature', 'praise']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'reviewed', 'archived']);

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: feedbackTypeEnum('type').notNull(),
    message: text('message').notNull(),
    email: text('email'), // Optional - may be anonymous
    status: feedbackStatusEnum('status').notNull().default('pending'),
    userId: uuid('user_id'), // Optional - links to auth.users if authenticated
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  table => ({
    createdAtIdx: index('idx_feedback_created_at').on(table.createdAt),
    typeIdx: index('idx_feedback_type').on(table.type),
    statusIdx: index('idx_feedback_status').on(table.status),
    statusCreatedAtIdx: index('idx_feedback_status_created_at').on(table.status, table.createdAt),
  }),
);
```

**Query Utility Pattern:**

```typescript
// src/libs/queries/feedback.ts
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';
import { desc, eq, and } from 'drizzle-orm';

export type FeedbackType = 'bug' | 'feature' | 'praise';
export type FeedbackStatus = 'pending' | 'reviewed' | 'archived';

export interface FeedbackFilters {
  type?: FeedbackType;
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
}

export interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  message: string;
  email: string | null;
  status: FeedbackStatus;
  userId: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export async function getFeedbackList(filters: FeedbackFilters = {}): Promise<FeedbackEntry[] | null> {
  try {
    const { type, status, limit = 20, offset = 0 } = filters;

    // Build where conditions
    const conditions = [];
    if (type) conditions.push(eq(feedback.type, type));
    if (status) conditions.push(eq(feedback.status, status));

    // Query feedback
    const feedbackList = await db
      .select()
      .from(feedback)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    return feedbackList;
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return null;
  }
}

export async function getFeedbackCount(filters: FeedbackFilters = {}): Promise<number> {
  try {
    const { type, status } = filters;

    const conditions = [];
    if (type) conditions.push(eq(feedback.type, type));
    if (status) conditions.push(eq(feedback.status, status));

    const result = await db
      .select({ count: count() })
      .from(feedback)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Failed to count feedback:', error);
    return 0;
  }
}
```

**Page Implementation (Server Component):**

```typescript
// src/app/[locale]/(auth)/admin/feedback/page.tsx
import { getTranslations } from 'next-intl/server';
import { getFeedbackList, getFeedbackCount } from '@/libs/queries/feedback';
import { FeedbackList } from '@/components/admin/FeedbackList';
import { FeedbackFilters } from '@/components/admin/FeedbackFilters';
import { FeedbackPagination } from '@/components/admin/FeedbackPagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function FeedbackPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'Admin.Feedback' });

  // Parse filters from URL
  const type = typeof searchParams.type === 'string' ? searchParams.type as FeedbackType : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status as FeedbackStatus : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;

  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch feedback and count
  const [feedbackList, totalCount] = await Promise.all([
    getFeedbackList({ type, status, limit, offset }),
    getFeedbackCount({ type, status })
  ]);

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <FeedbackFilters />

      <Card>
        <CardHeader>
          <CardTitle>{t('allFeedback')}</CardTitle>
          <CardDescription>{t('showingResults', { count: feedbackList?.length || 0, total: totalCount })}</CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackList feedback={feedbackList || []} />
        </CardContent>
      </Card>

      <FeedbackPagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
```

**FeedbackCard Component:**

```typescript
// src/components/admin/FeedbackCard.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FeedbackDetailDialog } from './FeedbackDetailDialog';

interface FeedbackCardProps {
  feedback: {
    id: string;
    type: 'bug' | 'feature' | 'praise';
    message: string;
    email: string | null;
    status: 'pending' | 'reviewed' | 'archived';
    userId: string | null;
    createdAt: Date;
    reviewedAt: Date | null;
  };
}

const typeVariants: Record<string, 'destructive' | 'default' | 'secondary'> = {
  'bug': 'destructive',
  'feature': 'default',
  'praise': 'secondary',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  'pending': 'default',
  'reviewed': 'secondary',
  'archived': 'outline',
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const t = useTranslations('Admin.Feedback');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const messagePreview = feedback.message.length > 100
    ? `${feedback.message.substring(0, 100)}...`
    : feedback.message;

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsDetailOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={typeVariants[feedback.type]}>
                  {t(`types.${feedback.type}`)}
                </Badge>
                <Badge variant={statusVariants[feedback.status]}>
                  {t(`statuses.${feedback.status}`)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{messagePreview}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{feedback.email || t('anonymous')}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FeedbackDetailDialog
        feedback={feedback}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
```

### Implementation Strategy

**Phase 1: Database Schema**

1. Add `feedback` table to `src/models/Schema.ts`
2. Define enums for type and status
3. Add indexes for filtering and sorting
4. Run `npm run db:generate` to create migration
5. Verify migration applied (auto-applied on next DB interaction)

**Phase 2: Query Layer**

1. Create `src/libs/queries/feedback.ts`
2. Implement getFeedbackList with filtering and pagination
3. Implement getFeedbackCount for pagination
4. Write unit tests

**Phase 3: UI Components**

1. Create `src/app/[locale]/(auth)/admin/feedback/page.tsx`
2. Create `src/components/admin/FeedbackFilters.tsx`
3. Create `src/components/admin/FeedbackCard.tsx`
4. Create `src/components/admin/FeedbackDetailDialog.tsx`
5. Create `src/components/admin/FeedbackPagination.tsx`
6. Install shadcn components: Tabs, Card, Badge, Dialog
7. Wire up to query utilities

**Phase 4: Navigation & Translations**

1. Add feedback link to AdminSidebar (Management section)
2. Add translations to all locale files
3. Test all filter combinations
4. Test pagination

### Testing Strategy

**Database Schema Tests:**

```typescript
// src/models/Schema.feedback.test.ts
import { describe, it, expect } from 'vitest';
import { feedback } from './Schema';

describe('feedback schema', () => {
  it('has required columns', () => {
    const columns = Object.keys(feedback);
    expect(columns).toContain('id');
    expect(columns).toContain('type');
    expect(columns).toContain('message');
    expect(columns).toContain('email');
    expect(columns).toContain('status');
    expect(columns).toContain('userId');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('reviewedAt');
  });
});
```

**Query Utility Tests:**

```typescript
// src/libs/queries/feedback.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getFeedbackList, getFeedbackCount } from './feedback';

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockResolvedValue([]),
  },
}));

describe('getFeedbackList', () => {
  it('filters by type', async () => {
    const feedbackList = await getFeedbackList({ type: 'bug' });
    expect(feedbackList).toBeDefined();
  });

  it('filters by status', async () => {
    const feedbackList = await getFeedbackList({ status: 'pending' });
    expect(feedbackList).toBeDefined();
  });

  it('applies pagination', async () => {
    const feedbackList = await getFeedbackList({ limit: 10, offset: 20 });
    expect(feedbackList).toBeDefined();
  });
});
```

**Component Tests:**

```typescript
// src/components/admin/FeedbackCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackCard } from './FeedbackCard';

const mockFeedback = {
  id: '1',
  type: 'bug' as const,
  message: 'This is a test feedback message that is longer than 100 characters to test the truncation functionality of the feedback card component.',
  email: 'user@example.com',
  status: 'pending' as const,
  userId: 'user-123',
  createdAt: new Date('2026-01-29T12:00:00Z'),
  reviewedAt: null,
};

describe('FeedbackCard', () => {
  it('renders feedback data', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('truncates long messages', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    const preview = screen.getByText(/This is a test feedback message/);
    expect(preview.textContent?.length).toBeLessThan(mockFeedback.message.length);
  });

  it('displays type badge with correct color', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    const badge = screen.getByText(/bug/i);
    expect(badge).toHaveClass('bg-red'); // destructive variant
  });

  it('shows Anonymous when no email', () => {
    const anonymousFeedback = { ...mockFeedback, email: null };
    render(<FeedbackCard feedback={anonymousFeedback} />);

    expect(screen.getByText(/anonymous/i)).toBeInTheDocument();
  });
});
```

### Project Structure Notes

**New Files:**
```
src/
  models/
    Schema.ts                       # Updated with feedback table
    Schema.feedback.test.ts         # Schema tests
  libs/
    queries/
      feedback.ts                   # Feedback queries
      feedback.test.ts              # Query tests
  app/[locale]/(auth)/admin/
    feedback/
      page.tsx                      # Feedback list page
  components/admin/
    FeedbackList.tsx                # List wrapper component
    FeedbackCard.tsx                # Individual feedback card
    FeedbackCard.test.tsx           # Card tests
    FeedbackFilters.tsx             # Filter controls
    FeedbackFilters.test.tsx        # Filter tests
    FeedbackDetailDialog.tsx        # Detail view dialog
    FeedbackDetailDialog.test.tsx   # Dialog tests
    FeedbackPagination.tsx          # Pagination controls
```

**Updated Files:**
```
src/
  components/admin/
    AdminSidebar.tsx                # Add feedback nav link
  locales/
    en.json                         # Feedback translations
    hi.json                         # Hindi translations
    bn.json                         # Bengali translations
```

**Import Patterns:**
```typescript
import { getFeedbackList, getFeedbackCount } from '@/libs/queries/feedback';
import { FeedbackCard } from '@/components/admin/FeedbackCard';
import { feedback } from '@/models/Schema';
```

**Dependencies:**
- shadcn Tabs component (install if not present)
- shadcn Card component (already installed in Story 6.2)
- shadcn Badge component (already installed in Story 6.3)
- shadcn Dialog component (install if not present)
- date-fns for relative time formatting (already used in Story 6.6)
- Drizzle ORM (already configured)

### Previous Story Intelligence

**Learnings from Stories 6.1-6.7:**

1. **Database Pattern:**
   - Drizzle ORM with PostgreSQL
   - Migrations auto-applied on next DB interaction
   - Schema defined in `src/models/Schema.ts`
   - Indexes defined inline with table definition
   - Use pgEnum for type-safe enum columns

2. **Admin Route Pattern:**
   - Routes under `src/app/[locale]/(auth)/admin/`
   - Protected by middleware (Story 6.1)
   - Server Components for data fetching
   - Client Components for interactive UI

3. **Query Pattern:**
   - Separate query utilities in `src/libs/queries/`
   - Error handling returns null for graceful degradation
   - Server-side data fetching in page components
   - Pagination with limit/offset pattern

4. **Component Pattern:**
   - Server Components for pages (data fetching)
   - Client Components for interactive UI ("use client")
   - shadcn components as foundation
   - Custom components extend shadcn base

5. **Filtering Pattern (from Story 6.6):**
   - URL-based filter state (searchParams)
   - Client-side navigation updates (useRouter)
   - Filters persist in URL for shareability
   - Filter components are client-side

6. **Translation Pattern:**
   - Nested namespace: `Admin.Feedback.title`
   - Server: `await getTranslations({ locale, namespace })`
   - Client: `useTranslations('Admin.Feedback')`
   - All 3 locales updated simultaneously

7. **Navigation Pattern:**
   - AdminSidebar with grouped nav items
   - Active state based on pathname
   - MessageSquareText icon for feedback (Lucide)

### Security Considerations

**Access Control:**
- Feedback page protected by middleware (Story 6.1)
- Only admins can access `/admin/feedback` route
- Queries use standard client (not service role)
- Server-side data fetching only

**Data Privacy:**
- Email addresses visible only to admins
- Anonymous feedback supported (email can be null)
- No sensitive data in feedback table (by design)
- User IDs only link to auth.users (no direct exposure)

**Data Integrity:**
- Feedback entries are immutable (no edit in UI)
- Only status changes and deletion allowed (Story 6.9)
- Server-side validation for all actions
- Timestamps track creation and review

**Performance:**
- Indexes on frequently filtered columns (type, status, created_at)
- Pagination to limit query size (20 per page)
- Server-side filtering to reduce data transfer
- Composite index for filtered sorting

### References

- [Source: Epic 6 Story 6.8] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: .superdesign/design_iterations/admin_feedback_1.html] - Feedback list prototype
- [Source: Story 6.1] - Admin access control and middleware
- [Source: Story 6.2] - Admin layout and navigation
- [Source: Story 6.6] - Audit logging pattern (similar filtering approach)
- [Source: src/models/Schema.ts] - Current database schema
- [Source: CLAUDE.md#Database] - Drizzle ORM patterns
- [Source: Epic 5] - User feedback collection (BACKLOG - schema needed for future)

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
