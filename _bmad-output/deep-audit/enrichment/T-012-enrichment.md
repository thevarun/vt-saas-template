# Implementation Brief: T-012 — Consolidate Environment Config and Fix Middleware Performance

## Theme Metadata
- **ID**: T-012
- **Name**: Consolidate Environment Config and Fix Middleware Performance
- **Effort**: S
- **Risk**: MEDIUM
- **Coverage Gate**: REQUIRED
- **Blast Radius**: MODERATE
- **Warnings**: None

---

## Pre-Work Discovery

### Critical Correction: Env.ts Location

The theme plan references `src/utils/Env.ts` but this file does **not exist**. The validated env module is at:

```
src/libs/Env.ts
```

It uses `@t3-oss/env-nextjs` with `createEnv()`. All step references to `src/utils/Env.ts` must be redirected to `src/libs/Env.ts`.

### Critical Correction: Keys Already Present in Env.ts

Inspecting `src/libs/Env.ts` (66 lines, read in full) reveals that the following keys cited in the theme summary are **already declared**:

| Key | Status in Env.ts |
|-----|-----------------|
| `OPENAI_API_KEY` | PRESENT (line 13) |
| `ANTHROPIC_API_KEY` | PRESENT (line 14) |
| `AI_PROVIDER` | PRESENT (line 15, with `.enum(['openai','anthropic']).default('openai')`) |
| `DEFAULT_AI_MODEL` | PRESENT (line 16, with `.string().default('gpt-4o-mini')`) |
| `LANGFUSE_PUBLIC_KEY` | PRESENT (line 23) |
| `LANGFUSE_SECRET_KEY` | PRESENT (line 24) |
| `LANGFUSE_HOST` | PRESENT (line 25, with `.url().default(...)`) |
| `MEM0_API_KEY` | PRESENT (line 28) |
| `ENABLE_MEM0` | PRESENT (line 27) |
| `CRON_SECRET` | PRESENT (line 30) |

Step 2 ("Add missing environment variable keys to Env.ts") from the original plan is a **no-op**. The real work is Step 3: routing the callers through `Env`.

### Critical Correction: proxy.test.ts Already Exists

`src/proxy.test.ts` was created by T-011. It has **8 test cases** covering locale extraction and auth behavior:

1. Public route passes through
2. Unauthenticated `/en/dashboard` redirects to `/en/sign-in`
3. Unauthenticated `/api/chat` returns JSON 401
4. Unverified user redirects to `/en/verify-email`
5. Non-admin on `/en/admin` redirects to `/en/dashboard?error=access_denied`
6. Admin user passes through `/en/admin`
7. `/hi` locale prefix preserved in redirect URL
8. Verified authenticated user passes through

**Do not add tests to `proxy.test.ts` for behaviors already covered.** The coverage gate for T-012's middleware refactor can be satisfied by the existing test suite, provided the refactored `proxy.ts` continues to pass all 8 cases without change.

---

## Enriched Implementation Steps

### Step 1 — Run baseline tests to confirm green start [coverage gate]

```bash
npm test -- src/proxy.test.ts
npm test -- src/utils/chatConfig.test.ts
```

Both test files must pass before any changes. This is the characterization baseline.

### Step 2 — Redirect process.env access in `src/libs/vercel-ai/config.ts` through Env [F-029]

**File:** `src/libs/vercel-ai/config.ts` (lines 51–54)

**Current code:**
```typescript
export const VERCEL_AI_CONFIG: VercelAIConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  provider: (process.env.AI_PROVIDER as AIProvider) || 'openai',
  model: process.env.DEFAULT_AI_MODEL || 'gpt-4o-mini',
  timeout: 30000,
};
```

**Target code:**
```typescript
import { Env } from '@/libs/Env';

export const VERCEL_AI_CONFIG: VercelAIConfig = {
  openaiApiKey: Env.OPENAI_API_KEY,
  anthropicApiKey: Env.ANTHROPIC_API_KEY,
  provider: Env.AI_PROVIDER as AIProvider,   // Env.ts already defaults to 'openai'
  model: Env.DEFAULT_AI_MODEL,               // Env.ts already defaults to 'gpt-4o-mini'
  timeout: 30000,
};
```

**Notes:**
- Remove the `|| 'openai'` and `|| 'gpt-4o-mini'` fallbacks. `createEnv` applies the `.default()` so `Env.AI_PROVIDER` and `Env.DEFAULT_AI_MODEL` are never undefined.
- The `as AIProvider` cast remains because `Env.AI_PROVIDER` is typed as `'openai' | 'anthropic'` already, but TypeScript's structural inference may still require the cast — verify after editing.

