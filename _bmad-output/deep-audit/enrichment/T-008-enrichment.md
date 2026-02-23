# Implementation Brief: T-008 — Fix Data Layer Integrity Issues

## Theme Metadata
- **ID**: T-008
- **Name**: Fix Data Layer Integrity Issues
- **Effort**: M
- **Risk**: HIGH
- **Coverage Gate**: REQUIRED
- **Blast Radius**: MODERATE
- **Warnings**: Mixed concerns -- separate structural changes (schema/index) from behavior changes (race conditions, auth). The schema migration (steps 7-8) must be generated via `npm run db:generate` AFTER editing Schema.ts, NOT by hand-creating migration files.

## Enriched Implementation Steps

### Step 1: Write characterization tests (coverage gate)
**Addresses**: Baseline for F-071, F-074, F-075, F-076, F-078

Create characterization tests that document the current (broken) behavior before making any changes. This ensures the fixes are provably correct.

**File to create**: `src/app/api/share/__tests__/share-token-route.test.ts`
- Test: GET with valid token increments `accessCount` (current: read-then-write pattern)
- Test: GET with expired/inactive token returns 410
- Test: GET with missing token returns 400

**File to create**: `src/app/api/profile/__tests__/update-username-route.test.ts`
- Test: PATCH with taken username returns 409 (current behavior works via explicit check)
- Test: PATCH with unique constraint violation falls through to 500 (this is the bug -- characterize it)
- Test: PATCH with valid username updates successfully

**File to modify**: `src/libs/queries/__tests__/vercelConversations.test.ts`
- Add tests for: `getConversationById` called WITHOUT userId (characterize the bypass)
- Add tests for: `updateConversation` called WITHOUT userId
- Add tests for: `deleteConversation` called WITHOUT userId
- NOTE: Existing tests at lines 77, 181, 212, 223 already call these without userId -- these serve as characterization tests that must be updated in step 6.

**File to create**: `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts`
- Test: POST creates conversation then persists user message (current: two separate DB calls, no transaction)
- Test: POST when createMessage fails, orphaned conversation still exists (characterize the bug)

**File to create**: `src/app/[locale]/(auth)/dashboard/__tests__/dashboard-preferences.test.ts`
- Test: Dashboard page auto-creates user preferences on first load
- Test: Dashboard page does not duplicate preferences if they already exist

### Step 2: Fix share link accessCount with SQL atomic increment (F-071)
**Addresses**: F-071 (P1, confidence 90)
**File**: `src/app/api/share/[token]/route.ts` (lines 58-68)

Replace the read-then-write pattern:
```typescript
// BEFORE (race condition):
.set({ accessCount: link.accessCount + 1, updatedAt: now })

// AFTER (atomic):
import { sql } from 'drizzle-orm';
.set({ accessCount: sql`${shareableLinks.accessCount} + 1`, updatedAt: now })
```

This is a single-line change. The `sql` template literal generates a SQL expression `access_count + 1` that runs atomically in the database, eliminating the lost-update race condition.

### Step 3: Fix username uniqueness TOCTOU race (F-074)
**Addresses**: F-074 (P2, confidence 92)
**File**: `src/app/api/profile/update-username/route.ts` (lines 50-88)

The current code has a check-then-write pattern (lines 54-63) that races. The UNIQUE constraint on `userPreferences.username` provides a safety net, but constraint violations (PostgreSQL error code `23505`) fall through to the generic `catch` block at line 91 and return a 500 instead of the proper 409.

**Fix**: Wrap the update/insert in a try-catch that detects `23505` constraint violations and returns `usernameTakenError()`:
```typescript
try {
  if (profile) {
    await db.update(userPreferences).set({ username, updatedAt: new Date() })
      .where(eq(userPreferences.userId, user.id));
  } else {
    await db.insert(userPreferences).values({ userId: user.id, username, emailNotifications: true, language: 'en' });
  }
} catch (dbError: unknown) {
  const code = (dbError as Record<string, unknown>)?.code;
  if (code === '23505') {
    return usernameTakenError();
  }
  throw dbError; // re-throw for outer catch
}
```

The explicit check (lines 54-63) can optionally remain as a fast-path that avoids a DB write in the common case, but the constraint catch is the authoritative guard.

