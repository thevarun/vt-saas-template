# API Proxy Pattern

## Table of Contents

1. [Overview](#overview)
2. [Why Proxy APIs?](#why-proxy-apis)
3. [Architecture & Request Flow](#architecture--request-flow)
4. [Implementation Guide (Dify Example)](#implementation-guide-dify-example)
5. [Adapting for Other APIs](#adapting-for-other-apis)
6. [Security Best Practices](#security-best-practices)
7. [Error Handling & Retries](#error-handling--retries)
8. [Testing Proxy Routes](#testing-proxy-routes)
9. [Common Pitfalls](#common-pitfalls)
10. [Related Patterns](#related-patterns)

## Overview

The API proxy pattern is a server-side design pattern where your Next.js application acts as an intermediary between your client-side code and external third-party APIs. Instead of calling external APIs directly from the browser, all requests flow through a server-side API route that forwards requests and responses.

### What is an API Proxy?

An API proxy is a Next.js API route that:
1. Receives requests from your frontend
2. Validates user authentication/authorization
3. Adds sensitive credentials (API keys, tokens)
4. Forwards requests to external APIs
5. Transforms and returns responses to the client

### When to Use This Pattern

**Use API proxying when:**
- External APIs require secret keys that must not be exposed to clients
- You need to transform request/response data formats
- You want centralized rate limiting or caching
- You need consistent error handling across API integrations
- You want to monitor and log API usage centrally
- You need to aggregate data from multiple APIs

**Alternatives:**
- **Direct client-side calls**: Only for public APIs with CORS support and no authentication
- **Backend-for-Frontend (BFF)**: Separate backend service (more complex, better for microservices)
- **GraphQL Gateway**: If you're already using GraphQL (higher initial complexity)

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Proxy Pattern** | ✓ API keys stay secure<br>✓ Simple implementation<br>✓ Works with existing HTTP APIs<br>✓ Centralized control | ✗ Extra network hop<br>✗ Potential latency increase<br>✗ Server resource usage |
| **Direct Client Calls** | ✓ No server overhead<br>✓ Lower latency | ✗ API keys exposed<br>✗ CORS limitations<br>✗ No centralized control |
| **Separate BFF Service** | ✓ Scalable<br>✓ Service isolation | ✗ Complex infrastructure<br>✗ Deployment overhead<br>✗ More code to maintain |

## Why Proxy APIs?

### Security: Keep API Keys Server-Side

**The Problem:**
API keys embedded in client-side code are public, even if stored in environment variables:

```typescript
// ❌ DANGEROUS: This API key is PUBLIC
const response = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
  }
})
```

Even though it's in an environment variable, the `NEXT_PUBLIC_` prefix means it gets bundled into your client JavaScript. Anyone can:
- Open browser DevTools and inspect network requests
- View your bundled JavaScript files
- Extract your API key
- Use it for unlimited requests (costing you money or hitting rate limits)

**The Solution:**
Keep API keys on the server using the proxy pattern:

```typescript
// ✓ SECURE: API key stays on server
// Client makes request to your API route
const response = await fetch('/api/proxy/service', {
  method: 'POST',
  body: JSON.stringify({ query: 'data' })
})

// Server-side API route (not bundled with client)
export async function POST(request: NextRequest) {
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}` // Safe: server-side only
    }
  })
  return NextResponse.json(await response.json())
}
```

### Control: Rate Limiting, Caching, and Transformation

Beyond security, proxying gives you control over:

**1. Rate Limiting**
```typescript
// Limit users to 10 requests per minute
const rateLimiter = new RateLimiter({ max: 10, window: 60000 })

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)

  if (!await rateLimiter.check(userId)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Proceed with proxying
}
```

**2. Response Caching**
```typescript
// Cache responses to reduce API costs
const cache = new Map()

export async function POST(req: NextRequest) {
  const cacheKey = await getCacheKey(req)

  if (cache.has(cacheKey)) {
    return NextResponse.json(cache.get(cacheKey))
  }

  const response = await fetchFromExternalAPI(req)
  cache.set(cacheKey, response)
  return NextResponse.json(response)
}
```

**3. Request/Response Transformation**
```typescript
// Transform external API format to match your frontend needs
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Transform request format
  const externalRequest = {
    q: body.query,        // query → q
    max: body.limit || 10 // Add default limit
  }

  const response = await fetch('https://api.example.com', {
    body: JSON.stringify(externalRequest)
  })

  const data = await response.json()

  // Transform response format
  return NextResponse.json({
    results: data.items,           // items → results
    total: data.count,            // count → total
    hasMore: data.has_next_page   // has_next_page → hasMore
  })
}
```

### Consistency: Unified Error Handling

Centralize error handling across all API integrations:

```typescript
export async function POST(req: NextRequest) {
  try {
    const response = await fetch('https://api.example.com', { ... })

    if (!response.ok) {
      // Transform external API errors to your standard format
      return standardErrorResponse(response.status, 'External API error')
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    // Log all API errors consistently
    logApiError(error, { endpoint: '/api/proxy', method: 'POST' })
    return internalError() // Standard 500 response
  }
}
```

### Monitoring: Centralized Logging

Track API usage, performance, and errors in one place:

```typescript
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const response = await fetch('https://api.example.com', { ... })

    // Log successful requests
    logger.info({
      endpoint: '/api/proxy',
      externalApi: 'api.example.com',
      duration: Date.now() - startTime,
      status: response.status
    }, 'API proxy request completed')

    return NextResponse.json(await response.json())
  } catch (error) {
    // Log failed requests
    logger.error({
      endpoint: '/api/proxy',
      externalApi: 'api.example.com',
      duration: Date.now() - startTime,
      error
    }, 'API proxy request failed')

    return internalError()
  }
}
```

## Architecture & Request Flow

### High-Level Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Browser   │─────▶│  Next.js API     │─────▶│ External API │
│   (Client)  │      │  Route (Proxy)   │      │ (e.g., Dify) │
│             │      │  /api/proxy/*    │      │              │
│             │◀─────│                  │◀─────│              │
└─────────────┘      └──────────────────┘      └──────────────┘
      │                      │                        │
      │                      │                        │
  No API Key         Has API Key              Validates Key
  Client-side        Server-side              Returns Data
  Public code        Secure env vars          Private service
```

### Detailed Request Flow

```
1. User Action
   └─▶ User clicks "Send" in chat interface

2. Client Request
   └─▶ Frontend sends POST to /api/chat
       ├─ Headers: Content-Type, cookies (session)
       └─ Body: { message, conversationId }

3. Server Validation
   └─▶ Next.js API route (/api/chat/route.ts)
       ├─ Extract cookies from request
       ├─ Validate Supabase session
       ├─ Check user authentication
       └─ Validate request payload

4. Add API Key
   └─▶ Server adds credentials
       ├─ Read API_KEY from process.env
       ├─ Add to Authorization header
       └─ Never expose to client

5. Forward Request
   └─▶ Server forwards to external API
       ├─ Transform request format if needed
       ├─ Set timeout with AbortController
       └─ Handle connection errors

6. External API Processing
   └─▶ External API (Dify, OpenAI, etc.)
       ├─ Validates API key
       ├─ Processes request
       └─ Returns response (JSON or stream)

7. Response Transformation
   └─▶ Server transforms response
       ├─ Parse response format
       ├─ Map to client-expected format
       ├─ Add metadata if needed
       └─ Handle errors gracefully

8. Return to Client
   └─▶ Server returns response
       ├─ Set appropriate headers
       ├─ Stream or return JSON
       └─ Client renders result
```

### Security Boundaries

```
┌───────────────────────────────────────────────────────────────┐
│                        Client-Side                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ❌ NEVER put API keys here                              │  │
│  │ ❌ NEVER use NEXT_PUBLIC_ for secrets                   │  │
│  │ ✓ User authentication tokens (httpOnly cookies)         │  │
│  │ ✓ Public configuration (API URLs without keys)          │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                        Server-Side                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ✓ API keys stored in environment variables              │  │
│  │ ✓ process.env.API_KEY (no NEXT_PUBLIC_ prefix)          │  │
│  │ ✓ User session validation                               │  │
│  │ ✓ Request/response transformation                        │  │
│  │ ✓ Rate limiting and caching                             │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## Implementation Guide (Dify Example)

This template includes a complete reference implementation of the API proxy pattern for integrating with Dify AI. Let's explore how it works.

### File Structure

```
src/
├── app/api/chat/
│   ├── route.ts              # Dify proxy API route
│   └── vercel/
│       └── route.ts          # Alternative: Vercel AI SDK route
├── libs/
│   ├── dify/
│   │   ├── client.ts         # Dify client wrapper
│   │   ├── config.ts         # Configuration
│   │   └── types.ts          # TypeScript types
│   └── api/
│       └── errors.ts         # Standardized error handling
└── middleware.ts             # Session validation for all /api/* routes
```

### Environment Variables Setup

```bash
# .env.local (server-side only - NEVER commit to git)

# ❌ WRONG: NEXT_PUBLIC_ exposes to client
NEXT_PUBLIC_DIFY_API_KEY=sk-xxxxx

# ✓ CORRECT: No NEXT_PUBLIC_ prefix
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=sk-xxxxx                    # Keep secret!
```

### Step 1: Client Wrapper

Create a client library that encapsulates API communication:

```typescript
// src/libs/dify/client.ts

import { DIFY_CONFIG } from './config'
import type { DifyChatRequest, DifyChatResponse } from './types'

export class DifyClient {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey?: string) {
    // Read from environment (server-side only)
    this.apiKey = apiKey || DIFY_CONFIG.apiKey
    this.baseUrl = DIFY_CONFIG.apiUrl
  }

  async chatMessages(request: DifyChatRequest): Promise<DifyChatResponse | ReadableStream> {
    const url = `${this.baseUrl}/chat-messages`

    // Create timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,  // API key added server-side
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw await this.handleError(response)
      }

      // For streaming responses, return the stream directly
      if (request.response_mode === 'streaming') {
        return response.body!
      }

      // For blocking responses, parse JSON
      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }

      throw error
    }
  }

  private async handleError(response: Response): Promise<Error> {
    let errorMessage = 'Unknown error'
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }

    const error = new Error(errorMessage)
    ;(error as any).status = response.status
    return error
  }
}

