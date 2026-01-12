# VT SaaS Template - API Contracts

**Generated:** 2026-01-02
**API Version:** 1.0
**Base URL:** `/api`
**Authentication:** Required (Supabase session cookies)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Chat API](#chat-api)
   - [Threads API](#threads-api)
6. [Data Models](#data-models)
7. [Response Formats](#response-formats)

---

## Overview

The VT SaaS Template API provides endpoints for AI-powered conversations and thread management. All endpoints require authentication via Supabase session cookies.

**API Design Principles:**
- **RESTful:** Standard HTTP methods (GET, POST, PATCH, DELETE)
- **JSON:** Request and response bodies use JSON format
- **SSE Streaming:** Chat endpoint uses Server-Sent Events for real-time responses
- **Server-Side Auth:** All endpoints validate Supabase session server-side
- **Error Codes:** Consistent error code format for client handling

**Total Endpoints:** 5

---

## Authentication

### Authentication Method

**Type:** Cookie-based session (Supabase Auth)

**Flow:**
1. User signs in via Supabase Auth (`/sign-in`)
2. Session cookie set by Supabase
3. API requests include session cookie automatically
4. Server validates session on each request

### Session Validation

All API routes validate authentication using:

```typescript
const supabase = createClient(cookies());
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return { error: 'Unauthorized', code: 'AUTH_REQUIRED' }, status: 401
}
```

### Unauthorized Responses

All endpoints return `401 Unauthorized` for missing or invalid sessions:

```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {} // Optional: Validation errors, stack traces (dev only)
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid session |
| `INVALID_REQUEST` | 400 | Malformed request body or parameters |
| `VALIDATION_ERROR` | 400 | Request validation failed (Zod schema) |
| `MESSAGE_TOO_LONG` | 400 | Chat message exceeds 10,000 characters |
| `INVALID_CONVERSATION_ID` | 400 | Conversation ID format invalid |
| `NOT_FOUND` | 404 | Resource not found or access denied |
| `DUPLICATE_CONVERSATION_ID` | 409 | Thread with conversation_id already exists |
| `DB_ERROR` | 500 | Database operation failed |
| `DIFY_ERROR` | 500+ | Dify API error (proxied status code) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

**Current Status:** Not implemented

**Future Considerations:**
- 60 requests/minute per user
- Exponential backoff for Dify API errors
- Request queuing during peak load
- Upstash Redis for distributed rate limiting

---

## API Endpoints

### Chat API

#### POST /api/chat

**Purpose:** Send chat message to AI and receive streaming response

**Authentication:** Required

**Request Body:**
```json
{
  "message": "string (required, max 10,000 chars)",
  "conversationId": "string (optional, alphanumeric + hyphens, max 128 chars)"
}
```

**Validation Rules:**
- `message`: Required, string, 1-10,000 characters
- `conversationId`: Optional, string, alphanumeric + hyphens, max 128 chars, matches pattern `/^[a-z0-9-]{1,128}$/i`

**Response Type:** Server-Sent Events (text/event-stream)

**Response Headers:**
```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**SSE Event Format:**
```
event: message
data: {"type":"answer","content":"Hello..."}

event: message
data: {"type":"answer","content":" how can I help"}

event: done
data: {"conversation_id":"abc-123-def","message_id":"msg-456"}
```

**SSE Event Types:**

| Event Type | Data Fields | Description |
|------------|-------------|-------------|
| `message` | `{type: "answer", content: string}` | Streaming answer chunk |
| `done` | `{conversation_id: string, message_id: string}` | Conversation complete |
| `error` | `{error: string}` | Error during processing |

**Success Response:**
- HTTP 200 with SSE stream
- Stream starts immediately
- Events sent as AI generates response
- `done` event signals completion

**Error Responses:**

| Status | Code | Scenario |
|--------|------|----------|
| 400 | `INVALID_REQUEST` | Missing or invalid `message` |
| 400 | `MESSAGE_TOO_LONG` | Message exceeds 10,000 characters |
| 400 | `INVALID_CONVERSATION_ID` | Invalid conversation ID format |
| 401 | `AUTH_REQUIRED` | Unauthenticated request |
| 500 | `DIFY_ERROR` | Dify API error (proxied) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Side Effects:**
- Asynchronously creates/updates thread in database
- Thread creation happens after stream completes (fire-and-forget)
- Thread creation errors don't affect chat response

**Example Request:**
```bash
curl -X POST /api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the benefits of regular exercise?",
    "conversationId": "conv-abc-123"
  }'
```

**Example Success Response:**
```
data: {"type":"answer","content":"Regular"}

data: {"type":"answer","content":" exercise"}

data: {"type":"answer","content":" has many"}

data: {"type":"answer","content":" benefits..."}

data: {"conversation_id":"conv-abc-123","message_id":"msg-789"}
```

---

### Threads API

#### GET /api/threads

**Purpose:** Fetch all threads for authenticated user

**Authentication:** Required

**Query Parameters:** None

**Response:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "userId": "uuid",
      "conversationId": "string",
      "title": "string | null",
      "lastMessagePreview": "string | null",
      "archived": "boolean",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ],
  "count": "number"
}
```

**Sorting:** Threads ordered by `updatedAt` DESC (most recent first)

**Filtering:**
- Only returns threads owned by authenticated user (enforced via database query)
- Archived threads excluded by default

**Success Response:**
- HTTP 200
- Array of thread objects
- Empty array if no threads

**Error Responses:**

| Status | Code | Scenario |
|--------|------|----------|
| 401 | `AUTH_REQUIRED` | Unauthenticated request |
| 500 | `DB_ERROR` | Database query failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example Request:**
```bash
curl -X GET /api/threads
```

**Example Success Response:**
```json
{
  "threads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "conversationId": "conv-abc-123",
      "title": "Exercise and health benefits",
      "lastMessagePreview": "Regular exercise has many benefits including...",
      "archived": false,
      "createdAt": "2026-01-02T10:30:00.000Z",
      "updatedAt": "2026-01-02T11:45:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### POST /api/threads

**Purpose:** Create new thread

**Authentication:** Required

**Request Body:**
```json
{
  "conversationId": "string (required)",
  "title": "string (optional)"
}
```

**Validation Schema (Zod):**
```typescript
{
  conversationId: z.string().min(1, 'Conversation ID is required'),
  title: z.string().optional()
}
```

**Response:**
```json
{
  "thread": {
    "id": "uuid",
    "userId": "uuid",
    "conversationId": "string",
    "title": "string | null",
    "lastMessagePreview": null,
    "archived": false,
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

**Success Response:**
- HTTP 201 Created
- Returns created thread object

**Error Responses:**

| Status | Code | Scenario |
|--------|------|----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `conversationId` |
| 401 | `AUTH_REQUIRED` | Unauthenticated request |
| 409 | `DUPLICATE_CONVERSATION_ID` | Thread with this conversation ID already exists |
| 500 | `DB_ERROR` | Database insert failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example Request:**
```bash
curl -X POST /api/threads \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-new-456",
    "title": "New health conversation"
  }'
```

**Example Success Response:**
```json
{
  "thread": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "user-123",
    "conversationId": "conv-new-456",
    "title": "New health conversation",
    "lastMessagePreview": null,
    "archived": false,
    "createdAt": "2026-01-02T12:00:00.000Z",
    "updatedAt": "2026-01-02T12:00:00.000Z"
  }
}
```

---

#### PATCH /api/threads/[id]

**Purpose:** Update thread title and/or last message preview

**Authentication:** Required

**URL Parameters:**
- `id` (string, UUID): Thread ID

**Request Body:**
```json
{
  "title": "string (optional)",
  "lastMessagePreview": "string (optional)"
}
```

**Validation Schema (Zod):**
```typescript
{
  title: z.string().optional(),
  lastMessagePreview: z.string().optional()
}
```

**Response:**
```json
{
  "thread": {
    "id": "uuid",
    "userId": "uuid",
    "conversationId": "string",
    "title": "string | null",
    "lastMessagePreview": "string | null",
    "archived": "boolean",
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

**Success Response:**
- HTTP 200
- Returns updated thread object
- `updatedAt` timestamp automatically updated

**Error Responses:**

| Status | Code | Scenario |
|--------|------|----------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `AUTH_REQUIRED` | Unauthenticated request |
| 404 | `NOT_FOUND` | Thread not found or not owned by user |
| 500 | `DB_ERROR` | Database update failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Authorization:**
- User can only update their own threads
- Database RLS (Row-Level Security) enforces ownership

**Example Request:**
```bash
curl -X PATCH /api/threads/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated conversation title"
  }'
```

**Example Success Response:**
```json
{
  "thread": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "conversationId": "conv-abc-123",
    "title": "Updated conversation title",
    "lastMessagePreview": "Regular exercise has many benefits...",
    "archived": false,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T12:15:00.000Z"
  }
}
```

---

#### DELETE /api/threads/[id]

**Purpose:** Permanently delete a thread

**Authentication:** Required

**URL Parameters:**
- `id` (string, UUID): Thread ID

**Request Body:** None

**Success Response:**
- HTTP 204 No Content
- Empty response body

**Error Responses:**

| Status | Code | Scenario |
|--------|------|----------|
| 401 | `AUTH_REQUIRED` | Unauthenticated request |
| 404 | `NOT_FOUND` | Thread not found or not owned by user |
| 500 | `DB_ERROR` | Database delete failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Authorization:**
- User can only delete their own threads
- Database RLS enforces ownership

**Side Effects:**
- Thread permanently deleted from database
- Cannot be recovered
- Associated Dify conversation remains (managed externally)

**Example Request:**
```bash
curl -X DELETE /api/threads/550e8400-e29b-41d4-a716-446655440000
```

**Example Success Response:**
```
HTTP/1.1 204 No Content
```

---

#### POST /api/threads/[id]/archive

**Purpose:** Archive or unarchive a thread

**Authentication:** Required

**URL Parameters:**
- `id` (string, UUID): Thread ID

**Request Body:**
```json
{
  "archived": "boolean (required)"
}
```

**Response:**
```json
{
  "thread": {
    "id": "uuid",
    "userId": "uuid",
    "conversationId": "string",
    "title": "string | null",
    "lastMessagePreview": "string | null",
    "archived": "boolean",
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

**Success Response:**
- HTTP 200
- Returns updated thread with `archived` status

**Error Responses:**

| Status | Code | Scenario |
|--------|------|----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `archived` field |
| 401 | `AUTH_REQUIRED` | Unauthenticated request |
| 404 | `NOT_FOUND` | Thread not found or not owned by user |
| 500 | `DB_ERROR` | Database update failed |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Example Request:**
```bash
curl -X POST /api/threads/550e8400-e29b-41d4-a716-446655440000/archive \
  -H "Content-Type: application/json" \
  -d '{
    "archived": true
  }'
```

**Example Success Response:**
```json
{
  "thread": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "conversationId": "conv-abc-123",
    "title": "Exercise and health benefits",
    "lastMessagePreview": "Regular exercise has many benefits...",
    "archived": true,
    "createdAt": "2026-01-02T10:30:00.000Z",
    "updatedAt": "2026-01-02T12:30:00.000Z"
  }
}
```

---

## Data Models

### Thread

```typescript
interface Thread {
  id: string;                    // UUID, primary key
  userId: string;                // UUID, references Supabase auth.users
  conversationId: string;        // Dify conversation ID (unique)
  title: string | null;          // Thread title (nullable)
  lastMessagePreview: string | null; // Last message preview (100 chars max)
  archived: boolean;             // Archive status (default: false)
  createdAt: string;             // ISO8601 timestamp
  updatedAt: string;             // ISO8601 timestamp (auto-updated)
}
```

### Chat Message (SSE Event)

```typescript
interface ChatMessageEvent {
  type: "answer";
  content: string;               // Message chunk
}

interface ChatDoneEvent {
  conversation_id: string;       // Dify conversation ID
  message_id: string;            // Dify message ID
}
```

---

## Response Formats

### Success Response

**Format:**
```json
{
  "data_field": "value",
  "another_field": "value"
}
```

**Example:**
```json
{
  "thread": { /* thread object */ }
}
```

### Error Response

**Format:**
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {} // Optional
}
```

**Example:**
```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

### Validation Error Response

**Format:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Field is required"
    }
  ]
}
```

**Example:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["conversationId"],
      "message": "Conversation ID is required"
    }
  ]
}
```

---

## Implementation Notes

### Security

**API Key Protection:**
- Dify API key stored server-side only
- Never exposed to client
- Proxied through `/api/chat` endpoint

**Session Validation:**
- All endpoints validate Supabase session
- Row-Level Security (RLS) enforced at database level
- Users can only access their own threads

### Performance

**Database Queries:**
- Indexed on `userId`, `conversationId`, `archived`
- Composite index on `(userId, archived)` for efficient filtering

**Streaming:**
- SSE for real-time chat responses
- Minimal latency between Dify and client
- Transform stream captures metadata without blocking

### Monitoring

**Logging:**
- Pino logger for structured logs
- Log levels: debug, info, warn, error

**Error Tracking:**
- Sentry integration
- Breadcrumbs for debugging
- Exception capture with context

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
