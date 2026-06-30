# API Error Handling Guide

This guide explains the standardized error handling approach used across the VT SaaS Template — both HTTP route handlers (`src/app/api/**/route.ts`) and Server Actions.

## Overview

The template uses **two related but distinct error shapes**. Both carry a machine-readable `code` drawn from the same `ApiErrorCode` union (`src/libs/api/errors/types.ts`), but they nest the message differently. Use the right one for the right boundary.

### 1. HTTP route handlers — canonical error shape

Route handlers return JSON in this shape:

```typescript
{
  error: string;        // Human-readable error message
  code: ApiErrorCode;   // Machine-readable error code
  details?: object;     // Optional additional context (e.g. field-level validation errors)
}
```

On success, route handlers wrap the payload:

```typescript
{
  data: T;              // The response payload
}
```

Client code parses HTTP error responses with `parseApiError` from `src/libs/api/client/parseError.ts`, which reads `json.error` (string) and `json.code`.

### 2. Server Actions — `ActionResult<T>`

Server Actions return `ActionResult<T>` from `src/libs/actions/types.ts`:

```typescript
type ActionResult<T>
  = { data: T; error: null }
    | { data: null; error: { message: string; code: ApiErrorCode } };
```

Note the difference from the HTTP shape: the message and code are **nested under `error`** (`error.message`, `error.code`) rather than living as sibling top-level fields. Client code calling a Server Action destructures `{ data, error }` and reads `error.message` directly — there is no `parseApiError` step.

> Do not conflate the two shapes. A drift-detection snapshot lives in `src/libs/api/errors/responses.test.ts` (`canonical shape contract`) to keep the HTTP builders honest.

## Standard Error Codes

These codes are defined in the `ApiErrorCode` union in `src/libs/api/errors/types.ts` and are shared by both boundaries.

| Code | HTTP Status | Meaning | When to Use |
|------|-------------|---------|-------------|
| `AUTH_REQUIRED` | 401 | Not authenticated | User session is missing or invalid (HTTP layer) |
| `UNAUTHORIZED` | — | Not authenticated | Server-Action equivalent of `AUTH_REQUIRED` (returned by `withActionAuth`) |
| `FORBIDDEN` | 403 | Not authorized | User is authenticated but lacks permission |
| `INVALID_REQUEST` | 400 | Malformed request | Request is missing required fields or malformed |
| `VALIDATION_ERROR` | 400 | Validation failed | Input validation failed (includes field-level details) |
| `NOT_FOUND` | 404 | Resource not found | Requested resource doesn't exist |
| `GONE` | 410 | Resource gone | Resource existed but is permanently removed or expired |
| `CONFLICT` | 409 | Resource conflict | Duplicate unique field or resource conflict |
| `USERNAME_TAKEN` | 409 | Username taken | Username is already in use by another user |
| `DUPLICATE_CONVERSATION_ID` | 409 | Duplicate conversation | Conversation ID already exists (Dify chat threads) |
| `MESSAGE_TOO_LONG` | 400 | Input too long | Input exceeds the maximum allowed length |
| `INVALID_CONVERSATION_ID` | 400 | Invalid conversation ID | Conversation ID is malformed (Dify chat threads) |
| `QUOTA_EXHAUSTED` | 429 | Quota exhausted | User's usage quota is exhausted for the current period |
| `RATE_LIMIT` | 429 | Rate limited | Too many requests |
| `TIMEOUT` | 408 | Request timeout | Request exceeded the time limit |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable | A required service is not configured or unavailable |
| `DB_ERROR` | 500 | Database error | Database operation failed |
| `SAVE_FAILED` | 500 | Persistence failed | Failed to persist data |
| `INTERNAL_ERROR` | 500 | Server error | Unexpected server error |
| `DIFY_ERROR` | 500 | AI service error | Upstream Dify chat API failed (Dify chat) |

## HTTP Status Codes

The `HTTP_STATUS` map in `src/libs/api/errors/types.ts` is the single source of truth for status codes:

- **200 OK** - Successful GET, PATCH (with body)
- **201 Created** - Successful POST (new resource created)
- **204 No Content** - Successful DELETE (no response body)
- **400 Bad Request** - Validation errors, malformed requests
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **408 Request Timeout** - Request exceeded time limit
- **409 Conflict** - Resource conflict (duplicate unique field)
- **410 Gone** - Resource existed but is no longer available
- **429 Too Many Requests** - Rate limit or quota exhausted
- **500 Internal Server Error** - Unexpected server errors
- **503 Service Unavailable** - Required service not configured

## Server-Side Usage (HTTP routes)

### Import Error Utilities

```typescript
import {
  unauthorizedError,
  forbiddenError,
  validationError,
  notFoundError,
  conflictError,
  invalidRequestError,
  goneError,
  dbError,
  internalError,
  formatZodErrors,
  logApiError,
  logDbError,
} from '@/libs/api/errors';
```

### Example: API Route with Error Handling

This example uses a generic `items` resource — substitute your own table and route segment.

