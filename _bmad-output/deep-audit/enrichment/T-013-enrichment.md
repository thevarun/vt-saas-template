# Implementation Brief: T-013 — Fix Remaining Performance Issues

## Theme Metadata
- **ID**: T-013
- **Name**: Fix Remaining Performance Issues
- **Effort**: M
- **Risk**: MEDIUM
- **Coverage Gate**: ADEQUATE
- **Blast Radius**: MODERATE
- **Warnings**: None

## Enriched Implementation Steps

### Step 1: Optimize mem0 worker — move dynamic import to top-level and batch DB inserts (F-016)

**Current state:** `src/libs/mem0/worker.ts` has a dynamic `import()` at line 65 inside the `for` loop that re-evaluates on every job iteration. Each memory is inserted individually via `createMemory()` in a serial inner loop (lines 100-114), resulting in N+1 DB queries per job.

**Changes:**
1. Replace the dynamic `import('@/libs/queries/vercelConversations')` at line 65 with a top-level static import:
   ```typescript
   import { getConversationByIdAdmin } from '@/libs/queries/vercelConversations';
   ```
2. Batch memory DB inserts: Collect all valid memories from the inner loop into an array, then use a single `db.insert(mem0Memories).values(memoryRows)` call instead of N individual `createMemory()` calls. Create a new `createMemories` (plural) batch function in `src/libs/queries/mem0Memories.ts`.
3. Add bounded parallelism to the outer job loop using `Promise.allSettled` with a concurrency limiter (e.g., process 5 jobs at a time using a simple semaphore or `p-limit`). This prevents 100 sequential jobs from taking O(n) time when each job is I/O-bound.

**Files:**
- `src/libs/mem0/worker.ts` — static import, batch inserts, bounded parallelism
- `src/libs/queries/mem0Memories.ts` — add `createMemories()` batch insert function

### Step 2: Lazy-load PostHog via requestIdleCallback and disable autocapture (F-022)

**Current state:** `src/components/analytics/PostHogProvider.tsx` calls `initAnalytics()` eagerly in a `useEffect` on mount (line 17-19). The `PostHogProvider` class in `src/libs/analytics/providers/posthog.ts` imports `posthog-js` at the top level (line 6), meaning it is bundled into the main chunk (~40-60KB). `autocapture: true` is set at line 38, which adds DOM mutation observers degrading INP.

**Changes:**
1. In `src/components/analytics/PostHogProvider.tsx`, defer `initAnalytics()` via `requestIdleCallback` (with a `setTimeout` fallback for Safari):
   ```typescript
   useEffect(() => {
     const init = () => initAnalytics();
     if ('requestIdleCallback' in window) {
       window.requestIdleCallback(init);
     } else {
       setTimeout(init, 1);
     }
   }, []);
   ```
2. In `src/libs/analytics/providers/posthog.ts`, change the top-level `import posthog from 'posthog-js'` to a dynamic import inside the `init()` method:
   ```typescript
   async init(config: AnalyticsConfig): Promise<void> {
     if (typeof window === 'undefined' || this.initialized) return;
     const { default: posthog } = await import('posthog-js');
     this.posthogInstance = posthog;
     posthog.init(config.apiKey, { ... });
     this.initialized = true;
   }
   ```
   Store the posthog instance on `this` and use it in `identify()`, `track()`, and `reset()`.
3. In the same file, set `autocapture: false` (line 38) and `capture_pageview: false` (line 39). Use manual `posthog.capture('$pageview')` where needed, or rely on the existing `trackEvent` helpers which already cover page views.

**Files:**
- `src/components/analytics/PostHogProvider.tsx` — requestIdleCallback wrapper
- `src/libs/analytics/providers/posthog.ts` — dynamic import, store instance, disable autocapture
- `src/libs/analytics/types.ts` — make `init()` return `void | Promise<void>` to support async

### Step 3: Add 30-second stale-time check to conversation list refetch on tab focus (F-023)

**Current state:** Both `src/components/chat/vercel/ConversationListSidebar.tsx` (line 98-107) and `src/components/chat/ThreadListSidebar.tsx` (line 91-100) fire an API call on every `window:focus` event with no throttle or stale-time check. Rapid tab switching triggers many redundant fetches.

**Changes:**
1. In both sidebar components, track a `lastFetchTime` ref:
   ```typescript
   const lastFetchRef = useRef<number>(0);
   ```
2. In the `handleFocus` callback, add a stale-time guard:
   ```typescript
   const STALE_TIME_MS = 30_000; // 30 seconds
   const handleFocus = () => {
     if (Date.now() - lastFetchRef.current < STALE_TIME_MS) return;
     lastFetchRef.current = Date.now();
     fetchConversations(false);
   };
   ```
3. Also update `lastFetchRef.current = Date.now()` at the end of the initial fetch and any explicit refetch calls.

