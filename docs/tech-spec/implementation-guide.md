# Implementation Guide

## Setup Steps

**Pre-Implementation Checklist:**

- [ ] Feature branch created (`git checkout -b feature/multi-thread-chat`)
- [ ] Dependencies installed (`npm install @assistant-ui/react-devtools`)
- [ ] Development environment running (`npm run dev`)
- [ ] Database schema created in Supabase SQL Editor
- [ ] Drizzle migration generated (`npm run db:generate`)
- [ ] RLS policies applied in Supabase
- [ ] Reviewed existing code references:
  - `src/app/api/chat/route.ts` (current chat API)
  - `src/components/chat/ChatInterface.tsx` (current UI)
  - `src/libs/dify/client.ts` (Dify integration)

## Implementation Steps

**Phase 1: Database & Backend (Stories 1-2)**

**Step 1.1:** Create Database Schema
```bash
# 1. Add to src/models/Schema.ts (Drizzle schema definition)
# 2. Generate migration
npm run db:generate
# 3. Create health_companion schema in Supabase SQL Editor
# 4. Apply RLS policies
```

**Step 1.2:** Build Thread CRUD APIs
```typescript
// src/app/api/threads/route.ts
// - GET: List threads
// - POST: Create thread

// src/app/api/threads/[id]/route.ts
// - PATCH: Update thread
// - DELETE: Delete thread

// src/app/api/threads/[id]/archive/route.ts
// - PATCH: Toggle archive
```

**Step 1.3:** Modify Chat API for Thread Creation
```typescript
// src/app/api/chat/route.ts
// After Dify SSE stream completes:
// - Extract conversation_id from metadata
// - POST to /api/threads internally
// - Return thread_id in response
```

**Phase 2: Assistant UI Integration (Story 3)**

**Step 2.1:** Run 2-Hour Spike
```bash
# Goal: Verify Assistant UI works with our setup
# 1. Create spike branch
# 2. Install devtools
# 3. Create minimal ThreadList with mock data
# 4. Create minimal Thread component
# 5. Verify runtime state in devtools
# 6. Document findings or blockers
```

**Phase 3: Frontend Components (Stories 4-5)**

**Step 3.1:** Create AppShell Layout
```typescript
// src/app/[locale]/(auth)/chat/layout.tsx
// - Sidebar with ThreadListSidebar
// - Main content area ({children})
// - Responsive behavior (Sheet on mobile)
// - Sidebar state context
```

**Step 3.2:** Build ThreadListSidebar
```typescript
// src/components/chat/ThreadListSidebar.tsx
// - Fetch threads via GET /api/threads
// - Render ThreadListPrimitive.Items
// - "New Thread" button
// - Thread item click → navigate to /chat/[id]
// - Archive button per thread
```

**Step 3.3:** Integrate Thread Component
```typescript
// src/app/[locale]/(auth)/chat/[threadId]/page.tsx
// - Load thread data (server component)
// - Pass to ThreadView (client component)
// - ThreadView uses ThreadPrimitive.Root
// - Configure runtime adapter for /api/chat
// - Handle message send + thread metadata update
```

**Step 3.4:** Add DevTools
```typescript
// src/app/[locale]/(auth)/chat/layout.tsx
import { DevToolsModal } from '@assistant-ui/react-devtools'

<AssistantRuntimeProvider>
  <DevToolsModal />
  {children}
</AssistantRuntimeProvider>
```

**Phase 4: Polish & Navigation (Story 6)**

**Step 4.1:** Add Navigation Placeholders
```typescript
// In AppShell sidebar:
// - Pricing (onClick: toast("Coming Soon"))
// - Feature 1 (onClick: toast("Coming Soon"))
// - Feature 2 (onClick: toast("Coming Soon"))
```

**Step 4.2:** Implement Thread Title Editing
```typescript
// src/components/chat/ThreadTitleEditor.tsx
// - Inline editable input
// - PATCH /api/threads/[id] on blur
// - Optimistic update
```

**Step 4.3:** Add Empty States
```typescript
// - No threads: "Start your first conversation"
// - Thread loading: Skeleton components
// - Error states: Retry button
```

**Step 4.4:** Keyboard Shortcuts
```typescript
// Cmd/Ctrl + B: Toggle sidebar
// Implemented via event listener in AppShell
```

## Testing Strategy

**MVP Testing Scope (Lean Approach):**

**Unit Tests (Vitest):**
```typescript
// src/app/api/threads/route.test.ts
describe('GET /api/threads', () => {
  it('returns user threads', async () => {
    // Mock Supabase auth
    // Mock DB query
    // Assert response structure
  })

  it('returns 401 for unauthenticated', async () => {
    // Mock no auth
    // Assert 401 status
  })
})

// src/components/chat/ThreadListSidebar.test.tsx
describe('ThreadListSidebar', () => {
  it('renders thread list', () => {
    render(<ThreadListSidebar threads={mockThreads} />)
    expect(screen.getByText('New Thread')).toBeInTheDocument()
  })

  it('navigates on thread click', async () => {
    // Mock router
    // Click thread
    // Assert navigation called
  })
})
```