### Step 3 — Redirect process.env access in `src/utils/chatConfig.ts` through Env [F-029]

**File:** `src/utils/chatConfig.ts` (lines 33–41)

**Current code:**
```typescript
export function getChatConfig(): ChatConfig {
  return {
    dify: {
      configured: Boolean(process.env.DIFY_API_URL && process.env.DIFY_API_KEY),
      url: process.env.DIFY_API_URL,
    },
    vercel: {
      configured: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
      provider: process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : undefined,
    },
  };
}
```

**Target code:**
```typescript
import { Env } from '@/libs/Env';

export function getChatConfig(): ChatConfig {
  return {
    dify: {
      configured: Boolean(Env.DIFY_API_URL && Env.DIFY_API_KEY),
      url: Env.DIFY_API_URL,
    },
    vercel: {
      configured: Boolean(Env.OPENAI_API_KEY || Env.ANTHROPIC_API_KEY),
      provider: Env.OPENAI_API_KEY ? 'openai' : Env.ANTHROPIC_API_KEY ? 'anthropic' : undefined,
    },
  };
}
```

**Warning — test impact:** `src/utils/chatConfig.test.ts` currently sets `process.env.DIFY_API_URL = 'test'` directly. After this change, `Env` is a module-level constant initialized at import time. The tests **will break** because mutating `process.env` after module load has no effect on a `createEnv()` result.

**Fix for chatConfig.test.ts:** Mock `@/libs/Env` at the module level using `vi.mock`:

```typescript
// At the top of chatConfig.test.ts, replace process.env mutations with:
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getChatConfig } from './chatConfig';

const mockEnv = {
  DIFY_API_URL: undefined as string | undefined,
  DIFY_API_KEY: undefined as string | undefined,
  OPENAI_API_KEY: undefined as string | undefined,
  ANTHROPIC_API_KEY: undefined as string | undefined,
};

vi.mock('@/libs/Env', () => ({ Env: mockEnv }));

describe('chatConfig', () => {
  beforeEach(() => {
    mockEnv.DIFY_API_URL = undefined;
    mockEnv.DIFY_API_KEY = undefined;
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
  });

  // Then set mockEnv.X = 'value' instead of process.env.X = 'value'
  // All test assertions remain identical
});
```

This is the correct pattern for testing code that reads from a module-level `Env` singleton.

### Step 4 — Redirect process.env access in `src/libs/langfuse/config.ts` through Env [F-029]

**File:** `src/libs/langfuse/config.ts` (lines 9–13)

**Current code:**
```typescript
export const LANGFUSE_CONFIG: LangfuseConfig = {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  host: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
};
```

**Target code:**
```typescript
import { Env } from '@/libs/Env';

export const LANGFUSE_CONFIG: LangfuseConfig = {
  publicKey: Env.LANGFUSE_PUBLIC_KEY,
  secretKey: Env.LANGFUSE_SECRET_KEY,
  host: Env.LANGFUSE_HOST,   // Env.ts already defaults to 'https://cloud.langfuse.com'
};
```

Remove the `|| 'https://cloud.langfuse.com'` fallback — `Env.LANGFUSE_HOST` has the same default via Zod schema.

### Step 5 — Redirect process.env access in `src/libs/mem0/config.ts` through Env [F-029]

**File:** `src/libs/mem0/config.ts` (lines 8–11)

**Current code:**
```typescript
export const MEM0_CONFIG: Mem0Config = {
  enabled: process.env.ENABLE_MEM0 === 'true',
  apiKey: process.env.MEM0_API_KEY,
};
```

**Target code:**
```typescript
import { Env } from '@/libs/Env';

export const MEM0_CONFIG: Mem0Config = {
  enabled: Env.ENABLE_MEM0 === 'true',
  apiKey: Env.MEM0_API_KEY,
};
```

Note: `Env.ENABLE_MEM0` is typed as `'true' | 'false'` (enum) with default `'false'`. The `=== 'true'` comparison is still correct.

### Step 6 — Redirect process.env access in Supabase clients through Env [F-029]

**File 1:** `src/libs/supabase/middleware.ts` (lines 6–7)

**Current code:**
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
```

**Target code:**
```typescript
import { Env } from '@/libs/Env';

// In createClient():
Env.NEXT_PUBLIC_SUPABASE_URL,
Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
```

**File 2:** `src/libs/supabase/server.ts` (lines 6–7)

**Same change** — replace:
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
```