**Files:**
- `src/components/chat/vercel/ConversationListSidebar.tsx` — add stale-time guard
- `src/components/chat/ThreadListSidebar.tsx` — add stale-time guard (same pattern)

### Step 4: Install only Chromium in CI Playwright step (F-056)

**Current state:** `.github/workflows/CI.yml` lines 149 and 153 install both `chromium firefox`:
```yaml
run: npx playwright install --with-deps chromium firefox
...
run: npx playwright install-deps chromium firefox
```
The `playwright.config.ts` only defines a `chromium` project (lines 59-65) and explicitly comments "Firefox removed - Chromium-only for faster CI."

**Changes:**
1. Line 149: Change `npx playwright install --with-deps chromium firefox` to `npx playwright install --with-deps chromium`
2. Line 153: Change `npx playwright install-deps chromium firefox` to `npx playwright install-deps chromium`

This saves ~200MB download and ~30s per CI run.

**Files:**
- `.github/workflows/CI.yml` — remove `firefox` from both install commands

### Step 5: Reduce UI component tests to essential assertions (F-059)

**Current state:** Three test files total 469 LOC that primarily assert Tailwind CSS class names:
- `skeleton.test.tsx` (145 LOC, 14 tests) — checks specific classes like `h-4`, `w-full`, `rounded`, `animate-pulse`, `bg-muted/50`
- `spinner.test.tsx` (156 LOC, 14 tests) — duplicate size-variant checks, composition tests asserting parent container classes
- `loading-card.test.tsx` (168 LOC, 13 tests) — queries by CSS class selectors like `.rounded-lg.border.bg-card`

These are brittle: any styling refactor (e.g., changing from `size-10` to `size-11` on avatars) breaks tests with no behavioral regression.

**Changes:** Replace each file with 2-3 essential tests:
1. **Renders without crashing** (basic smoke test)
2. **Applies custom className** (ensures `cn()` merge works)
3. **Passes HTML attributes** (ensures `...props` spread works)

Target: ~25-35 LOC per file, ~90 LOC total (down from 469).

**Files:**
- `src/components/ui/__tests__/skeleton.test.tsx` — rewrite to 3 tests
- `src/components/ui/__tests__/spinner.test.tsx` — rewrite to 3 tests
- `src/components/ui/__tests__/loading-card.test.tsx` — rewrite to 2 tests (no HTML attributes passthrough since LoadingCard only accepts `className`)

## Related Findings

### F-016: N+1 DB queries and sequential dynamic imports in job processing loop
- **Severity**: P2
- **File**: `src/libs/mem0/worker.ts`
- **Line**: 74-192 (actual file is 142 lines; relevant loop at lines 40-133)
- **Description**: Each job executes 7+ serial DB round-trips plus dynamic imports. With 100 jobs: 700+ serial DB queries.
- **Suggestion**: Move dynamic imports to top-level. Batch inserts. Use bounded parallelism.

### F-022: PostHog with autocapture:true adds ~40-60KB to main bundle
- **Severity**: P3
- **File**: `src/components/analytics/PostHogProvider.tsx`
- **Line**: 16-22
- **Description**: PostHog is bundled into the main chunk and parsed on page load. Autocapture adds DOM mutation observers that can degrade INP.
- **Suggestion**: Lazy-load PostHog via dynamic import after idle. Disable autocapture, use manual tracking.

### F-023: Window:focus event triggers uncached API call on every tab switch
- **Severity**: P3
- **File**: `src/components/chat/vercel/ConversationListSidebar.tsx`
- **Line**: 98-107
- **Description**: Both chat sidebars refetch conversations on every tab focus without debounce or stale-time check.
- **Suggestion**: Add 30-second stale-time check before triggering refetch.

### F-056: CI installs Firefox browsers despite Playwright config only using Chromium
- **Severity**: P2
- **File**: `.github/workflows/CI.yml`
- **Line**: 149
- **Description**: CI downloads ~200MB Firefox unnecessarily, wasting ~30s per run.
- **Suggestion**: Change to `npx playwright install --with-deps chromium` only.

### F-059: UI component tests assert CSS class names across ~470 LOC total (skeleton, spinner, loading-card)
- **Severity**: P3
- **File**: `src/components/ui/__tests__/skeleton.test.tsx`
- **Line**: 1-145
- **Description**: Skeleton (145 LOC), Spinner (156 LOC), LoadingCard (168 LOC) tests primarily assert Tailwind class names. Tightly coupled to implementation, will break on styling refactors.
- **Suggestion**: Reduce to 2-3 tests per component: renders, applies custom className, passes HTML attributes.

## Affected Files (Validated)

All files exist and are current:

