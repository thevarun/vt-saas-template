# HealthCompanion - Technical Specification

**Author:** Varun
**Date:** 2024-12-26
**Project Level:** Quick Flow (Brownfield)
**Change Type:** Feature Enhancement
**Development Context:** Multi-threaded Chat Interface + Dashboard Redesign

---

## Context

### Available Documents

**Brownfield Project Documentation:**
Successfully loaded comprehensive project documentation via INDEX_GUIDED strategy:

- ✅ **index.md** - Project documentation index with navigation
- ✅ **project-overview.md** - High-level summary, purpose, tech stack, and getting started
- ✅ **architecture.md** - Complete system architecture including tech stack, patterns, security, deployment
- ✅ **source-tree-analysis.md** - Annotated directory structure with critical paths and conventions
- ✅ **development-guide.md** - Development setup, commands, testing, git workflow, troubleshooting

**Product Brief & Research:**
- ○ No product brief files found
- ○ No research documents found

This brownfield project has extensive existing documentation covering architecture, patterns, and development workflows - providing solid foundation for implementation.

### Project Stack

**Framework & Runtime:**
- **Next.js** 14.2.25 - React framework with App Router, SSR/SSG capabilities
- **React** 18.3.1 - UI library for component rendering
- **Node.js** 20+ - Runtime environment
- **TypeScript** 5.6.3 - Type-safe development with strict mode

**Frontend Stack:**
- **Tailwind CSS** 3.4.14 - Utility-first CSS framework
- **Radix UI** (multiple packages) - Accessible component primitives
- **shadcn/ui** - Component library built on Radix (copied into codebase)
- **Lucide React** 0.453.0 - Icon library
- **next-themes** 0.3.0 - Dark mode support
- **Assistant UI** 0.11.47 - Chat interface with streaming support (CRITICAL for this feature)
- **@assistant-ui/react-markdown** 0.11.6 - Markdown rendering in chat

**Backend & Data:**
- **PostgreSQL** - Production database (via Supabase)
- **Drizzle ORM** 0.35.1 - Type-safe database queries and schema management
- **PGlite** 0.2.12 - Embedded PostgreSQL for local development
- **Supabase** 2.86.0 - Authentication provider and database hosting
- **@supabase/ssr** 0.1.0 - Server-side rendering support for auth

**AI Integration:**
- **Dify API** (custom) - Chat AI service for health coaching
- Custom Dify client wrapper in `src/libs/dify/client.ts`
- Proxy pattern via `/api/chat` to keep API key server-side

**Development Tools:**
- **Vitest** 2.1.9 - Unit testing framework with React Testing Library
- **Playwright** 1.48.1 - End-to-end testing
- **ESLint** 8.57.1 with **@antfu/eslint-config** 2.27.3 - Linting (no semicolons, single quotes)
- **Prettier** - Code formatting (integrated with ESLint)
- **Husky** 9.1.6 - Git hooks for pre-commit linting
- **Commitizen** 4.3.1 - Conventional commits

**Monitoring & Logging:**
- **Sentry** 8.34.0 - Error tracking and monitoring
- **Pino** 9.5.0 - Structured logging
- **@logtail/pino** 0.5.2 - Log aggregation
- **Checkly** 4.9.0 - Uptime and performance monitoring

**Internationalization:**
- **next-intl** 3.21.1 - i18n support for English, Hindi, Bengali

### Existing Codebase Structure

**Architecture Pattern:** Next.js App Router with Serverless Functions

**Directory Organization:**
```
src/
├── app/[locale]/              # App Router with i18n
│   ├── (unauth)/              # Public pages (landing)
│   ├── (auth)/                # Protected pages
│   │   ├── (center)/          # Centered auth pages (sign-in, sign-up)
│   │   └── dashboard/         # Dashboard (WILL BE MODIFIED)
│   ├── (chat)/
│   │   └── chat/              # Current chat page (WILL BE REPLACED)
│   └── api/
│       └── chat/              # Dify proxy endpoint (WILL BE MODIFIED)
├── components/                # Reusable React components
│   ├── ui/                    # shadcn/ui primitives (Button, Input, etc.)
│   └── chat/                  # Chat-specific components (WILL BE EXPANDED)
├── features/                  # Feature modules
│   ├── landing/
│   ├── auth/
│   └── dashboard/             # Dashboard features (WILL BE ENHANCED)
├── libs/                      # Third-party integrations
│   ├── supabase/              # Supabase client/server/middleware
│   ├── dify/                  # Dify AI client
│   ├── DB.ts                  # Database connection (Drizzle)
│   └── Env.ts                 # Environment validation
├── models/
│   └── Schema.ts              # Drizzle ORM schema (WILL BE MODIFIED)
├── locales/                   # i18n translations (en, hi, bn)
├── middleware.ts              # Auth + i18n middleware
└── utils/                     # Utility functions
```

**Key Integration Points:**
- **Authentication:** Middleware (`src/middleware.ts`) handles session refresh and route protection
- **Database:** Drizzle ORM with auto-migrations on startup
- **API Routes:** Serverless functions in `app/api/`
- **Chat:** Current implementation at `app/[locale]/(chat)/chat/` using Assistant UI
- **Supabase Database:** Shared across multiple projects (requires dedicated schema)

**Existing Code Patterns:**
- File-system based routing via App Router
- Server Components by default, Client Components with `'use client'` directive
- Absolute imports with `@/` prefix (configured in tsconfig.json)
- Component files use PascalCase, utilities use camelCase
- API routes export named HTTP method handlers (GET, POST, etc.)
- Type safety enforced with TypeScript strict mode

