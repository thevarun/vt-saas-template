# Story 6.6: Admin Audit Logging

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a product owner,
I want admin actions to be logged,
so that I have accountability and can troubleshoot issues.

## Acceptance Criteria

### AC1: Audit Log Entry Creation
**Given** an admin performs an action
**When** the action is: suspend user, delete user, reset password
**Then** an audit log entry is created
**And** entry includes: admin_id, action, target_user_id, timestamp
**And** entry includes: metadata (reason if provided)

### AC2: Database Schema
**Given** the audit log schema
**When** I review the database
**Then** admin_audit_log table exists
**And** table has: id, admin_id, action, target_type, target_id, metadata, created_at
**And** appropriate indexes exist

### AC3: Audit Log Access
**Given** the admin panel
**When** I look for audit log
**Then** I can access audit log from admin settings
**And** I see a list of recent admin actions
**And** list shows: action, admin, target, timestamp

### AC4: Filtering Capabilities
**Given** the audit log list
**When** I view entries
**Then** I can filter by action type
**And** I can filter by date range
**And** I can filter by admin user

### AC5: Data Integrity
**Given** audit log entries
**When** I review them
**Then** entries are tamper-resistant (no edit/delete in UI)
**And** entries are retained for compliance period
**And** sensitive data is appropriately logged (no passwords)

### AC6: Logging Implementation
**Given** the audit logging implementation
**When** I review the code
**Then** logging is done server-side only
**And** logging function is reusable: `logAdminAction(action, target, metadata)`
**And** logging failures don't break admin actions (graceful)

## Tasks / Subtasks

