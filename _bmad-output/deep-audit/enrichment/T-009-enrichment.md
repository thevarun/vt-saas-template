# Implementation Brief: T-009 — Refactor Vercel Chat Route (Decompose God Function)

## Theme Metadata
- **ID**: T-009
- **Name**: Refactor Vercel Chat Route (Decompose God Function)
- **Effort**: L
- **Risk**: HIGH
- **Coverage Gate**: REQUIRED
- **Blast Radius**: MODERATE
- **Warnings**: None

## Prior Theme Impact Assessment

T-001, T-007, and T-008 have already been applied. Here is what they addressed relative to T-009's scope:

| Sub-task | Status After T-001/T-007/T-008 | Remaining Work |
|---|---|---|
| `withAuth()` HOF exists (T-001) | DONE -- `src/libs/api/middleware/withAuth.ts` created | Vercel chat route does NOT use it yet (still has inline auth). Adopting `withAuth` is optional for T-009 since the route needs `supabase` reference for query calls. |
| Zod validation on request body (T-007) | DONE -- `vercelChatRequestSchema` with `z.object({...})` at route lines 32-47 | No remaining work. |
| `catch (error: unknown)` instead of `error: any` (T-007) | DONE -- route line 324 uses `catch (error: unknown)` | No remaining work. |
| `DbQueryError` type in queries (T-007) | DONE -- `vercelConversations.ts` and `vercelMessages.ts` use `DbQueryError` | No remaining work. |
| `MessageRole` type for role field (T-007) | DONE -- `vercelMessages.ts` line 48 uses `MessageRole` | No remaining work. |
| `userId` required in `getConversationById`/`updateConversation`/`deleteConversation` (T-008) | DONE -- all three functions have `userId: string` as required param | No remaining work for T-009. |
| `getConversationByIdAdmin` created (T-008) | DONE -- exists at `vercelConversations.ts` line 92 | No remaining work. |
| Transaction wrapping for new conversation + message (T-008) | DONE -- route lines 142-161 use `db.transaction()` | No remaining work. |
| **Vestigial `_supabase` parameter (F-025)** | NOT DONE | All functions in both files still accept `_supabase: SupabaseClient` as first param |
| **God function decomposition (F-031)** | NOT DONE | Route is 351 lines, still a single function with mixed concerns |
| **Test coverage (F-050)** | PARTIALLY DONE | Basic test file exists at `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts` with 5 tests. Missing: streaming validation, error categorization, message format parsing, memory integration, fire-and-forget persistence, Zod validation edge cases |
| **Sequential DB calls / latency (F-021)** | NOT DONE | Conversation lookup and memory retrieval are still sequential (lines 126-198) |
| **Dify threads.ts raw Supabase queries (F-026)** | NOT DONE | `src/libs/supabase/threads.ts` still uses raw `supabase.schema().from().select()` |

## Enriched Implementation Steps

### Step 1: Expand test coverage for vercel chat route (coverage gate)
**Addresses**: F-050 (P1, confidence 95)
**File**: `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts`

The existing test file has 5 tests covering auth (401), new conversation transaction, transaction failure, and existing conversation message persistence. The following test cases must be added before any refactoring:

**Zod validation tests** (characterize current behavior):
- Test: POST with empty body returns 400 (Zod rejects missing messages/message)
- Test: POST with `message: ""` returns 400 ("Message is required")
- Test: POST with `message` exceeding 10,000 chars returns 400
- Test: POST with invalid `conversationId` (non-UUID) returns 400
- Test: POST with `messages` array in AssistantChatTransport format extracts last user message correctly
- Test: POST with `messages` array where parts contain text extracts text correctly

**Streaming and AI provider tests**:
- Test: POST returns 200 with response from `streamText().toUIMessageStreamResponse()`
- Test: POST when `isConfigured()` returns false, returns 400 with config error message
- Test: POST when `createAIProvider()` throws API key error, returns 500

**Error categorization tests**:
- Test: POST when outer catch receives timeout error, returns 408 (timeoutError)
- Test: POST when outer catch receives rate limit error, returns 429 (rateLimitError)
- Test: POST when outer catch receives generic error, returns 500 (internalError)