**Current Chat Implementation:**
- Location: `src/app/[locale]/(chat)/chat/page.tsx`
- Uses Assistant UI `@assistant-ui/react` for chat interface
- Proxies to Dify API via `/api/chat` endpoint
- Already accepts `conversationId` parameter (optional)
- Current limitation: Single conversation only, no thread management

**Database Schema Location:**
- **File:** `src/models/Schema.ts`
- **ORM:** Drizzle ORM with PostgreSQL
- **Migrations:** Auto-applied on app start (or manual via `npm run db:migrate`)
- **Current State:** Minimal schema, primarily relies on Supabase Auth for user management

---

## Implementation Details

### Source Tree Changes

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

### Technical Approach

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

### Existing Patterns to Follow

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

### Integration Points

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

## The Change

### Problem Statement

**Current Limitations:**
HealthCompanion users currently face significant limitations in their chat experience:

1. **Single Conversation Constraint:** Users can only maintain one active chat conversation. Starting a new health-related discussion overwrites or continues the previous conversation, making it impossible to organize different topics (e.g., nutrition vs. fitness vs. mental health) separately.

2. **No Conversation History:** There's no way to revisit previous conversations or reference past health discussions. Users lose context and continuity across sessions.

3. **Lack of Organization:** Users cannot categorize or manage multiple health topics, leading to confusion when switching between different health concerns.

4. **Basic Dashboard Layout:** The current dashboard layout doesn't provide an intuitive navigation structure or modern UX patterns expected in contemporary SaaS applications.

**User Impact:**
- Health discussions get mixed together, reducing clarity
- Users cannot track progress across different health goals
- No way to archive or organize past conversations
- Poor user experience compared to modern chat applications (ChatGPT, Claude, etc.)

**Technical Debt:**
- Current chat implementation doesn't leverage full capabilities of Assistant UI library (v0.11.47) which supports multi-threaded conversations
- No database persistence for conversation threads
- Missing thread management infrastructure

### Proposed Solution

**Multi-Threaded Chat System with Modern Dashboard:**

Transform HealthCompanion into a multi-threaded conversation platform with a professional sidebar-based layout, enabling users to:

1. **Create Unlimited Conversation Threads**
   - Each thread maintains independent conversation history with Dify AI
   - User-editable thread titles for easy identification
   - Archive old threads to keep workspace clean

2. **Thread List Sidebar**
   - Left sidebar displays all active threads (inspired by ChatGPT/Claude UX)
   - "New Thread" button to start fresh conversations
   - Visual indicators for active thread
   - Quick thread switching without page reload
   - Archive functionality for completed conversations

3. **Enhanced Chat Interface**
   - Right panel shows selected thread's conversation
   - Leverages Assistant UI Thread component for rich chat experience
   - Streaming responses continue working as-is
   - Maintains conversation context with Dify via conversation_id

4. **Persistent Thread Storage**
   - New `health_companion` schema in Supabase database
   - Thread metadata: title, timestamps, last message preview, archive status
   - Threads created after first message (when Dify returns conversation_id)
   - User-specific thread isolation for data security

5. **Modern Dashboard Layout**
   - Collapsible sidebar with navigation
   - Full-page experience (not constrained to narrow chat window)
   - Responsive design: mobile-friendly with overlay sidebar
   - Placeholder navigation for future features (Pricing, Feature 1, Feature 2)

**Technical Implementation:**
- Use Assistant UI ThreadList component for sidebar
- Use Assistant UI Thread component for chat interface
- Build thread management API endpoints (CRUD operations)
- Create Supabase schema and Drizzle ORM models
- Redesign dashboard layout component
- No migration of existing data (fresh start)

### Scope

**In Scope:**

✅ **Database & Schema**
- Create dedicated `health_companion` schema in Supabase
- Design and implement `threads` table with proper indexes
- Add Drizzle ORM schema definition for type-safe queries
- Generate database migrations

✅ **Thread Management APIs**
- `GET /api/threads` - List all threads for authenticated user
- `POST /api/threads` - Create new thread (after first message)
- `PATCH /api/threads/[id]` - Update thread (title, last message)
- `PATCH /api/threads/[id]/archive` - Archive/unarchive thread
- `DELETE /api/threads/[id]` - Delete thread permanently

✅ **Chat Interface Enhancement**
- Integrate Assistant UI ThreadList component in sidebar
- Migrate current chat to use Assistant UI Thread component
- Implement thread switching logic
- Auto-save thread after first message (when conversation_id available)
- Update thread metadata on new messages (last_message_preview, updated_at)

✅ **Dashboard Layout Redesign**
- Create new collapsible sidebar layout
- Implement responsive behavior (overlay on mobile)
- Add navigation items: Threads, Pricing (placeholder), Feature 1 (placeholder), Feature 2 (placeholder)
- Sidebar state persistence (open/closed)
- Keyboard shortcut for sidebar toggle (Ctrl/Cmd+B as per Assistant UI convention)

✅ **Thread Metadata Management**
- Thread title (user-editable, nullable)
- Created timestamp (auto-generated)
- Updated timestamp (auto-updated)
- Last message preview (first 100 characters)
- Archive status (boolean)

✅ **Responsive Design**
- Desktop: Sidebar visible by default, collapsible
- Tablet: Sidebar collapsible, icon-based navigation
- Mobile: Sidebar hidden by default, overlay when opened

✅ **User Experience Features**
- Thread title editing inline or via modal
- Empty state when no threads exist
- Loading states during thread fetch/switch
- Error handling for failed thread operations
- Confirmation dialog for thread deletion

**Out of Scope:**

