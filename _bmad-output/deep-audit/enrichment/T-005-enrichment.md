# Implementation Brief: T-005 — Consolidate Duplicate Analytics Utilities

## Theme Metadata
- **ID**: T-005
- **Name**: Consolidate Duplicate Analytics Utilities
- **Effort**: S
- **Risk**: LOW
- **Coverage Gate**: ADEQUATE
- **Blast Radius**: CONTAINED
- **Warnings**: None

## Enriched Implementation Steps

### Current State (verified by code inspection)

There are two independent `calculateTrend` implementations with incompatible return types:

**Version A — canonical utility** (`src/libs/utils/calculateTrend.ts`):
```typescript
export type TrendData = {
  percentage: number;        // absolute value (e.g. 20 for -20%)
  direction: 'up' | 'down' | 'neutral';
  isPositive: boolean;
};
```

**Version B — local copy** (`src/libs/api/admin/analytics.ts`, line 27):
```typescript
export type TrendData = {
  direction: 'up' | 'down' | 'neutral';
  value: string;             // formatted string e.g. "+20%" or "-20%"
  percentage: number;        // signed value (e.g. -20 for a 20% drop)
};
```

`analytics.ts` also contains a private `listAllUsers()` function (line 73) that duplicates the public `fetchAllUsers()` in `src/libs/queries/metrics.ts`. They are functionally identical — both paginate Supabase Admin API 1000 users per page — but `analytics.ts` re-implements it without reusing the shared version.

The test file `src/libs/api/admin/__tests__/analytics.test.ts` re-implements `calculateTrend` inline (lines 7–47) instead of importing it, and asserts against Version B's type shape (`value` string field, signed `percentage`).

### Step 1 — Replace `calculateTrend` in `analytics.ts` with import from `@/libs/utils/calculateTrend` (addresses F-027)

- Delete the local `calculateTrend` function (lines 27–67) and the local `TrendData` type export from `src/libs/api/admin/analytics.ts`.
- Add import: `import { calculateTrend } from '@/libs/utils/calculateTrend'`
- Re-export `TrendData` from the canonical location so existing consumers of `AnalyticsMetrics` still compile:
  `export type { TrendData } from '@/libs/utils/calculateTrend'`
- The canonical `TrendData` lacks `value: string`. Inspect consumers of `AnalyticsMetrics.totalUsers.trend` etc. to confirm whether `value` is referenced.
  - `src/components/admin/analytics/AnalyticsDashboard.tsx` imports `AnalyticsMetrics` — verify it does not access `.trend.value`.
  - If `.trend.value` is used in any component, either: (a) derive it from `percentage` and `direction` at the call site, or (b) add a `formatTrendValue(trend: TrendData): string` helper to `calculateTrend.ts`.

### Step 2 — Replace `listAllUsers()` in `analytics.ts` with import of `fetchAllUsers` from `@/libs/queries/metrics` (addresses F-027)

- Delete the private `listAllUsers()` function (lines 69–98) from `src/libs/api/admin/analytics.ts`.
- Add import: `import { fetchAllUsers } from '@/libs/queries/metrics'`
- Replace the single call site at line 285 (`listAllUsers()`) with `fetchAllUsers()`.
- Signature and pagination behaviour are identical; no other changes needed.

### Step 3 — Fix the test file `analytics.test.ts` to import rather than re-implement

- In `src/libs/api/admin/__tests__/analytics.test.ts`, remove the inline `calculateTrend` re-implementation (lines 7–47).
- Import from the real source:
  ```typescript
  import type { TrendData } from '@/libs/utils/calculateTrend'
  import { calculateTrend } from '@/libs/utils/calculateTrend'
  ```
- Update assertions to match the canonical `TrendData` shape (`isPositive` instead of `value`):
  - `trend.value` references → remove or replace with `trend.isPositive` / `trend.direction`
  - `trend.percentage` for negative trends is now the absolute value (e.g. `20`, not `-20`)

### Step 4 — Verify all callsites compile and tests pass

```bash
npm run check-types && npm test -- --run src/libs/api/admin/__tests__/analytics.test.ts src/libs/utils/__tests__/calculateTrend.test.ts src/libs/queries/__tests__/metrics.test.ts
```

## Related Findings

