# Story 3.4: threadlist-sidebar-component

Status: review

## Story

As a **user**,
I want **a collapsible sidebar with my conversation threads**,
so that **I can easily navigate between different health discussion topics and organize my conversations**.

## Acceptance Criteria

1. ✅ AC #1: AppShell layout component renders sidebar + main content area
2. ✅ AC #2: ThreadList displays user's threads fetched from `GET /api/threads`
3. ✅ AC #3: "New Thread" button navigates to `/chat` (empty composer)
4. ✅ AC #4: Clicking thread navigates to `/chat/[threadId]`
5. ✅ AC #5: Active thread highlighted in sidebar (visual indicator)
6. ✅ AC #6: Archive button per thread (archives thread, removes from sidebar)
7. ✅ AC #7: Desktop (≥1024px): Sidebar visible by default, collapsible to icon bar
8. ✅ AC #8: Mobile (<768px): Sidebar hidden by default, opens as overlay (Sheet) via hamburger menu
9. ✅ AC #9: Keyboard shortcut (Cmd/Ctrl+B) toggles sidebar
10. ✅ AC #10: Loading state shows skeletons during thread fetch
11. ✅ AC #11: Empty state displays "Start your first conversation" when no threads
12. ✅ AC #12: Component tests pass (ThreadListSidebar.test.tsx)

## Tasks / Subtasks

