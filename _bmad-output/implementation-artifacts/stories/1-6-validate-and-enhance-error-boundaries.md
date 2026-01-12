# Story 1.6: Validate & Enhance Error Boundaries

**Epic:** Epic 1 - Template Foundation & Modernization
**Story ID:** 1.6
**Status:** ready-for-dev
**Assigned To:** error-handling-specialist
**Priority:** High
**Estimate:** 3 story points

---

## User Story

As a **user of applications built with this template**,
I want **graceful error handling that prevents white screens**,
So that **I can recover from errors without losing my work**.

---

## Acceptance Criteria

### AC1: React Error Catching
**Given** a React error in any component
**When** the error occurs during rendering
**Then** the nearest error boundary catches it
**And** a user-friendly fallback UI is displayed
**And** the error is logged to Sentry (if configured)

### AC2: Error Boundary Placement
**Given** the application structure
**When** I review error boundary placement
**Then** boundaries exist at app level (global fallback)
**And** boundaries exist at route level (page isolation)
**And** boundaries exist for critical component groups

### AC3: User-Friendly Fallback UI
**Given** an error boundary fallback
**When** a user sees the error UI
**Then** they can attempt to recover (retry/refresh)
**And** they can navigate to a safe page
**And** the message is helpful, not technical

---

## Context

### Current State Analysis

**Existing Error Boundaries (Verified 2026-01-12):**

✅ **Global Error Boundary Exists:**
- Location: `/src/app/global-error.tsx`
- Purpose: Catches errors in root layout and provides app-wide fallback
- Sentry Integration: ✅ Logs errors via `Sentry.captureException()`
- Current UI: Uses Next.js default `<NextError statusCode={0} />` component
- **Gap:** Generic error page, not user-friendly or branded

❌ **Route-Level Error Boundaries Missing:**
- No `error.tsx` files found in route segments
- Routes: `[locale]/(unauth)`, `[locale]/(auth)`, `[locale]/(chat)`
- **Gap:** Errors in one route crash entire route group

❌ **Component-Level Error Boundaries Missing:**
- Critical components lack error isolation:
  - `ChatInterface` component (complex async operations, API calls)
  - Form components with validation
  - Data-fetching components
- **Gap:** Component errors propagate up unnecessarily

**Sentry Configuration Status:**
- ✅ Client config: `/sentry.client.config.ts` (active, DSN configured)
- ✅ Server config: Exists and configured
- ✅ Development: Spotlight enabled for local debugging
- Integration: Working correctly in global error boundary

### Architecture Compliance

