# API Error Handling Guide

This guide explains the standardized error handling approach used across all API endpoints in the VT SaaS Template.

## Overview

All API endpoints return errors in a consistent format, making it easy to handle errors predictably in frontend code.

### Error Response Format

```typescript
{
  error: string;        // Human-readable error message
  code: string;         // Machine-readable error code
  details?: object;     // Optional additional context
}
```

### Success Response Format

```typescript
{
  data: T;              // The response payload
}
```

## Standard Error Codes

| Code | HTTP Status | Meaning | When to Use |
|------|-------------|---------|-------------|
| `AUTH_REQUIRED` | 401 | Not authenticated | User session is missing or invalid |
| `FORBIDDEN` | 403 | Not authorized | User is authenticated but lacks permission |
| `INVALID_REQUEST` | 400 | Malformed request | Request is missing required fields or malformed |
| `VALIDATION_ERROR` | 400 | Validation failed | Input validation failed (includes field-level details) |
| `NOT_FOUND` | 404 | Resource not found | Requested resource doesn't exist |
| `CONFLICT` | 409 | Resource conflict | Duplicate unique field (e.g., conversation ID) |
| `DUPLICATE_CONVERSATION_ID` | 409 | Duplicate conversation | Conversation ID already exists |
| `DB_ERROR` | 500 | Database error | Database operation failed |
| `INTERNAL_ERROR` | 500 | Server error | Unexpected server error |
| `DIFY_ERROR` | 500 | AI service error | Dify API error |
| `MESSAGE_TOO_LONG` | 400 | Message too long | Message exceeds maximum length |
| `INVALID_CONVERSATION_ID` | 400 | Invalid conversation ID | Conversation ID format is invalid |

## HTTP Status Codes

- **200 OK** - Successful GET, PATCH (with body)
- **201 Created** - Successful POST (new resource created)
- **204 No Content** - Successful DELETE (no response body)
- **400 Bad Request** - Validation errors, malformed requests
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource conflict (duplicate unique field)
- **500 Internal Server Error** - Unexpected server errors

## Server-Side Usage

### Import Error Utilities

```typescript
import {
  unauthorizedError,
  forbiddenError,
  validationError,
  notFoundError,
  conflictError,
  invalidRequestError,
  dbError,
  internalError,
  difyError,
  formatZodErrors,
  logApiError,
  logDbError,
} from '@/libs/api/errors';
```

### Example: API Route with Error Handling

```typescript
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  unauthorizedError,
  validationError,
  notFoundError,
  dbError,
  internalError,
  formatZodErrors,
  logDbError,
  logApiError,
} from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';

const schema = z.object({
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
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return validationError(errors);
    }

    // 3. Business logic
    const { data, error: dbQueryError } = await supabase
      .from('threads')
      .select()
      .single();

    if (dbQueryError || !data) {
      if (!data) {
        return notFoundError('Thread');
      }

      logDbError('fetch thread', dbQueryError, {
        endpoint: '/api/threads',
        method: 'POST',
        userId: user.id,
      });
      return dbError('Failed to fetch thread');
    }

    // 4. Return success
    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    logApiError(error, {
      endpoint: '/api/threads',
      method: 'POST',
    });
    return internalError();
  }
}
```

### Error Response Builders

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
return forbiddenError('You can only modify your own threads');
```

#### Validation Errors

```typescript
// Return 400 Bad Request with validation details
const result = schema.safeParse(body);
if (!result.success) {
  const errors = formatZodErrors(result.error);
  return validationError(errors);
}
```

#### Not Found Errors

```typescript
// Return 404 Not Found
return notFoundError('Thread');
return notFoundError('User');
```

#### Conflict Errors

```typescript
// Return 409 Conflict
return conflictError('Thread with this conversation ID already exists');
```

#### Database Errors

```typescript
// Return 500 Internal Server Error
return dbError();
return dbError('Failed to fetch threads');
```

#### Internal Errors

```typescript
// Return 500 Internal Server Error
return internalError();
return internalError('Unexpected error occurred');
```

### Error Logging

```typescript
// Log API errors with context
logApiError(error, {
  endpoint: '/api/threads',
  method: 'POST',
  userId: user?.id,
  errorCode: 'DB_ERROR',
  statusCode: 500,
});

