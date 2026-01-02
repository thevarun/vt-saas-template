# Implementation Details

## Source Tree Changes

**Files to CREATE:**

```
src/
├── app/[locale]/(auth)/
│   └── chat/                           # NEW - Chat route group
│       ├── layout.tsx                  # NEW - AppShell with sidebar
│       ├── page.tsx                    # NEW - Empty state / New thread view
│       └── [threadId]/                 # NEW - Dynamic thread route
│           └── page.tsx                # NEW - Thread-specific view
│
├── components/
│   └── chat/
│       ├── AppShell.tsx                # NEW - Layout wrapper with sidebar
│       ├── ThreadListSidebar.tsx       # NEW - Thread list component
│       ├── ThreadItem.tsx              # NEW - Individual thread item
│       ├── EmptyThreadState.tsx        # NEW - Empty state component
│       └── ThreadTitleEditor.tsx       # NEW - Inline title editing
│
├── app/api/
│   └── threads/
│       ├── route.ts                    # NEW - GET (list), POST (create)
│       └── [id]/
│           ├── route.ts                # NEW - PATCH (update), DELETE
│           └── archive/
│               └── route.ts            # NEW - PATCH (archive/unarchive)
│
├── models/
│   └── Schema.ts                       # MODIFY - Add threads table
│
└── libs/
    └── supabase/
        └── threads.ts                  # NEW - Thread queries helper
```

**Files to MODIFY:**

```
src/
├── app/api/chat/route.ts               # MODIFY - Add thread creation after first message
├── components/chat/ChatInterface.tsx   # MODIFY - Replace with Thread component
└── app/[locale]/(chat)/chat/           # DELETE - Old chat route (replaced)
```

**Database Changes:**

```sql
-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS health_companion;

-- Create threads table in new schema
CREATE TABLE health_companion.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id VARCHAR(128) NOT NULL UNIQUE,
  title VARCHAR(255),
  last_message_preview TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_threads_user_id ON health_companion.threads(user_id);
CREATE INDEX idx_threads_conversation_id ON health_companion.threads(conversation_id);
CREATE INDEX idx_threads_user_archived ON health_companion.threads(user_id, archived);

-- RLS policies
ALTER TABLE health_companion.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own threads"
  ON health_companion.threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own threads"
  ON health_companion.threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threads"
  ON health_companion.threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads"
  ON health_companion.threads FOR DELETE
  USING (auth.uid() = user_id);
```

## Technical Approach

**Architecture Pattern: Component-Level State with Next.js Dynamic Routing**

Based on architectural review, we're using standard Next.js routing with client-side state management for UI chrome. No parallel routes - keeping it simple.

**Component Architecture:**

```
┌─────────────────────────────────────────────────┐
│  AppShell (Client Component)                    │
│  ┌──────────────┬──────────────────────────┐   │
│  │   Sidebar    │   Main Content           │   │
│  │  (250px)     │   (Flex 1)               │   │
│  │              │                          │   │
│  │ ThreadList   │  {children}              │   │
│  │ Primitive    │  - /chat → Empty         │   │
│  │              │  - /chat/[id] → Thread   │   │
│  │              │                          │   │
│  └──────────────┴──────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Data Flow:**

1. **Thread List Loading:**
   - `AppShell` fetches threads via `GET /api/threads` on mount
   - Threads stored in component state + passed to ThreadList
   - ThreadList renders using `ThreadListPrimitive.Items`

2. **Thread Creation (Lazy):**
   - User clicks "New Thread" → Navigate to `/chat`
   - User types first message → POST to `/api/chat` (no conversation_id)
   - Dify responds with SSE stream including conversation_id
   - Client captures conversation_id → POST `/api/threads`
   - New thread appears in sidebar, route updates to `/chat/[threadId]`

3. **Thread Switching:**
   - User clicks thread in sidebar
   - `router.push(/chat/[threadId])`
   - Next.js loads thread page with Thread component
   - Assistant UI runtime fetches messages for that thread

4. **Thread Updates:**
   - New message sent → PATCH `/api/threads/[id]` updates `last_message_preview`, `updated_at`
   - Title edit → PATCH `/api/threads/[id]` with new title
   - Archive → PATCH `/api/threads/[id]/archive`

**State Management:**

- **Sidebar State:** React context (open/closed, mobile overlay)
- **Thread List:** Component state (fetched from API, updated on mutations)
- **Active Thread:** Next.js router params (`[threadId]`)
- **Chat State:** Assistant UI runtime (messages, composer, streaming)

**Assistant UI Integration:**

```typescript
// Thread runtime configuration
const runtime = useLocalRuntime(adapter);

