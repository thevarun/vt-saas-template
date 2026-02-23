# T-011 Enrichment: Write Critical Path Test Coverage

## Theme Metadata

| Field | Value |
|-------|-------|
| ID | T-011 |
| Name | Write Critical Path Test Coverage |
| Effort | L |
| Risk | LOW |
| Phase | 2 |
| Coverage Gate | REQUIRED |
| Blast Radius | CONTAINED |
| Dependencies | None |
| Finding IDs | F-051, F-052, F-053, F-054, F-055, F-093 |

---

## Validated File Inventory

All files confirmed to exist:

| File | Status | Notes |
|------|--------|-------|
| `src/proxy.ts` | EXISTS (126 lines) | Exports `proxy()` async function, not default middleware |
| `src/app/api/auth/callback/route.ts` | EXISTS (75 lines) | Exports `GET`, uses `createServerClient` directly |
| `src/app/api/profile/delete/route.ts` | EXISTS (92 lines) | Exports `DELETE`, uses `createAdminClient` |
| `src/app/api/chat/vercel/conversations/route.ts` | EXISTS (78 lines) | Exports `GET` only; `[id]/route.ts` has `GET`, `PATCH`, `DELETE` |
| `src/app/api/chat/vercel/conversations/[id]/route.ts` | EXISTS (249 lines) | All CRUD methods |
| `tests/integration/api/thread-persistence.test.ts` | EXISTS (463 lines) | 8 `setTimeout` calls at lines 159, 196, 223, 263, 287, 346, 412, 452 |
| `tests/integration/api/threads.test.ts` | EXISTS (437 lines) | Reference pattern file |
| `src/app/[locale]/(unauth)/(center)/sign-up/page.tsx` | EXISTS (317 lines) | `'use client'` component, self-contained |
| `src/app/[locale]/(unauth)/(center)/sign-in/SignInFormClient.tsx` | EXISTS (349 lines) | Sign-in was refactored into this client component |
| `src/app/[locale]/(unauth)/(center)/sign-in/page.tsx` | EXISTS (23 lines) | Thin server wrapper, renders `<SignInFormClient />` |

---

## Enriched Implementation Steps

### Step 1 — Create `src/proxy.test.ts` (F-052)

**What to mock:**
- `next-intl/middleware` — mock `createMiddleware` to return a `NextResponse.next()`
- `@/libs/supabase/middleware` — mock `createClient` and `updateSession`
- `@/libs/auth/isAdmin` — mock `isAdmin`

**Critical observations from source:**
- `proxy()` is the named export to import (not `default`)
- Protected paths: `/dashboard`, `/onboarding`, `/chat`, `/admin`
- Admin paths: `/admin`
- Verification whitelist: `/sign-in`, `/sign-up`, `/verify-email`, `/auth/`, `/forgot-password`, `/reset-password`
- Locale prefix is detected from first path segment via regex `^\/([^/]+)/`
- Unauthenticated API routes return `{ error: 'Unauthorized', code: 'AUTH_REQUIRED' }` with status 401 (not redirect)
- Unauthenticated non-API routes redirect to `{localePrefix}/sign-in?redirect={pathname}`
- Email-unverified users (no `email_confirmed_at`) redirect to `/verify-email?email={email}`
- Non-admin on `/admin` redirects to `{localePrefix}/dashboard?error=access_denied`
- Public routes (e.g., `/en`) pass through without auth check

**Test file location:** `src/proxy.test.ts` (co-located with source per project pattern)

**Test cases (minimum 7):**

```typescript
// @vitest-environment node
import { type NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { proxy } from './proxy';

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => () => NextResponse.next()),
}));
vi.mock('@/libs/supabase/middleware', () => ({
  createClient: vi.fn(),
  updateSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/libs/auth/isAdmin', () => ({ isAdmin: vi.fn() }));

// Helper: build a NextRequest
function makeRequest(pathname: string, origin = 'http://localhost:3000') {
  return new NextRequest(new URL(pathname, origin));
}
const fakeEvent = {} as NextFetchEvent;

describe('proxy middleware', () => {
  // TC-1: Public route passes through (no auth check)
  it('allows unauthenticated access to public routes');

  // TC-2: Protected page — unauthenticated user redirects to /sign-in with redirect param
  it('redirects unauthenticated user from /en/dashboard to /en/sign-in');

  // TC-3: Protected API route — returns JSON 401 (not redirect)
  it('returns 401 JSON for unauthenticated request to /api/protected');

  // TC-4: Email-unverified user redirects to /verify-email
  it('redirects unverified user from /en/dashboard to /en/verify-email');

  // TC-5: Admin route — non-admin user redirects to /dashboard?error=access_denied
  it('redirects non-admin user from /en/admin to /en/dashboard with error param');

  // TC-6: Admin route — admin user passes through
  it('allows admin user to access /en/admin');

  // TC-7: Locale-prefix detection works for Hindi locale (/hi)
  it('includes /hi locale prefix in sign-in redirect URL');
});
```

