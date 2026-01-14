# Epic 11: Vercel AI SDK Chat with Observability & Memory

**Goal:** Template users have an alternative chat implementation with full local control, observability, and optional persistent memory

## Overview

This epic adds a second chat implementation alongside the existing Dify chat, giving downstream developers flexibility to choose their stack:

| Stack | Use Case |
|-------|----------|
| **Dify** (`/chat/dify`) | Simple, managed, minimal setup |
| **Vercel AI SDK** (`/chat/vercel`) | Full control, observable, extensible |

**Key Components:**
- Vercel AI SDK with OpenAI (provider-swappable)
- LangFuse for LLM observability
- Mem0 for persistent memory (opt-in)
- Local PostgreSQL storage for conversations/messages

---

## Story 11.1: Rename Existing Chat Route

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

## Story 11.2: Database Schema Consolidation

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

## Story 11.3: Vercel AI SDK Chat API

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

## Story 11.4: LangFuse Integration

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

## Story 11.5: Mem0 Memory Integration (Opt-in)

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

## Story 11.6: Vercel Chat UI

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

## Story 11.7: Conversation Management API

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

## Story 11.8: Navigation & Showcase Update

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

## Story 11.9: Developer Documentation

As a **template user (developer)**,
I want **clear documentation for the Vercel AI SDK chat**,
So that **I can configure, extend, or remove it easily**.

**Acceptance Criteria:**

**Given** the documentation
**When** I read it
**Then** I understand how to configure environment variables
**And** I understand how to swap LLM providers
**And** I understand how to enable/disable Mem0

**Given** the LangFuse section
**When** I follow setup instructions
**Then** I can create a LangFuse account and get API keys
**And** I see traces appearing in my dashboard

**Given** the Mem0 section
**When** I enable memory features
**Then** I understand the async extraction pattern
**And** I know how to run the extraction worker

**Given** the removal guide
**When** I want to remove Vercel AI SDK chat
**Then** I have a checklist of files/folders to delete
**And** I have migration commands for schema cleanup

**Tasks:**
- [ ] Create `docs/chat/vercel-ai-sdk.md` with setup guide
- [ ] Document environment variables and their purpose
- [ ] Document provider swapping (OpenAI → Anthropic)
- [ ] Document LangFuse setup and dashboard usage
- [ ] Document Mem0 setup and memory management
- [ ] Create removal checklist
- [ ] Link from main README

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
# Required
OPENAI_API_KEY=sk-...

# Optional: Provider selection
AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o

# Required: LangFuse
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...

# Optional: Mem0 (disabled by default)
ENABLE_MEM0=false
MEM0_API_KEY=m0-...
```

---

## Acceptance Testing

**Smoke Test Checklist:**
- [ ] `/chat/dify` loads and works (existing functionality preserved)
- [ ] `/chat/vercel` loads for authenticated users
- [ ] New conversation can be created
- [ ] Messages stream correctly
- [ ] Conversation history persists across page reloads
- [ ] Conversation list shows all user conversations
- [ ] LangFuse traces appear (when configured)
- [ ] Mem0 memories extract (when enabled)
- [ ] Unauthenticated users redirected to sign-in

---

## Related Documents

- [Architecture: Vercel AI SDK Chat](../architecture/vercel-ai-sdk-chat-architecture.md)
- [Epic 10: AI Chat Integration (Dify)](./epic-10-ai-chat-integration-example-module.md)
- [Implementation Patterns](../architecture/implementation-patterns-consistency-rules.md)
