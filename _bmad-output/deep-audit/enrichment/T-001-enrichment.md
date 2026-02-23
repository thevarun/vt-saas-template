# Implementation Brief: T-001 -- Centralize API Auth and Error Infrastructure

## Theme Metadata
- **ID**: T-001
- **Name**: Centralize API Auth and Error Infrastructure
- **Effort**: L
- **Risk**: MEDIUM
- **Coverage Gate**: REQUIRED
- **Blast Radius**: WIDE
- **Warnings**: Large blast radius -- consider splitting into sub-themes

## Enriched Implementation Steps

### Step 1: Write characterization tests for 5 representative API routes
*Addresses: F-080, F-082, F-089, F-008, F-007*

Write characterization tests that capture the **current** error response shapes (including non-conforming ones) for these representative routes:
1. `src/app/api/admin/users/[userId]/route.ts` -- already uses error helpers (F-007: leaks `error.message`)
2. `src/app/api/admin/feedback/[id]/archive/route.ts` -- uses `console.error` instead of `logApiError`
3. `src/app/api/profile/update/route.ts` -- returns raw `{ error }` without code field (F-080)
4. `src/app/api/share/route.ts` -- bypasses shared error infra entirely (F-082)
5. `src/app/api/email/welcome/route.ts` -- leaks `result.error` details (F-008, F-089)

**What to assert:**
- HTTP status codes for each error path (401, 400, 500, etc.)
- **Current** response body shape: which ones have `{ error, code }` vs raw `{ error }`
- Whether `logApiError`/Sentry is called or missing

> NOTE: Existing tests already exist for several routes (`route.test.ts` for share, email/welcome, admin users, admin feedback, profile update-preferences). The characterization tests should specifically assert the error response contract (presence/absence of `code` field) to lock in current behavior before refactoring.

**Run existing tests first to establish baseline:**
```bash
npm test -- src/app/api/share/route.test.ts
npm test -- src/app/api/email/welcome/route.test.ts
npm test -- src/app/api/admin/users
npm test -- src/app/api/admin/feedback
npm test -- src/app/api/profile/update-preferences
```

### Step 2: Extract `withAuth()` HOF
*Addresses: F-009, F-028*

Create `src/libs/api/middleware/withAuth.ts`:

```typescript
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { unauthorizedError, logAuthError } from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';

type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: User; params?: any }
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext?: any) => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logAuthError('Invalid session', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
      });
      return unauthorizedError();
    }

    const params = routeContext?.params ? await routeContext.params : undefined;
    return handler(request, { user, params });
  };
}
```

Key design decisions:
- Takes a handler function, returns a Next.js route handler
- Awaits `params` Promise (Next.js 15 pattern) before passing to handler
- Calls `logAuthError()` on failure (Sentry integration)
- Returns typed `User` object to handler

### Step 3: Extract `withAdminAuth()` HOF
*Addresses: F-028*

Create `src/libs/api/middleware/withAdminAuth.ts` composing `withAuth()` with admin check:

```typescript
import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { forbiddenError, logAuthzError } from '@/libs/api/errors';
import { isAdmin } from '@/libs/auth/isAdmin';
import { withAuth } from './withAuth';

type AdminHandler = (
  request: NextRequest,
  context: { user: User; params?: any }
) => Promise<Response>;

export function withAdminAuth(handler: AdminHandler) {
  return withAuth(async (request, context) => {
    if (!isAdmin(context.user)) {
      logAuthzError('Admin access required', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        userId: context.user.id,
      });
      return forbiddenError('Admin access required');
    }
    return handler(request, context);
  });
}
```

Also create `src/libs/api/middleware/index.ts` barrel export.

### Step 4: Add new error codes to `ApiErrorCode` union type
*Addresses: F-068, F-083*

In `src/libs/api/errors/types.ts`, add these codes to the union:
- `TIMEOUT` -- used by vercel chat route (F-068)
- `RATE_LIMIT` -- used by vercel chat route (F-068)
- `SAVE_FAILED` -- used by update-preferences route (F-083)
- `USERNAME_TAKEN` -- used by update-username route (F-083)

Also add `HTTP_STATUS.TOO_MANY_REQUESTS: 429` and `HTTP_STATUS.REQUEST_TIMEOUT: 408` to the `HTTP_STATUS` const.

