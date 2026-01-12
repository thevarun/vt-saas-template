# Story 1.7: Standardize API Error Handling

**Epic:** Epic 1 - Template Foundation & Modernization
**Story ID:** 1.7
**Status:** ready-for-dev
**Assigned To:** error-handling-specialist
**Priority:** High
**Estimate:** 3 story points

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

---

## User Story

As a **developer consuming API endpoints**,
I want **consistent error response format across all APIs**,
So that **I can handle errors predictably in my frontend code**.

---

## Acceptance Criteria

### AC1: Consistent Error Response Format
**Given** any API endpoint returning an error
**When** the error response is sent
**Then** it follows the format `{ error: string, code: string, details?: object }`
**And** HTTP status codes are used correctly (400, 401, 403, 404, 500)

### AC2: Validation Error Handling
**Given** a validation error on API input
**When** the request contains invalid data
**Then** response is 400 Bad Request
**And** `details` contains field-level error information
**And** error message is user-friendly

### AC3: Authentication Error Handling
**Given** an authentication error
**When** the user is not authenticated
**Then** response is 401 Unauthorized
**And** `code` is "UNAUTHORIZED" or "AUTH_REQUIRED"

### AC4: Authorization Error Handling
**Given** an authorization error
**When** the user lacks permission
**Then** response is 403 Forbidden
**And** `code` is "FORBIDDEN"

---

## Context

### Current State Analysis

**Existing API Error Patterns (Verified 2026-01-12):**

✅ **Good Patterns Already in Use:**
- `/api/chat/route.ts`: Uses consistent format with `{ error, code }` pattern
- `/api/threads/route.ts`: Uses Zod validation with proper error codes
- Standard codes in use: `AUTH_REQUIRED`, `INVALID_REQUEST`, `VALIDATION_ERROR`, `DB_ERROR`, `INTERNAL_ERROR`
- Proper HTTP status codes (401, 400, 409, 500)
- Validation details included from Zod errors

❌ **Inconsistencies Found:**
- Some routes return `{ error, code }` while format varies slightly
- No centralized error response utility
- Error codes not fully standardized across all endpoints
- Some error messages too technical (e.g., "Dify API error")
- No formal documentation of error code standards

**Architecture Documented Format:**
According to `/architecture/core-architectural-decisions.md`:
```typescript
{
  error: "Human-readable message",
  code: "MACHINE_READABLE_CODE",
  details: {} // Optional (validation errors, debug info in dev)
}
```

Standard codes defined:
- `AUTH_REQUIRED` - Not authenticated
- `INVALID_REQUEST` - Malformed request
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (duplicate)
- `DB_ERROR` - Database operation failed
- `INTERNAL_ERROR` - Unexpected server error
- `FORBIDDEN` - Authenticated but not authorized (NEW - needs implementation)

---

## Tasks

### Task 1: Create Centralized Error Response Utilities
**Description:** Build type-safe error response utilities to ensure consistency across all API routes
**AC:** #1, #2, #3, #4

#### 1.1: Create Error Response Types
- [ ] File: `src/libs/api/errors/types.ts`
- [ ] Define TypeScript types:
  ```typescript
  export type ApiErrorCode =
    | 'AUTH_REQUIRED'
    | 'FORBIDDEN'
    | 'INVALID_REQUEST'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'DB_ERROR'
    | 'INTERNAL_ERROR'
    | 'DIFY_ERROR'
    | 'MESSAGE_TOO_LONG'
    | 'INVALID_CONVERSATION_ID'
    | 'DUPLICATE_CONVERSATION_ID';

  export interface ApiErrorResponse {
    error: string;
    code: ApiErrorCode;
    details?: Record<string, any>;
  }

  export interface ApiSuccessResponse<T> {
    data: T;
  }
  ```
- [ ] Export types for use across codebase

#### 1.2: Create Error Response Builder Functions
- [ ] File: `src/libs/api/errors/responses.ts`
- [ ] Implement helper functions:
  ```typescript
  // Generic error response
  export function createErrorResponse(
    error: string,
    code: ApiErrorCode,
    status: number,
    details?: Record<string, any>
  ): NextResponse<ApiErrorResponse>

  // Specific error builders
  export function unauthorizedError(message?: string): NextResponse
  export function forbiddenError(message?: string): NextResponse
  export function validationError(details: any, message?: string): NextResponse
  export function notFoundError(resource: string): NextResponse
  export function conflictError(message: string): NextResponse
  export function dbError(message?: string): NextResponse
  export function internalError(message?: string): NextResponse
  ```
