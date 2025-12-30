# Story 3.6: Navigation + Polish

Status: ready-for-dev

## Story

As a **user**,
I want **a polished, accessible chat experience with clear navigation and helpful feedback states**,
so that **I can confidently navigate the application and understand system status at all times**.

## Acceptance Criteria

3. AC #3: All empty states styled and helpful (no threads, loading threads, failed to load)
4. AC #4: All error states have retry mechanisms (toast with retry button)
5. AC #5: Dark mode works across all new components (respects next-themes)
6. AC #6: Mobile responsive behavior tested and working (all breakpoints)
7. AC #7: Manual QA checklist completed (see tech-spec)
8. AC #8: Production build succeeds, no console errors
9. AC #9: DevTools excluded from production bundle (verify with bundle analyzer)
10. AC #10: Accessibility: Keyboard navigation works, ARIA labels correct, focus management proper
11. AC #11: AssistantIf component used for conditional rendering (loading states, empty states, message-based conditions)
12. AC #12: Typing indicator displays during assistant response streaming
13. AC #13: Thread appears in sidebar after first message (within 2-3 seconds)
14. AC #14: Mobile header displays correctly without clipping
15. AC #15: Sidebar collapse layout expands chat content smoothly
16. AC #16: "Jump to latest" button only visible when scrolled up with messages below

## Tasks / Subtasks