### Step 4: Fix user preferences auto-creation race (F-076)
**Addresses**: F-076 (P2, confidence 88)
**File**: `src/app/[locale]/(auth)/dashboard/page.tsx` (lines 23-36)

Replace the check-then-insert with an upsert using `onConflictDoNothing`:
```typescript
// BEFORE (race condition on concurrent dashboard loads):
const existingPreferences = await db.select()...
if (existingPreferences.length === 0) {
  await db.insert(userPreferences).values({...});
}

// AFTER (idempotent):
await db.insert(userPreferences)
  .values({ userId: user.id, emailNotifications: true, language: locale as 'en' | 'hi' | 'bn' })
  .onConflictDoNothing({ target: userPreferences.userId });
```

This eliminates the race condition where two simultaneous tabs could both pass the `length === 0` check and both attempt to insert, causing a UNIQUE constraint violation on `userId`.

### Step 5: Wrap conversation creation + user message in transaction (F-075)
**Addresses**: F-075 (P2, confidence 90)
**File**: `src/app/api/chat/vercel/route.ts` (lines 136-173)

The current code creates a conversation (line 139) then persists a user message (line 160) as two independent DB operations. If the message insert fails, an orphaned conversation with no messages is left behind.

**Fix**: Use `db.transaction()` (existing pattern in `src/app/api/admin/feedback/bulk/route.ts` lines 39-44):
```typescript
import { db } from '@/libs/DB';

// Inside the else branch (new conversation path):
const { activeConversationId: txConversationId, messageError } = await db.transaction(async (tx) => {
  const [newConv] = await tx.insert(vercelConversations).values({
    userId: user.id, title, lastMessagePreview: null, archived: false,
  }).returning();

  if (!newConv) throw new Error('Failed to create conversation');

  const [msg] = await tx.insert(vercelMessages).values({
    conversationId: newConv.id, role: 'user', content: message,
  }).returning();

  return { activeConversationId: newConv.id, messageError: msg ? null : 'message insert returned empty' };
});
```

**Important**: This requires importing `vercelConversations` and `vercelMessages` from Schema directly (for the `tx.insert` calls), rather than using the query helper functions which use the global `db` instance. The query helpers `createConversation` and `createMessage` cannot participate in a transaction because they each use their own `db` reference.

**Alternative (simpler)**: Keep the existing `createConversation` + `createMessage` pattern but add cleanup: if `createMessage` fails, delete the orphaned conversation. This avoids the need to refactor the query helpers but is less atomically correct. The transaction approach is preferred.

For the existing-conversation path (line 123-157), the user message persist is already best-effort (line 172: "Continue anyway"), so no transaction is needed there.

### Step 6: Make userId required in conversation query functions (F-078)
**Addresses**: F-078 (P2, confidence 82)
**File**: `src/libs/queries/vercelConversations.ts`

Change the `userId` parameter from optional to required in three functions:

1. **`getConversationById`** (line 53): `userId?: string` -> `userId: string`
2. **`updateConversation`** (line 151): `userId?: string` -> `userId: string`
3. **`deleteConversation`** (line 273): `userId?: string` -> `userId: string`

Remove the conditional `whereClause` logic (lines 62-64, 174-175, 283-284) -- always filter by both `conversationId` AND `userId`.

**Callers that need updating**:

| Caller File | Function | Current userId Arg | Action |
|---|---|---|---|
| `src/app/api/chat/vercel/route.ts:125` | `getConversationById(supabase, conversationId, user.id)` | Already passes `user.id` | No change needed |
| `src/app/api/chat/vercel/route.ts:248` | `updateConversation(supabase, activeConversationId, {...}, user.id)` | Already passes `user.id` | No change needed |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:61` | `getConversationById(supabase, id, user.id)` | Already passes `user.id` | No change needed |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:149` | `updateConversation(supabase, id, {...}, user.id)` | Already passes `user.id` | No change needed |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:216` | `deleteConversation(supabase, id, user.id)` | Already passes `user.id` | No change needed |
| `src/libs/mem0/worker.ts:72` | `getConversationById(supabase, job.conversationId)` | **Missing userId** | Must add `conversation.userId` or use a new admin-level function |

**Special case -- `worker.ts`**: The memory extraction worker at `src/libs/mem0/worker.ts:72` calls `getConversationById` without a userId because it is a background job that processes jobs for any user. Two options:
- **Option A (recommended)**: Create a separate `getConversationByIdAdmin(conversationId: string)` function that does not filter by userId, clearly documented as admin-only.
- **Option B**: Pass a known userId. But the worker doesn't know the userId upfront (it discovers it from the conversation record).

Go with Option A: add a new `getConversationByIdAdmin` function and update the worker to use it.

**Test updates**: Update existing tests in `src/libs/queries/__tests__/vercelConversations.test.ts`:
- Lines 77, 181, 212, 223: These call functions without userId -- update to always pass a userId.
- Add new test: Verify that passing an incorrect userId returns `null` (ownership enforcement).

### Step 7: Add FK constraints on memory tables (F-072)
**Addresses**: F-072 (P1, confidence 90)
**File**: `src/models/Schema.ts` (lines 213, 237)

Add foreign key references:
```typescript
// mem0Memories.conversationId (line 213):
conversationId: uuid('conversation_id')
  .references(() => vercelConversations.id, { onDelete: 'set null' }),