**Next.js 15 Error Handling Requirements:**
- Error boundaries MUST be Client Components (`'use client'`)
- `error.tsx` catches errors in route segments
- `global-error.tsx` catches errors in root layout
- Errors bubble up to nearest parent error boundary
- Error boundaries DO NOT catch:
  - Errors in `layout.tsx` of same segment (must use parent segment's error.tsx)
  - Event handlers (must use try/catch)
  - Async code outside rendering (must use try/catch)

**React 19 Patterns:**
- Error boundaries use `componentDidCatch` lifecycle (class component pattern)
- Functional components can't be error boundaries directly
- Use `ErrorBoundary` wrapper or Next.js file conventions

---

## Tasks

### Task 1: Create Route-Level Error Boundaries
**Description:** Add error.tsx files at strategic route levels for granular error isolation

**Subtasks:**

#### 1.1: Create Root Locale Error Boundary
- [ ] File: `src/app/[locale]/error.tsx`
  - Catches errors in all routes under locale (fallback before global-error.tsx)
  - User-friendly UI with:
    - Clear error message (no stack traces)
    - "Try Again" button (calls reset function)
    - "Go to Homepage" link
    - Branded with VT SaaS Template styling
  - Sentry logging: Log error details server-side
  - i18n support: Use translations for error messages

#### 1.2: Create Auth Routes Error Boundary
- [ ] File: `src/app/[locale]/(auth)/error.tsx`
  - Isolates errors in dashboard and protected pages
  - Fallback UI includes:
    - Error explanation ("Something went wrong with your dashboard")
    - "Refresh Dashboard" button
    - "Return to Homepage" link
    - "Sign Out" option (in case of auth-related errors)
  - Context-aware messaging based on error type
  - Preserve user session where possible

#### 1.3: Create Chat Route Error Boundary
- [ ] File: `src/app/[locale]/(chat)/error.tsx`
  - Isolates errors in chat interface
  - Specialized fallback for chat context:
    - "Chat encountered an error"
    - "Start New Chat" button
    - "View Chat History" link
    - Don't lose conversation ID in session
  - Log chat-specific error context (conversation_id, message count)
  - Graceful degradation: Show partial chat history if available

**Test Coverage:**
- Trigger rendering errors in each route segment
- Verify correct error boundary catches the error
- Confirm Sentry receives error logs
- Test retry/reset functionality
- Verify navigation links work correctly

**Dev Notes:**
- Use `'use client'` directive (required for error boundaries)
- Error prop: `error: Error & { digest?: string }`
- Reset function: `reset: () => void` - re-renders segment
- Follow existing global-error.tsx pattern for Sentry integration
- Reference translations from `src/locales/[locale]/common.json`

---

### Task 2: Enhance Global Error Boundary UI
**Description:** Replace generic Next.js error page with branded, user-friendly fallback

**Subtasks:**

#### 2.1: Design Global Error Fallback UI
- [ ] Replace `<NextError statusCode={0} />` with custom UI
- [ ] Components to include:
  - Error icon/illustration (use Lucide React icons)
  - Heading: "Something Went Wrong"
  - Subheading: User-friendly explanation
  - Primary action: "Reload Application" button (full page refresh)
  - Secondary action: "Contact Support" link (if support configured)
  - Footer: Link to homepage
- [ ] Styling:
  - Use Tailwind CSS classes
  - Match VT SaaS Template design system
  - Responsive design (mobile + desktop)
  - Dark mode support (use theme classes)

#### 2.2: Add Error Context for Development
- [ ] In development mode only:
  - Show error message (non-production)
  - Show error digest for debugging
  - Link to Sentry Spotlight (if enabled)
- [ ] In production:
  - Hide technical details
  - Show generic "We're working on it" message
  - Provide error ID for support reference

#### 2.3: Implement Full Page Styles
- [ ] Global error must include `<html>` and `<body>` tags
- [ ] Import global styles: `import '@/styles/global.css'`
- [ ] Import fonts if custom fonts used
- [ ] Set up theme provider if using theme context
- [ ] Ensure CSS works without React context

**Test Coverage:**
- Simulate root layout error (throw in layout.tsx)
- Verify global-error.tsx catches it
- Check UI renders correctly (styles, fonts, theme)
- Test "Reload Application" button
- Verify Sentry logs error
- Test in both light and dark modes

**Dev Notes:**
- Global error is special: requires full HTML structure
- Can't rely on root layout (it's broken when global error triggers)
- Must be self-contained with all dependencies
- Use inline critical CSS if global styles fail to load
- Keep it simple: minimize dependencies

---

### Task 3: Create Component Error Boundary Wrapper
**Description:** Build reusable ErrorBoundary component for protecting critical components

**Subtasks:**

#### 3.1: Create ErrorBoundary Component
- [ ] File: `src/components/errors/ErrorBoundary.tsx`
- [ ] Implementation:
  - Class component (required for error boundaries)
  - Props:
    - `children: ReactNode` - components to protect
    - `fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)` - custom fallback
    - `onError?: (error: Error, errorInfo: ErrorInfo) => void` - error callback
  - State: `{ hasError: boolean; error: Error | null }`
  - Methods:
    - `static getDerivedStateFromError(error)` - capture error
    - `componentDidCatch(error, errorInfo)` - log to Sentry
    - `resetError()` - clear error state and retry

#### 3.2: Create Default Fallback Components
- [ ] File: `src/components/errors/ErrorFallback.tsx`
- [ ] Variants:
  - `InlineErrorFallback` - for inline component errors
  - `CardErrorFallback` - for card/section errors
  - `ModalErrorFallback` - for modal/dialog errors