export function createDifyClient(apiKey?: string): DifyClient {
  return new DifyClient(apiKey)
}
```

### Step 2: API Route Handler

Create the proxy endpoint:

```typescript
// src/app/api/chat/route.ts

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  internalError,
  invalidRequestError,
  unauthorizedError,
} from '@/libs/api/errors'
import { createDifyClient } from '@/libs/dify/client'
import type { DifyChatRequest } from '@/libs/dify/types'
import { createClient } from '@/libs/supabase/server'

/**
 * POST /api/chat
 *
 * Proxies chat requests to Dify API while keeping API key server-side.
 *
 * Security: API key stored in process.env, never exposed to client
 * Auth: Validates Supabase session before proxying
 * Streaming: Supports SSE for real-time responses
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Validate user session
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedError()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const { message, conversationId } = body

    if (!message || typeof message !== 'string') {
      return invalidRequestError('Message is required')
    }

    if (message.length > 10000) {
      return invalidRequestError('Message exceeds maximum length')
    }

    // 3. Create Dify request
    const difyClient = createDifyClient()
    const difyRequest: DifyChatRequest = {
      query: message,
      user: user.id,
      response_mode: 'streaming',
      conversation_id: conversationId,
      inputs: {},
    }

    // 4. Forward request to Dify
    const stream = await difyClient.chatMessages(difyRequest)

    // 5. Return streaming response
    // For SSE streaming, return the ReadableStream directly
    if (stream instanceof ReadableStream) {
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // For non-streaming, return JSON
    return NextResponse.json(stream)
  } catch (error: any) {
    // Log error for monitoring
    console.error('Dify proxy error:', error)

    // Return standardized error response
    if (error.status) {
      return NextResponse.json(
        { error: error.message || 'AI service error' },
        { status: error.status }
      )
    }

    return internalError()
  }
}
```

### Step 3: Session Validation

Middleware ensures all `/api/*` routes validate authentication:

```typescript
// src/middleware.ts

import { updateSession } from '@/libs/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update Supabase session for all requests
  const response = await updateSession(request)

  // Protected routes require authentication
  const protectedPaths = ['/api/chat', '/api/chat/vercel', ...]

  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to sign-in for unauthenticated users
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  return response
}
```

### Step 4: Client-Side Usage

Frontend code calls your proxy (not the external API directly):

```typescript
// Client component

async function sendMessage(message: string) {
  // ✓ Call YOUR API route (proxy)
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })

  // Handle streaming response
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    console.log('Received chunk:', chunk)
  }
}
```

### SSE Streaming Proxy

For Server-Sent Events, the proxy passes through the stream while optionally transforming it:

```typescript
// Transform SSE stream while proxying
const transformStream = new TransformStream({
  transform(chunk, controller) {
    const text = decoder.decode(chunk, { stream: true })

    // Parse SSE event
    const event = parseSSEEvent(text)

    if (event) {
      // Extract metadata (conversation_id, etc.)
      // Log events for monitoring
      // Transform event if needed
    }

    // Pass through to client (zero-copy)
    controller.enqueue(chunk)
  }
})

const transformedStream = stream.pipeThrough(transformStream)

return new Response(transformedStream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
})
```

For complete SSE implementation details, see [SSE Streaming Pattern](./sse-streaming.md).

### Reference Files

Complete implementations are available in:
- **API Route**: `src/app/api/chat/route.ts`
- **Client Library**: `src/libs/dify/client.ts`
- **Error Handling**: `src/libs/api/errors.ts`
- **Middleware**: `src/middleware.ts`

## Adapting for Other APIs

The proxy pattern is flexible and can be adapted for any external API. Here are templates for common scenarios.

### REST API Template

```typescript
// src/app/api/proxy/service/route.ts

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  internalError,
  invalidRequestError,
  unauthorizedError,
} from '@/libs/api/errors'
import { createClient } from '@/libs/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate user session
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorizedError()
    }

    // 2. Parse and validate request
    const body = await request.json()

    // Add validation here (use Zod for complex schemas)
    if (!body.query) {
      return invalidRequestError('Query is required')
    }

    // 3. Make request to external API
    const response = await fetch(process.env.EXTERNAL_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query,
        // Add additional parameters
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    // 4. Transform and return response
    const data = await response.json()

    // Optional: Transform response format
    const transformedData = {
      results: data.items,
      total: data.count,
    }

    return NextResponse.json(transformedData)
  } catch (error: any) {
    console.error('Proxy error:', error)
    return internalError()
  }
}
```

### GraphQL API Template

```typescript
// src/app/api/proxy/graphql/route.ts

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  internalError,
  invalidRequestError,
  unauthorizedError,
} from '@/libs/api/errors'
import { createClient } from '@/libs/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate user session
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorizedError()
    }

    // 2. Parse GraphQL query
    const body = await request.json()
    const { query, variables } = body

    if (!query) {
      return invalidRequestError('GraphQL query is required')
    }

    // 3. Forward to GraphQL API
    const response = await fetch(process.env.GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GRAPHQL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    })

    if (!response.ok) {
      throw new Error(`GraphQL API error: ${response.status}`)
    }

    const data = await response.json()

    // 4. Check for GraphQL errors
    if (data.errors) {
      return NextResponse.json(
        { error: 'GraphQL query failed', details: data.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(data.data)
  } catch (error: any) {
    console.error('GraphQL proxy error:', error)
    return internalError()
  }
}
```

### Environment Variable Setup

For each external API, add environment variables:

```bash
# .env.local

# Example: OpenAI Integration
OPENAI_API_KEY=sk-xxxxx
OPENAI_ORG_ID=org-xxxxx

# Example: Stripe Integration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Example: SendGrid Integration
SENDGRID_API_KEY=SG.xxxxx

# Naming Convention:
# [SERVICE]_API_KEY - For API keys
# [SERVICE]_API_URL - For API endpoints
# [SERVICE]_[SPECIFIC]_KEY - For multiple keys per service
```

### Client Wrapper Pattern

Create a wrapper library for each external API:

```typescript
// src/libs/external-service/client.ts

export class ExternalServiceClient {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(config?: { timeout?: number }) {
    // Client calls YOUR proxy, not the external API directly
    this.baseUrl = '/api/proxy/service'
    this.timeout = config?.timeout || 30000
  }

  async makeRequest(payload: any) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Add specific methods for your use cases
  async searchData(query: string) {
    return this.makeRequest({ query })
  }
}

// Usage in components
const client = new ExternalServiceClient()
const results = await client.searchData('example')
```

## Security Best Practices

### Never Use NEXT_PUBLIC_ for Secrets

**The Problem:**

```typescript
// ❌ DANGEROUS: This is PUBLIC
NEXT_PUBLIC_API_KEY=sk-secret-key-12345
```

Any environment variable with the `NEXT_PUBLIC_` prefix is:
1. Bundled into your client-side JavaScript
2. Visible in browser DevTools
3. Included in your deployed static files
4. Accessible to anyone who visits your site

**The Solution:**

```typescript
// ✓ SAFE: Server-side only (no NEXT_PUBLIC_ prefix)
API_KEY=sk-secret-key-12345
STRIPE_SECRET_KEY=sk_test_xxxxx
DATABASE_PASSWORD=super-secret-password
```

These variables are:
1. Only accessible in server-side code
2. Never bundled with client JavaScript
3. Secure in your hosting environment

### Input Validation

Always validate and sanitize user input before forwarding to external APIs:

```typescript
import { z } from 'zod'

// Define validation schema
const ChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long'),
  conversationId: z.string()
    .regex(/^[a-z0-9-]+$/i, 'Invalid conversation ID format')
    .optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate request
  const result = ChatRequestSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.errors },
      { status: 400 }
    )
  }

  const { message, conversationId } = result.data

  // Proceed with validated data
}
```

### Rate Limiting Strategies

Protect your API from abuse and control costs:

**1. Simple In-Memory Rate Limiting:**

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || userLimit.resetAt < now) {
    // New window
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  const { user } = await validateSession(request)

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // Proceed with request
}
```

**2. Distributed Rate Limiting (Production):**

For production, use Redis-based rate limiting:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
})

export async function POST(request: NextRequest) {
  const { user } = await validateSession(request)

  const { success } = await ratelimit.limit(user.id)

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Proceed with request
}
```

### CORS Configuration

If your API needs to be called from different origins:

```typescript
export async function POST(request: NextRequest) {
  // ... your logic

  const response = NextResponse.json(data)

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  return response
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://yourdomain.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

### Authentication Token Handling

When proxying authenticated requests:

```typescript
export async function POST(request: NextRequest) {
  // 1. Validate user session
  const { user } = await validateSession(request)

  // 2. Get or create user-specific token for external API
  const userToken = await getUserExternalToken(user.id)

  // 3. Use user's token (not your API key) if appropriate
  const response = await fetch('https://api.example.com', {
    headers: {
      // Option A: Use your API key + user identifier
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'X-User-Id': user.id,

      // Option B: Use user's OAuth token
      // 'Authorization': `Bearer ${userToken}`,
    },
  })

  return NextResponse.json(await response.json())
}
```

### Security Checklist

- [ ] API keys stored in `.env.local` (not committed to git)
- [ ] No `NEXT_PUBLIC_` prefix for secret keys
- [ ] User authentication validated before proxying
- [ ] Request input validated with schema (Zod, etc.)
- [ ] Rate limiting implemented per user
- [ ] Error messages don't leak sensitive information
- [ ] CORS configured for specific origins only
- [ ] Timeout set for external API requests
- [ ] Errors logged for monitoring (without exposing secrets)

## Error Handling & Retries

### Standard Error Format

Use consistent error responses across all proxy routes:

```typescript
// src/libs/api/errors.ts

export function unauthorizedError() {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
    { status: 401 }
  )
}

export function validationError(message: string) {
  return NextResponse.json(
    { error: message, code: 'VALIDATION_ERROR' },
    { status: 400 }
  )
}

export function externalApiError(message: string) {
  return NextResponse.json(
    { error: message, code: 'EXTERNAL_API_ERROR' },
    { status: 502 }
  )
}

export function internalError() {
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
```

### Error Mapping from External API

Transform external API errors to your standard format:

```typescript
export async function POST(request: NextRequest) {
  try {
    const response = await fetch('https://api.example.com', { ... })

    if (!response.ok) {
      // Map external API errors
      const errorData = await response.json().catch(() => ({}))

      switch (response.status) {
        case 401:
          return unauthorizedError()
        case 429:
          return NextResponse.json(
            { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
            { status: 429, headers: { 'Retry-After': '60' } }
          )
        case 400:
          return validationError(errorData.message || 'Invalid request')
        default:
          return externalApiError(errorData.message || 'External API error')
      }
    }

    return NextResponse.json(await response.json())
  } catch (error: any) {
    console.error('Proxy error:', error)
    return internalError()
  }
}
```

### Timeout Configuration

Always set timeouts to prevent hanging requests:

```typescript
export async function POST(request: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch('https://api.example.com', {
      signal: controller.signal,
      // ... other options
    })

    clearTimeout(timeoutId)
    return NextResponse.json(await response.json())
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout', code: 'TIMEOUT' },
        { status: 408 }
      )
    }

    throw error
  }
}
```

### Retry Logic Patterns

Implement retry logic for transient failures:

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  backoffMs = 1000
): Promise<Response> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Retry on 5xx errors (server errors)
      if (response.status >= 500 && attempt < maxRetries - 1) {
        await sleep(backoffMs * Math.pow(2, attempt)) // Exponential backoff
        continue
      }

      return response
    } catch (error: any) {
      lastError = error

      // Only retry on network errors
      if (attempt < maxRetries - 1) {
        await sleep(backoffMs * Math.pow(2, attempt))
        continue
      }
    }
  }

  throw lastError!
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Usage
export async function POST(request: NextRequest) {
  try {
    const response = await fetchWithRetry(
      'https://api.example.com',
      { method: 'POST', body: JSON.stringify(data) },
      3,    // 3 retries
      1000  // 1s initial backoff
    )

    return NextResponse.json(await response.json())
  } catch (error) {
    return internalError()
  }
}
```

### Circuit Breaker Pattern

For critical services, implement a circuit breaker:

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private maxFailures = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.maxFailures) {
      this.state = 'open'
    }
  }
}

const externalApiBreaker = new CircuitBreaker()

export async function POST(request: NextRequest) {
  try {
    const data = await externalApiBreaker.execute(async () => {
      const response = await fetch('https://api.example.com', { ... })
      return await response.json()
    })

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.message === 'Circuit breaker is open') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' },
        { status: 503 }
      )
    }

    return internalError()
  }
}
```

## Testing Proxy Routes

### Unit Testing Strategies

Test proxy routes by mocking external API calls:

```typescript
// src/app/api/proxy/service/route.test.ts

import { describe, expect, it, vi } from 'vitest'
import { POST } from './route'

// Mock dependencies
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'user-123' } },
        error: null,
      })),
    },
  })),
}))

global.fetch = vi.fn()

describe('/api/proxy/service', () => {
  it('returns 401 for unauthenticated requests', async () => {
    // Mock no user
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(() => ({ data: { user: null }, error: new Error('Unauthorized') })),
      },
    } as any)

    const request = new Request('http://localhost/api/proxy/service', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(401)
  })

  it('proxies request to external API', async () => {
    // Mock successful external API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: ['item1', 'item2'] }),
    } as Response)

    const request = new Request('http://localhost/api/proxy/service', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toEqual(['item1', 'item2'])
    expect(fetch).toHaveBeenCalledWith(
      process.env.EXTERNAL_API_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer'),
        }),
      })
    )
  })
})
```

### Integration Testing

Test with a real external API (or staging environment):

```typescript
// tests/api-proxy.e2e.ts

import { test, expect } from '@playwright/test'

test.describe('API Proxy Integration', () => {
  test('proxies chat request successfully', async ({ request, context }) => {
    // Login to get session cookie
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: 'test@example.com', password: 'password' },
    })

    expect(loginResponse.ok()).toBeTruthy()

    // Make authenticated request to proxy
    const chatResponse = await request.post('/api/chat', {
      data: {
        message: 'Hello, AI!',
      },
    })

    expect(chatResponse.ok()).toBeTruthy()

    // For non-streaming
    const data = await chatResponse.json()
    expect(data).toHaveProperty('answer')
  })
})
```

### Mocking External APIs

Use MSW (Mock Service Worker) for comprehensive mocking:

```typescript
// tests/mocks/handlers.ts

import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://api.example.com/endpoint', async ({ request }) => {
    const body = await request.json()

    // Mock successful response
    return HttpResponse.json({
      results: ['mocked', 'data'],
    })
  }),

  // Mock error scenarios
  http.post('https://api.example.com/error', () => {
    return new HttpResponse(null, { status: 500 })
  }),
]
```

### Testing Error Scenarios

Test how your proxy handles errors:

```typescript
describe('Error Handling', () => {
  it('handles timeout errors', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AbortError')), 100)
      )
    )

    const request = new Request('http://localhost/api/proxy/service', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(408)

    const data = await response.json()
    expect(data.code).toBe('TIMEOUT')
  })

  it('handles rate limit errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
    } as Response)

    const request = new Request('http://localhost/api/proxy/service', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
  })
})
```

## Common Pitfalls

### 1. Exposing API Keys in Client

**Problem:**
```typescript
// ❌ API key is PUBLIC
const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_KEY
```

**Solution:**
```typescript
// ✓ Keep API key server-side
// Server: process.env.OPENAI_KEY
// Client: Call /api/proxy/openai instead
```

### 2. Missing Input Validation

**Problem:**
```typescript
// ❌ No validation - injection risk
const { query } = await request.json()
await fetch(`https://api.example.com?q=${query}`)
```

**Solution:**
```typescript
// ✓ Validate all input
const schema = z.object({ query: z.string().max(1000) })
const { query } = schema.parse(await request.json())
```

### 3. Inadequate Error Handling

**Problem:**
```typescript
// ❌ Generic error, no logging
} catch (error) {
  return NextResponse.json({ error: 'Error' }, { status: 500 })
}
```

**Solution:**
```typescript
// ✓ Specific errors, proper logging
} catch (error: any) {
  logger.error({ error, endpoint: '/api/proxy' }, 'Proxy failed')

  if (error.name === 'AbortError') {
    return timeoutError()
  }

  return internalError()
}
```

### 4. Not Handling Timeouts

**Problem:**
```typescript
// ❌ No timeout - request can hang forever
const response = await fetch('https://slow-api.com')
```

**Solution:**
```typescript
// ✓ Always set timeout
const controller = new AbortController()
setTimeout(() => controller.abort(), 30000)

const response = await fetch('https://slow-api.com', {
  signal: controller.signal
})
```

### 5. Missing Rate Limiting

**Problem:**
```typescript
// ❌ No rate limit - users can spam external API
export async function POST(request: NextRequest) {
  return await fetch('https://expensive-api.com', ...)
}
```

**Solution:**
```typescript
// ✓ Rate limit per user
const { user } = await validateSession(request)

if (!checkRateLimit(user.id)) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

### 6. Leaking Error Details

**Problem:**
```typescript
// ❌ Exposes API key in error message
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 })
  // Error: "Invalid API key: sk-xxxx..."
}
```

**Solution:**
```typescript
// ✓ Generic error to client, detailed log server-side
} catch (error: any) {
  logger.error({ error, apiKey: process.env.API_KEY?.slice(0, 8) }, 'API error')
  return NextResponse.json(
    { error: 'Service temporarily unavailable' },
    { status: 500 }
  )
}
```

### 7. Ignoring CORS

**Problem:**
```typescript
// ❌ CORS error when called from different origin
export async function POST(request: NextRequest) {
  return NextResponse.json(data)
}
```

**Solution:**
```typescript
// ✓ Add CORS headers if needed
export async function POST(request: NextRequest) {
  const response = NextResponse.json(data)
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com')
  return response
}
```

### 8. Not Cleaning Up Resources

**Problem:**
```typescript
// ❌ Timeout not cleared if fetch succeeds
const timeoutId = setTimeout(() => controller.abort(), 30000)
const response = await fetch(url, { signal: controller.signal })
return NextResponse.json(await response.json())
```

**Solution:**
```typescript
// ✓ Always clear timeout
const timeoutId = setTimeout(() => controller.abort(), 30000)

try {
  const response = await fetch(url, { signal: controller.signal })
  return NextResponse.json(await response.json())
} finally {
  clearTimeout(timeoutId)
}
```

## Related Patterns

### SSE Streaming Pattern

The API proxy pattern is commonly used with Server-Sent Events for streaming responses:

```typescript
// Proxy streaming responses from external APIs
const stream = await fetch('https://api.example.com/stream', {
  headers: { 'Authorization': `Bearer ${process.env.API_KEY}` }
})

return new Response(stream.body, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
})
```

For complete SSE implementation details, see [SSE Streaming Pattern](./sse-streaming.md).

### Authentication Patterns

Proxy routes should always validate user sessions:

```typescript
// Validate Supabase session before proxying
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return unauthorizedError()
}
```

For authentication setup, see `docs/development-guide.md`.

### Error Handling

Use standardized error responses across all proxy routes:

```typescript
import {
  unauthorizedError,
  validationError,
  internalError,
} from '@/libs/api/errors'
```

For comprehensive error handling patterns, see:
- [API Error Handling](../api-error-handling.md)
- [Error Handling Guide](../error-handling-guide.md)

### Related Documentation

- **[SSE Streaming Pattern](./sse-streaming.md)** - Streaming responses from proxied APIs
- **[API Error Handling](../api-error-handling.md)** - Error handling for API routes
- **[Development Guide](../development-guide.md)** - Development workflows and patterns
