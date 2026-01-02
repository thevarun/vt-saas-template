# Development Context

## Relevant Existing Code

**Authentication & Session Management:**
- **`src/middleware.ts:1-50`** - Auth middleware that validates Supabase sessions
  - Pattern: All protected routes checked before request reaches handler
  - Relevant: Thread APIs will inherit this protection automatically

- **`src/libs/supabase/server.ts`** - Server-side Supabase client creation
  - Used in: All API routes that need to validate user identity
  - Pattern: `const supabase = createClient(await cookies())`

- **`src/libs/supabase/client.ts`** - Client-side Supabase client
  - Used in: Client components that need to access user session
  - Pattern: `const supabase = createClient()`

**Current Chat Implementation:**
- **`src/app/api/chat/route.ts:28-140`** - Existing chat API endpoint
  - Already handles `conversationId` parameter (line 48)
  - Already validates user session (lines 30-44)
  - Returns SSE stream from Dify (lines 102-117)
  - **Modification needed:** Add thread creation after first Dify response

- **`src/libs/dify/client.ts:33-81`** - Dify API client wrapper
  - Method: `chatMessages(request: DifyChatRequest)`
  - Returns: `ReadableStream` for streaming mode
  - **No changes needed** - works as-is

- **`src/components/chat/ChatInterface.tsx`** - Current chat UI
  - Uses Assistant UI components (already integrated)
  - **Will be replaced** with ThreadPrimitive.Root pattern

**Database Schema & ORM:**
- **`src/models/Schema.ts`** - Drizzle ORM schema definitions
  - Pattern to follow: See existing table definitions
  - **Modification needed:** Add `threads` table to `health_companion` schema

- **`src/libs/DB.ts`** - Database connection setup
  - Drizzle client creation with auto-migrations
  - **Reference:** Connection pattern for thread queries

**shadcn/ui Components (already available):**
- **`src/components/ui/button.tsx`** - Button component
- **`src/components/ui/sheet.tsx`** - Sheet component (for mobile sidebar)
- **`src/components/ui/input.tsx`** - Input component (thread title editing)
- **`src/components/ui/skeleton.tsx`** - Loading skeleton
- **`src/components/ui/tooltip.tsx`** - Tooltip component

## Dependencies

**Framework/Libraries (Already Installed):**

