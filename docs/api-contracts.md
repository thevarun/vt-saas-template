# API Contracts

**Generated:** 2026-07-03 | Deep scan

The template exposes **39 route handlers** under `src/app/api/**/route.ts`. Almost all authenticated routes are wrapped by the `withAuth` / `withAdminAuth` HOFs (`src/libs/api/middleware/`) and return errors through the shared builders in `src/libs/api/errors/responses.ts`, giving every endpoint a single canonical error shape. The two AI chat POST endpoints (Dify proxy + Vercel AI SDK) are the only SSE streaming responses; everything else returns JSON (or a redirect, for the OAuth/auth-callback GETs).

See also [api-error-handling.md](./api-error-handling.md) and [patterns/sse-streaming.md](./patterns/sse-streaming.md).

---

## Standard error contract

All HTTP error responses share the shape `{ error: string, code: ApiErrorCode, details?: object }` (defined in `src/libs/api/errors/types.ts`; client parser `src/libs/api/client/parseError.ts` reads `json.error` + `json.code`). This differs from the Server Action shape `{ data, error: { message, code } }`.

Builder → code → HTTP status (from `responses.ts` + `HTTP_STATUS`):

| Builder | `code` | HTTP |
|---|---|---|
| `unauthorizedError` | `AUTH_REQUIRED` | 401 |
| `forbiddenError` | `FORBIDDEN` | 403 |
| `validationError` | `VALIDATION_ERROR` | 400 (adds field-level `details` via `formatZodErrors`) |
| `invalidRequestError` | `INVALID_REQUEST` | 400 |
| `notFoundError` | `NOT_FOUND` | 404 |
| `conflictError` | `CONFLICT` | 409 |
| — | `DUPLICATE_CONVERSATION_ID` | 409 |
| `usernameTakenError` | `USERNAME_TAKEN` | 409 |
| `goneError` | `GONE` | 410 |
| `timeoutError` | `TIMEOUT` | 408 |
| `rateLimitError` | `RATE_LIMIT` | 429 (+ `Retry-After` header) |
| `quotaExhaustedError` | `QUOTA_EXHAUSTED` | 429 (+ `details.resets_at`) |
| `dbError` | `DB_ERROR` | 500 |
| `saveFailedError` | `SAVE_FAILED` | 500 |
| `difyError` | `DIFY_ERROR` | 500 |
| `internalError` | `INTERNAL_ERROR` | 500 |
| `serviceUnavailableError` | `SERVICE_UNAVAILABLE` | 503 |

The four canonical codes: `AUTH_REQUIRED`=401, `VALIDATION_ERROR`=400, `NOT_FOUND`=404, `INTERNAL_ERROR`=500. `UNAUTHORIZED` exists in the `ApiErrorCode` union but is the Server-Action equivalent of `AUTH_REQUIRED` (not emitted by HTTP routes).

**Auth wrappers:**

- `withAuth` — validates the Supabase session (`supabase.auth.getUser()`); on failure returns `unauthorizedError()` (401). Passes `{ user, params }` to the handler.
- `withAdminAuth` — composes `withAuth` then `isAdmin(user)`; non-admins get `forbiddenError('Admin access required')` (403).
- `withWebhookSecret` — timing-safe compare of `X-Webhook-Secret` vs `WEBHOOK_SECRET` (503 if unconfigured, 401 if invalid). Defined but unused by current routes — the Stripe webhook uses Stripe's own signature scheme.

## SSE streaming vs JSON