const adapter = {
  async sendMessage({ message, threadId }) {
    // POST to /api/chat with conversation_id
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationId: thread.conversation_id
      })
    });
    // Handle SSE stream
    // Update thread metadata after response
  }
}
```

**Component Reuse Strategy:**

✅ **Reuse from Assistant UI:**
- `ThreadListPrimitive.Root` - Thread list container
- `ThreadListPrimitive.New` - New thread button
- `ThreadListPrimitive.Items` - Thread item renderer
- `ThreadListItemPrimitive` - Individual thread item
- `ThreadPrimitive.Root` - Chat interface root
- `ThreadPrimitive.Messages` - Message rendering
- `ThreadPrimitive.Viewport` - Auto-scrolling viewport
- `AssistantRuntimeProvider` - Runtime context

✅ **Reuse from shadcn/ui:**
- `Sheet` - Mobile sidebar overlay
- `Button` - Actions (New Thread, Archive)
- `Tooltip` - Collapsed sidebar hints
- `Input` - Thread title editing
- `Skeleton` - Loading states

✅ **Reuse from Existing Codebase:**
- Supabase client (`src/libs/supabase/server.ts`, `client.ts`)
- Dify client (`src/libs/dify/client.ts`)
- Existing auth middleware (no changes needed)

**Technology Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Layout Pattern** | Component state + Next.js routing | Simpler than parallel routes, standard pattern |
| **Thread List Component** | Assistant UI ThreadListPrimitive | Battle-tested, matches UX expectations |
| **Chat Component** | Assistant UI ThreadPrimitive | Handles streaming, messages, composition |
| **Sidebar Component** | shadcn/ui Sheet | Already in codebase, responsive built-in |
| **Thread Persistence** | After first message | Wait for Dify conversation_id |
| **Database Schema** | Dedicated `health_companion` schema | Isolate from other Supabase projects |
| **ORM** | Drizzle ORM (existing) | Type-safe, migration support |
| **Devtools** | @assistant-ui/react-devtools | Zero-cost debugging for runtime state |

## Existing Patterns to Follow

**Code Style (from ESLint config):**
- ✅ No semicolons (Antfu config)
- ✅ Single quotes for strings
- ✅ 2-space indentation
- ✅ Trailing commas in objects/arrays

**Component Patterns:**
```typescript
// Server Component (default)
export default function ThreadPage({ params }: { params: { threadId: string } }) {
  // Fetch data server-side
  return <ThreadView threadId={params.threadId} />;
}

// Client Component (interactive)
'use client';
export function ThreadListSidebar() {
  const [threads, setThreads] = useState<Thread[]>([]);
  // Component logic
}
```

**API Route Pattern:**
```typescript
// src/app/api/threads/route.ts
export async function GET(request: NextRequest): Promise<Response> {
  // Validate auth
  const { user } = await validateAuth();

  // Query database
  const threads = await db.query...

  // Return JSON
  return NextResponse.json(threads);
}
```

**File Naming:**
- Components: PascalCase (`ThreadListSidebar.tsx`)
- Utilities: camelCase (`threadHelpers.ts`)
- Routes: lowercase (`route.ts`, `page.tsx`)

**Import Organization:**
```typescript
// 1. External packages
import { useState } from 'react';
import { NextRequest } from 'next/server';

// 2. Internal absolute imports (@/)
import { createClient } from '@/libs/supabase/server';
import { Button } from '@/components/ui/button';

// 3. Relative imports
import { ThreadItem } from './ThreadItem';
```

**Error Handling Pattern:**
```typescript
try {
  // Operation
} catch (error) {
  logger.error({ error }, 'Operation failed');
  return NextResponse.json(
    { error: 'User-friendly message', code: 'ERROR_CODE' },
    { status: 500 }
  );
}
```

## Integration Points

**Internal Integration Points:**

1. **Supabase Authentication**
   - Location: `src/middleware.ts`, `src/libs/supabase/`
   - Integration: Thread APIs validate user via Supabase session
   - Pattern: All `/api/threads/*` endpoints call `createClient(cookies()).auth.getUser()`

2. **Dify AI Service**
   - Location: `src/libs/dify/client.ts`, `src/app/api/chat/route.ts`
   - Integration: Capture `conversation_id` from Dify response to create thread
   - Pattern: SSE stream includes metadata with conversation_id

3. **Database Layer**
   - Location: `src/libs/DB.ts`, `src/models/Schema.ts`
   - Integration: New thread queries via Drizzle ORM
   - Pattern: Type-safe queries with auto-migrations

4. **Assistant UI Runtime**
   - Location: New `ChatInterface.tsx` using `@assistant-ui/react`
   - Integration: Runtime adapter sends messages via `/api/chat`
   - Pattern: Runtime manages thread state, adapter handles persistence

**External Integration Points:**

1. **Dify API** (External Service)
   - Endpoint: `https://api.dify.ai/v1/chat-messages`
   - Purpose: AI chat responses with streaming
   - Authentication: API key (server-side only)
   - Data Flow: User message → `/api/chat` proxy → Dify → SSE stream → Client

2. **Supabase Database** (External Service)
   - Purpose: PostgreSQL database hosting
   - Schema: New `health_companion` schema for thread storage
   - Authentication: Service role key + RLS policies
   - Data Flow: API routes → Drizzle ORM → Supabase PostgreSQL

**API Dependencies:**

```typescript
// Thread API depends on:
- Supabase Auth (user validation)
- Drizzle ORM (database queries)
- Zod (request validation)

// Chat API depends on:
- Supabase Auth (user validation)
- Dify Client (AI responses)
- Thread API (create thread after first message)
```

**Component Dependencies:**

```typescript
// ThreadListSidebar depends on:
- @assistant-ui/react (ThreadListPrimitive)
- shadcn/ui Sheet (mobile overlay)
- Next.js router (thread navigation)
- /api/threads (fetch thread list)

// ChatInterface depends on:
- @assistant-ui/react (ThreadPrimitive, runtime)
- /api/chat (send messages)
- /api/threads (update metadata)
```

---