- [ ] Features:
  - Error icon
  - Brief message ("Failed to load component")
  - "Try Again" button
  - Optional "Hide" or "Dismiss" action
  - Minimal styling to work in any context

#### 3.3: Add TypeScript Types
- [ ] File: `src/components/errors/types.ts`
- [ ] Export interfaces:
  - `ErrorBoundaryProps`
  - `ErrorFallbackProps`
  - `ErrorBoundaryState`

**Test Coverage:**
- Unit test: ErrorBoundary catches child errors
- Unit test: Fallback renders correctly
- Unit test: Reset clears error state
- Unit test: onError callback fires
- Integration test: Wrap component and trigger error

**Dev Notes:**
- Error boundaries are class components (React limitation)
- Can't use hooks in error boundary itself
- Fallback can be functional component with hooks
- Sentry integration: Call `Sentry.captureException()` in componentDidCatch
- Reference: React docs on Error Boundaries

---

### Task 4: Wrap Critical Components with Error Boundaries
**Description:** Identify and protect high-risk components with ErrorBoundary wrapper

**Subtasks:**

#### 4.1: Protect ChatInterface Component
- [ ] File: `src/components/chat/ChatInterface.tsx`
- [ ] Wrap component export:
  ```typescript
  export function ChatInterface(props) {
    return (
      <ErrorBoundary
        fallback={(error, reset) => (
          <CardErrorFallback
            message="Chat interface encountered an error"
            onRetry={reset}
          />
        )}
        onError={(error) => {
          console.error('[ChatInterface] Error:', error);
          // Already logs to Sentry via ErrorBoundary
        }}
      >
        <ChatInterfaceInner {...props} />
      </ErrorBoundary>
    );
  }
  ```
- [ ] Rationale: Complex async operations, API calls, streaming

#### 4.2: Identify Other High-Risk Components
- [ ] Scan codebase for components with:
  - External API calls
  - Complex state management
  - Third-party integrations
  - Heavy data processing
  - User-generated content rendering
- [ ] Candidates:
  - Form components with validation
  - Data tables/lists
  - File upload components
  - Rich text editors
  - Chart/visualization components

#### 4.3: Apply ErrorBoundary Wrappers
- [ ] For each identified component:
  - Wrap with `<ErrorBoundary>`
  - Provide context-appropriate fallback
  - Add error logging callback
  - Document reasoning in component comments

**Test Coverage:**
- Trigger errors in protected components
- Verify ErrorBoundary catches and renders fallback
- Confirm rest of page remains functional
- Check Sentry receives error logs

**Dev Notes:**
- Don't over-wrap: Use boundaries judiciously
- Balance granularity vs. complexity
- Consider user impact: What can fail independently?
- Error boundaries add small performance overhead
- Prefer Next.js file-based boundaries for routes

---

### Task 5: Add Error Recovery Mechanisms
**Description:** Implement user-friendly recovery actions in error fallbacks

**Subtasks:**

#### 5.1: Implement Reset/Retry Pattern
- [ ] All error.tsx files should:
  - Accept `reset()` function from Next.js
  - Provide "Try Again" button calling `reset()`
  - Clear any error state before retry
  - Show loading indicator during retry
- [ ] ErrorBoundary component should:
  - Provide `resetError()` method
  - Clear component state on reset
  - Re-render children after reset

#### 5.2: Add Navigation Escape Hatches
- [ ] Error fallbacks should include:
  - "Go to Homepage" link (`/[locale]`)
  - "Go to Dashboard" link (if authenticated: `/[locale]/dashboard`)
  - "Start New Chat" link (chat errors: `/[locale]/chat`)
- [ ] Use Next.js `<Link>` or `useRouter` for navigation
- [ ] Clear error state on navigation

#### 5.3: Implement Graceful Degradation
- [ ] For chat errors:
  - Preserve conversation_id if available
  - Show partial message history if loaded
  - Allow starting new conversation
- [ ] For form errors:
  - Preserve form input if possible (localStorage backup)
  - Offer "Save Draft" option
- [ ] For data display errors:
  - Show cached data if available
  - Offer manual refresh