**Memory integration tests**:
- Test: POST calls `getRelevantMemories(user.id, message)` with correct args
- Test: POST when memories are returned, `streamText` receives `system` param with formatted memories
- Test: POST when memories are empty, `streamText` receives `system: undefined`

**Fire-and-forget persistence tests**:
- Test: POST for existing conversation, `createMessage` failure is logged but does not affect response status (still 200)

**Existing conversation ownership test**:
- Test: POST with `conversationId` that `getConversationById` returns null for, returns 400 ("Conversation not found")

```
npm test -- --run src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts
```

### Step 2: Remove vestigial `_supabase` parameter from query functions (F-025)
**Addresses**: F-025 (P1, confidence 95)
**Files**:
- `src/libs/queries/vercelConversations.ts`
- `src/libs/queries/vercelMessages.ts`

Every function in both files accepts `_supabase: SupabaseClient` as its first parameter, yet the parameter is completely unused -- all queries go through the Drizzle `db` singleton. The JSDoc still claims "RLS ensures ownership" which is false since Drizzle bypasses RLS entirely. Ownership is enforced by explicit `userId` WHERE filters (correctly added by T-008).

**Changes to `vercelConversations.ts`**:

| Function | Current Signature | New Signature |
|---|---|---|
| `getConversationById` | `(_supabase: SupabaseClient, conversationId: string, userId: string)` | `(conversationId: string, userId: string)` |
| `createConversation` | `(_supabase: SupabaseClient, userId: string, title: string)` | `(userId: string, title: string)` |
| `updateConversation` | `(_supabase: SupabaseClient, conversationId: string, updates: ConversationUpdate, userId: string)` | `(conversationId: string, updates: ConversationUpdate, userId: string)` |
| `listUserConversations` | `(_supabase: SupabaseClient, userId: string, ...)` | `(userId: string, ...)` |
| `deleteConversation` | `(_supabase: SupabaseClient, conversationId: string, userId: string)` | `(conversationId: string, userId: string)` |

`getConversationByIdAdmin` already does NOT take `_supabase` -- no change needed.

**Changes to `vercelMessages.ts`**:

| Function | Current Signature | New Signature |
|---|---|---|
| `createMessage` | `(_supabase: SupabaseClient, conversationId: string, role: MessageRole, ...)` | `(conversationId: string, role: MessageRole, ...)` |
| `getConversationMessages` | `(_supabase: SupabaseClient, conversationId: string, ...)` | `(conversationId: string, ...)` |
| `updateMessageMetadata` | `(_supabase: SupabaseClient, messageId: string, ...)` | `(messageId: string, ...)` |

