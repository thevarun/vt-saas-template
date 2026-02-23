# Admin Setup Guide

## Overview

The admin panel uses multi-layered protection to ensure only authorized users can access admin functionality:

1. **Middleware layer** — Redirects non-admin users away from `/admin` routes
2. **API layer** — Returns 403 on every admin endpoint for non-admin users
3. **Audit logging** — Records all admin actions for accountability

No database queries are made during admin checks — status is determined from in-memory data, keeping middleware fast.

## How Route Protection Works

### Middleware (Route-Level)

All `/admin` routes are registered as protected paths in `src/middleware.ts`. When a user navigates to any admin page:

1. The middleware checks if the user is authenticated (redirects to sign-in if not)
2. If authenticated, it calls `isAdmin(user)` from `src/libs/auth/isAdmin.ts`
3. Non-admin users are redirected to `/dashboard?error=access_denied`

### API (Endpoint-Level)

Every admin API endpoint (`/api/admin/*`) independently verifies admin status:

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return unauthorizedError(); // 401
}

if (!isAdmin(user)) {
  return forbiddenError('Admin access required'); // 403
}
```

This double-check ensures that even if middleware is bypassed (e.g., direct API calls), endpoints remain protected.

## How Admin Status Is Determined

The `isAdmin()` function in `src/libs/auth/isAdmin.ts` checks two sources in priority order:

### 1. Supabase `app_metadata.isAdmin` Flag (Primary)

The function checks `user.app_metadata?.isAdmin === true` using strict equality -- truthy values like `"true"` or `1` won't work. Using `app_metadata` (instead of `user_metadata`) is critical because `app_metadata` can only be set via the service role key or SQL, preventing users from granting themselves admin access.

### 2. `ADMIN_EMAILS` Environment Variable (Fallback)

If the metadata flag isn't set, the function checks if the user's email appears in the `ADMIN_EMAILS` env var. This is a comma-separated, case-insensitive list:

```
ADMIN_EMAILS=admin@example.com,owner@example.com
```

## Granting Admin Access

### Option A: `ADMIN_EMAILS` Environment Variable

Best for development and small teams. Add the email to your `.env.local`:

```bash
ADMIN_EMAILS=your-email@example.com
```

For multiple admins, comma-separate:

```bash
ADMIN_EMAILS=admin@example.com,teammate@example.com
```

Restart the dev server after changing this value.

### Option B: Supabase App Metadata (Recommended for Production)

Set the `isAdmin` flag in `app_metadata` on the user in Supabase. This is persistent, doesn't depend on environment variables, and cannot be modified by users themselves.

**Via Supabase Dashboard:**

1. Go to your Supabase project → Authentication → Users
2. Find the user and click to open their details
3. Edit `app_metadata` to include `"isAdmin": true`

**Via Supabase Admin API (using the service role key):**

```typescript
const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { isAdmin: true },
});
```

**Via Supabase SQL Editor:**

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"isAdmin": true}'::jsonb
WHERE email = 'admin@example.com';
```

## Revoking Admin Access

### If using `ADMIN_EMAILS`

Remove the email from the `ADMIN_EMAILS` environment variable and restart the server.

### If using Supabase App Metadata

Set `isAdmin` to `false` (or remove the key) using any of the methods above:

```typescript
const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { isAdmin: false },
});
```

## Admin Capabilities

Once granted admin access, users can:

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin` | View metrics (total users, signups, active users, pending feedback) |
| User Management | `/admin/users` | Search, suspend, unsuspend, delete users, trigger password resets |
| Feedback Management | `/admin/feedback` | Review, archive, delete feedback; bulk actions; CSV export |
| Audit Log | `/admin/audit` | View log of all admin actions with filters by action type, admin, and date |
| Email Testing | `/admin/email` | Send test emails using templates (welcome, password-reset, verify-email) |

### Safety Measures

- **Self-preservation**: Admins cannot suspend, delete, or reset their own account via the admin panel
- **Audit trail**: Every admin action is logged with the admin's ID, action type, target, and metadata
- **Bulk safeguards**: Bulk operations validate all IDs before executing