**Test Coverage:**
- Test "Try Again" button clears error and re-renders
- Test navigation links work from error state
- Test graceful degradation scenarios
- Verify no data loss during recovery

**Dev Notes:**
- Reset doesn't reload page, just re-renders segment
- For full reload, use `window.location.reload()`
- Preserve user context during recovery
- Consider using React Query or SWR for data caching/retry

---

### Task 6: Improve Error Logging and Monitoring
**Description:** Enhance error logging with context for better debugging

**Subtasks:**

#### 6.1: Add Error Context to Sentry Logs
- [ ] In all error boundaries:
  - Capture route/page context
  - Capture user ID (if authenticated)
  - Capture component hierarchy
  - Add custom tags (route-group, component-name)
  - Include error digest (Next.js-provided)
- [ ] Use Sentry SDK features:
  ```typescript
  Sentry.captureException(error, {
    tags: {
      errorBoundary: 'chat-route',
      locale: params.locale,
    },
    contexts: {
      route: {
        pathname: window.location.pathname,
        params: params,
      },
    },
  });
  ```

#### 6.2: Add User Feedback Mechanism
- [ ] In error fallbacks, add:
  - "Report Problem" button
  - Opens Sentry User Feedback widget
  - Pre-fills event ID from error
  - Allows user to describe what happened
