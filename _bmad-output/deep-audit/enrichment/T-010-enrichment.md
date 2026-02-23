# Implementation Brief: T-010 — Standardize API Contracts and REST Conventions

## Theme Metadata
- **ID**: T-010
- **Name**: Standardize API Contracts and REST Conventions
- **Effort**: M
- **Risk**: MEDIUM
- **Coverage Gate**: REQUIRED
- **Blast Radius**: MODERATE
- **Warnings**: None

## Enriched Implementation Steps

### Step 1: Write characterization tests for affected endpoints (coverage gate)
*Addresses: F-081, F-085, F-086, F-087, F-088 (pre-conditions)*

Create `src/app/api/__tests__/api-contracts.characterization.test.ts` with characterization tests that capture the **current** (buggy) behavior before making changes. This ensures no unintended regressions.

Tests to capture:
- `ensureConversation('missing-id', ...)` returns status `400` with `INVALID_REQUEST` code (F-081 current behavior)
- `GET /api/chat/messages` reads `conversation_id` (snake_case) query param (F-085 current behavior)
- `GET /api/threads` returns `{ threads, count }` (F-086 current behavior)
- `GET /api/chat/vercel/conversations` returns `{ conversations, total }` (F-086 current behavior)
- `DELETE /api/profile/delete` returns `200` with `{ message }` body (F-087 current behavior)
- `PATCH /api/share/[token]` with missing link returns error containing `"Share link not found not found"` (F-088 current behavior)

Most of these are already covered by existing tests. Add missing characterization tests inline in existing test files where possible.

### Step 2: Fix "Conversation not found" to return 404 instead of 400 (F-081)
*Addresses: F-081*

**File**: `src/app/api/chat/vercel/helpers.ts`, line 103

Change:
```typescript
return { ok: false, error: invalidRequestError('Conversation not found') };
```
To:
```typescript
return { ok: false, error: notFoundError('Conversation') };
```

This requires adding `notFoundError` to the import from `@/libs/api/errors` and removing `invalidRequestError` if no longer used in this file.

The `notFoundError('Conversation')` helper produces `{ error: "Conversation not found", code: "NOT_FOUND" }` with HTTP 404, which is the correct REST semantics for a missing resource.

**Downstream impact**: The vercel chat route test at `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts` line 372 asserts `response.status === 400`. This must be updated to `404`. The helpers test at `src/app/api/chat/vercel/__tests__/helpers.test.ts` line 189 also asserts `result.error.status === 400` and must be updated to `404`.

### Step 3: Fix doubled "not found" in share link error message (F-088)
*Addresses: F-088*

**File**: `src/app/api/share/[token]/route.ts`, line 137

Change:
```typescript
return notFoundError('Share link not found');
```
To:
```typescript
return notFoundError('Share link');
```

The `notFoundError()` helper already appends " not found" to the resource name, so passing `'Share link not found'` produces `"Share link not found not found"`.

**Downstream impact**: Test at `src/app/api/share/__tests__/share-token-route.test.ts` does not currently test the PATCH 404 message body, so no test updates needed for this step alone. However, a new test should be added in Step 8.

### Step 4: Rename `conversation_id` query param to `conversationId` in GET /api/chat/messages (F-085)
*Addresses: F-085*

**File**: `src/app/api/chat/messages/route.ts`, lines 32-35

Change:
```typescript
const conversationId = searchParams.get('conversation_id');

if (!conversationId) {
  return invalidRequestError('conversation_id is required');
}
```
To:
```typescript
const conversationId = searchParams.get('conversationId')
  || searchParams.get('conversation_id'); // backward compat

if (!conversationId) {
  return invalidRequestError('conversationId is required');
}
```

Accept both `conversationId` (new) and `conversation_id` (legacy) to avoid breaking existing clients. The error message should reference the canonical camelCase name.

