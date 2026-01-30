# Story 6.9: Feedback Admin Actions

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin managing feedback,
I want to take actions on feedback items,
so that I can track what's been reviewed and export data.

## Acceptance Criteria

### AC1: Mark Feedback as Reviewed
**Given** a pending feedback item
**When** I click "Mark as Reviewed"
**Then** status changes to "reviewed"
**And** reviewed_at timestamp is set
**And** UI updates to reflect new status
**And** I see confirmation toast

### AC2: Delete Feedback
**Given** a feedback item
**When** I click "Delete"
**Then** I see a confirmation dialog
**And** dialog warns about permanent deletion
**And** on confirm, item is deleted from database
**And** list updates to remove the item

### AC3: Archive Feedback
**Given** I click "Archive"
**When** I archive a feedback item
**Then** status changes to "archived"
**And** item remains in database but hidden by default
**And** I can filter to see archived items

### AC4: Export CSV
**Given** the feedback admin page
**When** I click "Export CSV"
**Then** a CSV file is downloaded
**And** file contains: id, type, message, email, status, created_at, reviewed_at
**And** filename includes date (e.g., feedback-2024-01-15.csv)

### AC5: Export Filtered Results
**Given** filters are active
**When** I export CSV
**Then** only filtered results are exported
**And** export reflects current filter state

### AC6: Bulk Actions
**Given** bulk actions
**When** I select multiple feedback items
**Then** I can mark all as reviewed
**And** I can delete all selected
**And** confirmation is required for bulk actions

## Tasks / Subtasks