**Key mock shapes:**
```typescript
// Authenticated user (no admin, email verified):
{ data: { user: { id: 'uid', email: 'u@test.com', email_confirmed_at: '2024-01-01', user_metadata: {} } } }

// Authenticated user, email NOT verified:
{ data: { user: { id: 'uid', email: 'u@test.com', email_confirmed_at: null, user_metadata: {} } } }

// Unauthenticated:
{ data: { user: null } }
```

---

### Step 2 — Create `src/app/api/auth/callback/route.test.ts` (F-051)

**What to mock:**
- `@supabase/ssr` — mock `createServerClient` to return mock Supabase client
- `next/headers` — mock `cookies()` as in existing tests
- `@/libs/email` — mock `sendWelcomeEmail`

**Critical observations from source:**
- Route only handles `GET`; `code` comes from `?code=` query param
- On success: calls `exchangeCodeForSession(code)`, then `getUser()`
- New-user detection: `Date.now() - createdAt.getTime() < 5 * 60 * 1000` (5 minutes)
- Welcome email is fire-and-forget (`.catch()` pattern) — should not block response
- On success: redirects to `next` param if it starts with `/`, else `/`
- On failure (no code, or exchange error): redirects to `/{locale}/auth-code-error`
- Locale for error redirect is extracted from `next` param via regex `^\/([^/]+)\/`
- Open redirect prevention: `next` param must start with `/`

**Test file location:** `src/app/api/auth/callback/route.test.ts`

**Test cases (minimum 5):**

```typescript
// TC-1: Valid code + existing user → session created, redirect to `next` param
it('exchanges code for session and redirects to next param for existing user');

// TC-2: Valid code + new user (created <5 min ago) → sendWelcomeEmail called
it('sends welcome email for new user signup via OAuth');

// TC-3: Valid code + existing user (created >5 min ago) → sendWelcomeEmail NOT called
it('does not send welcome email for existing user re-auth');

// TC-4: No code in request → redirects to /en/auth-code-error (default locale)
it('redirects to auth-code-error page when code is absent');

// TC-5: exchangeCodeForSession returns error → redirects to auth-code-error
it('redirects to auth-code-error when code exchange fails');

// TC-6 (bonus): `next` param without leading slash → redirects to '/' (XSS guard)
it('sanitizes next param that lacks leading slash to prevent open redirect');
```

**Key mock shape:**
```typescript
const mockSupabase = {
  auth: {
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'new@example.com',
          created_at: new Date().toISOString(), // within 5 min = new user
          user_metadata: { name: 'Test User' },
        },
      },
    }),
  },
};
```

---

### Step 3 — Create `src/app/api/profile/delete/route.test.ts` (F-053)

**What to mock:**
- `@/libs/supabase/server` — mock `createClient`
- `@/libs/supabase/admin` — mock `createAdminClient`
- `next/headers` — mock `cookies()`
- `@sentry/nextjs` — mock `addBreadcrumb`, `captureException`
- `@/libs/Logger` — mock `logger`
- `@/libs/api/errors` — optionally passthrough or mock return values

**Critical observations from source:**
- Only `DELETE` method exported
- Two-client pattern: regular `createClient` for auth check, `createAdminClient` for deletion
- If `createAdminClient()` throws (no service role key), returns 503 `serviceUnavailableError`
- If `adminClient.auth.admin.deleteUser` returns an error, returns 500
- Success returns `{ message: 'Account deleted successfully' }` with status 200

**Test file location:** `src/app/api/profile/delete/route.test.ts`

**Test cases (minimum 4):**

