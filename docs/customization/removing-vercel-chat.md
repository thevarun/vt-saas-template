# Removing Vercel AI SDK Chat Implementation

## Overview

This guide provides step-by-step instructions for removing the Vercel AI SDK chat implementation from the VT SaaS Template while keeping the Dify chat implementation intact.

**What this guide removes:**
- Vercel AI SDK chat UI routes (`/chat/vercel`)
- Vercel chat API endpoints
- Vercel AI SDK libraries and configuration
- LangFuse observability integration
- Mem0 memory extraction integration
- Vercel-specific database tables
- Related environment variables
- Navigation links to Vercel chat

**What remains:**
- Dify chat implementation (`/chat/dify`)
- Chat landing page (updated to show only Dify option)
- Other template features

**When to use this guide:**
- You prefer Dify's managed workflow features
- You don't need direct control over AI provider APIs
- You want to reduce complexity and dependencies

---

## Before You Begin

⚠️ **Warning: This action cannot be undone.** Before proceeding:

1. **Back up your data**: If you have Vercel conversations, messages, or memories you want to keep, export them from the database
2. **Commit pending changes**: Ensure your git working directory is clean
3. **Close development servers**: Stop any running `pnpm dev` processes

**Prerequisites:**
- Git repository with committed changes
- Node.js and pnpm installed (pnpm via `corepack enable`)
- Database access for schema modifications

---

## Step-by-Step Removal

### 1. Remove Vercel Chat Code Files

Delete the following directories and files:

```bash
# Vercel chat routes
rm -rf src/app/[locale]/(auth)/chat/vercel/

# Vercel chat API endpoints
rm -rf src/app/api/chat/vercel/

# Vercel AI SDK libraries
rm -rf src/libs/vercel-ai/
rm -rf src/libs/langfuse/
rm -rf src/libs/mem0/

# Vercel chat components
rm -rf src/components/chat/vercel/
```

**Files removed:**
- `src/app/[locale]/(auth)/chat/vercel/page.tsx` - Vercel chat list page
- `src/app/[locale]/(auth)/chat/vercel/[conversationId]/page.tsx` - Conversation view
- `src/app/[locale]/(auth)/chat/vercel/error.tsx` - Error boundary
- `src/app/api/chat/vercel/route.ts` - Chat streaming endpoint
- `src/app/api/chat/vercel/conversations/route.ts` - Conversation management
- `src/app/api/chat/vercel/conversations/[id]/route.ts` - Single conversation operations
- `src/app/api/chat/messages/route.ts` - Message history endpoint (if Vercel-only)
- `src/libs/vercel-ai/` - AI provider configuration
- `src/libs/langfuse/` - LangFuse observability client
- `src/libs/mem0/` - Mem0 memory extraction
- `src/components/chat/vercel/` - Vercel chat UI components

**Note:** If you have shared components in `src/components/chat/` that are used by both implementations, only remove Vercel-specific ones.

---

### 2. Update Chat Landing Page

Edit `src/app/[locale]/(auth)/chat/page.tsx` to remove Vercel option:

```tsx
// Before: Shows both Dify and Vercel options
// After: Show only Dify chat or redirect directly

// Option A: Redirect directly to Dify chat
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  redirect('/chat/dify')
}

// Option B: Keep landing page but remove Vercel card
// Remove the entire chatConfig.vercel.configured conditional block
// Keep only the Dify chat card
```

**Find and remove:**
```tsx
// Remove this entire conditional block
{chatConfig.vercel.configured && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="size-5" />
        Vercel AI SDK Chat
      </CardTitle>
      {/* ... rest of Vercel card ... */}
    </CardHeader>
  </Card>
)}
```

---

### 3. Update Navigation Component

Edit `src/components/layout/MainAppShell.tsx` to remove Vercel chat link:

**Find this code block (around line 72):**
```tsx
// Only show Vercel chat if configured
...(chatConfig.vercel.configured
  ? [{ icon: Sparkles, label: 'Chat (AI SDK)', href: '/chat/vercel' }]
  : []),
```

**Remove the entire block** or keep it (it will auto-hide when Vercel env vars are removed).

