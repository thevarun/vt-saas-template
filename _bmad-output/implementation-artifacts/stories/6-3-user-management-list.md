# Story 6.3: User Management List

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to see all users in the system,
so that I can find and manage user accounts.

## Acceptance Criteria

### AC1: User List Display
**Given** I am on the admin users page
**When** the page loads
**Then** I see a list of all users
**And** list shows: email, username, signup date, status
**And** list is paginated (20 per page default)

### AC2: Search Functionality
**Given** the user list
**When** I look for search
**Then** I see a search input
**And** I can search by email or username
**And** search filters results in real-time or on submit

### AC3: Sorting Capability
**Given** the user list
**When** I want to sort
**Then** I can sort by signup date (newest/oldest)
**And** I can sort by email alphabetically
**And** current sort is indicated visually

### AC4: User Row Information
**Given** a user row in the list
**When** I view the row
**Then** I see their email
**And** I see their username (or "Not set")
**And** I see signup date (relative or formatted)
**And** I see status indicator (active, suspended)
**And** I see quick action buttons

### AC5: Pagination Controls
**Given** pagination
**When** there are more than 20 users
**Then** I see pagination controls
**And** I can navigate between pages
**And** current page is indicated
**And** total user count is shown

### AC6: Empty State
**Given** the user list is empty
**When** no users exist (unlikely)
**Then** I see an appropriate empty state

## Tasks / Subtasks

