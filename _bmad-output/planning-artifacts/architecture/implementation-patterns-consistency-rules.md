# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**Critical Conflict Points Identified:** 25+ areas where AI agents could make different choices without clear guidance

These patterns are derived from HealthCompanion's **production-proven codebase** and architectural decisions. All AI agents implementing features MUST follow these patterns to ensure compatibility.

---

## Naming Patterns

**Database Naming Conventions:**

**Tables:**
- **Format:** `snake_case`, lowercase, plural nouns
- **Examples:** `threads`, `user_profiles`, `feedback_submissions`
- **Pattern:**
  ```typescript
  // Correct
  export const threads = healthCompanionSchema.table('threads', { ... });
  export const userProfiles = healthCompanionSchema.table('user_profiles', { ... });

  // Incorrect
  export const Thread = schema.table('Thread', { ... }); // Wrong: PascalCase
  export const user_profile = schema.table('user_profile', { ... }); // Wrong: singular
  ```

**Columns:**
- **Format:** `snake_case`, descriptive names
- **Primary Keys:** `id` (not `user_id` for primary key, just `id`)
- **Foreign Keys:** `{table}_id` (e.g., `user_id`, `thread_id`)
- **Timestamps:** `created_at`, `updated_at` (not `createdAt`)
- **Booleans:** `is_{condition}` or `has_{attribute}` (e.g., `is_admin`, `has_verified_email`)
- **Examples:**
  ```typescript
  // Correct
  {
    id: uuid('id').primaryKey(),
    user_id: uuid('user_id').references(() => users.id),
    conversation_id: text('conversation_id').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    is_archived: boolean('is_archived').default(false)
  }

  // Incorrect
  {
    userId: uuid('userId'), // Wrong: camelCase in DB
    conversationID: text('conversationID'), // Wrong: uppercase ID
    createdAt: timestamp('createdAt') // Wrong: camelCase timestamp
  }
  ```

**Indexes:**
- **Format:** `idx_{table}_{column(s)}`
- **Examples:** `idx_threads_user_id`, `idx_feedback_created_at`

**Schema Naming:**
- **Format:** `{project_name}Schema` in code, `{project_name}` in database
- **Example:**
  ```typescript
  export const healthCompanionSchema = pgSchema('health_companion');
  // Template users rename to: vtSaasSchema = pgSchema('vt_saas')
  ```

---

**API Naming Conventions:**

**REST Endpoints:**
- **Format:** `/api/{resource}` - lowercase, plural for collections, singular for actions
- **Collections:** `/api/threads`, `/api/users`, `/api/feedback`
- **Resource Actions:** `/api/threads/{id}`, `/api/threads/{id}/archive`
- **Special Actions:** `/api/chat` (singular for action, not collection)
- **Examples:**
  ```typescript
  // Correct
  app / api / threads / route.ts; // GET/POST /api/threads
  app / api / threads / [id] / route.ts; // GET/PATCH/DELETE /api/threads/:id
  app / api / threads / [id] / archive / route.ts; // POST /api/threads/:id/archive
  app / api / chat / route.ts; // POST /api/chat

  // Incorrect
  app / api / Thread / route.ts; // Wrong: PascalCase
  app / api / thread / route.ts; // Wrong: singular for collection
  app / api / threads - list / route.ts; // Wrong: kebab-case compound
  ```

**Route Parameters:**
- **Format:** `[id]`, `[slug]` - lowercase, descriptive
- **Access:** `const params = await params` (Next.js 15 async params)
- **Example:**
  ```typescript
  // Correct
  app / api / threads / [id] / route.ts;
  export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```

**Query Parameters:**
- **Format:** `camelCase` in URLs
- **Examples:** `?userId=123`, `?conversationId=abc`, `?includeArchived=true`

**HTTP Status Codes:**
- **200 OK:** Successful GET, PATCH (with response body)
- **201 Created:** Successful POST (new resource created)
- **204 No Content:** Successful DELETE (no response body)
- **400 Bad Request:** Validation errors, malformed requests
- **401 Unauthorized:** Missing or invalid authentication
- **403 Forbidden:** Authenticated but not authorized
- **404 Not Found:** Resource doesn't exist
- **409 Conflict:** Resource conflict (e.g., duplicate unique field)
- **500 Internal Server Error:** Unexpected server errors

---

**Code Naming Conventions:**

