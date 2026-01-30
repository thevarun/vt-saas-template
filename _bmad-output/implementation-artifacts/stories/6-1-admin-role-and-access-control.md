# Story 6.1: Admin Role & Access Control

Status: done

## Story

As a product owner,
I want admin access controlled by a simple flag,
so that only authorized users can access admin features.

## Acceptance Criteria

### AC1: Admin Status Determination
**Given** user roles
**When** I check if a user is admin
**Then** admin status is determined by `user_metadata.isAdmin` flag
**Or** admin status is determined by ADMIN_EMAILS env var list

### AC2: Admin Check Implementation
**Given** the admin check implementation
**When** I review the code
**Then** there is a utility function `isAdmin(user)` or similar
**And** function checks both DB flag and env var fallback
**And** function is used consistently across admin features

### AC3: Non-Admin Access Blocked
**Given** a non-admin user
**When** they try to access `/admin/*` routes
**Then** middleware blocks the request
**And** user is redirected to dashboard
**And** they see "Access denied" message

### AC4: Admin Access Granted
**Given** an admin user
**When** they access `/admin/*` routes
**Then** access is granted
**And** admin content is displayed
**And** admin-specific navigation is visible

### AC5: Environment Variable Approach
**Given** the environment variable approach
**When** ADMIN_EMAILS is set (e.g., "admin@example.com,owner@example.com")
**Then** users with those emails are treated as admins
**And** this works without database changes
**And** useful for initial setup before DB-based roles

### AC6: Middleware Protection
**Given** the middleware protection
**When** admin routes are accessed
**Then** check happens at edge (middleware.ts)
**And** unauthorized requests never reach route handlers
**And** performance impact is minimal

## Tasks / Subtasks

