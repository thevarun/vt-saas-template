# Epic: Multi-Threaded Chat + Dashboard Redesign

**Epic ID:** EPIC-003
**Status:** Ready for Implementation
**Priority:** High
**Est. Effort:** 16 points (~2-3 sprints)
**Tech-Spec:** `docs/tech-spec.md`

## Overview

Transform HealthCompanion's chat experience from single-conversation to multi-threaded with modern sidebar layout, enabling users to organize multiple health discussion topics independently.

## Business Value

- Users can maintain separate conversations for different health topics (nutrition, fitness, mental health)
- Improved user retention through conversation history and organization
- Modern UX aligned with industry standards (ChatGPT, Claude)
- Foundation for future features (thread search, categories, sharing)

## Technical Approach

- Leverage Assistant UI components (@assistant-ui/react 0.11.47 already installed)
- Create dedicated `health_companion` schema in Supabase for thread storage
- Build thread management APIs with Drizzle ORM
- Implement responsive sidebar layout with shadcn/ui Sheet component
- MVP-focused testing (happy paths only)

## Dependencies

- Supabase database access
- Dify API (existing integration)
- @assistant-ui/react-devtools (new dependency)

## Success Criteria

- ✅ Users can create unlimited threads
- ✅ Thread switching works seamlessly
- ✅ Threads persist across sessions
- ✅ Mobile responsive (sidebar overlay)
- ✅ No regression in existing chat functionality (streaming, auth)

---

## Stories

### Story 1: Database Schema + Thread CRUD APIs

**Story ID:** STORY-003-001
**Type:** Backend
**Priority:** Critical (Blocker for Stories 2-6)
**Est. Effort:** 3 points
**Assignee:** Backend Dev

#### Description

Create dedicated database schema and RESTful APIs for thread management, enabling persistent storage of user conversation threads with proper security (RLS policies).

#### Acceptance Criteria

- ✅ AC #1: `health_companion` schema created in Supabase
- ✅ AC #2: `threads` table exists with columns: id, user_id, conversation_id, title, last_message_preview, archived, created_at, updated_at
- ✅ AC #3: Indexes created: idx_threads_user_id, idx_threads_conversation_id, idx_threads_user_archived
- ✅ AC #4: RLS policies enforce user-scoped access (users can only access own threads)
- ✅ AC #5: `GET /api/threads` returns authenticated user's threads (ordered by updated_at DESC)
- ✅ AC #6: `POST /api/threads` creates thread with conversation_id
- ✅ AC #7: `PATCH /api/threads/[id]` updates title and last_message_preview
- ✅ AC #8: `PATCH /api/threads/[id]/archive` toggles archive status
- ✅ AC #9: `DELETE /api/threads/[id]` removes thread permanently
- ✅ AC #10: All endpoints return 401 for unauthenticated requests
- ✅ AC #11: Integration tests pass for happy path (create, list, update, archive, delete)

#### Technical Notes

- File: `src/models/Schema.ts` - Add Drizzle schema definition
- Files: `src/app/api/threads/route.ts`, `src/app/api/threads/[id]/route.ts`, `src/app/api/threads/[id]/archive/route.ts`
- Use Zod for request validation
- Follow existing API error handling patterns (logger.error, NextResponse.json)
- Generate migration: `npm run db:generate`
- Apply RLS policies in Supabase SQL Editor

#### Definition of Done