// memoryExtractionJobs.conversationId (line 237):
conversationId: uuid('conversation_id')
  .notNull()
  .references(() => vercelConversations.id, { onDelete: 'cascade' }),
```

**Rationale for onDelete behavior**:
- `mem0Memories`: Use `set null` because memories have standalone value even if the originating conversation is deleted.
- `memoryExtractionJobs`: Use `cascade` because pending extraction jobs are meaningless without the conversation they reference.

After editing Schema.ts, run `npm run db:generate` to auto-generate the migration file. Do NOT manually create migration SQL.

**Impact on existing Schema.test.ts**: The test at `src/models/Schema.test.ts:270-376` inserts `mem0Memories` with arbitrary `conversationId` UUIDs that don't exist in `vercelConversations`. After adding the FK, these tests will fail with FK violations. They must be updated to either:
- Create a conversation first, then reference its ID
- Use `conversationId: null` where the column is nullable

Similarly, `memoryExtractionJobs` tests at lines 380-538 use arbitrary `conversationId` values. These must be updated to insert a conversation first.

### Step 8: Remove redundant btree indexes (F-079)
**Addresses**: F-079 (P3, confidence 90)
**File**: `src/models/Schema.ts`

Remove two redundant indexes:

1. **`shareableLinks.tokenIdx`** (line 174): `index('idx_shareable_links_token').on(table.token)` -- redundant with `token: text('token').notNull().unique()` on line 159, which already creates a unique btree index.

2. **`threads.conversationIdIdx`** (line 45): `index('idx_threads_conversation_id').on(table.conversationId)` -- redundant with `conversationId: text('conversation_id').notNull().unique()` on line 32, which already creates a unique btree index.

After editing Schema.ts, run `npm run db:generate` to auto-generate the migration. Combine with step 7's migration generation (run `db:generate` once after both schema edits).

## Related Findings

### F-071: Race condition on accessCount increment (read-then-write)
- **Severity**: P1
- **File**: `src/app/api/share/[token]/route.ts`
- **Line**: 61-68
- **Description**: Share link counter reads current value, increments in JS, writes back. Concurrent requests lose updates.
- **Suggestion**: Use SQL atomic increment: `sql\`${shareableLinks.accessCount} + 1\``.

### F-072: Missing foreign key constraints on inter-table relationships
- **Severity**: P1
- **File**: `src/models/Schema.ts`
- **Line**: 50-77 (finding line reference is stale -- actual locations are lines 213 and 237)
- **Description**: `mem0Memories.conversationId` and `memoryExtractionJobs.conversationId` have no FK to `vercelConversations.id`. Orphaned records accumulate on deletion.
- **Suggestion**: Add FK references with onDelete cascade/set null.

### F-074: TOCTOU race condition in username uniqueness check
- **Severity**: P2
- **File**: `src/app/api/profile/update-username/route.ts`
- **Line**: 50-88
- **Description**: Check-then-write for username. UNIQUE constraint provides safety net but constraint violation falls through to generic 500.
- **Suggestion**: Catch constraint violation error (code 23505) and return 409. Or use `onConflictDoNothing()`.

### F-075: Multi-step chat mutation without transaction wrapping
- **Severity**: P2
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 136-173 (new conversation creation + message persist)
- **Description**: Conversation creation + user message persistence not wrapped in transaction. Partial failure creates orphaned conversations.
- **Suggestion**: Wrap steps in `db.transaction()`.