- [ ] Add JSDoc comments with usage examples
- [ ] Include environment-aware details (dev vs. production)

#### 1.3: Create Error Logging Utility
- [ ] File: `src/libs/api/errors/logger.ts`
- [ ] Wrap existing Logger with API-specific context:
  ```typescript
  export function logApiError(
    error: Error | unknown,
    context: {
      endpoint: string;
      method: string;
      userId?: string;
      requestId?: string;
    }
  ): void
  ```
- [ ] Automatically capture error to Sentry with tags
- [ ] Add breadcrumbs for debugging
- [ ] Include request context (route, user, timing)

#### 1.4: Create Validation Error Formatter
- [ ] File: `src/libs/api/errors/validation.ts`
- [ ] Transform Zod errors to user-friendly format:
  ```typescript
  export function formatZodErrors(
    zodError: z.ZodError
  ): Record<string, string[]>
  ```
- [ ] Map field paths to human-readable names
- [ ] Convert validation messages to user-friendly text
- [ ] Support nested object validation errors

**Test Coverage:**
- Unit tests for all error response builders
- Test TypeScript type safety
- Test environment-specific behavior (dev vs. prod)
- Test Zod error formatting with complex schemas

**Dev Notes:**
- Follow Next.js 15 patterns for Response objects
- Use existing Logger and Sentry configuration
- Keep utilities pure functions (no side effects except logging)
- Reference architecture pattern: `/architecture/implementation-patterns-consistency-rules.md#API Response Formats`

---

### Task 2: Refactor Existing API Routes
**Description:** Update all existing API routes to use standardized error utilities
**AC:** #1, #2, #3, #4

#### 2.1: Audit All API Routes
- [ ] Identify all API route files:
  - `/api/chat/route.ts`
  - `/api/chat/messages/route.ts`
  - `/api/threads/route.ts`
  - `/api/threads/[id]/route.ts`
  - `/api/threads/[id]/archive/route.ts`
- [ ] Document current error handling approach per route
- [ ] Identify error patterns to standardize

#### 2.2: Refactor `/api/chat/route.ts`
- [ ] Replace inline auth error with `unauthorizedError()`
- [ ] Replace validation errors with `validationError()`
- [ ] Replace generic Dify errors with specific error codes
- [ ] Update error logging to use `logApiError()`
- [ ] Keep SSE streaming error handling special case
- [ ] Test streaming still works correctly

#### 2.3: Refactor `/api/threads/route.ts`
- [ ] Replace inline error responses with utility functions
- [ ] Update GET handler errors:
  - Auth error → `unauthorizedError()`
  - DB error → `dbError()`
  - Generic catch → `internalError()`
- [ ] Update POST handler errors:
  - Auth error → `unauthorizedError()`
  - Validation error → `validationError()` with Zod formatting
  - Duplicate error → `conflictError()`
  - DB error → `dbError()`
- [ ] Verify error codes match architecture standards

#### 2.4: Refactor `/api/threads/[id]/route.ts`
- [ ] Update GET/PATCH/DELETE handlers with standard errors
- [ ] Add proper 404 handling for missing threads
- [ ] Replace inline auth validation
- [ ] Add proper authorization check (user owns thread)
- [ ] Implement `forbiddenError()` for auth violations

#### 2.5: Refactor `/api/threads/[id]/archive/route.ts`
- [ ] Standardize POST handler errors
- [ ] Add 404 for non-existent threads
- [ ] Add 403 for unauthorized archive attempts
- [ ] Update error logging

#### 2.6: Refactor `/api/chat/messages/route.ts`
- [ ] Review and standardize error responses
- [ ] Ensure consistent with chat route patterns
- [ ] Update error codes to match standards

**Test Coverage:**
- E2E tests for each error scenario per route
- Verify error format matches specification
- Test authentication errors return 401
- Test authorization errors return 403
- Test validation errors return 400 with details
- Test database errors return 500 with appropriate code

