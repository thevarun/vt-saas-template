# Implementation Brief: T-007 — Strengthen Type Safety Across Chat and Query Layers

## Theme Metadata
- **ID**: T-007
- **Name**: Strengthen Type Safety Across Chat and Query Layers
- **Effort**: M
- **Risk**: MEDIUM
- **Coverage Gate**: REQUIRED
- **Blast Radius**: MODERATE
- **Warnings**: None

## Enriched Implementation Steps

### Step 1: Write characterization tests for current type shapes (tests_before)
**Addresses**: Coverage gate prerequisite for F-061, F-066, F-067, F-069

Create characterization tests that document the current return shapes of query functions, `parseSSEEvent`, `MemoryJob`, and `VercelMessage` before refactoring.

**Files to create**:
- `src/libs/queries/__tests__/vercelConversations.test.ts` -- test all 5 functions return `{ data, error }` shape
- `src/libs/queries/__tests__/vercelMessages.test.ts` -- test all 3 functions return `{ data, error }` shape
- `src/libs/queries/__tests__/memoryJobs.test.ts` -- test all 4 functions return correct shapes
- `src/libs/dify/__tests__/parseSSEEvent.test.ts` -- test `parseSSEEvent` returns parsed objects

Use the same mocking pattern as existing `src/libs/queries/__tests__/feedback.test.ts` (mock `@/libs/DB` with chainable query builder, mock `@/libs/Logger`, mock `@sentry/nextjs`).

**Run**: `npm test -- --run src/libs/queries/__tests__/vercelConversations.test.ts src/libs/queries/__tests__/vercelMessages.test.ts src/libs/queries/__tests__/memoryJobs.test.ts src/libs/dify/__tests__/parseSSEEvent.test.ts`

### Step 2: Define `DbQueryError` type and replace `error: any` in all query return types
**Addresses**: F-061

Define a shared `DbQueryError` type in a new file `src/libs/queries/types.ts`:

```typescript
export type DbQueryError = {
  code?: string
  message: string
  detail?: string
}
```

Update these files to import and use `DbQueryError` instead of `any`:
- `src/libs/queries/vercelConversations.ts` -- 5 functions, all return `Promise<{ data: T | null; error: any }>`. Change `error: any` to `error: DbQueryError | null`.
- `src/libs/queries/vercelMessages.ts` -- 3 functions, same pattern. Change `error: any` to `error: DbQueryError | null`.
- `src/libs/queries/memoryJobs.ts` -- `createMemoryJob` and `updateJobStatus` return `error: any`. Change to `error: DbQueryError | null`.

In the catch blocks of these files, wrap the caught error to conform to `DbQueryError`:
```typescript
} catch (error: unknown) {
  const dbError: DbQueryError = {
    message: error instanceof Error ? error.message : String(error),
    code: (error as Record<string, unknown>)?.code as string | undefined,
    detail: (error as Record<string, unknown>)?.detail as string | undefined,
  }
  // ...
  return { data: null, error: dbError }
}
```

Also fix the inline `updateData: any` declarations:
- `src/libs/queries/vercelConversations.ts` line 155: `const updateData: any = { updatedAt: new Date() }` -- change to `const updateData: Partial<typeof vercelConversations.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() }`
- `src/libs/queries/vercelMessages.ts` line 170: `const updateData: any = {}` -- change to typed partial
- `src/libs/queries/memoryJobs.ts` line 155: `const updates: any = { status }` -- change to typed partial

**Downstream impact**: The `logDbError` function in `src/libs/api/errors/logger.ts` (line 250) accepts `error: any`. Update its signature to `error: DbQueryError | unknown` for compatibility. Callers in conversation route files (`src/app/api/chat/vercel/conversations/route.ts`, `src/app/api/chat/vercel/conversations/[id]/route.ts`, `src/app/api/threads/route.ts`, `src/app/api/threads/[id]/route.ts`) access `.message` on db errors -- these will work correctly with `DbQueryError`.

### Step 3: Verify TrendData consolidation (F-065)
**Addresses**: F-065

**NOTE**: F-065 was already addressed by T-005. Verify current state:
- `src/libs/utils/calculateTrend.ts` defines the canonical `TrendData` with `{ percentage, direction, isPositive }` (confirmed).
- `src/libs/api/admin/analytics.ts` re-exports via `export type { TrendData } from '@/libs/utils/calculateTrend'` (confirmed).
- `src/components/admin/analytics/AnalyticsMetricCard.tsx` imports from `@/libs/utils/calculateTrend` (confirmed).