### Step 5: Define `ValidationDetails` type and update `validationError()` parameter
*Addresses: F-070*

In `src/libs/api/errors/types.ts`:
```typescript
export type ValidationDetails = Record<string, string[]>;
```

In `src/libs/api/errors/responses.ts`, change:
```typescript
// Before:
export function validationError(details: any, ...): ...
// After:
export function validationError(details: ValidationDetails | string, ...): ...
```

Allow `string` as fallback since some routes pass a string message (e.g., `validationError('Token is required')`). When a string is passed, wrap it as `{ _error: [message] }`.

Update `ApiErrorResponse.details` type from `Record<string, any>` to `ValidationDetails | Record<string, unknown>`.

### Step 6: Refactor `profile/update` route to use shared error helpers
*Addresses: F-080, F-010*

In `src/app/api/profile/update/route.ts`:
- Replace all `NextResponse.json({ error: ... })` with `unauthorizedError()`, `invalidRequestError()`, `conflictError()`, `internalError()`
- Wrap `request.json()` in try-catch for malformed JSON (F-010)
- Replace `console.error()` with `logApiError()`
- Ensure all error responses have `{ error, code }` shape

### Step 7: Refactor share API routes to use shared error helpers
*Addresses: F-082*

In `src/app/api/share/route.ts` and `src/app/api/share/[token]/route.ts`:
- Replace `NextResponse.json({ error: ... })` with `internalError()`, `notFoundError()`, etc.
- Add `logApiError()` calls in catch blocks
- Replace `console.error()` with `logApiError()`
- For the 410 Gone response in `[token]/route.ts`, use `createErrorResponse()` directly with a new approach or keep the custom status but ensure the `code` field is present

### Step 8: Refactor email/welcome, admin/analytics, cron/memory-extraction routes
*Addresses: F-008, F-089*

**`src/app/api/email/welcome/route.ts`:**
- Replace `{ error: 'Unauthorized' }` with `unauthorizedError()`
- Replace `{ error: 'Failed to send email', details: result.error }` with `internalError('Failed to send email')` -- do NOT leak `result.error` to client (F-008). Log it server-side via `logApiError()`
- Replace `console.error()` with `logApiError()`

**`src/app/api/admin/analytics/route.ts`:**
- Replace `console.error()` with `logApiError()`
- Already uses error helpers for auth, so minimal changes

**`src/app/api/cron/memory-extraction/route.ts`:**
- Replace `{ error: 'Cron endpoint not configured' }` and `{ error: 'Unauthorized' }` with shared helpers that include `code` field
- Already uses `logger` properly -- just fix response format

### Step 9: Refactor all admin routes to use `withAdminAuth()` HOF
*Addresses: F-028*

Refactor these 11 admin routes to use `withAdminAuth()`:
1. `src/app/api/admin/users/[userId]/route.ts` (DELETE)
2. `src/app/api/admin/users/[userId]/suspend/route.ts` (POST)
3. `src/app/api/admin/users/[userId]/unsuspend/route.ts` (POST)
4. `src/app/api/admin/users/[userId]/reset-password/route.ts` (POST)
5. `src/app/api/admin/feedback/[id]/archive/route.ts` (POST)
6. `src/app/api/admin/feedback/[id]/delete/route.ts` (POST)
7. `src/app/api/admin/feedback/[id]/mark-reviewed/route.ts` (POST)
8. `src/app/api/admin/feedback/bulk/route.ts` (POST)
9. `src/app/api/admin/feedback/export/route.ts` (GET)
10. `src/app/api/admin/analytics/route.ts` (GET)
11. `src/app/api/admin/email/test/route.ts` (POST)

Each route currently has 6-8 lines of identical boilerplate:
```typescript
const cookieStore = await cookies();
const supabase = createClient(cookieStore);
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) { return unauthorizedError(); }
if (!isAdmin(user)) { return forbiddenError('Admin access required'); }
```

After refactor, each route becomes:
```typescript
export const DELETE = withAdminAuth(async (request, { user, params }) => {
  // Business logic only
});
```

### Step 10: Replace `console.error`/`console.warn` with `logger.error()`/`logger.warn()`
*Addresses: F-042*

There are **91 occurrences across 53 files**. Batch by directory:

**Batch 1 -- API routes (17 files, ~25 occurrences):**
- `src/app/api/profile/update/route.ts` (3)
- `src/app/api/profile/update-preferences/route.ts` (1)
- `src/app/api/profile/update-username/route.ts` (1)
- `src/app/api/profile/check-username/route.ts` (1)
- `src/app/api/share/route.ts` (2)
- `src/app/api/share/[token]/route.ts` (3)
- `src/app/api/email/welcome/route.ts` (1)
- `src/app/api/admin/feedback/*/route.ts` (5 files, 5 occurrences)
- `src/app/api/admin/analytics/route.ts` (1)
- `src/app/api/admin/email/test/route.ts` (1)
- `src/app/api/og/route.tsx` (1)
- `src/app/api/auth/callback/route.ts` (1)
- `src/app/api/auth/verify-complete/route.ts` (1)
- `src/app/auth/callback/route.ts` (1)

**Batch 2 -- Libraries (12 files, ~20 occurrences):**
- `src/libs/queries/*.ts` (4 files: feedback, metrics, users, auditLog)
- `src/libs/analytics/*.ts` (4 files: index, validation, server, providers/posthog)
- `src/libs/api/client/parseError.ts` (2)
- `src/libs/audit/logAdminAction.ts` (1)
- `src/libs/email/index.ts` (1)
- `src/libs/email/sendWelcomeEmail.tsx` (1)
- `src/libs/utils/dashboardUtils.ts` (1)

**Batch 3 -- Components (14 files, ~40 occurrences):**
- `src/components/chat/*.tsx` (3 files)
- `src/components/share/*.tsx` (2 files)
- `src/components/onboarding/*.tsx` (3 files)
- `src/components/admin/*.tsx` (4 files)
- `src/components/feedback/FeedbackModal.tsx` (6)
- `src/components/errors/ErrorBoundary.tsx` (3)
- `src/components/layout/*.tsx` (2 files)

**Batch 4 -- Pages (4 files):**
- `src/app/[locale]/(auth)/dashboard/user-profile/page.tsx` (3)
- `src/app/[locale]/(auth)/dashboard/share-links/page.tsx` (1)
- `src/app/[locale]/(auth)/demo-share/page.tsx` (1)
- `src/app/[locale]/(auth)/sign-out/page.tsx` (1)
- `src/app/[locale]/(admin)/admin/page.tsx` (1)

**Batch 5 -- Instrumentation:**
- `src/instrumentation.ts` (1)

> NOTE: For client-side components (Batch 3-4), `logger` (Pino) cannot be imported because it uses Node.js APIs. For these, use `console.error` is acceptable for browser runtime. However, review each to see if the error should instead be reported to Sentry via `Sentry.captureException()`. Only server-side files should switch to `logger`.

### Step 11: Sanitize error messages in admin routes
*Addresses: F-007*

In admin routes that pass raw Supabase/provider error messages to responses:
- `src/app/api/admin/users/[userId]/route.ts` line 73: `internalError(error.message || 'Failed to delete user')` -- change to `internalError('Failed to delete user')`, log `error.message` via `logApiError()`
- `src/app/api/admin/users/[userId]/suspend/route.ts` line 70: same pattern
- `src/app/api/admin/users/[userId]/unsuspend/route.ts` line 64: same pattern
- `src/app/api/admin/users/[userId]/reset-password/route.ts` line 91: same pattern
- `src/app/api/admin/email/test/route.ts` line 51: `internalError(result.error || 'Failed to send test email')` -- sanitize

### Gap Fill: Wrap `request.json()` in try-catch (F-010)
*Addresses: F-010*

Several routes call `request.json()` without handling malformed JSON:
- `src/app/api/profile/update/route.ts` line 21
- `src/app/api/profile/update-preferences/route.ts` line 32
- `src/app/api/profile/check-username/route.ts` line 33
- `src/app/api/profile/update-username/route.ts` line 33
- `src/app/api/share/route.ts` line 39
- `src/app/api/share/[token]/route.ts` line 120
- `src/app/api/admin/feedback/bulk/route.ts` line 37

For routes using Zod `.safeParse()`, the outer try-catch will catch JSON parse errors. But the error will be a generic 500 instead of a 400. Better to wrap `request.json()`:
```typescript
let body;
try {
  body = await request.json();
} catch {
  return invalidRequestError('Invalid JSON in request body');
}
```