❌ **Auto-generation of thread titles** from first message (future enhancement)
- Rationale: Adds complexity; Assistant UI supports manual titles with fallback

❌ **Thread limits or quotas** per user
- Rationale: Not needed initially; can add later if abuse detected

❌ **Migration of existing conversation data**
- Rationale: Fresh start approach; existing data minimal

❌ **Functional implementation of placeholder navigation items**
- Pricing, Feature 1, Feature 2 are placeholders only
- Clicking them does nothing (or shows "Coming Soon" toast)

❌ **Advanced thread features:**
- Thread search functionality
- Thread tags or categories
- Thread sharing or export
- Thread analytics (message count, duration, etc.)
- Bulk thread operations (select multiple, bulk archive)

❌ **Dify API modifications**
- Existing Dify integration remains unchanged
- conversation_id handling stays the same

❌ **Authentication changes**
- Supabase auth flow unchanged
- User management unchanged

❌ **Billing or subscription changes**
- No changes to Stripe integration

---

## Development Context

### Relevant Existing Code

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

### Dependencies

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

### Configuration Changes

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

### Existing Conventions (Brownfield)

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

### Test Framework & Standards

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

## Implementation Stack

**Complete Technology Stack:**

**Frontend:**
- Next.js 14.2.25 (App Router, SSR/SSG, API Routes)
- React 18.3.1 (Server + Client Components)
- TypeScript 5.6.3 (Strict mode)
- Tailwind CSS 3.4.14 (Utility-first styling)
- Radix UI (Accessible primitives)
- shadcn/ui (Component library)
- Assistant UI 0.11.47 (**Thread management**)
- Lucide React 0.453.0 (Icons)
- next-themes 0.3.0 (Dark mode)

**Backend:**
- Next.js API Routes (Serverless functions)
- Drizzle ORM 0.35.1 (Type-safe queries)
- PostgreSQL (via Supabase)
- PGlite 0.2.12 (Local development)
- Zod 3.23.8 (Runtime validation)

**Authentication:**
- Supabase 2.86.0 (Auth provider + database)
- @supabase/ssr 0.1.0 (SSR support)
- JWT tokens (HTTP-only cookies)

**AI Integration:**
- Dify API (Custom health coaching AI)
- Server-side proxy pattern (API key security)
- SSE streaming for real-time responses

**Development Tools:**
- Vitest 2.1.9 (Unit tests)
- Playwright 1.48.1 (E2E tests)
- ESLint 8.57.1 + @antfu/eslint-config 2.27.3
- Prettier (Code formatting)
- Husky 9.1.6 (Git hooks)
- Commitizen 4.3.1 (Conventional commits)
- **@assistant-ui/react-devtools** (Runtime debugging - **NEW**)

**Monitoring & Logging:**
- Sentry 8.34.0 (Error tracking)
- Pino 9.5.0 (Structured logging)
- @logtail/pino 0.5.2 (Log aggregation)
- Checkly 4.9.0 (Uptime monitoring)

**Internationalization:**
- next-intl 3.21.1 (English, Hindi, Bengali)

**Deployment:**
- Vercel-compatible (serverless)
- GitHub Actions (CI/CD)
- Semantic Release (versioning)

---

## Technical Details

### Database Schema Design

**Table: health_companion.threads**

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique thread identifier |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the thread |
| `conversation_id` | VARCHAR(128) | NOT NULL, UNIQUE | Dify conversation ID for continuity |
| `title` | VARCHAR(255) | NULL | User-editable thread name |
| `last_message_preview` | TEXT | NULL | First 100 chars of last message |
| `archived` | BOOLEAN | DEFAULT FALSE | Archive status for UI filtering |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Thread creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last activity timestamp |

**Indexes:**
```sql
idx_threads_user_id           # Fast lookup: user's threads
idx_threads_conversation_id   # Fast lookup: thread by Dify conversation
idx_threads_user_archived     # Composite: user's non-archived threads (main query)
```

**Row-Level Security (RLS):**
- Users can only SELECT/INSERT/UPDATE/DELETE their own threads
- Enforced via `user_id = auth.uid()` policies
- Service role bypasses RLS for admin operations

### API Endpoint Specifications

**GET /api/threads**
```typescript
// List all threads for authenticated user
Request: None
Response: {
  threads: Array<{
    id: string
    conversationId: string
    title: string | null
    lastMessagePreview: string | null
    archived: boolean
    createdAt: string (ISO 8601)
    updatedAt: string (ISO 8601)
  }>
}
Status Codes:
- 200: Success
- 401: Unauthorized (no valid session)
- 500: Internal server error
```

**POST /api/threads**
```typescript
// Create new thread (called after first message)
Request: {
  conversationId: string  // From Dify response
  title?: string           // Optional initial title
  lastMessagePreview?: string
}
Response: {
  thread: {
    id: string
    conversationId: string
    title: string | null
    createdAt: string
  }
}
Status Codes:
- 201: Created
- 400: Invalid request (missing conversationId, duplicate)
- 401: Unauthorized
- 500: Internal server error
```

**PATCH /api/threads/[id]**
```typescript
// Update thread metadata
Request: {
  title?: string
  lastMessagePreview?: string
}
Response: {
  thread: { /* updated thread object */ }
}
Status Codes:
- 200: Updated
- 400: Invalid request
- 401: Unauthorized
- 404: Thread not found
- 500: Internal server error
```

**PATCH /api/threads/[id]/archive**
```typescript
// Toggle archive status
Request: {
  archived: boolean
}
Response: {
  thread: { id: string, archived: boolean }
}
Status Codes: Same as PATCH /api/threads/[id]
```