All three files now use the single canonical type. **Mark F-065 as already resolved. No action needed.**

### Step 4: Define `MemoryJobStatus` union type
**Addresses**: F-066

In `src/libs/queries/memoryJobs.ts`:
1. Define: `export type MemoryJobStatus = 'pending' | 'processing' | 'completed' | 'failed'`
2. Change `MemoryJob.status` from `string` to `MemoryJobStatus` (line 29)
3. Change `updateJobStatus` parameter `status: string` to `status: MemoryJobStatus` (line 151)
4. The string comparisons on lines 163 (`status === 'completed' || status === 'failed'`) will continue to work correctly with the union type.

**Downstream callers to verify**:
- `src/app/api/cron/memory-extraction/route.ts` -- calls `updateJobStatus` with string literals, will type-check correctly
- `src/libs/mem0/worker.ts` -- likely calls with string literals, verify

### Step 5: Change `VercelMessage.role` from `string` to `MessageRole`
**Addresses**: F-067

In `src/libs/queries/vercelMessages.ts`:
1. `MessageRole` is already imported (line 14): `import type { MessageMetadata, MessageRole } from '@/libs/vercel-ai/types'`
2. Change `VercelMessage.role` type from `string` to `MessageRole` (line 23)
3. The `createMessage` function already accepts `role: MessageRole` (line 46), so this aligns the output type with the input type.

**Downstream callers**: Any code that reads `VercelMessage.role` and casts to `'user' | 'assistant' | 'system'` can remove the cast. Check `src/app/api/chat/vercel/conversations/[id]/route.ts` for usage.

### Step 6: Define Zod schema for Vercel chat request body and remove `(m: any)` annotations
**Addresses**: F-062

In `src/app/api/chat/vercel/route.ts`:

1. Define Zod schemas at the top of the file:
```typescript
const chatMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
})

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().optional(),
  parts: z.array(chatMessagePartSchema).optional(),
})

const vercelChatRequestSchema = z.object({
  message: z.string().optional(),
  messages: z.array(chatMessageSchema).optional(),
  conversationId: z.string().uuid().optional().nullable(),
})
```

2. Replace `const body = await request.json()` with Zod parsing:
```typescript
const rawBody = await request.json()
const parseResult = vercelChatRequestSchema.safeParse(rawBody)
if (!parseResult.success) {
  return invalidRequestError('Invalid request body')
}
const body = parseResult.data
```

3. Remove all 4 `(m: any)` and `(p: any)` annotations on lines 64, 66, 175-179. After Zod parsing, TypeScript infers the correct types:
   - Line 64: `.find((m: any) => m.role === 'user')` -- `m` is now typed from `chatMessageSchema`
   - Line 66: `.find((p: any) => p.type === 'text')` -- `p` is now typed from `chatMessagePartSchema`
   - Lines 175-179: `.filter((m: any) => ...)` and `.map((m: any) => ...)` -- same fix

### Step 7: Change `catch (error: any)` to `catch (error: unknown)` with instanceof narrowing
**Addresses**: F-063

Files to update (chat routes only, per finding scope):

**`src/app/api/chat/vercel/route.ts`** (line 292):
```typescript
} catch (error: unknown) {
  const errMessage = error instanceof Error ? error.message : String(error)
  const errCode = (error instanceof Error && 'code' in error) ? (error as { code: string }).code : undefined
  const errStatus = (error instanceof Error && 'status' in error) ? (error as { status: number }).status : undefined

  logApiError(error, {
    endpoint: '/api/chat/vercel',
    method: 'POST',
    errorCode: errCode || 'INTERNAL_ERROR',
    statusCode: errStatus || 500,
  })

  if (errMessage?.includes('API key')) { ... }
  if (errMessage?.includes('timeout')) { ... }
  if (errMessage?.includes('rate limit')) { ... }
  return internalError()
}
```

Also fix the inner catch blocks (lines 275, 283):
- `.catch((error: any) => ...)` to `.catch((error: unknown) => ...)`

**`src/app/api/chat/route.ts`** (lines 114, 235):
- Line 114: `catch (error: any)` in `createOrUpdateThread` -- change to `catch (error: unknown)`, use `error instanceof Error ? error.message : 'Unknown error'` for the breadcrumb data.
- Line 235: `catch (error: any)` in main POST handler -- change to `catch (error: unknown)`, narrow with instanceof for `.code`, `.status`, `.message` access.