- [ ] Task 1: Create mark-as-reviewed API route (AC: #1)
  - [ ] Subtask 1.1: Create `src/app/api/admin/feedback/[id]/mark-reviewed/route.ts`
  - [ ] Subtask 1.2: Verify admin session (pattern from Story 6.4)
  - [ ] Subtask 1.3: Check isAdmin() - return forbiddenError if not admin
  - [ ] Subtask 1.4: Extract feedback ID from route params
  - [ ] Subtask 1.5: Verify feedback exists (query database)
  - [ ] Subtask 1.6: Return notFoundError if feedback not found
  - [ ] Subtask 1.7: Update feedback status to 'reviewed' using Drizzle ORM
  - [ ] Subtask 1.8: Set reviewedAt timestamp to current time
  - [ ] Subtask 1.9: Return updated feedback entry
  - [ ] Subtask 1.10: Log admin action using logAdminAction()
  - [ ] Subtask 1.11: Add error handling with try/catch (return internalError)
  - [ ] Subtask 1.12: Add proper TypeScript types

- [ ] Task 2: Create delete feedback API route (AC: #2)
  - [ ] Subtask 2.1: Create `src/app/api/admin/feedback/[id]/delete/route.ts`
  - [ ] Subtask 2.2: Verify admin session
  - [ ] Subtask 2.3: Check isAdmin() - return forbiddenError if not admin
  - [ ] Subtask 2.4: Extract feedback ID from route params
  - [ ] Subtask 2.5: Verify feedback exists
  - [ ] Subtask 2.6: Return notFoundError if not found
  - [ ] Subtask 2.7: Delete feedback entry using Drizzle ORM (db.delete())
  - [ ] Subtask 2.8: Return success response
  - [ ] Subtask 2.9: Log admin action with feedback metadata
  - [ ] Subtask 2.10: Add error handling with try/catch

- [ ] Task 3: Create archive feedback API route (AC: #3)
  - [ ] Subtask 3.1: Create `src/app/api/admin/feedback/[id]/archive/route.ts`
  - [ ] Subtask 3.2: Verify admin session
  - [ ] Subtask 3.3: Check isAdmin()
  - [ ] Subtask 3.4: Extract feedback ID from params
  - [ ] Subtask 3.5: Verify feedback exists
  - [ ] Subtask 3.6: Update status to 'archived' using Drizzle ORM
  - [ ] Subtask 3.7: Return updated feedback entry
  - [ ] Subtask 3.8: Log admin action
  - [ ] Subtask 3.9: Add error handling

- [ ] Task 4: Create export CSV API route (AC: #4, #5)
  - [ ] Subtask 4.1: Create `src/app/api/admin/feedback/export/route.ts`
  - [ ] Subtask 4.2: Verify admin session
  - [ ] Subtask 4.3: Check isAdmin()
  - [ ] Subtask 4.4: Parse URL search params for filters (type, status)
  - [ ] Subtask 4.5: Fetch filtered feedback using getFeedbackList()
  - [ ] Subtask 4.6: Convert feedback entries to CSV format
  - [ ] Subtask 4.7: Include headers: id, type, message, email, status, created_at, reviewed_at
  - [ ] Subtask 4.8: Format timestamps in ISO 8601 format
  - [ ] Subtask 4.9: Escape CSV special characters (commas, quotes)
  - [ ] Subtask 4.10: Generate filename with current date (feedback-YYYY-MM-DD.csv)
  - [ ] Subtask 4.11: Return Response with CSV content-type and attachment disposition
  - [ ] Subtask 4.12: Log admin action for export
  - [ ] Subtask 4.13: Add error handling

- [ ] Task 5: Create bulk actions API route (AC: #6)
  - [ ] Subtask 5.1: Create `src/app/api/admin/feedback/bulk/route.ts`
  - [ ] Subtask 5.2: Verify admin session
  - [ ] Subtask 5.3: Check isAdmin()
  - [ ] Subtask 5.4: Define Zod schema for request body (action: 'mark-reviewed' | 'delete', ids: string[])
  - [ ] Subtask 5.5: Validate request body - return validationError if invalid
  - [ ] Subtask 5.6: Verify all feedback IDs exist
  - [ ] Subtask 5.7: Return validationError for any missing IDs
  - [ ] Subtask 5.8: Execute bulk action based on action type
  - [ ] Subtask 5.9: For 'mark-reviewed': update all selected to reviewed status
  - [ ] Subtask 5.10: For 'delete': delete all selected entries
  - [ ] Subtask 5.11: Use transaction for bulk operations (db.transaction)
  - [ ] Subtask 5.12: Return success count and failed IDs if any
  - [ ] Subtask 5.13: Log admin action with count and action type
  - [ ] Subtask 5.14: Add error handling with rollback

- [ ] Task 6: Wire up FeedbackDetailDialog actions (AC: #1, #2, #3)
  - [ ] Subtask 6.1: Update `src/components/admin/FeedbackDetailDialog.tsx`
  - [ ] Subtask 6.2: Add state for loading and error handling
  - [ ] Subtask 6.3: Implement handleMarkReviewed function
  - [ ] Subtask 6.4: Call POST /api/admin/feedback/[id]/mark-reviewed
  - [ ] Subtask 6.5: Show loading spinner on button during request
  - [ ] Subtask 6.6: Update local state on success
  - [ ] Subtask 6.7: Show success toast on success
  - [ ] Subtask 6.8: Show error toast on failure
  - [ ] Subtask 6.9: Add router.refresh() to update server data
  - [ ] Subtask 6.10: Implement handleDelete function
  - [ ] Subtask 6.11: Show AlertDialog confirmation before delete
  - [ ] Subtask 6.12: Require user to type "delete" to confirm
  - [ ] Subtask 6.13: Call POST /api/admin/feedback/[id]/delete
  - [ ] Subtask 6.14: Close dialog on successful delete
  - [ ] Subtask 6.15: Refresh list with router.refresh()
  - [ ] Subtask 6.16: Add handleArchive function (optional button)
  - [ ] Subtask 6.17: Call POST /api/admin/feedback/[id]/archive
  - [ ] Subtask 6.18: Update status badge in UI
  - [ ] Subtask 6.19: Replace placeholder handleAction with real handlers

- [ ] Task 7: Add export CSV button to feedback page (AC: #4, #5)
  - [ ] Subtask 7.1: Update `src/app/[locale]/(auth)/admin/feedback/page.tsx`
  - [ ] Subtask 7.2: Add ExportCsvButton client component in header area
  - [ ] Subtask 7.3: Create `src/components/admin/ExportCsvButton.tsx` as "use client"
  - [ ] Subtask 7.4: Accept currentFilters prop (type?, status?)
  - [ ] Subtask 7.5: Implement handleExport function
  - [ ] Subtask 7.6: Build URL with filter query params
  - [ ] Subtask 7.7: Call GET /api/admin/feedback/export with params
  - [ ] Subtask 7.8: Trigger browser download from blob response
  - [ ] Subtask 7.9: Show loading state during export
  - [ ] Subtask 7.10: Show success toast on complete
  - [ ] Subtask 7.11: Show error toast on failure
  - [ ] Subtask 7.12: Use Download icon from Lucide
  - [ ] Subtask 7.13: Add keyboard shortcut hint (optional)

- [ ] Task 8: Add bulk selection UI to FeedbackList (AC: #6)
  - [ ] Subtask 8.1: Update `src/components/admin/FeedbackList.tsx`
  - [ ] Subtask 8.2: Add state for selected feedback IDs (useState<string[]>)
  - [ ] Subtask 8.3: Add "Select All" checkbox in list header
  - [ ] Subtask 8.4: Add individual checkboxes to each FeedbackCard
  - [ ] Subtask 8.5: Update FeedbackCard to accept onSelect and isSelected props
  - [ ] Subtask 8.6: Show bulk action toolbar when selections > 0
  - [ ] Subtask 8.7: Display selection count in toolbar
  - [ ] Subtask 8.8: Add "Mark All as Reviewed" button
  - [ ] Subtask 8.9: Add "Delete All" button (destructive variant)
  - [ ] Subtask 8.10: Add "Clear Selection" button
  - [ ] Subtask 8.11: Implement handleBulkMarkReviewed
  - [ ] Subtask 8.12: Show AlertDialog confirmation for bulk actions
  - [ ] Subtask 8.13: Call POST /api/admin/feedback/bulk
  - [ ] Subtask 8.14: Update UI and refresh after bulk action
  - [ ] Subtask 8.15: Clear selection after successful action

- [ ] Task 9: Add audit logging for feedback actions (AC: #1, #2, #3, #4, #6)
  - [ ] Subtask 9.1: Import logAdminAction from `src/libs/audit/logAdminAction.ts`
  - [ ] Subtask 9.2: Log "feedback_mark_reviewed" action with feedback ID
  - [ ] Subtask 9.3: Log "feedback_delete" action with feedback metadata
  - [ ] Subtask 9.4: Log "feedback_archive" action with feedback ID
  - [ ] Subtask 9.5: Log "feedback_export" action with filter params
  - [ ] Subtask 9.6: Log "feedback_bulk_action" with action type and count
  - [ ] Subtask 9.7: Include admin user ID from session
  - [ ] Subtask 9.8: Add metadata for target_type: 'feedback'
  - [ ] Subtask 9.9: Ensure logging doesn't block action (fire and forget or graceful error)

- [ ] Task 10: Add i18n translations (AC: #1, #2, #3, #4, #6)
  - [ ] Subtask 10.1: Add action translations to `src/locales/en.json`
  - [ ] Subtask 10.2: Add button labels (Mark Reviewed, Delete, Archive, Export CSV)
  - [ ] Subtask 10.3: Add confirmation dialog messages
  - [ ] Subtask 10.4: Add success/error toast messages
  - [ ] Subtask 10.5: Add bulk action labels and confirmations
  - [ ] Subtask 10.6: Add CSV export messages
  - [ ] Subtask 10.7: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 10.8: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 10.9: Use translations in all components

- [ ] Task 11: Write API route tests (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Subtask 11.1: Create `src/app/api/admin/feedback/[id]/mark-reviewed/__tests__/route.test.ts`
  - [ ] Subtask 11.2: Test route requires authentication
  - [ ] Subtask 11.3: Test route requires admin role
  - [ ] Subtask 11.4: Test route updates status and reviewedAt
  - [ ] Subtask 11.5: Test route returns 404 for invalid ID
  - [ ] Subtask 11.6: Create delete route tests
  - [ ] Subtask 11.7: Test delete removes entry from database
  - [ ] Subtask 11.8: Create archive route tests
  - [ ] Subtask 11.9: Test archive updates status to 'archived'
  - [ ] Subtask 11.10: Create export route tests
  - [ ] Subtask 11.11: Test CSV format is correct
  - [ ] Subtask 11.12: Test export respects filters
  - [ ] Subtask 11.13: Test filename includes date
  - [ ] Subtask 11.14: Create bulk action route tests
  - [ ] Subtask 11.15: Test bulk mark reviewed updates all selected
  - [ ] Subtask 11.16: Test bulk delete removes all selected
  - [ ] Subtask 11.17: Test transaction rollback on partial failure
  - [ ] Subtask 11.18: Mock Supabase client and Drizzle DB

- [ ] Task 12: Write component tests (AC: #1, #2, #3, #4, #6)
  - [ ] Subtask 12.1: Update `src/components/admin/FeedbackDetailDialog.test.tsx`
  - [ ] Subtask 12.2: Test mark reviewed button calls API
  - [ ] Subtask 12.3: Test delete button shows confirmation
  - [ ] Subtask 12.4: Test delete confirmation requires typing "delete"
  - [ ] Subtask 12.5: Test loading states during actions
  - [ ] Subtask 12.6: Test error handling displays toast
  - [ ] Subtask 12.7: Create `src/components/admin/ExportCsvButton.test.tsx`
  - [ ] Subtask 12.8: Test export button triggers download
  - [ ] Subtask 12.9: Test export includes filter params
  - [ ] Subtask 12.10: Create `src/components/admin/FeedbackList.test.tsx` (bulk actions)
  - [ ] Subtask 12.11: Test bulk selection state management
  - [ ] Subtask 12.12: Test select all checkbox
  - [ ] Subtask 12.13: Test bulk action toolbar appears on selection
  - [ ] Subtask 12.14: Test bulk action confirmation dialogs
  - [ ] Subtask 12.15: Mock fetch calls for API routes

## Dev Notes

### Critical Architecture Requirements

**IMPORTANT CONTEXT: Story 6.8 Dependency**
- Story 6.8 created the feedback schema and list view
- Story 6.8 created FeedbackDetailDialog with placeholder action buttons
- This story (6.9) replaces the placeholder `handleAction()` with real API calls
- The "Coming in Story 6.9" toast must be removed and replaced with actual functionality

**Existing Components to Update:**
- `src/components/admin/FeedbackDetailDialog.tsx` - Replace placeholder handlers
- `src/components/admin/FeedbackList.tsx` - Add bulk selection UI
- `src/app/[locale]/(auth)/admin/feedback/page.tsx` - Add export button

**Admin API Route Pattern:**

Follow the pattern established in Stories 6.4, 6.6, 6.7 for admin routes:

```typescript
// src/app/api/admin/feedback/[id]/mark-reviewed/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { createClient } from '@/libs/supabase/server';
import { isAdmin } from '@/libs/auth/isAdmin';
import { forbiddenError, notFoundError, internalError } from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';
import { logAdminAction } from '@/libs/audit/logAdminAction';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verify admin session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!await isAdmin(user)) {
      return forbiddenError();
    }

    // Verify feedback exists
    const existingFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1);

    if (!existingFeedback || existingFeedback.length === 0) {
      return notFoundError();
    }

    // Update feedback
    const updatedFeedback = await db
      .update(feedback)
      .set({
        status: 'reviewed',
        reviewedAt: new Date(),
      })
      .where(eq(feedback.id, id))
      .returning();

    // Log admin action
    await logAdminAction({
      adminId: user.id,
      action: 'feedback_mark_reviewed',
      targetType: 'feedback',
      targetId: id,
      metadata: {
        feedbackType: existingFeedback[0].type,
      },
    });

    return NextResponse.json(updatedFeedback[0]);
  } catch (error) {
    console.error('Failed to mark feedback as reviewed:', error);
    return internalError();
  }
}
```

**Delete with Confirmation Pattern:**

```typescript
// In FeedbackDetailDialog.tsx
const [deleteConfirmText, setDeleteConfirmText] = useState('');
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

const handleDelete = async () => {
  if (deleteConfirmText !== 'delete') {
    toast({
      title: t('detail.deleteConfirmError'),
      variant: 'destructive',
    });
    return;
  }

  setIsDeleting(true);
  try {
    const response = await fetch(`/api/admin/feedback/${feedback.id}/delete`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to delete');
    }

    toast({
      title: t('detail.deleteSuccess'),
    });

    setIsDeleteDialogOpen(false);
    onOpenChange(false);
    router.refresh(); // Refresh server data
  } catch (error) {
    toast({
      title: t('detail.deleteError'),
      variant: 'destructive',
    });
  } finally {
    setIsDeleting(false);
  }
};

// In JSX
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">{t('detail.delete')}</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('detail.deleteConfirmTitle')}</AlertDialogTitle>
      <AlertDialogDescription>
        {t('detail.deleteConfirmMessage')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <Input
      placeholder={t('detail.deleteConfirmPlaceholder')}
      value={deleteConfirmText}
      onChange={(e) => setDeleteConfirmText(e.target.value)}
    />
    <AlertDialogFooter>
      <AlertDialogCancel>{t('detail.cancel')}</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        disabled={deleteConfirmText !== 'delete' || isDeleting}
      >
        {isDeleting ? t('detail.deleting') : t('detail.confirmDelete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**CSV Export Pattern:**

```typescript
// src/app/api/admin/feedback/export/route.ts
export async function GET(request: Request) {
  try {
    // Verify admin (same pattern as above)

    // Parse filters from URL
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as FeedbackType | undefined;
    const status = url.searchParams.get('status') as FeedbackStatus | undefined;

    // Fetch feedback
    const feedbackList = await getFeedbackList({ type, status, limit: 10000 });

    if (!feedbackList) {
      return internalError();
    }

    // Convert to CSV
    const headers = ['id', 'type', 'message', 'email', 'status', 'created_at', 'reviewed_at'];
    const csvRows = [
      headers.join(','),
      ...feedbackList.map(item => [
        item.id,
        item.type,
        `"${item.message.replace(/"/g, '""')}"`, // Escape quotes
        item.email || '',
        item.status,
        item.createdAt.toISOString(),
        item.reviewedAt?.toISOString() || '',
      ].join(',')),
    ];

    const csvContent = csvRows.join('\n');

    // Generate filename
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `feedback-${date}.csv`;

    // Log action
    await logAdminAction({
      adminId: user.id,
      action: 'feedback_export',
      targetType: 'feedback',
      metadata: {
        filters: { type, status },
        count: feedbackList.length,
      },
    });

    // Return CSV
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export feedback:', error);
    return internalError();
  }
}
```

**Bulk Actions Pattern:**

```typescript
// src/app/api/admin/feedback/bulk/route.ts
const bulkActionSchema = z.object({
  action: z.enum(['mark-reviewed', 'delete']),
  ids: z.array(z.string().uuid()),
});

export async function POST(request: Request) {
  try {
    // Verify admin

    // Parse and validate body
    const body = await request.json();
    const result = bulkActionSchema.safeParse(body);

    if (!result.success) {
      return validationError(formatZodErrors(result.error));
    }

    const { action, ids } = result.data;

    // Execute in transaction
    await db.transaction(async (tx) => {
      if (action === 'mark-reviewed') {
        await tx
          .update(feedback)
          .set({
            status: 'reviewed',
            reviewedAt: new Date(),
          })
          .where(inArray(feedback.id, ids));
      } else if (action === 'delete') {
        await tx
          .delete(feedback)
          .where(inArray(feedback.id, ids));
      }
    });

    // Log action
    await logAdminAction({
      adminId: user.id,
      action: `feedback_bulk_${action}`,
      targetType: 'feedback',
      metadata: {
        count: ids.length,
        action,
      },
    });

    return NextResponse.json({
      success: true,
      count: ids.length,
    });
  } catch (error) {
    console.error('Failed to execute bulk action:', error);
    return internalError();
  }
}
```

**Bulk Selection UI Pattern:**

```typescript
// In FeedbackList.tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const handleSelectAll = () => {
  if (selectedIds.length === feedback.length) {
    setSelectedIds([]);
  } else {
    setSelectedIds(feedback.map(item => item.id));
  }
};

const handleToggleSelect = (id: string) => {
  setSelectedIds(prev =>
    prev.includes(id)
      ? prev.filter(itemId => itemId !== id)
      : [...prev, id]
  );
};

const handleBulkMarkReviewed = async () => {
  // Show confirmation dialog
  // Call API
  // Refresh and clear selection
};

// In JSX
{selectedIds.length > 0 && (
  <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
    <span className="text-sm text-muted-foreground">
      {t('bulkActions.selected', { count: selectedIds.length })}
    </span>
    <Button
      size="sm"
      onClick={handleBulkMarkReviewed}
    >
      {t('bulkActions.markReviewed')}
    </Button>
    <Button
      size="sm"
      variant="destructive"
      onClick={handleBulkDelete}
    >
      {t('bulkActions.delete')}
    </Button>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setSelectedIds([])}
    >
      {t('bulkActions.clearSelection')}
    </Button>
  </div>
)}
```

### Implementation Strategy

**Phase 1: API Routes**

1. Create mark-as-reviewed API route
2. Create delete API route
3. Create archive API route
4. Create export CSV API route
5. Create bulk actions API route
6. Add audit logging to all routes
7. Write API route tests

**Phase 2: Update FeedbackDetailDialog**

1. Remove placeholder `handleAction()`
2. Add real handlers for mark reviewed, delete, archive
3. Add loading states and error handling
4. Add confirmation dialogs for destructive actions
5. Wire up to API routes
6. Add router.refresh() after mutations
7. Test all actions

**Phase 3: Add Export and Bulk Actions UI**

1. Create ExportCsvButton component
2. Add export button to feedback page header
3. Update FeedbackList with bulk selection UI
4. Add checkboxes to FeedbackCard
5. Add bulk action toolbar
6. Wire up bulk actions to API
7. Test export and bulk actions

**Phase 4: Translations and Testing**

1. Add all translations to locale files
2. Update component tests
3. Test complete flow: filter -> select -> bulk action
4. Test CSV export with different filters
5. Test confirmation dialogs

### Testing Strategy

**API Route Tests:**

```typescript
// src/app/api/admin/feedback/[id]/mark-reviewed/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';

vi.mock('@/libs/supabase/server');
vi.mock('@/libs/DB');
vi.mock('@/libs/audit/logAdminAction');

describe('POST /api/admin/feedback/[id]/mark-reviewed', () => {
  it('requires authentication', async () => {
    // Mock unauthenticated user
    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'test-id' }),
    });
    expect(response.status).toBe(401);
  });

  it('requires admin role', async () => {
    // Mock non-admin user
    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'test-id' }),
    });
    expect(response.status).toBe(403);
  });

  it('updates feedback status and reviewedAt', async () => {
    // Mock admin user and feedback
    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'test-id' }),
    });
    expect(response.status).toBe(200);
    // Verify db.update was called with correct params
  });

  it('returns 404 for invalid ID', async () => {
    // Mock admin user, no feedback found
    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    expect(response.status).toBe(404);
  });
});
```

**Component Tests:**

```typescript
// src/components/admin/FeedbackDetailDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackDetailDialog } from './FeedbackDetailDialog';