**Dev Notes:**
- Test each route after refactoring
- Preserve existing business logic
- Don't change behavior, only error format
- Update inline comments to reference error utilities
- Verify Sentry still captures errors correctly

---

### Task 3: Add Error Response Validation Middleware
**Description:** Create middleware to ensure all API responses match error format spec
**AC:** #1

#### 3.1: Create Response Format Validator (Dev Only)
- [ ] File: `src/libs/api/middleware/validateResponse.ts`
- [ ] Implement development-only middleware:
  ```typescript
  export function withResponseValidation(
    handler: (req: NextRequest) => Promise<NextResponse>
  ): (req: NextRequest) => Promise<NextResponse>
  ```
- [ ] Validate response body against ApiErrorResponse schema
- [ ] Log warnings for non-compliant responses
- [ ] Only active in development environment

#### 3.2: Add Response Schema Tests
- [ ] Create Zod schema for ApiErrorResponse
- [ ] Validate all error responses match schema
- [ ] Add runtime checks in development
- [ ] Disable in production (performance)

**Test Coverage:**
- Test middleware catches invalid error formats
- Test middleware allows valid formats
- Test middleware is disabled in production
- Test logging of format violations

**Dev Notes:**
- Development-only tool (no production overhead)
- Help catch errors during development
- Log clear warnings with fix suggestions
- Reference Zod for schema validation

---

### Task 4: Document Error Handling Standards
**Description:** Create comprehensive documentation for API error handling
**AC:** #1, #2, #3, #4

#### 4.1: Create API Error Handling Guide
- [ ] File: `docs/api-error-handling.md`
- [ ] Document:
  - Error response format specification
  - All standard error codes and meanings
  - HTTP status code mapping
  - When to use each error code
  - Examples for common scenarios
  - How to add new error codes
  - Testing error scenarios

#### 4.2: Update Project Documentation
- [ ] File: `/Users/varuntorka/Coding/vt-saas-template/CLAUDE.md`
- [ ] Add section: "API Error Handling"
- [ ] Link to comprehensive guide
- [ ] Include quick reference table
- [ ] Document error utility imports

#### 4.3: Add JSDoc to All Utilities
- [ ] Comprehensive JSDoc for all error functions
- [ ] Include usage examples in comments
- [ ] Document parameters and return types
- [ ] Link to error handling guide

#### 4.4: Update Architecture Documentation
- [ ] Verify `/architecture/core-architectural-decisions.md` is accurate
- [ ] Update `/architecture/implementation-patterns-consistency-rules.md` with new utilities
- [ ] Add error handling section if missing

**Test Coverage:**
- Documentation review (manual)
- Verify examples are accurate and runnable
- Test documented patterns match implementation

**Dev Notes:**
- Documentation is user-facing (template users)
- Include copy-paste examples
- Explain WHY, not just WHAT
- Link to TypeScript types for reference

---

### Task 5: Add Client-Side Error Handling Utilities
**Description:** Create utilities for consuming API errors in frontend code
**AC:** #1

#### 5.1: Create API Error Parser
- [ ] File: `src/libs/api/client/parseError.ts`
- [ ] Client-side utility to parse API error responses:
  ```typescript
  export function parseApiError(response: Response): Promise<{
    message: string;
    code: string;
    details?: Record<string, any>;
  }>
  ```
- [ ] Handle network errors gracefully
- [ ] Provide user-friendly fallback messages
- [ ] Extract validation errors for form display

#### 5.2: Create Error Display Utilities
- [ ] File: `src/libs/api/client/displayError.ts`
- [ ] Map error codes to user-friendly messages:
  ```typescript
  export function getErrorMessage(
    code: string,
    t: (key: string) => string
  ): string
  ```
- [ ] Support i18n translations
- [ ] Provide sensible defaults
- [ ] Map technical errors to user messages

#### 5.3: Add Error Toast Helper
- [ ] File: `src/libs/api/client/toastError.ts`
- [ ] Wrapper around toast for API errors:
  ```typescript
  export function toastApiError(
    error: ApiErrorResponse,
    t: (key: string) => string
  ): void
  ```