**Client-side update required**: `src/components/chat/ChatInterface.tsx`, line 259:
```typescript
// Change:
const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`);
// To:
const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
```

**Downstream impact**: Test at `src/app/api/chat/messages/route.test.ts` uses `conversation_id` in all URL constructions. Update to use `conversationId` as the primary param, and add one test to verify backward compat with `conversation_id`.

### Step 5: Standardize collection metadata field to `total` across /threads and /conversations (F-086)
*Addresses: F-086*

**File**: `src/app/api/threads/route.ts`, lines 61-64

Change:
```typescript
return NextResponse.json({
  threads: userThreads ?? [],
  count: userThreads?.length ?? 0,
});
```
To:
```typescript
return NextResponse.json({
  threads: userThreads ?? [],
  total: userThreads?.length ?? 0,
});
```

The `/api/chat/vercel/conversations` endpoint already uses `total`, so this change brings `/api/threads` in line.

**Downstream impact**: `src/components/chat/ThreadListSidebar.tsx` does not read `count` from the response (confirmed by grep). However, the test at `src/components/chat/ThreadListSidebar.test.tsx` uses `count` in all mock responses (9 occurrences). Update all mock responses to use `total` instead of `count`.

### Step 6: Change DELETE profile to return 204 No Content (F-087)
*Addresses: F-087*

**File**: `src/app/api/profile/delete/route.ts`, lines 78-81

Change:
```typescript
return NextResponse.json(
  { message: 'Account deleted successfully' },
  { status: 200 },
);
```
To:
```typescript
return new NextResponse(null, { status: 204 });
```

Also update the return type from `Promise<NextResponse>` to `Promise<NextResponse | Response>` or simply `Promise<Response>`.

**Client-side impact**: `src/app/[locale]/(auth)/dashboard/user-profile/page.tsx` line 207 checks `if (!response.ok)` which handles both 200 and 204, and does NOT read the response body on success. Safe to change.

**Downstream impact**: Test at `src/app/api/profile/delete/route.test.ts` line 107-113 asserts `response.status === 200` and reads `body.message`. Must be updated to assert `204` and not parse a body.

### Step 7: Gate or replace placeholder content in share link viewer (F-044)
*Addresses: F-044*

**File**: `src/app/[locale]/(unauth)/share/[token]/page.tsx`, lines 142-152

Replace the placeholder text block:
```tsx
<div className="rounded-lg bg-muted p-8 text-center">
  <p className="text-muted-foreground">
    Resource ID: <span className="font-mono">{link.resourceId}</span>
  </p>
  <p className="mt-4 text-sm text-muted-foreground">
    This is a template placeholder. In your implementation, fetch and display
    the actual resource content here based on resourceType and resourceId.
  </p>
</div>
```

With a proper gated message:
```tsx
<div className="rounded-lg bg-muted p-8 text-center">
  <p className="text-muted-foreground">
    This shared content is not yet available for viewing.
  </p>
  <p className="mt-2 text-sm text-muted-foreground">
    Resource type: <span className="font-mono">{link.resourceType}</span>
  </p>