**JSDoc updates**: Replace all instances of "RLS ensures ownership" / "Supabase client with user context" with accurate documentation:
- "Authorization: userId WHERE filter enforces ownership at the query level."
- "Authorization: Caller must verify user ownership before calling (no userId filter applied)." (for functions like `getConversationMessages` that don't filter by userId)

Remove the `import type { SupabaseClient } from '@supabase/supabase-js'` from both files since it will be unused.

**Callers that need updating** (remove the `supabase` first argument):

| Caller File | Function Call | Change |
|---|---|---|
| `src/app/api/chat/vercel/route.ts:126` | `getConversationById(supabase, conversationId, user.id)` | `getConversationById(conversationId, user.id)` |
| `src/app/api/chat/vercel/route.ts:178` | `createMessage(supabase, activeConversationId, 'user', message)` | `createMessage(activeConversationId, 'user', message)` |
| `src/app/api/chat/vercel/route.ts:246` | `createMessage(supabase, activeConversationId, 'assistant', ...)` | `createMessage(activeConversationId, 'assistant', ...)` |
| `src/app/api/chat/vercel/route.ts:267` | `updateConversation(supabase, activeConversationId, {...}, user.id)` | `updateConversation(activeConversationId, {...}, user.id)` |
| `src/app/api/chat/vercel/conversations/route.ts:49` | `listUserConversations(supabase, user.id, false, limit, offset)` | `listUserConversations(user.id, false, limit, offset)` |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:61` | `getConversationById(supabase, id, user.id)` | `getConversationById(id, user.id)` |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:80` | `getConversationMessages(supabase, id)` | `getConversationMessages(id)` |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:149` | `updateConversation(supabase, id, {...}, user.id)` | `updateConversation(id, {...}, user.id)` |
| `src/app/api/chat/vercel/conversations/[id]/route.ts:216` | `deleteConversation(supabase, id, user.id)` | `deleteConversation(id, user.id)` |
| `src/libs/mem0/worker.ts:60` | `getConversationMessages(supabase, job.conversationId)` | `getConversationMessages(job.conversationId)` |
| `src/app/[locale]/(auth)/chat/vercel/[conversationId]/page.tsx:31` | `getConversationMessages(supabase, conversationId)` | `getConversationMessages(conversationId)` |

**Test updates**: Update all test files that pass `mockSupabase` as first arg:
- `src/libs/queries/__tests__/vercelConversations.test.ts` -- remove `mockSupabase` from all calls
- `src/libs/queries/__tests__/vercelMessages.test.ts` -- remove `mockSupabase` from all calls
- `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts` -- update mock call expectations
- `tests/integration/api/vercel-conversations.test.ts` -- update mock call expectations

After this step, neither query file imports `SupabaseClient` at all. The Supabase client is only used for auth (in route handlers and middleware), never for data queries.

### Step 3: Extract `parseAndValidateMessages()` from inline message parsing (F-031)
**Addresses**: F-031 (P2, confidence 85) -- partial decomposition
**File**: `src/app/api/chat/vercel/route.ts` (lines 84-107)

Extract the message parsing logic (currently ~25 lines) into a pure function:

```typescript
// New file: src/app/api/chat/vercel/helpers.ts

import type { z } from 'zod';
import type { vercelChatRequestSchema } from './route'; // or co-locate the schema

type ParsedBody = z.infer<typeof vercelChatRequestSchema>;

/**
 * Extract user message text from the validated request body.
 * Supports both simple format ({ message: string }) and
 * AssistantChatTransport format ({ messages: [{role, parts}...] }).
 *
 * @returns The extracted message string, or empty string if none found.
 */
export function extractUserMessage(body: ParsedBody): string {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const lastUserMessage = [...body.messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage?.parts) {
      const textPart = lastUserMessage.parts.find(p => p.type === 'text');
      return textPart?.text ?? '';
    }
    return lastUserMessage?.content ?? '';
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  return '';
}

/**
 * Convert messages array to standard {role, content} format for streamText.
 * Filters out system messages to prevent prompt injection.
 */
export function normalizeMessagesForAI(
  body: ParsedBody,
  fallbackMessage: string,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const ALLOWED_ROLES = new Set(['user', 'assistant']);

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages
      .filter(m => ALLOWED_ROLES.has(m.role))
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          ? m.parts.filter(p => p.type === 'text').map(p => p.text).join('')
          : m.content ?? '',
      }));
  }

  return [{ role: 'user' as const, content: fallbackMessage }];
}
```

Move the Zod schemas (`chatMessagePartSchema`, `chatMessageSchema`, `vercelChatRequestSchema`) to `helpers.ts` as well, since they are validation-only concerns.

This reduces the route's inline logic by ~35 lines and makes the parsing independently testable.

### Step 4: Extract `ensureConversation()` function (F-031)
**Addresses**: F-031 (P2, confidence 85) -- partial decomposition
**File**: `src/app/api/chat/vercel/route.ts` (lines 121-192)

Extract the conversation lookup/creation logic (~70 lines) into a focused function:

```typescript
// In src/app/api/chat/vercel/helpers.ts

import { db } from '@/libs/DB';
import { vercelConversations, vercelMessages } from '@/models/Schema';

type EnsureConversationResult =
  | { ok: true; conversationId: string; isNew: boolean }
  | { ok: false; error: Response };

/**
 * Ensures a valid conversation exists for the chat request.
 * - If conversationId is provided, verifies it exists and belongs to the user.
 * - If not provided, creates a new conversation + first user message atomically.
 */
