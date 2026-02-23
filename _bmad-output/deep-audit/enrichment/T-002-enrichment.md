# Implementation Brief: T-002 — Harden Security Vulnerabilities in API Layer

## Theme Metadata
- **ID**: T-002
- **Name**: Harden Security Vulnerabilities in API Layer
- **Effort**: M
- **Risk**: MEDIUM
- **Coverage Gate**: REQUIRED
- **Blast Radius**: MODERATE
- **Warnings**: None

## Enriched Implementation Steps

### Step 1: Write characterization tests for profile update route (pre-refactor)
**Addresses**: F-001, F-002 (characterization for current behavior before fix)

Create `src/app/api/profile/update/route.test.ts` to capture the current behavior of the profile update endpoint. These tests document how the route currently uses `supabase.auth.admin.listUsers()` to check username uniqueness and accepts `displayName` without validation.

Tests to write:
- POST returns 401 when user is not authenticated
- POST returns 400 when `username` or `displayName` is missing
- POST returns 400 when username format is invalid (regex `^\w+$`, length 3-20)
- POST returns 200 on success when username is unchanged (does not call `listUsers`)
- POST calls `supabase.auth.admin.listUsers()` when username has changed (documents the bug from F-001)
- POST returns 409 when username is taken by another user
- POST calls `supabase.auth.updateUser()` with correct data on success

```bash
npx vitest run src/app/api/profile/update/route.test.ts
```

### Step 2: Replace admin `listUsers()` call with DB query against `userPreferences` table
**Addresses**: F-001 (P1)

**Current code** (lines 42-62 of `src/app/api/profile/update/route.ts`):
```typescript
const { data: users, error: listError } = await supabase.auth.admin.listUsers();
// ...scans all users for username match
```

**Replace with** a database query following the same pattern as `src/app/api/profile/check-username/route.ts` (lines 52-63):
```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { userPreferences } from '@/models/Schema';

// Check if username is already taken by another user
const existingProfile = await db
  .select()
  .from(userPreferences)
  .where(eq(userPreferences.username, username))
  .limit(1);

const existingUser = existingProfile[0];
if (existingUser && existingUser.userId !== user.id) {
  return conflictError('Username is already taken');
}
```

Remove the `supabase.auth.admin.listUsers()` call entirely. This eliminates the privilege escalation risk (anon-key client calling admin API) and the performance issue of scanning all users.

### Step 3: Add Zod schema validation for `displayName` in profile update
**Addresses**: F-002 (P1)

**Current code** (line 33 of `src/app/api/profile/update/route.ts`):
```typescript
if (!username || !displayName) {
  return invalidRequestError('Username and display name are required');
}
```

**Replace with** a Zod schema matching the project's validation patterns:
```typescript
import { z } from 'zod';

const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be at most 50 characters')
    .regex(/^[\w\s'-]+$/, 'Display name contains invalid characters'),
});
```

Replace the manual validation block with:
```typescript
const validation = profileUpdateSchema.safeParse(body);
if (!validation.success) {
  const errors = formatZodErrors(validation.error);
  return validationError(errors);
}
const { username, displayName } = validation.data;
```

Add `formatZodErrors` and `validationError` to the imports from `@/libs/api/errors`.

### Step 4: Switch `isAdmin()` from `user_metadata` to `app_metadata`
**Addresses**: F-004 (P2)

**File**: `src/libs/auth/isAdmin.ts`

**Current code** (line 23):
```typescript
if (user.user_metadata?.isAdmin === true) {
```

**Change to**:
```typescript
if (user.app_metadata?.isAdmin === true) {
```

Also update the JSDoc comment (lines 7-8) to reflect the change:
```typescript
 * Admin status can be granted via:
 * 1. app_metadata.isAdmin flag in Supabase (primary method)
```

**Documentation update**: Update `docs/admin-setup.md` to reflect the change from `user_metadata` to `app_metadata`:
- Section "How Admin Status Is Determined" (line 45): Change `user_metadata.isAdmin` to `app_metadata.isAdmin`
- Section "Option B: Supabase User Metadata" (lines 75-99): Update API and SQL examples to use `app_metadata`:
  ```typescript
  // API update
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { isAdmin: true },
  });
  ```
  ```sql
  -- SQL update
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"isAdmin": true}'::jsonb
  WHERE email = 'admin@example.com';
  ```