**DELETE /api/threads/[id]**
```typescript
// Permanently delete thread
Request: None
Response: { success: true }
Status Codes:
- 200: Deleted
- 401: Unauthorized
- 404: Thread not found
- 500: Internal server error
```

### State Synchronization Strategy

**Challenge:** Keep thread list UI in sync with database after mutations.

**Solution:** Optimistic UI updates with rollback on error.

```typescript
// Pattern for thread creation
async function createThread(conversationId: string) {
  // 1. Optimistic update
  const tempThread = {
    id: crypto.randomUUID(),
    conversationId,
    title: 'New Conversation',
    isOptimistic: true
  }
  setThreads(prev => [tempThread, ...prev])

  try {
    // 2. Server request
    const response = await fetch('/api/threads', {
      method: 'POST',
      body: JSON.stringify({ conversationId })
    })
    const { thread } = await response.json()

    // 3. Replace optimistic with real data
    setThreads(prev =>
      prev.map(t => t.id === tempThread.id ? thread : t)
    )
  } catch (error) {
    // 4. Rollback on error
    setThreads(prev => prev.filter(t => t.id !== tempThread.id))
    toast.error('Failed to create thread')
  }
}
```

### Error Handling Strategies

**Client-Side Errors:**
```typescript
// Network failures
try {
  await fetch('/api/threads')
} catch (error) {
  // Show cached data if available
  if (cachedThreads) {
    setThreads(cachedThreads)
    toast.warning('Showing cached threads (offline)')
  } else {
    showErrorState('Unable to load threads')
  }
}

// Thread creation failures
if (!response.ok) {
  const error = await response.json()
  if (error.code === 'DUPLICATE_CONVERSATION_ID') {
    // Thread already exists, fetch and navigate to it
    const existing = await fetchThreadByConversationId(conversationId)
    router.push(`/chat/${existing.id}`)
  } else {
    toast.error(error.message)
  }
}
```

**Server-Side Errors:**
```typescript
// Database connection failures
try {
  const threads = await db.select().from(threadsTable)
} catch (error) {
  logger.error({ error, userId }, 'Database query failed')
  // Check if connection issue vs. query issue
  if (error.code === 'ECONNREFUSED') {
    return NextResponse.json(
      { error: 'Database temporarily unavailable', code: 'DB_UNAVAILABLE' },
      { status: 503 }
    )
  }
  // Generic error
  return NextResponse.json(
    { error: 'Failed to fetch threads', code: 'QUERY_FAILED' },
    { status: 500 }
  )
}
```

### Performance Considerations

**Database Query Optimization:**
```sql
-- Efficient main query (uses composite index)
SELECT * FROM health_companion.threads
WHERE user_id = $1 AND archived = false
ORDER BY updated_at DESC
LIMIT 50;

-- Index used: idx_threads_user_archived
```

**Caching Strategy (Future Enhancement):**
```typescript
// Not MVP - document for future
// Cache thread list in localStorage for offline
// Invalidate on mutations
// Sync on reconnect
```

**Bundle Size:**
```typescript
// Assistant UI adds ~50KB gzipped
// DevTools excluded from production build (tree-shaken)
// Lazy load ThreadList component for faster initial page load
const ThreadListSidebar = dynamic(() => import('@/components/chat/ThreadListSidebar'))
```

### Security Considerations

**RLS Policy Validation:**
```sql
-- Test RLS policies before deployment
-- Verify user A cannot access user B's threads
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-id';
SELECT * FROM health_companion.threads WHERE user_id = 'user-b-id';
-- Should return 0 rows
```

**Input Validation:**
```typescript
import { z } from 'zod'

const createThreadSchema = z.object({
  conversationId: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/i),
  title: z.string().max(255).optional(),
  lastMessagePreview: z.string().max(500).optional()
})

// In API route
const body = await request.json()
const validatedData = createThreadSchema.parse(body)
// Throws error if validation fails
```

**XSS Prevention:**
```typescript
// React automatically escapes strings
// But be careful with dangerouslySetInnerHTML
// NEVER do this with user input:
<div dangerouslySetInnerHTML={{ __html: thread.title }} />  // BAD

// Always use:
<div>{thread.title}</div>  // GOOD - auto-escaped
```

---

## Development Setup

**Prerequisites:**
- Node.js 20+ (verify: `node --version`)
- npm (comes with Node.js)
- PostgreSQL database access (Supabase or local)
- Supabase account with project created
- Dify API key

**Initial Setup Steps:**

1. **Install Dependencies:**
   ```bash
   npm install
   npm install @assistant-ui/react-devtools
   ```

2. **Environment Configuration:**
   - Copy `.env` to `.env.local`
   - Fill in Supabase credentials (URL, anon key, service role key)
   - Fill in Dify API credentials
   - Verify `DATABASE_URL` points to Supabase PostgreSQL

3. **Database Setup:**
   ```bash
   # Create health_companion schema in Supabase SQL Editor
   # Run SQL from "Database Changes" section above

   # Generate Drizzle migration
   npm run db:generate

   # Open Drizzle Studio to verify
   npm run db:studio
   ```

4. **Development Server:**
   ```bash
   npm run dev
   # Opens http://localhost:3000
   # Sentry Spotlight runs alongside for error debugging
   ```

5. **Verify Setup:**
   - Navigate to `/chat`
   - Should see auth redirect (if not logged in)
   - Log in via `/sign-in`
   - Verify empty chat state loads

**Development Workflow:**

