# Dify Integration Documentation

This directory contains the Dify AI API integration for Health Companion.

## Overview

Dify is the AI backend that powers the chat functionality in Health Companion. The integration uses streaming Server-Sent Events (SSE) to provide real-time responses to user messages.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│  /api/chat   │─────▶│  Dify API   │
│  (Browser)  │◀─────│   (Proxy)    │◀─────│  (External) │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           │ SSE Stream
                           ▼
                    ┌──────────────┐
                    │ Chat UI      │
                    │ (Assistant)  │
                    └──────────────┘
```

### Why Use a Proxy?

The `/api/chat` endpoint acts as a proxy between the client and Dify API for several important reasons:

1. **Security**: Keeps the Dify API key server-side only, never exposing it to client code
2. **Authentication**: Validates Supabase session before allowing chat access
3. **Rate Limiting**: Centralizes control for implementing rate limits (future work)
4. **Request Validation**: Validates message content and conversation IDs before proxying
5. **Error Handling**: Provides consistent error responses to the client

## Files

- **`client.ts`**: Dify API client with SSE streaming support
- **`types.ts`**: TypeScript type definitions for Dify API requests and responses
- **`README.md`**: This documentation file

## Event Schema

Dify uses Server-Sent Events (SSE) for streaming responses. Each event is sent in the following format:

```
data: {JSON_EVENT_DATA}

```

### Event Types

#### 1. `message` Event

Sent during message streaming. May be sent multiple times as the AI generates content progressively.

**Structure:**
```typescript
{
  event: 'message',
  message_id: string,
  conversation_id?: string,
  answer: string,  // Partial or complete message content
  created_at?: number,
  task_id?: string
}
```

**Example:**
```
data: {"event":"message","message_id":"msg-abc123","conversation_id":"conv-xyz","answer":"Hello! How can I"}

data: {"event":"message","message_id":"msg-abc123","answer":" help you today?"}

```

**Client Handling:**
- Accumulate `answer` chunks to build the complete message
- Update UI progressively as chunks arrive
- Extract `conversation_id` for context preservation

#### 2. `message_end` Event

Signals completion of message streaming.

**Structure:**
```typescript
{
  event: 'message_end',
  message_id: string,
  conversation_id?: string,
  metadata?: {
    usage: {
      prompt_tokens: number,
      completion_tokens: number,
      total_tokens: number,
      // ... additional usage metrics
    }
  }
}
```

**Example:**
```
data: {"event":"message_end","message_id":"msg-abc123","conversation_id":"conv-xyz"}

```

**Client Handling:**
- Store `conversation_id` for subsequent requests
- Stop loading indicators
- Process usage metrics if needed

#### 3. `error` Event

Sent when an error occurs during message processing.

**Structure:**
```typescript
{
  event: 'error',
  status: number,
  code: string,
  message: string
}
```

**Example:**
```
data: {"event":"error","status":429,"code":"RATE_LIMIT_EXCEEDED","message":"Too many requests"}

```

**Client Handling:**
- Display error message to user
- Stop loading indicators
- Log error details for debugging

#### 4. `ping` Event

Keep-alive event to maintain SSE connection.

**Structure:**
```typescript
{
  event: 'ping'
}
```

**Example:**
```
data: {"event":"ping"}

```

**Client Handling:**
- Typically ignored
- Can be used to detect connection status

## Conversation Context

Dify maintains conversation context using `conversation_id`. The flow works as follows:

1. **First Message**: Client sends message without `conversation_id`
2. **Response**: Dify returns `conversation_id` in the response
3. **Follow-up Messages**: Client includes `conversation_id` in subsequent requests
4. **Context**: Dify uses the ID to maintain conversation history and context

**Request Example:**
```typescript
// First message
{
  query: "What are healthy breakfast options?",
  user: "user-123",
  response_mode: "streaming"
  // No conversation_id
}

// Follow-up message
{
  query: "Tell me more about oatmeal",
  user: "user-123",
  response_mode: "streaming",
  conversation_id: "conv-xyz"  // From previous response
}
```

## Usage Example

### Server-Side (API Route)

```typescript
import { createDifyClient } from '@/libs/dify/client';
import type { DifyChatRequest } from '@/libs/dify/types';

export async function POST(request: Request) {
  const { message, conversationId } = await request.json();

  const difyClient = createDifyClient();
  const difyRequest: DifyChatRequest = {
    query: message,
    user: userId,
    response_mode: 'streaming',
    conversation_id: conversationId,
    inputs: {},
  };

  const stream = await difyClient.chatMessages(difyRequest);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client-Side (Chat Adapter)

```typescript
import type { DifyStreamEvent } from '@/libs/dify/types';

async *run({ messages }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: lastMessage.content,
      conversationId,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;

      const data = line.slice(6);
      const event: DifyStreamEvent = JSON.parse(data);

      if (event.event === 'message' && event.answer) {
        fullText += event.answer;
        yield { content: [{ type: 'text', text: fullText }] };
      } else if (event.event === 'message_end') {
        if (event.conversation_id) {
          setConversationId(event.conversation_id);
        }
      } else if (event.event === 'error') {
        throw new Error(event.message);
      }
    }
  }
}
```

## Testing

### Unit Tests

Located in `tests/integration/api/chat.test.ts` - validates API route behavior.

### Integration Tests

Located in `tests/integration/dify-events.test.ts` - validates event type handling and parsing.

### E2E Tests

Located in `tests/e2e/chat.spec.ts` - validates end-to-end chat functionality with mocked Dify responses.

**Mock Fixtures:** Use the reusable fixtures from `tests/e2e/fixtures/dify-mocks.ts` to ensure consistency between tests.

Example:
```typescript
import { MockResponses } from './fixtures/dify-mocks';

await page.route('**/api/chat', async (route) => {
  await route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
    body: MockResponses.healthAdvice(),
  });
});
```

## Common Issues

### Event Type Mismatches

**Problem:** Tests fail because mocks use incorrect event types (e.g., `"agent_message"` instead of `"message"`).

**Solution:** Always use the correct event types defined in `types.ts`:
- ✅ `"message"` (correct)
- ❌ `"agent_message"` (incorrect)

Use the mock fixtures to avoid these issues.

### Missing Conversation Context

**Problem:** Follow-up messages don't maintain context.

**Solution:** Ensure you:
1. Extract `conversation_id` from `message_end` events
2. Include it in subsequent requests
3. Store it in component state or localStorage

### Empty AI Responses

**Problem:** AI messages appear empty in the UI.

**Solution:** Check that:
1. You're handling `event === 'message'` (not `'agent_message'`)
2. You're accumulating chunks by appending to `fullText`
3. You're yielding content progressively

## Environment Variables

```bash
# Required
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-api-key-here
```

**Security Note:** Never commit API keys to version control. Use `.env.local` for sensitive values.

## API Reference

### Dify Chat Messages API

**Endpoint:** `POST /v1/chat-messages`

**Headers:**
```
Authorization: Bearer {DIFY_API_KEY}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  query: string,              // Required: User message
  user: string,               // Required: User identifier
  response_mode: 'streaming', // Required: Always 'streaming' for SSE
  conversation_id?: string,   // Optional: For context preservation
  inputs?: Record<string, any> // Optional: Additional parameters
}
```

**Response:** Server-Sent Events stream (see Event Schema above)

## Additional Resources

- [Dify Official Documentation](https://docs.dify.ai/)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Assistant UI Documentation](https://www.assistant-ui.com/)