**Components:**
- **Format:** `PascalCase`, descriptive nouns
- **Files:** `{ComponentName}.tsx` (match component name exactly)
- **Examples:**
  ```typescript
  // Correct
  ChatInterface.tsx        → export function ChatInterface()
  ThreadListSidebar.tsx    → export function ThreadListSidebar()
  ErrorThreadState.tsx     → export function ErrorThreadState()

  // Incorrect
  chatInterface.tsx        // Wrong: camelCase file
  chat-interface.tsx       // Wrong: kebab-case file
  thread_list_sidebar.tsx  // Wrong: snake_case file
  ```

**Functions & Variables:**
- **Format:** `camelCase`, descriptive verbs for functions
- **Functions:** Start with verb (`getThread`, `createUser`, `updateProfile`)
- **Variables:** Descriptive nouns (`threadId`, `currentUser`, `isLoading`)
- **Constants:** `UPPER_SNAKE_CASE` for true constants only
- **Examples:**
  ```typescript
  // Correct
  function getUserData(userId: string) { ... }
  const threadList = await fetchThreads();
  const isLoading = false;
  const MAX_RETRY_ATTEMPTS = 3;

  // Incorrect
  function GetUserData() { ... }      // Wrong: PascalCase function
  function get_user_data() { ... }    // Wrong: snake_case function
  const ThreadList = [];              // Wrong: PascalCase variable (not a component)
  ```

**Types & Interfaces:**
- **Format:** `PascalCase`, descriptive nouns
- **Interfaces:** `I{Name}` or plain name (prefer plain)
- **Types:** Plain `{Name}`
- **Examples:**
  ```typescript
  // Correct
  interface Thread { ... }
  type ThreadStatus = 'active' | 'archived';
  interface CreateThreadParams { ... }

  // Incorrect
  interface thread { ... }            // Wrong: lowercase
  interface IThread { ... }           // Discouraged: I prefix (use plain)
  type thread_status = ...            // Wrong: snake_case
  ```

**File Naming (Non-Components):**
- **Utilities:** `camelCase.ts` (e.g., `helpers.ts`, `logger.ts`)
- **Configuration:** `camelCase.ts` or `kebab-case.ts` (e.g., `tailwind.config.ts`, `next.config.mjs`)
- **Tests:** `{FileName}.test.tsx` or `{FileName}.spec.tsx` (match source file casing)
- **Hooks:** `use{Name}.ts` (e.g., `useAuth.ts`, `useThreads.ts`)
- **Examples:**
  ```typescript
  // Correct
  src / utils / helpers.ts;
  src / utils / logger.ts;
  src / hooks / useAuth.ts;
  src / components / ChatInterface.test.tsx;

  // Incorrect
  src / utils / Helpers.ts; // Wrong: PascalCase utility
  src / hooks / UseAuth.ts; // Wrong: PascalCase hook
  src / components / chat - interface.test.tsx; // Wrong: doesn't match source file
  ```

---

## Structure Patterns

**Project Organization:**

**Component Organization:**
- **Base Components:** `src/components/ui/` - shadcn/ui primitives (Button, Input, Dialog, etc.)
- **Feature Components:** `src/components/{feature}/` - domain-specific (chat/, layout/)
- **Feature Modules:** `src/features/{domain}/` - complete feature domains (auth/, dashboard/, feedback/)
- **Rule:** If component is reusable across features → `/components/{category}/`. If feature-specific → `/features/{domain}/`

**Test Location:**
- **Pattern:** Co-located tests next to source files
- **Format:** `{FileName}.test.tsx` or `{FileName}.spec.tsx`
- **Examples:**
  ```
  src/components/ChatInterface.tsx
  src/components/ChatInterface.test.tsx

  src/utils/helpers.ts
  src/utils/helpers.test.ts
  ```
- **E2E Tests:** Separate `/tests` directory (Playwright)
- **Unit/Integration:** Co-located with source

**Utility Organization:**
- **Shared Utilities:** `src/utils/` - pure functions, helpers (AppConfig, Helpers, Logger)
- **External Integrations:** `src/libs/{service}/` - third-party wrappers (supabase/, dify/, email/)
- **Rule:** If it wraps external service → `/libs/{service}/`. If it's pure utility → `/utils/`

**Configuration Files:**
- **Root Level:** Framework configs (next.config.mjs, tailwind.config.ts, tsconfig.json)
- **src/utils/:** Application configs (AppConfig.ts, env.ts with Zod validation)
- **Rule:** Framework configs at root, app-specific configs in `/utils/`

