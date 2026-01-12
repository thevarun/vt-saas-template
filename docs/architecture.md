# VT SaaS Template - System Architecture

**Generated:** 2026-01-02
**Architecture Type:** Serverless Full-stack Monolith
**Framework:** Next.js 14 (App Router)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architectural Overview](#architectural-overview)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Architecture](#data-architecture)
6. [API Design](#api-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [Request Flow](#request-flow)
9. [Component Architecture](#component-architecture)
10. [Integration Architecture](#integration-architecture)
11. [Development Workflow](#development-workflow)
12. [Deployment Architecture](#deployment-architecture)
13. [Testing Strategy](#testing-strategy)
14. [Security Considerations](#security-considerations)
15. [Performance Optimization](#performance-optimization)
16. [Scalability & Resilience](#scalability--resilience)

---

## Executive Summary

VT SaaS Template is built on a **serverless full-stack monolith architecture** using Next.js 14 App Router. The application combines server-side rendering, API routes, and edge middleware to deliver a secure, scalable AI-powered SaaS platform.

**Key Architectural Decisions:**
- **Serverless-first:** All backend logic runs as serverless functions
- **Proxy pattern:** AI API calls proxied through backend to protect credentials
- **Edge middleware:** Authentication and i18n handled at the edge for performance
- **Component-based UI:** React Server Components with selective client components
- **Type-safe data layer:** Drizzle ORM with PostgreSQL for schema safety

---

## Architectural Overview

### Architecture Pattern

**Type:** Full-stack Next.js Serverless Monolith

**Core Principles:**
1. **Server-Side First:** Leverage SSR and Server Components for optimal performance
2. **Security by Default:** Sensitive operations server-side only
3. **Progressive Enhancement:** Core functionality works without JavaScript
4. **Type Safety:** End-to-end TypeScript with strict mode
5. **API Proxy Pattern:** Never expose third-party API keys to client

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Landing Page │  │  Dashboard   │  │  Chat Interface    │   │
│  │   (Public)    │  │ (Protected)  │  │   (Protected)      │   │
│  └───────────────┘  └──────────────┘  └────────────────────┘   │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                     │
             ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EDGE MIDDLEWARE                           │
│  ┌──────────────────┐         ┌──────────────────────────┐     │
│  │  i18n Routing    │────────▶│  Auth Protection         │     │
│  │  (next-intl)     │         │  (Supabase Session)      │     │
│  └──────────────────┘         └──────────────────────────┘     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js App Router (src/app/)              │   │
│  │  ┌──────────────────┐      ┌──────────────────────┐    │   │
│  │  │  [locale] Pages  │      │     API Routes       │    │   │
│  │  │  • (unauth)/     │      │  • /api/chat         │    │   │
│  │  │  • (auth)/       │      │  • /api/threads      │    │   │
│  │  │  • (chat)/       │      │  • /api/messages     │    │   │
│  │  └──────────────────┘      └──────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────┬────────────────────────────────────────────┬──────────────┘
      │                                             │
      ▼                                             ▼
┌──────────────────────┐              ┌───────────────────────────┐
│   SUPABASE LAYER     │              │   DIFY AI LAYER           │
│  ┌────────────────┐  │              │  ┌─────────────────────┐ │
│  │ Authentication │  │              │  │  Chat Streaming     │ │
│  │ PostgreSQL DB  │  │              │  │  Conversation State │ │
│  │ Row-Level SEC  │  │              │  │  AI Model Hosting   │ │
│  └────────────────┘  │              │  └─────────────────────┘ │
└──────────────────────┘              └───────────────────────────┘
```

---

## Technology Stack

### Frontend Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 14.2.25 | Full-stack React framework |
| UI Library | React | 18.3.1 | Component-based UI |
| Language | TypeScript | 5.6.3 | Type-safe development |
| Styling | Tailwind CSS | 3.4.14 | Utility-first CSS |
| Chat UI | Assistant UI | 0.11.47 | Streaming chat interface |
| Components | Radix UI | Various | Accessible primitives |
| Theme | next-themes | 0.3.0 | Dark mode support |
| i18n | next-intl | 3.21.1 | Internationalization |

### Backend Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js | 20.x+ | JavaScript runtime |
| API Layer | Next.js API Routes | 14.2.25 | Serverless endpoints |
| Database | PostgreSQL | - | Relational database |
| ORM | Drizzle ORM | 0.35.1 | Type-safe queries |
| Auth | Supabase Auth | 2.86.0 | Authentication service |
| AI Service | Dify API | v1 | AI chat backend |

### Development Tools

| Category | Technology | Purpose |
|----------|------------|---------|
| Testing | Vitest | Unit testing |
| E2E Testing | Playwright | End-to-end testing |
| Visual Testing | Storybook | Component development |
| Linting | ESLint | Code quality |
| Formatting | Prettier | Code formatting |
| Git Hooks | Husky | Pre-commit validation |
| Commits | Commitizen | Conventional commits |
| Monitoring | Sentry | Error tracking |

---

## System Components

### 1. Middleware Layer (`src/middleware.ts`)

**Purpose:** Edge middleware that runs before all requests

**Responsibilities:**
- **i18n Routing:** Locale detection and URL prefixing
- **Session Management:** Supabase session cookie refresh
- **Auth Protection:** Redirect unauthenticated users from protected routes

**Execution Flow:**
1. Apply i18n middleware (next-intl)
2. Update Supabase session cookies
3. Check if route is protected
4. Validate user session for protected routes
5. Redirect to `/sign-in` if unauthenticated

**Protected Routes:**
- `/dashboard`
- `/onboarding`
- `/chat`
- `/api/*` (returns 401 JSON instead of redirect)

### 2. Application Layer (`src/app/`)

**Structure:** Next.js App Router with route groups

```
app/
├── [locale]/               # Locale-specific routes
│   ├── (unauth)/          # Public pages (no auth required)
│   │   └── page.tsx       # Landing page
│   ├── (auth)/            # Protected pages
│   │   ├── dashboard/     # User dashboard
│   │   └── onboarding/    # First-time setup
│   └── (chat)/            # Chat interface (protected)
│       └── chat/page.tsx  # Main chat page
└── api/                   # API Routes (no locale prefix)
    ├── chat/              # AI chat proxy
    ├── threads/           # Thread management
    └── messages/          # Message retrieval
```

**Route Groups:**
- `(unauth)`: Public pages, no authentication
- `(auth)`: Protected pages with dashboard layout
- `(chat)`: Chat interface with sidebar layout

### 3. Component Layer (`src/components/`)

**Organization:**
- **`ui/`** - shadcn/ui components (button, input, dialog, etc.)
- **`chat/`** - Chat-specific components (ChatInterface, ThreadList, etc.)
- **`layout/`** - Layout components (MainAppShell, NavItem, etc.)
- **Root components** - Shared utilities (LocaleSwitcher, Background, etc.)

**Key Components:**
- `ChatInterface.tsx` - Main chat UI with Assistant UI integration
- `ThreadListSidebar.tsx` - Thread management sidebar
- `ThreadView.tsx` - Individual thread display
- `MainAppShell.tsx` - Main app layout wrapper

### 4. Integration Layer (`src/libs/`)

**Supabase (`libs/supabase/`):**
- `client.ts` - Client-side Supabase client
- `server.ts` - Server-side Supabase client (uses cookies)
- `middleware.ts` - Middleware session helper

**Dify (`libs/dify/`):**
- `client.ts` - Dify API wrapper with streaming support

**Design:** Each integration is isolated in its own module with dedicated client factories.

### 5. Data Layer (`src/models/`)

**ORM:** Drizzle ORM with PostgreSQL

**Schema:** `Schema.ts` defines database tables

**Migration Strategy:**
- Migrations auto-generated via `npm run db:generate`
- Auto-applied on first DB interaction
- Stored in `migrations/` directory

---

## Data Architecture

### Database Schema

**ORM:** Drizzle ORM
**Database:** PostgreSQL (via Supabase)
**Schema:** `health_companion` (dedicated schema)

#### Threads Table

```typescript
threads {
  id: uuid (primary key, auto-generated)
  userId: uuid (not null)
  conversationId: text (unique, not null)  // Dify conversation ID
  title: text (nullable)
  lastMessagePreview: text (nullable)
  archived: boolean (default: false)
  createdAt: timestamp (with timezone, default: now)
  updatedAt: timestamp (with timezone, default: now)
}

Indexes:
- idx_threads_user_id (userId)
- idx_threads_conversation_id (conversationId)
- idx_threads_user_archived (userId, archived)
```

**Relationships:**
- `userId` references Supabase Auth users
- `conversationId` maps to Dify conversation state

**Data Flow:**
1. User starts chat → Thread created with auto-generated ID
2. First message sent → `conversationId` populated from Dify response
3. Thread updated → `lastMessagePreview` and `updatedAt` set
4. Thread archived → `archived` flag set to true

### Data Storage Strategy

**User Data:** Stored in Supabase Auth (managed by Supabase)
**Conversation History:** Stored in Dify (external service)
**Thread Metadata:** Stored in PostgreSQL (threads table)

**Separation of Concerns:**
- Auth data: Supabase Auth tables
- Chat messages: Dify conversation history
- Thread organization: Application database

---

## API Design

### API Architecture

**Pattern:** RESTful API with Server-Sent Events (SSE) for streaming

**Base Path:** `/api/`

**Authentication:** Server-side Supabase session validation

### API Endpoints

#### 1. `/api/chat` (POST)

**Purpose:** Proxy chat requests to Dify AI with streaming responses

**Request:**
```typescript
{
  message: string;
  conversation_id?: string;
}
```

**Response:** Server-Sent Events (text/event-stream)
```
event: message
data: {"type":"answer","content":"Hello..."}

event: done
data: {"conversation_id":"uuid-here"}
```

**Authentication:** Required (Supabase session)

**Key Features:**
- Streams AI responses in real-time
- Keeps Dify API key server-side
- Returns conversation_id for thread persistence

#### 2. `/api/threads` (GET)

**Purpose:** Fetch all threads for authenticated user

**Response:**
```typescript
{
  threads: Array<{
    id: string;
    title: string;
    conversationId: string;
    lastMessagePreview: string;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

**Query Parameters:**
- `includeArchived=true` - Include archived threads

#### 3. `/api/threads` (POST)

**Purpose:** Create new thread

**Request:**
```typescript
{
  title?: string;
  conversationId: string;
}
```

**Response:**
```typescript
{
  thread: { id, userId, conversationId, title, ... }
}
```

#### 4. `/api/threads/[id]` (GET/PUT/DELETE)

**Purpose:** Thread CRUD operations

**GET:** Retrieve thread details
**PUT:** Update thread (title, lastMessagePreview)
**DELETE:** Delete thread permanently

#### 5. `/api/threads/[id]/archive` (POST)

**Purpose:** Archive/unarchive thread

**Request:**
```typescript
{
  archived: boolean;
}
```

#### 6. `/api/chat/messages` (GET)

**Purpose:** Retrieve message history for conversation

**Query Parameters:**
- `conversation_id` - Dify conversation ID

**Response:** Proxied from Dify API

---

## Authentication & Authorization

### Authentication Flow

**Provider:** Supabase Auth
**Session Storage:** HTTP-only cookies
**Validation:** Server-side on every protected request

#### Sign-In Flow

```
1. User visits /sign-in
2. Enters credentials (email/password or OAuth)
3. Supabase Auth validates credentials
4. Session cookie set in response
5. Redirect to /dashboard or original destination
```

#### Session Management

**Middleware Refresh:**
- Every request → `updateSession()` called
- Expired tokens → Refreshed automatically
- Failed refresh → Redirect to /sign-in

**Client-Side:**
- Uses `@supabase/ssr` for cookie-based sessions
- No tokens in localStorage

**Server-Side:**
- API routes validate via `createClient(cookies)`
- User object extracted from session

### Authorization Strategy

**Row-Level Security (RLS):** Not currently implemented
**Application-Level:** Enforced via `userId` filtering

**Thread Access Control:**
```typescript
// Only return threads owned by authenticated user
const threads = await db
  .select()
  .from(threadsTable)
  .where(eq(threadsTable.userId, user.id));
```

---

## Request Flow

### Page Request Flow (SSR)

```
1. Browser → Request /chat
2. Middleware → Check locale, update session, validate auth
3. App Router → Render (chat)/chat/page.tsx
4. Server Component → Fetch initial data (threads list)
5. HTML Response → Streamed to client
6. Hydration → Client components become interactive
7. Client → Connects to /api/chat for streaming
```

### API Request Flow (Chat)

```
1. Client → POST /api/chat {message, conversation_id}
2. Middleware → Validate auth (401 if unauthorized)
3. API Route → Extract user from session
4. API Route → Call Dify API with message
5. Dify → Stream SSE events back
6. API Route → Proxy events to client
7. Client → Render streamed message chunks
8. Dify → Send "done" event with conversation_id
9. Client → Update thread with conversation_id
10. Client → POST /api/threads to persist thread
```

### Thread Persistence Flow

```
1. First message in new chat → Create thread
2. Thread created → id generated, conversationId empty
3. Chat response received → conversationId from Dify
4. PUT /api/threads/[id] → Update with conversationId
5. Subsequent messages → Use existing conversationId
6. Thread list → Fetch via GET /api/threads
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Providers (Theme, Toast, etc.)
├── [locale] Layout
│   ├── Middleware (i18n, auth)
│   └── Route Groups
│       ├── (unauth)
│       │   └── Landing Page
│       ├── (auth)
│       │   ├── MainAppShell
│       │   │   ├── Navigation
│       │   │   └── Dashboard Content
│       └── (chat)
│           └── AppShell
│               ├── ThreadListSidebar
│               │   ├── ThreadItem[]
│               │   └── CreateThread Button
│               └── ChatInterface
│                   ├── ThreadView
│                   │   ├── Messages[]
│                   │   └── InputBar
│                   └── EmptyState
```

### Component Categories

**1. Server Components (Default)**
- Layout components
- Page shells
- Data fetching wrappers
- Static content

**2. Client Components ("use client")**
- Interactive UI (buttons with onClick)
- Form inputs
- Chat interface (streaming)
- Theme toggle
- Locale switcher

**Design Principle:** Use Server Components by default, Client Components only when needed for interactivity.

### State Management

**No Global State Library:** Using React's built-in state management

**State Strategies:**
- **Server State:** React Server Components + fetch
- **Client State:** useState, useReducer
- **Form State:** react-hook-form
- **URL State:** Next.js routing (searchParams, params)
- **Chat State:** Assistant UI runtime (built-in)

---

## Integration Architecture

### External Service Integrations

#### 1. Supabase Integration

**Services Used:**
- **Auth:** Email/password + OAuth providers
- **Database:** PostgreSQL hosting
- **Session Management:** Cookie-based sessions

**Client Types:**
- **Browser Client:** `createBrowserClient()` for client components
- **Server Client:** `createServerClient()` for server components/API
- **Middleware Client:** Special client for middleware session updates

**Connection Pattern:**
```typescript
// Client-side
const supabase = createBrowserClient(url, anonKey);

// Server-side
const supabase = createServerClient(cookieStore);
const { data: { user } } = await supabase.auth.getUser();
```

#### 2. Dify AI Integration

**Integration Type:** HTTP API with SSE streaming

**Client:** Custom wrapper (`src/libs/dify/client.ts`)

**API Calls:**
- **Chat Messages:** POST `/chat-messages` (streaming)
- **Message History:** GET `/messages` (conversation_id)
- **Conversation State:** Managed by Dify

**Proxy Pattern:**
```
Client → /api/chat → Dify API (/chat-messages)
                ↓
          API Key (server-side only)
```

**Streaming Implementation:**
- Dify returns SSE stream
- API route proxies stream to client
- Assistant UI consumes stream via adapter

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Add: SUPABASE_URL, SUPABASE_ANON_KEY, DIFY_API_KEY, DATABASE_URL

# Run development server
npm run dev  # Includes Sentry Spotlight

# Run database studio
npm run db:studio
```

### Database Workflow

```bash
# 1. Modify src/models/Schema.ts
# 2. Generate migration
npm run db:generate

# Migration auto-applies on next DB interaction
# OR manually apply:
npm run db:migrate
```

### Code Quality Workflow

```bash
# Linting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Type checking
npm run check-types   # TypeScript validation

# Testing
npm test              # Unit tests
npm run test:e2e      # E2E tests

# Commits
npm run commit        # Commitizen (conventional commits)
```

---

## Deployment Architecture

### Recommended Platform: Vercel

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│  ┌───────────────┐   ┌───────────────┐ │
│  │ Edge Middleware│   │  CDN (Static) │ │
│  │ (Auth + i18n)  │   │    Assets     │ │
│  └───────────────┘   └───────────────┘ │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      Vercel Serverless Functions        │
│  ┌────────────┐      ┌──────────────┐  │
│  │ SSR Pages  │      │  API Routes  │  │
│  │ (Node.js)  │      │  (Node.js)   │  │
│  └────────────┘      └──────────────┘  │
└─────────────────────────────────────────┘
```

**Configuration:**
- **Framework Preset:** Next.js
- **Node Version:** 20.x
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (sensitive)
DIFY_API_URL=xxx
DIFY_API_KEY=xxx (sensitive)
DATABASE_URL=xxx (sensitive)
SENTRY_DSN=xxx (optional)
```

### Alternative Deployment

**Compatible Platforms:**
- Netlify
- Railway
- Render
- Self-hosted (Node.js 20+)

**Requirements:**
- Node.js 20.x or higher
- PostgreSQL database access
- Environment variables configured

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
       │     E2E      │  Playwright (Full user flows)
       │  (Playwright)│
      └───────────────┘
     ┌─────────────────┐
    │   Integration    │   API route testing
    │    (Vitest)      │
   └───────────────────┘
  ┌─────────────────────┐
 │      Unit Tests       │  Component + utility tests
 │      (Vitest)         │
└───────────────────────┘
```

### Unit Tests (Vitest)

**Location:** Co-located with source files (`*.test.ts`, `*.test.tsx`)

**Coverage:**
- Utility functions
- Component logic
- Custom hooks
- Data transformations

**Example:**
```typescript
// ToggleMenuButton.test.tsx
import { render, screen } from '@testing-library/react';
import { ToggleMenuButton } from './ToggleMenuButton';

test('renders toggle button', () => {
  render(<ToggleMenuButton />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

**Location:** `tests/` directory

**Coverage:**
- Authentication flows
- Chat functionality
- Thread management
- Multi-language support

**Example Test:**
```typescript
// tests/chat.spec.ts
test('user can send message and receive response', async ({ page }) => {
  await page.goto('/chat');
  await page.fill('[data-testid="chat-input"]', 'Hello');
  await page.click('[data-testid="send-button"]');
  await expect(page.locator('.message')).toBeVisible();
});
```

### Visual Regression (Storybook)

**Purpose:** Component visual testing and documentation

**Location:** `*.stories.tsx` files

**Usage:**
```bash
npm run storybook        # Development
npm run test-storybook:ci # CI visual regression
```

---

## Security Considerations

### API Key Protection

**Dify API Key:**
- ✅ Stored in server-side env vars only
- ✅ Never exposed to client bundles
- ✅ Proxied through `/api/chat`

**Supabase Keys:**
- ✅ Anon key is public (RLS enforced)
- ✅ Service role key server-side only

### Authentication Security

**Session Management:**
- HTTP-only cookies (XSS protection)
- Secure flag in production
- SameSite=Lax (CSRF protection)

**Route Protection:**
- Middleware enforces auth on protected routes
- API routes validate session server-side
- No client-side auth bypasses

### Data Security

**User Isolation:**
- All queries filtered by `userId`
- No direct database access from client
- API routes validate user ownership

**Input Validation:**
- TypeScript types for compile-time safety
- Runtime validation via Zod schemas (form inputs)
- SQL injection prevention via Drizzle ORM

---

## Performance Optimization

### Frontend Performance

**React Server Components:**
- Default to Server Components
- Reduces client bundle size
- Faster initial page loads

**Code Splitting:**
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading for chat interface

**Asset Optimization:**
- Sharp for image optimization
- Tailwind CSS purging
- CSS minimization (cssnano)

### Backend Performance

**Database:**
- Indexed queries (userId, conversationId)
- Connection pooling via Supabase
- Selective field fetching

**Caching:**
- Static page caching (ISR if needed)
- CDN caching for static assets
- API response caching (future consideration)

### Monitoring

**Sentry Integration:**
- Error tracking
- Performance monitoring
- Release tracking

---

## Scalability & Resilience

### Horizontal Scalability

**Serverless Functions:**
- Auto-scaling based on demand
- No server management
- Pay-per-execution model

**Database:**
- Supabase handles connection pooling
- Can upgrade to dedicated instance
- Read replicas for scaling reads

### Resilience Patterns

**Error Handling:**
- API errors caught and logged to Sentry
- User-friendly error messages
- Retry logic for transient failures

**Graceful Degradation:**
- Chat works without JavaScript (basic form)
- Offline detection and messaging
- Fallback UI states

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
