# Epic 10: AI Chat Module (Dual Implementation)

**Goal:** Template users have two production-quality chat options (Dify + Vercel AI SDK) with clear documentation and easy removal

**UX Design Artifacts:**
- [Design Brief](../ux-design/epic-10-vercel-chat-design-brief.md)
- [Component Strategy](../ux-design/epic-10-vercel-chat-component-strategy.md)

## Overview

This epic delivers a complete chat module with two implementation options, giving downstream developers flexibility to choose their stack:

| Stack | Route | Use Case |
|-------|-------|----------|
| **Dify** | `/chat/dify` | Simple, managed, minimal setup |
| **Vercel AI SDK** | `/chat/vercel` | Full control, observable, extensible |

**Key Deliverables:**
- Clean, reorganized Dify chat at `/chat/dify`
- New Vercel AI SDK chat at `/chat/vercel` with LangFuse + Mem0
- Unified database schema (`vt_saas`)
- Documentation for SSE streaming, API proxy patterns
- Removal guides for either or both implementations

---

## Story 10.1: Rename Existing Chat Route

As a **template user (developer)**,
I want **the existing Dify chat to be at `/chat/dify`**,
So that **both chat implementations have clear, distinct routes**.

**Current Route Structure:**
```
src/app/[locale]/(auth)/chat/
├── page.tsx              # Main chat page (thread list + new chat)
├── [threadId]/
│   └── page.tsx          # Specific thread conversation
├── error.tsx             # Error boundary
```

**Target Route Structure:**
```
src/app/[locale]/(auth)/chat/
├── dify/
│   ├── page.tsx          # Dify chat (thread list + new chat)
│   ├── [threadId]/
│   │   └── page.tsx      # Specific Dify thread
│   └── error.tsx         # Dify error boundary
├── vercel/
│   ├── page.tsx          # Vercel chat (conversation list + new chat)
│   ├── [conversationId]/
│   │   └── page.tsx      # Specific Vercel conversation
│   └── error.tsx         # Vercel error boundary
└── page.tsx              # Chat selection page (optional)
```

**Acceptance Criteria:**

**Given** the existing chat implementation at `/chat`
**When** I navigate to `/chat/dify`
**Then** the Dify chat interface loads correctly
**And** the thread list displays my conversations
**And** I can navigate to `/chat/dify/[threadId]` for specific threads

**Given** the route rename
**When** I navigate to the old `/chat` route
**Then** I am redirected to `/chat/dify` OR see a chat selection page

**Given** the navigation component
**When** I view the navigation
**Then** the chat link points to `/chat/dify` with clear labeling

**Given** the middleware configuration
**When** I review protected paths
**Then** `/chat` and all sub-routes remain protected (requires authentication)

**Tasks:**
- [ ] Create `src/app/[locale]/(auth)/chat/dify/` directory
- [ ] Move `src/app/[locale]/(auth)/chat/page.tsx` → `chat/dify/page.tsx`
- [ ] Move `src/app/[locale]/(auth)/chat/[threadId]/` → `chat/dify/[threadId]/`
- [ ] Move `src/app/[locale]/(auth)/chat/error.tsx` → `chat/dify/error.tsx`
- [ ] Create `src/app/[locale]/(auth)/chat/page.tsx` as redirect or selection page
- [ ] Update navigation links to point to `/chat/dify`
- [ ] Update any hardcoded `/chat` links in components
- [ ] Verify middleware `protectedPaths` covers `/chat/*` pattern
- [ ] Update any tests referencing `/chat` route
- [ ] Rename `/api/chat` to `/api/chat/dify` (or keep as-is with clear docs)

---

## Story 10.2: Clean Up Dify Chat Code

As a **template user (developer)**,
I want **the Dify chat feature to be clean, generic, and well-organized**,
So that **I can learn from it or easily remove it**.

**Acceptance Criteria:**

**Given** the existing chat implementation
**When** I review the code
**Then** all HealthCompanion-specific references are removed
**And** component names are generic (ChatInterface, ChatMessage, etc.)
**And** code follows template coding standards

**Given** the chat components
**When** I review `src/components/chat/`
**Then** components are well-structured
**And** each component has a single responsibility
**And** props are properly typed with TypeScript
**And** no dead code or unused imports

**Given** the chat API route
**When** I review `src/app/api/chat/dify/`
**Then** route is clean and well-commented
**And** error handling is comprehensive
**And** environment variables are documented
**And** no hardcoded values