**E2E Tests (Playwright):**
```typescript
// tests/e2e/multi-thread-chat.spec.ts
test.describe('Multi-Thread Chat', () => {
  test('user can create and switch threads', async ({ page }) => {
    // 1. Login
    await page.goto('/sign-in')
    await login(page)

    // 2. Navigate to chat
    await page.goto('/chat')

    // 3. Send first message (creates thread)
    await page.fill('[placeholder="Send a message"]', 'Hello')
    await page.press('[placeholder="Send a message"]', 'Enter')

    // 4. Wait for thread to appear in sidebar
    await expect(page.locator('.thread-list')).toContainText('New Conversation')

    // 5. Create second thread
    await page.click('text=New Thread')
    await page.fill('[placeholder="Send a message"]', 'Second thread')
    await page.press('[placeholder="Send a message"]', 'Enter')

    // 6. Verify two threads exist
    const threads = page.locator('.thread-item')
    await expect(threads).toHaveCount(2)

    // 7. Switch to first thread
    await threads.first().click()

    // 8. Verify messages from first thread visible
    await expect(page.locator('text=Hello')).toBeVisible()
    await expect(page.locator('text=Second thread')).not.toBeVisible()
  })

  test('thread title is editable', async ({ page }) => {
    // Navigate to thread
    // Click title
    // Edit text
    // Blur
    // Assert PATCH called
    // Assert title updated in sidebar
  })

  test('user can archive threads', async ({ page }) => {
    // Navigate to thread
    // Click archive button
    // Assert thread removed from sidebar
    // Verify archived=true in database
  })
})
```

**Manual QA Checklist:**
- [ ] Desktop: Sidebar visible, collapsible via button and Cmd+B
- [ ] Tablet: Sidebar collapsible, icon navigation
- [ ] Mobile: Sidebar hidden, opens as overlay
- [ ] Thread creation: First message creates thread in sidebar
- [ ] Thread switching: Click thread loads correct conversation
- [ ] Thread title editing: Inline edit works, updates persist
- [ ] Archive: Thread disappears from list, can be unarchived
- [ ] Empty states: Proper messaging when no threads
- [ ] Loading states: Skeletons during fetch
- [ ] Error handling: Toast messages on failures, retry options
- [ ] Streaming: Chat responses stream correctly
- [ ] Dark mode: All components respect theme

## Acceptance Criteria

**Story 1: Database + APIs**
- ✅ AC #1: `health_companion` schema created in Supabase
- ✅ AC #2: `threads` table exists with correct columns and indexes
- ✅ AC #3: RLS policies enforce user-scoped access
- ✅ AC #4: `GET /api/threads` returns authenticated user's threads
- ✅ AC #5: `POST /api/threads` creates thread with conversation_id
- ✅ AC #6: `PATCH /api/threads/[id]` updates title and metadata
- ✅ AC #7: `PATCH /api/threads/[id]/archive` toggles archive status
- ✅ AC #8: `DELETE /api/threads/[id]` removes thread permanently
- ✅ AC #9: All endpoints return 401 for unauthenticated requests
- ✅ AC #10: Integration tests pass for happy path

**Story 2: Thread Persistence**
- ✅ AC #1: `/api/chat` captures conversation_id from Dify response
- ✅ AC #2: Thread auto-created after first message
- ✅ AC #3: Thread appears in sidebar after creation
- ✅ AC #4: Thread `updated_at` updates on new messages
- ✅ AC #5: `last_message_preview` stores first 100 chars of last message
- ✅ AC #6: E2E test: Send message → Thread appears in sidebar

**Story 3: Assistant UI Spike**
- ✅ AC #1: ThreadList renders with mock data
- ✅ AC #2: Thread component renders with mock messages
- ✅ AC #3: DevTools show runtime state correctly
- ✅ AC #4: Spike documented: Integration approach confirmed OR blockers identified
- ✅ AC #5: Team consensus on approach before Story 4

**Story 4: ThreadList Sidebar**
- ✅ AC #1: AppShell layout renders sidebar + main content
- ✅ AC #2: ThreadList displays user's threads fetched from API
- ✅ AC #3: "New Thread" button navigates to `/chat`
- ✅ AC #4: Clicking thread navigates to `/chat/[threadId]`
- ✅ AC #5: Active thread highlighted in sidebar
- ✅ AC #6: Archive button archives thread (disappears from list)
- ✅ AC #7: Desktop: Sidebar visible by default, collapsible
- ✅ AC #8: Mobile: Sidebar hidden, opens as overlay via hamburger menu
- ✅ AC #9: Keyboard shortcut (Cmd/Ctrl+B) toggles sidebar
- ✅ AC #10: Loading state shows skeletons during fetch
- ✅ AC #11: Empty state shows "Start your first conversation" when no threads

**Story 5: Thread Component**
- ✅ AC #1: Chat interface uses ThreadPrimitive.Root
- ✅ AC #2: Messages render correctly in conversation view
- ✅ AC #3: Composer sends message via `/api/chat`
- ✅ AC #4: Streaming responses work (SSE from Dify)
- ✅ AC #5: Thread metadata updates on new message (last_message_preview, updated_at)
- ✅ AC #6: Thread title editable inline (click to edit)
- ✅ AC #7: DevTools visible in dev mode, show runtime state
- ✅ AC #8: E2E test: Full chat flow works with threading

**Story 6: Navigation + Polish**
- ✅ AC #1: Sidebar navigation includes: Threads, Pricing, Feature 1, Feature 2
- ✅ AC #2: Placeholder items show "Coming Soon" toast on click
- ✅ AC #3: All empty states styled and helpful
- ✅ AC #4: All error states have retry mechanisms
- ✅ AC #5: Dark mode works across all new components
- ✅ AC #6: Mobile responsive behavior tested and working
- ✅ AC #7: Manual QA checklist completed
- ✅ AC #8: Production build succeeds, no console errors
- ✅ AC #9: DevTools excluded from production bundle (verify with bundle analyzer)

---