export async function ensureConversation(
  conversationId: string | undefined,
  userId: string,
  message: string,
): Promise<EnsureConversationResult> {
  if (conversationId) {
    const { data: existing, error } = await getConversationById(conversationId, userId);
    if (error || !existing) {
      return { ok: false, error: invalidRequestError('Conversation not found') };
    }
    return { ok: true, conversationId, isNew: false };
  }

  // Create new conversation + first user message atomically
  const title = message.slice(0, 50) || 'New Conversation';
  const txResult = await db.transaction(async (tx) => {
    const [newConv] = await tx.insert(vercelConversations).values({
      userId, title, lastMessagePreview: null, archived: false,
    }).returning();
    if (!newConv) throw new Error('Failed to create conversation');
    await tx.insert(vercelMessages).values({
      conversationId: newConv.id, role: 'user', content: message,
    });
    return newConv.id;
  });

  return { ok: true, conversationId: txResult, isNew: true };
}
```

The route's main function then becomes:

```typescript
const result = await ensureConversation(conversationId, user.id, message);
if (!result.ok) return result.error;
const { conversationId: activeConversationId, isNew } = result;
```

This eliminates ~70 lines from the main function body.

### Step 5: Extract `persistAssistantResponse()` for post-stream persistence (F-031)
**Addresses**: F-031 (P2, confidence 85) -- partial decomposition
**File**: `src/app/api/chat/vercel/route.ts` (lines 236-321)

Extract the fire-and-forget persistence block (~85 lines) into its own function:

```typescript
// In src/app/api/chat/vercel/helpers.ts

/**
 * Fire-and-forget: persist assistant response, update conversation metadata,
 * log metrics, and queue memory extraction after streaming completes.
 */
export function persistAssistantResponse(params: {
  result: ReturnType<typeof streamText>;
  conversationId: string;
  userId: string;
  startTime: number;
}): void {
  const { result, conversationId, userId, startTime } = params;

  Promise.resolve()
    .then(async () => {
      const finalText = await result.text;
      const finalUsage = await result.usage;
      const rawTokenCount = finalUsage?.totalTokens;
      const tokenCount = (typeof rawTokenCount === 'number' && !Number.isNaN(rawTokenCount)) ? rawTokenCount : null;
      const latencyMs = Date.now() - startTime;

      // Persist assistant message
      const { error: msgError } = await createMessage(conversationId, 'assistant', finalText, { tokenCount, latencyMs });
      if (msgError) {
        logger.error({ error: msgError, conversationId }, 'Failed to persist assistant message');
        Sentry.captureException(msgError);
      }

      // Update conversation metadata
      const { error: updateError } = await updateConversation(conversationId, { lastMessagePreview: finalText.slice(0, 100) }, userId);
      if (updateError) {
        logger.error({ error: updateError, conversationId }, 'Failed to update conversation metadata');
        Sentry.captureException(updateError);
      }

      // Log metrics
      logger.info({ conversationId, tokenCount, latencyMs, textLength: finalText.length }, 'Chat completion successful');

      // Queue memory extraction
      queueMemoryExtraction(conversationId).catch((error: unknown) => {
        logger.error({ error, conversationId }, 'Failed to queue memory extraction');
        Sentry.captureException(error);
      });
    })
    .catch((error: unknown) => {
      logger.error({ error, conversationId }, 'Message persistence failed');
      Sentry.captureException(error);
    });
}
```

### Step 6: Parallelize independent pre-stream DB operations (F-021)
**Addresses**: F-021 (P2, confidence 87)
**File**: `src/app/api/chat/vercel/route.ts` (lines 126-198 after decomposition)

Currently, for **existing** conversations, three operations run sequentially before streaming starts:
1. Conversation lookup (`getConversationById`) -- ~50-100ms
2. User message persistence (`createMessage`) -- ~50-100ms
3. Memory retrieval (`getRelevantMemories`) -- ~50-200ms

After extracting `ensureConversation()` (step 4), the conversation lookup is encapsulated. The parallelization opportunity is between:
- **User message persistence** (for existing conversations) -- can be fire-and-forget
- **Memory retrieval** -- independent of conversation state

**Change for existing conversations**: After `ensureConversation()` returns, parallelize memory retrieval with user message persistence:

```typescript
const result = await ensureConversation(conversationId, user.id, message);
if (!result.ok) return result.error;