**Given** the Dify client
**When** I review `src/libs/dify/`
**Then** client is well-structured
**And** types are properly defined
**And** timeout and error handling are robust
**And** SSE parsing is correct

**Given** the chat feature
**When** I test it locally (with Dify configured)
**Then** chat interface loads correctly
**And** messages can be sent
**And** streaming responses display properly
**And** conversation history persists

**Given** the chat feature
**When** Dify is NOT configured
**Then** chat page shows appropriate message
**And** no errors are thrown
**And** user understands setup is required

---

## Story 10.3: Database Schema Consolidation

As a **template user (developer)**,
I want **all database tables under a unified `vt_saas` schema**,
So that **the template has consistent naming and both chat implementations coexist cleanly**.

**Schema Strategy:**
- Rename `healthCompanionSchema` → `vtSaasSchema` in code
- Change `pgSchema('health_companion')` → `pgSchema('vt_saas')`
- All tables (`threads` + new Vercel tables) under `vt_saas` schema
- Old `health_companion` schema is **abandoned** (not deleted, not migrated)
- Fresh start for all deployments

**Acceptance Criteria:**

**Given** the schema changes
**When** I run `npm run db:generate`
**Then** migration creates new `vt_saas` schema with all tables
**And** no errors occur during generation

**Given** the renamed schema
**When** I review `src/models/Schema.ts`
**Then** `healthCompanionSchema` is renamed to `vtSaasSchema`
**And** `threads` table is under `vtSaasSchema`
**And** all new Vercel tables are under `vtSaasSchema`

**Given** the new tables
**When** I review the schema
**Then** `threads` table exists in `vt_saas` schema (Dify chat)
**And** `vercel_conversations` table exists (Vercel chat)
**And** `vercel_messages` table exists with foreign key to conversations
**And** `mem0_memories` table exists for memory storage
**And** `memory_extraction_jobs` table exists for async processing

**Given** the schema design
**When** I review indexes
**Then** appropriate indexes exist for query performance
**And** indexes follow naming convention `idx_{table}_{column}`

**Given** TypeScript types
**When** I use the schema in code
**Then** inferred types are available (`Thread`, `VercelConversation`, `VercelMessage`, etc.)

**Tasks:**
- [ ] Rename `healthCompanionSchema` to `vtSaasSchema` in `src/models/Schema.ts`
- [ ] Change `pgSchema('health_companion')` to `pgSchema('vt_saas')`
- [ ] Keep `threads` table definition (now under `vtSaasSchema`)
- [ ] Add new Vercel chat table definitions
- [ ] Run `npm run db:generate` to create migration
- [ ] Verify migration creates `vt_saas` schema with all tables
- [ ] Test schema with sample data insertion
- [ ] Update any imports referencing `healthCompanionSchema`

---

## Story 10.4: Vercel AI SDK Chat API

As a **template user (developer)**,
I want **a streaming chat API using Vercel AI SDK**,
So that **I can build chat features with full control over the LLM integration**.

**Acceptance Criteria:**

**Given** an authenticated user
**When** I POST to `/api/chat/vercel` with a message
**Then** I receive a streaming SSE response
**And** the response format matches Vercel AI SDK `useChat` expectations

**Given** a new conversation
**When** I send the first message
**Then** a new conversation record is created in the database
**And** the message is persisted with role='user'
**And** the assistant response is persisted with role='assistant'

**Given** an existing conversation
**When** I send a message with `conversationId`
**Then** messages are appended to the existing conversation
**And** `updatedAt` timestamp is refreshed

**Given** an unauthenticated request
**When** I POST to `/api/chat/vercel`
**Then** I receive 401 Unauthorized
**And** error format matches API conventions

**Given** the conversation metadata
**When** I review stored data
**Then** `tokenCount` is tracked per message
**And** `latencyMs` is recorded for assistant responses

**Tasks:**
- [ ] Create `/api/chat/vercel/route.ts` with POST handler
- [ ] Implement Vercel AI SDK streaming with `streamText`
- [ ] Add message persistence to database
- [ ] Implement conversation creation/retrieval logic
- [ ] Add token counting and latency tracking
- [ ] Handle errors with standard API error format

---

## Story 10.5: LangFuse Integration

As a **template user (developer)**,
I want **all LLM calls traced in LangFuse**,
So that **I can debug, monitor costs, and analyze chat performance**.

**Acceptance Criteria:**

**Given** LangFuse is configured
**When** I make a chat request
**Then** a trace appears in LangFuse dashboard
**And** trace includes user ID and conversation ID