| Package | Version | Purpose | Location |
|---------|---------|---------|----------|
| **next** | 14.2.25 | App Router, routing, API routes | Core framework |
| **react** | 18.3.1 | Component rendering | Core framework |
| **typescript** | 5.6.3 | Type safety | Dev tooling |
| **@assistant-ui/react** | 0.11.47 | Thread list, chat components | **CRITICAL** - Main feature |
| **@assistant-ui/react-markdown** | 0.11.6 | Message markdown rendering | Chat UI |
| **@supabase/supabase-js** | 2.86.0 | Supabase client | Auth + DB |
| **@supabase/ssr** | 0.1.0 | SSR auth support | Server components |
| **drizzle-orm** | 0.35.1 | Database ORM | Data layer |
| **pg** | 8.13.0 | PostgreSQL driver | Database connection |
| **@electric-sql/pglite** | 0.2.12 | Local dev database | Development |
| **zod** | 3.23.8 | Schema validation | API validation |
| **tailwindcss** | 3.4.14 | Styling | UI styling |
| **@radix-ui/*** | Multiple | UI primitives (shadcn/ui base) | Components |
| **lucide-react** | 0.453.0 | Icons | UI icons |

**New Dependencies to Install:**

| Package | Version | Purpose | Command |
|---------|---------|---------|---------|
| **@assistant-ui/react-devtools** | latest | Runtime debugging | `npm install @assistant-ui/react-devtools` |

**Internal Modules:**

```typescript
// Authentication
import { createClient } from '@/libs/supabase/server' // Server-side auth
import { createClient } from '@/libs/supabase/client' // Client-side auth

// Database
import { db } from '@/libs/DB' // Drizzle database client
import { threads } from '@/models/Schema' // Thread table schema (NEW)

// AI Integration
import { createDifyClient } from '@/libs/dify/client' // Dify API client
import type { DifyChatRequest, DifyChatResponse } from '@/libs/dify/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Assistant UI
import { ThreadListPrimitive } from '@/assistant-ui/react'
import { ThreadPrimitive } from '@assistant-ui/react'
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react'
import { DevToolsModal } from '@assistant-ui/react-devtools' // NEW

// Utilities
import { logger } from '@/libs/Logger' // Pino logger
```

## Configuration Changes

**Environment Variables (.env.local):**

No new environment variables needed. Existing config sufficient:

```bash
# Existing - No changes
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For RLS policy management
DIFY_API_URL=...
DIFY_API_KEY=...
DATABASE_URL=...  # Supabase PostgreSQL connection
```

**package.json Updates:**

```json
{
  "dependencies": {
    "@assistant-ui/react-devtools": "^0.1.0"  // ADD THIS
  }
}
```

**Database Migration (Drizzle):**

```typescript
// src/models/Schema.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, pgSchema } from 'drizzle-orm/pg-core';

// Create schema
export const healthCompanionSchema = pgSchema('health_companion');

// Threads table
export const threads = healthCompanionSchema.table('threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  conversationId: varchar('conversation_id', { length: 128 }).notNull().unique(),
  title: varchar('title', { length: 255 }),
  lastMessagePreview: text('last_message_preview'),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Indexes will be in migration SQL
```

**Generate migration:**
```bash
npm run db:generate
# Creates migration file in migrations/
```

**Supabase Configuration (Manual SQL execution):**

Execute in Supabase SQL Editor to set up schema and RLS:

```sql
-- Create schema (one-time)
CREATE SCHEMA IF NOT EXISTS health_companion;

-- Run Drizzle migration (creates table)
-- Then add RLS policies:

ALTER TABLE health_companion.threads ENABLE ROW LEVEL SECURITY;

-- RLS policies (as shown in Source Tree Changes section)
-- ...
```

**Next.js Configuration:**

No changes needed to `next.config.mjs`. Existing configuration supports:
- App Router ✅
- API routes ✅
- Server components ✅
- Environment variables ✅

**TypeScript Configuration:**

No changes needed to `tsconfig.json`. Existing configuration includes:
- Strict mode ✅
- Path aliases (`@/*`) ✅
- JSX support ✅

**Tailwind Configuration:**

No changes needed to `tailwind.config.ts`. Existing configuration includes:
- shadcn/ui theme ✅
- Radix UI styles ✅
- Custom colors/utilities ✅

## Existing Conventions (Brownfield)

Based on codebase analysis and ESLint configuration:

**Code Style:**
- ✅ **No semicolons** (Antfu ESLint config enforces this)
- ✅ **Single quotes** for strings in JSX attributes
- ✅ **2-space indentation** (EditorConfig + Prettier)
- ✅ **Trailing commas** in multi-line objects/arrays
- ✅ **Const over let** where possible

**Component Structure:**
```typescript
// Server Component (default - no directive)
export default function ThreadPage() {
  // Server-side data fetching
  return <Component />
}

// Client Component (use client directive)
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [state, setState] = useState()
  return <div>...</div>
}
```

**Error Handling:**
```typescript
// API routes
try {
  // Operation
} catch (error: any) {
  logger.error({ error }, 'Context message')
  return NextResponse.json(
    { error: 'User message', code: 'ERROR_CODE' },
    { status: 500 }
  )
}

// Client components
try {
  // Operation
} catch (error) {
  toast.error('User-friendly message')
  logger.error({ error }, 'Context')
}
```

**Naming Conventions:**
- **Components:** PascalCase (`ThreadListSidebar.tsx`)
- **Utilities:** camelCase (`formatThreadTitle.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_THREAD_TITLE_LENGTH`)
- **Types/Interfaces:** PascalCase (`Thread`, `ThreadMetadata`)
- **API routes:** lowercase (`route.ts`)

**Import Order:**
1. React/Next.js core
2. External packages
3. Internal `@/` imports (sorted alphabetically)
4. Relative imports
5. Type imports last

**File Organization:**
- One component per file
- Co-locate tests (`.test.tsx` next to `.tsx`)
- Group related components in directories
- Shared types in `types/` directory

## Test Framework & Standards

**Test Stack:**

| Tool | Version | Purpose | Config File |
|------|---------|---------|-------------|
| **Vitest** | 2.1.9 | Unit testing | `vitest.config.mts` |
| **@testing-library/react** | 16.0.1 | Component testing | - |
| **Playwright** | 1.48.1 | E2E testing | `playwright.config.ts` |
| **@storybook/react** | 8.6.14 | Component development | `.storybook/` |

**Test Patterns (from existing codebase):**

**Unit Test Pattern:**
```typescript
// ThreadList.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThreadListSidebar } from './ThreadListSidebar'

describe('ThreadListSidebar', () => {
  it('renders thread list', () => {
    render(<ThreadListSidebar threads={mockThreads} />)
    expect(screen.getByText('New Thread')).toBeInTheDocument()
  })
})
```

**E2E Test Pattern:**
```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test'

test('user can create and switch threads', async ({ page }) => {
  await page.goto('/chat')
  await page.click('text=New Thread')
  await page.fill('[placeholder="Send a message"]', 'Hello')
  await page.press('[placeholder="Send a message"]', 'Enter')
  await expect(page.locator('text=Hello')).toBeVisible()
  // Verify thread appears in sidebar
  await expect(page.locator('.thread-list')).toContainText('New Conversation')
})
```

**Test Coverage Standards (MVP-Adjusted):**

| Layer | Coverage Goal | Scope |
|-------|---------------|-------|
| **API Routes** | Integration tests | Happy path + auth validation |
| **Components** | Unit tests | Critical interactions only |
| **E2E** | Happy paths | Core user flows (create thread, send message, switch threads) |
| **Visual** | N/A (MVP) | Skipped for MVP |

**Test Commands:**
```bash
npm test                    # Run unit tests (Vitest)
npm run test:e2e           # Run E2E tests (Playwright)
npm run test -- --watch    # Watch mode for development
```

---