### F-076: Race condition on user preferences auto-creation
- **Severity**: P2
- **File**: `src/app/[locale]/(auth)/dashboard/page.tsx`
- **Line**: 23-36
- **Description**: Check-then-insert on every dashboard load. Two simultaneous tabs cause UNIQUE constraint violation producing 500 error.
- **Suggestion**: Use `.onConflictDoNothing({ target: userPreferences.userId })`.

### F-078: Optional userId parameter creates authorization bypass risk
- **Severity**: P2
- **File**: `src/libs/queries/vercelConversations.ts`
- **Line**: 47-67 (getConversationById), 147-199 (updateConversation), 270-306 (deleteConversation)
- **Description**: `getConversationById`, `updateConversation`, `deleteConversation` accept optional userId. Omission bypasses ownership filtering.
- **Suggestion**: Make userId required. Create separate admin functions if needed.

### F-079: Redundant btree index on columns with UNIQUE constraint
- **Severity**: P3
- **File**: `src/models/Schema.ts`
- **Line**: 174 (shareableLinks.tokenIdx), 45 (threads.conversationIdIdx)
- **Description**: `shareableLinks.token` and `threads.conversationId` have both UNIQUE constraint and explicit btree index. PostgreSQL UNIQUE already creates an index.
- **Suggestion**: Remove redundant explicit indexes.

## Affected Files (Validated)

All files verified to exist in the codebase:

- `src/app/api/share/[token]/route.ts` -- F-071 fix (atomic increment)
- `src/app/api/profile/update-username/route.ts` -- F-074 fix (catch 23505)
- `src/app/[locale]/(auth)/dashboard/page.tsx` -- F-076 fix (onConflictDoNothing)
- `src/app/api/chat/vercel/route.ts` -- F-075 fix (transaction wrapping)
- `src/libs/queries/vercelConversations.ts` -- F-078 fix (required userId)
- `src/models/Schema.ts` -- F-072 fix (FK constraints), F-079 fix (redundant indexes)
- `src/libs/mem0/worker.ts` -- Caller of getConversationById without userId (needs new admin function)
- `src/app/api/chat/vercel/conversations/[id]/route.ts` -- Caller of conversation queries (already passes userId, no change needed)
- `src/libs/queries/__tests__/vercelConversations.test.ts` -- Existing tests that need updating for required userId
- `src/models/Schema.test.ts` -- Existing schema tests that need updating after FK constraints are added

## Test Requirements

### Tests Before (Characterization)

**1. Share link access count** -- `src/app/api/share/__tests__/share-token-route.test.ts`
```
npm test -- --run src/app/api/share/__tests__/share-token-route.test.ts
```
- Mock `db` similar to pattern in `src/libs/queries/__tests__/vercelConversations.test.ts`
- Test: GET with valid token calls `db.update().set({ accessCount: link.accessCount + 1 })` (characterizes the read-then-write bug)
- Test: GET with expired token returns 410 (Gone)
- Test: GET with nonexistent token returns 410 (Gone)
- Test: PATCH requires auth, returns 401 without session

**2. Username update** -- `src/app/api/profile/__tests__/update-username-route.test.ts`
```
npm test -- --run src/app/api/profile/__tests__/update-username-route.test.ts
```
- Test: PATCH with already-taken username returns 409 (existing explicit check works)
- Test: PATCH when DB update throws `{ code: '23505' }` returns 500 (characterizes the bug -- constraint violation not caught)
- Test: PATCH with valid unique username updates successfully, returns 200

**3. Conversation queries** -- Update `src/libs/queries/__tests__/vercelConversations.test.ts`
```
npm test -- --run src/libs/queries/__tests__/vercelConversations.test.ts
```
- Existing test at line 77 calls `getConversationById(mockSupabase, 'conv-1')` without userId -- characterizes the bypass
- Existing tests at lines 181, 212, 223 call `updateConversation`/`deleteConversation` without userId -- characterizes the bypass

**4. Dashboard preferences** -- `src/app/[locale]/(auth)/dashboard/__tests__/dashboard-preferences.test.ts`
```
npm test -- --run "src/app/\\[locale\\]/\\(auth\\)/dashboard/__tests__/dashboard-preferences.test.ts"
```
- Test: When no preferences exist, `db.insert(userPreferences).values(...)` is called (characterizes the check-then-insert pattern)
- Test: When preferences already exist, no insert is attempted