- [ ] Database migration generated and applied
- [ ] RLS policies tested (user A cannot access user B's threads)
- [ ] All API endpoints implemented and tested
- [ ] Integration tests written and passing
- [ ] Code reviewed and merged to main

---

### Story 2: Thread Persistence on First Message

**Story ID:** STORY-003-002
**Type:** Backend/Integration
**Priority:** Critical
**Est. Effort:** 2 points
**Assignee:** Backend Dev
**Depends On:** STORY-003-001

#### Description

Modify existing chat API to automatically create thread records after receiving the first message response from Dify, capturing the conversation_id for future message continuity.

#### Acceptance Criteria

- ✅ AC #1: `/api/chat` endpoint captures `conversation_id` from Dify SSE stream metadata
- ✅ AC #2: Thread auto-created in database after first Dify response
- ✅ AC #3: Thread creation happens asynchronously (doesn't block chat response)
- ✅ AC #4: Thread `updated_at` timestamp updates on new messages
- ✅ AC #5: `last_message_preview` stores first 100 characters of last message
- ✅ AC #6: Duplicate conversation_id handled gracefully (fetch existing thread)
- ✅ AC #7: E2E test: Send message → Verify thread created in database
- ✅ AC #8: Sentry breadcrumbs added for thread creation (debugging)

#### Technical Notes

- File: `src/app/api/chat/route.ts` (modify existing)
- After Dify stream completes, extract conversation_id from final event
- POST to `/api/threads` internally (or use direct DB query)
- Handle edge case: User sends multiple messages before first response completes
- Use optimistic thread creation (show in UI immediately, confirm with DB later)

#### Definition of Done

- [ ] Chat API modified with thread creation logic
- [ ] Metadata update logic working (last_message_preview, updated_at)
- [ ] E2E test passing (full flow: message → thread created)
- [ ] Error handling tested (Dify failure, DB failure)
- [ ] Code reviewed and merged to main

---

### Story 3: Assistant UI Integration Spike

**Story ID:** STORY-003-003
**Type:** Spike/Research
**Priority:** High (De-risks Stories 4-5)
**Est. Effort:** 1 point (2-hour timebox)
**Assignee:** Frontend Dev

#### Description

Time-boxed investigation to verify Assistant UI components work with our Supabase/Dify setup, identify integration approach, and document any blockers before full implementation.

#### Acceptance Criteria

- ✅ AC #1: @assistant-ui/react-devtools installed and functional
- ✅ AC #2: ThreadListPrimitive renders with mock thread data
- ✅ AC #3: ThreadPrimitive renders with mock messages
- ✅ AC #4: DevTools modal displays runtime state correctly
- ✅ AC #5: Spike findings documented in tech-spec or separate spike-notes.md
- ✅ AC #6: Integration approach confirmed (custom adapter needed? Runtime config?) OR blockers identified
- ✅ AC #7: Team consensus on approach before starting Story 4

#### Technical Notes

- Install: `npm install @assistant-ui/react-devtools`
- Create spike branch: `spike/assistant-ui-integration`
- Reference: https://www.assistant-ui.com/docs/ui/ThreadList
- Reference: https://www.assistant-ui.com/docs/ui/Thread
- Test with mock data (no real API calls)
- Verify DevTools show thread list state, active thread, messages
- Document: What works out-of-box? What needs custom code?

#### Definition of Done

- [ ] Spike completed within 2-hour timebox
- [ ] Findings documented (approach confirmed or blockers identified)
- [ ] Demo to team (screenshots or screen recording)
- [ ] Go/no-go decision made on Assistant UI approach
- [ ] Spike branch archived (not merged)

---

### Story 4: ThreadList Sidebar Component

**Story ID:** STORY-003-004
**Type:** Frontend
**Priority:** High
**Est. Effort:** 5 points
**Assignee:** Frontend Dev
**Depends On:** STORY-003-001, STORY-003-003

#### Description

Build collapsible sidebar with thread list, "New Thread" action, and responsive behavior (desktop visible, mobile overlay), using Assistant UI ThreadListPrimitive and shadcn/ui Sheet.

#### Acceptance Criteria

- ✅ AC #1: AppShell layout component renders sidebar + main content area
- ✅ AC #2: ThreadList displays user's threads fetched from `GET /api/threads`
- ✅ AC #3: "New Thread" button navigates to `/chat` (empty composer)
- ✅ AC #4: Clicking thread navigates to `/chat/[threadId]`
- ✅ AC #5: Active thread highlighted in sidebar (visual indicator)
- ✅ AC #6: Archive button per thread (archives thread, removes from sidebar)
- ✅ AC #7: Desktop (≥1024px): Sidebar visible by default, collapsible to icon bar
- ✅ AC #8: Mobile (<768px): Sidebar hidden by default, opens as overlay (Sheet) via hamburger menu
- ✅ AC #9: Keyboard shortcut (Cmd/Ctrl+B) toggles sidebar
- ✅ AC #10: Loading state shows skeletons during thread fetch
- ✅ AC #11: Empty state displays "Start your first conversation" when no threads
- ✅ AC #12: Component tests pass (ThreadListSidebar.test.tsx)

#### Technical Notes

- Files: `src/components/chat/AppShell.tsx`, `src/components/chat/ThreadListSidebar.tsx`, `src/components/chat/ThreadItem.tsx`, `src/components/chat/EmptyThreadState.tsx`
- Layout: `src/app/[locale]/(auth)/chat/layout.tsx` (use AppShell)
- Use shadcn/ui Sheet for mobile overlay
- Use Assistant UI ThreadListPrimitive.Items for rendering
- Fetch threads on mount: `useEffect(() => fetchThreads(), [])`
- Sidebar state: React context or component state
- Archive: `PATCH /api/threads/[id]/archive` → Remove from local state

#### Definition of Done

- [ ] AppShell layout working (sidebar + content)
- [ ] ThreadList renders and fetches data
- [ ] Navigation working (New Thread, thread click)
- [ ] Responsive behavior tested (desktop, tablet, mobile)
- [ ] Component tests written and passing
- [ ] Visual QA approved (design team)
- [ ] Code reviewed and merged to main

---

### Story 5: Thread Component Integration

**Story ID:** STORY-003-005
**Type:** Frontend
**Priority:** High
**Est. Effort:** 3 points
**Assignee:** Frontend Dev
**Depends On:** STORY-003-002, STORY-003-004

#### Description

Replace current chat interface with Assistant UI ThreadPrimitive, wire up runtime adapter to `/api/chat`, and implement thread metadata updates (title editing, last message preview).

#### Acceptance Criteria

- ✅ AC #1: Chat interface uses ThreadPrimitive.Root from @assistant-ui/react
- ✅ AC #2: Messages render correctly in conversation view
- ✅ AC #3: Composer sends message via `/api/chat` with conversation_id
- ✅ AC #4: Streaming responses work (SSE from Dify)
- ✅ AC #5: Thread metadata updates on new message (last_message_preview, updated_at via PATCH)
- ✅ AC #6: Thread title editable inline (click to edit, blur to save)
- ✅ AC #7: DevTools visible in dev mode, show runtime state (thread, messages, composer)
- ✅ AC #8: E2E test: Full chat flow works with threading (send message, switch thread, verify isolation)
- ✅ AC #9: No regression in existing chat functionality (markdown rendering, streaming indicators)

#### Technical Notes

- File: `src/app/[locale]/(auth)/chat/[threadId]/page.tsx` (new route)
- File: `src/components/chat/ChatInterface.tsx` (modify to use ThreadPrimitive)
- Runtime adapter configuration:
  ```typescript
  const adapter = {
    async sendMessage({ message, threadId }) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversationId: thread.conversation_id
        })
      })
      // Handle SSE stream
      // PATCH /api/threads/[id] after response
    }
  }
  ```
- Thread title editing: `src/components/chat/ThreadTitleEditor.tsx`
- DevTools: Add `<DevToolsModal />` to layout

#### Definition of Done

- [ ] Chat interface migrated to ThreadPrimitive
- [ ] Streaming working correctly
- [ ] Thread metadata updates functional
- [ ] Title editing working (inline edit + persist)
- [ ] DevTools integrated and functional
- [ ] E2E test passing (full chat flow)
- [ ] Code reviewed and merged to main

---

### Story 6: Navigation + Polish

**Story ID:** STORY-003-006
**Type:** Frontend/Polish
**Priority:** Medium
**Est. Effort:** 2 points
**Assignee:** Frontend Dev
**Depends On:** STORY-003-005

#### Description

Add placeholder navigation items (Pricing, Feature 1, Feature 2), implement all empty/loading/error states, ensure dark mode compatibility, and complete responsive design polish for production readiness.

#### Acceptance Criteria

- ✅ AC #1: Sidebar navigation includes: Threads (active), Pricing (placeholder), Feature 1 (placeholder), Feature 2 (placeholder)
- ✅ AC #2: Placeholder items show "Coming Soon" toast on click (no functionality)
- ✅ AC #3: All empty states styled and helpful (no threads, loading threads, failed to load)
- ✅ AC #4: All error states have retry mechanisms (toast with retry button)
- ✅ AC #5: Dark mode works across all new components (respects next-themes)
- ✅ AC #6: Mobile responsive behavior tested and working (all breakpoints)
- ✅ AC #7: Manual QA checklist completed (see tech-spec)
- ✅ AC #8: Production build succeeds, no console errors
- ✅ AC #9: DevTools excluded from production bundle (verify with bundle analyzer)
- ✅ AC #10: Accessibility: Keyboard navigation works, ARIA labels correct, focus management proper
- ✅ AC #11: AssistantIf component used for conditional rendering (loading states, empty states, message-based conditions)
- ✅ AC #12: Typing indicator displays during assistant response streaming

#### Technical Notes

- Add navigation items to AppShell sidebar
- Use shadcn/ui Toast for "Coming Soon" messages
- Empty states: Use EmptyThreadState component with helpful copy
- Error states: Try-catch with toast.error() + retry button
- Dark mode: Verify all new components use theme-aware classes
- Run bundle analyzer: `ANALYZE=true npm run build`
- Manual QA: Test on Chrome, Safari, Firefox (desktop + mobile)
- **AssistantIf Implementation:**
  - Replace ThreadPrimitive.Empty with `<AssistantIf hasMessages={false}>`
  - Add `<AssistantIf running>` for typing indicator during streaming
  - Use `<AssistantIf lastMessage={{ role: "assistant" }}>` for conditional UI elements
  - Reference: https://www.assistant-ui.com/docs/ui/Thread#assistantif
  - File: `src/components/chat/Thread.tsx` (update message rendering logic)

#### Definition of Done

- [ ] Navigation items added and functional
- [ ] All empty/loading/error states implemented
- [ ] AssistantIf component integrated (typing indicator, conditional rendering)
- [ ] Dark mode verified working
- [ ] Responsive design QA passed (all devices)
- [ ] Manual QA checklist completed
- [ ] Production build verified (no DevTools in bundle)
- [ ] Accessibility audit passed (keyboard nav, ARIA labels)
- [ ] Code reviewed and merged to main
- [ ] Feature ready for production deployment

---

## Epic Summary

**Total Stories:** 6
**Total Effort:** 16 points
**Critical Path:** Story 1 → Story 2 → Story 3 → Story 4 → Story 5 → Story 6
**Est. Timeline:** 2-3 sprints (assuming 2-week sprints, team velocity ~8 points/sprint)

**Parallel Work Opportunities:**
- Story 1 and Story 3 can run in parallel (different devs)
- Stories 4 and 5 are sequential (same dev likely)

**Risk Mitigation:**
- Story 3 spike de-risks Assistant UI integration (2 hours investment upfront)
- MVP testing scope keeps velocity high
- DevTools enable rapid debugging if integration issues arise

**Post-Epic:**
- Update workflow status: `docs/bmm-workflow-status.yaml`
- Run retrospective: Capture lessons learned
- Plan Epic 4 based on user feedback from multi-threaded chat

---

**Epic Owner:** John (PM)
**Tech Lead:** Winston (Architect)
**Created:** 2024-12-26
**Last Updated:** 2024-12-26