With:
```typescript
import { Env } from '@/libs/Env';
// ...
Env.NEXT_PUBLIC_SUPABASE_URL,
Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
```

**Notes:**
- Remove the `!` non-null assertions. `Env.NEXT_PUBLIC_SUPABASE_URL` is declared as `z.string().min(1)` (not optional) so TypeScript knows it is a non-nullable string.
- `Env` is importable from both server-side modules. The `client:` section of `createEnv` includes these keys.

**Important:** `middleware.ts` runs in Next.js Edge Runtime. `@t3-oss/env-nextjs`'s `createEnv` is Edge-compatible. Verify by running `npm run build` after this change — Edge runtime will throw at build time if the module is not compatible.

### Step 7 — Extract getLocalePrefix() helper in proxy.ts [F-030]

**File:** `src/proxy.ts`

The locale extraction regex and validation logic is duplicated at lines 80–83, 93–96, and 106–109. Extract to a helper:

**Add above `export async function proxy`:**
```typescript
/**
 * Extracts the locale prefix from a pathname, if present.
 * Returns e.g. '/en', '/hi', '/bn', or '' for paths without a locale segment.
 */
function getLocalePrefix(pathname: string): string {
  const segment = pathname.match(/^\/([^/]+)/)?.at(1) ?? '';
  return AllLocales.includes(segment as any) ? `/${segment}` : '';
}
```

**Replace all three duplicated blocks inside `proxy()`:**

```typescript
// BEFORE (appears 3 times with different variable names):
const locale = request.nextUrl.pathname.match(/^\/([^/]+)/)?.at(1) ?? '';
const isLocale = AllLocales.includes(locale as any);
const localePrefix = isLocale ? `/${locale}` : '';

// AFTER (call the helper):
const localePrefix = getLocalePrefix(request.nextUrl.pathname);
```

The three call sites are:
1. Sign-in redirect (unauthenticated user, line ~80)
2. Verify-email redirect (unverified user, line ~93)
3. Dashboard redirect (non-admin, line ~106)

### Step 8 — Replace pathname.includes() with precise path matching [F-030]

**File:** `src/proxy.ts`

**Current fragile helpers:**
```typescript
function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some(path => pathname.includes(path));
}

function requiresVerification(pathname: string): boolean {
  return !verificationWhitelist.some(path => pathname.includes(path));
}

function isAdminRoute(pathname: string): boolean {
  return adminPaths.some(path => pathname.includes(path));
}
```

**Problem:** `pathname.includes('/chat')` matches `/en/chat-history-backup` (hypothetical). Use segment-aware matching instead:

```typescript
/**
 * Returns true if pathname contains the path as a distinct segment
 * (after optional locale prefix). E.g., '/en/dashboard' matches '/dashboard'.
 */
function containsSegment(pathname: string, segment: string): boolean {
  // Strip locale prefix if present, then check with startsWith
  const localePrefix = getLocalePrefix(pathname);
  const stripped = localePrefix ? pathname.slice(localePrefix.length) : pathname;
  return stripped === segment || stripped.startsWith(`${segment}/`);
}

function isProtectedRoute(pathname: string): boolean {
  return protectedPaths.some(path => containsSegment(pathname, path));
}

function requiresVerification(pathname: string): boolean {
  return !verificationWhitelist.some(path => containsSegment(pathname, path));
}

function isAdminRoute(pathname: string): boolean {
  return adminPaths.some(path => containsSegment(pathname, path));
}
```

**Existing test coverage:** The 8 existing test cases in `src/proxy.test.ts` must still pass after this change with zero modifications. If any test fails, the matching logic is wrong.

**Add 2 new tests to `src/proxy.test.ts`** to verify precise matching (these behaviors are not tested yet):

```typescript
it('does not treat /en/chat-like-path as protected (false positive guard)', async () => {
  // No auth check should be triggered for a path that merely contains 'chat'
  // but is not a protected path segment
  const request = makeRequest('/en/chat-like-path');
  const response = await proxy(request, fakeEvent);
  expect(mockGetUser).not.toHaveBeenCalled();
});

it('treats /hi/dashboard as a protected route (locale-prefixed)', async () => {
  mockGetUser.mockResolvedValue({ data: { user: null } });
  const request = makeRequest('/hi/dashboard');
  const response = await proxy(request, fakeEvent);
  expect(mockGetUser).toHaveBeenCalled();
});
```

Note: the second test may already be implicitly covered by the existing `/hi/dashboard` redirect test in T-011 — check before adding.

