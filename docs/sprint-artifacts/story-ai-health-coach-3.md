# Story 1.3: Create Chat Interface with Assistant-UI

**Status:** Ready for Dev

---

## User Story

As a user,
I want an intuitive chat interface,
So that I can easily interact with the AI health coach.

---

## Acceptance Criteria

**AC #1:** Chat interface loads without errors for authenticated users
**AC #2:** User can type messages and click send button
**AC #3:** Messages display in chronological order (user right, AI left)
**AC #4:** AI responses stream in real-time with typing indicator
**AC #5:** Loading states display during response generation
**AC #6:** Error messages display clearly when requests fail
**AC #7:** UI is fully responsive on mobile (< 768px), tablet (768-1024px), and desktop (> 1024px)
**AC #8:** Chat input field auto-focuses on page load
**AC #9:** Enter key sends message, Shift+Enter adds new line
**AC #10:** E2E tests pass for complete chat flow

---

## Implementation Details

### Tasks / Subtasks

**Setup & Preparation:**
- [ ] Install @assistant-ui/react package (AC: #1)
- [ ] Review Assistant-UI documentation and examples (AC: #1)
- [ ] Create sprint_artifacts directory if needed (AC: #1)

**Page Structure:**
- [ ] Create app/[locale]/(chat)/page.tsx - main chat page (AC: #1)
- [ ] Create app/[locale]/(chat)/layout.tsx - chat layout wrapper (AC: #1)
- [ ] **CRITICAL: Add /chat to protectedPaths array in src/middleware.ts** (AC: #1 - ensures auth required)
- [ ] **CRITICAL: Add "Chat" link to DashboardHeader menu in src/app/[locale]/(auth)/dashboard/layout.tsx** (AC: #1 - accessible from dashboard)

**Chat Components:**
- [ ] Create components/chat/ChatInterface.tsx - Assistant-UI integration (AC: #1, #2)
- [ ] Create components/chat/ChatProvider.tsx - chat context provider (AC: #1)
- [ ] Integrate Assistant-UI Thread component (AC: #2, #3)
- [ ] Connect chat to /api/chat endpoint (AC: #2)
- [ ] Implement message display (user right, AI left alignment) (AC: #3)
- [ ] Add streaming response handling with typing indicator (AC: #4)

**User Experience:**
- [ ] Add loading spinner/skeleton during initial load (AC: #5)
- [ ] Add typing indicator during AI response generation (AC: #5)
- [ ] Implement error toast/banner for failed requests (AC: #6)
- [ ] Auto-focus chat input on page load (AC: #8)
- [ ] Handle Enter to send, Shift+Enter for new line (AC: #9)

**Responsive Design:**
- [ ] Style for mobile (< 768px): full-screen, bottom input (AC: #7)
- [ ] Style for tablet (768-1024px): sidebar + chat area (AC: #7)
- [ ] Style for desktop (> 1024px): full layout with sidebar (AC: #7)
- [ ] Test on mobile device or emulator (AC: #7)
- [ ] Test on tablet simulator (AC: #7)

**Styling & Polish:**
- [ ] Apply Tailwind CSS following boilerplate patterns (AC: #1)
- [ ] Use Shadcn UI components (Button, Input, Card, etc.) (AC: #1)
- [ ] Follow existing color palette from boilerplate (AC: #1)
- [ ] Add timestamps to messages (subtle, small text) (AC: #3)
- [ ] Add user/AI avatars to messages (AC: #3)

**Testing:**
- [ ] Write E2E test for complete chat flow (AC: #10)
- [ ] Test: Sign in → Navigate to chat → Send message → Receive response (AC: #10)
- [ ] Test: Error handling when backend fails (AC: #6, #10)
- [ ] Manual accessibility test: keyboard navigation (AC: #8, #9)
- [ ] Manual test: all responsive breakpoints (AC: #7)

### Technical Summary

Build chat interface using Assistant-UI's composable React components integrated with the Dify backend proxy. Style with Tailwind CSS and Shadcn UI following the SaaS boilerplate's design patterns.

**Key Technical Decisions:**
- Use Assistant-UI's `<Thread>` component for message list
- Connect to `/api/chat` endpoint (created in Story 1.2)
- Server Components by default, Client Components for interactivity
- Tailwind utility-first styling, responsive design mobile-first

**UI Component Hierarchy:**
```
page.tsx (Server Component)
  └── ChatInterface.tsx ('use client')
      ├── ChatProvider (context)
      ├── Thread (Assistant-UI)
      │   ├── MessageList
      │   └── ChatInput
      └── ErrorBoundary
```

### Project Structure Notes

- **Files to create:**
  - app/[locale]/(chat)/page.tsx
  - app/[locale]/(chat)/layout.tsx
  - components/chat/ChatInterface.tsx
  - components/chat/ChatProvider.tsx

- **Files to modify:**
  - components/Navigation.tsx (add Chat link)
  - package.json (add @assistant-ui/react)

- **Expected test locations:**
  - tests/e2e/chat.spec.ts (new)
  - tests/e2e/responsive.spec.ts (new)

- **Estimated effort:** 3 story points (2-3 days)

- **Prerequisites:**
  - Stories 1.1, 1.2 completed (auth + proxy functional)
  - Assistant-UI package installed

### Key Code References

**Assistant-UI Integration Pattern (from tech-spec.md):**
```typescript
// components/chat/ChatInterface.tsx pattern
import { useChat } from '@assistant-ui/react'
import { Thread } from '@assistant-ui/react'

export function ChatInterface() {
  const { messages, sendMessage } = useChat({
    api: '/api/chat', // Our Dify proxy endpoint
  })

  return (
    <div className="h-screen flex flex-col">
      <Thread />
    </div>
  )
}
```

**Boilerplate Component Patterns:**
- `components/ui/*` - Shadcn UI components to use
- Tailwind responsive classes: `sm:`, `md:`, `lg:`
- Component structure from tech-spec.md "Existing Patterns to Follow"

**UX/UI Guidelines:**
- See tech-spec.md "UX/UI Considerations" for complete design specifications
- Chat-specific patterns (message alignment, colors, streaming)
- Accessibility requirements (ARIA labels, keyboard nav)

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:
- Complete UX/UI specifications (UX/UI Considerations section)
- Chat interface requirements and patterns
- Responsive design breakpoints
- Accessibility requirements (ARIA, keyboard navigation)
- Component patterns from SaaS boilerplate

**Architecture:** See tech-spec.md "Technical Approach" → "Assistant-UI Integration"

---

## Context References

**Story Context:** [1-3-create-chat-interface-with-assistant-ui.context.xml](./1-3-create-chat-interface-with-assistant-ui.context.xml)

---

## Dev Agent Record

### Context Reference

- **Story Context:** [1-3-create-chat-interface-with-assistant-ui.context.xml](./1-3-create-chat-interface-with-assistant-ui.context.xml)

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