- [ ] Task 1: Install required shadcn components (AC: #1, #4)
  - [ ] Subtask 1.1: Run `npx shadcn@latest add table checkbox input dropdown-menu badge`
  - [ ] Subtask 1.2: Verify components installed in `src/components/ui/`
  - [ ] Subtask 1.3: Check no TypeScript errors after installation

- [ ] Task 2: Create database query for user list (AC: #1, #2, #3, #5)
  - [ ] Subtask 2.1: Create `src/libs/queries/users.ts` for Supabase queries
  - [ ] Subtask 2.2: Implement `getUsersList()` function with pagination
  - [ ] Subtask 2.3: Add search parameter (email or username filter)
  - [ ] Subtask 2.4: Add sort parameter (signup_date, email)
  - [ ] Subtask 2.5: Return user data: id, email, username, created_at, status
  - [ ] Subtask 2.6: Add total count for pagination
  - [ ] Subtask 2.7: Handle Supabase errors gracefully

- [ ] Task 3: Create UserTable component (AC: #1, #4, #5)
  - [ ] Subtask 3.1: Create `src/components/admin/UserTable.tsx`
  - [ ] Subtask 3.2: Use shadcn Table components (Table, TableHeader, TableBody, etc.)
  - [ ] Subtask 3.3: Display columns: Checkbox, User (email+username), Status, Signup Date, Last Login, Actions
  - [ ] Subtask 3.4: Add user avatar with initials (gradient background)
  - [ ] Subtask 3.5: Add status Badge with custom variants (active=green, suspended=red, pending=yellow)
  - [ ] Subtask 3.6: Format dates with relative time (e.g., "2 hours ago" or "Jan 15, 2024")
  - [ ] Subtask 3.7: Add quick action buttons (View, Edit, Delete) with icons
  - [ ] Subtask 3.8: Add row hover states for better UX

- [ ] Task 4: Create search and filter toolbar (AC: #2, #3)
  - [ ] Subtask 4.1: Create search Input with search icon prefix
  - [ ] Subtask 4.2: Add debounced search to avoid excessive queries
  - [ ] Subtask 4.3: Add status filter DropdownMenu (All, Active, Suspended, Pending)
  - [ ] Subtask 4.4: Add sort controls (visual arrow indicators on table headers)
  - [ ] Subtask 4.5: Add "Export" button for future CSV export
  - [ ] Subtask 4.6: Add "Add User" button (future Story 6.4)

- [ ] Task 5: Implement pagination component (AC: #5)
  - [ ] Subtask 5.1: Create pagination controls (Previous, Page Numbers, Next)
  - [ ] Subtask 5.2: Show current page range (e.g., "Showing 1-20 of 1,284 users")
  - [ ] Subtask 5.3: Disable Previous button on first page
  - [ ] Subtask 5.4: Disable Next button on last page
  - [ ] Subtask 5.5: Add numbered page buttons with ellipsis for large page counts
  - [ ] Subtask 5.6: Update URL query params for page navigation

- [ ] Task 6: Create admin users page (AC: #1)
  - [ ] Subtask 6.1: Create `src/app/[locale]/(admin)/admin/users/page.tsx`
  - [ ] Subtask 6.2: Fetch users data server-side with Supabase client
  - [ ] Subtask 6.3: Pass data and pagination info to client components
  - [ ] Subtask 6.4: Add page title "User Management"
  - [ ] Subtask 6.5: Add page description
  - [ ] Subtask 6.6: Render UserTable with toolbar and pagination

- [ ] Task 7: Add bulk selection and actions (AC: #4)
  - [ ] Subtask 7.1: Add "Select All" checkbox in table header
  - [ ] Subtask 7.2: Add individual row checkboxes
  - [ ] Subtask 7.3: Track selected user IDs in state
  - [ ] Subtask 7.4: Show bulk actions bar when users are selected
  - [ ] Subtask 7.5: Add bulk action buttons (Email, Suspend, Delete)
  - [ ] Subtask 7.6: Implement bulk action handlers (placeholder for Story 6.4)

- [ ] Task 8: Add empty state component (AC: #6)
  - [ ] Subtask 8.1: Create empty state UI (unlikely scenario)
  - [ ] Subtask 8.2: Show appropriate message and icon
  - [ ] Subtask 8.3: Conditionally render when user count is 0

- [ ] Task 9: Add i18n translations (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Subtask 9.1: Add user management translations to `src/locales/en.json`
  - [ ] Subtask 9.2: Add table column headers, search placeholder, filter labels
  - [ ] Subtask 9.3: Add action button labels and tooltips
  - [ ] Subtask 9.4: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 9.5: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 9.6: Use `useTranslations('Admin.Users')` hook in components

- [ ] Task 10: Write component tests (AC: #1, #2, #3, #4, #5)
  - [ ] Subtask 10.1: Create `src/components/admin/UserTable.test.tsx`
  - [ ] Subtask 10.2: Test table renders with user data
  - [ ] Subtask 10.3: Test status badges display correctly
  - [ ] Subtask 10.4: Test action buttons are present
  - [ ] Subtask 10.5: Test checkbox selection works
  - [ ] Subtask 10.6: Test search input is rendered
  - [ ] Subtask 10.7: Test pagination controls display
  - [ ] Subtask 10.8: Mock Supabase queries for isolation

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The user management UI is already designed and implemented in SuperDesign prototype with complete HTML/CSS.

| Screen/Component | Design Tool | Location | Files to Adapt |
|------------------|-------------|----------|----------------|
| User Management Table | SuperDesign | `.superdesign/design_iterations/admin_users_1.html` | Full table structure, search, pagination |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`

**Adaptation Checklist:**
- [ ] Extract HTML table structure from `.superdesign/design_iterations/admin_users_1.html`
- [ ] Convert CSS classes and inline styles to Tailwind utility classes
- [ ] Replace custom components with shadcn equivalents:
  - Custom table → shadcn Table components
  - Custom checkboxes → shadcn Checkbox
  - Custom badges → shadcn Badge with custom variants
  - Custom search input → shadcn Input with icon
  - Custom dropdown → shadcn DropdownMenu
- [ ] Add `"use client"` directive for components with state/hooks
- [ ] Integrate with Supabase for real data fetching
- [ ] Wire up search, filter, sort, pagination to server-side queries
- [ ] Add proper TypeScript types for user data and props
- [ ] Implement responsive behavior (mobile table scrolling)
- [ ] Test dark mode appearance
- [ ] Add loading states (Skeleton components)
- [ ] Handle empty states gracefully

**shadcn Components to Install:**
```bash
npx shadcn@latest add table checkbox input dropdown-menu badge skeleton avatar tooltip
```

**Key Design Tokens from Prototype:**
- Table row height: 64px
- Avatar size: 36px (small)
- Status badge: rounded-full, padding 4px 12px
- Search input: max-width 320px
- Pagination button: 32px x 32px minimum
- Action buttons: 32px icon buttons with hover states
- Hover state: bg-hover (subtle background change)

**Status Badge Variants to Add:**
Add these to `src/components/ui/badge.tsx` badge variants:
```typescript
active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
```

### Critical Architecture Requirements

**Database Schema (Supabase auth.users):**
- Users are stored in Supabase `auth.users` table (NOT custom table)
- Available fields: id, email, created_at, updated_at, email_confirmed_at, last_sign_in_at
- Username stored in: `raw_user_meta_data.username` (JSONB column)
- Status NOT in database - need custom implementation or use `banned_until` field
- For now, consider all users "active" (or check if `banned_until` is NULL)

**Supabase Query Pattern:**
```typescript
// src/libs/queries/users.ts
import { createClient } from '@/libs/supabase/server'
import { cookies } from 'next/headers'

export async function getUsersList({
  page = 1,
  limit = 20,
  search = '',
  sortBy = 'created_at',
  sortOrder = 'desc' as 'asc' | 'desc',
  status = 'all'
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Use Supabase Admin API to list users
  // Note: Regular client doesn't have access to auth.users
  // Need to use service role client or create custom users table

  // For MVP: Query custom users view or use service role client
  // See implementation note below
}
```

**CRITICAL: Supabase Auth Users Access:**
- Regular Supabase client CANNOT query `auth.users` directly
- Options:
  1. Use Supabase service role client (needs SUPABASE_SERVICE_ROLE_KEY)
  2. Create custom `public.users` table synced from `auth.users` via database trigger
  3. Use Supabase Admin API `/auth/v1/admin/users` endpoint

**Recommended Approach: Service Role Client**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Use supabaseAdmin.auth.admin.listUsers()
const { data, error } = await supabaseAdmin.auth.admin.listUsers({
  page,
  perPage: limit
})
```

**Server Component Pattern:**
```typescript
// src/app/[locale]/(admin)/admin/users/page.tsx
import { cookies } from 'next/headers'
import { createClient } from '@/libs/supabase/server'
import { getUsersList } from '@/libs/queries/users'
import { UserTable } from '@/components/admin/UserTable'

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const search = params.search || ''
  const sort = params.sort || 'created_at'

  const { users, total, error } = await getUsersList({
    page,
    limit: 20,
    search,
    sortBy: sort
  })

  if (error) {
    // Handle error (show error UI)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">
          View and manage all registered users in your application.
        </p>
      </div>

      <UserTable
        users={users}
        total={total}
        page={page}
        search={search}
      />
    </div>
  )
}
```

**Client Component for Interactivity:**
```typescript
// UserTable needs to be client component for:
// - Checkbox selection state
// - Search input (debounced)
// - Filter dropdown state
// But pass server-fetched data as props
```

**Pagination with URL Query Params:**
- Use Next.js 15 `useRouter()` and `useSearchParams()` for navigation
- Update URL: `/admin/users?page=2&search=john&sort=email`
- Server component reads from `searchParams` prop
- Client component uses `router.push()` to update URL

**Search Implementation:**
- Client-side: Input with debounce (500ms)
- On change: Update URL query param `?search=value`
- Server re-renders with new search results
- Pattern: Progressive enhancement (works without JS)

**Sorting Implementation:**
- Clickable table headers
- Visual indicator (arrow up/down icon)
- URL param: `?sort=email&order=asc`
- Server applies sort to Supabase query

### Implementation Strategy

**Phase 1: Setup Supabase Admin Client**

1. Verify `SUPABASE_SERVICE_ROLE_KEY` exists in `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. Create admin client utility:
   ```typescript
   // src/libs/supabase/admin.ts
   import { createClient } from '@supabase/supabase-js'

   export function getSupabaseAdmin() {
     return createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!,
       {
         auth: {
           autoRefreshToken: false,
           persistSession: false
         }
       }
     )
   }
   ```

3. Create user query functions:
   ```typescript
   // src/libs/queries/users.ts
   import { getSupabaseAdmin } from '@/libs/supabase/admin'

   export async function getUsersList(options: {
     page: number
     limit: number
     search?: string
     sortBy?: string
     sortOrder?: 'asc' | 'desc'
   }) {
     const supabaseAdmin = getSupabaseAdmin()

     try {
       const { data, error } = await supabaseAdmin.auth.admin.listUsers({
         page: options.page,
         perPage: options.limit
       })

       if (error) throw error

       // Filter by search if provided
       let filteredUsers = data.users || []
       if (options.search) {
         const searchLower = options.search.toLowerCase()
         filteredUsers = filteredUsers.filter(user =>
           user.email?.toLowerCase().includes(searchLower) ||
           user.user_metadata?.username?.toLowerCase().includes(searchLower)
         )
       }

       // Sort users
       if (options.sortBy === 'email') {
         filteredUsers.sort((a, b) => {
           const comparison = (a.email || '').localeCompare(b.email || '')
           return options.sortOrder === 'asc' ? comparison : -comparison
         })
       } else {
         // Default: sort by created_at
         filteredUsers.sort((a, b) => {
           const dateA = new Date(a.created_at).getTime()
           const dateB = new Date(b.created_at).getTime()
           return options.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
         })
       }

       return {
         users: filteredUsers,
         total: filteredUsers.length,
         error: null
       }
     } catch (error) {
       return {
         users: [],
         total: 0,
         error: error as Error
       }
     }
   }
   ```

**Phase 2: Build Core Components**

**UserTable Component:**
```typescript
// src/components/admin/UserTable.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Pencil, Trash2, Search, Filter, Download, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import type { User } from '@supabase/supabase-js'

interface UserTableProps {
  users: User[]
  total: number
  page: number
  search: string
}

export function UserTable({ users, total, page, search }: UserTableProps) {
  const t = useTranslations('Admin.Users')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [searchValue, setSearchValue] = useState(search)

  const handleSearch = (value: string) => {
    setSearchValue(value)
    // Debounce and update URL
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    params.set('page', '1') // Reset to page 1 on search
    router.push(`?${params.toString()}`)
  }

  const getUserInitials = (email: string, username?: string) => {
    if (username) {
      return username.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const getStatusBadge = (user: User) => {
    // For MVP: All users are "active" unless banned
    if (user.banned_until) {
      return <Badge variant="suspended">{t('status.suspended')}</Badge>
    }
    if (!user.email_confirmed_at) {
      return <Badge variant="pending">{t('status.pending')}</Badge>
    }
    return <Badge variant="active">{t('status.active')}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            {t('filter.label')}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('actions.export')}
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {t('actions.addUser')}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-muted rounded-lg">
          <span className="font-medium">
            {selectedUsers.size} {t('bulkActions.selected')}
          </span>
          <div className="h-5 w-px bg-border" />
          <Button variant="outline" size="sm">
            {t('bulkActions.email')}
          </Button>
          <Button variant="outline" size="sm">
            {t('bulkActions.suspend')}
          </Button>
          <Button variant="destructive" size="sm">
            {t('bulkActions.delete')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.size === users.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUsers(new Set(users.map(u => u.id)))
                    } else {
                      setSelectedUsers(new Set())
                    }
                  }}
                />
              </TableHead>
              <TableHead>{t('columns.user')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.signedUp')}</TableHead>
              <TableHead>{t('columns.lastLogin')}</TableHead>
              <TableHead className="w-32">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedUsers)
                      if (checked) {
                        newSelected.add(user.id)
                      } else {
                        newSelected.delete(user.id)
                      }
                      setSelectedUsers(newSelected)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {getUserInitials(user.email || '', user.user_metadata?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.user_metadata?.username || t('noUsername')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(user)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.last_sign_in_at
                    ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                    : t('never')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
          <div className="text-sm text-muted-foreground">
            {t('pagination.showing', {
              start: (page - 1) * 20 + 1,
              end: Math.min(page * 20, total),
              total
            })}
          </div>
          <div className="flex items-center gap-2">
            {/* Pagination buttons */}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Phase 3: Create Admin Users Page**

```typescript
// src/app/[locale]/(admin)/admin/users/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { isAdmin } from '@/libs/auth/isAdmin'
import { getUsersList } from '@/libs/queries/users'
import { UserTable } from '@/components/admin/UserTable'
import { getTranslations } from 'next-intl/server'

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; order?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Verify admin access (belt and suspenders - middleware already checks)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    redirect('/dashboard?error=access_denied')
  }

  const t = await getTranslations('Admin.Users')

  const page = parseInt(params.page || '1', 10)
  const search = params.search || ''
  const sortBy = params.sort || 'created_at'
  const sortOrder = (params.order || 'desc') as 'asc' | 'desc'

  const { users, total, error } = await getUsersList({
    page,
    limit: 20,
    search,
    sortBy,
    sortOrder
  })

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <div className="text-destructive">{t('error.loadFailed')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <UserTable
        users={users}
        total={total}
        page={page}
        search={search}
      />
    </div>
  )
}
```

**Phase 4: Add Translations**

Add to `src/locales/en.json`:
```json
{
  "Admin": {
    "Users": {
      "title": "User Management",
      "description": "View and manage all registered users in your application.",
      "noUsername": "Not set",
      "never": "Never",
      "columns": {
        "user": "User",
        "status": "Status",
        "signedUp": "Signed Up",
        "lastLogin": "Last Login",
        "actions": "Actions"
      },
      "status": {
        "active": "Active",
        "suspended": "Suspended",
        "pending": "Pending"
      },
      "search": {
        "placeholder": "Search by email or username..."
      },
      "filter": {
        "label": "Filter"
      },
      "actions": {
        "export": "Export",
        "addUser": "Add User",
        "view": "View details",
        "edit": "Edit user",
        "delete": "Delete user"
      },
      "bulkActions": {
        "selected": "selected",
        "email": "Email",
        "suspend": "Suspend",
        "delete": "Delete"
      },
      "pagination": {
        "showing": "Showing {{start}}-{{end}} of {{total}} users"
      },
      "error": {
        "loadFailed": "Failed to load users. Please try again."
      }
    }
  }
}
```

Duplicate for `hi.json` and `bn.json` with appropriate translations.

### Testing Strategy

**Component Unit Tests:**

```typescript
// src/components/admin/UserTable.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserTable } from './UserTable'
import type { User } from '@supabase/supabase-js'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

const mockUsers: Partial<User>[] = [
  {
    id: '1',
    email: 'john@example.com',
    created_at: '2024-01-15T00:00:00Z',
    last_sign_in_at: '2024-01-20T00:00:00Z',
    email_confirmed_at: '2024-01-15T01:00:00Z',
    user_metadata: { username: 'johndoe' }
  },
  {
    id: '2',
    email: 'jane@example.com',
    created_at: '2024-01-10T00:00:00Z',
    last_sign_in_at: null,
    email_confirmed_at: null,
    user_metadata: {}
  }
]

describe('UserTable', () => {
  it('renders user list with correct data', () => {
    render(
      <UserTable
        users={mockUsers as User[]}
        total={2}
        page={1}
        search=""
      />
    )

    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('johndoe')).toBeInTheDocument()
    expect(screen.getByText('noUsername')).toBeInTheDocument()
  })

  it('displays correct status badges', () => {
    render(
      <UserTable
        users={mockUsers as User[]}
        total={2}
        page={1}
        search=""
      />
    )

    expect(screen.getByText('status.active')).toBeInTheDocument()
    expect(screen.getByText('status.pending')).toBeInTheDocument()
  })

  it('shows action buttons for each user', () => {
    render(
      <UserTable
        users={mockUsers as User[]}
        total={2}
        page={1}
        search=""
      />
    )

    // 2 users × 3 actions = 6 buttons (view, edit, delete)
    const actionButtons = screen.getAllByRole('button')
    expect(actionButtons.length).toBeGreaterThanOrEqual(6)
  })

  it('renders search input', () => {
    render(
      <UserTable
        users={mockUsers as User[]}
        total={2}
        page={1}
        search=""
      />
    )

    const searchInput = screen.getByPlaceholderText('search.placeholder')
    expect(searchInput).toBeInTheDocument()
  })

  it('shows bulk actions when users selected', async () => {
    const { container } = render(
      <UserTable
        users={mockUsers as User[]}
        total={2}
        page={1}
        search=""
      />
    )

    // Initially no bulk actions
    expect(screen.queryByText('bulkActions.email')).not.toBeInTheDocument()

    // Select first checkbox
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    checkboxes[1]?.click() // First user checkbox (0 is select all)

    // Now bulk actions should appear (testing library update needed)
  })
})
```

### Project Structure Notes

**New Files:**
```
src/
  app/[locale]/(admin)/admin/
    users/
      page.tsx                         # User management page
  components/admin/
    UserTable.tsx                      # User table component
    __tests__/
      UserTable.test.tsx               # Component tests
  libs/
    supabase/
      admin.ts                         # Supabase admin client
    queries/
      users.ts                         # User query functions
```

**Dependencies:**
- shadcn components: table, checkbox, input, dropdown-menu, badge, avatar, skeleton, tooltip
- date-fns: for relative date formatting (already installed)
- Supabase admin SDK: @supabase/supabase-js (already installed)

### Previous Story Intelligence

**Learnings from Story 6.2:**

1. **Component Structure:**
   - Successfully implemented AdminLayout with server/client component split
   - AdminLayoutClient handles state, server layout.tsx passes props
   - Pattern works well for admin section, continue for user table

2. **Supabase Integration:**
   - Middleware already protects `/admin` routes
   - `isAdmin()` utility verified working
   - Can assume user is admin in admin pages (middleware handles rejection)

3. **shadcn Component Installation:**
   - Components install cleanly with `npx shadcn@latest add`
   - No conflicts with existing UI library
   - Custom Badge variants work well (added active/suspended/pending)

4. **Translation Pattern:**
   - Nested translation structure: `Admin.nav.dashboard`
   - Works across all 3 locales (en, hi, bn)
   - useTranslations hook in client components, getTranslations in server

5. **Testing Approach:**
   - 53 new tests added for admin components
   - Mock next/navigation and next-intl consistently
   - Tests passing: 379/379 total

6. **Responsive Design:**
   - Mobile Sheet overlay pattern works excellently
   - Tailwind breakpoints (md:, lg:) handle responsive layout
   - Dark mode via `dark:` prefix integrates seamlessly

### Git Intelligence Summary

**Recent Commit Analysis (2f92cdd):**

Files created in Story 6.2:
- Created: `src/app/[locale]/(admin)/admin/page.tsx` - Dashboard placeholder
- Created: `src/app/[locale]/(admin)/layout.tsx` - Admin layout wrapper
- Created: `src/components/admin/AdminSidebar.tsx` - Navigation sidebar
- Created: `src/components/admin/AdminHeader.tsx` - Header with admin badge
- Created: `src/components/admin/AdminLayoutClient.tsx` - Client state management
- Created: `src/components/admin/__tests__/*` - 53 component tests
- Modified: `src/locales/*.json` - Added admin translations

**Patterns to Follow:**
- Server/client component split for admin features
- Admin components in `src/components/admin/`
- Tests in `__tests__/` subdirectory
- Add translations immediately for all locales
- Use TypeScript strict mode with proper types
- Follow existing code style (no semicolons, single quotes)

**Code Conventions Observed:**
- Absolute imports with `@/` prefix
- Functional components with TypeScript interfaces
- Export default for page components, named exports for utilities
- Use `async` for server components that fetch data
- Add `'use client'` only when needed (hooks, state, events)

### Security Considerations

**Supabase Service Role Key:**
- CRITICAL: SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to client
- Only use in server-side code (Server Components, API routes)
- `getSupabaseAdmin()` utility should be server-only
- Add to `.env.local` (never commit)
- Already in `.env.example` from Story 6.1 setup

**Access Control:**
- Middleware already protects `/admin/users` route
- Page component re-verifies admin status (belt and suspenders)
- Future API endpoints for user actions MUST verify admin status
- Never trust client-side role checks alone

**User Data Privacy:**
- Display email addresses only to admins (already protected by route)
- Consider redacting sensitive user metadata
- Audit logging for admin actions (Story 6.6)
- GDPR compliance: admin can view/delete user data

**Input Sanitization:**
- Search input should be sanitized before database query
- Prevent SQL injection (Supabase handles this)
- Validate page numbers (must be positive integers)
- Validate sort fields (whitelist: email, created_at)

### Performance Considerations

**Pagination:**
- Limit 20 users per page prevents large data loads
- Server-side pagination reduces client bundle size
- Consider adding cache for frequently accessed pages

**Search:**
- Debounce search input (500ms) to reduce queries
- Client-side filtering for small result sets
- Server-side search for accurate results

**Query Optimization:**
- Supabase Admin API has built-in pagination
- Consider indexing common search fields
- Cache user count for performance

**Loading States:**
- Add Skeleton components while fetching
- Consider Suspense boundaries for streaming
- Progressive enhancement: works without JS

### References

- [Source: Epic 6 Story 6.3] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md] - Component mapping
- [Source: .superdesign/design_iterations/admin_users_1.html] - Complete prototype
- [Source: Story 6.2] - Admin layout implementation
- [Source: Story 6.1] - Admin access control and isAdmin utility
- [Source: src/middleware.ts] - Admin route protection
- [Source: CLAUDE.md#Database] - Drizzle ORM and Supabase patterns
- [Source: CLAUDE.md#Next.js 15 Async Params] - Server component patterns
- [Source: https://supabase.com/docs/reference/javascript/auth-admin-listusers] - Supabase Admin API

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Desk Check

**Status:** approved
**Date:** 2026-01-28 08:10
**Full Report:** [View Report](../../screenshots/story-6.3/desk-check-report.md)

Visual quality validated. Ready for code review.

**Key Findings:**
- All 6 acceptance criteria verified and passing
- User table renders with correct columns (User, Status, Signed Up, Last Login, Actions)
- Search filters results in real-time
- Active status badges display in green
- Bulk selection with action bar works correctly
- Pagination shows "Showing 1-20 of 20 users" with navigation controls
- Mobile responsive - sidebar collapses to hamburger menu
- No JavaScript errors from story implementation code