```typescript
// TC-1: Unauthenticated request → 401
it('returns 401 when user is not authenticated');

// TC-2: Admin client unavailable (no service role key) → 503
it('returns 503 when SUPABASE_SERVICE_ROLE_KEY is not configured');

// TC-3: deleteUser fails → 500
it('returns 500 when Supabase admin deleteUser returns an error');

// TC-4: Happy path → 200 with success message
it('returns 200 and deletes user on valid authenticated request');
```

**Key mock shapes:**
```typescript
// TC-2 — createAdminClient throws:
vi.mocked(createAdminClient).mockImplementation(() => {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
});

// TC-3 — deleteUser fails:
const mockAdminClient = {
  auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: new Error('DB error') }) } },
};
vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);

// TC-4 — happy path:
const mockAdminClient = {
  auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } },
};
```

---

### Step 4 — Create `tests/integration/api/vercel-conversations.test.ts` (F-055)

**Scope:** Both `conversations/route.ts` (GET list) and `conversations/[id]/route.ts` (GET one, PATCH, DELETE).

**What to mock:**
- `@/libs/supabase/server` — mock `createClient`
- `@/libs/queries/vercelConversations` — mock all query functions
- `@/libs/queries/vercelMessages` — mock `getConversationMessages`
- `next/headers` — mock `cookies()`
- `@/libs/Logger` — mock `logger`
- `@sentry/nextjs` — mock Sentry

**Follow the exact pattern from `tests/integration/api/threads.test.ts`:**
- `vi.mock(...)` blocks at file top
- `beforeEach` resets mocks and sets up auth
- Named imports of handlers called directly (no HTTP)
- Params passed as `Promise.resolve({ id: '...' })`

**Test file location:** `tests/integration/api/vercel-conversations.test.ts`

**Test cases (minimum 8):**

```typescript
// --- GET /api/chat/vercel/conversations ---
// TC-1: 401 when unauthenticated
it('GET list returns 401 when no user session');

// TC-2: Returns conversations array with total count
it('GET list returns conversations for authenticated user');

// TC-3: Applies limit/offset from query params (max 100)
it('GET list caps limit at 100 and applies offset');

// TC-4: DB error → appropriate error response
it('GET list returns db error response on query failure');

// --- GET /api/chat/vercel/conversations/[id] ---
// TC-5: 401 when unauthenticated
it('GET by id returns 401 when no user session');

// TC-6: Returns conversation + messages array
it('GET by id returns conversation with messages');

// TC-7: 404 when conversation not found or not owned by user
it('GET by id returns 404 when conversation does not exist or belongs to another user');

// --- PATCH /api/chat/vercel/conversations/[id] ---
// TC-8: 401 when unauthenticated
it('PATCH returns 401 when no user session');

// TC-9: Validates request body (rejects non-boolean archived)
it('PATCH returns 400 for invalid body');

// TC-10: Updates title and returns updated conversation
it('PATCH updates conversation title for owner');

// TC-11: 404 when conversation not found or not owned by user
it('PATCH returns 404 when conversation does not exist');

// --- DELETE /api/chat/vercel/conversations/[id] ---
// TC-12: 401 when unauthenticated
it('DELETE returns 401 when no user session');

// TC-13: 204 on successful deletion
it('DELETE returns 204 on successful deletion');

// TC-14: 404 when conversation not found
it('DELETE returns 404 when conversation does not exist');
```

**Import pattern:**
```typescript
import { GET as GET_LIST } from '@/app/api/chat/vercel/conversations/route';
import {
  DELETE,
  GET,
  PATCH,
} from '@/app/api/chat/vercel/conversations/[id]/route';
import * as vercelConversationsModule from '@/libs/queries/vercelConversations';
import * as vercelMessagesModule from '@/libs/queries/vercelMessages';
```

---

### Step 5 — Replace `setTimeout` waits in `thread-persistence.test.ts` (F-054)

**All 8 locations of `setTimeout` (confirmed line numbers):**

| Line | Wait (ms) | Context |
|------|-----------|---------|
| 159 | 500 | After consuming stream, wait for thread creation |
| 196 | 100 | Wait to ensure timestamp difference between creates |
| 223 | 500 | Wait for async thread update after follow-up message |
| 263 | 500 | Wait for thread creation in first call |
| 287 | 500 | Wait for thread update in second call |
| 346 | 1000 | Wait for all async thread operations in race test |
| 412 | 500 | Wait for async operations after missing conv_id |
| 452 | 500 | Wait for async thread creation attempt after DB failure |

**Replacement pattern:** Use `vi.waitFor()` with polling. This is deterministic and respects the mock state.