global.fetch = vi.fn();

describe('FeedbackDetailDialog actions', () => {
  it('calls mark reviewed API on button click', async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: 'reviewed' }), { status: 200 })
    );

    render(
      <FeedbackDetailDialog
        feedback={mockPendingFeedback}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const button = screen.getByTestId('mark-reviewed-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/admin/feedback/${mockPendingFeedback.id}/mark-reviewed`,
        { method: 'POST' }
      );
    });
  });

  it('shows confirmation dialog before delete', async () => {
    render(
      <FeedbackDetailDialog
        feedback={mockFeedback}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const deleteButton = screen.getByTestId('delete-feedback-btn');
    fireEvent.click(deleteButton);

    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
  });

  it('requires typing "delete" to confirm deletion', async () => {
    render(
      <FeedbackDetailDialog
        feedback={mockFeedback}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const deleteButton = screen.getByTestId('delete-feedback-btn');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();

    const input = screen.getByPlaceholderText(/type.*delete/i);
    fireEvent.change(input, { target: { value: 'delete' } });

    expect(confirmButton).not.toBeDisabled();
  });
});
```

### Project Structure Notes

**New Files:**
```
src/
  app/api/admin/feedback/
    [id]/
      mark-reviewed/
        route.ts                      # Mark as reviewed API
        __tests__/
          route.test.ts               # Tests
      delete/
        route.ts                      # Delete API
        __tests__/
          route.test.ts               # Tests
      archive/
        route.ts                      # Archive API
        __tests__/
          route.test.ts               # Tests
    export/
      route.ts                        # CSV export API
      __tests__/
        route.test.ts                 # Tests
    bulk/
      route.ts                        # Bulk actions API
      __tests__/
        route.test.ts                 # Tests
  components/admin/
    ExportCsvButton.tsx               # CSV export button
    ExportCsvButton.test.tsx          # Tests