- [ ] Use shadcn/ui toast component
- [ ] Display user-friendly message
- [ ] Show validation details appropriately

**Test Coverage:**
- Unit tests for error parsing
- Test network error handling
- Test message formatting with i18n
- Test toast integration

**Dev Notes:**
- Client-side utilities (not server)
- Support i18n with next-intl
- Follow existing toast patterns
- Reference shadcn/ui documentation

---

### Task 6: Add Error Translation Keys
**Description:** Add i18n translations for all error messages
**AC:** #2

#### 6.1: Add English Translations
- [ ] File: `src/locales/en/errors.json`
- [ ] Add keys for all error codes:
  ```json
  {
    "errors": {
      "AUTH_REQUIRED": "You must be signed in to perform this action",
      "FORBIDDEN": "You don't have permission to access this resource",
      "VALIDATION_ERROR": "Please check your input and try again",
      "NOT_FOUND": "The requested resource was not found",
      ...
    }
  }
  ```

#### 6.2: Add Hindi Translations
- [ ] File: `src/locales/hi/errors.json`
- [ ] Translate all error keys to Hindi

#### 6.3: Add Bengali Translations
- [ ] File: `src/locales/bn/errors.json`
- [ ] Translate all error keys to Bengali

#### 6.4: Update Common Translation Keys
- [ ] Add generic error messages to `common.json` for all locales
- [ ] Add validation-related messages
- [ ] Add network error messages

**Test Coverage:**
- Verify all error codes have translations
- Test translation loading in components
- Manual review of translations

**Dev Notes:**
- Use next-intl conventions
- Keep messages user-friendly (not technical)
- Coordinate with Crowdin if translations automated
- Reference existing translation patterns

---

### Task 7: Create Error Handling Test Suite
**Description:** Comprehensive test coverage for error handling utilities
**AC:** All

#### 7.1: Unit Tests for Error Utilities
- [ ] File: `src/libs/api/errors/responses.test.ts`
- [ ] Test all error response builders
- [ ] Test TypeScript types are correct
- [ ] Test status codes are correct
- [ ] Test error format matches spec
- [ ] Test details are included correctly

#### 7.2: Integration Tests for API Routes
- [ ] File: `tests/integration/api-errors.test.ts`
- [ ] Test each API route error scenario:
  - Unauthorized requests
  - Invalid input
  - Missing resources
  - Authorization failures
  - Database errors
- [ ] Verify response format consistency
- [ ] Verify status codes correct

#### 7.3: E2E Tests for Error Scenarios
- [ ] File: `tests/e2e/APIErrorHandling.e2e.ts`
- [ ] Test user-facing error scenarios:
  - Form validation errors displayed correctly
  - Auth errors redirect to sign-in
  - Network errors show retry option
  - Toast notifications work correctly

#### 7.4: Add Error Simulation Utilities
- [ ] File: `src/utils/test-helpers/apiErrors.ts`
- [ ] Utilities for simulating API errors in tests
- [ ] Mock error responses
- [ ] Trigger specific error codes
- [ ] Test error boundary integration

**Test Coverage:**
- All error utilities have unit tests
- All API routes have integration tests
- Critical error flows have E2E tests
- Error boundaries tested with API errors

**Dev Notes:**
- Use Vitest for unit/integration tests
- Use Playwright for E2E tests
- Mock external services (Dify, Supabase)
- Test both happy path and error paths
- Verify Sentry captures (mock in tests)

---

## Technical Requirements

### Next.js 15 API Route Patterns

**Response Objects:**
- Use `NextResponse.json()` for JSON responses
- Set proper HTTP status codes
- Include headers if needed (CORS, caching)

**Error Handling:**
- Wrap handlers in try/catch
- Log errors before returning response
- Never expose sensitive data in errors
- Use environment checks for debug info

**TypeScript Strict Mode:**
- All error responses must be typed
- Use `ApiErrorResponse` and `ApiSuccessResponse` types
- Validate status codes with TypeScript

### Architecture Compliance

**Error Response Format (Architecture Standard):**
From `/architecture/core-architectural-decisions.md`:
```typescript
// Success response
{ data: T }

// Error response
{
  error: "Human-readable message",
  code: "MACHINE_READABLE_CODE",
  details?: {} // Optional, dev only
}
```