- [ ] Integration:
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  const eventId = Sentry.lastEventId();
  Sentry.showReportDialog({ eventId });
  ```

#### 6.3: Configure Development Error Overlay
- [ ] Ensure React error overlay enabled in dev
- [ ] Configure Sentry Spotlight (already enabled)
- [ ] Add helpful error messages in dev:
  - Suggest common fixes
  - Link to relevant docs
  - Show component stack

**Test Coverage:**
- Trigger errors and check Sentry dashboard
- Verify context data appears in error reports
- Test user feedback widget
- Verify development overlay shows helpful info

**Dev Notes:**
- Sentry integration already configured in project
- DSN configured via `NEXT_PUBLIC_SENTRY_DSN`
- Spotlight runs automatically in development
- Production errors sanitize sensitive data
- Error digest helps correlate client/server errors

---

### Task 7: Document Error Handling Strategy
**Description:** Update project documentation with error handling patterns

**Subtasks:**

#### 7.1: Update CLAUDE.md Project Context
- [ ] File: `/Users/varuntorka/Coding/vt-saas-template/CLAUDE.md`
- [ ] Add section: "Error Handling Patterns"
- [ ] Document:
  - Error boundary hierarchy (global → route → component)
  - When to use file-based vs. component-based boundaries
  - How to add new error boundaries
  - Recovery pattern examples
  - Sentry logging best practices

#### 7.2: Create Error Handling Guide
- [ ] File: `docs/error-handling-guide.md`
- [ ] Contents:
  - Overview of error handling strategy
  - Error boundary locations and purposes
  - How to add error boundaries to new features
  - Testing error scenarios
  - Debugging with Sentry and Spotlight
  - Common error patterns and solutions

#### 7.3: Add JSDoc Comments to Error Components
- [ ] Add comprehensive JSDoc to:
  - `ErrorBoundary.tsx` - usage examples
  - `global-error.tsx` - when it triggers
  - `error.tsx` files - what they protect
- [ ] Include examples and rationale

**Test Coverage:**
- Documentation review (manual)
- Verify examples are accurate
- Test documented patterns work

**Dev Notes:**
- Documentation is user-facing (template users)
- Explain WHY, not just WHAT
- Include copy-paste examples
- Link to official Next.js/React error handling docs

---

### Task 8: Test Error Scenarios
**Description:** Comprehensive testing of error handling across the application

**Subtasks:**

#### 8.1: Create Error Testing Utilities
- [ ] File: `src/utils/test-helpers/errorUtils.ts`
- [ ] Utilities:
  - `throwTestError()` - throws error in component
  - `triggerAsyncError()` - async error for testing
  - `ErrorThrower` - component that throws on mount
- [ ] For E2E testing:
  - Add test endpoint: `/api/test/error` (development only)
  - Triggers controlled errors for E2E tests

#### 8.2: Write Unit Tests for Error Boundaries
- [ ] File: `src/components/errors/ErrorBoundary.test.tsx`
- [ ] Test cases:
  - Renders children when no error
  - Catches error and renders fallback
  - Calls onError callback with error details
  - Logs to Sentry (mock Sentry SDK)
  - Reset clears error and re-renders children
  - Custom fallback renders correctly

#### 8.3: Write E2E Tests for Error Scenarios
- [ ] File: `tests/e2e/ErrorHandling.e2e.ts`
- [ ] Test scenarios:
  - Trigger error in dashboard → verify error.tsx renders
  - Trigger error in chat → verify chat error.tsx renders
  - Trigger error in layout → verify global-error.tsx renders
  - Click "Try Again" → verify error clears
  - Click "Go to Homepage" → verify navigation works
  - Verify Sentry captures error (mock or test mode)

#### 8.4: Manual Testing Checklist
- [ ] Test each error boundary:
  - Global error boundary
  - Locale error boundary
  - Auth routes error boundary
  - Chat route error boundary
- [ ] Test recovery actions:
  - Try Again button
  - Navigation links
  - Full page reload
- [ ] Test across browsers:
  - Chrome, Firefox, Safari, Edge
- [ ] Test responsive design:
  - Mobile (< 768px)
  - Tablet (768-1024px)
  - Desktop (> 1024px)

**Test Coverage:**
- All error boundaries have unit tests
- Critical error scenarios covered in E2E tests
- Manual testing checklist completed
- Sentry integration verified

**Dev Notes:**
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Mock Sentry SDK in tests (don't send real errors)
- Development error endpoint: protect with env check
- Consider using React Testing Library for component tests

---

## Technical Requirements

### Next.js 15 App Router Patterns

**Error Boundary File Conventions:**
- `error.tsx` - Catches errors in route segments
- `global-error.tsx` - Catches errors in root layout
- Must be Client Components (`'use client'`)
- Props: `error: Error & { digest?: string }`, `reset: () => void`

**Error Boundary Limitations:**
- Does NOT catch errors in `layout.tsx` of same segment
- Does NOT catch errors in `template.tsx` of same segment
- Does NOT catch event handler errors
- Does NOT catch async code errors outside rendering

**Async Operations:**
- Use try/catch for API calls
- Use .catch() for Promises
- Handle errors gracefully in event handlers

### React 19 Error Handling

**Error Boundaries (Class Components):**
- `static getDerivedStateFromError(error)` - Update state
- `componentDidCatch(error, errorInfo)` - Log error

**Functional Components:**
- Cannot be error boundaries directly
- Use ErrorBoundary wrapper or Next.js file conventions

**Error Info:**
- `componentStack` - Component hierarchy where error occurred
- Useful for debugging nested component errors

### Sentry Integration

**Already Configured:**
- Client SDK: `/sentry.client.config.ts`
- Server SDK: `/sentry.server.config.ts`
- Spotlight: Enabled in development

**Best Practices:**
- Capture exceptions: `Sentry.captureException(error, scope)`
- Add context: tags, user, custom data
- User feedback: `Sentry.showReportDialog()`
- Source maps: Already configured for production

**Error Digest:**
- Next.js provides digest for server errors
- Use to correlate client/server error logs
- Include in Sentry tags

---

## Architecture Compliance

### TypeScript Strict Mode

**Error Handling Types:**
```typescript
// Error boundary props
type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