> This was suggested by F-010 but not explicitly listed as a step. Added as sub-step of Steps 6-8.

### Gap Fill: Refactor additional non-admin routes to shared error infra
*Not explicitly covered by original steps*

These routes also bypass the shared error infrastructure:
- `src/app/api/profile/update-preferences/route.ts` -- uses `SAVE_FAILED` code via raw `NextResponse.json()` (F-083)
- `src/app/api/profile/update-username/route.ts` -- uses `USERNAME_TAKEN` code via raw `NextResponse.json()`
- `src/app/api/profile/check-username/route.ts` -- uses raw `NextResponse.json()` for errors
- `src/app/api/auth/verify-complete/route.ts` -- has `console.error`
- `src/app/api/auth/callback/route.ts` -- has `console.error`

These should be refactored to use shared error helpers in the same pass as Steps 6-8.

## Related Findings

### F-009: Middleware matcher excludes all API routes from auth protection
- **Severity**: P2
- **File**: `src/proxy.ts`
- **Line**: 124 (now line 129 -- `matcher` config)
- **Description**: The middleware explicitly excludes `/api` routes, relying entirely on each route to implement its own authentication. Creates fragile defense model.
- **Suggestion**: Add a shared `withAuth()` HOF or lightweight API middleware for rate limiting and auth.

### F-028: 11 admin API routes duplicate identical auth + admin authorization boilerplate
- **Severity**: P2
- **File**: `src/app/api/admin/` (multiple routes)
- **Line**: multiple routes
- **Description**: Every admin route repeats 8 lines of auth/admin check boilerplate. Any change requires editing 11 files. ~10 more non-admin routes have similar auth duplication.
- **Suggestion**: Extract `withAdminAuth()` and `withAuth()` higher-order functions to centralize auth.

### F-007: Supabase error messages leaked in admin API responses
- **Severity**: P2
- **File**: `src/app/api/admin/users/[userId]/route.ts`
- **Line**: 73
- **Description**: Multiple admin routes pass raw Supabase `error.message` to `internalError()`, potentially exposing internal details like schema names or connection info.
- **Suggestion**: Use generic error messages for client responses while logging detailed errors server-side.

### F-008: Email send failure details leaked in API response
- **Severity**: P2
- **File**: `src/app/api/email/welcome/route.ts`
- **Line**: 40
- **Description**: When the welcome email fails, `result.error` (from Resend) is returned directly, potentially revealing infrastructure details.
- **Suggestion**: Return generic error message, log details server-side.

### F-010: request.json() not wrapped in try-catch for malformed requests
- **Severity**: P3
- **File**: `src/app/api/profile/update/route.ts`
- **Line**: 21
- **Description**: Multiple routes call `request.json()` without handling malformed JSON gracefully, falling through to generic 500 errors instead of 400.
- **Suggestion**: Wrap in try-catch or use Zod `.safeParse()` which handles parse failures automatically.

### F-042: 40+ production files use console.error instead of structured logger
- **Severity**: P2
- **File**: Multiple files (53 files, 91 occurrences)
- **Line**: various
- **Description**: Project has configured Pino/Logtail logger but 40+ files use bare console.error(). Missing structured JSON output, log levels, and Sentry integration.
- **Suggestion**: Replace all production console.error/console.warn with logger.error() from @/libs/Logger.

### F-080: Profile update endpoint bypasses shared error infrastructure
- **Severity**: P1
- **File**: `src/app/api/profile/update/route.ts`
- **Line**: 15-86
- **Description**: Returns raw `{ error: string }` without code field, diverging from ApiErrorResponse `{ error, code, details? }` used everywhere else.
- **Suggestion**: Refactor to use unauthorizedError(), invalidRequestError(), conflictError(), internalError().

### F-082: Share API endpoints bypass shared error infrastructure entirely
- **Severity**: P1
- **File**: `src/app/api/share/route.ts`
- **Line**: 62-90
- **Description**: Both POST and GET use plain NextResponse.json() without code field or Sentry capture. No logApiError() calls.
- **Suggestion**: Replace with shared helpers. Add logApiError()/Sentry.captureException().

### F-083: Undocumented error codes SAVE_FAILED and USERNAME_TAKEN not in ApiErrorCode union
- **Severity**: P1
- **File**: `src/app/api/profile/update-preferences/route.ts`
- **Line**: 80-85
- **Description**: Routes use custom error codes not defined in the ApiErrorCode type. Clients receiving these can't match them.
- **Suggestion**: Add to ApiErrorCode or map to existing codes.