**Additional `catch (error: any)` in scope** (query files -- already handled by Step 2):
- All catch blocks in `vercelConversations.ts`, `vercelMessages.ts`, `memoryJobs.ts` are changed as part of Step 2.

**Additional conversation route files** (related callers):
- `src/app/api/chat/vercel/conversations/route.ts` line 71
- `src/app/api/chat/vercel/conversations/[id]/route.ts` lines 96, 173, 240
- `src/app/api/threads/route.ts` lines 65, 141
- `src/app/api/threads/[id]/route.ts` lines 93, 158
- `src/app/api/cron/memory-extraction/route.ts` line 83
- `src/app/api/chat/messages/route.ts` line 49

All these use the pattern `catch (error: any) { logApiError(error, {...}); return internalError() }`. Since `logApiError` already accepts `Error | unknown`, changing to `catch (error: unknown)` requires no other changes in these files.

### Step 8: Replace `any` fields in Dify types with `unknown` or structural types
**Addresses**: F-064

In `src/libs/dify/types.ts`:

1. `DifyChatRequest.inputs` (line 11): Change `Record<string, any>` to `Record<string, unknown>`. Check `src/libs/dify/client.ts` line 49 and `src/app/api/chat/route.ts` line 174 which pass `inputs: {}` -- compatible.

2. `DifyMetadata` (lines 27-28):
   - `annotation_reply: any` -> `annotation_reply: unknown`
   - `retriever_resources: any[]` -> `retriever_resources: unknown[]`

3. `DifyMessage` (lines 72-80):
   - `inputs: Record<string, any>` -> `inputs: Record<string, unknown>`
   - `message_files: any[]` -> `message_files: unknown[]`
   - `feedback: any | null` -> `feedback: unknown`
   - `retriever_resources: any[]` -> `retriever_resources: unknown[]`
   - `agent_thoughts: any[]` -> `agent_thoughts: unknown[]`
   - `message_metadata: any` -> `message_metadata: unknown`

These fields are not accessed in the codebase beyond being passed through, so `unknown` is safe and accurate.

### Step 9: Change `parseSSEEvent` return type to `DifyStreamEvent | null`
**Addresses**: F-069

In `src/app/api/chat/route.ts` (line 27):
1. Change the return type: `function parseSSEEvent(chunk: string): DifyStreamEvent | null`
2. Add import: `import type { DifyStreamEvent } from '@/libs/dify/types'` (DifyChatRequest is already imported)
3. Cast the `JSON.parse` result: `return JSON.parse(jsonStr) as DifyStreamEvent`
4. Downstream: The `event` variable on line 192 will now be typed as `DifyStreamEvent | null`, giving type-safe access to `event.conversation_id`, `event.answer`, etc.

### Step 10: Fix `difyError` function signature
**Gap found**: `src/libs/api/errors/responses.ts` line 109 has `details?: Record<string, any>`. Change to `details?: Record<string, unknown>` for consistency with the `ApiErrorResponse` type which already uses `Record<string, unknown>`.

## Related Findings

### F-061: Error return type is `any` throughout all DB query functions
- **Severity**: P1
- **File**: `src/libs/queries/vercelConversations.ts`
- **Line**: 51, 97, 147, 214, 267
- **Description**: Every function returns `Promise<{ data: T | null; error: any }>`. Callers access error.code, error.message without any type checking.
- **Suggestion**: Define `DbQueryError = { code?: string; message: string; detail?: string }` and use throughout.

### F-062: Inline `any` annotations on message/part arrays bypass type-checking of AI SDK request body
- **Severity**: P1
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 111, 114, 226, 229
- **Description**: Parsed body.messages iterated with `(m: any)` and `(p: any)` four times. No validation means malformed payloads produce empty messages silently.
- **Suggestion**: Define Zod schema for request formats. Remove all `(m: any)` annotations.

### F-063: catch blocks typed as `any` access .code, .status, .message unsafely
- **Severity**: P1
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 363, 344, 352
- **Description**: `catch (error: any)` then accesses properties directly. Non-Error throws produce undefined comparisons that silently fall through.
- **Suggestion**: Use `catch (error: unknown)` and narrow with instanceof Error.

### F-064: Multiple `any` fields in Dify API types propagate unsafety through chat flow
- **Severity**: P1
- **File**: `src/libs/dify/types.ts`
- **Line**: 27-28, 75-80
- **Description**: annotation_reply, retriever_resources, message_files, feedback, agent_thoughts, message_metadata all typed `any` or `any[]`.
- **Suggestion**: Replace with `unknown` or define structural types from Dify API docs.