// For existing conversations, persist user message in parallel with memory retrieval
const [memories] = await Promise.all([
  getRelevantMemories(user.id, message),
  result.isNew
    ? Promise.resolve() // Already persisted in transaction
    : createMessage(result.conversationId, 'user', message).then(({ error }) => {
        if (error) logger.error({ error, conversationId: result.conversationId }, 'Failed to persist user message');
      }),
]);
```

**Expected improvement**: For existing conversations, this saves ~50-100ms (the overlap of message persist with memory retrieval). For new conversations, the memory retrieval still runs after the transaction -- but we can also move it to overlap:

```typescript
// For new conversations, start memory retrieval immediately (doesn't depend on conversation creation)
const memoriesPromise = getRelevantMemories(user.id, message);
const convResult = await ensureConversation(conversationId, user.id, message);
if (!convResult.ok) return convResult.error;

// ...
const memories = await memoriesPromise; // Already in flight
```

This moves memory retrieval to start as soon as auth is validated, overlapping with all DB operations.

### Step 7: Move existing-conversation user message persistence to fire-and-forget (F-021)
**Addresses**: F-021 (P2, confidence 87)
**File**: `src/app/api/chat/vercel/route.ts`

The current code already treats user message persistence failure as non-blocking (lines 185-191: "Continue anyway - don't block the chat"). But it still `await`s the result. Convert to true fire-and-forget:

```typescript
// Fire-and-forget: don't await, just log errors
if (!result.isNew) {
  createMessage(result.conversationId, 'user', message).then(({ error }) => {
    if (error) logger.error({ error, conversationId: result.conversationId }, 'Failed to persist user message');
  });
}
```

Combined with step 6, this means the only awaited pre-stream operations are:
1. Auth check (~0ms, already cached by middleware)
2. Conversation lookup/creation (essential, cannot skip)
3. Memory retrieval (overlapped with conversation lookup)

### Step 8: Migrate Dify threads.ts from raw Supabase queries to Drizzle ORM (F-026)
**Addresses**: F-026 (P1, confidence 90)
**File**: `src/libs/supabase/threads.ts` -> migrate to `src/libs/queries/threads.ts`

The Dify implementation uses raw Supabase queries (`supabase.schema('vt_saas').from('threads').select('*')`) while the Vercel implementation uses Drizzle ORM. This inconsistency means:
- Different error handling patterns (Supabase returns `{ data, error }` vs Drizzle throws)
- Different auth models (Supabase RLS vs Drizzle userId WHERE filters)
- Different schema references (raw string `'threads'` vs imported `threads` table)

**Migration plan**:

Create `src/libs/queries/threads.ts` with Drizzle-based functions, mirroring the pattern established in `vercelConversations.ts`:

```typescript
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { threads } from '@/models/Schema';
import type { DbQueryError } from './types';
import { toDbQueryError } from './types';

export type Thread = typeof threads.$inferSelect;

export async function getThreadsByUser(
  userId: string,
): Promise<{ data: Thread[] | null; error: DbQueryError | null }> { ... }