```

**Updated Files:**
```
src/
  components/admin/
    FeedbackDetailDialog.tsx          # Replace placeholder handlers
    FeedbackDetailDialog.test.tsx     # Add action tests
    FeedbackList.tsx                  # Add bulk selection UI
    FeedbackList.test.tsx             # Add bulk tests (new)
    FeedbackCard.tsx                  # Add selection checkbox prop
  app/[locale]/(auth)/admin/feedback/
    page.tsx                          # Add export button
  locales/
    en.json                           # Action translations
    hi.json                           # Hindi translations
    bn.json                           # Bengali translations
```

**Import Patterns:**
```typescript
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { isAdmin } from '@/libs/auth/isAdmin';
import { getFeedbackList } from '@/libs/queries/feedback';
import { forbiddenError, notFoundError, internalError, validationError } from '@/libs/api/errors';
import { eq, inArray } from 'drizzle-orm';
```

**Dependencies:**
- shadcn AlertDialog (install if not present)
- shadcn Input (already installed)
- Drizzle ORM (already configured)
- Audit logging utility (from Story 6.6)
- Admin utilities (from Story 6.1)

### Previous Story Intelligence

**Learnings from Stories 6.1-6.8:**

1. **Admin API Pattern (Story 6.4):**
   - Always verify admin session first
   - Use isAdmin() utility for role check
   - Return standard error responses (401, 403, 404, 500)
   - Add audit logging for all admin actions
   - Use try/catch for error handling

2. **Database Mutations (Story 6.4):**
   - Use Drizzle ORM's update() and delete() methods
   - Use .returning() to get updated rows
   - Always verify record exists before mutation
   - Return notFoundError if record missing

3. **Confirmation Dialogs (Story 6.4):**
   - Use AlertDialog for destructive actions
   - Require typing confirmation text for dangerous actions
   - Show clear warning messages
   - Disable confirm button until validation passes

4. **Audit Logging (Story 6.6):**
   - Log all admin actions with logAdminAction()
   - Include admin ID, action type, target type, target ID
   - Add metadata for context
   - Don't block action if logging fails (graceful degradation)

5. **Feedback Schema (Story 6.8):**
   - Feedback table with id, type, message, email, status, userId, createdAt, reviewedAt
   - Status enum: 'pending', 'reviewed', 'archived'
   - Type enum: 'bug', 'feature', 'praise'
   - Query utilities in src/libs/queries/feedback.ts

6. **Client-side Mutations:**
   - Use router.refresh() after mutations to update server data
   - Show loading states during API calls
   - Show success/error toasts for user feedback
   - Clear form/selection state after successful action

7. **CSV Export Best Practices:**
   - Escape special characters (quotes, commas)
   - Use ISO 8601 format for timestamps
   - Include meaningful filename with date
   - Set correct Content-Type and Content-Disposition headers
   - Limit export size (10000 rows max)

### Security Considerations

**Access Control:**
- All routes protected by admin middleware
- Double-check with isAdmin() in each route
- Audit log all admin actions
- No client-side admin checks (server-side only)

**Data Validation:**
- Validate all request bodies with Zod
- Verify feedback exists before mutations
- Sanitize CSV output (escape special characters)
- Validate bulk action IDs are valid UUIDs

**Data Integrity:**
- Use transactions for bulk operations
- Rollback on partial failures
- Log all destructive actions
- Confirm before permanent deletions

**Performance:**
- Limit CSV export to 10000 rows
- Use indexed queries for filtering
- Bulk operations in single transaction
- Client-side debounce for bulk selection

### References

- [Source: Epic 6 Story 6.9] - Full acceptance criteria
- [Source: Story 6.8] - Feedback schema and list view
- [Source: Story 6.4] - User detail actions pattern (delete, suspend)
- [Source: Story 6.6] - Audit logging implementation
- [Source: Story 6.7] - Admin API route pattern
- [Source: src/components/admin/FeedbackDetailDialog.tsx] - Placeholder buttons to replace
- [Source: src/libs/audit/logAdminAction.ts] - Audit logging utility
- [Source: src/libs/auth/isAdmin.ts] - Admin role check
- [Source: src/libs/queries/feedback.ts] - Feedback query utilities
- [Source: CLAUDE.md#API Error Handling] - Error response patterns

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