### F-065: TrendData type defined three times with incompatible shapes
- **Severity**: P2
- **File**: `src/libs/api/admin/analytics.ts`
- **Line**: 7-11
- **Description**: TrendData in analytics.ts has `value: string`, in calculateTrend.ts has `isPositive: boolean`, in AnalyticsMetricCard.tsx has `value: string`. Structurally incompatible.
- **Suggestion**: Consolidate to single canonical TrendData. Delete duplicates.
- **Status**: ALREADY RESOLVED by T-005. All three files now import from the single canonical `src/libs/utils/calculateTrend.ts`.

### F-066: MemoryJob.status typed as string despite four known literal values
- **Severity**: P2
- **File**: `src/libs/queries/memoryJobs.ts`
- **Line**: 29, 151
- **Description**: Status should be 'pending' | 'processing' | 'completed' | 'failed'. TypeScript can't warn if caller passes 'done'.
- **Suggestion**: Define MemoryJobStatus union type.

### F-067: VercelMessage.role typed as string when MessageRole union exists
- **Severity**: P2
- **File**: `src/libs/queries/vercelMessages.ts`
- **Line**: 23
- **Description**: Requires unsafe `as 'user' | 'assistant' | 'system'` casts at multiple callsites.
- **Suggestion**: Change to MessageRole type from @/libs/vercel-ai/types.

### F-069: parseSSEEvent returns Record<string, any> instead of DifyStreamEvent
- **Severity**: P2
- **File**: `src/app/api/chat/route.ts`
- **Line**: 47
- **Description**: All property accesses on parsed events are untyped despite DifyStreamEvent being well-defined.
- **Suggestion**: Change return type to DifyStreamEvent | null.

## Affected Files (Validated)

All files exist and are current:

- `src/libs/queries/vercelConversations.ts` -- F-061: `error: any` in 5 functions, `updateData: any`
- `src/libs/queries/vercelMessages.ts` -- F-061, F-067: `error: any` in 3 functions, `updateData: any`, `role: string`
- `src/libs/queries/memoryJobs.ts` -- F-061, F-066: `error: any` in 4 functions, `updates: any`, `status: string`
- `src/libs/queries/types.ts` -- NEW FILE: `DbQueryError` and `MemoryJobStatus` type definitions
- `src/libs/dify/types.ts` -- F-064: 8 fields typed `any`
- `src/app/api/chat/vercel/route.ts` -- F-062, F-063: `(m: any)`, `(p: any)`, `catch (error: any)`
- `src/app/api/chat/route.ts` -- F-063, F-069: `catch (error: any)`, `parseSSEEvent` return type
- `src/libs/api/errors/responses.ts` -- Gap: `difyError` param `details?: Record<string, any>`
- `src/libs/api/errors/logger.ts` -- Downstream: `logDbError` param `error: any`
- `src/libs/api/admin/analytics.ts` -- F-065: verified already resolved
- `src/components/admin/analytics/AnalyticsMetricCard.tsx` -- F-065: verified already resolved
- `src/app/api/chat/vercel/conversations/route.ts` -- catch block `error: any`
- `src/app/api/chat/vercel/conversations/[id]/route.ts` -- 3 catch blocks `error: any`
- `src/app/api/threads/route.ts` -- 2 catch blocks `error: any`, `(dbInsertError as any)?.code` cast
- `src/app/api/threads/[id]/route.ts` -- 2 catch blocks `error: any`, `(dbDeleteError as any)?.code` and `(dbUpdateError as any)?.code` casts
- `src/app/api/cron/memory-extraction/route.ts` -- catch block `error: any`
- `src/app/api/chat/messages/route.ts` -- catch block `error: any`

## Test Requirements

### Tests Before (Characterization)

**File**: `src/libs/queries/__tests__/vercelConversations.test.ts`
- Mock `@/libs/DB` with chainable query builder (pattern from `feedback.test.ts`)
- Mock `@sentry/nextjs` with `{ addBreadcrumb: vi.fn(), captureException: vi.fn() }`
- Mock `@/libs/Logger` with `{ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }`
- Test `getConversationById` returns `{ data: <object>, error: null }` on success
- Test `getConversationById` returns `{ data: null, error: <object> }` on DB throw
- Test `createConversation` returns `{ data: <object>, error: null }` on success
- Test `listUserConversations` returns `{ data: <array>, error: null }` on success
- Test `deleteConversation` returns `{ data: <object>, error: null }` on success
- Test `updateConversation` returns `{ data: <object>, error: null }` on success