### Step 9 — Refactor updateSession to return user; eliminate duplicate getUser() call [F-019]

**File 1:** `src/libs/supabase/middleware.ts`

**Current `updateSession`:**
```typescript
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createClient(request, response);
  await supabase.auth.getUser();   // First call — result discarded
  return response;
}
```

**Target `updateSession`:** Return the Supabase client so the caller can reuse it, eliminating the second `getUser()` call:

```typescript
import type { User } from '@supabase/supabase-js';

export type UpdateSessionResult = {
  response: NextResponse;
  user: User | null;
};

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<UpdateSessionResult> {
  const supabase = createClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  return { response, user };
}
```

**File 2:** `src/proxy.ts`

Update to consume the returned `user`:

```typescript
export async function proxy(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  const response = intlMiddleware(request);

  // Single getUser() call — session update and auth check combined
  const { user } = await updateSession(request, response);

  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!user) {
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 },
        );
      }
      const localePrefix = getLocalePrefix(request.nextUrl.pathname);
      const signInUrl = new URL(`${localePrefix}/sign-in`, request.url);
      signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (user && !user.email_confirmed_at && requiresVerification(request.nextUrl.pathname)) {
      const localePrefix = getLocalePrefix(request.nextUrl.pathname);
      const verifyUrl = new URL(`${localePrefix}/verify-email`, request.url);
      verifyUrl.searchParams.set('email', user.email || '');
      return NextResponse.redirect(verifyUrl);
    }

    if (user && isAdminRoute(request.nextUrl.pathname)) {
      if (!isAdmin(user)) {
        const localePrefix = getLocalePrefix(request.nextUrl.pathname);
        const dashboardUrl = new URL(
          `${localePrefix}/dashboard?error=access_denied`,
          request.url,
        );
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return response;
}
```

**Remove** the `createClient` import from `@/libs/supabase/middleware` in `proxy.ts` — it is no longer needed directly.

**Update proxy.test.ts mocks:** The existing mock for `updateSession` returns `undefined`. After this change it must return `{ response, user }`. Update the mock setup:

```typescript
// In proxy.test.ts — update the hoisted mock:
const mockUpdateSession = vi.fn().mockResolvedValue({ user: null, response: NextResponse.next() });

// In individual test cases, instead of:
mockGetUser.mockResolvedValue({ data: { user: verifiedUser } });

// The update is:
mockUpdateSession.mockResolvedValue({ user: verifiedUser, response: NextResponse.next() });
```

**Critical:** After this refactor, `mockGetUser` and `mockCreateClient` become **unused** in `proxy.test.ts`. Remove them and remove the mock for `@/libs/supabase/middleware.createClient`. The test becomes simpler and more direct.

### Step 10 — Handle F-024 (threads.ts schema config) — config aspect only [F-024]

F-024 is primarily addressed by T-009 (Drizzle migration of threads.ts). The config aspect scoped to T-012 is limited:

**Do not** migrate `threads.ts` to Drizzle ORM here — that is T-009's work.

**Do** extract the hardcoded schema string to a named constant that can later be easily updated when T-009 runs:

**File:** `src/libs/supabase/threads.ts` (line 30)

```typescript
// BEFORE:
const THREADS_SCHEMA = 'health_companion';

// AFTER — use the correct schema name that matches Drizzle config:
const THREADS_SCHEMA = 'vt_saas';
```

This is a one-line change. The impact is limited to correcting the schema string so queries hit the right schema in Supabase. Verify by:
1. Checking that the `vt_saas` schema exists in Supabase (it does — Drizzle uses it per F-024 description)
2. Running the threads-related API tests after the change

---

## Related Findings

### F-029: Environment variable access bypasses validated Env.ts in multiple config modules
- **Severity**: P2
- **Confidence**: 90
- **File**: `src/libs/vercel-ai/config.ts`
- **Line**: 51–54
- **Description**: Several config modules access `process.env` directly instead of through the validated `src/libs/Env.ts`. Affected files: `src/libs/vercel-ai/config.ts`, `src/utils/chatConfig.ts`, `src/libs/langfuse/config.ts`, `src/libs/mem0/config.ts`, `src/libs/supabase/server.ts`, `src/libs/supabase/middleware.ts`.
- **Suggestion**: Route all environment variable access through Env. All keys are already present in Env.ts — this is a caller-side fix only.