```typescript
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  unauthorizedError,
  validationError,
  dbError,
  internalError,
  formatZodErrors,
  logDbError,
  logApiError,
} from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';

const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validate authentication
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // 2. Parse and validate input
    const body = await request.json();
    const result = createItemSchema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return validationError(errors);
    }

    // 3. Business logic
    const { data, error: dbQueryError } = await supabase
      .from('items')
      .insert({ title: result.data.title, user_id: user.id })
      .select()
      .single();

    if (dbQueryError || !data) {
      logDbError('create item', dbQueryError, {
        endpoint: '/api/items',
        method: 'POST',
        userId: user.id,
      });
      // The INSERT failed — the DB operation errored, so return a 5xx,
      // not a 404 (no resource is "missing"; persistence failed).
      return dbError('Failed to create item');
    }

    // 4. Return success
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/items',
      method: 'POST',
    });
    return internalError();
  }
}
```

> Many routes don't hand-roll the auth check above — they wrap the handler in `withAuth` / `withAdminAuth` (see `docs/api-contracts.md`), which performs the session check and returns `unauthorizedError()` for you.

### Error Response Builders

All builders live in `src/libs/api/errors/responses.ts` and are re-exported from `@/libs/api/errors`.

#### Authentication Errors

```typescript
// Return 401 Unauthorized
return unauthorizedError();
return unauthorizedError('Invalid session');
```

#### Authorization Errors

```typescript
// Return 403 Forbidden
return forbiddenError();
return forbiddenError('You can only edit your own items');
```

#### Validation Errors

```typescript
// Return 400 Bad Request with validation details
const result = createItemSchema.safeParse(body);
if (!result.success) {
  const errors = formatZodErrors(result.error);
  return validationError(errors);
}
```

#### Not Found / Gone Errors

```typescript
// Return 404 Not Found
return notFoundError('Item');
return notFoundError('User');

// Return 410 Gone (existed but is permanently removed or expired)
return goneError();
```

#### Conflict Errors

```typescript
// Return 409 Conflict
return conflictError('An item with this slug already exists');
```

#### Database Errors

```typescript
// Return 500 Internal Server Error
return dbError();
return dbError('Failed to fetch items');
```

#### Internal Errors

```typescript
// Return 500 Internal Server Error
return internalError();
return internalError('Unexpected error occurred');
```

### Error Logging

Logging helpers live in `src/libs/api/errors/logger.ts`:

```typescript
// Log API errors with context
logApiError(error, {
  endpoint: '/api/items',
  method: 'POST',
  userId: user?.id,
  errorCode: 'DB_ERROR',
  statusCode: 500,
});

// Log database errors
logDbError('fetch items', error, {
  endpoint: '/api/items',
  method: 'GET',
  userId: user.id,
});
```

## Server-Action Usage

Server Actions are wrapped with `withActionAuth` / `withActionAuthNoInput` (`src/libs/api/withActionAuth.ts`), which inject the authenticated `user` + request-scoped `supabase` client and return the `UNAUTHORIZED` `ActionResult` early when the session is missing.

```typescript
'use server';

import { z } from 'zod';

import { withActionAuth } from '@/libs/api/withActionAuth';
import type { ActionResult } from '@/libs/actions/types';

const renameItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
});

export const renameItem = withActionAuth(
  async ({ user, supabase }, input: unknown): Promise<ActionResult<{ id: string }>> => {
    const parsed = renameItemSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: { message: 'Validation failed', code: 'VALIDATION_ERROR' } };
    }

    const { data, error } = await supabase
      .from('items')
      .update({ title: parsed.data.title })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
      .select('id')
      .single();

    if (error || !data) {
      return { data: null, error: { message: 'Failed to rename item', code: 'DB_ERROR' } };
    }

    return { data: { id: data.id }, error: null };
  },
);
```

Call sites read the result directly:

```typescript
const result = await renameItem({ id, title });
if (result.error) {
  toast.error(result.error.message);
  return;
}
// result.data is typed and non-null here
```

## Client-Side Usage (HTTP routes)

### Import Client Utilities

```typescript
import { parseApiError, getErrorMessage } from '@/libs/api/client';
```

`parseApiError` (`src/libs/api/client/parseError.ts`) normalizes any `Response` into `{ message, code, details? }`, falling back to a `NETWORK_ERROR` code on malformed/non-JSON responses. `getErrorMessage` (`src/libs/api/client/displayError.ts`) maps a `code` to a user-friendly, i18n-aware message.

### Example: Handling API Errors

`router` and `t` come from React hooks, so they must be obtained in a component
or hook and passed in — `createItem` is a plain async helper, not a component,
and can't call `useRouter()` / `useTranslations()` itself.

```typescript
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { getErrorMessage, parseApiError } from '@/libs/api/client';

async function createItem(
  data: ItemData,
  t: ReturnType<typeof useTranslations>,
  router: ReturnType<typeof useRouter>,
) {
  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseApiError(response);

      // Route to sign-in on auth failure
      if (error.code === 'AUTH_REQUIRED') {
        router.push('/sign-in');
        return;
      }

      // Display a user-friendly, translated message
      toast.error(getErrorMessage(error.code, t));
      return;
    }

    const { data: item } = await response.json();
    return item;
  } catch {
    toast.error(getErrorMessage('NETWORK_ERROR', t));
  }
}

// Call site (inside a Client Component):
// const t = useTranslations();
// const router = useRouter();
// await createItem(data, t, router);
```