**Static Assets:**
- **Public Directory:** `/public/assets/{type}/`
  - Images: `/public/assets/images/`
  - Icons: `/public/assets/icons/`
  - Fonts: `/public/assets/fonts/` (if not using next/font)
- **Imported Assets:** Prefer `next/image` and `next/font` over static files

**Route Organization:**
- **Pattern:** Route groups for feature isolation
- **Structure:**
  ```
  app/[locale]/
  ├── (unauth)/          # Public routes (no auth required)
  ├── (auth)/            # Protected routes (auth required)
  │   ├── dashboard/
  │   └── onboarding/
  ├── (chat)/            # Chat feature (isolated, removable)
  └── (admin)/           # Admin routes (isolated, removable)
  ```
- **Rule:** Use route groups `({name})/` to organize related pages without affecting URL structure

---

**File Structure Patterns:**

**API Route Structure:**
```typescript
// app/api/{resource}/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/libs/supabase/server';

// 1. Define validation schema
const createSchema = z.object({
  field: z.string()
});

// 2. GET handler (optional)
export async function GET(request: NextRequest) {
  // 2a. Validate session
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
  }

  // 2b. Business logic
  // ...

  // 2c. Return response
  return NextResponse.json({ data: result }, { status: 200 });
}

// 3. POST handler (optional)
export async function POST(request: NextRequest) {
  // Same pattern: validate session, parse body, validate input, business logic, return response
}
```

**Component Structure:**
```typescript
// src/components/{Feature}Component.tsx
'use client'; // Only if needs interactivity (useState, useEffect, etc.)

import { useState } from 'react';
import { useTranslations } from 'next-intl';

// 1. Define types/interfaces
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// 2. Component definition
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 2a. Hooks (in order: useState, useEffect, custom hooks, useTranslations)
  const [state, setState] = useState<string>('');
  const t = useTranslations('Namespace');

  // 2b. Event handlers
  const handleClick = () => {
    setState('new value');
  };

  // 2c. Render
  return (
    <div>
      <h1>{t('title')}</h1>
      {/* ... */}
    </div>
  );
}
```

**Server Component Pattern:**
```typescript
// app/[locale]/(auth)/dashboard/page.tsx
import { cookies } from 'next/headers';
import { createClient } from '@/libs/supabase/server';
import { ClientComponent } from '@/components/ClientComponent';

// 1. Async server component
export default async function DashboardPage() {
  // 2. Fetch data on server
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: threads } = await supabase.from('threads').select('*');

  // 3. Pass data to client components
  return (
    <div>
      <h1>Dashboard</h1>
      <ClientComponent threads={threads} />
    </div>
  );
}
```

---

## Format Patterns

**API Response Formats:**

**Success Response (Data):**
```typescript
// Single resource
{
  "data": {
    "id": "uuid",
    "field": "value",
    "created_at": "2026-01-05T12:00:00Z"
  }
}

// Collection
{
  "data": [
    { "id": "1", "field": "value" },
    { "id": "2", "field": "value" }
  ]
}

// No content (DELETE success)
// Status 204, empty body
```

**Error Response:**
```typescript
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {  // Optional, dev only
    "field": "validation error details",
    "stack": "stack trace (dev only)"
  }
}

// Standard error codes:
// - AUTH_REQUIRED: Not authenticated
// - FORBIDDEN: Authenticated but not authorized
// - INVALID_REQUEST: Malformed request
// - VALIDATION_ERROR: Input validation failed
// - NOT_FOUND: Resource not found
// - CONFLICT: Resource conflict (duplicate)
// - DB_ERROR: Database operation failed
// - INTERNAL_ERROR: Unexpected server error
```