- Section "Revoking Admin Access" (lines 109-115): Update similarly
- Note: `app_metadata` is NOT editable by users via Supabase client APIs; only the service role key or SQL can modify it

### Step 5: Add `conversation_id` format validation to GET `/api/chat/messages`
**Addresses**: F-005 (P2)

**File**: `src/app/api/chat/messages/route.ts`

**Current code** (lines 31-36):
```typescript
const conversationId = searchParams.get('conversation_id');

if (!conversationId) {
  return invalidRequestError('conversation_id is required');
}
```

**Add** the same regex validation used in `src/app/api/chat/route.ts` (line 161):
```typescript
const conversationId = searchParams.get('conversation_id');

if (!conversationId) {
  return invalidRequestError('conversation_id is required');
}

const conversationIdPattern = /^[a-z0-9-]{1,128}$/i;
if (!conversationIdPattern.test(conversationId)) {
  return invalidRequestError('Conversation ID must be alphanumeric with hyphens, max 128 characters');
}
```

### Step 6: Add `isValidUuid()` check to admin feedback routes
**Addresses**: F-006 (P2)

**Files** (all three follow the same pattern):
- `src/app/api/admin/feedback/[id]/archive/route.ts`
- `src/app/api/admin/feedback/[id]/delete/route.ts`
- `src/app/api/admin/feedback/[id]/mark-reviewed/route.ts`

**Reference pattern** from `src/app/api/admin/users/[userId]/route.ts` (lines 12, 25-27):
```typescript
import { isValidUuid } from '@/utils/validation';

// Add after `const { id } = params;`
if (!isValidUuid(id)) {
  return invalidRequestError('Invalid feedback ID format');
}
```

For each file, add:
1. Import `invalidRequestError` to the errors import (archive route is missing it; delete and mark-reviewed also need it)
2. Import `isValidUuid` from `@/utils/validation`
3. Add the UUID check immediately after extracting `id` from `params`, before the DB query

### Step 7: Implement IP-based rate limiting for `/api/feedback`
**Addresses**: F-003 (P1)

**File**: `src/app/api/feedback/route.ts`

Implement a simple in-memory rate limiter (suitable for single-instance deployments; the template is a solo-dev SaaS starter):

Create a new utility `src/libs/api/rateLimit.ts`:
```typescript
/**
 * Simple in-memory IP-based rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance, replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  entry.count++
  return { allowed: true, retryAfterSeconds: 0 }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
```

In `src/app/api/feedback/route.ts`, add at the top of the `POST` handler (before auth check):
```typescript
import { checkRateLimit, getClientIp } from '@/libs/api/rateLimit';
import { rateLimitError } from '@/libs/api/errors';

// Rate limit: 5 submissions per hour per IP
const ip = getClientIp(request);
const { allowed, retryAfterSeconds } = checkRateLimit(
  `feedback:${ip}`,
  5,
  60 * 60 * 1000, // 1 hour
);

if (!allowed) {
  return rateLimitError(
    'Too many feedback submissions. Please try again later.',
    retryAfterSeconds,
  );
}
```

The `rateLimitError` helper already exists at `src/libs/api/errors/responses.ts` (line 142) and returns a 429 response with `Retry-After` header.

### Step 8: Filter message roles in Vercel AI chat route
**Addresses**: F-012 (P3)

**File**: `src/app/api/chat/vercel/route.ts`

**Current code** (lines 170-177):
```typescript
const messages = Array.isArray(body.messages) && body.messages.length > 0
  ? body.messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.parts
        ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
        : m.content ?? '',
    }))
  : [{ role: 'user' as const, content: message }];
```

**Replace with** (filter out `system` role and any unexpected roles):
```typescript
const ALLOWED_ROLES = new Set(['user', 'assistant']);

const messages = Array.isArray(body.messages) && body.messages.length > 0
  ? body.messages
      .filter((m: any) => ALLOWED_ROLES.has(m.role))
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
          : m.content ?? '',
      }))
  : [{ role: 'user' as const, content: message }];
```

This prevents users from injecting `system` prompts or other unexpected roles.

## Related Findings

