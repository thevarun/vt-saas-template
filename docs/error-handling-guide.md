# Error Handling Guide

This guide explains the error handling strategy implemented in VT SaaS Template and how to use it in your applications.

## Overview

VT SaaS Template implements a multi-layered error handling approach that:
- Prevents white screen crashes
- Provides user-friendly error messages
- Enables graceful recovery
- Logs errors for debugging
- Maintains application state where possible

## Error Boundary Hierarchy

The application uses a hierarchical error boundary strategy:

```
Global Error Boundary (global-error.tsx)
└── Locale Error Boundary ([locale]/error.tsx)
    └── Auth Routes Error Boundary ((auth)/error.tsx)
        ├── Chat Error Boundary (chat/error.tsx)
        └── Component Error Boundaries (ErrorBoundary.tsx)
```

### 1. Global Error Boundary

**Location:** `src/app/global-error.tsx`

**Purpose:** Catches errors in the root layout. This is the last line of defense.

**When it triggers:**
- Errors in `src/app/layout.tsx`
- Errors in middleware (in some cases)
- Catastrophic failures not caught by lower boundaries

**Features:**
- Full page fallback (includes `<html>` and `<body>`)
- "Reload Application" button (full page refresh)
- Development error details (message, digest, stack trace)
- Production error reference ID

**Important:** Global error must be self-contained - it cannot rely on the root layout or any context providers.

### 2. Locale Error Boundary

**Location:** `src/app/[locale]/error.tsx`

**Purpose:** Catches errors in all routes under a locale.

**When it triggers:**
- Errors in locale-specific routes
- Errors not caught by more specific boundaries

**Features:**
- "Try Again" button (resets error boundary)
- "Go to Homepage" link
- Preserves locale context

### 3. Route-Specific Error Boundaries

#### Auth Routes Error Boundary

**Location:** `src/app/[locale]/(auth)/error.tsx`

**Purpose:** Isolates errors in dashboard and protected pages.

**Features:**
- "Refresh Dashboard" button
- "Return to Homepage" link
- "Sign Out" option (for auth-related errors)
- Context-aware messaging

#### Chat Error Boundary

**Location:** `src/app/[locale]/(auth)/chat/error.tsx`

**Purpose:** Isolates errors in the chat interface.

**Features:**
- "Start New Chat" button (clears conversation state)
- "Try Again" button
- "View Dashboard" link
- Preserves conversation history where possible
- Logs chat-specific context (conversation_id)

### 4. Component Error Boundary

**Location:** `src/components/errors/ErrorBoundary.tsx`

**Purpose:** Reusable wrapper for protecting critical components.

**When to use:**
- Components with async operations (API calls, streaming)
- Third-party integrations (external libraries)
- Complex state management
- Heavy data processing
- User-generated content rendering

## Using Error Boundaries

### Protecting a Component

```typescript
import { ErrorBoundary, CardErrorFallback } from '@/components/errors';

export function MyFeature() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onReset={reset}
          message="Failed to load feature"
        />
      )}
      onError={(error, errorInfo) => {
        // Optional: Custom error logging
        console.error('Feature error:', error);
      }}
    >
      <CriticalComponent />
    </ErrorBoundary>
  );
}
```

### Available Fallback Components

#### InlineErrorFallback

For inline component errors (minimal, single line):

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <InlineErrorFallback
      error={error}
      onReset={reset}
      message="Failed to load widget"
    />
  )}
>
  <Widget />
</ErrorBoundary>
```

#### CardErrorFallback

For card/section errors (centered, detailed):

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <CardErrorFallback
      error={error}
      onReset={reset}
      message="Failed to load dashboard"
    />
  )}
>
  <DashboardSection />
</ErrorBoundary>
```

#### ModalErrorFallback

For modal/dialog errors (includes dismiss button):

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <ModalErrorFallback
      error={error}
      onReset={reset}
      message="Failed to load dialog content"
    />
  )}
>
  <DialogContent />