**Pagination Response:**
```typescript
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

**Data Exchange Formats:**

**JSON Field Naming:**
- **API Requests/Responses:** `camelCase` (JavaScript convention)
- **Database:** `snake_case` (SQL convention)
- **Drizzle ORM:** Automatically maps `snake_case` DB → `camelCase` TypeScript
- **Example:**
  ```typescript
  // Database column: conversation_id
  // TypeScript/API: conversationId

  const thread = await db.select().from(threads).where(eq(threads.id, id));
  // Returns: { id: '...', conversationId: '...', createdAt: Date }

  return NextResponse.json({ data: thread });
  // API returns: { "data": { "id": "...", "conversationId": "...", "createdAt": "..." } }
  ```

**Date/Time Format:**
- **Storage:** PostgreSQL `timestamp` (UTC)
- **API Response:** ISO 8601 strings (`2026-01-05T12:00:00Z`)
- **Frontend Display:** Convert to user's local timezone using `Intl.DateTimeFormat` or `date-fns`
- **Example:**
  ```typescript
  // Database stores: 2026-01-05 12:00:00+00
  // API returns: "2026-01-05T12:00:00Z"
  // Frontend displays: "Jan 5, 2026, 12:00 PM" (user's timezone)
  ```

**Boolean Representation:**
- **API:** `true`/`false` (JSON boolean)
- **Database:** PostgreSQL `boolean` type
- **Query Params:** `"true"`/`"false"` strings (convert to boolean in handler)

**Null Handling:**
- **API:** Use `null` for missing/absent values (not `undefined`)
- **Optional Fields:** Omit from response if not applicable (don't send `null` unless meaningful)
- **Example:**
  ```typescript
  // Correct
  { "title": "My Thread" }               // Optional description omitted
  { "title": "My Thread", "description": null }  // Description explicitly empty

  // Incorrect
  { "title": "My Thread", "description": undefined }  // Wrong: undefined not JSON-serializable
  ```

---

## Communication Patterns

**Analytics Event Naming (PostHog):**

**Format:** `{object}_{action}` - lowercase with underscores
- **Objects:** `user`, `thread`, `feedback`, `onboarding`, `admin`
- **Actions:** `created`, `updated`, `deleted`, `viewed`, `clicked`, `completed`, `failed`
- **Examples:**
  ```typescript
  // Correct
  trackEvent('user_signed_up', { method: 'email' });
  trackEvent('user_signed_in', { method: 'oauth_google' });
  trackEvent('thread_created', { conversation_id: 'abc' });
  trackEvent('onboarding_step_completed', { step: 2 });
  trackEvent('feedback_submitted', { rating: 5 });

  // Incorrect
  trackEvent('UserSignedUp', { ... });      // Wrong: PascalCase
  trackEvent('user-signed-up', { ... });    // Wrong: kebab-case
  trackEvent('signup', { ... });            // Wrong: ambiguous
  ```

**Event Properties:**
- **Format:** `camelCase` for property keys
- **Include:** Relevant context (IDs, counts, statuses, methods)
- **Exclude:** PII (unless PostHog configured for GDPR compliance)
- **Example:**
  ```typescript
  trackEvent('thread_archived', {
    threadId: 'uuid',
    messageCount: 15,
    conversationLength: 'long',
    archiveReason: 'user_action'
  });
  ```

---

**State Management Patterns:**

**Server Components (Preferred):**
- **Pattern:** Fetch data in Server Components, pass as props to Client Components
- **No global state needed** for server-fetched data
- **Example:**
  ```typescript
  // Server Component
  async function ThreadList() {
    const threads = await fetchThreads(); // Direct DB query
    return <ThreadListClient threads={threads} />;
  }

  // Client Component (minimal state)
  'use client';
  function ThreadListClient({ threads }: { threads: Thread[] }) {
    const [filter, setFilter] = useState('all'); // Local UI state only
    const filtered = threads.filter(/* ... */);
    return <div>{/* render */}</div>;
  }
  ```

**Client State (React Hooks):**
- **Local UI State:** `useState`, `useReducer`
- **Forms:** React Hook Form (`useForm`)
- **Side Effects:** `useEffect` (minimal use, prefer Server Components)
- **Immutable Updates:** Always return new objects/arrays (don't mutate)
- **Example:**
  ```typescript
  const [items, setItems] = useState<Item[]>([]);

  // Correct (immutable)
  setItems([...items, newItem]);
  setItems(items.filter(item => item.id !== removeId));

  // Incorrect (mutation)
  items.push(newItem); // Wrong: mutates array
  setItems(items);
  ```

**No Global State Libraries:**
- **Decision:** Avoid Redux, Zustand, Jotai unless absolutely necessary
- **Rationale:** Server Components eliminate most global state needs
- **Exceptions:** Truly global UI state (theme, sidebar open/closed) - use React Context sparingly

---

## Process Patterns

**Error Handling Patterns:**

**Error Boundaries:**
- **Placement:**
  - **App Level:** `app/error.tsx` - Catches all route errors
  - **Route Level:** `app/[locale]/(auth)/error.tsx` - Catches errors in auth routes
  - **Component Level:** Wrap critical components with `<ErrorBoundary>`
- **Pattern:**
  ```typescript
  // app/error.tsx
  'use client';

  export default function Error({
    error,
    reset
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }) {
    return (
      <div>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </div>
    );
  }
  ```

**API Error Handling:**
- **Pattern:** Try-catch with consistent error responses
  ```typescript
  export async function POST(request: NextRequest) {
    try {
      // Validation errors
      const body = await request.json();
      const validated = schema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json({
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validated.error.issues
        }, { status: 400 });
      }

      // Business logic
      const result = await doSomething();
      return NextResponse.json({ data: result }, { status: 200 });
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }, { status: 500 });
    }
  }
  ```

**Client-Side Error Handling:**
- **Pattern:** Try-catch with user-friendly messages
  ```typescript
  async function handleSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/threads', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      const result = await response.json();
      // Handle success
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }
  ```

**Logging Patterns:**
- **Development:** `console.log`, `console.error` (readable formatting)
- **Production:** Structured logging with Pino (JSON format)
- **Sentry:** Automatic error capture for exceptions
- **Rule:** Log errors with context, not just messages
  ```typescript
  // Correct
  console.error('Failed to create thread', { userId, error: error.message });

  // Incorrect
  console.error('Error'); // Wrong: no context
  ```

---

**Loading State Patterns:**

**Form Loading (React Hook Form):**
- **Pattern:** Use `isSubmitting` from form state
  ```typescript
  const form = useForm();
  const { isSubmitting } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Button disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
  ```

**API Call Loading:**
- **Pattern:** Local `useState` for loading flag
  ```typescript
  const [isLoading, setIsLoading] = useState(false);

  async function fetchData() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setData(data);
    } finally {
      setIsLoading(false); // Always set false in finally block
    }
  }

  return isLoading ? <Skeleton /> : <DataView data={data} />;
  ```

**Server Component Loading (Suspense):**
- **Pattern:** Use React Suspense with loading.tsx
  ```typescript
  // app/[locale]/(auth)/dashboard/loading.tsx
  export default function Loading() {
    return <DashboardSkeleton />;
  }

  // app/[locale]/(auth)/dashboard/page.tsx (Server Component)
  async function DashboardPage() {
    const data = await fetchData(); // Suspense automatically shows loading.tsx
    return <Dashboard data={data} />;
  }
  ```

**Loading UI Standards:**
- **Skeletons:** Use for content loading (shimmer effect)
- **Spinners:** Use for form submission, button actions
- **Progress Bars:** Use for multi-step processes (onboarding)
- **Rule:** Match loading state to content shape (skeleton) or action type (spinner)

---

**Form Validation Patterns:**

**Validation Timing:**
- **On Change:** For fields that need instant feedback (password strength, username availability)
- **On Blur:** Default for most fields (validate after user leaves field)
- **On Submit:** Final validation before API call (always validate)
- **Pattern:**
  ```typescript
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Default: validate on blur
    reValidateMode: 'onChange' // Re-validate on change after first error
  });
  ```

**Validation Display:**
- **Inline Errors:** Show below field (red text)
- **Toast Notifications:** For server-side errors (API failures)
- **Error Boundaries:** For unexpected component errors
- **Pattern:**
  ```typescript
  <FormField
    control={form.control}
    name="email"
    render={({ field, fieldState }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        {fieldState.error && (
          <FormMessage>{fieldState.error.message}</FormMessage>
        )}
      </FormItem>
    )}
  />
  ```

---

## Enforcement Guidelines

**All AI Agents MUST:**

1. **Follow naming conventions exactly** - Database `snake_case`, Code `camelCase`, Components `PascalCase`, Files match component names
2. **Use co-located tests** - `Component.test.tsx` next to `Component.tsx`, not in separate `/tests` directory (except E2E)
3. **Match API response format** - `{data: ...}` for success, `{error, code, details}` for errors
4. **Use React Hook Form + Zod** for all forms - No uncontrolled forms, no other form libraries
5. **Validate sessions in all API routes** - No unprotected API endpoints, always check `supabase.auth.getUser()`
6. **Use translation keys for all UI text** - No hardcoded strings, use `useTranslations('Namespace')`
7. **Follow Server Component pattern** - Fetch data on server, pass to Client Components, minimize client state
8. **Use route groups for feature isolation** - `(chat)`, `(admin)` can be removed without affecting other routes
9. **Track analytics events** - All user actions must call `trackEvent` with consistent naming
10. **Handle loading/error states** - Every async operation needs loading UI and error handling

**Pattern Enforcement:**

**Pre-Commit Checks:**
- ESLint enforces code style (semicolons, quotes, spacing)
- TypeScript strict mode enforces type safety
- Prettier enforces consistent formatting

**Code Review Checklist:**
- [ ] Component names match PascalCase, file names match component names
- [ ] API routes follow `/api/{resource}` pattern, lowercase plural
- [ ] Database tables use `snake_case`, TypeScript uses `camelCase`
- [ ] Tests are co-located with source files
- [ ] API responses match `{data: ...}` or `{error, code}` format
- [ ] Forms use React Hook Form + Zod validation
- [ ] All UI text uses translation keys (no hardcoded strings)
- [ ] Analytics events tracked with `{object}_{action}` format
- [ ] Loading states and error handling present
- [ ] Sessions validated in protected API routes

**Pattern Violations:**
- **Report:** Document pattern violations in PR reviews
- **Fix:** Agent updates code to match patterns before merge
- **Update:** If pattern needs changing, update this architecture doc first, then implement

**Updating Patterns:**
- Patterns can evolve, but changes must be documented in this architecture document
- Backward compatibility: If changing pattern breaks existing code, create migration plan
- All agents must be informed of pattern updates via updated architecture doc

---

## Pattern Examples

**Good Examples:**

**Creating New API Endpoint:**
```typescript
// ✅ Correct: Follows all patterns
// app/api/feedback/route.ts

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { trackEvent } from '@/libs/posthog/client';
import { createClient } from '@/libs/supabase/server';
import { feedback } from '@/models/Schema';