### F-001: Profile update uses admin API (listUsers) via anon-key client
- **Severity**: P1
- **File**: `src/app/api/profile/update/route.ts`
- **Line**: 41
- **Description**: The `/api/profile/update` route calls `supabase.auth.admin.listUsers()` using the regular user-scoped Supabase client (created with the anon key). This call will likely fail at runtime or, if RLS is misconfigured, expose all user data to any authenticated user.
- **Suggestion**: Replace the admin `listUsers()` call with a database query against `userPreferences` table using the same pattern as `check-username/route.ts`.

### F-002: Missing input validation on displayName in profile update
- **Severity**: P1
- **File**: `src/app/api/profile/update/route.ts`
- **Line**: 64-69
- **Description**: The `displayName` field has zero validation beyond checking it is truthy -- no length limit, no type check, no character restrictions. A user could send an extremely long string or non-string value.
- **Suggestion**: Add Zod schema validation consistent with the other profile routes.

### F-003: No rate limiting on anonymous feedback endpoint
- **Severity**: P1
- **File**: `src/app/api/feedback/route.ts`
- **Line**: 54
- **Description**: The `/api/feedback` endpoint allows anonymous submissions with no rate limiting, CAPTCHA, or abuse prevention. An attacker could flood the database with unlimited feedback entries.
- **Suggestion**: Implement IP-based rate limiting (~5 submissions/hour) or CAPTCHA for anonymous submissions.

### F-004: Admin check relies on user-writable user_metadata
- **Severity**: P2
- **File**: `src/libs/auth/isAdmin.ts`
- **Line**: 22-24
- **Description**: The `isAdmin` function checks `user.user_metadata?.isAdmin === true`. In Supabase, `user_metadata` can be modified by users, enabling potential privilege escalation.
- **Suggestion**: Switch to `app_metadata` which is only settable via admin/service-role API calls.

### F-005: Missing validation on conversation_id in messages endpoint
- **Severity**: P2
- **File**: `src/app/api/chat/messages/route.ts`
- **Line**: 32-33
- **Description**: The GET `/api/chat/messages` endpoint passes `conversation_id` directly to Dify API without format validation, unlike the POST endpoint which validates with regex.
- **Suggestion**: Add the same conversation ID validation regex used in `/api/chat/route.ts`.

### F-006: Missing UUID validation on feedback ID parameter in admin routes
- **Severity**: P2
- **File**: `src/app/api/admin/feedback/[id]/archive/route.ts`
- **Line**: 34
- **Description**: Admin feedback routes accept `id` parameter without UUID format validation. The admin user routes properly validate with `isValidUuid()`.
- **Suggestion**: Add `isValidUuid(id)` check to archive, delete, and mark-reviewed feedback routes.

### F-012: User-supplied message roles passed to AI model without sanitization
- **Severity**: P3
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 225-232
- **Description**: Users could craft requests with `role: "system"` messages to potentially inject system prompts.
- **Suggestion**: Filter messages to only allow `user` and `assistant` roles before passing to AI model.

## Affected Files (Validated)

All files confirmed to exist in the repository:

- `src/app/api/profile/update/route.ts` -- F-001, F-002 (Steps 2, 3)
- `src/libs/auth/isAdmin.ts` -- F-004 (Step 4)
- `src/app/api/chat/messages/route.ts` -- F-005 (Step 5)
- `src/app/api/admin/feedback/[id]/archive/route.ts` -- F-006 (Step 6)
- `src/app/api/admin/feedback/[id]/delete/route.ts` -- F-006 (Step 6)
- `src/app/api/admin/feedback/[id]/mark-reviewed/route.ts` -- F-006 (Step 6)
- `src/app/api/feedback/route.ts` -- F-003 (Step 7)
- `src/app/api/chat/vercel/route.ts` -- F-012 (Step 8)

**Additional files to modify** (not in original list):
- `docs/admin-setup.md` -- Documentation update for `app_metadata` change (Step 4)

**New files to create**:
- `src/app/api/profile/update/route.test.ts` -- New test file (Step 1)
- `src/libs/api/rateLimit.ts` -- New rate limiter utility (Step 7)
- `src/libs/api/rateLimit.test.ts` -- Tests for rate limiter (tests_after)

## Test Requirements

### Tests Before (Characterization)

**Coverage gate is REQUIRED.** Characterization tests must be written and passing before any code changes begin.

#### 1. Profile update route: `src/app/api/profile/update/route.test.ts` (NEW FILE)

