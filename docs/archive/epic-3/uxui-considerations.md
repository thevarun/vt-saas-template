# UX/UI Considerations

**UI Components Affected:**

**Created:**
- ThreadListSidebar (left panel)
- AppShell (layout wrapper)
- ThreadItem (individual thread in list)
- EmptyThreadState (no threads message)
- ThreadTitleEditor (inline editing)

**Modified:**
- ChatInterface (now uses ThreadPrimitive.Root)
- Dashboard layout (new route structure)

**UX Flow Changes:**

**Current Flow:**
```
1. User navigates to /chat
2. User sees single conversation
3. User sends message
4. Message added to conversation
5. (No way to start fresh)
```

**New Flow:**
```
1. User navigates to /chat
   → Sees empty state OR existing thread list
2. User clicks "New Thread"
   → Routes to /chat with empty composer
3. User sends first message
   → Thread created in database
   → Appears in sidebar as "New Conversation"
4. User can rename thread inline
5. User can click other threads to switch
6. User can archive old threads
```

**Visual/Interaction Patterns:**

**Design System Alignment:**
- Uses existing shadcn/ui components (Button, Sheet, Input, Skeleton, Tooltip)
- Follows Tailwind CSS utility classes
- Respects dark mode via next-themes
- Maintains consistent spacing/typography

**New Patterns Introduced:**
- Sidebar thread list (ChatGPT/Claude UX pattern)
- Collapsible sidebar with keyboard shortcut (Cmd/Ctrl+B)
- Inline thread title editing
- Archive icon button (hover to reveal)

**Responsive Design:**

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (≥1024px)** | Sidebar visible (250px), collapsible to 60px icon bar |
| **Tablet (768-1023px)** | Sidebar collapsed by default, expands to overlay |
| **Mobile (<768px)** | Sidebar hidden, hamburger menu triggers overlay |

**Accessibility:**

| Feature | Implementation |
|---------|----------------|
| **Keyboard Navigation** | Tab through threads, Enter to select, Cmd+B toggle |
| **Screen Readers** | ARIA labels on all interactive elements |
| **Focus Management** | Focus moves to composer after thread switch |
| **Color Contrast** | WCAG AA compliant (verified with existing theme) |
| **Touch Targets** | Minimum 44x44px for mobile tap targets |

**User Feedback:**

- **Loading States:** Skeleton components during thread fetch, spinner during message send
- **Error Messages:** Toast notifications for failed operations with retry button
- **Success Confirmations:** Subtle toast for thread archived, title updated
- **Progress Indicators:** SSE streaming indicator (existing from current chat)
- **Optimistic Updates:** Threads appear immediately, rollback on error

---