### F-030: Locale extraction logic duplicated 4 times in middleware
- **Severity**: P2
- **Confidence**: 85
- **File**: `src/proxy.ts`
- **Line**: 80–113
- **Description**: The same locale extraction regex (`/^\/([^/]+)/`) and `AllLocales.includes()` validation are repeated at lines 80–83, 93–96, and 106–109 (3 occurrences in proxy; the theme summary says 4, but current source has 3 in the proxy function body). `pathname.includes()` checks in `isProtectedRoute`, `requiresVerification`, `isAdminRoute` are also fragile.
- **Suggestion**: Extract `getLocalePrefix()` helper. Replace duplicated blocks. Use segment-aware `containsSegment()` helper for route matching.

### F-019: Two sequential Supabase auth.getUser() calls on every protected request
- **Severity**: P2
- **Confidence**: 88
- **File**: `src/proxy.ts`
- **Line**: 52–118
- **Description**: `updateSession()` calls `supabase.auth.getUser()` internally (to refresh session cookies), then `proxy()` calls `supabase.auth.getUser()` a second time (line 68) for auth checking. This is two sequential round-trips to Supabase Auth on every protected request, adding ~100ms TTFB on each protected page load.
- **Suggestion**: Refactor `updateSession` to return the `User | null` from its internal `getUser()` call. Consume it in `proxy()` instead of making a second call.

### F-024: Dify threads use stale "health_companion" schema while Drizzle uses "vt_saas"
- **Severity**: P1
- **Confidence**: 95
- **File**: `src/libs/supabase/threads.ts`
- **Line**: 30
- **Description**: `THREADS_SCHEMA = 'health_companion'` is hardcoded while all Drizzle tables use schema `vt_saas`. This means all threads CRUD operations silently hit the wrong schema. Full Drizzle migration is in T-009; the config correction (one-line schema string fix) belongs here.
- **Suggestion**: Update `THREADS_SCHEMA = 'vt_saas'` in T-012. Full migration to Drizzle ORM is T-009's responsibility.

---

## Affected Files (Validated)

All files confirmed to exist:

| File | Status | Notes |
|------|--------|-------|
| `src/libs/Env.ts` | EXISTS (66 lines) | Actual location — NOT `src/utils/Env.ts` |
| `src/libs/vercel-ai/config.ts` | EXISTS (92 lines) | 4 `process.env` accesses to redirect |
| `src/utils/chatConfig.ts` | EXISTS (44 lines) | 4 `process.env` accesses to redirect |
| `src/utils/chatConfig.test.ts` | EXISTS (79 lines) | Must be updated to mock `@/libs/Env` |
| `src/libs/langfuse/config.ts` | EXISTS (18 lines) | 3 `process.env` accesses to redirect |
| `src/libs/mem0/config.ts` | EXISTS (16 lines) | 2 `process.env` accesses to redirect |
| `src/libs/supabase/server.ts` | EXISTS (34 lines) | 2 `process.env` accesses to redirect |
| `src/libs/supabase/middleware.ts` | EXISTS (48 lines) | 2 `process.env` accesses; `updateSession` return type changes |
| `src/proxy.ts` | EXISTS (126 lines) | Locale dedup + route matching + single getUser |
| `src/proxy.test.ts` | EXISTS (181 lines) | Created by T-011; mock update required for Step 9 |
| `src/libs/supabase/threads.ts` | EXISTS (160 lines) | One-line schema string correction |

~~`src/utils/Env.ts`~~ (REMOVED: file does not exist — use `src/libs/Env.ts`)

---

## Test Requirements

### Tests Before (Characterization)

Coverage gate is REQUIRED. Run the baseline before any changes:

```bash
# Verify proxy middleware tests pass (T-011's test file)
npm test -- src/proxy.test.ts

# Verify chatConfig tests pass
npm test -- src/utils/chatConfig.test.ts

# Verify full suite is green
npm test
```

All tests must be green before starting Step 2.

### Tests After (Verification)

#### 1. Update `src/proxy.test.ts` for Step 9 (updateSession return type change)

The existing mocks must be updated to reflect `updateSession` now returning `{ user, response }`:

```typescript
// UPDATE hoisted mock (was: mockResolvedValue(undefined)):
const mockUpdateSession = vi.fn().mockResolvedValue({
  user: null,
  response: NextResponse.next(),
});

// REMOVE mockGetUser and mockCreateClient (no longer needed by proxy.ts)
// REMOVE vi.mock for createClient from @/libs/supabase/middleware

// UPDATE test cases — replace mockGetUser.mockResolvedValue(...) with:
mockUpdateSession.mockResolvedValue({
  user: verifiedUser,  // or unverifiedUser or null
  response: NextResponse.next(),
});
```