Mock setup (follow the pattern from `src/app/api/feedback/route.test.ts`):
- Mock `next/headers` (cookies)
- Mock `@/libs/supabase/server` (createClient)
- Mock `@/libs/DB` (db.select, db.insert -- for the post-refactor DB query)
- Mock `@/libs/Logger`

Test cases:
1. **Returns 401 when not authenticated** -- `supabase.auth.getUser` returns error
2. **Returns 400 when body is invalid JSON** -- non-JSON body
3. **Returns 400 when username or displayName is missing** -- empty body, missing fields
4. **Returns 400 when username format is invalid** -- special chars, too short, too long
5. **Returns 200 when username unchanged** -- user_metadata.username matches, no listUsers call
6. **Returns 409 when username taken** -- listUsers returns other user with same username
7. **Returns 200 on successful profile update** -- supabase.auth.updateUser succeeds
8. **Returns 500 when listUsers fails** -- listUsers returns error
9. **Returns 500 when updateUser fails** -- updateUser returns error

```bash
npx vitest run src/app/api/profile/update/route.test.ts
```

#### 2. Existing isAdmin tests: `src/libs/auth/isAdmin.test.ts` (EXISTING -- verify passing)

The existing test file has 14 tests covering `user_metadata` behavior. Verify all pass before the `app_metadata` refactor:

```bash
npx vitest run src/libs/auth/isAdmin.test.ts
```

#### 3. Existing feedback route tests: `src/app/api/feedback/route.test.ts` (EXISTING -- verify passing)

13 existing tests covering valid submissions, validation errors, and DB error handling. Verify all pass:

```bash
npx vitest run src/app/api/feedback/route.test.ts
```

#### 4. Existing admin feedback tests (EXISTING -- verify all passing)

- `src/app/api/admin/feedback/[id]/archive/__tests__/route.test.ts` (5 tests)
- `src/app/api/admin/feedback/[id]/delete/__tests__/route.test.ts` (5 tests)
- `src/app/api/admin/feedback/[id]/mark-reviewed/__tests__/route.test.ts` (5 tests)

```bash
npx vitest run src/app/api/admin/feedback/
```

#### Run all characterization tests:
```bash
npx vitest run src/app/api/profile/update/route.test.ts src/libs/auth/isAdmin.test.ts src/app/api/feedback/route.test.ts src/app/api/admin/feedback/
```

### Tests After (Verification)

#### 1. Update profile route tests: `src/app/api/profile/update/route.test.ts`

After refactoring, update/add these test cases:

**F-001 verification (admin listUsers removal):**
- **Test**: POST uses DB query (not `supabase.auth.admin.listUsers()`) to check username uniqueness
- **Assert**: `db.select().from(userPreferences)` is called with username filter
- **Assert**: `supabase.auth.admin.listUsers` is never called (mock should not be invoked)

**F-002 verification (displayName validation):**
- **Test**: POST returns 400 when displayName is empty string
- **Test**: POST returns 400 when displayName exceeds 50 characters (`'a'.repeat(51)`)
- **Test**: POST returns 400 when displayName contains invalid characters (`'<script>'`)
- **Test**: POST returns 400 when displayName is a number (`{ displayName: 12345 }`)
- **Test**: POST accepts valid displayName with spaces, hyphens, apostrophes (`"O'Brien-Smith"`)

#### 2. Update isAdmin tests: `src/libs/auth/isAdmin.test.ts`

**F-004 verification (app_metadata):**
- **Update existing test**: `returns true when user has user_metadata.isAdmin = true` -> change to `app_metadata.isAdmin = true`
- **Add new test**: `returns false when user_metadata.isAdmin is true but app_metadata is not` -- this is the KEY security test
  ```typescript
  it('returns false when only user_metadata.isAdmin is set (not app_metadata)', () => {
    const user = {
      id: 'user-123',
      email: 'user@example.com',
      user_metadata: { isAdmin: true },
      app_metadata: {},
    } as unknown as User;
    expect(isAdmin(user)).toBe(false);
  });
  ```
- **Add new test**: `returns true when app_metadata.isAdmin is true`
  ```typescript
  it('returns true when app_metadata.isAdmin is true', () => {
    const user = {
      id: 'user-123',
      email: 'user@example.com',
      user_metadata: {},
      app_metadata: { isAdmin: true },
    } as unknown as User;
    expect(isAdmin(user)).toBe(true);
  });
  ```