**Given** the trace data
**When** I view it in LangFuse
**Then** I see prompt and completion text
**And** I see token counts
**And** I see latency metrics
**And** I see model used

**Given** LangFuse is NOT configured
**When** I make a chat request
**Then** chat still works (graceful degradation)
**And** a warning is logged about missing LangFuse config

**Given** the integration
**When** I review the code
**Then** LangFuse client is in `src/libs/langfuse/`
**And** setup instructions are documented

**Tasks:**
- [ ] Create `src/libs/langfuse/client.ts` with initialization
- [ ] Add LangFuse tracing to chat API route
- [ ] Pass user ID and conversation ID to traces
- [ ] Implement graceful degradation when not configured
- [ ] Add env vars to `.env.example` with documentation

---

## Story 10.6: Mem0 Memory Integration (Opt-in)

As a **template user (developer)**,
I want **automatic memory extraction from conversations**,
So that **the AI can remember facts about users across sessions**.

**Acceptance Criteria:**

**Given** `ENABLE_MEM0=true`
**When** a conversation completes
**Then** a memory extraction job is queued
**And** job status is 'pending' in database

**Given** a pending extraction job
**When** the extraction worker runs
**Then** memories are extracted via Mem0 API
**And** memories are stored in `mem0_memories` table
**And** job status updates to 'completed'

**Given** an active conversation
**When** the user sends a message
**Then** relevant memories are fetched
**And** memories are injected into system prompt context

**Given** `ENABLE_MEM0=false` (default)
**When** a conversation occurs
**Then** no memory extraction happens
**And** no errors occur
**And** chat functions normally

**Given** a memory extraction failure
**When** the job fails
**Then** job status is 'failed'
**And** error message is recorded
**And** other jobs continue processing

**Tasks:**
- [ ] Create `src/libs/mem0/client.ts` with conditional initialization
- [ ] Implement `queueMemoryExtraction` function
- [ ] Implement `processMemoryExtractionJobs` worker function
- [ ] Add memory retrieval and injection to chat flow
- [ ] Create cron endpoint or trigger for job processing
- [ ] Add env vars to `.env.example`

---

## Story 10.7: Vercel Chat UI

As a **template user (developer)**,
I want **a chat interface at `/chat/vercel`**,
So that **I can interact with the Vercel AI SDK chat and see my conversation history**.

**Route Structure:**
```
src/app/[locale]/(auth)/chat/vercel/
├── page.tsx                    # Conversation list + new chat
├── [conversationId]/
│   └── page.tsx                # Specific conversation view
└── error.tsx                   # Error boundary
```

**Acceptance Criteria:**

**Given** an authenticated user
**When** I navigate to `/chat/vercel`
**Then** I see a conversation list sidebar (left)
**And** I see a chat message area (right)
**And** I can start a new conversation

**Given** an existing conversation
**When** I click on it in the sidebar
**Then** the URL updates to `/chat/vercel/[conversationId]`
**And** messages load in the chat area
**And** I can continue the conversation

**Given** a direct URL to a conversation
**When** I navigate to `/chat/vercel/[conversationId]`
**Then** that conversation loads directly
**And** the sidebar shows it as selected

**Given** the streaming response
**When** the AI responds
**Then** text appears incrementally (streaming effect)
**And** typing indicator shows during generation

**Given** the conversation list
**When** I have multiple conversations
**Then** they are sorted by last updated
**And** I see title and preview text
**And** I can archive or delete conversations

**Given** an unauthenticated user
**When** they try to access `/chat/vercel`
**Then** they are redirected to sign-in

**UX Design:**
- **Approach:** Direct component mapping (reuse `@assistant-ui/react-ai-sdk`)
- **See:** [Component Strategy](../ux-design/epic-10-vercel-chat-component-strategy.md)

**Tasks:**
- [ ] Create `src/app/[locale]/(auth)/chat/vercel/page.tsx`
- [ ] Create `src/app/[locale]/(auth)/chat/vercel/[conversationId]/page.tsx`
- [ ] Create `src/app/[locale]/(auth)/chat/vercel/error.tsx`
- [ ] Create `src/components/chat/vercel/` component directory
- [ ] Implement `VercelChatInterface.tsx` with `useChat` hook
- [ ] Implement `ConversationList.tsx` sidebar component
- [ ] Implement `MessageList.tsx` for message display
- [ ] Add conversation CRUD operations (create, archive, delete)
- [ ] Style with existing design system (shadcn/ui)