// Next.js error.tsx props
type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Global error props (includes params)
type GlobalErrorProps = {
  error: Error & { digest?: string };
  params: { locale: string };
};
```

**Null Safety:**
- Check error properties before accessing
- Handle undefined digest gracefully
- Validate error message exists

### Styling with Tailwind CSS

**Error UI Components:**
- Use Tailwind utility classes
- Follow VT SaaS Template design system
- Responsive breakpoints: `sm:`, `md:`, `lg:`
- Dark mode: `dark:` prefix

**Theme Consistency:**
- Error colors: `text-destructive`, `bg-destructive/15`
- Icons: Use Lucide React icons
- Typography: Follow existing heading/body patterns

### Internationalization (i18n)

**Error Messages:**
- Store in `src/locales/[locale]/common.json`
- Keys: `errors.boundary.*`, `errors.fallback.*`
- Use `useTranslations('common')` hook

**Supported Locales:**
- English (en)
- Hindi (hi)
- Bengali (bn)

---

## Testing Requirements

### Unit Tests (Vitest)

**ErrorBoundary Component:**
```typescript
// src/components/errors/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('renders children when no error', () => {});
  it('catches error and renders fallback', () => {});
  it('calls onError callback', () => {});
  it('resets error state', () => {});
});
```

**Error Fallback Components:**
- Test rendering with different error props
- Test button click handlers
- Test custom fallback rendering

### E2E Tests (Playwright)

**Error Scenario Tests:**
```typescript
// tests/e2e/ErrorHandling.e2e.ts
test.describe('Error Boundaries', () => {
  test('catches route-level errors', async ({ page }) => {
    // Navigate to page
    // Trigger error (via test endpoint)
    // Verify error fallback renders
    // Click "Try Again"
    // Verify error clears
  });
});
```

**Test Coverage:**
- Global error boundary
- Route-level error boundaries
- Component-level error boundaries
- Recovery actions (retry, navigation)

### Manual Testing

**Browser Testing:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Device Testing:**
- Desktop (1920x1080, 1440x900)
- Tablet (iPad, 768x1024)
- Mobile (iPhone, 375x667)

**Scenario Testing:**
- Trigger errors in each route
- Test recovery actions
- Verify Sentry logging
- Check responsive design

---

## Definition of Done

- [ ] Route-level error boundaries created (locale, auth, chat)
- [ ] Global error boundary enhanced with branded UI
- [ ] ErrorBoundary component wrapper created
- [ ] Critical components wrapped with error boundaries
- [ ] Error recovery mechanisms implemented (retry, navigation)
- [ ] Sentry logging enhanced with context
- [ ] Documentation updated (CLAUDE.md, error-handling-guide.md)
- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing completed across browsers/devices
- [ ] All automated tests pass (`npm test`)
- [ ] TypeScript check passes (`npm run check-types`)
- [ ] Linting passes (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Code review completed
- [ ] Story marked complete in sprint-status.yaml

---

## Dependencies

**Depends On:**
- Story 1.1: Upgrade Next.js 15 (for latest error handling)
- Story 1.2: Upgrade React 19 (for error boundary patterns)
- Story 1.4: Upgrade TypeScript (for strict type safety)
- Story 1.5: Rebrand complete (for branded error UI)

**Blocks:**
- Story 1.9: Validate Existing Features (comprehensive testing)

**Related:**
- Story 1.7: Standardize API Error Handling (complementary error handling)

---

## Dev Notes for error-handling-specialist Agent

### Execution Strategy

**Recommended Order:**
1. **Task 1** - Create route-level error boundaries (safest, isolated)
2. **Task 2** - Enhance global error boundary UI
3. **Task 3** - Create ErrorBoundary wrapper component
4. **Task 4** - Wrap critical components
5. **Task 5** - Add recovery mechanisms
6. **Task 6** - Improve logging and monitoring
7. **Task 7** - Documentation
8. **Task 8** - Testing

**Time Estimate:**
- Tasks 1-2: 45 minutes (error.tsx files + global UI)
- Task 3: 30 minutes (ErrorBoundary component)
- Task 4: 30 minutes (wrap components)
- Task 5: 20 minutes (recovery actions)
- Task 6: 20 minutes (logging enhancements)
- Task 7: 15 minutes (documentation)
- Task 8: 30 minutes (testing)
- **Total: ~3 hours** (3 story points appropriate)

### Implementation Tips

**Error Boundary Patterns:**
```typescript
// error.tsx template
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'route-name' },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">{t('errors.boundary.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('errors.boundary.message')}</p>
        <div className="mt-6 flex gap-4">
          <button onClick={reset}>{t('errors.boundary.retry')}</button>
          <a href="/">{t('errors.boundary.home')}</a>
        </div>
      </div>
    </div>
  );
}
```

**Component ErrorBoundary:**
```typescript
// ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

