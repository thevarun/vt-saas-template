# Story 3.2: Thread Persistence on First Message

Status: done

## Story

As a **user**,
I want **my chat conversations to automatically create persistent threads**,
so that **I can return to my conversations later and maintain conversation context**.

## Acceptance Criteria

1. ✅ AC #1: `/api/chat` endpoint captures `conversation_id` from Dify SSE stream metadata
2. ✅ AC #2: Thread auto-created in database after first Dify response
3. ✅ AC #3: Thread creation happens asynchronously (doesn't block chat response)
4. ✅ AC #4: Thread `updated_at` timestamp updates on new messages
5. ✅ AC #5: `last_message_preview` stores first 100 characters of last message
6. ✅ AC #6: Duplicate conversation_id handled gracefully (fetch existing thread)
7. ✅ AC #7: E2E test: Send message → Verify thread created in database
8. ✅ AC #8: Sentry breadcrumbs added for thread creation (debugging)

## Tasks / Subtasks

- [x] **Task 1: Capture conversation_id from Dify Stream** (AC: #1)
  - [x] 1.1: Read existing `/api/chat` route implementation (src/app/api/chat/route.ts)
  - [x] 1.2: Identify where Dify SSE stream is processed
  - [x] 1.3: Extract conversation_id from Dify response metadata (likely in final SSE event or message envelope)
  - [x] 1.4: Store conversation_id in local variable for thread creation
  - [x] 1.5: Add logging for conversation_id capture (debug breadcrumb)

- [x] **Task 2: Implement Async Thread Creation Logic** (AC: #2, #3, #6)
  - [x] 2.1: Create helper function `createOrUpdateThread(userId, conversationId, firstMessage)` in chat route
  - [x] 2.2: Check if thread already exists with conversation_id (handle duplicates)
  - [x] 2.3: If exists: fetch and return existing thread
  - [x] 2.4: If not exists: Create thread via Supabase client (direct DB for better performance)
  - [x] 2.5: Generate auto-title from first message (e.g., first 50 chars or "New Conversation")
  - [x] 2.6: Set last_message_preview to first 100 chars of first message
  - [x] 2.7: Handle errors gracefully (log but don't block chat response)
  - [x] 2.8: Use Promise.resolve().then() or fire-and-forget pattern (async, non-blocking)

- [x] **Task 3: Update Thread Metadata on Subsequent Messages** (AC: #4, #5)
  - [x] 3.1: Identify subsequent message flow (conversation_id already present in request)
  - [x] 3.2: After Dify response, extract latest user/assistant message text
  - [x] 3.3: Update thread via Supabase client with updated `last_message_preview` (first 100 chars, direct DB for better performance)
  - [x] 3.4: Update happens automatically (updated_at timestamp via database)
  - [x] 3.5: Handle case where thread not found (log warning, don't fail)

- [x] **Task 4: Add Sentry Breadcrumbs** (AC: #8)
  - [x] 4.1: Import Sentry from existing Sentry integration (check sentry.server.config.ts)
  - [x] 4.2: Add breadcrumb before thread creation attempt: `Sentry.addBreadcrumb({ category: 'thread', message: 'Creating thread for conversation', data: { conversationId } })`
  - [x] 4.3: Add breadcrumb on thread creation success: `{ category: 'thread', message: 'Thread created', data: { threadId, conversationId } }`
  - [x] 4.4: Add breadcrumb on thread creation error: `{ category: 'thread', level: 'error', message: 'Thread creation failed', data: { error } }`
  - [x] 4.5: Add breadcrumb for thread metadata update

- [x] **Task 5: Integration Tests for Thread Persistence** (AC: #7)
  - [x] 5.1: Create test file: `tests/integration/api/thread-persistence.test.ts`
  - [x] 5.2: Mock Dify client to return SSE stream with conversation_id
  - [x] 5.3: Mock Supabase auth with test user
  - [x] 5.4: Test: Send first chat message, verify thread created in database
  - [x] 5.5: Assert thread has correct conversation_id, title, and last_message_preview
  - [x] 5.6: Test: Send second message to same conversation
  - [x] 5.7: Verify thread updated (updated_at changed, last_message_preview updated)
  - [x] 5.8: Test: Duplicate conversation_id handled gracefully (only one thread)
  - [x] 5.9: Run tests: `npm test` (48 tests pass)

- [x] **Task 6: Handle Edge Cases** (AC: #6)
  - [x] 6.1: Test scenario: User sends multiple messages before first Dify response completes
  - [x] 6.2: Ensure only one thread created (use conversation_id uniqueness or database constraint)
  - [x] 6.3: Test scenario: Dify returns error (no conversation_id)
  - [x] 6.4: Ensure graceful degradation (chat works, thread creation skipped)
  - [x] 6.5: Test scenario: Thread API unavailable (500 error)
  - [x] 6.6: Ensure chat response not blocked (log error, continue)

## Dev Notes

### Learnings from Previous Story (3.1)

**From Story 3-1-database-schema-thread-crud-apis (Status: done)**

- **New Service Created**: Threads API available at `src/app/api/threads/` with POST endpoint for thread creation
  - Use `POST /api/threads` with body: `{ conversationId: string, title?: string, lastMessagePreview?: string }`
  - Returns: `{ thread: { id, user_id, conversation_id, title, ... } }` with 201 status
  - Authentication automatically handled via Supabase session

- **Database Schema Available**: `health_companion.threads` table already exists with:
  - `conversation_id` column (text, indexed) - use this to store Dify conversation_id
  - `title` column (text, nullable) - auto-generate from first message
  - `last_message_preview` column (text, nullable) - first 100 chars of last message
  - `updated_at` column (timestamp) - auto-updated by database on PATCH

- **RLS Policies Active**: Row-level security enforces user-scoped access - no need to manually filter by user_id

- **Testing Setup**: Integration test patterns established at `tests/integration/api/threads.test.ts` - follow mocking approach for E2E tests

- **Migration Applied**: Database tables exist in both local (PGlite) and production (Supabase)

[Source: docs/sprint-artifacts/3-1-database-schema-thread-crud-apis.md#Dev-Agent-Record]

### Architecture Patterns

**Chat API Integration (Existing):**
- Location: `src/app/api/chat/route.ts`
- Pattern: POST request → Validate Supabase session → Proxy to Dify → Stream SSE response
- Dify Integration: `src/libs/dify/client.ts` (DifyClient class)
- SSE Streaming: Server-Sent Events format, returns conversation_id for context

**Dify API Response Format (Expected):**
```typescript
// SSE events from Dify typically include:
{
  event: 'message',
  conversation_id: 'conv-abc123',
  message_id: 'msg-xyz456',
  answer: 'AI response text...',
  // ... other fields
}
```

**Thread Creation Flow (New Logic):**
1. User sends message via `/api/chat` (existing flow continues normally)
2. Dify streams response with conversation_id
3. **[NEW]** After stream completes, extract conversation_id + message text
4. **[NEW]** Async call to `POST /api/threads` (fire-and-forget)
5. **[NEW]** On subsequent messages, `PATCH /api/threads/[id]` to update metadata

**Async Pattern (Non-blocking):**
```typescript
// After Dify response completes
Promise.resolve().then(async () => {
  try {
    await createOrUpdateThread(userId, conversationId, messageText);
    Sentry.addBreadcrumb({ category: 'thread', message: 'Thread created' });
  } catch (error) {
    logger.error('Thread creation failed', { error, conversationId });
    Sentry.captureException(error);
    // Don't throw - chat already succeeded
  }
});
```

### Project Structure Notes

**Files to Modify:**
- `src/app/api/chat/route.ts` - Add thread persistence logic after Dify stream
- `src/libs/dify/client.ts` (optional) - May need to extract conversation_id from response

**Files to Create:**
- `tests/e2e/thread-persistence.spec.ts` - E2E test for thread creation flow

**Files to Reuse (DO NOT recreate):**
- `src/app/api/threads/route.ts` - POST endpoint already exists (Story 3.1)
- `src/app/api/threads/[id]/route.ts` - PATCH endpoint already exists (Story 3.1)
- `src/models/Schema.ts` - threads table schema already defined

### Testing Standards

**E2E Test Pattern (Playwright):**
- Location: `tests/e2e/` or `tests/integration/`
- Setup: Authenticated test user via Supabase test client
- Flow: Send message → Wait for response → Query database → Assert thread exists
- Use Playwright's `waitForResponse()` to wait for SSE stream completion

**Test Database:**
- Local: PGlite (auto-applied migrations)
- CI/Production Tests: Use test Supabase project with RLS policies

### References

**Epic Details:**
[Source: docs/epics.md#Story-2-Thread-Persistence-on-First-Message]

**Architecture Constraints:**
[Source: docs/architecture.md#Chat-API-Integration]
[Source: docs/architecture.md#API-Design]

**Existing Chat API Implementation:**
[Source: src/app/api/chat/route.ts - Current Dify proxy implementation]

**Dify Client:**
[Source: src/libs/dify/client.ts - Dify API wrapper]

**Sentry Integration:**
[Source: sentry.server.config.ts - Server-side Sentry configuration]

**Thread API:**
[Source: src/app/api/threads/route.ts - POST endpoint for thread creation]

## Dev Agent Record

### Context Reference

No context file was available for this story.

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A

### Completion Notes List

**Implementation Summary:**

1. **SSE Stream Interception** (src/app/api/chat/route.ts:220-270)
   - Implemented TransformStream to intercept Dify SSE stream
   - Parses SSE events to extract conversation_id and answer text
   - Passes through all data to client (maintains streaming)
   - Triggers async thread creation after stream completes

2. **Thread Persistence Logic** (src/app/api/chat/route.ts:38-113)
   - `createOrUpdateThread()` helper function handles both creation and updates
   - Checks for existing thread by conversation_id
   - Creates new thread with auto-generated title (first 50 chars) and preview (first 100 chars)
   - Updates existing thread's last_message_preview and updated_at
   - Fire-and-forget pattern ensures chat response is never blocked

3. **Error Handling & Observability**
   - Sentry breadcrumbs added at key points: conversation_id capture, thread creation/update, errors
   - Comprehensive logging with structured data (threadId, conversationId)
   - Graceful error handling: thread failures don't block chat response
   - Warning logged if conversation_id or answer missing

4. **Testing** (tests/integration/api/thread-persistence.test.ts)
   - 6 integration tests covering all acceptance criteria + edge cases
   - Mocked Dify client returns realistic SSE stream
   - Tests verify: thread creation, metadata updates, duplicate handling, race conditions, missing data, DB failures
   - All 51 unit/integration tests pass

**Technical Decisions:**
- Used TransformStream instead of reading entire stream into memory (better performance)
- Direct DB queries instead of calling /api/threads internally (simpler, avoids HTTP overhead)
- Integration tests instead of E2E tests (E2E mocks bypass route handler, integration tests more reliable)

**Code Review Follow-Up (2025-12-29):**
- ✅ Added race condition test: Verifies only one thread created despite simultaneous requests
- ✅ Added missing conversation_id test: Verifies graceful handling when Dify doesn't return conversation_id
- ✅ Added DB failure test: Verifies chat response not blocked by database errors
- ✅ Updated task descriptions to reflect direct DB implementation (Tasks 2.4, 3.3)
- All 4 review action items resolved, all 51 tests passing

**Completion Notes:**
**Completed:** 2025-12-29
**Definition of Done:** All acceptance criteria met, code reviewed, review findings addressed, all 51 tests passing

### File List

**Modified:**
- src/app/api/chat/route.ts - Added stream interception and thread persistence logic
- tests/integration/api/thread-persistence.test.ts - Added 3 edge case tests (6 total tests)
- docs/sprint-artifacts/3-2-thread-persistence-on-first-message.md - Updated task descriptions (2.4, 3.3)

**Created:**
- tests/integration/api/thread-persistence.test.ts - Integration tests for thread persistence (6 tests total)

---

## Senior Developer Review (AI)

**Reviewer:** Varun
**Date:** 2025-12-29
**Outcome:** **CHANGES REQUESTED** (MEDIUM severity findings)

### Summary

Story 3.2 implementation is **technically sound** with all 8 acceptance criteria met and excellent code quality. The implementation demonstrates proper error handling, security practices, and architectural alignment. However, **3 medium-severity gaps in edge case testing** were identified that should be addressed before marking the story as done.

**Strengths:**
- All acceptance criteria implemented with evidence
- 48 tests passing including 3 thread persistence integration tests
- Excellent error handling with Sentry integration
- Strong security: session validation, RLS policies, input validation
- Performance-conscious: TransformStream, fire-and-forget async pattern

**Concerns:**
- Missing explicit tests for edge cases (race conditions, error scenarios)
- Minor documentation drift between task specs and implementation
- No story context file or Epic 3 tech-spec

### Key Findings (by Severity)

#### ⚠️ MEDIUM SEVERITY

**Finding 1: Missing Edge Case Tests** (Tasks 6.1, 6.3, 6.5)
- **Issue:** Three edge case scenarios marked complete but no explicit tests found:
  - Task 6.1: Multiple messages before first Dify response completes (race condition)
  - Task 6.3: Dify returns error with no conversation_id
  - Task 6.5: Thread API unavailable (500 error)
- **Impact:** Edge cases may not behave as expected in production
- **Evidence:** `tests/integration/api/thread-persistence.test.ts` contains 3 tests but lacks these specific scenarios
- **Severity:** MEDIUM - Production edge cases could cause unexpected behavior

**Finding 2: Implementation Differs from Task Specification** (Tasks 2.4, 3.3)
- **Issue:** Tasks specify HTTP endpoints but implementation uses direct DB calls
  - Task 2.4: "POST to `/api/threads`" → Actually calls `createThread(supabase, ...)`
  - Task 3.3: "PATCH `/api/threads/{id}`" → Actually calls `updateThread(supabase, ...)`
- **Impact:** Documentation drift - actually better for performance, but creates confusion
- **Evidence:** `src/app/api/chat/route.ts:94,72` vs task descriptions
- **Severity:** MEDIUM - Documentation accuracy issue

**Finding 3: Context Documentation Gap**
- **Issue:** No story context file generated, no Epic 3 tech-spec found
- **Impact:** Future developers lack detailed architectural decision context
- **Evidence:**
  - Story "Dev Agent Record → Context Reference": "No context file was available"
  - No `tech-spec-epic-3*.md` found in `docs/`
- **Severity:** MEDIUM - Process/documentation issue affects maintainability

#### ✅ LOW SEVERITY (Advisory Only)

**Note 1: Rate Limiting Not Implemented**
- Code comments acknowledge future work (route.ts:150-154)
- Not blocking for MVP, track for production hardening

**Note 2: Test Strategy Deviation**
- AC #7 specifies "E2E test" but implementation uses integration tests
- Dev notes explain rationale: "E2E mocks bypass route handler, integration tests more reliable"
- Acceptable tradeoff

### Acceptance Criteria Coverage

**Summary:** ✅ **8 of 8 acceptance criteria fully implemented**

| AC# | Description | Status | Evidence (file:line) |
|-----|-------------|--------|---------------------|
| #1 | `/api/chat` captures `conversation_id` from Dify stream | ✅ IMPLEMENTED | route.ts:239-258 (TransformStream + parseSSEEvent) |
| #2 | Thread auto-created after first Dify response | ✅ IMPLEMENTED | route.ts:270-276 (TransformStream.flush → createOrUpdateThread) |
| #3 | Thread creation asynchronous (non-blocking) | ✅ IMPLEMENTED | route.ts:274 (Promise.resolve().then fire-and-forget) |
| #4 | Thread `updated_at` updates on new messages | ✅ IMPLEMENTED | route.ts:72-76, threads.ts:118-119 |
| #5 | `last_message_preview` stores first 100 chars | ✅ IMPLEMENTED | route.ts:70,92 (.slice(0,100)) |
| #6 | Duplicate conversation_id handled gracefully | ✅ IMPLEMENTED | route.ts:58-66 (getThreadByConversationId check) |
| #7 | E2E test: Message → thread created | ✅ IMPLEMENTED | thread-persistence.test.ts:123-172 (integration test) |
| #8 | Sentry breadcrumbs for debugging | ✅ IMPLEMENTED | route.ts:52-56,82-86,109-114,120-125,253-257 |

### Task Completion Validation

**Summary:** ✅ **35 of 38 completed tasks verified**, ⚠️ **3 questionable**

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| **Task 1: Capture conversation_id** | | | |
| 1.1-1.5 | [x] | ✅ VERIFIED | route.ts exists, TransformStream, parseSSEEvent, capturedConversationId, Sentry breadcrumb |
| **Task 2: Async Thread Creation** | | | |
| 2.1-2.3 | [x] | ✅ VERIFIED | createOrUpdateThread() function, getThreadByConversationId, existingThread check |
| 2.4 | [x] | ⚠️ PARTIAL | Uses createThread() directly (not HTTP POST) - better design, spec drift |
| 2.5-2.8 | [x] | ✅ VERIFIED | Auto-title (slice 0-50), preview (slice 0-100), try/catch, Promise.resolve().then() |
| **Task 3: Update Thread Metadata** | | | |
| 3.1-3.2 | [x] | ✅ VERIFIED | conversationId from request body, capturedAnswer accumulation |
| 3.3 | [x] | ⚠️ PARTIAL | Uses updateThread() directly (not HTTP PATCH) - better design, spec drift |
| 3.4-3.5 | [x] | ✅ VERIFIED | updated_at auto-set, fetchError handling with warning log |
| **Task 4: Sentry Breadcrumbs** | | | |
| 4.1-4.5 | [x] | ✅ VERIFIED | Sentry imported, breadcrumbs before/success/error/update |
| **Task 5: Integration Tests** | | | |
| 5.1-5.9 | [x] | ✅ VERIFIED | Test file exists, Dify/Supabase mocks, 3 tests, assertions, 48 tests pass |
| **Task 6: Edge Cases** | | | |
| 6.1 | [x] | ⚠️ QUESTIONABLE | No explicit test for race condition (multiple messages before first response) |
| 6.2 | [x] | ✅ VERIFIED | Test verifies threadStore.size === 1 (test.ts:291-292) |
| 6.3 | [x] | ⚠️ QUESTIONABLE | No explicit test for missing conversation_id scenario |
| 6.4 | [x] | ✅ VERIFIED | Logs warning, skips creation (route.ts:277-281) |
| 6.5 | [x] | ⚠️ QUESTIONABLE | No explicit test for DB failure (500 error) |
| 6.6 | [x] | ✅ VERIFIED | try/catch doesn't throw, comment "Don't throw - chat already succeeded" |

**Falsely Marked Complete:** None found
**Questionable Completions:** 3 (Tasks 6.1, 6.3, 6.5 - edge case tests)

### Test Coverage and Gaps

**Current Coverage:**
- ✅ Thread creation on first message (AC #1, #2, #3)
- ✅ Thread metadata updates (AC #4, #5)
- ✅ Duplicate conversation_id handling (AC #6)
- ✅ 48 unit/integration tests passing

**Test Gaps:**
- ⚠️ Race condition: Multiple rapid messages before first Dify response
- ⚠️ Error scenario: Dify returns no conversation_id
- ⚠️ Error scenario: Database unavailable during thread operation

**Test Quality:** Solid - realistic mocks, comprehensive assertions, proper async timing

### Architectural Alignment

✅ **Tech-Spec Compliance:** Story aligns with Epic 3 requirements (epics.md:106-113)
✅ **Architecture Patterns:** Follows Next.js API route patterns (architecture.md:186-196)
✅ **Database Strategy:** Uses Supabase client with RLS policies (architecture.md:166-172)
✅ **Security Architecture:** Session validation, no secrets exposed (architecture.md:253-303)
✅ **Error Handling:** Sentry integration, graceful degradation (architecture.md:392-407)

**No critical architecture violations found.**

### Security Notes

✅ **No security vulnerabilities found**

**Security Strengths:**
- Supabase session validation before all operations (route.ts:159-172)
- RLS policies enforce user-scoped data access
- Input validation: message length (max 10k chars), conversation_id format
- No SQL injection risk (parameterized queries via Supabase client)
- Sentry error tracking with context (no sensitive data logged)
- No hardcoded secrets or API keys

**Security Recommendations:**
- Consider rate limiting per user (60 req/min) - noted in code comments as future work

### Best-Practices and References

**Tech Stack:** Next.js 14.2.25, TypeScript, Supabase 2.86.0, Drizzle ORM 0.35.1, @assistant-ui/react 0.11.47

**Implementation follows industry best practices:**
- ✅ [Server-Sent Events (SSE) for streaming](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- ✅ [TransformStream API for memory-efficient streaming](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)
- ✅ Fire-and-forget async pattern (Promise.resolve().then()) prevents blocking
- ✅ [Supabase RLS for multi-tenant security](https://supabase.com/docs/guides/auth/row-level-security)
- ✅ [Sentry breadcrumbs for distributed tracing](https://docs.sentry.io/platforms/javascript/enriching-events/breadcrumbs/)

**Referenced Documentation:**
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Auth SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Vitest Integration Testing](https://vitest.dev/guide/)

### Action Items

#### Code Changes Required

- [x] **[Med]** Add integration test for race condition scenario (AC #3, Task 6.1) [file: tests/integration/api/thread-persistence.test.ts]
  - Test: Send multiple rapid messages before first Dify response completes
  - Verify: Only one thread created (no duplicates from race condition)

- [x] **[Med]** Add integration test for missing conversation_id handling (Task 6.3) [file: tests/integration/api/thread-persistence.test.ts]
  - Mock Dify to return SSE stream without conversation_id
  - Verify: Chat response succeeds, thread creation skipped, warning logged

- [x] **[Med]** Add integration test for database failure handling (Task 6.5) [file: tests/integration/api/thread-persistence.test.ts]
  - Mock Supabase createThread/updateThread to throw error
  - Verify: Chat response succeeds (not blocked), error captured in Sentry

- [x] **[Low]** Update task descriptions to reflect implementation reality (Tasks 2.4, 3.3) [file: docs/sprint-artifacts/3-2-thread-persistence-on-first-message.md]
  - Task 2.4: Change "POST to `/api/threads`" → "Create thread via Supabase client"
  - Task 3.3: Change "PATCH `/api/threads/{id}`" → "Update thread via Supabase client"
  - Add note: Technical decision to use direct DB for better performance

#### Advisory Notes

- Note: Rate limiting not implemented (acknowledged in code comments as future work) - consider adding to Epic 3 backlog
- Note: Story context file not generated - consider running story-context workflow for future Epic 3 stories
- Note: No Epic 3 tech-spec found - PRD/Epic docs provide adequate context for this story

### Change Log

**2025-12-29** - Senior Developer Review (AI) notes appended - Changes requested (3 medium severity test gaps)
**2025-12-29** - Code review follow-up completed - Added 3 edge case tests, updated task descriptions, all 51 tests passing