After this update, re-run to confirm all 8 existing cases still pass:

```bash
npm test -- src/proxy.test.ts
```

#### 2. Add 2 new tests to `src/proxy.test.ts` for Step 8 (precise segment matching)

```typescript
it('does not trigger auth check for path with protected word in non-segment position', async () => {
  // Hypothetical path like /en/chat-archive — should NOT be treated as protected
  // since 'chat-archive' !== 'chat' and does not start with 'chat/'
  const request = makeRequest('/en/chatty');  // 'chatty' includes 'chat' as substring
  const response = await proxy(request, fakeEvent);
  expect(mockUpdateSession).toHaveBeenCalled();  // session still updates
  // But auth check (protected route logic) should not have redirected
  expect(response.status).not.toBe(307);
});

it('treats /hi/admin as an admin route (locale-prefixed)', async () => {
  mockUpdateSession.mockResolvedValue({ user: verifiedUser, response: NextResponse.next() });
  mockIsAdmin.mockReturnValue(false);
  const request = makeRequest('/hi/admin');
  const response = await proxy(request, fakeEvent);
  expect(response.status).toBe(307);
  const location = response.headers.get('location');
  expect(location).toContain('/hi/dashboard');
  expect(location).toContain('error=access_denied');
});
```

#### 3. Update `src/utils/chatConfig.test.ts` for Step 3 (Env mock)

Rewrite to use `vi.mock('@/libs/Env', ...)` instead of `process.env` mutation. All test assertions remain identical — only the setup mechanism changes. See mock pattern in Step 3 above.

```bash
npm test -- src/utils/chatConfig.test.ts
```

#### 4. Post-change full suite

```bash
npm run check-types   # Catches type errors from updateSession return type change
npm run lint          # Catches import ordering issues
npm test              # Full regression
npm run build         # Confirms Edge runtime compatibility of Env import in middleware.ts
```

#### 5. Verify THREADS_SCHEMA fix (Step 10)

```bash
# After updating threads.ts: confirm the constant changed
grep "THREADS_SCHEMA" src/libs/supabase/threads.ts
# Should output: const THREADS_SCHEMA = 'vt_saas';
```

No dedicated unit test is required for the schema constant — it is covered by the Supabase integration tests if they exist, and by manual verification against the Supabase dashboard.

---

## Enrichment Notes

- **UI Changes**: false — No files under `src/app/`, `src/components/`, or `src/features/` are modified. All changes are to library and middleware files.

- **Stale Files Removed**:
  - `src/utils/Env.ts` — referenced in theme plan but does not exist. The actual file is `src/libs/Env.ts`.

- **Gaps Found**:
  1. **Step 2 ("Add missing keys to Env.ts") is a no-op**: All keys (OPENAI_API_KEY, AI_PROVIDER, DEFAULT_AI_MODEL, LANGFUSE_*, MEM0_*, CRON_SECRET) are already in `src/libs/Env.ts`. This step can be skipped.
  2. **chatConfig.test.ts will break after Step 3**: The existing test mutates `process.env` directly, which has no effect once `chatConfig.ts` reads from a module-level `Env` singleton. The test file must be updated to mock `@/libs/Env` (pattern provided in Step 3).
  3. **proxy.test.ts mocks need updating after Step 9**: The `mockUpdateSession` mock currently returns `undefined`. After `updateSession` is changed to return `{ user, response }`, the mocks in `proxy.test.ts` must be updated. `mockGetUser` and `mockCreateClient` become unused and should be removed.
  4. **F-030 duplication count**: Theme summary says "4 times" but current `src/proxy.ts` has exactly 3 locale extraction blocks in the `proxy()` function body. The route-matching helpers (`isProtectedRoute`, etc.) use `pathname.includes()` which is the 4th fragility. Both are addressed together in Steps 7 and 8.
  5. **Edge runtime compatibility**: `src/libs/supabase/middleware.ts` runs at the Edge. Adding `import { Env } from '@/libs/Env'` must be validated with `npm run build`. `@t3-oss/env-nextjs` is documented as Edge-compatible but verify the build output confirms no Edge Runtime errors.
  6. **F-024 scope boundary**: Full migration of `threads.ts` to Drizzle ORM (against `vt_saas` schema) is T-009's work. T-012 corrects only the schema constant string (`'health_companion'` → `'vt_saas'`). Do not restructure the Supabase client calls or types in this theme.