- [ ] Task 1: Create audit log database schema (AC: #1, #2, #5)
  - [ ] Subtask 1.1: Add `adminAuditLog` table to `src/models/Schema.ts`
  - [ ] Subtask 1.2: Define columns: id (uuid), admin_id (uuid), action (text), target_type (text), target_id (uuid), metadata (jsonb), created_at (timestamp)
  - [ ] Subtask 1.3: Add index on admin_id for filtering by admin
  - [ ] Subtask 1.4: Add index on created_at for date range filtering
  - [ ] Subtask 1.5: Add composite index on (action, created_at) for action filtering
  - [ ] Subtask 1.6: Add NOT NULL constraints on required fields (id, admin_id, action, target_type, target_id, created_at)
  - [ ] Subtask 1.7: Set default value for created_at (defaultNow())
  - [ ] Subtask 1.8: Run `npm run db:generate` to create migration
  - [ ] Subtask 1.9: Verify migration file in drizzle/ directory

- [ ] Task 2: Create audit logging utility function (AC: #1, #6)
  - [ ] Subtask 2.1: Create `src/libs/audit/logAdminAction.ts`
  - [ ] Subtask 2.2: Define LogAdminActionParams interface (action, targetType, targetId, adminId, metadata?)
  - [ ] Subtask 2.3: Define AuditAction enum: 'suspend_user', 'unsuspend_user', 'delete_user', 'reset_password'
  - [ ] Subtask 2.4: Implement logAdminAction() function to insert into adminAuditLog table
  - [ ] Subtask 2.5: Use Drizzle ORM client from `src/libs/DB.ts`
  - [ ] Subtask 2.6: Add comprehensive try-catch error handling
  - [ ] Subtask 2.7: Log errors to console but don't throw (graceful degradation)
  - [ ] Subtask 2.8: Return success boolean (true if logged, false if failed)
  - [ ] Subtask 2.9: Add TypeScript types for metadata (reason?: string, [key: string]: any)

- [ ] Task 3: Integrate audit logging into existing admin API routes (AC: #1, #6)
  - [ ] Subtask 3.1: Import logAdminAction in suspend route (`src/app/api/admin/users/[userId]/suspend/route.ts`)
  - [ ] Subtask 3.2: Call logAdminAction after successful suspend with metadata (reason)
  - [ ] Subtask 3.3: Import logAdminAction in unsuspend route (`src/app/api/admin/users/[userId]/unsuspend/route.ts`)
  - [ ] Subtask 3.4: Call logAdminAction after successful unsuspend
  - [ ] Subtask 3.5: Import logAdminAction in reset-password route (`src/app/api/admin/users/[userId]/reset-password/route.ts`)
  - [ ] Subtask 3.6: Call logAdminAction after successful password reset
  - [ ] Subtask 3.7: Extract admin_id from Supabase session (await supabase.auth.getUser())
  - [ ] Subtask 3.8: Pass userId as target_id and 'user' as target_type
  - [ ] Subtask 3.9: Ensure logging failures don't affect API response (await in background)

- [ ] Task 4: Create audit log query utilities (AC: #3, #4)
  - [ ] Subtask 4.1: Create `src/libs/queries/auditLog.ts`
  - [ ] Subtask 4.2: Define AuditLogFilters interface (action?, adminId?, startDate?, endDate?, limit?, offset?)
  - [ ] Subtask 4.3: Implement getAuditLogs(filters) function
  - [ ] Subtask 4.4: Query adminAuditLog table with Drizzle ORM
  - [ ] Subtask 4.5: Apply filters conditionally (where clauses for action, adminId)
  - [ ] Subtask 4.6: Apply date range filter (gte startDate, lte endDate)
  - [ ] Subtask 4.7: Order by created_at DESC (newest first)
  - [ ] Subtask 4.8: Apply pagination (limit, offset)
  - [ ] Subtask 4.9: Join with auth.users to get admin email/name
  - [ ] Subtask 4.10: Return enriched audit log entries with admin details
  - [ ] Subtask 4.11: Add error handling (return null on error)
  - [ ] Subtask 4.12: Implement getAuditLogCount(filters) for pagination

- [ ] Task 5: Create audit log page UI (AC: #3, #4, #5)
  - [ ] Subtask 5.1: Create `src/app/[locale]/(auth)/admin/audit/page.tsx`
  - [ ] Subtask 5.2: Mark as async Server Component for data fetching
  - [ ] Subtask 5.3: Fetch audit logs server-side using getAuditLogs()
  - [ ] Subtask 5.4: Parse URL search params for filters (action, adminId, startDate, endDate, page)
  - [ ] Subtask 5.5: Calculate pagination (limit: 50, offset from page param)
  - [ ] Subtask 5.6: Pass data to client component AuditLogTable
  - [ ] Subtask 5.7: Add page title and description
  - [ ] Subtask 5.8: Wrap in Card component for consistent styling

- [ ] Task 6: Create AuditLogTable component (AC: #3, #4, #5)
  - [ ] Subtask 6.1: Create `src/components/admin/AuditLogTable.tsx` as "use client" component
  - [ ] Subtask 6.2: Use shadcn Table components (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
  - [ ] Subtask 6.3: Define columns: Action, Admin, Target, Timestamp, Metadata
  - [ ] Subtask 6.4: Display action with color-coded Badge (suspend=red, unsuspend=green, delete=red, reset_password=yellow)
  - [ ] Subtask 6.5: Display admin email or name from joined user data
  - [ ] Subtask 6.6: Display target_id (truncated UUID with copy button)
  - [ ] Subtask 6.7: Format timestamp with relative time (e.g., "2 hours ago") and full date on hover
  - [ ] Subtask 6.8: Display metadata.reason if present, else "--"
  - [ ] Subtask 6.9: Add empty state when no logs found
  - [ ] Subtask 6.10: Add loading skeleton state (from server streaming)
  - [ ] Subtask 6.11: Make table read-only (no edit/delete buttons)

- [ ] Task 7: Create audit log filter controls (AC: #4)
  - [ ] Subtask 7.1: Create `src/components/admin/AuditLogFilters.tsx` as "use client" component
  - [ ] Subtask 7.2: Add action filter Select with options: All, Suspend User, Unsuspend User, Delete User, Reset Password
  - [ ] Subtask 7.3: Add admin filter Select (fetch admin list from backend)
  - [ ] Subtask 7.4: Add date range inputs (from date, to date) using Input type="date"
  - [ ] Subtask 7.5: Use useRouter and usePathname to update URL search params
  - [ ] Subtask 7.6: Add "Apply Filters" button that navigates with new params
  - [ ] Subtask 7.7: Add "Clear Filters" button that resets to default view
  - [ ] Subtask 7.8: Display active filters count badge
  - [ ] Subtask 7.9: Persist filters in URL for shareability

- [ ] Task 8: Add pagination controls (AC: #3)
  - [ ] Subtask 8.1: Create `src/components/admin/AuditLogPagination.tsx`
  - [ ] Subtask 8.2: Use shadcn Button for Previous/Next navigation
  - [ ] Subtask 8.3: Display current page and total pages
  - [ ] Subtask 8.4: Calculate total pages from total count and limit (50 per page)
  - [ ] Subtask 8.5: Update URL search params on page change
  - [ ] Subtask 8.6: Disable Previous on page 1, disable Next on last page
  - [ ] Subtask 8.7: Add jump to page input (optional enhancement)

- [ ] Task 9: Add audit log link to admin navigation (AC: #3)
  - [ ] Subtask 9.1: Update `src/components/admin/AdminSidebar.tsx` (if exists from Story 6.2)
  - [ ] Subtask 9.2: Add "Audit Log" nav item to System section with ScrollText icon
  - [ ] Subtask 9.3: Link to `/admin/audit` route
  - [ ] Subtask 9.4: Add active state styling when on audit log page
  - [ ] Subtask 9.5: Verify mobile navigation includes audit log link

- [ ] Task 10: Add i18n translations (AC: #3, #4)
  - [ ] Subtask 10.1: Add audit log translations to `src/locales/en.json`
  - [ ] Subtask 10.2: Add page title, filter labels, action names, column headers
  - [ ] Subtask 10.3: Add empty state messages and error messages
  - [ ] Subtask 10.4: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 10.5: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 10.6: Use `useTranslations('Admin.AuditLog')` in components
  - [ ] Subtask 10.7: Use `await getTranslations({ locale, namespace })` in server pages

- [ ] Task 11: Write database schema tests (AC: #2)
  - [ ] Subtask 11.1: Create `src/models/Schema.auditLog.test.ts`
  - [ ] Subtask 11.2: Test adminAuditLog table can be queried
  - [ ] Subtask 11.3: Test all required columns exist
  - [ ] Subtask 11.4: Test indexes are created (admin_id, created_at, action)
  - [ ] Subtask 11.5: Test NOT NULL constraints
  - [ ] Subtask 11.6: Test created_at default value is set
  - [ ] Subtask 11.7: Mock Drizzle client for tests

- [ ] Task 12: Write audit logging utility tests (AC: #1, #6)
  - [ ] Subtask 12.1: Create `src/libs/audit/logAdminAction.test.ts`
  - [ ] Subtask 12.2: Test logAdminAction creates entry with required fields
  - [ ] Subtask 12.3: Test logAdminAction includes metadata when provided
  - [ ] Subtask 12.4: Test logAdminAction returns true on success
  - [ ] Subtask 12.5: Test logAdminAction returns false on DB error (graceful failure)
  - [ ] Subtask 12.6: Test logAdminAction doesn't throw errors
  - [ ] Subtask 12.7: Test all AuditAction enum values
  - [ ] Subtask 12.8: Mock Drizzle client for tests

- [ ] Task 13: Write query utility tests (AC: #3, #4)
  - [ ] Subtask 13.1: Create `src/libs/queries/auditLog.test.ts`
  - [ ] Subtask 13.2: Test getAuditLogs returns all logs without filters
  - [ ] Subtask 13.3: Test getAuditLogs filters by action correctly
  - [ ] Subtask 13.4: Test getAuditLogs filters by adminId correctly
  - [ ] Subtask 13.5: Test getAuditLogs filters by date range correctly
  - [ ] Subtask 13.6: Test getAuditLogs pagination (limit, offset)
  - [ ] Subtask 13.7: Test getAuditLogs orders by created_at DESC
  - [ ] Subtask 13.8: Test getAuditLogs joins admin user data
  - [ ] Subtask 13.9: Test getAuditLogCount returns correct count
  - [ ] Subtask 13.10: Test error handling returns null
  - [ ] Subtask 13.11: Mock Drizzle client for tests

- [ ] Task 14: Write component tests (AC: #3, #4, #5)
  - [ ] Subtask 14.1: Create `src/components/admin/AuditLogTable.test.tsx`
  - [ ] Subtask 14.2: Test table renders with audit log entries
  - [ ] Subtask 14.3: Test action badges display correct colors
  - [ ] Subtask 14.4: Test timestamp formatting (relative and absolute)
  - [ ] Subtask 14.5: Test metadata display (reason or "--")
  - [ ] Subtask 14.6: Test empty state when no logs
  - [ ] Subtask 14.7: Test no edit/delete buttons present (read-only)
  - [ ] Subtask 14.8: Create `src/components/admin/AuditLogFilters.test.tsx`
  - [ ] Subtask 14.9: Test filter selects update URL params
  - [ ] Subtask 14.10: Test clear filters resets to default
  - [ ] Subtask 14.11: Test active filters count badge

- [ ] Task 15: Write integration tests for API logging (AC: #1, #6)
  - [ ] Subtask 15.1: Update `src/app/api/admin/users/[userId]/__tests__/routes.test.ts`
  - [ ] Subtask 15.2: Test suspend route creates audit log entry
  - [ ] Subtask 15.3: Test unsuspend route creates audit log entry
  - [ ] Subtask 15.4: Test reset-password route creates audit log entry
  - [ ] Subtask 15.5: Test audit log includes admin_id from session
  - [ ] Subtask 15.6: Test audit log includes metadata (reason)
  - [ ] Subtask 15.7: Test API succeeds even if logging fails
  - [ ] Subtask 15.8: Mock logAdminAction for tests

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The audit log UI is already designed in SuperDesign prototype with complete HTML/CSS implementation.

| Screen/Component | Design Tool | Location | Files to Extract |
|------------------|-------------|----------|------------------|
| Audit Log Table | SuperDesign | `.superdesign/design_iterations/admin_audit_1.html` | Table structure, filters, pagination |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`

**Adaptation Checklist:**
- [ ] Extract audit log table structure from `admin_audit_1.html`
- [ ] Convert CSS classes to Tailwind utility classes
- [ ] Replace custom table with shadcn Table components
- [ ] Add filter controls using shadcn Select and Input components
- [ ] Add action badges using shadcn Badge with custom variants
- [ ] Implement date range filtering with date inputs
- [ ] Add pagination controls matching design
- [ ] Wire up to real audit log data from database
- [ ] Add proper TypeScript types for all audit log data
- [ ] Implement read-only behavior (no edit/delete UI)
- [ ] Test dark mode appearance
- [ ] Format timestamps with relative time display

**shadcn Components to Install:**
```bash
npx shadcn@latest add table badge select
```

**Key Design Tokens from Prototype:**
- Table row padding: 16px (p-4)
- Font size: 14px (text-sm)
- Badge variants: suspend=red, unsuspend=green, delete=red, reset_password=yellow
- Date format: "Jan 29, 2026 at 2:30 PM" with "2 hours ago" on hover
- Filters layout: horizontal row with gap-4
- Pagination: centered at bottom with gap-2

### Critical Architecture Requirements

**Database Schema (Drizzle ORM):**

Add to `src/models/Schema.ts`:

```typescript
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id').notNull(),
    action: text('action').notNull(), // 'suspend_user' | 'unsuspend_user' | 'delete_user' | 'reset_password'
    targetType: text('target_type').notNull(), // 'user'
    targetId: uuid('target_id').notNull(),
    metadata: jsonb('metadata'), // { reason?: string, [key: string]: any }
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    adminIdIdx: index('idx_admin_audit_log_admin_id').on(table.adminId),
    createdAtIdx: index('idx_admin_audit_log_created_at').on(table.createdAt),
    actionCreatedAtIdx: index('idx_admin_audit_log_action_created_at').on(table.action, table.createdAt),
  }),
);
```

**Audit Logging Utility:**

```typescript
// src/libs/audit/logAdminAction.ts
import { db } from '@/libs/DB';
import { adminAuditLog } from '@/models/Schema';

export type AuditAction =
  | 'suspend_user'
  | 'unsuspend_user'
  | 'delete_user'
  | 'reset_password';

export interface LogAdminActionParams {
  action: AuditAction;
  targetType: 'user';
  targetId: string;
  adminId: string;
  metadata?: {
    reason?: string;
    [key: string]: any;
  };
}

export async function logAdminAction(params: LogAdminActionParams): Promise<boolean> {
  try {
    await db.insert(adminAuditLog).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata || null,
    });

    return true;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Graceful degradation - don't throw, just log error
    return false;
  }
}
```

**Integration Pattern in API Routes:**

```typescript
// Example: src/app/api/admin/users/[userId]/suspend/route.ts
import { logAdminAction } from '@/libs/audit/logAdminAction';

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore, { admin: true });

  // Get admin user from session
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    return unauthorizedError('Not authenticated');
  }

  // Parse request body
  const body = await req.json();
  const { reason } = body;

  // Perform suspend action
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { suspended: true }
  });

  if (error) {
    return internalError(error.message);
  }

  // Log audit entry (don't await - fire and forget)
  logAdminAction({
    action: 'suspend_user',
    targetType: 'user',
    targetId: userId,
    adminId: adminUser.id,
    metadata: { reason }
  });

  return NextResponse.json({ success: true });
}
```

**Query Utility Pattern:**

```typescript
// src/libs/queries/auditLog.ts
import { db } from '@/libs/DB';
import { adminAuditLog } from '@/models/Schema';
import { desc, eq, gte, lte, and } from 'drizzle-orm';
import { createClient } from '@/libs/supabase/server';
import { cookies } from 'next/headers';

export interface AuditLogFilters {
  action?: string;
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: any;
  createdAt: Date;
}

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[] | null> {
  try {
    const { action, adminId, startDate, endDate, limit = 50, offset = 0 } = filters;

    // Build where conditions
    const conditions = [];
    if (action) conditions.push(eq(adminAuditLog.action, action));
    if (adminId) conditions.push(eq(adminAuditLog.adminId, adminId));
    if (startDate) conditions.push(gte(adminAuditLog.createdAt, startDate));
    if (endDate) conditions.push(lte(adminAuditLog.createdAt, endDate));

    // Query audit logs
    const logs = await db
      .select()
      .from(adminAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Enrich with admin user data from Supabase
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore, { admin: true });

    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const { data: userData } = await supabase.auth.admin.getUserById(log.adminId);
        return {
          ...log,
          adminEmail: userData?.user?.email,
        };
      })
    );

    return enrichedLogs;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return null;
  }
}

export async function getAuditLogCount(filters: AuditLogFilters = {}): Promise<number> {
  try {
    const { action, adminId, startDate, endDate } = filters;

    const conditions = [];
    if (action) conditions.push(eq(adminAuditLog.action, action));
    if (adminId) conditions.push(eq(adminAuditLog.adminId, adminId));
    if (startDate) conditions.push(gte(adminAuditLog.createdAt, startDate));
    if (endDate) conditions.push(lte(adminAuditLog.createdAt, endDate));

    const result = await db
      .select({ count: count() })
      .from(adminAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Failed to count audit logs:', error);
    return 0;
  }
}
```

**Page Implementation (Server Component):**

```typescript
// src/app/[locale]/(auth)/admin/audit/page.tsx
import { getTranslations } from 'next-intl/server';
import { getAuditLogs, getAuditLogCount } from '@/libs/queries/auditLog';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { AuditLogFilters } from '@/components/admin/AuditLogFilters';
import { AuditLogPagination } from '@/components/admin/AuditLogPagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AuditLogPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'Admin.AuditLog' });

  // Parse filters from URL
  const action = typeof searchParams.action === 'string' ? searchParams.action : undefined;
  const adminId = typeof searchParams.adminId === 'string' ? searchParams.adminId : undefined;
  const startDate = typeof searchParams.startDate === 'string' ? new Date(searchParams.startDate) : undefined;
  const endDate = typeof searchParams.endDate === 'string' ? new Date(searchParams.endDate) : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;

  const limit = 50;
  const offset = (page - 1) * limit;

  // Fetch audit logs and count
  const [logs, totalCount] = await Promise.all([
    getAuditLogs({ action, adminId, startDate, endDate, limit, offset }),
    getAuditLogCount({ action, adminId, startDate, endDate })
  ]);

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <AuditLogFilters />

      <Card>
        <CardHeader>
          <CardTitle>{t('recentActions')}</CardTitle>
          <CardDescription>{t('showingResults', { count: logs?.length || 0, total: totalCount })}</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs || []} />
        </CardContent>
      </Card>

      <AuditLogPagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
```

**AuditLogTable Component:**

```typescript
// src/components/admin/AuditLogTable.tsx
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

interface AuditLogTableProps {
  logs: Array<{
    id: string;
    adminId: string;
    adminEmail?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata: any;
    createdAt: Date;
  }>;
}

const actionVariants: Record<string, 'destructive' | 'default' | 'secondary'> = {
  'suspend_user': 'destructive',
  'unsuspend_user': 'secondary',
  'delete_user': 'destructive',
  'reset_password': 'default',
};

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const t = useTranslations('Admin.AuditLog');

  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        {t('noLogs')}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.action')}</TableHead>
          <TableHead>{t('columns.admin')}</TableHead>
          <TableHead>{t('columns.target')}</TableHead>
          <TableHead>{t('columns.timestamp')}</TableHead>
          <TableHead>{t('columns.metadata')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <Badge variant={actionVariants[log.action] || 'default'}>
                {t(`actions.${log.action}`)}
              </Badge>
            </TableCell>
            <TableCell>{log.adminEmail || log.adminId}</TableCell>
            <TableCell>
              <code className="text-xs">{log.targetId.slice(0, 8)}...</code>
            </TableCell>
            <TableCell>
              <span className="text-sm" title={new Date(log.createdAt).toLocaleString()}>
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </span>
            </TableCell>
            <TableCell>
              {log.metadata?.reason ? (
                <span className="text-sm">{log.metadata.reason}</span>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Implementation Strategy

**Phase 1: Database Schema**

1. Add `adminAuditLog` table to `src/models/Schema.ts`
2. Run `npm run db:generate` to create migration
3. Verify migration applied (auto-applied on next DB interaction)

**Phase 2: Audit Logging Utility**

1. Create `src/libs/audit/logAdminAction.ts`
2. Implement logAdminAction function with graceful error handling
3. Define TypeScript types and enums
4. Write unit tests

**Phase 3: API Integration**

1. Import logAdminAction in existing admin API routes:
   - `/api/admin/users/[userId]/suspend`
   - `/api/admin/users/[userId]/unsuspend`
   - `/api/admin/users/[userId]/reset-password`
2. Call logAdminAction after successful operations
3. Fire and forget pattern (don't await, don't break on failure)
4. Write integration tests

**Phase 4: Query Layer**

1. Create `src/libs/queries/auditLog.ts`
2. Implement getAuditLogs with filtering and pagination
3. Implement getAuditLogCount for pagination
4. Enrich with admin user data from Supabase
5. Write unit tests

**Phase 5: UI Components**

1. Create `src/app/[locale]/(auth)/admin/audit/page.tsx`
2. Create `src/components/admin/AuditLogTable.tsx`
3. Create `src/components/admin/AuditLogFilters.tsx`
4. Create `src/components/admin/AuditLogPagination.tsx`
5. Install shadcn components: Table, Badge, Select
6. Wire up to query utilities

**Phase 6: Navigation & Translations**

1. Add audit log link to AdminSidebar (System section)
2. Add translations to all locale files
3. Test all filter combinations
4. Test pagination

### Testing Strategy

**Database Schema Tests:**

```typescript
// src/models/Schema.auditLog.test.ts
import { describe, it, expect } from 'vitest';
import { adminAuditLog } from './Schema';

describe('adminAuditLog schema', () => {
  it('has required columns', () => {
    const columns = Object.keys(adminAuditLog);
    expect(columns).toContain('id');
    expect(columns).toContain('adminId');
    expect(columns).toContain('action');
    expect(columns).toContain('targetType');
    expect(columns).toContain('targetId');
    expect(columns).toContain('metadata');
    expect(columns).toContain('createdAt');
  });
});
```

**Logging Utility Tests:**

```typescript
// src/libs/audit/logAdminAction.test.ts
import { describe, it, expect, vi } from 'vitest';
import { logAdminAction } from './logAdminAction';
import { db } from '@/libs/DB';

vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    }),
  },
}));

describe('logAdminAction', () => {
  it('creates audit log entry', async () => {
    const result = await logAdminAction({
      action: 'suspend_user',
      targetType: 'user',
      targetId: 'user-123',
      adminId: 'admin-456',
      metadata: { reason: 'Spam' },
    });

    expect(result).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it('returns false on error without throwing', async () => {
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockRejectedValue(new Error('DB error')),
    } as any);

    const result = await logAdminAction({
      action: 'suspend_user',
      targetType: 'user',
      targetId: 'user-123',
      adminId: 'admin-456',
    });

    expect(result).toBe(false);
  });
});
```

**Query Utility Tests:**

```typescript
// src/libs/queries/auditLog.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getAuditLogs, getAuditLogCount } from './auditLog';

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

describe('getAuditLogs', () => {
  it('filters by action', async () => {
    const logs = await getAuditLogs({ action: 'suspend_user' });
    expect(logs).toBeDefined();
  });

  it('filters by date range', async () => {
    const logs = await getAuditLogs({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });
    expect(logs).toBeDefined();
  });

  it('applies pagination', async () => {
    const logs = await getAuditLogs({ limit: 10, offset: 20 });
    expect(logs).toBeDefined();
  });
});
```

**Component Tests:**

```typescript
// src/components/admin/AuditLogTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLogTable } from './AuditLogTable';

const mockLogs = [
  {
    id: '1',
    adminId: 'admin-1',
    adminEmail: 'admin@example.com',
    action: 'suspend_user',
    targetType: 'user',
    targetId: 'user-123',
    metadata: { reason: 'Spam' },
    createdAt: new Date('2026-01-29T12:00:00Z'),
  },
];

describe('AuditLogTable', () => {
  it('renders audit log entries', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Spam')).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    render(<AuditLogTable logs={[]} />);

    expect(screen.getByText(/no logs/i)).toBeInTheDocument();
  });

  it('displays action badges with correct variants', () => {
    render(<AuditLogTable logs={mockLogs} />);

    const badge = screen.getByText(/suspend/i);
    expect(badge).toHaveClass('bg-red'); // destructive variant
  });
});
```

### Project Structure Notes

**New Files:**
```
src/
  models/
    Schema.ts                       # Updated with adminAuditLog table
    Schema.auditLog.test.ts         # Schema tests
  libs/
    audit/
      logAdminAction.ts             # Audit logging utility
      logAdminAction.test.ts        # Utility tests
    queries/
      auditLog.ts                   # Audit log queries
      auditLog.test.ts              # Query tests
  app/[locale]/(auth)/admin/
    audit/
      page.tsx                      # Audit log page
  components/admin/
    AuditLogTable.tsx               # Table component
    AuditLogTable.test.tsx          # Table tests
    AuditLogFilters.tsx             # Filter controls
    AuditLogFilters.test.tsx        # Filter tests
    AuditLogPagination.tsx          # Pagination controls
```

**Updated Files:**
```
src/
  app/api/admin/users/[userId]/
    suspend/route.ts                # Add logAdminAction call
    unsuspend/route.ts              # Add logAdminAction call
    reset-password/route.ts         # Add logAdminAction call
    __tests__/routes.test.ts        # Add audit logging tests
  components/admin/
    AdminSidebar.tsx                # Add audit log nav link (if exists)
  locales/
    en.json                         # Audit log translations
    hi.json                         # Hindi translations
    bn.json                         # Bengali translations
```

**Import Patterns:**
```typescript
import { logAdminAction } from '@/libs/audit/logAdminAction';
import { getAuditLogs, getAuditLogCount } from '@/libs/queries/auditLog';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { adminAuditLog } from '@/models/Schema';
```

**Dependencies:**
- shadcn Table component (install if not present)
- shadcn Badge component (already installed in Story 6.3)
- shadcn Select component (already installed in Story 6.3)
- date-fns for relative time formatting
- Drizzle ORM (already configured)
- Supabase Admin client (already configured)

### Previous Story Intelligence

**Learnings from Stories 6.1-6.5:**

1. **Database Pattern:**
   - Drizzle ORM with PostgreSQL
   - Migrations auto-applied on next DB interaction
   - Schema defined in `src/models/Schema.ts`
   - Indexes defined inline with table definition

2. **Admin API Pattern:**
   - Service role client: `createClient(cookieStore, { admin: true })`
   - Standardized error handling from `@/libs/api/errors`
   - Extract admin user from session: `await supabase.auth.getUser()`
   - Server-side only, never expose to client

3. **Query Pattern:**
   - Separate query utilities in `src/libs/queries/`
   - Error handling returns null for graceful degradation
   - Server-side data fetching in page components
   - Enrich data with joins (Supabase auth.users)

4. **Component Pattern:**
   - Server Components for pages (data fetching)
   - Client Components for interactive UI ("use client")
   - shadcn components as foundation
   - Custom components extend shadcn base

5. **Testing Pattern:**
   - Vitest for unit tests
   - Mock Drizzle client and Supabase client
   - Co-located test files (.test.tsx)
   - Test success, error, and edge cases

6. **Translation Pattern:**
   - Nested namespace: `Admin.AuditLog.title`
   - Server: `await getTranslations({ locale, namespace })`
   - Client: `useTranslations('Admin.AuditLog')`
   - All 3 locales updated simultaneously

7. **Navigation Pattern:**
   - AdminSidebar with grouped nav items
   - Active state based on pathname
   - ScrollText icon for audit log (Lucide)

### Security Considerations

**Access Control:**
- Audit log page protected by middleware (Story 6.1)
- Only admins can access `/admin/audit` route
- Queries use service role client server-side only
- No client-side access to raw audit data

**Data Integrity:**
- Audit log entries are immutable (no edit/delete in UI)
- Server-side logging only (never client-side)
- Graceful degradation if logging fails (don't break admin actions)
- Metadata stored as JSONB for flexibility

**Data Privacy:**
- Never log sensitive data (passwords, tokens)
- Log only necessary information (action, target, reason)
- Admin emails visible only to other admins
- Target IDs truncated in UI (full UUID on hover)

**Compliance:**
- Retention period configurable (future enhancement)
- Tamper-resistant (no UI for deletion)
- Audit trail for accountability
- Timestamps with timezone for accuracy

**Performance:**
- Indexes on frequently filtered columns (admin_id, created_at, action)
- Pagination to limit query size (50 per page)
- Server-side filtering to reduce data transfer
- Fire-and-forget logging to avoid blocking API responses

### References

- [Source: Epic 6 Story 6.6] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: .superdesign/design_iterations/admin_audit_1.html] - Audit log prototype
- [Source: Story 6.1] - Admin access control and middleware
- [Source: Story 6.2] - Admin layout and navigation
- [Source: Story 6.4] - Admin API routes (suspend, delete, reset-password)
- [Source: src/models/Schema.ts] - Current database schema
- [Source: CLAUDE.md#Database] - Drizzle ORM patterns
- [Source: PRD#FR-ADMIN-003] - Audit logging requirements

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
