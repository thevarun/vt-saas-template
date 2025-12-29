# Story 3.5: thread-component-integration

Status: ready-for-dev

## Story

As a **user**,
I want **to view and interact with individual conversation threads**,
so that **I can have focused health discussions with context preserved across messages and sessions**.

## Acceptance Criteria

1. AC #1: Chat interface uses ThreadPrimitive.Root from @assistant-ui/react
2. AC #2: Messages render correctly in conversation view
3. AC #3: Composer sends message via `/api/chat` with conversation_id
4. AC #4: Streaming responses work (SSE from Dify)
5. AC #5: Thread metadata updates on new message (last_message_preview, updated_at via PATCH)
6. AC #6: Thread title editable inline (click to edit, blur to save)
7. AC #7: DevTools visible in dev mode, show runtime state (thread, messages, composer)
8. AC #8: E2E test: Full chat flow works with threading (send message, switch thread, verify isolation)
9. AC #9: No regression in existing chat functionality (markdown rendering, streaming indicators)

## Tasks / Subtasks

- [ ] **Task 1: Create Dynamic Thread Route** (AC: #1, #2)
  - [ ] 1.1: Create `/src/app/[locale]/(chat)/chat/[threadId]/page.tsx` route
  - [ ] 1.2: Implement server component to fetch thread data from `/api/threads/[id]`
  - [ ] 1.3: Pass thread data to ThreadView client component
  - [ ] 1.4: Handle 404 error if thread not found (redirect to /chat with toast)
  - [ ] 1.5: Verify route navigation works from sidebar thread click

- [ ] **Task 2: Migrate ChatInterface to Use ThreadPrimitive** (AC: #1, #2, #9)
  - [ ] 2.1: Update `src/components/chat/ChatInterface.tsx` to use ThreadPrimitive.Root
  - [ ] 2.2: Replace custom message rendering with ThreadPrimitive.Messages
  - [ ] 2.3: Use ThreadPrimitive.Viewport for auto-scrolling behavior
  - [ ] 2.4: Integrate ThreadPrimitive.Composer for message input
  - [ ] 2.5: Verify markdown rendering still works (@assistant-ui/react-markdown)
  - [ ] 2.6: Ensure message streaming indicators display correctly
  - [ ] 2.7: Test dark mode compatibility with ThreadPrimitive components

- [ ] **Task 3: Configure Runtime Adapter for Multi-Thread Support** (AC: #3, #4)
  - [ ] 3.1: Update runtime adapter in ChatInterface to accept threadId prop
  - [ ] 3.2: Modify sendMessage handler to include conversation_id from thread data
  - [ ] 3.3: Ensure SSE streaming from `/api/chat` continues to work
  - [ ] 3.4: Handle case where thread has no conversation_id yet (first message)
  - [ ] 3.5: Verify assistant responses stream correctly with proper formatting

- [ ] **Task 4: Implement Thread Metadata Updates** (AC: #5)
  - [ ] 4.1: After each message sent, extract last message text (first 100 chars)
  - [ ] 4.2: Call `PATCH /api/threads/[id]` to update last_message_preview
  - [ ] 4.3: Update updated_at timestamp via same PATCH request
  - [ ] 4.4: Implement optimistic update in ThreadListSidebar (refetch threads)
  - [ ] 4.5: Handle metadata update errors gracefully (log, don't block chat)

- [ ] **Task 5: Implement Inline Thread Title Editing** (AC: #6)
  - [ ] 5.1: Create `src/components/chat/ThreadTitleEditor.tsx` component
  - [ ] 5.2: Display thread title as editable text (click to edit mode)
  - [ ] 5.3: Show Input field on click, auto-focus, select all text
  - [ ] 5.4: Save title on blur or Enter key press
  - [ ] 5.5: Call `PATCH /api/threads/[id]` with new title
  - [ ] 5.6: Update thread title in sidebar immediately (optimistic update)
  - [ ] 5.7: Revert to original title if PATCH fails (with toast error)
  - [ ] 5.8: Show placeholder "Untitled Conversation" if title is null

- [ ] **Task 6: Integrate Assistant UI DevTools** (AC: #7)
  - [ ] 6.1: Add DevToolsModal import in chat layout
  - [ ] 6.2: Render `<DevToolsModal />` inside AssistantRuntimeProvider
  - [ ] 6.3: Verify DevTools only appear in development mode (process.env.NODE_ENV)
  - [ ] 6.4: Test DevTools display runtime state correctly (messages, thread, composer)
  - [ ] 6.5: Verify DevTools excluded from production bundle (check with ANALYZE=true npm run build)

- [ ] **Task 7: Update Empty Chat State** (AC: #1)
  - [ ] 7.1: Update `/src/app/[locale]/(chat)/chat/page.tsx` (root /chat route)
  - [ ] 7.2: Display EmptyThreadState component when no threadId in route
  - [ ] 7.3: Add helpful copy: "Start a new conversation" with CTA
  - [ ] 7.4: Ensure "New Thread" button in sidebar still navigates to /chat

- [ ] **Task 8: Write E2E Test for Multi-Thread Chat Flow** (AC: #8)
  - [ ] 8.1: Create `tests/e2e/multi-thread-chat.spec.ts`
  - [ ] 8.2: Test: User sends message → Thread created in sidebar
  - [ ] 8.3: Test: User creates second thread via "New Thread" button
  - [ ] 8.4: Test: Send message in second thread
  - [ ] 8.5: Test: Switch back to first thread via sidebar click
  - [ ] 8.6: Test: Verify first thread messages visible, second thread messages not visible
  - [ ] 8.7: Test: Verify thread isolation (messages don't leak between threads)
  - [ ] 8.8: Run test: `npm run test:e2e multi-thread-chat.spec.ts`

- [ ] **Task 9: Regression Testing** (AC: #9)
  - [ ] 9.1: Verify streaming responses still work (check SSE chunks)
  - [ ] 9.2: Verify markdown rendering (bold, italic, lists, code blocks)
  - [ ] 9.3: Verify loading indicators during assistant response
  - [ ] 9.4: Test error handling (API failures, network errors)
  - [ ] 9.5: Verify dark mode works across all thread components
  - [ ] 9.6: Test responsive behavior (desktop, tablet, mobile)

- [ ] **Task 10: Code Quality Checks**
  - [ ] 10.1: TypeScript compilation (`npx tsc --noEmit`)
  - [ ] 10.2: ESLint checks (`npm run lint`)
  - [ ] 10.3: Production build (`npm run build`)
  - [ ] 10.4: All checks passing

## Dev Notes

### Learnings from Previous Story (3.4)

**From Story 3-4-threadlist-sidebar-component (Status: review)**

**New Components Available for Reuse:**
- `AppShell.tsx` at `src/components/chat/AppShell.tsx` - Layout wrapper already integrates sidebar with main content area
- `ThreadListSidebar.tsx` at `src/components/chat/ThreadListSidebar.tsx` - Sidebar fetches and displays threads
- `ThreadItem.tsx` at `src/components/chat/ThreadItem.tsx` - Individual thread row with navigation
- `EmptyThreadState.tsx` at `src/components/chat/EmptyThreadState.tsx` - Use for /chat root route

**Integration Pattern Established:**
- Chat layout at `src/app/[locale]/(chat)/chat/page.tsx` already wrapped with AppShell
- Sidebar state management via React useState + localStorage persistence
- Navigation uses Next.js useRouter and usePathname
- Active thread highlighting via pathname comparison

**APIs Ready to Use:**
- `GET /api/threads` - Fetch all user threads (used by sidebar)
- `PATCH /api/threads/[id]` - Update thread metadata (title, last_message_preview, updated_at)
  ```typescript
  // Example PATCH request body
  {
    title: "Updated Title",
    lastMessagePreview: "First 100 chars of last message..."
  }
  ```

**Assistant UI Integration Validated (from Story 3.3):**
- @assistant-ui/react version 0.11.53 fully compatible
- ThreadPrimitive.Root, Messages, Viewport, Composer components ready to use
- Existing runtime adapter in ChatInterface.tsx works with Dify SSE streaming
- Only modification needed: wire conversation_id from thread data (~100 lines)
- DevTools integration is trivial (5 lines of code)

**Current Chat Setup:**
- Location: `src/components/chat/ChatInterface.tsx`
- Already using @assistant-ui/react with custom Dify adapter
- Runtime adapter handles SSE streaming from `/api/chat`
- **IMPORTANT:** Do NOT recreate this - MODIFY existing ChatInterface to use ThreadPrimitive pattern

**Responsive Behavior:**
- Desktop: AppShell renders sidebar visible by default
- Mobile: Sidebar hidden, opens as Sheet overlay
- All handled by AppShell - no additional work needed

**Testing Patterns:**
- Component tests: Vitest + React Testing Library (9 tests passing for sidebar)
- Co-located test files: `*.test.tsx` next to source files
- E2E tests: Playwright in `tests/e2e/` directory

[Source: docs/sprint-artifacts/3-4-threadlist-sidebar-component.md#Dev-Agent-Record]

### Architecture Constraints

**Component Architecture Pattern:**
- **Server Components:** Use for route pages (`/chat/[threadId]/page.tsx`) to fetch thread data
- **Client Components:** Use for ChatInterface (requires 'use client' for interactivity)
- **Props Flow:** Server component fetches data → passes to client component
- **Navigation:** Next.js router from 'next/navigation'
[Source: docs/architecture.md#Component-Architecture]

**Thread Component Integration:**
- **ThreadPrimitive.Root:** Container for entire chat interface
- **ThreadPrimitive.Messages:** Message list with auto-scrolling
- **ThreadPrimitive.Viewport:** Auto-scroll viewport wrapper
- **ThreadPrimitive.Composer:** Message input with send button
- **Styling:** Tailwind CSS classes compatible with Assistant UI
[Source: docs/tech-spec/implementation-details.md#Component-Reuse-Strategy]

**Runtime Adapter Configuration:**
```typescript
// Pattern from tech spec
const runtime = useLocalRuntime(adapter);

const adapter = {
  async sendMessage({ message, threadId }) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationId: thread.conversation_id
      })
    });
    // Handle SSE stream
    // Update thread metadata after response
  }
}
```
[Source: docs/tech-spec/implementation-details.md#Technical-Approach]

**Thread Metadata Update Strategy:**
- Update after each message sent
- Extract last_message_preview (first 100 chars of user or assistant message)
- PATCH /api/threads/[id] with { lastMessagePreview, updatedAt }
- Optimistic update in sidebar (refetch threads on error)
[Source: docs/tech-spec/technical-details.md#State-Synchronization-Strategy]

**DevTools Integration:**
- Import: `import { DevToolsModal } from '@assistant-ui/react-devtools'`
- Render inside AssistantRuntimeProvider
- Only in development: `{process.env.NODE_ENV === 'development' && <DevToolsModal />}`
- Verify tree-shaking in production build
[Source: docs/epics.md#Story-5-Thread-Component-Integration - AC #7]

**Error Handling:**
- Thread not found: Redirect to /chat with toast notification
- API failures: Toast error, don't block UI
- Metadata update failures: Log error, don't prevent message sending
- Network errors: Show offline indicator, queue messages (future)
[Source: docs/tech-spec/technical-details.md#Error-Handling-Strategies]

**Testing Standards:**
- E2E tests cover full user flow (Playwright)
- Happy path focus for MVP
- Verify thread isolation (messages don't leak between threads)
- Test streaming, markdown, dark mode (regression)
[Source: docs/tech-spec/implementation-guide.md#Testing-Strategy]

### Component Structure

**Files to Create:**
- `src/app/[locale]/(chat)/chat/[threadId]/page.tsx` - Dynamic thread route (server component)
- `src/components/chat/ThreadView.tsx` - Thread display component (client component)
- `src/components/chat/ThreadTitleEditor.tsx` - Inline title editing component
- `tests/e2e/multi-thread-chat.spec.ts` - E2E test for multi-thread flow

**Files to Modify:**
- `src/components/chat/ChatInterface.tsx` - Migrate to ThreadPrimitive pattern
- `src/app/[locale]/(chat)/chat/page.tsx` - Update empty state
- `src/app/[locale]/(chat)/chat/layout.tsx` - Add DevToolsModal

**Dependencies (Already Installed):**
- @assistant-ui/react (0.11.53) - ThreadPrimitive components
- @assistant-ui/react-devtools - DevTools modal
- @assistant-ui/react-markdown - Markdown rendering
- Next.js - Dynamic routing, useRouter

### Implementation Notes

**Dynamic Route Structure:**
```
src/app/[locale]/(chat)/chat/
├── page.tsx              # Empty state (no thread selected)
├── [threadId]/
│   └── page.tsx          # Thread view (NEW)
└── layout.tsx            # AppShell wrapper (MODIFY for DevTools)
```

**Thread Data Fetching (Server Component):**
```typescript
// src/app/[locale]/(chat)/chat/[threadId]/page.tsx
export default async function ThreadPage({ params }: { params: { threadId: string } }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch thread data server-side
  const { data: { user } } = await supabase.auth.getUser();
  const thread = await fetchThread(params.threadId, user.id);

  if (!thread) {
    redirect('/chat'); // Redirect to empty state if not found
  }

  return <ThreadView thread={thread} />;
}
```

**ThreadPrimitive Migration Pattern:**
```typescript
// Before (current ChatInterface.tsx pattern):
<div className="chat-container">
  <MessageList messages={messages} />
  <Composer onSend={handleSend} />
</div>

// After (ThreadPrimitive pattern):
<ThreadPrimitive.Root>
  <ThreadPrimitive.Viewport>
    <ThreadPrimitive.Messages />
  </ThreadPrimitive.Viewport>
  <ThreadPrimitive.Composer />
</ThreadPrimitive.Root>
```

**Runtime Adapter with Thread Support:**
```typescript
const adapter = useMemo(() => ({
  async sendMessage({ message }: { message: string }) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId: thread.conversation_id || undefined
      })
    });

    // Handle SSE stream...

    // After response completes, update thread metadata
    await fetch(`/api/threads/${thread.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        lastMessagePreview: message.slice(0, 100)
      })
    });
  }
}), [thread]);

const runtime = useLocalRuntime(adapter);
```

**Thread Title Editing Pattern:**
```typescript
// ThreadTitleEditor.tsx
const [isEditing, setIsEditing] = useState(false);
const [title, setTitle] = useState(thread.title || '');

const handleSave = async () => {
  try {
    await fetch(`/api/threads/${thread.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    });
    toast.success('Title updated');
  } catch (error) {
    toast.error('Failed to update title');
    setTitle(thread.title || ''); // Revert
  }
  setIsEditing(false);
};
```

**DevTools Integration:**
```typescript
// src/app/[locale]/(chat)/chat/layout.tsx
import { DevToolsModal } from '@assistant-ui/react-devtools';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AssistantRuntimeProvider>
        {process.env.NODE_ENV === 'development' && <DevToolsModal />}
        {children}
      </AssistantRuntimeProvider>
    </AppShell>
  );
}
```

**Thread Isolation Testing Pattern:**
```typescript
// Verify messages from thread A don't appear in thread B
test('thread isolation', async ({ page }) => {
  // Create thread A, send "Message A"
  // Create thread B, send "Message B"
  // Navigate to thread A
  await expect(page.locator('text=Message A')).toBeVisible();
  await expect(page.locator('text=Message B')).not.toBeVisible();

  // Navigate to thread B
  await page.click('[data-thread-id="thread-b"]');
  await expect(page.locator('text=Message B')).toBeVisible();
  await expect(page.locator('text=Message A')).not.toBeVisible();
});
```

### Project Structure Notes

**Route Organization:**
```
src/app/[locale]/(chat)/chat/
├── layout.tsx                    # MODIFY - Add DevTools
├── page.tsx                      # MODIFY - Empty state
└── [threadId]/
    └── page.tsx                  # NEW - Thread view
```

**Component Organization:**
```
src/components/chat/
├── AppShell.tsx                  # EXISTING - No changes
├── ThreadListSidebar.tsx         # EXISTING - No changes
├── ChatInterface.tsx             # MODIFY - Migrate to ThreadPrimitive
├── ThreadView.tsx                # NEW - Thread display wrapper
├── ThreadTitleEditor.tsx         # NEW - Inline title editing
└── EmptyThreadState.tsx          # EXISTING - Reuse for /chat page
```

### Testing Approach

**E2E Test Coverage:**
- Thread creation (first message creates thread)
- Thread switching (navigate between threads)
- Thread isolation (messages don't leak)
- Thread metadata updates (title, last message)
- Streaming responses (SSE from Dify)
- Markdown rendering (verify formats)
- Dark mode (visual consistency)

**Manual QA Checklist:**
- [ ] Navigate to /chat → Empty state displayed
- [ ] Send first message → Thread created in sidebar
- [ ] Thread appears with correct title
- [ ] Click thread in sidebar → Messages load
- [ ] Send message → Streams correctly
- [ ] Thread metadata updates (last message preview)
- [ ] Edit thread title → Saves on blur
- [ ] Create second thread → New thread appears
- [ ] Switch between threads → Correct messages displayed
- [ ] Verify markdown rendering (bold, lists, code)
- [ ] Verify dark mode styling
- [ ] Test mobile responsiveness
- [ ] Verify DevTools appear in dev mode only

### References

**Epic Context:**
[Source: docs/epics.md#Story-5-Thread-Component-Integration]

**Technical Approach:**
[Source: docs/tech-spec/implementation-details.md#Technical-Approach]
[Source: docs/tech-spec/technical-details.md#State-Synchronization-Strategy]

**Architecture Constraints:**
[Source: docs/architecture.md#Component-Architecture]
[Source: docs/architecture.md#Testing-Strategy]

**Previous Story Learnings:**
[Source: docs/sprint-artifacts/3-4-threadlist-sidebar-component.md#Dev-Agent-Record]

**Assistant UI Documentation:**
- Thread Component: https://www.assistant-ui.com/docs/ui/Thread
- ThreadList: https://www.assistant-ui.com/docs/ui/ThreadList
- Runtime: https://www.assistant-ui.com/docs/runtimes/useLocalRuntime
- DevTools: https://www.assistant-ui.com/docs/devtools

**Existing Implementation:**
[Source: src/components/chat/ChatInterface.tsx - Current runtime adapter]
[Source: src/app/api/chat/route.ts - SSE streaming implementation]
[Source: src/libs/dify/client.ts - Dify API integration]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/3-5-thread-component-integration.context.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-29: Story drafted by SM agent (Bob) - Created from Epic 3 Story 5 requirements, leveraging Story 3.4 learnings (sidebar complete, APIs ready), Story 3.3 spike findings (Assistant UI validated), and tech spec guidance.