---

## Story 10.8: Conversation Management API

As a **template user (developer)**,
I want **API endpoints to manage conversations**,
So that **I can list, view, update, and delete my chat history**.

**Acceptance Criteria:**

**Given** an authenticated user
**When** I GET `/api/chat/vercel/conversations`
**Then** I receive a list of my conversations
**And** conversations are sorted by `updatedAt` descending

**Given** a conversation ID
**When** I GET `/api/chat/vercel/conversations/[id]`
**Then** I receive the conversation with all messages
**And** messages are sorted by `createdAt` ascending

**Given** a conversation
**When** I PATCH `/api/chat/vercel/conversations/[id]` with title
**Then** the title is updated
**And** response includes updated conversation

**Given** a conversation
**When** I DELETE `/api/chat/vercel/conversations/[id]`
**Then** the conversation is deleted
**And** all associated messages are deleted (cascade)

**Given** another user's conversation
**When** I try to access it
**Then** I receive 404 Not Found (not 403, for security)

**Tasks:**
- [ ] Create `/api/chat/vercel/conversations/route.ts` (GET list)
- [ ] Create `/api/chat/vercel/conversations/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Implement user ownership validation
- [ ] Add pagination to list endpoint
- [ ] Follow API response format conventions

---

## Story 10.9: Navigation & Showcase Update

As a **template user (developer)**,
I want **both chat implementations accessible from navigation**,
So that **I can easily compare and test both options**.

**Acceptance Criteria:**

**Given** the main navigation
**When** I view the chat section
**Then** I see options for both "Chat (Dify)" and "Chat (AI SDK)"
**And** labels clearly differentiate the two

**Given** no chat configuration
**When** Dify is not configured but Vercel AI SDK is
**Then** only the configured option is shown
**And** unconfigured option shows "Setup Required" or is hidden

**Given** the dashboard or landing page
**When** I look for chat features
**Then** both options are discoverable
**And** brief descriptions explain the difference

**Tasks:**
- [ ] Update navigation component with both chat links
- [ ] Add conditional rendering based on configuration status
- [ ] Update any dashboard chat widgets or CTAs
- [ ] Ensure consistent labeling across UI

---

## Story 10.10: Document SSE Streaming Patterns

As a **template user (developer)**,
I want **clear documentation of the SSE streaming implementation**,
So that **I can understand and adapt the pattern for my needs**.

**Acceptance Criteria:**

**Given** the SSE documentation
**When** I read it
**Then** I understand what Server-Sent Events are
**And** I understand why SSE was chosen (vs WebSocket)
**And** I understand the benefits for AI streaming

**Given** the streaming implementation docs
**When** I review the technical details
**Then** server-side streaming is explained
**And** client-side consumption is explained
**And** code snippets are provided for both

**Given** the API route streaming pattern
**When** I review the documentation
**Then** I see how to create a streaming response
**And** I see how to handle chunked data
**And** I see proper headers for SSE
**And** I see error handling patterns

**Given** the client-side streaming pattern
**When** I review the documentation
**Then** I see how to consume SSE in React
**And** I see state management for streaming messages
**And** I see how to handle connection errors
**And** I see how to implement cancel/abort

**Given** the documentation location
**When** I look for it
**Then** docs are in `docs/patterns/sse-streaming.md` or similar
**And** docs are linked from main README
**And** docs include "Learn More" resources

**Given** code comments in implementation
**When** I read the chat code
**Then** key patterns have inline comments
**And** comments reference the documentation
**And** complex logic is explained

---

## Story 10.11: Document API Proxy Pattern

As a **template user (developer)**,
I want **clear documentation of the API proxy pattern**,
So that **I can securely integrate other external APIs**.

**Acceptance Criteria:**

**Given** the API proxy documentation
**When** I read it
**Then** I understand why proxying is needed (security)
**And** I understand the pattern: client → Next.js API → external service
**And** I understand never exposing API keys to client

**Given** the proxy implementation docs
**When** I review the technical details
**Then** request flow is explained with diagram
**And** authentication passthrough is explained
**And** error handling and mapping is explained
**And** timeout and retry patterns are covered

**Given** the Dify proxy as example
**When** I review the documentation
**Then** I see the complete implementation explained
**And** I see how API key is kept server-side
**And** I see how user session is validated
**And** I see how responses are proxied/transformed

**Given** adapting for other services
**When** I want to proxy a different API
**Then** documentation includes adaptation guide
**And** guide shows: new route, env vars, client wrapper
**And** common patterns (REST, GraphQL) are mentioned

**Given** security considerations
**When** I review the documentation
**Then** I see why NEXT_PUBLIC_ vars are dangerous for secrets
**And** I see proper env var handling
**And** I see input validation recommendations
**And** I see rate limiting considerations

**Given** the documentation location
**When** I look for it
**Then** docs are in `docs/patterns/api-proxy.md` or similar
**And** docs are linked from main README
**And** docs reference the SSE streaming docs where relevant

---

## Story 10.12: Feature Removal Guides

As a **template user (developer)**,
I want **clear instructions for removing either or both chat implementations**,
So that **I can cleanly remove what I don't need**.

**Acceptance Criteria:**

### Removing Dify Chat

**Given** the Dify removal guide
**When** I follow it
**Then** I delete `src/components/chat/dify/` (if separated)
**And** I delete `src/app/[locale]/(auth)/chat/dify/`
**And** I delete `src/app/api/chat/dify/`
**And** I delete `src/libs/dify/`
**And** I remove Dify env vars from `.env.example`
**And** I update navigation to remove Dify link

### Removing Vercel AI SDK Chat

**Given** the Vercel removal guide
**When** I follow it
**Then** I delete `src/components/chat/vercel/`
**And** I delete `src/app/[locale]/(auth)/chat/vercel/`
**And** I delete `src/app/api/chat/vercel/`
**And** I delete `src/libs/langfuse/`
**And** I delete `src/libs/mem0/`
**And** I remove Vercel/LangFuse/Mem0 env vars from `.env.example`
**And** I update navigation to remove Vercel link

### Removing All Chat

**Given** the complete chat removal guide
**When** I follow it
**Then** I delete entire `src/components/chat/` directory
**And** I delete entire `src/app/[locale]/(auth)/chat/` directory
**And** I delete entire `src/app/api/chat/` directory
**And** I delete `src/libs/dify/`, `src/libs/langfuse/`, `src/libs/mem0/`
**And** I remove all chat-related env vars
**And** I remove chat navigation entirely

### Database Cleanup

**Given** schema changes needed
**When** I remove chat features
**Then** guide explains which tables to remove from schema
**And** guide provides migration commands
**And** guide warns about data loss

### Dependency Cleanup

**Given** packages to remove
**When** I complete removal
**Then** guide lists packages that can be uninstalled
**And** `npm uninstall` commands are provided
**And** guide notes which packages are shared vs chat-specific

### Verification

**Given** removal is complete
**When** I verify the cleanup
**Then** `npm run build` passes
**And** `npm run check-types` passes
**And** no broken imports exist

**Tasks:**
- [ ] Create `docs/customization/removing-dify-chat.md`
- [ ] Create `docs/customization/removing-vercel-chat.md`
- [ ] Create `docs/customization/removing-all-chat.md`
- [ ] Include file/folder checklists in each guide
- [ ] Include schema migration instructions
- [ ] Include dependency cleanup commands
- [ ] Link guides from main README

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `ai` | ^4.x | Vercel AI SDK core |
| `@ai-sdk/openai` | ^1.x | OpenAI provider |
| `@ai-sdk/anthropic` | ^1.x | Anthropic provider (optional) |
| `langfuse` | ^3.x | LLM observability |
| `mem0ai` | ^1.x | Memory extraction (optional) |

---

## Environment Variables

```bash
# Dify (existing)
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-...

# Vercel AI SDK
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o

# LangFuse (required for Vercel chat)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...

# Mem0 (optional, disabled by default)
ENABLE_MEM0=false
MEM0_API_KEY=m0-...
```

---

## Acceptance Testing

**Smoke Test Checklist:**
- [ ] `/chat/dify` loads and works (existing functionality preserved)
- [ ] `/chat/vercel` loads for authenticated users
- [ ] New conversation can be created (both implementations)
- [ ] Messages stream correctly (both implementations)
- [ ] Conversation history persists across page reloads
- [ ] Conversation list shows all user conversations
- [ ] LangFuse traces appear (when configured)
- [ ] Mem0 memories extract (when enabled)
- [ ] Unauthenticated users redirected to sign-in
- [ ] Navigation shows both options appropriately

---

## Related Documents

- [Architecture: Chat Module](../architecture/chat-module-architecture.md)
- [Implementation Patterns](../architecture/implementation-patterns-consistency-rules.md)