- [x] Task 1: Create `isAdmin()` utility function (AC: #1, #2)
  - [x] Subtask 1.1: Create `src/libs/auth/isAdmin.ts` utility file
  - [x] Subtask 1.2: Implement check for `user.user_metadata?.isAdmin === true`
  - [x] Subtask 1.3: Implement fallback check for `ADMIN_EMAILS` env var
  - [x] Subtask 1.4: Parse comma-separated email list from env
  - [x] Subtask 1.5: Return `boolean` for admin status
  - [x] Subtask 1.6: Export function for reuse across app

- [x] Task 2: Add admin route protection to middleware (AC: #3, #4, #6)
  - [x] Subtask 2.1: Add `/admin` to `protectedPaths` array in `src/middleware.ts`
  - [x] Subtask 2.2: Create admin-specific check after auth validation
  - [x] Subtask 2.3: Import and call `isAdmin(user)` utility
  - [x] Subtask 2.4: Redirect non-admins to `/dashboard` with error param
  - [x] Subtask 2.5: Allow admins to continue to admin routes
  - [x] Subtask 2.6: Ensure check runs at edge (<50ms performance target)

- [x] Task 3: Add environment variable for admin emails (AC: #5)
  - [x] Subtask 3.1: Add `ADMIN_EMAILS` to `.env.example`
  - [x] Subtask 3.2: Document format in comments (comma-separated)
  - [ ] Subtask 3.3: Add variable to Vercel production environment (manual step)
  - [ ] Subtask 3.4: Update CLAUDE.md with admin configuration info (deferred)

- [x] Task 4: Create access denied feedback (AC: #3)
  - [x] Subtask 4.1: Add toast/alert on dashboard when redirected from admin
  - [x] Subtask 4.2: Check for `error=access_denied` query param
  - [x] Subtask 4.3: Display "Access denied: Admin privileges required" message
  - [x] Subtask 4.4: Use existing toast notification system
  - [x] Subtask 4.5: Add translation keys for error message

- [x] Task 5: Write unit tests for `isAdmin()` (AC: #2)
  - [x] Subtask 5.1: Create `src/libs/auth/isAdmin.test.ts`
  - [x] Subtask 5.2: Test user with `user_metadata.isAdmin = true`
  - [x] Subtask 5.3: Test user with email in ADMIN_EMAILS
  - [x] Subtask 5.4: Test user with neither flag nor email match
  - [x] Subtask 5.5: Test edge cases (missing user_metadata, empty env var)
  - [x] Subtask 5.6: Mock environment variables for tests

## Dev Notes

### Critical Architecture Requirements

**Authentication Pattern (MUST FOLLOW):**
- This project uses Supabase Auth with THREE different client types:
  - `createClient(cookieStore)` - For Server Components/API Routes
  - `createBrowserClient()` - For Client Components
  - `createServerClient()` - For Middleware ONLY
- NEVER mix these clients - use the correct one for context
- User object structure: `user.user_metadata` is the place for custom fields
- Supabase user metadata is stored in JWT and accessible without DB hit

**Middleware Performance (CRITICAL):**
- Middleware runs on EVERY request at the Edge runtime
- MUST complete in <50ms to avoid site-wide slowdown
- NO database queries allowed in middleware
- NO external API calls
- Use user metadata from JWT (already in memory) for admin check

**Route Protection Pattern:**
- Existing pattern in `src/middleware.ts`:
  ```typescript
  const protectedPaths = ['/dashboard', '/onboarding', '/chat'];
  ```
- Add `/admin` to this array
- Admin check happens AFTER basic auth validation
- Redirect format: `new URL(\`\${localePrefix}/dashboard?error=access_denied\`, request.url)`

**Environment Variable Pattern:**
- Server-side only vars have NO prefix
- Client-side vars use `NEXT_PUBLIC_*` prefix
- ADMIN_EMAILS is server-side only (no need to expose)
- Access via `process.env.ADMIN_EMAILS` in middleware/server code

**Error Handling Pattern:**
- Use query params for redirect messages: `?error=access_denied`
- Dashboard checks for error params and displays toast
- Follow existing pattern from auth flows (see sign-in redirect logic)
- Use `next-intl` for translated error messages

### Implementation Strategy

**Step 1: Create isAdmin Utility**

Location: `src/libs/auth/isAdmin.ts`

```typescript
import type { User } from '@supabase/supabase-js'

/**
 * Determines if a user has admin privileges
 *
 * Admin status can be granted via:
 * 1. user_metadata.isAdmin flag in Supabase (primary method)
 * 2. Email address in ADMIN_EMAILS environment variable (fallback)
 *
 * @param user - Supabase user object
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false

  // Check user_metadata.isAdmin flag first (primary method)
  if (user.user_metadata?.isAdmin === true) {
    return true
  }

  // Fallback: check ADMIN_EMAILS environment variable
  const adminEmails = process.env.ADMIN_EMAILS
  if (adminEmails && user.email) {
    const emailList = adminEmails.split(',').map(email => email.trim().toLowerCase())
    return emailList.includes(user.email.toLowerCase())
  }

  return false
}
```

**Why this design:**
- Checks user_metadata first (fast, stored in JWT)
- Falls back to env var for bootstrapping
- Works without database queries
- Type-safe with Supabase User type
- Handles edge cases (null user, missing email)

**Step 2: Update Middleware**

File: `src/middleware.ts`

Changes needed:
1. Add `/admin` to `protectedPaths` array (line 19-23)
2. After existing auth check (lines 54-80), add admin check:

```typescript
// After line 92 (before return response)

// Check admin routes
if (request.nextUrl.pathname.includes('/admin')) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!isAdmin(user)) {
    const locale = request.nextUrl.pathname.match(/^\/([^/]+)/)?.at(1) ?? ''
    const isLocale = AllLocales.includes(locale as any)
    const localePrefix = isLocale ? `/${locale}` : ''

    const dashboardUrl = new URL(`${localePrefix}/dashboard?error=access_denied`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }
}
```

**Integration points:**
- Uses existing locale detection pattern (lines 71-74)
- Follows existing redirect pattern (lines 76-79)
- Reuses Supabase client from auth check
- Maintains <50ms middleware performance

**Step 3: Dashboard Error Handling**

File: `src/app/[locale]/(auth)/dashboard/page.tsx`

Add error param check in dashboard component:
- Use `useSearchParams()` to read `error` query param
- Display toast if `error=access_denied`
- Follow pattern from existing auth redirects

Translation keys needed in `src/locales/*/common.json`:
```json
{
  "errors": {
    "accessDenied": "Access denied: Admin privileges required",
    "contactAdmin": "Please contact an administrator for access"
  }
}
```

**Step 4: Environment Configuration**

File: `.env.example`

Add:
```bash
# Admin Access Control (optional)
# Comma-separated list of admin email addresses
# Users with these emails OR user_metadata.isAdmin=true have admin access
# Example: ADMIN_EMAILS=admin@example.com,owner@example.com
ADMIN_EMAILS=
```

### Testing Strategy

**Unit Tests (`src/libs/auth/isAdmin.test.ts`):**

```typescript
import { describe, expect, it, vi } from 'vitest'
import { isAdmin } from './isAdmin'
import type { User } from '@supabase/supabase-js'

describe('isAdmin', () => {
  it('returns true for user with isAdmin flag', () => {
    const user = {
      user_metadata: { isAdmin: true },
      email: 'user@example.com',
    } as User

    expect(isAdmin(user)).toBe(true)
  })

  it('returns true for user in ADMIN_EMAILS', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com,owner@example.com')

    const user = {
      user_metadata: {},
      email: 'admin@example.com',
    } as User

    expect(isAdmin(user)).toBe(true)

    vi.unstubAllEnvs()
  })

  it('returns false for non-admin user', () => {
    const user = {
      user_metadata: {},
      email: 'user@example.com',
    } as User

    expect(isAdmin(user)).toBe(false)
  })

  it('returns false for null user', () => {
    expect(isAdmin(null)).toBe(false)
  })

  it('handles missing user_metadata gracefully', () => {
    const user = {
      email: 'user@example.com',
    } as User

    expect(isAdmin(user)).toBe(false)
  })

  it('is case-insensitive for email matching', () => {
    vi.stubEnv('ADMIN_EMAILS', 'Admin@Example.com')

    const user = {
      user_metadata: {},
      email: 'admin@example.com',
    } as User

    expect(isAdmin(user)).toBe(true)

    vi.unstubAllEnvs()
  })
})
```

**E2E Test Considerations:**
- Test admin route access will come in Story 6.2 (Admin Layout)
- Story 6.1 focuses on the infrastructure and utility function
- Middleware testing is complex; focus on unit tests for now

### Project Structure Notes

**File Locations:**
- Admin utility: `src/libs/auth/isAdmin.ts` (new directory)
- Middleware changes: `src/middleware.ts` (existing)
- Dashboard error handling: `src/app/[locale]/(auth)/dashboard/page.tsx` (existing)
- Environment config: `.env.example` (existing)

**Import Pattern:**
```typescript
import { isAdmin } from '@/libs/auth/isAdmin'
```

**Dependencies:**
- No new npm packages required
- Uses existing Supabase types: `@supabase/supabase-js`
- Uses existing Next.js middleware patterns
- Uses existing toast/notification system (from onboarding stories)

### Security Considerations

**CRITICAL - Read Carefully:**

1. **Admin emails in environment variable:**
   - ADMIN_EMAILS is server-side only
   - NEVER expose via `NEXT_PUBLIC_*` prefix
   - Used only in middleware/server code
   - Not accessible from browser

2. **User metadata security:**
   - `user_metadata.isAdmin` is editable only via Supabase Admin API
   - Regular users CANNOT modify their own metadata
   - Set via Supabase dashboard or Admin SDK only
   - Safe to rely on for authorization

3. **Middleware security:**
   - Admin check runs at edge before route handlers
   - No way to bypass via client-side navigation
   - Protected routes never execute for non-admins
   - Query params cannot be forged to gain access

4. **Future admin actions:**
   - API routes for admin actions (Stories 6.3+) MUST also check `isAdmin()`
   - Middleware protects pages, but API routes need explicit validation
   - Pattern: Every admin API route calls `isAdmin(user)` before processing

### References

- [Source: CLAUDE.md#Authentication Flow] - Supabase client types and usage
- [Source: CLAUDE.md#Middleware] - Performance requirements and patterns
- [Source: CLAUDE.md#Route Protection Pattern] - Existing protected paths pattern
- [Source: src/middleware.ts:19-23] - Current protectedPaths array
- [Source: src/middleware.ts:54-92] - Existing auth validation logic
- [Source: Epic 6 Story 6.1] - Full acceptance criteria and context
- [Source: _bmad-output/project-context.md:RULE 2] - NEVER Skip API Route Authentication
- [Source: _bmad-output/project-context.md:RULE 4] - NEVER Mix Supabase Client Types
- [Source: _bmad-output/project-context.md:RULE 6] - NEVER Do Heavy Work in Middleware

### UX Design Context

Story 6.1 has no UI components - it is pure backend infrastructure for access control. UX design artifacts for Epic 6 are relevant to Stories 6.2+ (Admin Layout, User Management, etc).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) - admin-backend-specialist agent

### Debug Log References

- TDD approach: wrote 20 unit tests first (RED), then implemented isAdmin() function (GREEN)
- Fixed TypeScript errors by casting test objects through `unknown` first
- ESLint auto-fix applied for semicolon style compliance

### Completion Notes List

1. **isAdmin() utility** - Created at `src/libs/auth/isAdmin.ts` with:
   - Primary check: `user_metadata.isAdmin === true` (strict equality)
   - Fallback check: email in ADMIN_EMAILS env var (case-insensitive)
   - Handles null/undefined users, missing metadata, empty env vars
   - No database queries - <50ms performance compatible

2. **Middleware protection** - Updated `src/middleware.ts`:
   - Added `/admin` to protectedPaths array
   - Added `adminPaths` array and `isAdminRoute()` helper
   - Admin check runs after auth validation, redirects to `/dashboard?error=access_denied`
   - Preserves locale prefix in redirects

3. **AccessDeniedToast component** - Created `src/components/auth/AccessDeniedToast.tsx`:
   - Client component following VerificationToast pattern
   - Checks for `error=access_denied` query param
   - Shows destructive toast with translated messages
   - Cleans up URL after displaying toast

4. **Translations** - Added to all locale files (en, hi, bn):
   - `Errors.admin.accessDenied` - "Access Denied" title
   - `Errors.admin.contactAdmin` - Contact admin message

5. **Environment config** - Added to `.env.example`:
   - ADMIN_EMAILS with documentation comments
   - Format example: comma-separated email list

### File List

**New Files:**
- `src/libs/auth/isAdmin.ts` - Admin check utility function
- `src/libs/auth/isAdmin.test.ts` - 20 unit tests for isAdmin()
- `src/components/auth/AccessDeniedToast.tsx` - Toast component for access denied

**Modified Files:**
- `src/middleware.ts` - Admin route protection
- `src/app/[locale]/(auth)/dashboard/page.tsx` - Added AccessDeniedToast
- `src/locales/en.json` - Admin error translations
- `src/locales/hi.json` - Admin error translations
- `src/locales/bn.json` - Admin error translations
- `.env.example` - ADMIN_EMAILS variable

---

## Desk Check

**Status:** approved
**Date:** 2026-01-28 14:35
**Full Report:** [View Report](../../screenshots/story-6.1/desk-check-report.md)

Visual quality validated. AccessDeniedToast now displays correctly on both desktop and mobile viewports after Suspense boundary fix was applied. Ready for code review.