```bash
# Start development
npm run dev                 # Dev server + Spotlight

# Run tests (in separate terminal)
npm test                    # Unit tests (watch mode: npm test -- --watch)
npm run test:e2e           # E2E tests (headless)

# Code quality
npm run lint                # Check linting
npm run lint:fix           # Auto-fix issues
npm run check-types        # TypeScript validation

# Database
npm run db:studio          # Visual database explorer
npm run db:generate        # Create migration after schema changes

# Commits
npm run commit             # Interactive conventional commit
```

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill` |
| Database connection error | Check `DATABASE_URL` in `.env.local`, verify Supabase project status |
| Build errors | `rm -rf .next node_modules && npm install && npm run build` |
| Type errors | `npm run check-types` to identify, fix imports/types |
| Assistant UI not rendering | Verify `@assistant-ui/react@0.11.47` installed, check browser console |

---

## Implementation Guide

### Setup Steps

**Pre-Implementation Checklist:**

- [ ] Feature branch created (`git checkout -b feature/multi-thread-chat`)
- [ ] Dependencies installed (`npm install @assistant-ui/react-devtools`)
- [ ] Development environment running (`npm run dev`)
- [ ] Database schema created in Supabase SQL Editor
- [ ] Drizzle migration generated (`npm run db:generate`)
- [ ] RLS policies applied in Supabase
- [ ] Reviewed existing code references:
  - `src/app/api/chat/route.ts` (current chat API)
  - `src/components/chat/ChatInterface.tsx` (current UI)
  - `src/libs/dify/client.ts` (Dify integration)

### Implementation Steps

**Phase 1: Database & Backend (Stories 1-2)**

**Step 1.1:** Create Database Schema
```bash
# 1. Add to src/models/Schema.ts (Drizzle schema definition)
# 2. Generate migration
npm run db:generate
# 3. Create health_companion schema in Supabase SQL Editor
# 4. Apply RLS policies
```

**Step 1.2:** Build Thread CRUD APIs
```typescript
// src/app/api/threads/route.ts
// - GET: List threads
// - POST: Create thread

// src/app/api/threads/[id]/route.ts
// - PATCH: Update thread
// - DELETE: Delete thread

// src/app/api/threads/[id]/archive/route.ts
// - PATCH: Toggle archive
```

**Step 1.3:** Modify Chat API for Thread Creation
```typescript
// src/app/api/chat/route.ts
// After Dify SSE stream completes:
// - Extract conversation_id from metadata
// - POST to /api/threads internally
// - Return thread_id in response
```

**Phase 2: Assistant UI Integration (Story 3)**

**Step 2.1:** Run 2-Hour Spike
```bash
# Goal: Verify Assistant UI works with our setup
# 1. Create spike branch
# 2. Install devtools
# 3. Create minimal ThreadList with mock data
# 4. Create minimal Thread component
# 5. Verify runtime state in devtools
# 6. Document findings or blockers
```

**Phase 3: Frontend Components (Stories 4-5)**

**Step 3.1:** Create AppShell Layout
```typescript
// src/app/[locale]/(auth)/chat/layout.tsx
// - Sidebar with ThreadListSidebar
// - Main content area ({children})
// - Responsive behavior (Sheet on mobile)
// - Sidebar state context
```

**Step 3.2:** Build ThreadListSidebar
```typescript
// src/components/chat/ThreadListSidebar.tsx
// - Fetch threads via GET /api/threads
// - Render ThreadListPrimitive.Items
// - "New Thread" button
// - Thread item click → navigate to /chat/[id]
// - Archive button per thread
```

**Step 3.3:** Integrate Thread Component
```typescript
// src/app/[locale]/(auth)/chat/[threadId]/page.tsx
// - Load thread data (server component)
// - Pass to ThreadView (client component)
// - ThreadView uses ThreadPrimitive.Root
// - Configure runtime adapter for /api/chat
// - Handle message send + thread metadata update
```

**Step 3.4:** Add DevTools
```typescript
// src/app/[locale]/(auth)/chat/layout.tsx
import { DevToolsModal } from '@assistant-ui/react-devtools'

<AssistantRuntimeProvider>
  <DevToolsModal />
  {children}
</AssistantRuntimeProvider>
```

**Phase 4: Polish & Navigation (Story 6)**

**Step 4.1:** Add Navigation Placeholders
```typescript
// In AppShell sidebar:
// - Pricing (onClick: toast("Coming Soon"))
// - Feature 1 (onClick: toast("Coming Soon"))
// - Feature 2 (onClick: toast("Coming Soon"))
```

**Step 4.2:** Implement Thread Title Editing
```typescript
// src/components/chat/ThreadTitleEditor.tsx
// - Inline editable input
// - PATCH /api/threads/[id] on blur
// - Optimistic update
```

**Step 4.3:** Add Empty States
```typescript
// - No threads: "Start your first conversation"
// - Thread loading: Skeleton components
// - Error states: Retry button
```

**Step 4.4:** Keyboard Shortcuts
```typescript
// Cmd/Ctrl + B: Toggle sidebar
// Implemented via event listener in AppShell
```

### Testing Strategy

**MVP Testing Scope (Lean Approach):**

**Unit Tests (Vitest):**
```typescript
// src/app/api/threads/route.test.ts
describe('GET /api/threads', () => {
  it('returns user threads', async () => {
    // Mock Supabase auth
    // Mock DB query
    // Assert response structure
  })

  it('returns 401 for unauthenticated', async () => {
    // Mock no auth
    // Assert 401 status
  })
})

