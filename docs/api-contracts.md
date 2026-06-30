# API Contracts

This document describes the **conventions** every API route and Server Action in the VT SaaS Template follows. It is intentionally a conventions guide, not an endpoint inventory — each product that forks the template adds its own routes, so a hardcoded route list would go stale immediately. Document your own endpoints alongside the code (see [Documenting your endpoints](#documenting-your-endpoints)).

For the error shapes referenced throughout, see [`api-error-handling.md`](./api-error-handling.md). For UI-level error boundaries, see [`error-handling-guide.md`](./error-handling-guide.md).

---

## Route layout

- All HTTP routes live under `src/app/api/`. Each `route.ts` exports the HTTP method handlers it supports (`GET`, `POST`, `PATCH`, `DELETE`, …).
- Server Actions live next to the feature code under `src/libs/actions/` and are invoked directly from client/server components — they are not HTTP routes.

---

## Authentication & authorization

Auth is enforced by **higher-order wrappers**, not ad-hoc checks inside each handler. Reuse these rather than re-implementing session validation.

### HTTP route wrappers (`src/libs/api/middleware/`)

| Wrapper | Purpose | Failure mode |
|---------|---------|--------------|
| `withAuth` | Validates the Supabase session, attaches `Sentry.setUser`, and passes the authenticated `User` plus awaited route `params` to the handler. | Returns `unauthorizedError()` (401, `AUTH_REQUIRED`) when no valid session. |
| `withAdminAuth` | Composes `withAuth` with an admin role check via `isAdmin()` (`src/libs/auth/isAdmin.ts`). | Returns `forbiddenError('Admin access required')` (403) for non-admins. |
| `withWebhookSecret` | Validates the inbound `X-Webhook-Secret` header against `WEBHOOK_SECRET` using a timing-safe, fixed-length-hash comparison. | Returns `serviceUnavailableError` (503) when the secret is unconfigured, `unauthorizedError` (401) on a missing/invalid header. |

`isAdmin(user)` grants admin via `user.app_metadata.isAdmin === true` (the primary, non-user-editable path) **or** the user's email appearing in the comma-separated `ADMIN_EMAILS` env var (fallback). It performs no DB queries, so it is safe to call in middleware.

```typescript
// src/app/api/items/route.ts
import { NextResponse } from 'next/server';

import { withAuth } from '@/libs/api/middleware';

export const GET = withAuth(async (request, { user }) => {
  // `user` is a guaranteed-valid Supabase User
  return NextResponse.json({ data: { userId: user.id } });
});
```

```typescript
// src/app/api/admin/items/[id]/route.ts
import { NextResponse } from 'next/server';

import { withAdminAuth } from '@/libs/api/middleware';

export const DELETE = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const { id } = params ?? {};
  // reaching here means the user is an admin
  return NextResponse.json({ data: { id } });
});
```

### Server-Action wrappers (`src/libs/api/withActionAuth.ts`)

Server Actions use `withActionAuth` / `withActionAuthNoInput`. These inject the authenticated `user` and a request-scoped `supabase` client, and short-circuit with the `UNAUTHORIZED` `ActionResult` when there is no session.

```typescript
'use server';

import { withActionAuth } from '@/libs/api/withActionAuth';
import type { ActionResult } from '@/libs/actions/types';

export const deleteItem = withActionAuth(
  async ({ user, supabase }, input: { id: string }): Promise<ActionResult<null>> => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', input.id)
      .eq('user_id', user.id);

    if (error) {
      return { data: null, error: { message: 'Failed to delete item', code: 'DB_ERROR' } };
    }
    return { data: null, error: null };
  },
);
```

---

## Response shapes

Two shapes, by boundary — both detailed in [`api-error-handling.md`](./api-error-handling.md):

- **HTTP routes** — success `{ data: T }`; error `{ error: string, code: ApiErrorCode, details? }`. Build errors with the helpers in `src/libs/api/errors` (`unauthorizedError`, `validationError`, `notFoundError`, …) and parse them on the client with `parseApiError`.
- **Server Actions** — `ActionResult<T>` from `src/libs/actions/types.ts`: `{ data: T; error: null } | { data: null; error: { message, code } }`.

Both `code` values come from the shared `ApiErrorCode` union in `src/libs/api/errors/types.ts`.

---

## Validation

Validate at the boundary only, with Zod, then trust the parsed value inside the handler — do not re-validate downstream.

```typescript
import { formatZodErrors, validationError } from '@/libs/api/errors';

const result = schema.safeParse(await request.json());
if (!result.success) {
  return validationError(formatZodErrors(result.error));
}
// result.data is fully typed and trusted from here on
```

`formatZodErrors` (`src/libs/api/errors/validation.ts`) flattens Zod issues into the `Record<string, string[]>` that `validationError`'s `details` field expects, which the client reads back off `parseApiError(...).details`.

---

## Rate limiting

`src/libs/api/rateLimit.ts` provides a simple in-memory, IP-keyed limiter suitable for single-instance deployments (swap for a Redis-backed store when running multiple instances):

```typescript
import { rateLimitError } from '@/libs/api/errors';
import { checkRateLimit, getClientIp } from '@/libs/api/rateLimit';

const { allowed, retryAfterSeconds } = checkRateLimit(getClientIp(request), 10, 60_000);
if (!allowed) {
  return rateLimitError('Too many requests', retryAfterSeconds);
}
```

`rateLimitError` (in `src/libs/api/errors`) returns 429 with a `Retry-After` header.

---

## Documenting your endpoints

When a fork adds routes, document them in this file using a compact table per feature area so the contract stays close to the code. Keep it to the load-bearing facts (auth, request, response):

| Method & Path | Auth | Request | Response |
|---------------|------|---------|----------|
| `POST /api/items` | `withAuth` | `{ title: string }` | 201 `{ data: Item }` |
| `DELETE /api/items/[id]` | `withAuth` (owner) | — | 204 |

Prefer this over an exhaustive auto-generated inventory: a short, hand-maintained table per feature is easier to keep accurate as the product evolves.