// Validation schema (Zod)
const createFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  page: z.string()
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validate session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validated = createFeedbackSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validated.error.issues
        },
        { status: 400 }
      );
    }

    // 3. Business logic
    const [newFeedback] = await db.insert(feedback).values({
      user_id: user.id,
      rating: validated.data.rating,
      comment: validated.data.comment,
      page: validated.data.page
    }).returning();

    // 4. Track analytics
    trackEvent('feedback_submitted', {
      rating: validated.data.rating,
      page: validated.data.page
    });

    // 5. Return success response
    return NextResponse.json({ data: newFeedback }, { status: 201 });
  } catch (error) {
    console.error('Failed to create feedback:', { error, userId: user?.id });
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

**Creating New Component:**
```typescript
// ✅ Correct: Follows all patterns
// src/components/feedback/FeedbackWidget.tsx

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Validation schema (reuse from API)
const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export function FeedbackWidget() {
  const t = useTranslations('Feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 5, comment: '' }
  });

  async function onSubmit(data: FeedbackFormData) {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          page: window.location.pathname
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      toast({ title: t('success'), description: t('thankYou') });
      form.reset();

    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
```

**Anti-Patterns (Avoid These):**

**❌ Inconsistent Naming:**
```typescript
// ❌ Wrong: Mixed naming conventions
export const UserProfile = schema.table('user_profile', { ... }); // PascalCase table name
const user_id = await getUserId(); // snake_case variable
function Create_Thread() { ... } // Mixed case function

// ✅ Correct:
export const userProfiles = schema.table('user_profiles', { ... }); // snake_case table, camelCase var
const userId = await getUserId(); // camelCase variable
function createThread() { ... } // camelCase function
```

**❌ Non-Standard API Response:**
```typescript
// ❌ Wrong: Inconsistent response format
return NextResponse.json({ thread: newThread }); // Direct key, not wrapped in "data"
return NextResponse.json({ message: 'Error' }); // Wrong error format

// ✅ Correct:
return NextResponse.json({ data: newThread });
return NextResponse.json({ error: 'Error message', code: 'ERROR_CODE' }, { status: 400 });
```

**❌ Hardcoded Strings:**
```typescript
// ❌ Wrong: Hardcoded UI text
<Button>Submit</Button>
<h1>Welcome to Dashboard</h1>

// ✅ Correct: Translation keys
<Button>{t('submit')}</Button>
<h1>{t('welcomeToDashboard')}</h1>
```

**❌ Missing Session Validation:**
```typescript
// ❌ Wrong: Unprotected API route
export async function POST(request: NextRequest) {
  const data = await db.insert(...); // No auth check!
  return NextResponse.json({ data });
}

// ✅ Correct: Validate session first
export async function POST(request: NextRequest) {
  const supabase = createClient(await cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
  }
  // Then proceed with business logic
}
```

**❌ Wrong Test Location:**
```typescript
// ❌ Wrong: Tests in separate directory
tests
/ components
/ ChatInterface.test.tsx;

// ✅ Correct: Co-located tests
src
/ components
/ ChatInterface.tsx;
ChatInterface.test.tsx;
```