// src/components/chat/ThreadListSidebar.test.tsx
describe('ThreadListSidebar', () => {
  it('renders thread list', () => {
    render(<ThreadListSidebar threads={mockThreads} />)
    expect(screen.getByText('New Thread')).toBeInTheDocument()
  })

  it('navigates on thread click', async () => {
    // Mock router
    // Click thread
    // Assert navigation called
  })
})
```

**E2E Tests (Playwright):**
```typescript
// tests/e2e/multi-thread-chat.spec.ts
test.describe('Multi-Thread Chat', () => {
  test('user can create and switch threads', async ({ page }) => {
    // 1. Login
    await page.goto('/sign-in')
    await login(page)

    // 2. Navigate to chat
    await page.goto('/chat')

    // 3. Send first message (creates thread)
    await page.fill('[placeholder="Send a message"]', 'Hello')
    await page.press('[placeholder="Send a message"]', 'Enter')

    // 4. Wait for thread to appear in sidebar
    await expect(page.locator('.thread-list')).toContainText('New Conversation')

    // 5. Create second thread
    await page.click('text=New Thread')
    await page.fill('[placeholder="Send a message"]', 'Second thread')
    await page.press('[placeholder="Send a message"]', 'Enter')

    // 6. Verify two threads exist
    const threads = page.locator('.thread-item')
    await expect(threads).toHaveCount(2)

    // 7. Switch to first thread
    await threads.first().click()

    // 8. Verify messages from first thread visible
    await expect(page.locator('text=Hello')).toBeVisible()
    await expect(page.locator('text=Second thread')).not.toBeVisible()
  })

  test('thread title is editable', async ({ page }) => {
    // Navigate to thread
    // Click title
    // Edit text
    // Blur
    // Assert PATCH called
    // Assert title updated in sidebar
  })

  test('user can archive threads', async ({ page }) => {
    // Navigate to thread
    // Click archive button
    // Assert thread removed from sidebar
    // Verify archived=true in database
  })
})
```

**Manual QA Checklist:**
- [ ] Desktop: Sidebar visible, collapsible via button and Cmd+B
- [ ] Tablet: Sidebar collapsible, icon navigation
- [ ] Mobile: Sidebar hidden, opens as overlay
- [ ] Thread creation: First message creates thread in sidebar
- [ ] Thread switching: Click thread loads correct conversation
- [ ] Thread title editing: Inline edit works, updates persist
- [ ] Archive: Thread disappears from list, can be unarchived
- [ ] Empty states: Proper messaging when no threads
- [ ] Loading states: Skeletons during fetch
- [ ] Error handling: Toast messages on failures, retry options
- [ ] Streaming: Chat responses stream correctly
- [ ] Dark mode: All components respect theme

### Acceptance Criteria

**Story 1: Database + APIs**
- ✅ AC #1: `health_companion` schema created in Supabase
- ✅ AC #2: `threads` table exists with correct columns and indexes
- ✅ AC #3: RLS policies enforce user-scoped access
- ✅ AC #4: `GET /api/threads` returns authenticated user's threads
- ✅ AC #5: `POST /api/threads` creates thread with conversation_id
- ✅ AC #6: `PATCH /api/threads/[id]` updates title and metadata
- ✅ AC #7: `PATCH /api/threads/[id]/archive` toggles archive status
- ✅ AC #8: `DELETE /api/threads/[id]` removes thread permanently
- ✅ AC #9: All endpoints return 401 for unauthenticated requests
- ✅ AC #10: Integration tests pass for happy path

**Story 2: Thread Persistence**
- ✅ AC #1: `/api/chat` captures conversation_id from Dify response
- ✅ AC #2: Thread auto-created after first message
- ✅ AC #3: Thread appears in sidebar after creation
- ✅ AC #4: Thread `updated_at` updates on new messages
- ✅ AC #5: `last_message_preview` stores first 100 chars of last message
- ✅ AC #6: E2E test: Send message → Thread appears in sidebar

**Story 3: Assistant UI Spike**
- ✅ AC #1: ThreadList renders with mock data
- ✅ AC #2: Thread component renders with mock messages
- ✅ AC #3: DevTools show runtime state correctly
- ✅ AC #4: Spike documented: Integration approach confirmed OR blockers identified
- ✅ AC #5: Team consensus on approach before Story 4

**Story 4: ThreadList Sidebar**
- ✅ AC #1: AppShell layout renders sidebar + main content
- ✅ AC #2: ThreadList displays user's threads fetched from API
- ✅ AC #3: "New Thread" button navigates to `/chat`
- ✅ AC #4: Clicking thread navigates to `/chat/[threadId]`
- ✅ AC #5: Active thread highlighted in sidebar
- ✅ AC #6: Archive button archives thread (disappears from list)
- ✅ AC #7: Desktop: Sidebar visible by default, collapsible
- ✅ AC #8: Mobile: Sidebar hidden, opens as overlay via hamburger menu
- ✅ AC #9: Keyboard shortcut (Cmd/Ctrl+B) toggles sidebar
- ✅ AC #10: Loading state shows skeletons during fetch
- ✅ AC #11: Empty state shows "Start your first conversation" when no threads

**Story 5: Thread Component**
- ✅ AC #1: Chat interface uses ThreadPrimitive.Root
- ✅ AC #2: Messages render correctly in conversation view
- ✅ AC #3: Composer sends message via `/api/chat`
- ✅ AC #4: Streaming responses work (SSE from Dify)
- ✅ AC #5: Thread metadata updates on new message (last_message_preview, updated_at)
- ✅ AC #6: Thread title editable inline (click to edit)
- ✅ AC #7: DevTools visible in dev mode, show runtime state
- ✅ AC #8: E2E test: Full chat flow works with threading

**Story 6: Navigation + Polish**
- ✅ AC #1: Sidebar navigation includes: Threads, Pricing, Feature 1, Feature 2
- ✅ AC #2: Placeholder items show "Coming Soon" toast on click
- ✅ AC #3: All empty states styled and helpful
- ✅ AC #4: All error states have retry mechanisms
- ✅ AC #5: Dark mode works across all new components
- ✅ AC #6: Mobile responsive behavior tested and working
- ✅ AC #7: Manual QA checklist completed
- ✅ AC #8: Production build succeeds, no console errors
- ✅ AC #9: DevTools excluded from production bundle (verify with bundle analyzer)

---

## Developer Resources

### File Paths Reference

**Complete list of all files involved:**

**NEW Files:**
```
src/app/[locale]/(auth)/chat/layout.tsx
src/app/[locale]/(auth)/chat/page.tsx
src/app/[locale]/(auth)/chat/[threadId]/page.tsx
src/components/chat/AppShell.tsx
src/components/chat/ThreadListSidebar.tsx
src/components/chat/ThreadItem.tsx
src/components/chat/EmptyThreadState.tsx
src/components/chat/ThreadTitleEditor.tsx
src/app/api/threads/route.ts
src/app/api/threads/[id]/route.ts
src/app/api/threads/[id]/archive/route.ts
src/libs/supabase/threads.ts
```

**MODIFIED Files:**
```
src/models/Schema.ts                      # Add threads table
src/app/api/chat/route.ts                 # Add thread creation
src/components/chat/ChatInterface.tsx     # Replace with Thread component
package.json                               # Add @assistant-ui/react-devtools
```

**DELETED Files:**
```
src/app/[locale]/(chat)/chat/             # Old chat route (replaced)
```

### Key Code Locations

**Authentication & Session:**
- Middleware logic: `src/middleware.ts:1-50`
- Server-side Supabase client: `src/libs/supabase/server.ts:createClient()`
- Client-side Supabase client: `src/libs/supabase/client.ts:createClient()`

**Database & ORM:**
- Schema definitions: `src/models/Schema.ts`
- Database connection: `src/libs/DB.ts:db`
- Thread table schema: `src/models/Schema.ts:healthCompanionSchema.threads`
- Thread queries helper: `src/libs/supabase/threads.ts` (NEW)

**AI Integration:**
- Dify client: `src/libs/dify/client.ts:DifyClient`
- Chat API endpoint: `src/app/api/chat/route.ts:POST`
- Conversation ID handling: `src/app/api/chat/route.ts:48` (conversationId param)
- SSE streaming: `src/app/api/chat/route.ts:102-117`

**Assistant UI Components:**
- Thread list: `src/components/chat/ThreadListSidebar.tsx` (NEW)
- Thread view: `src/app/[locale]/(auth)/chat/[threadId]/page.tsx` (NEW)
- App shell: `src/components/chat/AppShell.tsx` (NEW)
- DevTools integration: `src/app/[locale]/(auth)/chat/layout.tsx` (NEW)

**UI Primitives (shadcn/ui):**
- Button: `src/components/ui/button.tsx`
- Sheet (sidebar): `src/components/ui/sheet.tsx`
- Input: `src/components/ui/input.tsx`
- Skeleton (loading): `src/components/ui/skeleton.tsx`
- Tooltip: `src/components/ui/tooltip.tsx`

### Testing Locations

**Unit Tests:**
```
src/app/api/threads/route.test.ts              # NEW - Thread API tests
src/components/chat/ThreadListSidebar.test.tsx # NEW - Component tests
src/components/chat/AppShell.test.tsx          # NEW - Layout tests
```

**E2E Tests:**
```
tests/e2e/multi-thread-chat.spec.ts            # NEW - Full flow tests
tests/e2e/thread-switching.spec.ts             # NEW - Navigation tests
tests/e2e/thread-editing.spec.ts               # NEW - Title edit tests
```

**Test Commands:**
```bash
npm test                              # Run all unit tests
npm test -- --watch                   # Watch mode
npm test src/app/api/threads/route.test.ts  # Specific test
npm run test:e2e                      # All E2E tests
npm run test:e2e -- --headed          # E2E with browser visible
npm run test:e2e -- --debug           # E2E debug mode
```

### Documentation to Update

**README.md:**
- Add feature: "Multi-threaded chat conversations"
- Update screenshots (before/after sidebar)
- Add note about health_companion schema in Supabase

**CHANGELOG.md:**
- Entry for this feature release
- Breaking changes: Old `/chat` route replaced with `/chat/[threadId]`

**docs/architecture.md:**
- Add database schema diagram for health_companion.threads
- Document thread management architecture
- Add Assistant UI integration notes

**docs/development-guide.md:**
- Add section on creating Supabase schemas
- Document thread management workflow
- Add Assistant UI devtools usage

**API Documentation (if exists):**
- Document new `/api/threads` endpoints
- Update `/api/chat` endpoint (thread creation behavior)
- Add request/response examples

---

## UX/UI Considerations

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

## Testing Approach

**Test Framework Stack:**
- Vitest 2.1.9 (unit tests)
- @testing-library/react 16.0.1 (component tests)
- Playwright 1.48.1 (E2E tests)
- @storybook/react 8.6.14 (component development - optional for MVP)

**MVP Testing Philosophy:**
- Focus on happy paths and critical failures
- Skip edge cases unlikely at <1000 users
- Prioritize integration over isolated unit tests
- Manual QA for UX polish

**Test Coverage Goals:**

| Layer | Coverage | Rationale |
|-------|----------|-----------|
| **API Routes** | Happy path + auth validation | Core functionality, prevent regressions |
| **Components** | Critical interactions | ThreadList, Thread component basics |
| **E2E** | Full user flows | Create thread, switch threads, archive |
| **Visual Regression** | Skipped (MVP) | Not critical for MVP launch |
| **Performance** | Skipped (MVP) | Load testing unnecessary at small scale |

**Automated Tests (CI/CD):**
```yaml
# .github/workflows/CI.yml (existing)
# Runs on: Pull requests to main
- Lint (ESLint)
- Type check (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright - headless)
- Build verification
```

**Manual Testing Checklist:**
(See "Manual QA Checklist" in Implementation Guide section above)

---

## Deployment Strategy

### Deployment Steps

**Pre-Deployment Checklist:**
- [ ] All tests passing (`npm test && npm run test:e2e`)
- [ ] TypeScript compiles (`npm run check-types`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Bundle size analyzed (`ANALYZE=true npm run build`)
- [ ] DevTools excluded from production bundle (verify in analyzer)
- [ ] Database migrations applied to staging environment
- [ ] RLS policies verified in staging Supabase
- [ ] Environment variables set in Vercel/hosting platform

**Deployment Process:**

**Step 1: Database Migration (Staging)**
```sql
-- 1. Execute in Staging Supabase SQL Editor
CREATE SCHEMA IF NOT EXISTS health_companion;