**HTTP Status Codes (Architecture Standard):**
- **200 OK** - Successful GET, PATCH (with body)
- **201 Created** - Successful POST (new resource)
- **204 No Content** - Successful DELETE (no body)
- **400 Bad Request** - Validation errors, malformed requests
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource conflict (duplicate unique field)
- **500 Internal Server Error** - Unexpected server errors

**Error Codes (Standardized):**
- `AUTH_REQUIRED` - Not authenticated
- `FORBIDDEN` - Authenticated but not authorized
- `INVALID_REQUEST` - Malformed request
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (duplicate)
- `DB_ERROR` - Database operation failed
- `INTERNAL_ERROR` - Unexpected server error

### Zod Validation Integration

**Pattern from Existing Code:**
```typescript
const schema = z.object({
  field: z.string().min(1, 'Field is required')
});

const validated = schema.safeParse(body);
if (!validated.success) {
  return validationError(validated.error.errors, 'Validation failed');
}
```

**Validation Error Details:**
- Include field paths
- Include validation messages
- Format user-friendly
- Map Zod errors to API format

### Logging and Monitoring

**Sentry Integration:**
- Capture exceptions: `Sentry.captureException(error, scope)`
- Add breadcrumbs for context
- Include tags: `errorCode`, `endpoint`, `method`
- Add user context if authenticated

**Logger Integration:**
- Use existing `Logger` from `src/libs/Logger.ts`
- Log errors with context:
  ```typescript
  logger.error({ error, endpoint, userId }, 'API error occurred');
  ```
- Log levels: error (500s), warn (400s, expected errors), info (success)

### Internationalization (i18n)

**Error Messages:**
- Store in `src/locales/[locale]/errors.json`
- Keys: `errors.{ERROR_CODE}`
- Client-side: Use `useTranslations('errors')` hook
- Server-side: Messages in English by default

**Supported Locales:**
- English (en) - primary
- Hindi (hi)
- Bengali (bn)

---

## Dev Notes

### Current State

**Good Patterns Already Established:**
1. Consistent use of `{ error, code }` format in most routes
2. Proper HTTP status codes (401, 400, 409, 500)
3. Zod validation with error details
4. Session validation pattern consistent
5. Sentry integration working

**Gaps to Address:**
1. No centralized error utilities (inline error creation everywhere)
2. Error codes not fully standardized (some routes use different codes)
3. No client-side error handling utilities
4. Missing documentation
5. Missing i18n translations for errors
6. No middleware to validate error format
7. Missing 403 Forbidden handling

### Implementation Strategy

**Phase 1: Foundation (Tasks 1-2)**
1. Create error utilities (`src/libs/api/errors/`)
2. Refactor existing routes to use utilities
3. Test thoroughly

**Phase 2: Enhancement (Tasks 3-5)**
4. Add validation middleware (dev only)
5. Create client-side utilities
6. Add i18n translations

**Phase 3: Documentation & Testing (Tasks 6-7)**
7. Document standards
8. Comprehensive test suite

**Estimated Time:**
- Task 1: 1 hour (utilities creation)
- Task 2: 1.5 hours (refactor 5 routes)
- Task 3: 30 minutes (validation middleware)
- Task 4: 30 minutes (documentation)
- Task 5: 45 minutes (client utilities)
- Task 6: 30 minutes (i18n)
- Task 7: 1 hour (testing)
- **Total: ~6 hours** (3 story points appropriate)

### Key Files to Create

**New Files:**
```
src/libs/api/errors/
├── types.ts                    # TypeScript types
├── responses.ts                # Error response builders
├── logger.ts                   # API error logging
└── validation.ts               # Zod error formatting

src/libs/api/client/
├── parseError.ts               # Client error parser
├── displayError.ts             # User-friendly messages
└── toastError.ts               # Toast integration

src/libs/api/middleware/
└── validateResponse.ts         # Dev-only format validation

docs/
└── api-error-handling.md       # Comprehensive guide

src/locales/{locale}/
└── errors.json                 # Error translations
```