type Props = {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.resetError);
      }
      return this.props.fallback || <DefaultFallback error={this.state.error} onReset={this.resetError} />;
    }
    return this.props.children;
  }
}
```

### Common Pitfalls

1. **Forgetting 'use client' directive:**
   - Error boundaries MUST be Client Components
   - Add `'use client'` at top of file

2. **Global error missing HTML structure:**
   - Must include `<html>` and `<body>` tags
   - Must import global styles
   - Can't rely on root layout (it's broken)

3. **Error boundaries don't catch everything:**
   - Event handlers: Use try/catch
   - Async code: Use try/catch or .catch()
   - Layout errors: Use parent segment's error.tsx

4. **Infinite error loops:**
   - Error in error boundary fallback UI
   - Test fallback components thoroughly
   - Keep fallback simple and robust

5. **Forgetting to log to Sentry:**
   - Always call `Sentry.captureException()` in componentDidCatch/useEffect
   - Add context and tags for debugging

### Testing Strategy

**Trigger Errors for Testing:**
```typescript
// Development-only error trigger
if (process.env.NODE_ENV === 'development' && searchParams.get('trigger-error')) {
  throw new Error('Test error from URL param');
}

// Or create test component:
function ErrorThrower() {
  throw new Error('Test error');
}
```

**E2E Test Pattern:**
```typescript
test('error boundary catches and displays fallback', async ({ page }) => {
  // Navigate to page
  await page.goto('/en/dashboard?trigger-error=true');

  // Verify fallback renders
  await expect(page.getByText('Something Went Wrong')).toBeVisible();

  // Click retry
  await page.getByRole('button', { name: 'Try Again' }).click();

  // Verify normal page loads
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

### Quality Checklist

Before marking complete:
- [ ] All error.tsx files created
- [ ] Global error UI is branded and user-friendly
- [ ] ErrorBoundary component is reusable
- [ ] Critical components are protected
- [ ] Recovery actions work (retry, navigation)
- [ ] Sentry receives error logs with context
- [ ] Documentation is clear and helpful
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] No regressions in existing functionality

### Success Criteria

**The Story is Complete When:**
1. ✅ Errors in any route are caught by appropriate boundary
2. ✅ Users see branded, helpful fallback UI (not white screen)
3. ✅ Users can recover from errors (retry/navigate)
4. ✅ All errors logged to Sentry with context
5. ✅ Documentation explains error handling strategy
6. ✅ All tests pass

**The Story is NOT Complete If:**
1. ❌ Any route lacks error boundary
2. ❌ Error UI shows technical details to users
3. ❌ Errors not logged to Sentry
4. ❌ No recovery mechanism provided
5. ❌ Tests failing
6. ❌ Documentation missing or unclear

---

## References

### Documentation
- Next.js Error Handling: https://nextjs.org/docs/app/api-reference/file-conventions/error
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/

### Project Files
- Global Error: `/src/app/global-error.tsx`
- Sentry Client: `/sentry.client.config.ts`
- Chat Component: `/src/components/chat/ChatInterface.tsx`
- Project Context: `/Users/varuntorka/Coding/vt-saas-template/CLAUDE.md`
- Epic File: `_bmad-output/planning-artifacts/epics/epic-1-template-foundation-modernization.md`

### Web Research Sources
- [File-system conventions: error.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Next.js Error Boundary Walkthrough: Best Practices](https://www.dhiwise.com/post/nextjs-error-boundary-best-practices)
- [Next.js 15: Error Handling best practices - for code and routes](https://devanddeliver.com/blog/frontend/next-js-15-error-handling-best-practices-for-code-and-routes)
- [Getting Started: Error Handling | Next.js](https://nextjs.org/docs/app/getting-started/error-handling)

---

## Story Metadata

**Created:** 2026-01-12
**Epic:** Epic 1 - Template Foundation & Modernization
**Sprint:** Sprint 1
**Story Points:** 3
**Risk Level:** Medium (affects error handling across entire app)
**Technical Debt:** Removes error handling gaps, improves user experience
**Agent Assignment:** error-handling-specialist
**Review Required:** Yes (critical UX feature)

---