```typescript
// BEFORE (flaky):
await new Promise(resolve => setTimeout(resolve, 500));
expect(threadsModule.createThread).toHaveBeenCalled();

// AFTER (reliable):
await vi.waitFor(() => {
  expect(threadsModule.createThread).toHaveBeenCalled();
}, { timeout: 2000, interval: 50 });
```

**Special case — line 196 (timestamp difference):** The `setTimeout(100)` is used to ensure `updated_at` timestamps differ. Replace with `vi.useFakeTimers()` approach instead:
```typescript
// At start of test or beforeEach:
vi.useFakeTimers();

// Advance time in test:
vi.advanceTimersByTime(100);

// Restore in afterEach:
vi.useRealTimers();
```

**Note:** `vi.waitFor()` is available in Vitest without any imports — it is a global when `globals: true` is set in `vitest.config.mts` (confirmed in project config).

---

### Step 6 — Add `aria-describedby` to form error messages (F-093)

**Scope:** Two files need the same fix:
1. `src/app/[locale]/(unauth)/(center)/sign-up/page.tsx`
2. `src/app/[locale]/(unauth)/(center)/sign-in/SignInFormClient.tsx`

**Current state (both files):**
- Inputs have `aria-invalid={!!errors.field}` — correct
- Error `<p>` tags have no `id` — missing
- Inputs have no `aria-describedby` — missing

**Required fix pattern (apply to both files, both email and password fields):**

```tsx
// Email field — current:
<input
  id="email"
  aria-invalid={!!errors.email}
  {...register('email')}
/>
{errors.email && (
  <p className="text-sm text-red-600">{errors.email.message}</p>
)}

// Email field — fixed:
<input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  {...register('email')}
/>
{errors.email && (
  <p id="email-error" className="text-sm text-red-600">{errors.email.message}</p>
)}

// Password field — fixed:
<input/PasswordInput
  id="password"
  aria-invalid={!!errors.password}
  aria-describedby={errors.password ? 'password-error' : undefined}
  {...register('password')}
/>
{errors.password && (
  <p id="password-error" className="text-sm text-red-600">{errors.password.message}</p>
)}
```

**Note on `PasswordInput`:** This is a custom component wrapping an `<input>`. Verify it forwards `aria-describedby` via `...props` spread. If not, add it to the component's prop forwarding.

**Accessibility test to write** (prevents regression):

Create `src/app/[locale]/(unauth)/(center)/sign-up/page.test.tsx` with:
```typescript
// @vitest-environment jsdom
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// TC-A1: Email error paragraph has id="email-error"
it('email error message has id attribute for aria linking');

// TC-A2: Password error paragraph has id="password-error"
it('password error message has id attribute for aria linking');

// TC-A3: Email input aria-describedby points to error id when invalid
it('email input has aria-describedby when validation error is shown');

// TC-A4: Email input aria-describedby is absent when no error
it('email input has no aria-describedby when no validation error');
```

**Note on testing client components:** The sign-up page uses `useParams`, `useTranslations`, and Supabase. These all need mocking. Use the same mock setup as other `jsdom`-environment tests in the project.

---

## Related Findings Summary

| ID | Severity | File | Root Cause |
|----|----------|------|------------|
| F-051 | P1 | `src/app/api/auth/callback/route.ts` | Zero test coverage on OAuth/email verification callback |
| F-052 | P1 | `src/proxy.ts` | Zero test coverage on central auth/routing middleware |
| F-053 | P1 | `src/app/api/profile/delete/route.ts` | Zero test coverage on irreversible destructive operation |
| F-054 | P2 | `tests/integration/api/thread-persistence.test.ts` | 8x `setTimeout` creates flaky CI |
| F-055 | P2 | `src/app/api/chat/vercel/conversations/route.ts` | Zero test coverage on Vercel conversation CRUD |
| F-093 | P1 | `sign-up/page.tsx`, `sign-in/SignInFormClient.tsx` | `aria-describedby` missing; no regression test |

---

## Affected Files (Validated)

### Files to CREATE (new test files)

| Test File | Target Source |
|-----------|---------------|
| `src/proxy.test.ts` | `src/proxy.ts` |
| `src/app/api/auth/callback/route.test.ts` | `src/app/api/auth/callback/route.ts` |
| `src/app/api/profile/delete/route.test.ts` | `src/app/api/profile/delete/route.ts` |
| `tests/integration/api/vercel-conversations.test.ts` | `src/app/api/chat/vercel/conversations/route.ts` + `[id]/route.ts` |
| `src/app/[locale]/(unauth)/(center)/sign-up/page.test.tsx` | `sign-up/page.tsx` (accessibility regression) |