You can also remove the `Sparkles` icon import if it's no longer used:
```tsx
// Remove from imports at top:
import { Sparkles } from 'lucide-react'
```

---

### 4. Clean Environment Variables

Edit `.env.example` and remove Vercel AI SDK, LangFuse, and Mem0-related variables:

```bash
# Remove these sections:

# Vercel AI SDK (entire section)
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_API_KEY=configured
AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o-mini
# Also remove Anthropic alternative comments

# LangFuse (entire section)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

# Mem0 Memory Integration (entire section)
ENABLE_MEM0=false
MEM0_API_KEY=m0-...

# Cron endpoint secret (if only used for Mem0)
CRON_SECRET=your-random-secret-here
```

Also remove these variables from your local `.env.local` file.

**Note:** `chatConfig.vercel.configured` will automatically return `false` when these variables are missing, hiding Vercel UI elements.

---

### 5. Update Database Schema

Edit `src/models/Schema.ts` to remove Vercel-related tables:

**Find and remove these table definitions:**

```typescript
// 1. Vercel conversations table (lines ~154-176)
export const vercelConversations = vtSaasSchema.table(/* ... */);

// 2. Vercel messages table (lines ~179-200)
export const vercelMessages = vtSaasSchema.table(/* ... */);

// 3. Mem0 memories table (lines ~203-225)
export const mem0Memories = vtSaasSchema.table(/* ... */);

// 4. Memory extraction jobs table (lines ~228-247)
export const memoryExtractionJobs = vtSaasSchema.table(/* ... */);
```

**Generate and apply migration:**
```bash
pnpm db:generate
```

This creates a migration to drop these four tables. The migration will auto-apply on next database interaction.

⚠️ **Data Loss Warning:** All Vercel conversations, messages, memories, and extraction jobs will be permanently deleted.

**Optional:** Before running migration, export data:
```sql
-- Connect to your database and run:
COPY vt_saas.vercel_conversations TO '/path/to/backup/conversations.csv' CSV HEADER;
COPY vt_saas.vercel_messages TO '/path/to/backup/messages.csv' CSV HEADER;
COPY vt_saas.mem0_memories TO '/path/to/backup/memories.csv' CSV HEADER;
COPY vt_saas.memory_extraction_jobs TO '/path/to/backup/jobs.csv' CSV HEADER;
```

---

### 6. Remove Dependencies

Uninstall Vercel AI SDK, LangFuse, and Mem0 packages:

```bash
# Remove Vercel AI SDK packages
pnpm remove ai @ai-sdk/openai

# Remove LangFuse packages
pnpm remove langfuse langfuse-vercel

# Remove Mem0 package
pnpm remove mem0ai

# Clean up unused dependencies
npm prune
npm dedupe
```

**Packages removed:**
- `ai` (v4.3.19) - Vercel AI SDK core
- `@ai-sdk/openai` (v1.3.24) - OpenAI provider
- `langfuse` (v3.38.6) - LangFuse observability
- `langfuse-vercel` (v3.38.6) - Vercel integration
- `mem0ai` (v2.2.2) - Memory extraction

**Note:** If you installed `@ai-sdk/anthropic` or other providers, remove those too:
```bash
pnpm remove @ai-sdk/anthropic
```

**Packages to keep** (used by other parts of the template):
- `@assistant-ui/react` - May be used elsewhere or can be removed if Vercel-only
- `@assistant-ui/react-ai-sdk` - Remove if `@assistant-ui/react` is removed
- `@assistant-ui/react-devtools` - Remove if `@assistant-ui/react` is removed
- `@assistant-ui/react-markdown` - Remove if `@assistant-ui/react` is removed

If you're certain these Assistant UI packages are only used for Vercel chat:
```bash
pnpm remove @assistant-ui/react @assistant-ui/react-ai-sdk @assistant-ui/react-devtools @assistant-ui/react-markdown
```

---

### 7. Remove Cron Jobs (if Mem0-only)

If your cron jobs are only for Mem0 memory extraction:

```bash
# Remove cron API route (if exists)
rm -rf src/app/api/cron/
```

If you have other cron jobs, keep the infrastructure and just remove Mem0-specific handlers.

---

### 8. Verify Removal