- **Update all** existing test cases that set `user_metadata: { isAdmin: true }` to use `app_metadata: { isAdmin: true }` instead

```bash
npx vitest run src/libs/auth/isAdmin.test.ts
```

#### 3. Chat messages route tests: `src/app/api/chat/messages/route.test.ts` (NEW FILE)

**F-005 verification:**
- **Test**: GET returns 400 when `conversation_id` contains SQL injection characters (`'; DROP TABLE --`)
- **Test**: GET returns 400 when `conversation_id` is longer than 128 characters
- **Test**: GET returns 400 when `conversation_id` contains special characters (`../../../etc/passwd`)
- **Test**: GET accepts valid alphanumeric-with-hyphens conversation_id
- **Test**: GET returns 400 when `conversation_id` is missing

```bash
npx vitest run src/app/api/chat/messages/route.test.ts
```

#### 4. Admin feedback UUID validation tests

Update existing test files to add UUID validation test cases:

**`src/app/api/admin/feedback/[id]/archive/__tests__/route.test.ts`:**
- **Add**: `returns 400 when id is not a valid UUID` -- pass `id: 'not-a-uuid'`

**`src/app/api/admin/feedback/[id]/delete/__tests__/route.test.ts`:**
- **Add**: `returns 400 when id is not a valid UUID` -- pass `id: 'not-a-uuid'`

**`src/app/api/admin/feedback/[id]/mark-reviewed/__tests__/route.test.ts`:**
- **Add**: `returns 400 when id is not a valid UUID` -- pass `id: 'not-a-uuid'`

```bash
npx vitest run src/app/api/admin/feedback/
```

#### 5. Rate limiter tests: `src/libs/api/rateLimit.test.ts` (NEW FILE)

**F-003 verification:**
- **Test**: `checkRateLimit` allows requests under the limit
- **Test**: `checkRateLimit` blocks requests at the limit, returns correct `retryAfterSeconds`
- **Test**: `checkRateLimit` resets after window expires
- **Test**: `getClientIp` extracts IP from `x-forwarded-for` header (first IP only)
- **Test**: `getClientIp` falls back to `x-real-ip`
- **Test**: `getClientIp` returns `'unknown'` when no IP headers present

```bash
npx vitest run src/libs/api/rateLimit.test.ts
```

#### 6. Feedback route rate limiting tests (add to existing `src/app/api/feedback/route.test.ts`)

- **Add**: `returns 429 when rate limit is exceeded` -- mock `checkRateLimit` to return `{ allowed: false, retryAfterSeconds: 3600 }`
- **Assert**: response status is 429
- **Assert**: response has `Retry-After` header

```bash
npx vitest run src/app/api/feedback/route.test.ts
```

#### 7. Vercel chat message role filtering: `src/app/api/chat/vercel/route.test.ts` (NEW FILE)

**F-012 verification:**
- **Test**: POST filters out messages with `role: "system"` from the messages array
- **Test**: POST allows messages with `role: "user"` and `role: "assistant"`
- **Test**: POST filters out messages with unexpected roles (e.g., `role: "tool"`, `role: "function"`)

Due to the complexity of mocking the full Vercel AI SDK streaming pipeline, consider extracting the role-filtering logic into a standalone utility (e.g., `src/libs/vercel-ai/sanitizeMessages.ts`) and testing that utility directly:
```typescript
export function sanitizeMessages(messages: Array<{ role: string; content: string }>) {
  const ALLOWED_ROLES = new Set(['user', 'assistant']);
  return messages.filter(m => ALLOWED_ROLES.has(m.role));
}
```

```bash
npx vitest run src/app/api/chat/vercel/route.test.ts
```

#### Run all verification tests:
```bash
npx vitest run src/app/api/profile/update/ src/libs/auth/isAdmin.test.ts src/app/api/chat/messages/ src/app/api/admin/feedback/ src/libs/api/rateLimit.test.ts src/app/api/feedback/ src/app/api/chat/vercel/
```

## Enrichment Notes
- **UI Changes**: false (all changes are API/server-side only; no frontend components affected)
- **Stale Files Removed**: None (all listed files validated and exist)
- **Gaps Found**: None (all finding suggestions are covered by the implementation steps)