### Files to MODIFY

| File | Change |
|------|--------|
| `tests/integration/api/thread-persistence.test.ts` | Replace 8x `setTimeout` with `vi.waitFor()` |
| `src/app/[locale]/(unauth)/(center)/sign-up/page.tsx` | Add `id` on error `<p>`, `aria-describedby` on inputs |
| `src/app/[locale]/(unauth)/(center)/sign-in/SignInFormClient.tsx` | Add `id` on error `<p>`, `aria-describedby` on inputs |

---

## Test Requirements

### Success Criteria

| Deliverable | Minimum Cases | Notes |
|-------------|--------------|-------|
| `proxy.test.ts` | 7 | All 5 security behaviors + locale + pass-through |
| `callback/route.test.ts` | 5 | Code exchange, new vs existing user, no-code, exchange error, open redirect guard |
| `profile/delete/route.test.ts` | 4 | 401, 503, 500, 200 |
| `vercel-conversations.test.ts` | 8 (target 14) | Full CRUD across both route files |
| `sign-up/page.test.tsx` | 4 | aria-describedby regression guard |
| `thread-persistence.test.ts` | 0 new (8 replacements) | All `setTimeout` replaced with `vi.waitFor()` |

### Test Environment Directives

- `proxy.test.ts` — needs `// @vitest-environment node` directive (uses `NextRequest`)
- `callback/route.test.ts` — needs `// @vitest-environment node` (server module)
- `profile/delete/route.test.ts` — needs `// @vitest-environment node`
- `vercel-conversations.test.ts` — needs `// @vitest-environment node` (follows `threads.test.ts` pattern)
- `sign-up/page.test.tsx` — default `jsdom` environment (component test)

### Standard Mock Boilerplate (node environment tests)

These mocks are needed in every node-environment API route test based on existing patterns:

```typescript
vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn() }),
}));
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));
```

---

## Enrichment Notes

### Architecture Observations

1. **`proxy.ts` exports a named function**, not a default export and not the `middleware` Next.js entry point. The `middleware.ts` file imports `proxy` from `proxy.ts`. Tests should import `{ proxy }` from `./proxy` directly.

2. **`auth/callback/route.ts` creates its own Supabase client** via `createServerClient` from `@supabase/ssr` directly — it does NOT use the project's `@/libs/supabase/server` wrapper. Tests must mock `@supabase/ssr` specifically.

3. **`conversations/route.ts` only has `GET`** (list endpoint). The `GET/PATCH/DELETE` for a specific conversation are in `conversations/[id]/route.ts`. The test file should cover both.

4. **`listUserConversations` query uses Drizzle ORM** directly (not Supabase client). The `_supabase` parameter is unused in the query functions. However, the route passes `supabase` for potential future RLS use. Mock at the module level: `vi.mock('@/libs/queries/vercelConversations')`.

5. **Sign-in page was refactored**: The audit finding references `sign-in/page.tsx` but the actual form code is in `sign-in/SignInFormClient.tsx`. Both files need to be checked: `page.tsx` is a thin server wrapper that renders `<SignInFormClient />`. The accessibility fix and regression test should target `SignInFormClient.tsx`.

6. **`PasswordInput` component**: Must verify it forwards arbitrary props (`aria-describedby`, `aria-invalid`). Check `src/components/ui/password-input.tsx` before applying the fix.

### Vitest Configuration Context

- `vitest.config.mts` sets `globals: true` — `vi`, `describe`, `it`, `expect` are globally available
- Default environment is `jsdom` — node-environment tests need the `// @vitest-environment node` directive comment
- Test files can live in `src/` (co-located) or `tests/` (integration tests)
- Path aliases (`@/`) work via `vite-tsconfig-paths` plugin

### Risk Notes

- All changes are test-only (plus a minor UI attribute change for F-093) — no production logic is modified
- The `setTimeout` replacement in `thread-persistence.test.ts` is the only change with any meaningful risk (test behavior change). Verify tests still pass after each replacement before moving to the next.
- The `aria-describedby` fix is a minor HTML attribute addition. It cannot break functionality but should be verified visually.