- **`POST /api/chat`** (Dify) — sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`. Pipes Dify's SSE through a `TransformStream` that captures `conversation_id`/answer for fire-and-forget thread persistence in `flush()`.
- **`POST /api/chat/vercel`** — streams via AI SDK `streamText(...).toUIMessageStreamResponse()`; headers set by the SDK. Post-stream persistence is fire-and-forget.
- All other endpoints return `NextResponse.json(...)` (or `204`, a CSV blob, or a redirect).

---

## Auth (6 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| GET | `/api/auth/callback` | OAuth PKCE code exchange; welcome email to new users; onboarding gate | Public | query: `code`, `next` | 302 → post-auth destination | 302 → `/{locale}/auth-code-error` on exchange failure |
| GET | `/api/auth/callback/[provider]` | Platform OAuth callback; CSRF state check, exchange, store tokens | Public entry (needs signed-in user to persist) | query: `code`, `state`, `error` | 302 → `/{locale}/dashboard?success=…` | 302 `?error=` (unknown_provider, access_denied, invalid_state, missing_code, db_error, token_exchange_failed) |
| GET | `/api/auth/connect/[provider]` | Begin platform OAuth: set CSRF cookie, redirect to provider | Authenticated | path: `provider` | 302 → provider | 302 → sign-in if unauth; `?error=unknown_provider`/`provider_not_configured` |
| POST | `/api/auth/dev-login` | Dev/test-only email+password login/signup | Public but hard-gated (`NODE_ENV!==production`, `ALLOW_DEV_LOGIN`, non-prod Supabase URL; 10/60s per-IP) | `{ email, password, action? }` | `{ message, user }` | 403, 429, 400, 401 — plain `{ error }` shape |
| GET | `/api/auth/post-auth-destination` | Compute post-signin redirect respecting onboarding gate | Session-aware | query: `locale`, `next` | `{ destination }` | 401 `{ destination: signInUrl }` |
| GET | `/api/auth/verify-complete` | Email-verification exchange for password signups; welcome email | Public | query: `code`, `next` | 302 → safe `next` | 302 → `/en/sign-in` / `/{locale}/auth-code-error` |

## Profile (6 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| POST | `/api/profile/check-username` | Check username availability | Authenticated | `{ username }` (`usernameSchema`) | `{ available }` | 400, 500 |
| DELETE | `/api/profile/delete` | Delete own account (admin client) | Authenticated | — | 204 | 503 `SERVICE_UNAVAILABLE`, 500 |
| GET | `/api/profile/preferences` | Read notification/language prefs | Authenticated | — | `{ emailNotifications, language, username }` | 500 |
| PATCH | `/api/profile/preferences` | Upsert prefs (username not writable here) | Authenticated | `{ emailNotifications?, language? }` | `{ … }` | 400, 500 `SAVE_FAILED` |
| PATCH | `/api/profile/update-preferences` | Upsert prefs incl. `username`, `isNewUser` | Authenticated | `{ emailNotifications?, language?, username?, isNewUser? }` | `{ success, data }` | 400, 500 `SAVE_FAILED` |
| PATCH | `/api/profile/update-username` | Set username, uniqueness + race guard (23505) | Authenticated | `{ username }` | `{ success }` | 409 `USERNAME_TAKEN`, 400, 500 |
| POST | `/api/profile/update` | Update username + displayName in auth metadata; sync to prefs | Authenticated | `{ username, displayName }` | `{ success }` | 409 `CONFLICT`, 400, 500 |

## Chat — Dify (2 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| POST | `/api/chat` | Proxy to Dify, stream SSE, persist thread on completion | Authenticated | `{ message, conversationId? }` | **SSE** (`text/event-stream`) | 400 `INVALID_REQUEST`, 500 `DIFY_ERROR` (passes through Dify status), 500 |
| GET | `/api/chat/messages` | Fetch Dify conversation history | Authenticated | query: `conversationId` | Dify messages JSON | 400, 500 `DIFY_ERROR`/`INTERNAL_ERROR` |

## Chat — Vercel AI SDK (3 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| POST | `/api/chat/vercel` | Stream via AI SDK; Mem0 memory context; Postgres persistence | Authenticated | `vercelChatRequestSchema` | **SSE UI-message stream** | 400 `INVALID_REQUEST`, 404 `NOT_FOUND`, 408 `TIMEOUT`, 429 `RATE_LIMIT`, 500 |
| GET | `/api/chat/vercel/conversations` | List non-archived conversations, paginated | Authenticated | query: `limit` (≤100, def 50), `offset` | `{ conversations, total }` | 500 `DB_ERROR` |
| GET | `/api/chat/vercel/conversations/[id]` | Fetch conversation + messages (asc) | Authenticated (ownership) | path: `id` | `{ conversation, messages }` | 404 (not-owned → 404 not 403), 500 |
| PATCH | `/api/chat/vercel/conversations/[id]` | Update title / archived | Authenticated (ownership) | `{ title?, archived? }` | `{ conversation }` | 400, 404, 500 |
| DELETE | `/api/chat/vercel/conversations/[id]` | Delete conversation (cascades messages) | Authenticated (ownership) | — | 204 | 404, 500 |

## Threads — Dify (3 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| GET | `/api/threads` | List threads (updated_at desc) | Authenticated | — | `{ threads, total }` | 500 `DB_ERROR` |
| POST | `/api/threads` | Create thread for a conversation_id | Authenticated | `{ conversationId, title? }` | 201 `{ thread }` | 400, 409 `DUPLICATE_CONVERSATION_ID`, 500 |
| PATCH | `/api/threads/[id]` | Update title / lastMessagePreview | Authenticated (ownership) | `{ title?, lastMessagePreview? }` | `{ thread }` | 400, 404, 500 |
| DELETE | `/api/threads/[id]` | Delete thread | Authenticated (ownership) | — | 204 | 404, 500 |
| PATCH | `/api/threads/[id]/archive` | Toggle archived | Authenticated (ownership) | — | `{ thread }` | 404, 500 |

## Share (2 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| POST | `/api/share` | Create share link (32-byte base64url token) | Authenticated | `createShareLinkSchema` `{ resourceType, resourceId, expiresAt? }` | 201 `{ token, url, expiresAt }` | 400, 500 |
| GET | `/api/share` | List own share links | Authenticated | — | `ShareLink[]` | 500 |
| GET | `/api/share/[token]` | **Public** resolve of a shared resource; increments access count | Public | path: `token` | `{ resourceType, resourceId }` | 410 `GONE`, 400, 500 |
| PATCH | `/api/share/[token]` | Revoke/reactivate (owner only) | Authenticated (ownership) | `updateShareLinkSchema` `{ isActive }` | `{ success }` | 404, 400, 500 |

## Subscriptions / Stripe (2 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| GET | `/api/subscriptions/usage` | Full subscription + tier + quota + usage payload | Authenticated | — | subscription-usage object | 500 (incl. null = unseeded free tier) |
| POST | `/api/stripe/webhook` | Stripe lifecycle → DB, emails, analytics; idempotent event ledger | **Public**, Stripe signature (`stripe-signature`, `constructEvent`); `runtime='nodejs'` | Stripe event (raw body) | 200 `{ received, duplicate? }` | 500 (retries), 400 (bad sig) — plain `{ error }` shape |

## Admin (10 files — all `withAdminAuth`: 403 for non-admins, 401 if unauth)

| Method | Path | Purpose | Request | Success | Notable errors |
|---|---|---|---|---|---|
| GET | `/api/admin/analytics` | Dashboard analytics metrics | — | metrics JSON | 500 |
| DELETE | `/api/admin/users/[userId]` | Delete a user (not self) | path: `userId` | `{ success }` | 400, 403 (own), 404, 500 |
| POST | `/api/admin/users/[userId]/reset-password` | Send reset email (not self); audit-logged | path: `userId` | `{ success, message }` | 400, 403 (own), 404, 500 |
| POST | `/api/admin/users/[userId]/suspend` | Ban user (~100y); audit-logged | path + `{ reason? }` | `{ success, user }` | 400, 403 (own), 500 |
| POST | `/api/admin/users/[userId]/unsuspend` | Clear ban; audit-logged | path + `{ reason? }` | `{ success, user }` | 400, 500 |
| POST | `/api/admin/feedback/[id]/archive` | status=archived | path: `id` | `{ success, feedback }` | 400, 404, 500 |
| POST | `/api/admin/feedback/[id]/delete` | Delete feedback | path: `id` | `{ success }` | 400, 404, 500 |
| POST | `/api/admin/feedback/[id]/mark-reviewed` | status=reviewed + reviewedAt | path: `id` | `{ success, feedback }` | 400, 404, 500 |
| POST | `/api/admin/feedback/bulk` | Bulk mark-reviewed / delete; audit-logged | `{ action, ids: uuid[] }` | `{ success, count }` | 400, 500 |
| GET | `/api/admin/feedback/export` | Export feedback CSV (type/status filters); audit-logged | query: `type?`, `status?` | CSV (`text/csv`) | 500 |

## Feedback / Email / Cron / AI (5 files)

| Method | Path | Purpose | Auth | Request | Success | Notable errors |
|---|---|---|---|---|---|---|
| POST | `/api/feedback` | Submit feedback; 5/hour per user | Authenticated | `{ type, message (1–1000) }` | 201 `{ data }` (no userId/email) | 400, 429 `RATE_LIMIT`, 500 |
| POST | `/api/email/welcome` | Send welcome email (Resend) | Authenticated (inline `getUser`) | — | `{ success, messageId }` | 401, 500 |
| GET | `/api/cron/memory-extraction` | Vercel Cron: process Mem0 jobs (every 5 min) | Bearer `CRON_SECRET` | — | `{ success, …stats, durationMs }` | 503, 401, 500 |
| GET/POST/PUT | `/api/inngest` | Inngest `serve` endpoint (scheduled-tasks, trial/promotion expiry, token-refresh crons) | Inngest signing | Inngest protocol | handshake/exec | Functions registered only when `VERCEL_ENV=production` or `NODE_ENV=development` |
| POST | `/api/ai/example` | Canonical quota-gated AI generate (getModelForUser → generateText → recordUsage → invalidate); 20/min | Authenticated | `{ prompt (1–10000) }` | `{ text, usage_warning, model_downgrade }` | 429 `RATE_LIMIT`, 429 `QUOTA_EXHAUSTED` (+ `resets_at`), 400, 500 |

---

## Edge cases worth knowing

- **`/api/auth/dev-login`** and **`/api/stripe/webhook`** intentionally return a bare `{ error }` shape, not the canonical `{ error, code }` contract.
- **Ownership → 404 not 403**: Vercel conversations and threads return `NOT_FOUND` (not `FORBIDDEN`) for resources the caller doesn't own (security-through-obscurity).
- **Public endpoints** (no auth wrapper): `GET /api/share/[token]`, `POST /api/stripe/webhook`, the OAuth/verify GET callbacks. `dev-login` and `cron/memory-extraction` are public routes gated by their own env/secret checks.

**Key source files:** error contract `src/libs/api/errors/{types,responses,validation}.ts`; auth HOFs `src/libs/api/middleware/{withAuth,withAdminAuth,withWebhookSecret}.ts`; Vercel chat helpers/Zod `src/app/api/chat/vercel/helpers.ts`; admin-feedback factory `src/app/api/admin/feedback/[id]/feedbackAction.ts`; share schemas `src/types/shareLink.ts`.