</ErrorBoundary>
```

### Custom Fallback UI

You can provide custom fallback UI:

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="rounded-lg border border-destructive p-4">
      <h3>Oops! Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

## Error Recovery Patterns

### 1. Reset/Retry Pattern

All error boundaries support resetting the error state:

```typescript
// In error.tsx files
<button onClick={reset}>Try Again</button>

// In ErrorBoundary component
<button onClick={onReset}>Retry</button>
```

**How it works:**
- Clears error state
- Re-renders the component tree
- Does NOT reload the page

**Best for:**
- Transient errors (network issues)
- Race conditions
- Temporary state issues

### 2. Navigation Escape Pattern

Provide links to safe routes:

```typescript
<Link href="/">Go to Homepage</Link>
<Link href="/dashboard">View Dashboard</Link>
```

**Best for:**
- Persistent errors
- Component-specific issues
- When retry doesn't work

### 3. Graceful Degradation Pattern

Preserve partial functionality:

```typescript
// In chat error boundary
const handleStartNewChat = () => {
  // Clear conversation state
  localStorage.removeItem('dify_conversation_id');
  reset();
};

<button onClick={handleStartNewChat}>Start New Chat</button>
```

**Best for:**
- Chat/messaging features
- Forms with saved drafts
- Data displays with cached content

## Error Logging

### Automatic Sentry Integration

All error boundaries automatically log errors to Sentry with context:

```typescript
Sentry.captureException(error, {
  tags: {
    errorBoundary: 'chat-route',
    locale: params.locale,
  },
  contexts: {
    chat: {
      conversationId: localStorage.getItem('dify_conversation_id'),
    },
  },
});
```

### Custom Error Logging

Add custom logging with the `onError` callback:

```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom logging
    console.error('Component error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Send to custom analytics
    analytics.track('component_error', {
      error: error.message,
      component: 'MyComponent',
    });
  }}
>
  <MyComponent />
</ErrorBoundary>
```

## What Error Boundaries DON'T Catch

Error boundaries have limitations. They **do NOT** catch:

### 1. Event Handler Errors

```typescript
// ❌ Not caught by error boundary
function handleClick() {
  throw new Error('Click error');
}

// ✅ Use try/catch
function handleClick() {
  try {
    // risky operation
  } catch (error) {
    console.error('Click error:', error);
    showErrorToast(error.message);
  }
}
```

### 2. Async Code Errors

```typescript
// ❌ Not caught by error boundary
useEffect(() => {
  fetchData().then(data => {
    throw new Error('Async error');
  });
}, []);

// ✅ Use try/catch or .catch()
useEffect(() => {
  fetchData()
    .then(data => {
      // handle data
    })
    .catch(error => {
      console.error('Fetch error:', error);
      setError(error.message);
    });
}, []);
```

### 3. Server Component Errors

```typescript
// ❌ Not caught by client error boundary
export default async function ServerComponent() {
  const data = await fetchData(); // Server-side error
  return <div>{data}</div>;
}

// ✅ Use try/catch and return error UI
export default async function ServerComponent() {
  try {
    const data = await fetchData();
    return <div>{data}</div>;
  } catch (error) {
    return <ErrorDisplay error={error} />;
  }
}
```

### 4. Errors in Error Boundaries Themselves

```typescript
// ❌ Infinite error loop
<ErrorBoundary
  fallback={(error, reset) => {
    throw new Error('Fallback error'); // NOT caught
  }}
>
  <Component />
</ErrorBoundary>

// ✅ Keep fallback simple and safe
<ErrorBoundary
  fallback={(error, reset) => (
    <div>Error occurred. <button onClick={reset}>Retry</button></div>
  )}
>
  <Component />
</ErrorBoundary>
```

## Testing Error Boundaries

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/errors';

function ErrorThrower() {
  throw new Error('Test error');
}

test('catches error and renders fallback', () => {
  // Mock console.error to avoid test noise
  vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <ErrorThrower />
    </ErrorBoundary>
  );

  expect(screen.getByText('Component Error')).toBeInTheDocument();
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('error boundary catches route error', async ({ page }) => {
  // Navigate to page
  await page.goto('/en/dashboard?trigger-error=true');

  // Verify error fallback renders
  await expect(page.getByText('Something Went Wrong')).toBeVisible();

  // Click retry button
  await page.getByRole('button', { name: 'Try Again' }).click();

  // Verify normal page loads
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

### Test Utilities

Use the provided error testing utilities:

```typescript
import { ErrorThrower, throwTestError } from '@/utils/test-helpers/errorUtils';

