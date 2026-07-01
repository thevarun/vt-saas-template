# Removing Dify Chat Implementation

## Overview

This guide provides step-by-step instructions for removing the Dify chat implementation from the VT SaaS Template while keeping the Vercel AI SDK chat implementation intact.

**What this guide removes:**
- Dify chat UI routes (`/chat/dify`)
- Dify API proxy endpoints
- Dify client library
- Dify-specific database tables
- Dify environment variables
- Navigation links to Dify chat

**What remains:**
- Vercel AI SDK chat implementation (`/chat/vercel`)
- Chat landing page (updated to show only Vercel option)
- Other template features

**When to use this guide:**
- You prefer Vercel AI SDK for more control over AI providers
- You don't need Dify's workflow features
- You want to reduce external dependencies

---

## Before You Begin

⚠️ **Warning: This action cannot be undone.** Before proceeding:

1. **Back up your data**: If you have Dify conversations you want to keep, export them from the database
2. **Commit pending changes**: Ensure your git working directory is clean
3. **Close development servers**: Stop any running `pnpm dev` processes

**Prerequisites:**
- Git repository with committed changes
- Node.js and pnpm installed (pnpm via `corepack enable`)
- Database access for schema modifications

---

## Step-by-Step Removal

### 1. Remove Dify Code Files

Delete the following directories and files:

```bash
# Dify chat routes
rm -rf src/app/[locale]/(auth)/chat/dify/

# Dify API proxy
rm -rf src/app/api/chat/route.ts

# Dify client library
rm -rf src/libs/dify/

# Dify chat components (if you created any separate from vercel/)
# Note: src/components/chat/ may contain shared components
# Only remove if you have Dify-specific components
```

**Files removed:**
- `src/app/[locale]/(auth)/chat/dify/page.tsx` - Main Dify chat page
- `src/app/[locale]/(auth)/chat/dify/[threadId]/page.tsx` - Dify thread view
- `src/app/[locale]/(auth)/chat/dify/error.tsx` - Dify error boundary
- `src/app/api/chat/route.ts` - Dify API proxy (SSE streaming)
- `src/libs/dify/client.ts` - Dify API client
- `src/libs/dify/types.ts` - Dify TypeScript types

---

### 2. Update Chat Landing Page

Edit `src/app/[locale]/(auth)/chat/page.tsx` to remove Dify option:

```tsx
// Before: Shows both Dify and Vercel options
// After: Show only Vercel chat or redirect directly

// Option A: Redirect directly to Vercel chat
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  redirect('/chat/vercel')
}

// Option B: Keep landing page but remove Dify card
// Remove the entire chatConfig.dify.configured conditional block
// Keep only the Vercel AI SDK card
```

---

### 3. Update Navigation Component

Edit `src/components/layout/MainAppShell.tsx` to remove Dify chat link:

**Find this code block (around line 68):**
```tsx
// Only show Dify chat if configured
...(chatConfig.dify.configured
  ? [{ icon: MessageSquare, label: 'Chat (Dify)', href: '/chat/dify' }]
  : []),
```

**Remove the entire block** or keep it (it will auto-hide when Dify env vars are removed).

If you want to clean up completely, remove the conditional entirely.

---

### 4. Clean Environment Variables

Edit `.env.example` and remove Dify-related variables:

```bash
# Remove these lines:
DIFY_API_KEY=your_dify_api_key
DIFY_API_URL=https://api.dify.ai/v1
NEXT_PUBLIC_DIFY_API_URL=https://api.dify.ai/v1
```

Also remove from your local `.env.local` file.

**Note:** `chatConfig.dify.configured` will automatically return `false` when these variables are missing, hiding Dify UI elements.

---

### 5. Update Database Schema

Edit `src/models/Schema.ts` to remove the Dify `threads` table:

**Find and remove this code block (lines 50-77):**
```typescript
// Threads table for multi-threaded chat conversations (Dify implementation)
export const threads = vtSaasSchema.table(
  'threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    conversationId: text('conversation_id').notNull().unique(),
    title: text('title'),
    lastMessagePreview: text('last_message_preview'),
    archived: boolean('archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userIdIdx: index('idx_threads_user_id').on(table.userId),
    conversationIdIdx: index('idx_threads_conversation_id').on(
      table.conversationId,
    ),
    userArchivedIdx: index('idx_threads_user_archived').on(
      table.userId,
      table.archived,
    ),
  }),
);
```

**Generate and apply migration:**
```bash
pnpm db:generate
```

This creates a migration file to drop the `vt_saas.threads` table. The migration will auto-apply on next database interaction.

⚠️ **Data Loss Warning:** All Dify conversation threads will be permanently deleted.

**Optional:** Before running migration, export thread data:
```sql
-- Connect to your database and run:
COPY vt_saas.threads TO '/path/to/backup/threads.csv' CSV HEADER;
```

---

### 6. Remove Dependencies

**Good news:** Dify implementation uses standard `fetch` API, so there are **no Dify-specific packages** to remove.

All current dependencies are either:
- Shared across the template (Next.js, React, Drizzle)
- Used by Vercel AI SDK implementation

**No `pnpm remove` commands needed.**

---

### 7. Verify Removal

Run these commands to ensure clean removal:

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Build verification
pnpm build

# Run development server
pnpm dev
```

**Manual verification:**
1. Navigate to `/chat` - should show only Vercel option or redirect to `/chat/vercel`
2. Check sidebar navigation - "Chat (Dify)" link should be hidden
3. Visit `/chat/dify` - should 404 or redirect
4. Check browser console - no errors about missing modules
5. Test Vercel chat at `/chat/vercel` - should work normally

---

## Verification Checklist

- [ ] All Dify files and directories deleted
- [ ] Chat landing page updated (no Dify option shown)
- [ ] Navigation component cleaned (optional - auto-hides when env vars missing)
- [ ] Environment variables removed from `.env.example` and `.env.local`
- [ ] Database schema updated (threads table removed)
- [ ] Migration generated with `pnpm db:generate`
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` completes successfully
- [ ] Development server runs without errors
- [ ] `/chat/dify` returns 404 or redirects
- [ ] `/chat/vercel` works correctly
- [ ] Sidebar navigation shows only Vercel chat

---

## Troubleshooting

### Build fails with import errors

**Symptom:** TypeScript errors about missing Dify modules

**Solution:**
```bash
# Search for remaining Dify imports
grep -r "from '@/libs/dify" src/
grep -r "from '@/app/api/chat/route" src/

# Remove any found imports
```

### Navigation still shows Dify link

**Symptom:** "Chat (Dify)" appears in sidebar despite removal

**Solution:**
- Verify `DIFY_API_KEY` and `DIFY_API_URL` removed from `.env.local`
- Clear `.next` build cache: `rm -rf .next`
- Restart dev server

### Database migration fails

**Symptom:** Error when generating migration

**Solution:**
- Ensure you removed only the `threads` table definition
- Check syntax around the removal (no dangling commas)
- Verify imports at top of `Schema.ts` still valid
- Try: `rm -rf drizzle/` and regenerate

### Type errors after removal

**Symptom:** TypeScript complains about missing types

**Solution:**
```bash
# Clear TypeScript cache
rm -rf .next/
rm -rf node_modules/.cache/

# Reinstall and rebuild
pnpm install
pnpm build
```

---

## What's Next

After removing Dify chat:

1. **Update documentation**: If you created custom docs, remove Dify references
2. **Update README**: Remove Dify from feature list
3. **Cleanup environment configs**: Update deployment platforms (Vercel, Railway, etc.) to remove Dify env vars
4. **Test thoroughly**: Run full E2E test suite if available
5. **Consider**: Update `/chat` landing page to redirect directly to `/chat/vercel` for better UX

**Related Guides:**
- [Removing Vercel AI SDK Chat](./removing-vercel-chat.md)
- [Removing All Chat Features](./removing-all-chat.md)
- [API Proxy Pattern](../patterns/api-proxy.md) (for reference)

---

**Need help?** Open an issue on the template repository with details about your setup and the specific error you're encountering.
