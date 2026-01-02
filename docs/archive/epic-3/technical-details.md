# Technical Details

## Database Schema Design

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

## API Endpoint Specifications

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

## State Synchronization Strategy

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

## Error Handling Strategies

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

## Performance Considerations

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

## Security Considerations

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