- [x] **Task 1: Create AppShell Layout Component** (AC: #1)
  - [x] 1.1: Create `src/components/chat/AppShell.tsx` with sidebar + main content area structure
  - [x] 1.2: Implement responsive grid layout (desktop: sidebar visible, mobile: overlay)
  - [x] 1.3: Add sidebar toggle state management (React useState)
  - [x] 1.4: Export AppShell component with proper TypeScript types

- [x] **Task 2: Implement ThreadListSidebar Component** (AC: #2, #5, #6, #7, #8)
  - [x] 2.1: Create `src/components/chat/ThreadListSidebar.tsx`
  - [x] 2.2: Fetch threads from `GET /api/threads` on component mount (useEffect)
  - [x] 2.3: Custom thread list implementation (not using ThreadListPrimitive - using direct API integration as per spike)
  - [x] 2.4: Create ThreadItem component to render each thread with title and preview
  - [x] 2.5: Implement active thread highlighting (compare threadId from URL params)
  - [x] 2.6: Add archive button per thread (PATCH /api/threads/[id]/archive)
  - [x] 2.7: Desktop behavior: Sidebar collapsible to icon bar, persist state in localStorage
  - [x] 2.8: Mobile behavior: Use shadcn/ui Sheet component for overlay
  - [x] 2.9: Add hamburger menu icon for mobile sidebar trigger

- [x] **Task 3: Implement New Thread Button** (AC: #3)
  - [x] 3.1: Add "New Thread" button to ThreadListSidebar header
  - [x] 3.2: Wire button to navigate to `/chat` using Next.js router
  - [x] 3.3: Style button with shadcn/ui Button component
  - [x] 3.4: Ensure button visible in both desktop and mobile modes

- [x] **Task 4: Implement Thread Navigation** (AC: #4)
  - [x] 4.1: Add onClick handler to ThreadItem component
  - [x] 4.2: Navigate to `/chat/[threadId]` using Next.js router.push
  - [x] 4.3: Extract threadId from thread.id
  - [x] 4.4: Close mobile sheet after navigation (if in mobile mode)

- [x] **Task 5: Add Keyboard Shortcut for Sidebar Toggle** (AC: #9)
  - [x] 5.1: Add keyboard event listener for Cmd/Ctrl+B in AppShell
  - [x] 5.2: Toggle sidebar visibility on shortcut press
  - [x] 5.3: Clean up event listener on component unmount
  - [x] 5.4: Cross-platform support (metaKey for macOS, ctrlKey for Windows)

- [x] **Task 6: Implement Loading State** (AC: #10)
  - [x] 6.1: Create skeleton loader component (ThreadListSkeleton.tsx)
  - [x] 6.2: Display skeletons while threads are being fetched
  - [x] 6.3: Use shadcn/ui Skeleton component for shimmer effect
  - [x] 6.4: Show 5 skeleton items during loading

- [x] **Task 7: Implement Empty State** (AC: #11)
  - [x] 7.1: Create `src/components/chat/EmptyThreadState.tsx`
  - [x] 7.2: Display "Start your first conversation" message when threads array is empty
  - [x] 7.3: Add helpful copy and CTA to create first thread
  - [x] 7.4: Style with Tailwind CSS matching app theme
  - [x] 7.5: Show empty state after loading completes (not during loading)

- [x] **Task 8: Update Chat Layout to Use AppShell** (AC: #1)
  - [x] 8.1: Update `src/app/[locale]/(chat)/chat/page.tsx` (note: chat is in (chat) group, not (auth))
  - [x] 8.2: Wrap ChatInterface with AppShell component
  - [x] 8.3: Pass ThreadListSidebar as sidebar prop
  - [x] 8.4: Refactor ChatInterface to remove embedded sidebar

- [x] **Task 9: Write Component Tests** (AC: #12)
  - [x] 9.1: Create `src/components/chat/ThreadListSidebar.test.tsx`
  - [x] 9.2: Test threads fetch and render
  - [x] 9.3: Test "New Thread" navigation
  - [x] 9.4: Test thread click navigation
  - [x] 9.5: Test archive button functionality
  - [x] 9.6: Test error handling
  - [x] 9.7: Test loading state
  - [x] 9.8: Test empty state
  - [x] 9.9: Run tests: `npm test ThreadListSidebar.test.tsx`
  - [x] 9.10: All 9 tests passing

- [x] **Task 10: Code Quality Checks**
  - [x] 10.1: TypeScript compilation (`npx tsc --noEmit`)
  - [x] 10.2: ESLint checks (`npm run lint`)
  - [x] 10.3: Production build (`npm run build`)
  - [x] 10.4: All checks passing

## Dev Notes

### Learnings from Previous Story (3.3)

**From Story 3-3-assistant-ui-integration-spike (Status: done)**

- **Threads API Available**: Backend infrastructure ready
  - `POST /api/threads` creates threads with conversation_id
  - `GET /api/threads` fetches user's threads (ordered by updated_at DESC)
  - `PATCH /api/threads/[id]` updates title and last_message_preview
  - `PATCH /api/threads/[id]/archive` toggles archive status
  - All endpoints enforce authentication via Supabase session

- **Database Schema Ready**: `health_companion.threads` table structure
  - Columns: id, user_id, conversation_id, title, last_message_preview, archived, created_at, updated_at
  - RLS policies enforce user-scoped access (no manual filtering needed)
  - Indexes: idx_threads_user_id, idx_threads_conversation_id

- **Assistant UI Integration Validated**: Spike confirmed full compatibility
  - ThreadListPrimitive.Root, Items, New work out-of-box
  - ThreadPrimitive compatible with existing Dify SSE streaming adapter
  - Zero adapter changes needed - only wire conversation_id (~100 lines total)
  - DevTools integration trivial (5 lines of code)
  - Custom ThreadListItem component approach validated

- **Existing Chat Setup**: `src/components/chat/ChatInterface.tsx`
  - Already using @assistant-ui/react (0.11.53)
  - Runtime adapter configured for Dify SSE streaming
  - Chat interface ready for multi-thread integration

**Key Interfaces to Reuse:**
- `src/app/api/threads/route.ts` - Thread CRUD operations
  Use `GET /api/threads` to fetch threads for sidebar
- `src/components/chat/ChatInterface.tsx` - Current runtime adapter
  Reference existing Assistant UI patterns
- `src/models/Schema.ts` - Thread schema definition
  TypeScript types available for thread data structure
- Thread List Primitives validated in spike - use ThreadListPrimitive.Root and Items

**Recommended Approach (from spike):**
- Use custom ThreadListItem component (not ThreadListPrimitive.Item)
- Wire `GET /api/threads` response directly to ThreadList (~100 lines)
- Use shadcn/ui Sheet for mobile overlay (follows architecture pattern)
- Implement sidebar state management with React useState
- Store collapsed state in localStorage for persistence across sessions

[Source: docs/sprint-artifacts/3-3-assistant-ui-integration-spike.md#Dev-Agent-Record]

### Architecture Constraints

**Component Architecture:**
- **Design System:** shadcn/ui + Radix UI primitives
- **State Management:** React hooks (useState, useReducer) - no centralized store
- **Client Components:** Use 'use client' directive for interactivity (sidebar requires client-side state)
- **Server Components:** Not applicable (sidebar is fully client-side)
- **File Naming:** kebab-case for files, PascalCase for components
- **Import Paths:** Absolute imports with `@/` prefix
[Source: docs/architecture.md#Component-Architecture]

**Responsive Design Pattern:**
- **Desktop (≥1024px):** Sidebar visible by default, collapsible to icon bar
- **Mobile (<768px):** Sidebar hidden by default, opens as overlay
- **Sheet Component:** Use shadcn/ui Sheet for mobile overlay
- **Breakpoint System:** Tailwind CSS breakpoints (sm, md, lg, xl)
[Source: docs/epics.md#Story-4-ThreadList-Sidebar-Component - AC #7, #8]

**Assistant UI Integration:**
- **Library:** @assistant-ui/react version 0.11.53
- **Location:** `src/components/chat/ChatInterface.tsx` (existing usage)
- **ThreadList Pattern:** Use ThreadListPrimitive.Root + custom ThreadListItem
- **Styling:** Tailwind CSS classes compatible with Assistant UI primitives
- **DevTools:** @assistant-ui/react-devtools available for debugging
[Source: docs/architecture.md#AI-Features, spike findings]

**Thread API Integration:**
- **Endpoint:** `GET /api/threads` - Returns user's threads (authenticated)
- **Response Format:** JSON array of threads (ordered by updated_at DESC)
- **Thread Shape:** { id, user_id, conversation_id, title, last_message_preview, archived, created_at, updated_at }
- **Authentication:** Supabase session required (middleware enforces)
- **Error Handling:** Follow existing API error patterns (logger.error, NextResponse.json)
[Source: docs/epics.md#Story-1-Database-Schema-Thread-CRUD-APIs]

**Testing Standards:**
- **Unit Tests:** Vitest + React Testing Library
- **Location:** Co-located with source (`ThreadListSidebar.test.tsx`)
- **Coverage:** Component rendering, user interactions, API mocking
- **Patterns:** Follow established patterns in `tests/integration/api/`
[Source: docs/architecture.md#Testing-Strategy]

### Component Structure

**Files to Create:**
- `src/components/chat/AppShell.tsx` - Layout wrapper with sidebar + main content
- `src/components/chat/ThreadListSidebar.tsx` - Main sidebar component
- `src/components/chat/ThreadItem.tsx` - Individual thread row component
- `src/components/chat/EmptyThreadState.tsx` - Empty state when no threads
- `src/components/chat/ThreadListSkeleton.tsx` - Loading skeleton component
- `src/components/chat/ThreadListSidebar.test.tsx` - Component tests

**Files to Modify:**
- `src/app/[locale]/(auth)/chat/layout.tsx` - Use AppShell wrapper

**Dependencies (Already Installed):**
- @assistant-ui/react (0.11.53) - ThreadListPrimitive
- @assistant-ui/react-devtools - DevTools for debugging
- shadcn/ui Sheet component - Mobile overlay
- next/navigation - Router for navigation
- Tailwind CSS - Styling

### Implementation Notes

**Sidebar State Management:**
- Use React useState for sidebar open/closed state
- Store collapsed preference in localStorage for persistence
- Context API NOT needed (component-level state sufficient)

**Thread Fetching:**
- Fetch on component mount: `useEffect(() => fetchThreads(), [])`
- Handle loading, success, and error states
- No polling/real-time updates (fetch on mount only for MVP)

**Archive Functionality:**
- Call `PATCH /api/threads/[id]/archive` with { archived: true }
- Remove thread from local state immediately (optimistic update)
- Show toast notification on success/error

**Navigation:**
- Use Next.js `useRouter` from 'next/navigation'
- Navigate to `/chat/[threadId]` on thread click
- Navigate to `/chat` for new thread (empty composer)

**Keyboard Shortcuts:**
- Add event listener for Cmd/Ctrl+B
- Use `useEffect` with cleanup for listener
- Check for modifier key (metaKey on Mac, ctrlKey on Windows)

**Responsive Behavior:**
- Desktop: `<aside className="hidden lg:flex">` - Always visible on large screens
- Mobile: Use shadcn/ui Sheet component with trigger button
- Hamburger menu: Position in top-left of chat header (mobile only)

### Project Structure Notes

**Component Organization:**
```
src/components/chat/
├── AppShell.tsx              # NEW - Layout wrapper
├── ThreadListSidebar.tsx     # NEW - Main sidebar
├── ThreadItem.tsx            # NEW - Thread row
├── EmptyThreadState.tsx      # NEW - Empty state
├── ThreadListSkeleton.tsx    # NEW - Loading skeleton
├── ChatInterface.tsx         # EXISTING - No changes
└── ThreadListSidebar.test.tsx # NEW - Tests
```

**Layout Integration:**
```
src/app/[locale]/(auth)/chat/
├── layout.tsx                # MODIFY - Wrap with AppShell
├── page.tsx                  # EXISTING - No changes
└── [threadId]/
    └── page.tsx              # FUTURE - Story 3.5
```

### Testing Approach

**Component Tests (Vitest + React Testing Library):**
- Mock `GET /api/threads` API call with MSW or fetch mock
- Mock Next.js router (useRouter, usePathname)
- Test thread rendering with mock data
- Test navigation clicks (new thread, thread selection)
- Test archive button functionality
- Test loading and empty states
- Test keyboard shortcut (simulate Cmd/Ctrl+B)
- Test responsive behavior (not visual - logic only)

**Manual QA Checklist:**
- [ ] Sidebar renders on desktop
- [ ] Sidebar collapsible works (icon bar mode)
- [ ] Mobile hamburger menu opens Sheet
- [ ] Thread list fetches and displays
- [ ] Active thread highlighted correctly
- [ ] New thread navigation works
- [ ] Thread click navigation works
- [ ] Archive removes thread from sidebar
- [ ] Cmd/Ctrl+B toggles sidebar
- [ ] Loading skeletons display during fetch
- [ ] Empty state shows when no threads
- [ ] Dark mode styling correct

### References

**Epic Context:**
[Source: docs/epics.md#Story-4-ThreadList-Sidebar-Component]

**Architecture Constraints:**
[Source: docs/architecture.md#Component-Architecture]
[Source: docs/architecture.md#AI-Features]
[Source: docs/architecture.md#Testing-Strategy]

**Spike Findings:**
[Source: docs/sprint-artifacts/3-3-assistant-ui-integration-spike.md#Dev-Agent-Record]
[Source: docs/spike-notes-assistant-ui-integration.md] (if available)

**Assistant UI Documentation:**
- ThreadList: https://www.assistant-ui.com/docs/ui/ThreadList
- Thread: https://www.assistant-ui.com/docs/ui/Thread
- DevTools: https://www.assistant-ui.com/docs/devtools

**shadcn/ui Components:**
- Sheet: https://ui.shadcn.com/docs/components/sheet
- Button: https://ui.shadcn.com/docs/components/button
- Skeleton: https://ui.shadcn.com/docs/components/skeleton

**Existing Implementation:**
[Source: src/components/chat/ChatInterface.tsx - Current Assistant UI runtime]
[Source: src/app/api/threads/route.ts - Thread CRUD APIs]
[Source: src/models/Schema.ts - Thread schema]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->
No context file generated for this story. Proceeded with story file, architecture docs, and epics.

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

Implementation proceeded smoothly with no major blockers. All acceptance criteria satisfied.

### Completion Notes List

✅ **Implementation Complete** - All 12 ACs satisfied, all tasks completed

**Key Accomplishments:**
1. Created modular component architecture (AppShell, ThreadListSidebar, ThreadItem, EmptyThreadState, ThreadListSkeleton)
2. Implemented responsive layout (desktop sidebar, mobile Sheet overlay)
3. Full keyboard accessibility (Cmd/Ctrl+B toggle, Enter/Space navigation)
4. Optimistic updates for archive with rollback on failure
5. Comprehensive test coverage (9/9 tests passing)
6. Zero TypeScript errors, clean lint, successful production build

**Implementation Details:**
- Used direct Supabase API integration (not Assistant UI ThreadListPrimitive) per spike recommendations
- Sidebar state persisted to localStorage for UX consistency
- Archive implements optimistic UI updates with automatic refetch on error
- Active thread highlighting via usePathname comparison
- Cross-platform keyboard shortcuts (metaKey/ctrlKey detection)

**Dependencies Added:**
- shadcn/ui Sheet component (mobile overlay)
- shadcn/ui Skeleton component (loading states)

**Testing:**
- Component tests: 9 passing (fetch, render, navigation, archive, loading, empty states)
- Type check: Passing (npx tsc --noEmit)
- Lint: Clean (npm run lint)
- Build: Successful (npm run build)

### File List

**Created:**
- src/components/chat/AppShell.tsx
- src/components/chat/ThreadListSidebar.tsx
- src/components/chat/ThreadItem.tsx
- src/components/chat/EmptyThreadState.tsx
- src/components/chat/ThreadListSkeleton.tsx
- src/components/chat/ThreadListSidebar.test.tsx
- src/components/ui/sheet.tsx (shadcn)
- src/components/ui/skeleton.tsx (shadcn)

**Modified:**
- src/app/[locale]/(chat)/chat/page.tsx (integrated AppShell)
- src/components/chat/ChatInterface.tsx (removed embedded sidebar/ThreadList)

## Change Log

- 2025-12-29: Story drafted by SM agent (Bob) - Created from Epic 3 Story 4 requirements, leveraging previous story (3.3) learnings and spike findings.
- 2025-12-29: Story implemented by Dev agent (Amelia) - All 12 acceptance criteria satisfied, 9 component tests passing, code quality checks passed.