export async function getThreadById(
  threadId: string,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> { ... }

export async function getThreadByConversationId(
  conversationId: string,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> { ... }

export async function createThread(
  userId: string,
  input: { conversationId: string; title?: string | null; lastMessagePreview?: string | null },
): Promise<{ data: Thread | null; error: DbQueryError | null }> { ... }

export async function updateThread(
  threadId: string,
  updates: { title?: string; lastMessagePreview?: string; archived?: boolean },
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> { ... }

export async function deleteThread(
  threadId: string,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> { ... }
```

Key differences from current `threads.ts`:
1. No `supabase` parameter (uses Drizzle `db` directly)
2. All mutating functions require `userId` for ownership enforcement
3. Returns `DbQueryError` instead of generic `Error`
4. Uses `threads` table from Schema.ts instead of raw string `'threads'`
5. Proper `try/catch` with `toDbQueryError()` wrapping

**Callers that need updating**:

| Caller File | Import Change |
|---|---|
| `src/app/api/chat/route.ts` (lines 19-22) | Change from `@/libs/supabase/threads` to `@/libs/queries/threads`; remove `supabase` arg from calls; add `userId` to `getThreadByConversationId` and `updateThread` |
| `src/app/api/threads/route.ts` (line 18) | Change import; remove `supabase` arg; adjust call signatures |
| `src/app/api/threads/[id]/route.ts` | Change import; remove `supabase` arg; add `userId` where needed |
| `src/app/api/threads/[id]/archive/route.ts` | Change import; remove `supabase` arg; add `userId` where needed |

**Note**: The `src/libs/supabase/threads.ts` file can be deleted after migration, but should be kept until all callers are updated and tests pass.

**Test updates**: Update `tests/integration/api/threads.test.ts` to mock `@/libs/queries/threads` instead of `@/libs/supabase/threads`, and update call expectations to remove the `supabase` parameter.

### Step 9: Final route cleanup and line count verification
**Addresses**: F-031 (P2)

After steps 3-7, the main `POST` function in `route.ts` should be roughly:

```typescript
export async function POST(request: NextRequest): Promise<Response> {
  // ~10 lines: auth, config check
  // ~8 lines: parse body, extract message, validate
  // ~5 lines: ensureConversation()
  // ~5 lines: start memory retrieval, fire-and-forget user message
  // ~15 lines: build messages, streamText, return response
  // ~3 lines: persistAssistantResponse() fire-and-forget
  // ~15 lines: error handling catch block
  // Total: ~60-70 lines
}
```

Down from 351 lines to ~70 lines in the main function, with extracted helpers totaling ~150 lines in `helpers.ts`. Verify the final line count and ensure no behavior changes by running the full test suite.

## Related Findings

### F-031: Vercel chat route is a 411-line god function with mixed concerns
- **Severity**: P2
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 77-411 (now 50-351 after T-007/T-008 reductions)
- **Description**: Single function handles auth, validation, conversation CRUD, message persistence, AI init, memory retrieval, streaming, post-stream persistence, metadata updates, memory extraction, token counting, latency tracking, and error categorization.
- **Suggestion**: Extract parseMessage(), ensureConversation(), persistAssistantResponse() into composable pieces.

### F-050: Vercel AI SDK chat route (411 LOC) has zero test coverage
- **Severity**: P1
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 1-411 (now 1-351)
- **Description**: Critical path handling AI streaming, conversation creation, message persistence, memory integration, error handling -- no tests.
- **Suggestion**: Create integration tests mirroring tests/integration/api/chat.test.ts pattern.
- **Current state**: Basic test file exists with 5 tests (auth, transaction new conv, transaction failure, existing conv message). Gaps remain for validation, streaming, error categorization, memory integration.

### F-021: Sequential DB calls block chat stream start (150-400ms pre-streaming latency)
- **Severity**: P2
- **File**: `src/app/api/chat/vercel/route.ts`
- **Line**: 162-196 (now 126-198)
- **Description**: Three sequential awaited DB operations before any tokens stream: conversation lookup/create, message persist, memory retrieval.
- **Suggestion**: Parallelize independent operations with Promise.all. Move user message persistence to fire-and-forget.

### F-025: Vestigial _supabase parameter creates false security promise in Drizzle query layer
- **Severity**: P1
- **File**: `src/libs/queries/vercelConversations.ts`
- **Line**: 48
- **Description**: Every function in vercelConversations.ts and vercelMessages.ts accepts unused `_supabase: SupabaseClient`. JSDoc claims "RLS ensures ownership" but Drizzle bypasses RLS entirely.
- **Suggestion**: Remove _supabase parameter. Make userId required. Update JSDoc to reflect actual authorization model.
- **Current state**: `userId` is now required (T-008 fix). `_supabase` parameter and misleading JSDoc remain.

### F-026: Inconsistent data access: Supabase raw queries for Dify, Drizzle ORM for Vercel AI
- **Severity**: P1
- **File**: `src/libs/queries/vercelConversations.ts`
- **Line**: 50-51
- **Description**: Two chat implementations use completely different data access strategies with different auth models, schema references, and return conventions.
- **Suggestion**: Consolidate on Drizzle ORM. Supabase client should only be used for auth.

## Affected Files (Validated)

All files verified to exist in the codebase:

- `src/app/api/chat/vercel/route.ts` -- F-031 decomposition, F-021 parallelization, F-025 caller updates
- `src/libs/queries/vercelConversations.ts` -- F-025 remove `_supabase` param, update JSDoc
- `src/libs/queries/vercelMessages.ts` -- F-025 remove `_supabase` param, update JSDoc
- `src/libs/supabase/threads.ts` -- F-026 source file to migrate away from
- `src/app/api/chat/vercel/conversations/route.ts` -- F-025 caller update (remove supabase arg)
- `src/app/api/chat/vercel/conversations/[id]/route.ts` -- F-025 caller update (remove supabase arg)
- `src/app/api/chat/route.ts` -- F-026 caller update (migrate to Drizzle threads)
- `src/app/api/threads/route.ts` -- F-026 caller update
- `src/app/api/threads/[id]/route.ts` -- F-026 caller update
- `src/app/api/threads/[id]/archive/route.ts` -- F-026 caller update
- `src/libs/mem0/worker.ts` -- F-025 caller update (remove supabase arg from `getConversationMessages`)
- `src/app/[locale]/(auth)/chat/vercel/[conversationId]/page.tsx` -- F-025 caller update (remove supabase arg from `getConversationMessages`)
- `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts` -- F-050 test expansion
- `src/libs/queries/__tests__/vercelConversations.test.ts` -- F-025 test updates
- `src/libs/queries/__tests__/vercelMessages.test.ts` -- F-025 test updates
- `tests/integration/api/vercel-conversations.test.ts` -- F-025 test updates
- `tests/integration/api/threads.test.ts` -- F-026 test updates

**New files to create**:
- `src/app/api/chat/vercel/helpers.ts` -- Extracted functions (parseAndValidateMessages, ensureConversation, persistAssistantResponse, normalizeMessagesForAI)
- `src/app/api/chat/vercel/__tests__/helpers.test.ts` -- Unit tests for extracted functions
- `src/libs/queries/threads.ts` -- Drizzle-based thread queries (replaces `src/libs/supabase/threads.ts`)
- `src/libs/queries/__tests__/threads.test.ts` -- Unit tests for Drizzle thread queries

## Test Requirements

### Tests Before (Characterization)

**1. Expand vercel chat route tests** -- `src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts`
```
npm test -- --run src/app/api/chat/vercel/__tests__/vercel-chat-route.test.ts
```
Add the following test cases (see step 1 for details):
- Zod validation: empty body (400), empty message (400), message > 10k chars (400), invalid UUID conversationId (400)
- Message parsing: AssistantChatTransport format with parts, simple message format
- AI config: `isConfigured()` returns false (400)
- Error categorization: timeout (408), rate limit (429), generic (500)
- Memory integration: memories passed to streamText system prompt
- Fire-and-forget: user message persistence failure doesn't affect response
- Conversation ownership: invalid conversationId returns 400

**2. Existing query function tests** (already pass, serve as characterization):
```
npm test -- --run src/libs/queries/__tests__/vercelConversations.test.ts
npm test -- --run src/libs/queries/__tests__/vercelMessages.test.ts
```
These tests currently pass `mockSupabase` as first arg -- they characterize the vestigial parameter behavior.

**3. Existing conversation endpoint tests** (already pass):
```
npm test -- --run tests/integration/api/vercel-conversations.test.ts
```

**4. Existing threads tests** (characterize raw Supabase pattern):
```
npm test -- --run tests/integration/api/threads.test.ts
```

### Tests After (Verification)

**1. Extracted helper functions** -- `src/app/api/chat/vercel/__tests__/helpers.test.ts`
```
npm test -- --run src/app/api/chat/vercel/__tests__/helpers.test.ts
```
- Test: `extractUserMessage()` with simple `{ message: "hello" }` format returns "hello"
- Test: `extractUserMessage()` with AssistantChatTransport `{ messages: [{role:'user', parts:[{type:'text', text:'hello'}]}] }` returns "hello"
- Test: `extractUserMessage()` with empty body returns ""
- Test: `extractUserMessage()` with messages array but no user role returns ""
- Test: `normalizeMessagesForAI()` filters out system messages
- Test: `normalizeMessagesForAI()` with empty messages array uses fallback message
- Test: `ensureConversation()` with valid conversationId returns `{ ok: true, isNew: false }`
- Test: `ensureConversation()` with invalid conversationId returns `{ ok: false }`
- Test: `ensureConversation()` without conversationId creates via transaction, returns `{ ok: true, isNew: true }`
- Test: `ensureConversation()` transaction failure propagates error

**2. Updated query function tests** (no supabase param) -- `src/libs/queries/__tests__/vercelConversations.test.ts`
```
npm test -- --run src/libs/queries/__tests__/vercelConversations.test.ts
```
- All existing tests updated to remove `mockSupabase` from function calls
- Verify `SupabaseClient` is no longer imported in the query file

**3. Updated message query tests** -- `src/libs/queries/__tests__/vercelMessages.test.ts`
```
npm test -- --run src/libs/queries/__tests__/vercelMessages.test.ts
```
- All existing tests updated to remove `mockSupabase` from function calls

**4. Drizzle thread queries** -- `src/libs/queries/__tests__/threads.test.ts`
```
npm test -- --run src/libs/queries/__tests__/threads.test.ts
```
- Test: `getThreadsByUser(userId)` returns threads filtered by userId
- Test: `getThreadById(threadId, userId)` returns thread with ownership filter
- Test: `getThreadByConversationId(conversationId, userId)` returns thread by conversationId
- Test: `createThread(userId, input)` inserts and returns thread
- Test: `updateThread(threadId, updates, userId)` updates with ownership filter
- Test: `deleteThread(threadId, userId)` deletes with ownership filter
- Test: All functions return `{ data, error }` pattern with `DbQueryError`

**5. Updated threads API tests** -- `tests/integration/api/threads.test.ts`
```
npm test -- --run tests/integration/api/threads.test.ts
```
- Updated to mock `@/libs/queries/threads` instead of `@/libs/supabase/threads`
- All calls no longer pass `supabase` as first argument

**6. Updated conversation endpoint tests** -- `tests/integration/api/vercel-conversations.test.ts`
```
npm test -- --run tests/integration/api/vercel-conversations.test.ts
```
- Updated mock expectations to not include `supabase` as first argument

**7. Full regression**:
```
npm run lint && npm run check-types && npm test && npm run build
```

## Enrichment Notes
- **UI Changes**: false -- All changes are backend (API routes, query layer, helpers). No frontend components or styles are modified. The chat page (`src/app/[locale]/(auth)/chat/vercel/[conversationId]/page.tsx`) has a minor import adjustment (removing supabase arg from `getConversationMessages`) but no visual change.
- **Stale Files Removed**: None. All files in the theme exist. After migration, `src/libs/supabase/threads.ts` can be deleted but should be kept until step 8 is fully validated.
- **Gaps Found**:
  - **Worker.ts and page.tsx caller gap for F-025**: The original step list for T-009 did not mention `src/libs/mem0/worker.ts` or `src/app/[locale]/(auth)/chat/vercel/[conversationId]/page.tsx` as callers of `getConversationMessages` that need updating when removing `_supabase`. Both are now documented in step 2.
  - **Test coverage gap (F-050) partially closed by T-008**: T-008 already created `vercel-chat-route.test.ts` with 5 basic tests. The original theme assumed zero test coverage, but characterization tests exist for auth and transaction behavior. Step 1 focuses on the remaining gaps (validation, streaming, error categorization, memory integration).
  - **Dify chat route callers for F-026**: Migrating `threads.ts` to Drizzle affects the Dify chat route (`src/app/api/chat/route.ts`) and all thread API routes, which were not listed in the original theme's `files` list. Added in step 8.
  - **Parallel memory retrieval opportunity**: The original step 6 only suggested `Promise.all` for conversation lookup + memory retrieval. A further optimization is starting memory retrieval immediately after auth (before conversation lookup), since it only depends on `userId` and `message`, not on `conversationId`. This is documented in step 6.