- `src/libs/mem0/worker.ts` (142 lines)
- `src/libs/queries/mem0Memories.ts` (addition: batch insert function)
- `src/components/analytics/PostHogProvider.tsx` (22 lines)
- `src/libs/analytics/providers/posthog.ts` (85 lines)
- `src/libs/analytics/types.ts` (may need `init` return type update)
- `src/components/chat/vercel/ConversationListSidebar.tsx` (257 lines)
- `src/components/chat/ThreadListSidebar.tsx` (additional file for stale-time fix in Dify sidebar)
- `.github/workflows/CI.yml` (179 lines)
- `src/components/ui/__tests__/skeleton.test.tsx` (145 lines)
- `src/components/ui/__tests__/spinner.test.tsx` (156 lines)
- `src/components/ui/__tests__/loading-card.test.tsx` (168 lines)

## Test Requirements

### Tests Before (Characterization)

Coverage gate is ADEQUATE. Run existing tests to establish baseline:

```bash
npm test
```

Specific test files that exist and must pass before changes:
- `src/components/analytics/__tests__/PostHogProvider.test.tsx` (3 tests: init on mount, renders children, only initializes once)
- `src/components/ui/__tests__/skeleton.test.tsx` (14 tests)
- `src/components/ui/__tests__/spinner.test.tsx` (14 tests)
- `src/components/ui/__tests__/loading-card.test.tsx` (13 tests)
- No existing tests for `src/libs/mem0/worker.ts` (grep returned no matches for mem0 worker tests)
- No existing unit tests for `ConversationListSidebar` focus behavior

### Tests After (Verification)

#### Step 1 (F-016): mem0 worker optimization
- No new test file needed. The worker is a cron-triggered background processor with external API dependencies (Mem0 API + Supabase). Verify manually or via integration test that:
  - Jobs still process correctly end-to-end
  - Batch insert creates multiple memories in one DB call
- If adding a unit test, mock `getMem0Client`, `getPendingJobs`, `getConversationMessages`, `getConversationByIdAdmin`, and verify:
  - `createMemories()` is called once with N memories (not N individual `createMemory()` calls)
  - All jobs in a batch are processed (not just the first)

#### Step 2 (F-022): PostHog lazy loading
- Update `src/components/analytics/__tests__/PostHogProvider.test.tsx`:
  - Test that `initAnalytics()` is NOT called synchronously on mount (it should be deferred)
  - Test that `initAnalytics()` IS called after idle callback fires (mock `requestIdleCallback`)
  - Test that children render immediately (before analytics init)
- Update `src/libs/analytics/providers/__tests__/posthog.test.ts`:
  - Verify `autocapture` is set to `false` in the PostHog init config
  - Verify `capture_pageview` is set to `false`

#### Step 3 (F-023): Stale-time refetch guard
- Add test case in a new or existing test file for `ConversationListSidebar`:
  - Mock `fetch` and `window.dispatchEvent(new Event('focus'))`
  - Verify that two rapid focus events within 30 seconds result in only 1 API call (after the initial mount fetch)
  - Verify that a focus event after 30 seconds triggers a new fetch
- Same pattern for `ThreadListSidebar` if tests exist

#### Step 4 (F-056): CI Firefox removal
- No unit test needed. Verify by:
  - Inspecting the CI workflow diff (no `firefox` in install commands)
  - Confirming `playwright.config.ts` only has `chromium` project (already true)
  - Observe CI run time reduction (~30s saved)

#### Step 5 (F-059): UI test reduction
- Rewritten test files should pass with `npm test`:
  - `src/components/ui/__tests__/skeleton.test.tsx` — 3 tests: renders, custom className, HTML attributes
  - `src/components/ui/__tests__/spinner.test.tsx` — 3 tests: renders, custom className, renders SVG element
  - `src/components/ui/__tests__/loading-card.test.tsx` — 2 tests: renders, custom className
- Total: ~8 tests, ~90 LOC (down from 41 tests, 469 LOC)
- Verify no class-name assertions remain (grep for `toHaveClass` should return 0 matches in these files)

## Enrichment Notes
- **UI Changes**: false (all changes are backend logic, build config, or test-only)
- **Stale Files Removed**: None
- **Gaps Found**:
  - F-023 mentions "both chat sidebars" but the theme `files` list only included `ConversationListSidebar.tsx`. Added `src/components/chat/ThreadListSidebar.tsx` to the affected files list (same focus-refetch pattern at lines 91-100).
  - F-016 suggestion mentions "bounded parallelism" but no library like `p-limit` is currently in dependencies. Consider using a simple Promise-based semaphore to avoid adding a new dependency, or add `p-limit` (2KB, zero deps).
  - F-022 requires making `init()` async in the analytics provider interface (`src/libs/analytics/types.ts`). This is a minor type-level change but should be noted.
  - `src/libs/queries/mem0Memories.ts` is not in the original theme `files` list but needs a new `createMemories()` batch function for Step 1.