// Log database errors
logDbError('fetch threads', error, {
  endpoint: '/api/threads',
  method: 'GET',
  userId: user.id,
});
```

## Client-Side Usage

### Import Client Utilities

```typescript
import {
  parseApiError,
  getErrorMessage,
  getErrorTitle,
  isAuthError,
  isValidationError,
  extractValidationErrors,
} from '@/libs/api/client';
```

### Example: Handling API Errors

```typescript
import { useTranslations } from 'next-intl';
import { parseApiError, getErrorMessage, isAuthError } from '@/libs/api/client';
import { toast } from 'sonner';

async function createThread(data: ThreadData) {
  const t = useTranslations();

  try {
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseApiError(response);

      // Handle auth errors
      if (isAuthError(error.code)) {
        router.push('/sign-in');
        return;
      }

      // Display error message
      toast.error(getErrorMessage(error.code, t));
      return;
    }

    const { data: thread } = await response.json();
    return thread;

  } catch (error) {
    toast.error(t('errors.NETWORK_ERROR'));
  }
}
```

### Handling Validation Errors

```typescript
import { parseApiError, isValidationError, extractValidationErrors } from '@/libs/api/client';

async function submitForm(data: FormData) {
  const response = await fetch('/api/threads', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await parseApiError(response);

    if (isValidationError(error.code)) {
      const fieldErrors = extractValidationErrors(error);
      // fieldErrors = { conversationId: ["Required"], title: ["Too short"] }

      // Set form errors for each field
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        setError(field, { message: messages[0] });
      });
    }
  }
}
```

## Internationalization

Add error message translations to your locale files:

### `src/locales/en/errors.json`

```json
{
  "errors": {
    "AUTH_REQUIRED": "You must be signed in to perform this action",
    "FORBIDDEN": "You don't have permission to access this resource",
    "VALIDATION_ERROR": "Please check your input and try again",
    "NOT_FOUND": "The requested resource was not found",
    "CONFLICT": "This resource already exists",
    "DB_ERROR": "A database error occurred. Please try again later",
    "INTERNAL_ERROR": "An unexpected error occurred. Please try again",
    "DIFY_ERROR": "The AI service is temporarily unavailable",
    "MESSAGE_TOO_LONG": "Your message exceeds the maximum length",
    "INVALID_CONVERSATION_ID": "Invalid conversation ID format",
    "NETWORK_ERROR": "Network error. Please check your connection"
  }
}
```

## Best Practices

### Do's

✅ Always use error utility functions instead of creating inline error responses
✅ Log errors with context before returning error responses
✅ Use proper HTTP status codes (400 for client errors, 500 for server errors)
✅ Include validation details in `VALIDATION_ERROR` responses
✅ Use user-friendly messages (not technical stack traces)
✅ Translate error messages for internationalization

### Don'ts

❌ Don't expose sensitive data in error messages (stack traces, internal IDs)
❌ Don't return different error formats across endpoints
❌ Don't use generic error codes when specific ones exist
❌ Don't skip error logging (always log before returning error)
❌ Don't hard-code error messages (use i18n)

## Adding New Error Codes

1. Add the error code to `ApiErrorCode` type in `src/libs/api/errors/types.ts`
2. Create a helper function in `src/libs/api/errors/responses.ts` (if needed)
3. Add translation keys to all locale files
4. Update this documentation with the new error code

## Testing Error Scenarios

### Unit Tests

```typescript
import { describe, expect, it } from 'vitest';
import { unauthorizedError, validationError } from '@/libs/api/errors';

describe('API Error Responses', () => {
  it('should return 401 for unauthorized requests', async () => {
    const response = unauthorizedError();

    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.code).toBe('AUTH_REQUIRED');
    expect(json.error).toBe('Authentication required');
  });

  it('should return 400 with validation details', async () => {
    const details = { field: ['Error message'] };
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
describe('POST /api/threads', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/threads', {
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
- **Validation Formatters**: `src/libs/api/errors/validation.ts`
- **Error Logging**: `src/libs/api/errors/logger.ts`
- **Client Utilities**: `src/libs/api/client/`
- **Translations**: `src/locales/{locale}/errors.json`

## Support

For questions or issues with error handling:
1. Check this documentation
2. Review existing API routes for examples
3. Check the TypeScript types in `src/libs/api/errors/types.ts`