### F-089: Multiple endpoints bypass shared error infrastructure, skipping Sentry
- **Severity**: P2
- **File**: `src/app/api/email/welcome/route.ts`
- **Line**: 24
- **Description**: /email/welcome, /admin/analytics, /cron/memory-extraction, all admin feedback routes return raw { error } without code field or logApiError().
- **Suggestion**: Apply shared error helpers and logApiError() across all routes.

### F-068: TIMEOUT and RATE_LIMIT error codes not in ApiErrorCode union
- **Severity**: P2
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 383, 396 (now 299, 312)
- **Description**: Route uses literal string codes outside the typed union. Client-side handlers silently fall through.
- **Suggestion**: Add TIMEOUT and RATE_LIMIT to ApiErrorCode. Use createErrorResponse().

### F-070: validationError() parameter typed as `any`, nullifying type safety
- **Severity**: P2
- **File**: `src/libs/api/errors/responses.ts`
- **Line**: 114 (now line 42-52)
- **Description**: Called with Zod arrays, formatted maps, and raw strings. Client-side then casts to Record<string, string[]>.
- **Suggestion**: Define ValidationDetails = Record<string, string[]>. Use throughout chain.

## Affected Files (Validated)

### Core Infrastructure (to create/modify)
- `src/libs/api/errors/types.ts` -- add new error codes, ValidationDetails type
- `src/libs/api/errors/responses.ts` -- type `validationError()` parameter, add `timeoutError()`, `rateLimitError()`, `saveFailedError()` helpers
- `src/libs/api/errors/validation.ts` -- no changes needed (already returns `Record<string, string[]>`)
- `src/libs/api/errors/index.ts` -- re-export new helpers and types
- `src/libs/api/middleware/withAuth.ts` -- **NEW FILE**
- `src/libs/api/middleware/withAdminAuth.ts` -- **NEW FILE**
- `src/libs/api/middleware/index.ts` -- **NEW FILE** (barrel export)

### Admin Routes (11 routes to refactor to withAdminAuth)
- `src/app/api/admin/users/[userId]/route.ts` -- also sanitize error messages (F-007)
- `src/app/api/admin/users/[userId]/suspend/route.ts` -- also sanitize error messages
- `src/app/api/admin/users/[userId]/unsuspend/route.ts` -- also sanitize error messages
- `src/app/api/admin/users/[userId]/reset-password/route.ts` -- also sanitize error messages
- `src/app/api/admin/feedback/[id]/archive/route.ts` -- also replace console.error
- `src/app/api/admin/feedback/[id]/delete/route.ts` -- also replace console.error
- `src/app/api/admin/feedback/[id]/mark-reviewed/route.ts` -- also replace console.error
- `src/app/api/admin/feedback/bulk/route.ts` -- also replace console.error, fix JSON parse
- `src/app/api/admin/feedback/export/route.ts` -- also replace console.error
- `src/app/api/admin/analytics/route.ts` -- also replace console.error
- `src/app/api/admin/email/test/route.ts` -- also replace console.error, sanitize error msg

### Non-Admin API Routes (error infra migration)
- `src/app/api/profile/update/route.ts` -- full rewrite to shared helpers (F-080)
- `src/app/api/profile/update-preferences/route.ts` -- use shared helpers, fix SAVE_FAILED (F-083)
- `src/app/api/profile/update-username/route.ts` -- use shared helpers, fix USERNAME_TAKEN (F-083)
- `src/app/api/profile/check-username/route.ts` -- replace console.error
- `src/app/api/profile/delete/route.ts` -- already good, minor review
- `src/app/api/share/route.ts` -- full migration to shared helpers (F-082)
- `src/app/api/share/[token]/route.ts` -- full migration to shared helpers (F-082)
- `src/app/api/email/welcome/route.ts` -- stop leaking result.error (F-008)
- `src/app/api/cron/memory-extraction/route.ts` -- add code field to responses (F-089)
- `src/app/api/feedback/route.ts` -- already well-structured, no changes needed
- `src/app/api/chat/vercel/route.ts` -- use typed TIMEOUT/RATE_LIMIT codes (F-068)