**Files to Modify:**
```
src/app/api/
├── chat/route.ts               # Refactor errors
├── chat/messages/route.ts      # Refactor errors
├── threads/route.ts            # Refactor errors
├── threads/[id]/route.ts       # Refactor errors
└── threads/[id]/archive/route.ts # Refactor errors

CLAUDE.md                        # Add error handling section
_bmad-output/planning-artifacts/architecture/ # Verify documentation
```

### Architecture Patterns to Follow

**From `/architecture/implementation-patterns-consistency-rules.md`:**

1. **File Naming:** `camelCase.ts` for utilities
2. **Function Naming:** `camelCase`, verb-first (`createErrorResponse`)
3. **Type Naming:** `PascalCase` (`ApiErrorResponse`)
4. **Error Codes:** `UPPER_SNAKE_CASE` (`AUTH_REQUIRED`)
5. **API Response Format:** `{ data: T }` or `{ error, code, details? }`
6. **Logging:** Structured with context, not just messages

**Error Handling Pattern:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Validate session
    const { user, error } = await validateSession();
    if (error) return unauthorizedError();

    // 2. Parse & validate input
    const body = await request.json();
    const validated = schema.safeParse(body);
    if (!validated.success) {
      return validationError(validated.error.errors);
    }

    // 3. Business logic
    const result = await doSomething(validated.data);

    // 4. Return success
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    logApiError(error, { endpoint: '/api/resource', method: 'POST' });
    return internalError();
  }
}
```

### Testing Strategy

**Unit Tests (Vitest):**
- Test all error utility functions
- Test error formatters
- Test TypeScript types
- Test environment-specific behavior

**Integration Tests:**
- Test each API route error scenario
- Test error format consistency
- Test status codes correct
- Test Sentry capture (mocked)

**E2E Tests (Playwright):**
- Test user-facing error scenarios
- Test form validation errors display
- Test auth errors redirect
- Test toast notifications work

**Manual Testing:**
- Trigger each error code
- Verify user-friendly messages
- Test across all locales
- Verify no regressions

### Common Pitfalls to Avoid

1. **Exposing Sensitive Data:**
   - Never include stack traces in production
   - Sanitize database errors
   - Don't expose internal IDs
   - Use generic messages in production

2. **Inconsistent Error Format:**
   - Always use error utilities
   - Never return raw Error objects
   - Always include `code` field
   - Use correct HTTP status codes

3. **Missing Context:**
   - Log errors with full context
   - Include user ID if authenticated
   - Include request details
   - Add Sentry breadcrumbs

4. **Over-Engineering:**
   - Keep utilities simple
   - Don't create too many error codes
   - Reuse existing codes when possible
   - Don't add unnecessary complexity

5. **Breaking Changes:**
   - Preserve existing behavior
   - Don't change API contracts
   - Update tests to match changes
   - Verify no regressions

### Project Structure Notes

**Alignment with Architecture:**
- Error utilities in `src/libs/api/` (external integrations pattern)
- Client utilities separate from server
- Types colocated with implementations
- Tests colocated with source files

**No Conflicts:**
- Follows established patterns
- Uses existing Sentry configuration
- Uses existing Logger
- Compatible with Zod validation

### References

**Architecture Documents:**
- [Source: /architecture/core-architectural-decisions.md#API & Communication Patterns]
- [Source: /architecture/implementation-patterns-consistency-rules.md#API Response Formats]
- [Source: /architecture/implementation-patterns-consistency-rules.md#Error Handling Patterns]

**Existing Code Examples:**
- [Source: src/app/api/chat/route.ts] - Good error handling with SSE
- [Source: src/app/api/threads/route.ts] - Good Zod validation pattern
- [Source: src/libs/Logger.ts] - Existing logger to use
- [Source: /sentry.client.config.ts] - Sentry configuration

**Related Stories:**
- Story 1.6: Error boundaries (complementary error handling)
- Future stories may add new API routes needing error handling

**External Documentation:**
- Next.js Error Handling: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- Zod Documentation: https://zod.dev
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

## Definition of Done

- [ ] Error utility functions created and typed
- [ ] All existing API routes refactored to use utilities
- [ ] Error codes standardized across all routes
- [ ] Client-side error utilities created
- [ ] i18n translations added for all error codes
- [ ] Validation middleware created (dev-only)
- [ ] Documentation created and comprehensive
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing completed
- [ ] All automated tests pass (`npm test`)
- [ ] TypeScript check passes (`npm run check-types`)
- [ ] Linting passes (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Code review completed
- [ ] Story marked complete in sprint-status.yaml

---

## Dependencies

**Depends On:**
- Story 1.1: Next.js 15 upgrade (for latest API patterns)
- Story 1.4: TypeScript 5.7+ (for strict type safety)

**Blocks:**
- Future API routes will use these utilities
- Future error handling enhancements

**Related:**
- Story 1.6: Error boundaries (complementary UX error handling)

---

## Dev Notes for error-handling-specialist Agent

### Execution Order

**Recommended Sequence:**
1. **Task 1** - Create utilities (foundation)
2. **Task 2** - Refactor routes (apply utilities)
3. **Task 5** - Client utilities (enable frontend consumption)
4. **Task 6** - i18n translations (user-friendly messages)
5. **Task 3** - Validation middleware (quality assurance)
6. **Task 4** - Documentation (knowledge sharing)
7. **Task 7** - Testing (verification)

### Critical Success Factors

**Must Have:**
1. ✅ All API routes return consistent error format
2. ✅ All error codes match architecture standard
3. ✅ Client can parse and display errors predictably
4. ✅ Errors logged to Sentry with context
5. ✅ i18n translations for user-facing messages

**Nice to Have:**
6. Validation middleware (dev tool)
7. Comprehensive documentation
8. Additional client utilities

### Quality Checklist

Before marking complete:
- [ ] Run all API routes and verify error format
- [ ] Test each error code (401, 403, 400, 404, 409, 500)
- [ ] Verify Sentry captures errors with context
- [ ] Test client error parsing
- [ ] Test form validation error display
- [ ] Check all locales have translations
- [ ] Verify documentation is clear
- [ ] All tests green
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Production build succeeds

### Testing Strategy

**Unit Tests Priority:**
1. Error response builders
2. Validation error formatters
3. Client error parsers
4. Type safety

**Integration Tests Priority:**
1. Each API route error scenario
2. Error format consistency
3. Status code correctness
4. Sentry integration

**E2E Tests Priority:**
1. Form validation errors
2. Auth error redirects
3. Toast notifications
4. User-friendly messages

### Implementation Tips

**Error Utility Pattern:**
```typescript
// Simple and reusable
export function unauthorizedError(message = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'AUTH_REQUIRED',
    },
    { status: 401 }
  );
}
```

**Client Error Parser:**
```typescript
export async function parseApiError(response: Response) {
  try {
    const json = await response.json();
    return {
      message: json.error || 'An error occurred',
      code: json.code || 'UNKNOWN_ERROR',
      details: json.details,
    };
  } catch {
    return {
      message: 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}
```

**Usage in Components:**
```typescript
try {
  const response = await fetch('/api/threads', { method: 'POST', body: JSON.stringify(data) });
  if (!response.ok) {
    const error = await parseApiError(response);
    toast.error(getErrorMessage(error.code, t));
    return;
  }
  const { data } = await response.json();
  // Success handling
} catch (error) {
  toast.error(t('errors.NETWORK_ERROR'));
}
```

### Success Criteria

**Story is Complete When:**
1. ✅ All API routes use standard error format
2. ✅ All error codes documented and consistent
3. ✅ Client can handle errors predictably
4. ✅ Errors logged with full context
5. ✅ i18n support for all errors
6. ✅ Documentation clear and comprehensive
7. ✅ All tests passing

**Story is NOT Complete If:**
1. ❌ Any API route returns non-standard format
2. ❌ Error codes inconsistent across routes
3. ❌ Missing documentation
4. ❌ Tests failing
5. ❌ Missing i18n translations
6. ❌ Sentry not capturing errors correctly

---

## Story Metadata

**Created:** 2026-01-12
**Epic:** Epic 1 - Template Foundation & Modernization
**Sprint:** Sprint 1
**Story Points:** 3
**Risk Level:** Medium (touches all API routes)
**Technical Debt:** Removes error handling inconsistencies
**Agent Assignment:** error-handling-specialist
**Review Required:** Yes (impacts all API consumers)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