### Handling Validation Errors

`VALIDATION_ERROR` responses carry field-level details under `details` (the `Record<string, string[]>` produced by `formatZodErrors`). Read them off the parsed error:

```typescript
import { parseApiError } from '@/libs/api/client';

async function submitForm(data: FormData) {
  const response = await fetch('/api/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await parseApiError(response);

    if (error.code === 'VALIDATION_ERROR' && error.details) {
      // error.details = { title: ["Title must be at least 3 characters"] }
      Object.entries(error.details).forEach(([field, messages]) => {
        // Array index access is `string | undefined` under
        // `noUncheckedIndexedAccess`, so guard before calling setError.
        const message = (messages as string[])[0];
        if (message) {
          setError(field, { message });
        }
      });
    }
  }
}
```

## Internationalization

`getErrorMessage` looks up `errors.<CODE>` via next-intl, falling back to a built-in default when no translation exists. Locale messages live in a single flat file per locale (`src/locales/en.json`, `src/locales/hi.json`, …). Add an `errors` namespace keyed by error code:

> **Note:** the lookup key is the lowercase `errors` namespace, matching `displayError.ts`. This is distinct from the existing top-level `Errors` (capital E) namespace, which holds UI error-boundary copy (`Errors.boundary`, `Errors.auth`, …), not error codes. Out of the box the locale files ship the `Errors` boundary copy but **no** `errors.<CODE>` entries, so every code currently resolves via the built-in English defaults in `getDefaultErrorMessage` until you add the `errors` block below.

### `src/locales/en.json`

```json
{
  "errors": {
    "AUTH_REQUIRED": "You must be signed in to perform this action",
    "FORBIDDEN": "You don't have permission to access this resource",
    "VALIDATION_ERROR": "Please check your input and try again",
    "NOT_FOUND": "The requested resource was not found",
    "GONE": "This resource is no longer available",
    "CONFLICT": "This resource already exists",
    "DB_ERROR": "A database error occurred. Please try again later",
    "INTERNAL_ERROR": "An unexpected error occurred. Please try again",
    "NETWORK_ERROR": "Network error. Please check your connection"
  }
}
```

## Best Practices

### Do's

- Always use error builder functions instead of creating inline error responses
- Log errors with context before returning error responses
- Use proper HTTP status codes (4xx for client errors, 5xx for server errors)
- Include validation details in `VALIDATION_ERROR` responses
- Use user-friendly messages (not technical stack traces)
- Translate error messages for internationalization

### Don'ts

- Don't expose sensitive data in error messages (stack traces, internal IDs)
- Don't return different error formats across endpoints
- Don't use generic error codes when specific ones exist
- Don't skip error logging (always log before returning a 5xx error)
- Don't hard-code error messages on the client (use `getErrorMessage` + i18n)

## Adding New Error Codes

1. Add the code to the `ApiErrorCode` union in `src/libs/api/errors/types.ts`
2. Add a builder in `src/libs/api/errors/responses.ts` (if it needs a dedicated status/shape) and re-export it from `index.ts`
3. Add a default message in `src/libs/api/client/displayError.ts` and translation keys to all locale files
4. Update the canonical-shape snapshot in `responses.test.ts` if you added a builder
5. Update this documentation with the new code

## Testing Error Scenarios

### Unit Tests

```typescript
import { describe, expect, it } from 'vitest';

import { unauthorizedError, validationError } from '@/libs/api/errors';

describe('API Error Responses', () => {
  it('returns 401 for unauthorized requests', async () => {
    const response = unauthorizedError();

    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.code).toBe('AUTH_REQUIRED');
    expect(json.error).toBe('Authentication required');
  });

  it('returns 400 with validation details', async () => {
    const details = { title: ['Title must be at least 3 characters'] };
    const response = validationError(details);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.code).toBe('VALIDATION_ERROR');
    expect(json.details).toEqual(details);
  });
});
```

### Integration Tests

```typescript
describe('POST /api/items', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.code).toBe('AUTH_REQUIRED');
  });
});
```

## Related Files

- **Error Types**: `src/libs/api/errors/types.ts`
- **Error Builders**: `src/libs/api/errors/responses.ts`
- **Canonical-shape snapshot**: `src/libs/api/errors/responses.test.ts`
- **Validation Formatters**: `src/libs/api/errors/validation.ts`
- **Error Logging**: `src/libs/api/errors/logger.ts`
- **Client Utilities**: `src/libs/api/client/` (`parseApiError`, `getErrorMessage`)
- **Server-Action Wrappers**: `src/libs/api/withActionAuth.ts`
- **Server-Action Result Type**: `src/libs/actions/types.ts`
- **Translations**: `src/locales/{locale}.json` (`errors` namespace)
- **API Conventions**: `docs/api-contracts.md`
- **Error Boundaries (UI)**: `docs/error-handling-guide.md`