Run these commands to ensure clean removal:

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Build verification
pnpm build

# Run tests (if available)
pnpm test

# Run development server
pnpm dev
```

**Manual verification:**
1. Navigate to `/chat` - should show only Dify option or redirect to `/chat/dify`
2. Check sidebar navigation - "Chat (AI SDK)" link should be hidden
3. Visit `/chat/vercel` - should 404 or redirect
4. Check browser console - no errors about missing modules
5. Test Dify chat at `/chat/dify` - should work normally
6. Verify no LangFuse or Mem0 API calls in network tab

---

## Verification Checklist

- [ ] All Vercel chat files and directories deleted
- [ ] All LangFuse library files deleted
- [ ] All Mem0 library files deleted
- [ ] Chat landing page updated (no Vercel option shown)
- [ ] Navigation component cleaned (optional - auto-hides when env vars missing)
- [ ] Environment variables removed from `.env.example` and `.env.local`
- [ ] Database schema updated (4 tables removed)
- [ ] Migration generated with `pnpm db:generate`
- [ ] Vercel AI SDK packages uninstalled
- [ ] LangFuse packages uninstalled
- [ ] Mem0 packages uninstalled
- [ ] `npm prune` executed
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` completes successfully
- [ ] Development server runs without errors
- [ ] `/chat/vercel` returns 404 or redirects
- [ ] `/chat/dify` works correctly
- [ ] Sidebar navigation shows only Dify chat

---

## Troubleshooting

### Build fails with import errors

**Symptom:** TypeScript errors about missing AI SDK modules

**Solution:**
```bash
# Search for remaining Vercel/LangFuse/Mem0 imports
grep -r "from 'ai'" src/
grep -r "from '@ai-sdk" src/
grep -r "from 'langfuse" src/
grep -r "from '@/libs/langfuse" src/
grep -r "from '@/libs/mem0" src/
grep -r "from '@/libs/vercel-ai" src/

# Remove any found imports
```

### Navigation still shows Vercel link

**Symptom:** "Chat (AI SDK)" appears in sidebar despite removal

**Solution:**
- Verify all Vercel env vars removed from `.env.local`
- Clear `.next` build cache: `rm -rf .next`
- Restart dev server

### Database migration fails

**Symptom:** Error when generating migration

**Solution:**
- Ensure you removed all four table definitions correctly
- Check for references to removed tables elsewhere in the schema
- Verify no dangling foreign key references
- Try: `rm -rf drizzle/` and regenerate

### Type errors about Assistant UI

**Symptom:** TypeScript complains about `@assistant-ui/react` types

**Solution:**
```bash
# If Assistant UI was Vercel-only, remove it
pnpm remove @assistant-ui/react @assistant-ui/react-ai-sdk @assistant-ui/react-devtools @assistant-ui/react-markdown

# Clear caches
rm -rf .next/
rm -rf node_modules/.cache/

# Reinstall
pnpm install
pnpm build
```

### Leftover API routes cause 500 errors

**Symptom:** Requests to `/api/chat/vercel` fail with 500

**Solution:**
- Verify you deleted `src/app/api/chat/vercel/` completely
- Check for symlinks or hidden files
- Clear build: `rm -rf .next/ && pnpm build`

---

## What's Next

After removing Vercel AI SDK chat:

1. **Update documentation**: If you created custom docs, remove Vercel AI SDK references
2. **Update README**: Remove Vercel AI SDK from feature list
3. **Cleanup environment configs**: Update deployment platforms to remove all Vercel/LangFuse/Mem0 env vars
4. **Simplify landing page**: Consider redirecting `/chat` directly to `/chat/dify` for better UX
5. **Remove observability dashboards**: If you set up LangFuse dashboards, archive or delete them
6. **Cancel subscriptions**: If you have paid LangFuse or Mem0 plans, downgrade or cancel

**Related Guides:**
- [Removing Dify Chat](./removing-dify-chat.md)
- [Removing All Chat Features](./removing-all-chat.md)
- [SSE Streaming Pattern](../patterns/sse-streaming.md) (for reference)

---

**Need help?** Open an issue on the template repository with details about your setup and the specific error you're encountering.