### Middleware
- `src/proxy.ts` -- no code changes needed (F-009 addressed by withAuth HOF approach)

### Logger
- `src/libs/Logger.ts` -- no changes needed

### console.error Batch Replacement (server-side files only)
- `src/libs/queries/feedback.ts`
- `src/libs/queries/metrics.ts`
- `src/libs/queries/users.ts`
- `src/libs/queries/auditLog.ts`
- `src/libs/audit/logAdminAction.ts`
- `src/libs/analytics/index.ts`
- `src/libs/analytics/validation.ts`
- `src/libs/analytics/server.ts`
- `src/libs/analytics/providers/posthog.ts`
- `src/libs/email/index.ts`
- `src/libs/email/sendWelcomeEmail.tsx`
- `src/libs/utils/dashboardUtils.ts`
- `src/libs/api/client/parseError.ts`
- `src/app/api/og/route.tsx`
- `src/app/api/auth/callback/route.ts`
- `src/app/api/auth/verify-complete/route.ts`
- `src/app/auth/callback/route.ts`
- `src/instrumentation.ts`
- `src/app/[locale]/(auth)/sign-out/page.tsx` -- server component, can use logger

### Client-Side Files (console.error is acceptable, but add Sentry where missing)
- `src/components/chat/ChatInterface.tsx`
- `src/components/chat/vercel/VercelChatInterface.tsx`
- `src/components/chat/ThreadTitleEditor.tsx`
- `src/components/share/ShareLinksTable.tsx`
- `src/components/share/ShareLinkModal.tsx`
- `src/components/onboarding/OnboardingUsername.tsx`
- `src/components/onboarding/OnboardingPreferences.tsx`
- `src/components/onboarding/OnboardingFeatureTour.tsx`
- `src/components/feedback/FeedbackModal.tsx`
- `src/components/admin/analytics/AnalyticsDashboard.tsx`
- `src/components/admin/DeleteUserDialog.tsx`
- `src/components/admin/SuspendUserDialog.tsx`
- `src/components/admin/ResetPasswordDialog.tsx`
- `src/components/errors/ErrorBoundary.tsx`
- `src/components/layout/UserProfileSection.tsx`
- `src/components/layout/LanguageSelector.tsx`
- `src/app/[locale]/(auth)/dashboard/user-profile/page.tsx`
- `src/app/[locale]/(auth)/dashboard/share-links/page.tsx`
- `src/app/[locale]/(auth)/demo-share/page.tsx`
- `src/app/[locale]/(admin)/admin/page.tsx`

### Stale/Missing Files
- ~~`src/app/api/admin/email/route.ts`~~ (REMOVED: file does not exist. The actual path is `src/app/api/admin/email/test/route.ts`)
- ~~`src/middleware.ts`~~ (REMOVED: file does not exist. Middleware is at `src/proxy.ts`)

## Test Requirements

### Tests Before (Characterization)

**File: `src/app/api/profile/update/route.characterization.test.ts`**
Assert current behavior:
- POST without auth returns `{ error: 'Unauthorized' }` with status 401 -- no `code` field
- POST with missing fields returns `{ error: 'Username and display name are required' }` with status 400 -- no `code` field
- POST with invalid username returns `{ error: 'Invalid username format' }` with status 400 -- no `code` field
- POST with taken username returns `{ error: 'Username is already taken' }` with status 409 -- no `code` field
- POST with update failure returns `{ error: 'Failed to update profile' }` with status 500 -- no `code` field
- Verify `console.error` is called (not `logApiError`)

**File: `src/app/api/share/route.characterization.test.ts`**
Extend existing `src/app/api/share/route.test.ts`:
- POST error path (db insert fails) returns `{ error: 'Internal server error' }` with status 500 -- no `code` field
- GET error path returns `{ error: 'Internal server error' }` with status 500 -- no `code` field
- Verify `logApiError` is NOT called
- Verify `console.error` is called instead

**File: `src/app/api/email/welcome/route.characterization.test.ts`**
Extend existing `src/app/api/email/welcome/route.test.ts`:
- POST without auth returns `{ error: 'Unauthorized' }` with status 401 -- no `code` field
- POST with send failure returns `{ error: 'Failed to send email', details: <leaked-error> }` -- details LEAKS provider error
- Verify no `logApiError` or Sentry capture