### F-027: Duplicated calculateTrend and listAllUsers functions across metrics modules
- **Severity**: P1
- **File**: `src/libs/api/admin/analytics.ts`
- **Line**: 27, 73
- **Description**: `calculateTrend` is implemented twice with different return types. `listAllUsers` duplicates `fetchAllUsers`. Multiple analytics functions each independently call fetchAllUsers().
- **Suggestion**: Consolidate to one calculateTrend in utils and one fetchAllUsers in metrics. Fetch users once per request.

## Affected Files (Validated)

- `src/libs/api/admin/analytics.ts` — confirmed exists; contains both duplicates
- `src/libs/queries/users.ts` — confirmed exists; already imports `fetchAllUsers` from `./metrics` correctly; no changes needed
- `src/libs/utils/calculateTrend.ts` — confirmed exists; this is the canonical implementation to keep
- `src/libs/api/admin/__tests__/analytics.test.ts` — confirmed exists; re-implements calculateTrend inline; must be updated
- `src/components/admin/analytics/AnalyticsDashboard.tsx` — confirmed exists; imports `AnalyticsMetrics`; verify `.trend.value` access before removing `value` field

Note: the theme listed `src/libs/queries/users.ts` as a file needing changes. Inspection shows it already correctly imports `fetchAllUsers` from `./metrics` and has no `listAllUsers` reference. No changes required to that file.

## Test Requirements

### Tests Before (Characterization)

Coverage gate is ADEQUATE. Run existing tests to confirm baseline before making changes:

```bash
npm test -- --run \
  src/libs/api/admin/__tests__/analytics.test.ts \
  src/libs/utils/__tests__/calculateTrend.test.ts \
  src/libs/queries/__tests__/metrics.test.ts
```

Verified passing at time of enrichment: 7 + 9 + 28 = 44 tests all green.

### Tests After (Verification)

**1. Update `src/libs/api/admin/__tests__/analytics.test.ts`**

Replace the inline `calculateTrend` re-implementation with a real import. Update assertions to the canonical `TrendData` shape:

```typescript
// BEFORE (broken — tests a local copy with wrong shape):
function calculateTrend(...) { ... }
expect(trend.value).toBe('+20%');
expect(trend.percentage).toBe(-20);  // signed

// AFTER (correct — tests the real shared function):
import { calculateTrend } from '@/libs/utils/calculateTrend';
expect(trend.isPositive).toBe(true);
expect(trend.percentage).toBe(20);   // absolute
```

The test file path stays the same: `src/libs/api/admin/__tests__/analytics.test.ts`

**2. Verify no regression in `calculateTrend.test.ts`**

`src/libs/utils/__tests__/calculateTrend.test.ts` tests the canonical function. It must continue to pass unchanged.

**3. Verify no regression in `metrics.test.ts`**

`src/libs/queries/__tests__/metrics.test.ts` tests `fetchAllUsers` and related functions. It must continue to pass unchanged.

**4. TypeScript compilation check**

```bash
npm run check-types
```

Confirms the `TrendData` type re-export from `analytics.ts` satisfies the `AnalyticsMetrics` type and any component consumers.

## Enrichment Notes
- **UI Changes**: false — `AnalyticsDashboard.tsx` imports `AnalyticsMetrics` but the shape of that type remains structurally equivalent. Verify the component does not read `.trend.value` before removing that field; if it does, add a `formatTrendValue()` helper to avoid a UI change.
- **Stale Files Removed**: `src/libs/queries/users.ts` was listed in the theme as requiring changes but already correctly uses `fetchAllUsers` — no changes needed there. Not removed from reference, but flagged as no-op.
- **Gaps Found**:
  - The finding mentions "Multiple analytics functions each independently call fetchAllUsers()" — this refers to `metrics.ts` functions (`getNewSignupsCount`, `getActiveUsersCount`, etc.) each calling `fetchAllUsers()` independently. These are separate exported functions intended for individual use (e.g. the dashboard widget queries). The `getAnalyticsMetrics()` in `analytics.ts` already consolidates the fetch correctly (single `listAllUsers()` call at line 284, results shared across all metric computations). The real fix is replacing `listAllUsers()` with `fetchAllUsers()` in Step 2 — the per-function calls in `metrics.ts` are intentional and not a bug.
  - The test file `src/libs/api/admin/__tests__/analytics.test.ts` re-implementing `calculateTrend` locally is an undocumented gap in the original finding — this must be fixed in Step 3 or the duplicate will persist in test code.