-- 2. Run Drizzle migration
-- (Migration file generated via npm run db:generate)

-- 3. Apply RLS policies
ALTER TABLE health_companion.threads ENABLE ROW LEVEL SECURITY;
-- (See "Database Changes" section for full policies)

-- 4. Verify with test query
SELECT * FROM health_companion.threads LIMIT 1;
```

**Step 2: Deploy to Staging**
```bash
# Push feature branch
git push origin feature/multi-thread-chat

# Vercel auto-deploys preview (if configured)
# Or manual: vercel --prod=false

# Test on staging URL:
# - Create threads
# - Switch threads
# - Archive threads
# - Verify mobile/desktop responsive
# - Check Sentry for errors
```

**Step 3: Production Deployment**
```bash
# Merge to main (after PR approval)
git checkout main
git merge feature/multi-thread-chat
git push origin main

# Vercel auto-deploys to production
# Or manual: vercel --prod

# GitHub Actions runs:
# - CI checks
# - Build
# - Deploy
# - Semantic release (version bump)
```

**Step 4: Post-Deployment Verification**
- [ ] Health check: Visit `/chat` - verify sidebar loads
- [ ] Create test thread - verify persistence
- [ ] Switch threads - verify routing works
- [ ] Check Sentry for errors (first 30 minutes)
- [ ] Monitor Checkly uptime checks
- [ ] Verify logs in Logtail (Pino logs)

### Rollback Plan

**If Critical Issues Detected:**

**Option 1: Revert Deployment (Fast)**
```bash
# Vercel: Revert to previous deployment
vercel rollback <previous-deployment-url>