**File: `src/app/api/admin/feedback/[id]/archive/route.characterization.test.ts`**
Extend existing test:
- POST error in catch block calls `console.error` (not `logApiError`)
- Verify error response shape

**File: `src/app/api/admin/users/[userId]/route.characterization.test.ts`**
Extend existing test:
- DELETE with Supabase error passes `error.message` to client via `internalError(error.message)` -- leaks internal message
- Verify `logApiError` IS called (this route already uses it)

**Run command:**
```bash
npm test -- src/app/api/profile/update
npm test -- src/app/api/share
npm test -- src/app/api/email/welcome
npm test -- src/app/api/admin/feedback
npm test -- src/app/api/admin/users
```

### Tests After (Verification)

**File: `src/libs/api/middleware/__tests__/withAuth.test.ts`**
- Returns 401 when `getUser()` returns error
- Returns 401 when `getUser()` returns null user
- Calls `logAuthError()` on auth failure
- Passes typed `User` object to handler
- Passes awaited params to handler
- Returns handler's response on success

**File: `src/libs/api/middleware/__tests__/withAdminAuth.test.ts`**
- Returns 401 when not authenticated (delegates to withAuth)
- Returns 403 when user is not admin
- Calls `logAuthzError()` on admin check failure
- Passes user to handler on admin success
- Handler receives correct params

**File: `src/libs/api/errors/types.test.ts`** (new)
- `TIMEOUT`, `RATE_LIMIT`, `SAVE_FAILED`, `USERNAME_TAKEN` are valid `ApiErrorCode` values
- `ValidationDetails` type is `Record<string, string[]>`

**File: `src/libs/api/errors/responses.test.ts`** (extend existing)
- `validationError()` accepts `Record<string, string[]>`
- `validationError()` accepts string and wraps properly
- New helper functions (`timeoutError`, `rateLimitError`) return correct status/code

**Updated route tests (verify all error responses conform):**
- `src/app/api/profile/update/route.test.ts` -- all errors now have `code` field
- `src/app/api/share/route.test.ts` -- all errors now have `code` field, `logApiError` called
- `src/app/api/email/welcome/route.test.ts` -- error does NOT leak `result.error`, has `code` field
- `src/app/api/admin/users/[userId]/__tests__/routes.test.ts` -- error does NOT leak `error.message`
- `src/app/api/admin/feedback/[id]/archive/__tests__/route.test.ts` -- uses `logApiError` not `console.error`
- All admin routes: verify they work with `withAdminAuth()` HOF

**Integration test for error contract consistency:**
- `src/libs/api/errors/__tests__/contract.test.ts` (new) -- import all route handlers and verify every error path returns `ApiErrorResponse` shape

**Run command:**
```bash
npm test -- src/libs/api/middleware
npm test -- src/libs/api/errors
npm test -- src/app/api/profile
npm test -- src/app/api/share
npm test -- src/app/api/email
npm test -- src/app/api/admin
```

**Full CI validation:**
```bash
npm run lint && npm run check-types && npm test && npm run build
```

## Enrichment Notes
- **UI Changes**: false -- No .tsx files under `src/app/`, `src/features/`, or `src/components/` are being modified for UI behavior. The client-side `console.error` -> Sentry changes in components do not affect rendering.
- **Stale Files Removed**: `src/app/api/admin/email/route.ts` (does not exist; actual path is `src/app/api/admin/email/test/route.ts`), `src/middleware.ts` (does not exist; middleware is at `src/proxy.ts`)
- **Gaps Found**:
  1. F-010 (malformed JSON try-catch) was not explicitly listed as a step -- added as sub-task of Steps 6-8
  2. Several non-admin routes (`profile/update-preferences`, `profile/update-username`, `profile/check-username`) that bypass error infra were not explicitly listed in steps -- added as gap fill
  3. The theme's `files` list referenced `src/app/api/admin/email/route.ts` which does not exist; corrected to `src/app/api/admin/email/test/route.ts`
  4. Step 10 (console.error replacement) needs nuance: client-side React components cannot import Pino logger. For those, `console.error` stays but should be paired with `Sentry.captureException()` where appropriate
  5. The vercel chat route (`src/app/api/chat/vercel/route.ts`) uses `new Response(JSON.stringify(...))` instead of `createErrorResponse()` for TIMEOUT and RATE_LIMIT -- should be converted to use shared helpers after adding the codes in Step 4