</div>
```

Remove the raw "Resource ID" display and the developer-facing "template placeholder" text. Users should see a clean "not yet available" message. The resourceId should not be exposed to end users.

### Step 8: Update all tests to verify fixes (tests_after)
*Covered in Test Requirements section below.*

## Related Findings

### F-081: "Conversation not found" returns 400 instead of 404
- **Severity**: P1
- **File**: `src/app/api/chat/vercel/helpers.ts` (originally route.ts, but logic is in helpers after T-009 refactor)
- **Line**: 103
- **Description**: Uses `invalidRequestError()` for a missing resource. Every other not-found case uses `notFoundError()` -> 404.
- **Suggestion**: Replace with `notFoundError('Conversation')`.

### F-085: Query parameter naming inconsistency: snake_case conversation_id vs camelCase
- **Severity**: P2
- **File**: `src/app/api/chat/messages/route.ts`
- **Line**: 32-35
- **Description**: GET /api/chat/messages uses `conversation_id` (snake_case). Every other endpoint uses camelCase.
- **Suggestion**: Rename to `conversationId` for consistency.

### F-086: Collection metadata field named inconsistently: "count" vs "total"
- **Severity**: P2
- **File**: `src/app/api/threads/route.ts`
- **Line**: 62-64
- **Description**: `/threads` returns `{ count }`, `/conversations` returns `{ total }`. Neither reflects true collection size.
- **Suggestion**: Standardize field name to `total`.

### F-087: DELETE profile returns 200 with body instead of 204 No Content
- **Severity**: P2
- **File**: `src/app/api/profile/delete/route.ts`
- **Line**: 78-81
- **Description**: Returns `{ message: 'Account deleted successfully' }` with 200. Other deletes return 204 No Content.
- **Suggestion**: Return `new Response(null, { status: 204 })` for consistency.

### F-088: notFoundError() called with full message producing doubled "not found"
- **Severity**: P2
- **File**: `src/app/api/share/[token]/route.ts`
- **Line**: 137
- **Description**: `notFoundError('Share link not found')` produces "Share link not found not found".
- **Suggestion**: Change to `notFoundError('Share link')`.

### F-044: Placeholder UI content shipped to end users in share link viewer
- **Severity**: P2
- **File**: `src/app/[locale]/(unauth)/share/[token]/page.tsx`
- **Line**: 103-153
- **Description**: "This is a template placeholder. In your implementation, fetch and display the actual resource content here." is visible to real users.
- **Suggestion**: Gate the feature or replace with user-appropriate messaging.

## Affected Files (Validated)

All files confirmed to exist in the current codebase:

- `src/app/api/chat/vercel/helpers.ts` (F-081 — actual location after T-009 refactor)
- `src/app/api/share/[token]/route.ts` (F-088)
- `src/app/api/chat/messages/route.ts` (F-085)
- `src/app/api/threads/route.ts` (F-086)
- `src/app/api/chat/vercel/conversations/route.ts` (F-086 — reference, already uses `total`)
- `src/app/api/profile/delete/route.ts` (F-087)
- `src/app/[locale]/(unauth)/share/[token]/page.tsx` (F-044)
- `src/components/chat/ChatInterface.tsx` (client-side: conversation_id query param)

Test files requiring updates:
- `src/app/api/chat/vercel/__tests__/helpers.test.ts` (F-081 status change 400->404)
- `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts` (F-081 status change 400->404)
- `src/app/api/chat/messages/route.test.ts` (F-085 query param rename)
- `src/app/api/profile/delete/route.test.ts` (F-087 status change 200->204)
- `src/components/chat/ThreadListSidebar.test.tsx` (F-086 count->total in mocks)

- ~~`src/app/api/chat/vercel/route.ts`~~ (REMOVED: F-081 logic moved to `helpers.ts` during T-009 refactor; route.ts just calls `ensureConversation`)

## Test Requirements

### Tests Before (Characterization)

Most characterization tests already exist. Add the following missing characterization tests before making any code changes:

**1. F-081 — Already covered:**
- `src/app/api/chat/vercel/__tests__/helpers.test.ts` line 176-189: asserts `result.error.status === 400` for missing conversation
- `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts` line 359-377: asserts `response.status === 400` and body contains "Conversation not found"

**2. F-085 — Already covered:**
- `src/app/api/chat/messages/route.test.ts` line 48-53: uses `conversation_id` param

**3. F-086 — Already covered (in mock, not assertion):**
- `src/components/chat/ThreadListSidebar.test.tsx`: uses `{ threads, count }` in mocks

**4. F-087 — Already covered:**
- `src/app/api/profile/delete/route.test.ts` line 107-113: asserts `response.status === 200` and `body.message`

**5. F-088 — ADD characterization test:**
Add to `src/app/api/share/__tests__/share-token-route.test.ts`:
```typescript
it('returns doubled "not found" in error message for missing share link (characterization)', async () => {
  // Setup: authenticated user, link not found by token+userId
  // Assert: response body error contains "Share link not found not found"
});
```

**Run characterization tests:**
```bash
npm test -- --run src/app/api/chat/vercel/__tests__/helpers.test.ts src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts src/app/api/chat/messages/route.test.ts src/app/api/profile/delete/route.test.ts src/app/api/share/__tests__/share-token-route.test.ts src/components/chat/ThreadListSidebar.test.tsx
```

### Tests After (Verification)

**1. F-081 — Update existing tests:**

File: `src/app/api/chat/vercel/__tests__/helpers.test.ts`
- Update "returns ok: false for conversationId not found" to assert `result.error.status === 404` (was 400)

File: `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts`
- Update "returns 400 when conversationId not found for user" to assert `response.status === 404` (was 400) and rename test description to "returns 404 when conversationId not found"

**2. F-085 — Update and add tests:**

File: `src/app/api/chat/messages/route.test.ts`
- Update all test URLs from `conversation_id=` to `conversationId=`
- Add new test: "accepts legacy conversation_id param for backward compatibility"
  ```typescript
  it('accepts legacy conversation_id param for backward compatibility', async () => {
    const request = new Request('http://localhost/api/chat/messages?conversation_id=abc-123');
    const response = await GET(request);
    expect(response.status).not.toBe(400);
  });
  ```
- Add new test: "returns 400 with camelCase param name in error when both params missing"
  ```typescript
  it('returns error referencing conversationId in message', async () => {
    const request = new Request('http://localhost/api/chat/messages');
    const response = await GET(request);
    const body = await response.json();
    expect(body.error).toContain('conversationId');
  });
  ```

**3. F-086 — Update mock responses in tests:**

File: `src/components/chat/ThreadListSidebar.test.tsx`
- Change all mock response `count` fields to `total` (9 occurrences)
- Verify tests still pass (sidebar component does not destructure `count`/`total`)

**4. F-087 — Update existing test:**

File: `src/app/api/profile/delete/route.test.ts`
- Update "returns 200 and deletes user" test:
  ```typescript
  it('returns 204 No Content on successful deletion', async () => {
    const response = await DELETE();
    expect(response.status).toBe(204);
    expect(mockDeleteUser).toHaveBeenCalledWith(mockUser.id);
    // 204 responses have no body - do not parse
  });
  ```

**5. F-088 — Add new test:**

File: `src/app/api/share/__tests__/share-token-route.test.ts`
- Add PATCH test for missing link error message:
  ```typescript
  it('returns 404 with correct "Share link not found" message (not doubled)', async () => {
    // Setup: authenticated user, mockSelectWhere returns []
    const response = await PATCH(request, { params: Promise.resolve({ token: 'missing' }) });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Share link not found');
    // Must NOT be "Share link not found not found"
    expect(body.error).not.toContain('not found not found');
  });
  ```

**6. F-044 — No automated test needed:**
This is a UI copy change. Visual inspection during development is sufficient. The placeholder text removal can be verified by a simple grep:
```bash
grep -r "template placeholder" src/app/\[locale\]/\(unauth\)/share/
# Should return no results after the fix
```

**Run all verification tests:**
```bash
npm test -- --run src/app/api/chat/vercel/__tests__/helpers.test.ts src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts src/app/api/chat/messages/route.test.ts src/app/api/profile/delete/route.test.ts src/app/api/share/__tests__/share-token-route.test.ts src/components/chat/ThreadListSidebar.test.tsx
```

## Enrichment Notes
- **UI Changes**: true (F-044 — share link viewer placeholder text replacement; F-085 — client-side query param in ChatInterface)
- **Stale Files Removed**: `src/app/api/chat/vercel/route.ts` removed from primary target list (F-081 logic moved to `helpers.ts` during T-009 refactor; route.ts just calls `ensureConversation`)
- **Gaps Found**: None. All finding suggestions are covered by the implementation steps. The backward-compat approach for F-085 (accepting both `conversationId` and `conversation_id`) is an enhancement over the original suggestion to ensure no breakage.