# Or via Vercel dashboard: Deployments → Previous → Promote
```

**Option 2: Git Revert (Clean)**
```bash
git revert <merge-commit-hash>
git push origin main
# Triggers new deployment without new feature
```

**Option 3: Feature Flag (If Implemented)**
```typescript
// Not in current scope, but document for future:
if (featureFlags.multiThreadChat) {
  // Show new UI
} else {
  // Show old chat UI
}
```

**Database Rollback:**
```sql
-- If needed (extreme case):
-- 1. Drop health_companion schema
DROP SCHEMA health_companion CASCADE;

-- 2. Old chat still works (uses Dify conversation_id only)
```

### Monitoring

**What to Monitor Post-Launch:**

**Application Metrics (Sentry):**
- Error rate in `/api/threads` endpoints
- Error rate in chat interface
- Failed thread creation attempts
- Slow API response times (>500ms)

**User Behavior (Analytics - if configured):**
- Number of threads created per user
- Thread switching frequency
- Archive usage
- Mobile vs. desktop usage split

**Database Performance:**
- Query execution time for `GET /api/threads`
- Index usage verification (Supabase query analyzer)
- Connection pool utilization

**Specific Alerts to Set:**
```
- API error rate >5% (15-minute window)
- Thread creation failures >10/hour
- Database query time >1 second
- Uptime <99.5% (Checkly)
```

**Monitoring Tools:**
- **Sentry:** Real-time error tracking, performance monitoring
- **Checkly:** API endpoint health checks (`/api/threads`, `/api/chat`)
- **Logtail:** Centralized log aggregation (Pino logs)
- **Vercel Analytics:** Traffic, performance, vitals
- **Supabase Dashboard:** Database metrics, query performance

### Scaling Considerations

**Current MVP Capacity:**
- <1000 concurrent users
- ~50 threads per user average
- ~10 messages per thread average
- Total: <500K thread records

**No Immediate Scaling Needed:**
- Vercel auto-scales serverless functions
- Supabase PostgreSQL handles 500K records easily
- Indexes in place for efficient queries

**Future Scaling Triggers (Post-MVP):**
- >10K active users → Consider read replicas
- >1M thread records → Implement pagination
- >100 requests/sec → Add caching layer (Redis)
- >50ms API latency → Optimize queries, add CDN

---

**🎉 Tech-Spec Complete!**

**Total Pages:** ~40 pages
**Sections:** 12 comprehensive sections
**Deployment Ready:** Yes

**Next Steps:**
1. Review tech-spec with team
2. Break into stories (Epic + 6 stories as outlined)
3. Run Story 3 spike (Assistant UI integration)
4. Begin implementation

**Questions or Clarifications:**
Reach out to John (PM) or Winston (Architect) for technical details.

---