**5. Vercel chat route transaction** -- `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts`
```
npm test -- --run src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts
```
- Test: POST with new conversation calls `createConversation` then `createMessage` as separate operations (characterizes no-transaction)
- Test: POST when `createMessage` fails, conversation still exists in DB (characterizes the orphan bug)

### Tests After (Verification)

**1. Share link atomic increment** -- Update `src/app/api/share/__tests__/share-token-route.test.ts`
- Test: GET calls `db.update().set()` with an SQL expression (not a plain number) -- verify the `sql` template is used
- Test: Verify the `.set()` argument contains a SQL fragment for `accessCount` (e.g., mock inspection shows `sql` usage rather than `link.accessCount + 1`)

**2. Username constraint handling** -- Update `src/app/api/profile/__tests__/update-username-route.test.ts`
- Test: When DB update throws `{ code: '23505' }`, response is 409 with `USERNAME_TAKEN` code (no longer 500)
- Test: When DB update throws non-23505 error, response is still 500

**3. Conversation queries require userId** -- Update `src/libs/queries/__tests__/vercelConversations.test.ts`
- Test: TypeScript compilation fails if userId is omitted (verified by TS compile, not a runtime test)
- Test: `getConversationById(supabase, 'conv-1', 'user-1')` always includes both conditions in WHERE clause
- Test: `getConversationById(supabase, 'conv-1', 'wrong-user')` returns null
- Test: `updateConversation(supabase, 'conv-1', { title: 'x' }, 'user-1')` always includes userId filter
- Test: `deleteConversation(supabase, 'conv-1', 'user-1')` always includes userId filter
- Test: New `getConversationByIdAdmin('conv-1')` exists and does NOT filter by userId (for worker)

**4. Dashboard preferences idempotent** -- Update `src/app/[locale]/(auth)/dashboard/__tests__/dashboard-preferences.test.ts`
- Test: `db.insert(userPreferences).values(...).onConflictDoNothing(...)` is called (single operation, no select-then-insert)
- Test: No error is thrown even if preferences already exist

**5. Chat transaction atomicity** -- Update `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts`
- Test: `db.transaction()` is called when creating a new conversation
- Test: Both conversation insert and message insert happen inside the transaction callback
- Test: If message insert fails inside transaction, conversation is NOT persisted (rollback)

**6. Schema FK constraints** -- Update `src/models/Schema.test.ts`
- Test: Inserting `mem0Memories` with a non-existent `conversationId` throws FK violation
- Test: Inserting `memoryExtractionJobs` with a non-existent `conversationId` throws FK violation
- Test: Deleting a conversation sets `mem0Memories.conversationId` to null (onDelete: set null)
- Test: Deleting a conversation cascades to `memoryExtractionJobs` (onDelete: cascade)
- Update existing tests (lines 270-538) to create conversations before referencing their IDs

**7. Redundant index removal** -- No dedicated test needed. The `npm run db:generate` migration will handle this. Verify by inspecting the generated migration SQL.

**Run all tests**:
```
npm test
```

## Enrichment Notes
- **UI Changes**: false -- All changes are backend (API routes, DB schema, query layer). No frontend components or styles are modified.
- **Stale Files Removed**: None. All files in the theme exist. F-072's line references (50-77) pointed to the `threads` and `userPreferences` tables rather than `mem0Memories`/`memoryExtractionJobs` -- the actual targets are at lines 208-252 in Schema.ts.
- **Gaps Found**:
  - **Worker.ts caller gap**: F-078's suggestion to "make userId required" does not account for `src/libs/mem0/worker.ts:72` which legitimately calls `getConversationById` without a userId. Step 6 now includes creating a `getConversationByIdAdmin` function to address this.
  - **Schema.test.ts breakage**: F-072's FK additions will break 12+ existing schema tests that insert `mem0Memories` and `memoryExtractionJobs` with arbitrary conversationId values. Step 7 now documents the required test updates.
  - **Transaction implementation complexity**: F-075's suggestion to "wrap in db.transaction()" is simple conceptually but requires importing schema tables directly in the route file and bypassing the query helper functions (which use the global `db` instance, not the transaction `tx`). Step 5 details the concrete approach.