**File**: `src/libs/queries/__tests__/vercelMessages.test.ts`
- Same mocking pattern
- Test `createMessage` success and error shapes
- Test `getConversationMessages` success and error shapes
- Test `updateMessageMetadata` success and error shapes

**File**: `src/libs/queries/__tests__/memoryJobs.test.ts`
- Same mocking pattern
- Test `createMemoryJob` returns `{ data, error }` shape
- Test `getPendingJobs` returns array on success, empty array on error
- Test `getJobById` returns job or null
- Test `updateJobStatus` returns `{ success, error }` shape

**File**: `src/libs/dify/__tests__/parseSSEEvent.test.ts`
- Extract `parseSSEEvent` for testability or test via the route
- Test returns parsed object for valid `data: {"event":"message","answer":"hello"}`
- Test returns null for malformed SSE data
- Test returns null for empty string

**Run all**: `npm test -- --run src/libs/queries/__tests__/vercelConversations.test.ts src/libs/queries/__tests__/vercelMessages.test.ts src/libs/queries/__tests__/memoryJobs.test.ts src/libs/dify/__tests__/parseSSEEvent.test.ts`

### Tests After (Verification)

**File**: `src/libs/queries/__tests__/vercelConversations.test.ts` (extended)
- Verify error object returned from catch conforms to `DbQueryError` shape: has `message: string`, optional `code`, optional `detail`
- Verify `error.message` is always a string (not `undefined`)

**File**: `src/libs/queries/__tests__/vercelMessages.test.ts` (extended)
- Verify `VercelMessage.role` is typed as `MessageRole` (compile-time check via `@ts-expect-error`)
- Add: `// @ts-expect-error -- role should not accept arbitrary string` test

**File**: `src/libs/queries/__tests__/memoryJobs.test.ts` (extended)
- Verify `MemoryJobStatus` type prevents invalid strings at compile time
- Test `updateJobStatus` with valid status literal values
- Add compile-time assertion: assigning `'done'` to `MemoryJobStatus` should error

**File**: `src/libs/dify/__tests__/parseSSEEvent.test.ts` (extended)
- Verify return type is `DifyStreamEvent | null` (not `Record<string, any>`)
- Test that returned object has `event` field typed correctly

**File**: `src/libs/dify/__tests__/types.test.ts` (new)
- Type-level tests for Dify types using `@ts-expect-error`:
  - `DifyMetadata.annotation_reply` should be `unknown` (not assignable without narrowing)
  - `DifyMessage.feedback` should be `unknown`

**File**: `src/app/api/chat/vercel/__tests__/route.test.ts` (new, optional)
- Test that Zod schema rejects malformed message arrays
- Test that valid AssistantChatTransport format passes validation

**Run all**: `npm test -- --run src/libs/queries/__tests__ src/libs/dify/__tests__`

## Enrichment Notes
- **UI Changes**: false
- **Stale Files Removed**: None
- **Findings Already Resolved**: F-065 (TrendData consolidation was completed by T-005)
- **Gaps Found**:
  - `difyError` in `src/libs/api/errors/responses.ts` has `details?: Record<string, any>` -- not covered by any finding but should be updated to `Record<string, unknown>` for consistency.
  - `logDbError` in `src/libs/api/errors/logger.ts` has `error: any` -- should be updated to `error: DbQueryError | unknown` after the DbQueryError type is defined.
  - `ApiErrorContext.metadata` in `src/libs/api/errors/logger.ts` line 29 uses `Record<string, any>` -- change to `Record<string, unknown>`.
  - `logValidationError` in `src/libs/api/errors/logger.ts` line 155 uses `Record<string, any>` -- change to `Record<string, unknown>`.
  - `(dbInsertError as any)?.code` cast in `src/app/api/threads/route.ts` line 120 and `(dbDeleteError as any)?.code` / `(dbUpdateError as any)?.code` in `src/app/api/threads/[id]/route.ts` lines 78, 142 -- these will resolve naturally once `DbQueryError` type is applied (can access `.code` directly since it's an optional string on the type).
  - Additional catch blocks with `error: any` exist in the conversation and thread route files (listed in Step 7) beyond the originally scoped chat routes.
