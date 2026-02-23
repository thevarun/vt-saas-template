# API Contracts

**Generated:** 2026-02-23 | **Scan Level:** Quick (rescan) | **Total Routes:** 31

---

## Overview

All API routes are under `src/app/api/`. Authentication is handled via Supabase session cookies. Admin routes require `is_admin` metadata flag or email in `ADMIN_EMAILS`.

**Error Response Format:**
```json
{ "error": "message", "code": "ERROR_CODE" }
```

**Common Error Codes:** `AUTH_REQUIRED` (401), `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `INTERNAL_ERROR` (500)

---

## Authentication

### POST /auth/callback
- **File:** `src/app/api/auth/callback/route.ts`
- **Auth:** Public
- **Purpose:** Email link verification callback
- **Query:** `code` (verification code), `next` (redirect URL)
- **Flow:** Exchanges code for session, detects new users (created <5 min), sends welcome email, tracks analytics
- **Response:** Redirect to `next` URL or error page

### GET /api/auth/verify-complete
- **File:** `src/app/api/auth/verify-complete/route.ts`
- **Auth:** Public
- **Query:** `code`, `next` (default: `/`)
- **Purpose:** Email verification completion, sends welcome email
- **Response:** Redirect

---

## Chat - Dify Implementation

### POST /api/chat
- **File:** `src/app/api/chat/route.ts`
- **Auth:** Required (401)
- **Request:** `{ message: string (max 10,000), conversationId?: string (max 128) }`
- **Response:** SSE stream (`text/event-stream`)
- **Purpose:** Proxies to Dify API, keeps API key server-side. Auto-creates/updates threads with `conversation_id` from stream. Fire-and-forget thread persistence.

### GET /api/chat/messages
- **File:** `src/app/api/chat/messages/route.ts`
- **Auth:** Required (401)
- **Query:** `conversation_id` (required)
- **Response:** Message history from Dify API

---

## Chat - Vercel AI SDK

### POST /api/chat/vercel
- **File:** `src/app/api/chat/vercel/route.ts`
- **Auth:** Required (401)
- **Request:** `{ messages: [{role, content}], conversationId?: UUID, message?: string }`
- **Response:** SSE stream (Vercel AI SDK format)
- **Features:** Memory integration (Mem0), LangFuse tracing, conversation auto-creation, token count + latency tracking

### GET /api/chat/vercel/conversations
- **File:** `src/app/api/chat/vercel/conversations/route.ts`
- **Auth:** Required (401)
- **Query:** `limit` (max 100, default 50), `offset` (default 0)
- **Response:** Paginated conversation list, sorted by `updatedAt` DESC

### GET /api/chat/vercel/conversations/[id]
- **File:** `src/app/api/chat/vercel/conversations/[id]/route.ts`
- **Auth:** Required (401)
- **Response:** Conversation with all messages (sorted `createdAt` ASC)

### PATCH /api/chat/vercel/conversations/[id]
- **Auth:** Required (401)
- **Request:** `{ title?: string, archived?: boolean }`
- **Response:** Updated conversation

### DELETE /api/chat/vercel/conversations/[id]
- **Auth:** Required (401)
- **Response:** 204 No Content (cascade deletes messages)

---

## Profile

### POST /api/profile/update
- **File:** `src/app/api/profile/update/route.ts`
- **Auth:** Required (401)
- **Request:** `{ username, displayName }` (username: alphanumeric, 3-20 chars)
- **Validation:** Duplicate username check
- **Response:** `{ success: true }`

### PATCH /api/profile/update-username
- **File:** `src/app/api/profile/update-username/route.ts`
- **Auth:** Required (401)
- **Request:** `{ username }` (lowercase alphanumeric + underscore, 3-20 chars)

### POST /api/profile/check-username
- **File:** `src/app/api/profile/check-username/route.ts`
- **Auth:** Required (401)
- **Request:** `{ username }`
- **Response:** `{ available: boolean }`

### PATCH /api/profile/update-preferences
- **File:** `src/app/api/profile/update-preferences/route.ts`
- **Auth:** Required (401)
- **Request:** `{ emailNotifications?: boolean, language?: 'en'|'hi'|'bn', username?: string, isNewUser?: boolean }`

### DELETE /api/profile/delete
- **File:** `src/app/api/profile/delete/route.ts`
- **Auth:** Required (401)
- **Requires:** `SUPABASE_SERVICE_ROLE_KEY`

---

## Feedback

### POST /api/feedback
- **File:** `src/app/api/feedback/route.ts`
- **Auth:** Optional (anonymous allowed)
- **Request:** `{ type: 'bug'|'feature'|'praise', message: string (max 1000), email?: string }`
- **Response:** 201

---

## Threads (Dify)

### GET /api/threads
- **Auth:** Required | **Response:** `{ threads: [], count }`

### GET/DELETE /api/threads/[id]
- **Auth:** Required | GET: thread details | DELETE: 204 No Content

### POST /api/threads/[id]/archive
- **Auth:** Required | Toggle archive status

---

## Share Links

### POST /api/share
- **Auth:** Required | **Request:** `{ resourceType, resourceId, expiresAt? }` | **Response:** 201 `{ token, url }`

### GET /api/share/[token]
- **Auth:** Public | **Response:** `{ resourceType, resourceId }` | 410 if expired

---

## Email

### POST /api/email/welcome
- **Auth:** Required | Sends welcome email

### POST /api/admin/email/test
- **Auth:** Admin | **Request:** `{ template, email, data? }`

---

## Admin

### POST /api/admin/analytics
- **Auth:** Admin | Dashboard metrics

### GET /api/admin/email/test
- **Auth:** Admin | **Request:** `{ template, email, data? }` | Test email sending

### GET /api/admin/users/[userId]
- **Auth:** Admin | User details

### POST /api/admin/users/[userId]/reset-password
- **Auth:** Admin | Sends reset email

### POST /api/admin/users/[userId]/suspend
- **Auth:** Admin | **Request:** `{ reason? }` | Ban ~100 years

### POST /api/admin/users/[userId]/unsuspend
- **Auth:** Admin | **Request:** `{ reason? }`

### POST /api/admin/feedback/bulk
- **Auth:** Admin | **Request:** `{ action: 'mark-reviewed'|'delete', ids: [uuid] }`

### GET /api/admin/feedback/export
- **Auth:** Admin | **Query:** `type?`, `status?` | CSV download (max 10K)

### POST /api/admin/feedback/[id]/mark-reviewed
- **Auth:** Admin

### POST /api/admin/feedback/[id]/archive
- **Auth:** Admin

### POST /api/admin/feedback/[id]/delete
- **Auth:** Admin

---

## Cron

### GET /api/cron/memory-extraction
- **Auth:** Bearer token (`CRON_SECRET`)
- **Purpose:** Mem0 memory extraction, every 5 min via Vercel Cron

---

## Route Summary

| Category | Routes | Auth |
|----------|--------|------|
| Auth | 2 | Public |
| Chat (Dify) | 2 | Required |
| Chat (Vercel) | 5 | Required |
| Profile | 5 | Required |
| Feedback | 1 | Optional |
| Threads | 3 | Required |
| Share | 2 | Mixed |
| Email | 1 | Required |
| Admin | 11 | Admin |
| Cron | 1 | Bearer |
| **Total** | **31** | |