// Component that throws on mount
<ErrorBoundary>
  <ErrorThrower message="Test error" />
</ErrorBoundary>

// Function that throws immediately
throwTestError('Test error');
```

## Best Practices

### 1. Strategic Placement

✅ **Do:**
- Place boundaries around independently recoverable units
- Use file-based boundaries for routes
- Use component boundaries for high-risk components
- Consider user impact when placing boundaries

❌ **Don't:**
- Wrap every component (over-protection)
- Place boundaries too granularly (too many fallbacks)
- Nest boundaries unnecessarily

### 2. User-Friendly Messages

✅ **Do:**
- Use clear, non-technical language
- Explain what happened and what to do
- Provide actionable recovery options
- Show development details only in dev mode

❌ **Don't:**
- Show stack traces to users
- Use technical jargon
- Display cryptic error codes
- Leave users without options

### 3. Error Recovery

✅ **Do:**
- Provide multiple recovery options
- Preserve user data where possible
- Allow retry for transient errors
- Navigate to safe routes for persistent errors

❌ **Don't:**
- Force full page reload unnecessarily
- Lose user data on error
- Trap users in error state
- Hide all recovery options

### 4. Error Logging

✅ **Do:**
- Log all errors to monitoring service
- Include relevant context (user, route, state)
- Use error digests for correlation
- Sanitize sensitive data

❌ **Don't:**
- Log passwords or tokens
- Log excessive data
- Ignore error context
- Skip error monitoring

## Debugging

### Development Error Details

In development mode, error boundaries show detailed information:

```typescript
{process.env.NODE_ENV === 'development' && (
  <div>
    <p>Error: {error.message}</p>
    <p>Digest: {error.digest}</p>
    <pre>{error.stack}</pre>
  </div>
)}
```

### Sentry Spotlight

In development, Sentry Spotlight shows real-time errors:

1. Run `npm run dev`
2. Trigger an error
3. Check the Spotlight overlay for error details

### Production Debugging

In production, use error digests to find errors in Sentry:

```typescript
{process.env.NODE_ENV === 'production' && error.digest && (
  <p>Error Reference: {error.digest}</p>
)}
```

Search for the digest in Sentry to find the full error details.

## Common Patterns

### Protecting API Calls

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Failed to load data</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <DataDisplay />
</ErrorBoundary>
```

### Protecting Third-Party Libraries

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <div>Third-party widget failed to load</div>
  )}
  onError={(error) => {
    console.error('Third-party error:', error);
  }}
>
  <ThirdPartyWidget />
</ErrorBoundary>
```

### Protecting Complex Forms

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Form error occurred</p>
      <button onClick={reset}>Retry</button>
      <button onClick={saveDraft}>Save Draft</button>
    </div>
  )}
>
  <ComplexForm />
</ErrorBoundary>
```

## Translations

Error messages support i18n via next-intl:

```typescript
import { useTranslations } from 'next-intl';

export default function Error({ error, reset }) {
  const t = useTranslations('Errors');

  return (
    <div>
      <h1>{t('boundary.title')}</h1>
      <p>{t('boundary.message')}</p>
      <button onClick={reset}>{t('boundary.retry')}</button>
    </div>
  );
}
```

Add translations to `src/locales/[locale].json`:

```json
{
  "Errors": {
    "boundary": {
      "title": "Something Went Wrong",
      "message": "We encountered an unexpected error.",
      "retry": "Try Again"
    }
  }
}
```

## Resources

- [Next.js Error Handling](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## Summary

Error handling in VT SaaS Template:
1. **Multiple layers** of protection (global → route → component)
2. **User-friendly** fallback UI with recovery options
3. **Automatic** error logging to Sentry
4. **Graceful** degradation and state preservation
5. **Developer-friendly** debugging tools

Follow this guide to build robust, error-resilient applications with VT SaaS Template.
