# Story 3.1: Database Schema + Thread CRUD APIs

Status: drafted

## Story

As a **backend developer**,
I want to **create a dedicated database schema and RESTful APIs for thread management**,
so that **user conversation threads can be persistently stored with proper security policies**.

## Acceptance Criteria

1. ✅ AC #1: `health_companion` schema created in Supabase
2. ✅ AC #2: `threads` table exists with columns: id, user_id, conversation_id, title, last_message_preview, archived, created_at, updated_at
3. ✅ AC #3: Indexes created: idx_threads_user_id, idx_threads_conversation_id, idx_threads_user_archived
4. ✅ AC #4: RLS policies enforce user-scoped access (users can only access own threads)
5. ✅ AC #5: `GET /api/threads` returns authenticated user's threads (ordered by updated_at DESC)
6. ✅ AC #6: `POST /api/threads` creates thread with conversation_id
7. ✅ AC #7: `PATCH /api/threads/[id]` updates title and last_message_preview
8. ✅ AC #8: `PATCH /api/threads/[id]/archive` toggles archive status
9. ✅ AC #9: `DELETE /api/threads/[id]` removes thread permanently
10. ✅ AC #10: All endpoints return 401 for unauthenticated requests
11. ✅ AC #11: Integration tests pass for happy path (create, list, update, archive, delete)

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Definition** (AC: #1, #2, #3)
  - [ ] 1.1: Add Drizzle schema definition in `src/models/Schema.ts` for `threads` table
  - [ ] 1.2: Define table columns with proper types (id: uuid, user_id: uuid, conversation_id: text, title: text, last_message_preview: text, archived: boolean, timestamps)
  - [ ] 1.3: Add indexes (idx_threads_user_id, idx_threads_conversation_id, idx_threads_user_archived)
  - [ ] 1.4: Generate migration: `npm run db:generate`
  - [ ] 1.5: Review generated migration SQL

- [ ] **Task 2: RLS Policies** (AC: #4)
  - [ ] 2.1: Write RLS policy SQL for SELECT (user can only select own threads)
  - [ ] 2.2: Write RLS policy SQL for INSERT (user can only insert for own user_id)
  - [ ] 2.3: Write RLS policy SQL for UPDATE (user can only update own threads)
  - [ ] 2.4: Write RLS policy SQL for DELETE (user can only delete own threads)
  - [ ] 2.5: Apply RLS policies in Supabase SQL Editor or migration
  - [ ] 2.6: Test RLS isolation (user A cannot access user B's threads)

- [ ] **Task 3: GET /api/threads Endpoint** (AC: #5, #10)
  - [ ] 3.1: Create `src/app/api/threads/route.ts`
  - [ ] 3.2: Implement GET handler with Supabase session validation
  - [ ] 3.3: Query threads table filtered by authenticated user_id, ordered by updated_at DESC
  - [ ] 3.4: Return 401 for unauthenticated requests
  - [ ] 3.5: Add error handling with logger.error and NextResponse.json
  - [ ] 3.6: Write integration test for GET /api/threads

- [ ] **Task 4: POST /api/threads Endpoint** (AC: #6, #10)
  - [ ] 4.1: Implement POST handler in `src/app/api/threads/route.ts`
  - [ ] 4.2: Add Zod schema for request validation (conversation_id required, title optional)
  - [ ] 4.3: Insert thread record with user_id from session
  - [ ] 4.4: Return created thread with 201 status
  - [ ] 4.5: Add error handling (duplicate conversation_id, validation errors)
  - [ ] 4.6: Write integration test for POST /api/threads

- [ ] **Task 5: PATCH /api/threads/[id] Endpoint** (AC: #7, #10)
  - [ ] 5.1: Create `src/app/api/threads/[id]/route.ts`
  - [ ] 5.2: Implement PATCH handler with session validation
  - [ ] 5.3: Add Zod schema for partial update (title, last_message_preview optional)
  - [ ] 5.4: Update thread record, verify user ownership
  - [ ] 5.5: Return 404 if thread not found or not owned by user
  - [ ] 5.6: Write integration test for PATCH /api/threads/[id]

- [ ] **Task 6: PATCH /api/threads/[id]/archive Endpoint** (AC: #8, #10)
  - [ ] 6.1: Create `src/app/api/threads/[id]/archive/route.ts`
  - [ ] 6.2: Implement PATCH handler to toggle archived boolean
  - [ ] 6.3: Verify user ownership before update
  - [ ] 6.4: Return updated thread
  - [ ] 6.5: Write integration test for PATCH /api/threads/[id]/archive

- [ ] **Task 7: DELETE /api/threads/[id] Endpoint** (AC: #9, #10)
  - [ ] 7.1: Implement DELETE handler in `src/app/api/threads/[id]/route.ts`
  - [ ] 7.2: Verify user ownership before deletion
  - [ ] 7.3: Permanently remove thread from database
  - [ ] 7.4: Return 204 No Content on success
  - [ ] 7.5: Write integration test for DELETE /api/threads/[id]

- [ ] **Task 8: Integration Testing** (AC: #11)
  - [ ] 8.1: Set up test fixtures (authenticated test user)
  - [ ] 8.2: Write happy path test: create → list → update → archive → delete
  - [ ] 8.3: Write authentication test: unauthenticated requests return 401
  - [ ] 8.4: Write RLS test: user A cannot access user B's threads
  - [ ] 8.5: Verify all tests pass: `npm test`

## Dev Notes

### Architecture Patterns

**Database ORM:** Drizzle ORM (existing pattern)
- Schema definitions in `src/models/Schema.ts`
- Type-safe queries with `.select()`, `.insert()`, `.update()`, `.delete()`
- Migrations auto-applied on app start (or manual via `npm run db:migrate`)

**API Route Pattern:** Next.js App Router API Routes
- Location: `src/app/api/` directory structure
- Auth: Validate Supabase session via `src/libs/supabase/server.ts`
- Response format: `NextResponse.json()` with proper status codes
- Error handling: Use logger.error for server errors, return structured error responses

**Authentication:** Supabase Auth (SSR pattern)
- Middleware handles session refresh (`src/middleware.ts`)
- Server-side validation required for all protected API routes
- Pattern:
  ```typescript
  import { cookies } from 'next/headers';
  import { createClient } from '@/libs/supabase/server';

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ```

**Validation:** Zod schemas
- Follow existing pattern in codebase (e.g., form validation)
- Parse request body: `const body = await request.json(); const validated = schema.parse(body);`
- Return 400 for validation errors with descriptive messages

### Project Structure Notes

**Files to Create:**
- `src/app/api/threads/route.ts` (GET, POST handlers)
- `src/app/api/threads/[id]/route.ts` (PATCH, DELETE handlers)
- `src/app/api/threads/[id]/archive/route.ts` (PATCH handler for archive toggle)
- `tests/integration/api/threads.test.ts` (integration tests)

**Files to Modify:**
- `src/models/Schema.ts` (add threads table schema)
- Migrations directory (generated migration file)

**Database Migration:**
- Generate: `npm run db:generate` (creates migration in `migrations/`)
- Apply: Auto-applied on next DB interaction OR manually via `npm run db:migrate` (Edge runtime only)
- RLS policies: Applied in Supabase SQL Editor (not part of Drizzle migration)

### Testing Standards

**Integration Tests (Playwright):**
- Location: `tests/integration/api/`
- Setup: Create authenticated test user via Supabase test client
- Pattern: Use Playwright's API testing capabilities to hit endpoints
- Coverage: Happy path + error scenarios + authentication + RLS isolation

**Test Database:**
- Use test Supabase project or PGlite for local testing
- Ensure RLS policies applied in test environment

### References

**Epic Details:**
[Source: docs/epics.md#Story-1-Database-Schema-Thread-CRUD-APIs]

**Architecture Constraints:**
[Source: docs/architecture.md#API-Design]
[Source: docs/architecture.md#Security-Architecture]

**Existing Patterns:**
[Source: CLAUDE.md#Adding-a-New-Protected-Route]
[Source: CLAUDE.md#Modifying-Database-Schema]
[Source: src/app/api/chat/route.ts - Example API route with auth and error handling]

**Drizzle ORM:**
[Source: docs/architecture.md#Data-Architecture]
[Source: src/models/Schema.ts - Existing schema patterns]

**Supabase RLS:**
[Docs: https://supabase.com/docs/guides/auth/row-level-security]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 <noreply@anthropic.com>

### Debug Log References

### Completion Notes List

### File List