- [ ] **Task 2: Implement Empty State Components** (AC: #3)
  - [ ] 2.1: Create/update `src/components/chat/EmptyThreadState.tsx` with polished design
  - [ ] 2.2: Add icon (MessageSquare or similar), heading, and helpful copy
  - [ ] 2.4: Verify EmptyThreadState displays on `/chat` route when no threads
  - [ ] 2.5: Create `LoadingThreadState.tsx` component (skeleton cards)
  - [ ] 2.6: Integrate loading state in `ThreadListSidebar.tsx` during fetch
  - [ ] 2.7: Create `ErrorThreadState.tsx` component with retry button
  - [ ] 2.8: Test all three states render correctly

- [ ] **Task 3: Implement Error States with Retry** (AC: #4)
  - [ ] 3.1: Add try-catch in `ThreadListSidebar.tsx` fetch logic
  - [ ] 3.2: Display `ErrorThreadState` when fetch fails
  - [ ] 3.3: Add retry button that triggers refetch
  - [ ] 3.4: Show toast.error() with error message
  - [ ] 3.5: Add error toast & manual retry button for thread metadata update failures
  - [ ] 3.6: Add error toast & manual retry mechanism for thread creation failures
  - [ ] 3.7: Test error handling with network disconnect simulation

- [ ] **Task 4: Dark Mode Verification** (AC: #5)
  - [ ] 4.1: Verify AppShell respects theme (light/dark classes)
  - [ ] 4.2: Verify ThreadListSidebar colors work in both themes
  - [ ] 4.3: Verify ThreadItem hover/active states in dark mode
  - [ ] 4.4: Verify ThreadTitleEditor styling in dark mode
  - [ ] 4.5: Verify EmptyThreadState styling in dark mode
  - [ ] 4.6: Verify toast notifications match theme
  - [ ] 4.7: Verify Thread component (chat area) dark mode
  - [ ] 4.8: Fix any color contrast issues found

- [ ] **Task 5: Mobile Responsive Polish** (AC: #6)
  - [ ] 5.1: Test sidebar Sheet overlay on mobile (<768px)
  - [ ] 5.2: Verify hamburger menu opens/closes sidebar correctly
  - [ ] 5.3: Test thread navigation closes sidebar on mobile
  - [ ] 5.4: Verify chat interface scales properly on mobile
  - [ ] 5.5: Test composer input on mobile (keyboard doesn't obscure)
  - [ ] 5.6: Verify tablet (768-1024px) responsive behavior
  - [ ] 5.7: Test touch gestures (swipe to close sidebar if implemented)
  - [ ] 5.8: Document any responsive issues for future fixes

- [ ] **Task 6: Implement AssistantIf Component** (AC: #11, #12)
  - [ ] 6.1: Import AssistantIf from @assistant-ui/react
  - [ ] 6.2: Update `src/components/chat/Thread.tsx` to use AssistantIf
  - [ ] 6.3: Replace ThreadPrimitive.Empty with `<AssistantIf hasMessages={false}>`
  - [ ] 6.4: Add `<AssistantIf running>` wrapper for typing indicator
  - [ ] 6.5: Create typing indicator component (animated dots or spinner)
  - [ ] 6.6: Position typing indicator below last message during streaming
  - [ ] 6.7: Test typing indicator shows during Dify SSE stream
  - [ ] 6.8: Verify typing indicator hides when response completes

- [ ] **Task 7: Accessibility Audit** (AC: #10)
  - [ ] 7.1: Add ARIA labels to sidebar toggle button
  - [ ] 7.2: Add ARIA labels to thread list (role="list", role="listitem")
  - [ ] 7.3: Add ARIA labels to New Thread button
  - [ ] 7.4: Verify Tab order is logical (sidebar → content → composer)
  - [ ] 7.5: Test Enter key activates buttons/links
  - [ ] 7.6: Test Escape key closes mobile sidebar Sheet
  - [ ] 7.7: Verify focus management when switching threads
  - [ ] 7.8: Add skip-to-content link for screen readers
  - [ ] 7.9: Run axe DevTools audit, fix critical issues

- [ ] **Task 8: Production Build Verification** (AC: #8, #9)
  - [ ] 8.1: Run `npm run build` and verify success
  - [ ] 8.2: Check for console errors in production build
  - [ ] 8.3: Run `ANALYZE=true npm run build` for bundle analysis
  - [ ] 8.4: Verify @assistant-ui/react-devtools not in production bundle
  - [ ] 8.5: Check bundle size is reasonable (<500KB first load JS)
  - [ ] 8.6: Run production build locally with `npm start`
  - [ ] 8.7: Test full flow in production mode

- [ ] **Task 9: Manual QA Checklist** (AC: #7)
  - [ ] 9.1: Test on Chrome (desktop + mobile)
  - [ ] 9.2: Test on Safari (desktop + mobile)
  - [ ] 9.3: Test on Firefox (desktop)
  - [ ] 9.4: Verify navigation items show Coming Soon toast
  - [ ] 9.5: Verify empty state displays correctly
  - [ ] 9.6: Verify loading state shows skeletons
  - [ ] 9.7: Verify error state shows with retry
  - [ ] 9.8: Verify typing indicator during streaming
  - [ ] 9.9: Verify dark mode toggle works
  - [ ] 9.10: Verify sidebar keyboard shortcut (Cmd/Ctrl+B)
  - [ ] 9.11: Verify all threads load and switch correctly
  - [ ] 9.12: Document any issues found

- [ ] **Task 10: Code Quality Checks**
  - [ ] 10.1: TypeScript compilation (`npx tsc --noEmit`)
  - [ ] 10.2: ESLint checks (`npm run lint`)
  - [ ] 10.3: Fix any lint errors
  - [ ] 10.4: Run unit tests (`npm test`)
  - [ ] 10.5: Run E2E tests (`npm run test:e2e`)
  - [ ] 10.6: All checks passing

- [ ] **Task 11: UX Polish from Internal Review** (AC: #13, #14, #15, #16)
  - [ ] 11.1: **Fix thread not appearing in sidebar** - Verify thread auto-creation triggers on first message response, add optimistic UI update or refetch after thread creation
  - [ ] 11.2: **Fix mobile header clipping** - Add proper spacing between sidebar toggle and title, check z-index layering
  - [ ] 11.3: **Remove duplicate empty states** - Sidebar shows minimal state, main area keeps full empty state
  - [ ] 11.4: **Hide "Jump to latest" when not needed** - Hide when empty or at bottom, show only when scrolled up
  - [ ] 11.5: **Remove redundant collapse control** - Remove "Collapse" text at bottom, keep icon at top with tooltip
  - [ ] 11.6: **Fix collapsed sidebar layout** - Chat content smoothly expands to fill space, add CSS transitions
  - [ ] 11.7: **Fix empty state copy** - Change "above" to "in the sidebar" for accurate direction
  - [ ] 11.8: **Polish typing indicator** - Create TypingIndicator.tsx with 3 animated dots + "Assistant is typing..." text

## Dev Notes

### Learnings from Previous Story (3.5)

**From Story 3-5-thread-component-integration (Status: review)**

**Components Available for Reuse:**
- `AppShell.tsx` at `src/components/chat/AppShell.tsx` - Layout wrapper, needs nav section added
- `ThreadListSidebar.tsx` at `src/components/chat/ThreadListSidebar.tsx` - Sidebar with thread list
- `ThreadItem.tsx` at `src/components/chat/ThreadItem.tsx` - Individual thread row
- `EmptyThreadState.tsx` at `src/components/chat/EmptyThreadState.tsx` - Empty state component (needs polish)
- `ThreadTitleEditor.tsx` at `src/components/chat/ThreadTitleEditor.tsx` - Inline title editing
- `ThreadView.tsx` at `src/components/chat/ThreadView.tsx` - Thread display wrapper
- `Thread.tsx` at `src/components/chat/Thread.tsx` - Already using ThreadPrimitive

**Key Implementation Notes:**
- Thread component already using ThreadPrimitive (minimal migration needed)
- Thread sidebar refetches every 5 seconds to sync metadata updates
- Toast notifications removed from title editor (console logging used instead) - ADD BACK for this story
- DevTools already integrated for development debugging
- Markdown rendering simplified temporarily due to type incompatibilities

**Files Modified in 3.5:**
- `src/components/chat/ChatInterface.tsx`
- `src/components/chat/Thread.tsx`
- `src/components/chat/ThreadListSidebar.tsx`
- `src/app/[locale]/(chat)/chat/page.tsx`
- `package.json` (added @assistant-ui/react-devtools)

[Source: docs/sprint-artifacts/3-5-thread-component-integration.md#Dev-Agent-Record]

### Architecture Constraints

**Component Architecture:**
- Server Components for route pages
- Client Components for interactive elements (`'use client'`)
- Follow shadcn/ui patterns for UI components
- Use next-themes for dark mode (ThemeProvider already configured)
[Source: docs/architecture.md#Component-Architecture]

**Toast Notifications:**
- Use shadcn/ui toast component (already installed)
- Import from `@/components/ui/use-toast` or `@/components/ui/toaster`
- Pattern: `toast({ title: "Coming Soon", description: "..." })`
[Source: shadcn/ui documentation]

**AssistantIf Component:**
- Import from @assistant-ui/react
- Provides conditional rendering based on runtime state
- Use for: empty states, loading states, streaming indicators
- Reference: https://www.assistant-ui.com/docs/ui/Thread#assistantif
```typescript
import { AssistantIf } from '@assistant-ui/react';

// Empty state
<AssistantIf hasMessages={false}>
  <EmptyThreadState />
</AssistantIf>

// Typing indicator during streaming
<AssistantIf running>
  <TypingIndicator />
</AssistantIf>

// Conditional on last message role
<AssistantIf lastMessage={{ role: "assistant" }}>
  <FeedbackButtons />
</AssistantIf>
```
[Source: docs/epics.md#Story-6-Navigation-Polish - Technical Notes]

**Accessibility Requirements:**
- ARIA labels for all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management when switching threads
- Color contrast ratios (WCAG AA minimum)
- Screen reader support (logical heading structure)
[Source: docs/architecture.md#Security-Best-Practices]

**Bundle Size Constraints:**
- DevTools must be excluded from production bundle
- Tree-shaking should remove dev-only code
- First load JS target: <500KB
- Verify with bundle analyzer
[Source: docs/epics.md#Story-6-Navigation-Polish - AC #9]

### Component Structure

**Files to Create:**
- `src/components/chat/LoadingThreadState.tsx` - Skeleton loading state
- `src/components/chat/ErrorThreadState.tsx` - Error state with retry
- `src/components/chat/TypingIndicator.tsx` - Animated typing dots
- `src/components/chat/NavItem.tsx` - Reusable nav item component

**Files to Modify:**
- `src/components/chat/AppShell.tsx` - Add navigation items
- `src/components/chat/Thread.tsx` - Add AssistantIf for typing indicator
- `src/components/chat/ThreadListSidebar.tsx` - Add loading/error states
- `src/components/chat/EmptyThreadState.tsx` - Polish design

### Implementation Patterns

**Navigation Item Pattern:**
```typescript
// NavItem.tsx
interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

function NavItem({ icon: Icon, label, href, onClick, isActive, disabled }: NavItemProps) {
  const { toast } = useToast();

  const handleClick = () => {
    if (disabled) {
      toast({
        title: "Coming Soon",
        description: `${label} feature is coming soon!`,
      });
      return;
    }
    onClick?.();
  };

  // ... render
}
```

**Typing Indicator Pattern:**
```typescript
// TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-4">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground ml-2">Assistant is typing...</span>
    </div>
  );
}
```

**Error State with Retry Pattern:**
```typescript
// ErrorThreadState.tsx
interface ErrorThreadStateProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorThreadState({ error, onRetry }: ErrorThreadStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h3 className="font-semibold mb-2">Failed to load threads</h3>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
```

**Skeleton Loading Pattern:**
```typescript
// LoadingThreadState.tsx
export function LoadingThreadState() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Project Structure Notes

**Route Organization:**
```
src/app/[locale]/(chat)/chat/
├── layout.tsx                    # Already has DevTools
├── page.tsx                      # Empty state (verify)
└── [threadId]/
    └── page.tsx                  # Thread view
```

**Component Organization:**
```
src/components/chat/
├── AppShell.tsx                  # MODIFY - Add nav items
├── ThreadListSidebar.tsx         # MODIFY - Add loading/error states
├── Thread.tsx                    # MODIFY - Add AssistantIf + typing indicator
├── EmptyThreadState.tsx          # MODIFY - Polish design
├── LoadingThreadState.tsx        # NEW - Skeleton loading
├── ErrorThreadState.tsx          # NEW - Error with retry
├── TypingIndicator.tsx           # NEW - Animated dots
└── NavItem.tsx                   # NEW - Reusable nav item
```

### Testing Approach

**Manual QA Checklist:**
- [ ] Chrome Desktop - All features work
- [ ] Chrome Mobile - Responsive, sidebar overlay works
- [ ] Safari Desktop - All features work
- [ ] Safari Mobile (iOS) - Touch, keyboard, viewport
- [ ] Firefox Desktop - All features work
- [ ] Dark mode toggle - All components update
- [ ] Keyboard navigation - Tab through all elements
- [ ] Screen reader - Logical navigation

**Automated Tests:**
- TypeScript compilation (no errors)
- ESLint (no errors, warnings acceptable)
- Production build (success, no console errors)
- Bundle analysis (DevTools excluded)
- E2E tests (existing tests still pass)

### References

**Epic Context:**
[Source: docs/epics.md#Story-6-Navigation-Polish]

**Architecture Constraints:**
[Source: docs/architecture.md#Component-Architecture]
[Source: docs/architecture.md#Testing-Strategy]

**Previous Story Learnings:**
[Source: docs/sprint-artifacts/3-5-thread-component-integration.md#Dev-Agent-Record]

**Assistant UI Documentation:**
- AssistantIf: https://www.assistant-ui.com/docs/ui/Thread#assistantif
- Thread: https://www.assistant-ui.com/docs/ui/Thread
- Styling: https://www.assistant-ui.com/docs/ui/styling

**shadcn/ui Components:**
- Toast: https://ui.shadcn.com/docs/components/toast
- Skeleton: https://ui.shadcn.com/docs/components/skeleton
- Sheet: https://ui.shadcn.com/docs/components/sheet

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-30: Story drafted by SM agent (Bob) - Created from Epic 3 Story 6 requirements. Leverages Story 3.5 component foundations (AppShell, ThreadListSidebar, Thread). Focus on polish: navigation placeholders, empty/loading/error states, AssistantIf typing indicator, accessibility, dark mode verification, and production build validation.
- 2025-12-30: **Scope expanded via Correct Course workflow** - Added Task 11 (UX Polish from Internal Review) with 8 subtasks and 4 new ACs (#13-#16). Based on visual assessment using Playwright MCP. See `docs/sprint-change-proposal-2025-12-30.md` for full analysis. Approved by Varun.
