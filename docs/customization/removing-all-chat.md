# Removing All Chat Features

## Overview

This guide provides step-by-step instructions for completely removing all chat functionality from the VT SaaS Template, including both Dify and Vercel AI SDK implementations.

**What this guide removes:**
- All chat UI routes (`/chat/*`)
- All chat API endpoints (`/api/chat/*`)
- Both Dify and Vercel AI SDK libraries
- LangFuse and Mem0 integrations
- All chat-related database tables
- All chat-related environment variables
- All chat navigation links
- Chat landing page

**What remains:**
- Authentication system
- Dashboard and user management
- Settings and preferences
- Admin features
- Feedback system
- All other template features

**When to use this guide:**
- You're building a SaaS app that doesn't need chat/AI features
- You want to start with a minimal template
- You're replacing chat with a different implementation
- You want to reduce dependencies and complexity

---

## Before You Begin

⚠️ **Warning: This action cannot be undone.** Before proceeding:

1. **Back up your data**: Export all conversations, messages, and memories from the database if you want to keep them
2. **Commit pending changes**: Ensure your git working directory is clean
3. **Close development servers**: Stop any running `pnpm dev` processes
4. **Consider alternatives**: If you only want to remove one implementation, see the specific removal guides:
   - [Removing Dify Chat Only](./removing-dify-chat.md)
   - [Removing Vercel AI SDK Chat Only](./removing-vercel-chat.md)

**Prerequisites:**
- Git repository with committed changes
- Node.js and pnpm installed (pnpm via `corepack enable`)
- Database access for schema modifications

---

## Step-by-Step Removal

### 1. Remove All Chat Code Files

Delete all chat-related directories:

```bash
# Remove entire chat routes directory
rm -rf src/app/[locale]/(auth)/chat/

# Remove entire chat API directory
rm -rf src/app/api/chat/

# Remove all chat component directories
rm -rf src/components/chat/

# Remove all chat-related libraries
rm -rf src/libs/dify/
rm -rf src/libs/vercel-ai/
rm -rf src/libs/langfuse/
rm -rf src/libs/mem0/
```

**What's removed:**
- **Routes**: All `/chat/*` pages (Dify threads, Vercel conversations, landing page)
- **API**: All `/api/chat/*` endpoints (streaming, conversations, messages)
- **Components**: All chat UI components (message lists, input forms, thread lists)
- **Libraries**: Dify client, AI provider configs, observability, memory extraction

---

### 2. Update Navigation Component

Edit `src/components/layout/MainAppShell.tsx` to remove all chat navigation links:

**Find and remove these blocks (around lines 68-74):**
```tsx
// Remove both chat navigation items:
...(chatConfig.dify.configured
  ? [{ icon: MessageSquare, label: 'Chat (Dify)', href: '/chat/dify' }]
  : []),
...(chatConfig.vercel.configured
  ? [{ icon: Sparkles, label: 'Chat (AI SDK)', href: '/chat/vercel' }]
  : []),
```

**Remove unused imports:**
```tsx
// Remove from imports at top of file:
import { MessageSquare, Sparkles } from 'lucide-react'
import { getPublicChatConfig } from '@/utils/chatConfig'

// Remove chatConfig usage:
const chatConfig = getPublicChatConfig()  // Delete this line
```

**Result:** Navigation sidebar will no longer show any chat links.

---

### 3. Remove Chat Configuration

Delete the chat configuration utility (if it's chat-only):

```bash
rm -f src/utils/chatConfig.ts
```

**Note:** If `chatConfig.ts` contains other non-chat configuration, keep it and remove only chat-related exports.

---

### 4. Clean Environment Variables

Edit `.env.example` and remove all chat-related environment variables:

```bash
# Remove these entire sections:

# Dify (AI chat) - entire section
DIFY_API_KEY=your_dify_api_key
DIFY_API_URL=https://api.dify.ai/v1
NEXT_PUBLIC_DIFY_API_URL=https://api.dify.ai/v1

# Vercel AI SDK - entire section
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_API_KEY=configured
AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o-mini
# (Also remove Anthropic alternative section)

# LangFuse - entire section
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com

# Mem0 Memory Integration - entire section
ENABLE_MEM0=false
MEM0_API_KEY=m0-...

# Cron endpoint secret (if chat-only)
CRON_SECRET=your-random-secret-here
```

Also remove these variables from your local `.env.local` file.

---

### 5. Update Middleware (Optional)

Edit `src/middleware.ts` to remove `/chat` from protected paths:

**Find this array (around line 20):**
```typescript
const protectedPaths = [
  '/dashboard',
  '/onboarding',
  '/chat',        // Remove this line
  '/admin',
]
```

**After removal:**
```typescript
const protectedPaths = [
  '/dashboard',
  '/onboarding',
  '/admin',
]
```

**Note:** This step is optional. Leaving `/chat` in protectedPaths is harmless since the routes no longer exist (will 404). Remove it for cleaner code.

---

### 6. Update Database Schema

Edit `src/models/Schema.ts` to remove all chat-related tables:

**Find and remove these five table definitions:**

```typescript
// 1. Dify threads table (lines ~50-77)
export const threads = vtSaasSchema.table(
  'threads',
  { /* ... */ }
)

// 2. Vercel conversations table (lines ~154-176)
export const vercelConversations = vtSaasSchema.table(
  'vercel_conversations',
  { /* ... */ }
)

// 3. Vercel messages table (lines ~179-200)
export const vercelMessages = vtSaasSchema.table(
  'vercel_messages',
  { /* ... */ }
)

// 4. Mem0 memories table (lines ~203-225)
export const mem0Memories = vtSaasSchema.table(
  'mem0_memories',
  { /* ... */ }
)

// 5. Memory extraction jobs table (lines ~228-247)
export const memoryExtractionJobs = vtSaasSchema.table(
  'memory_extraction_jobs',
  { /* ... */ }
)
```

**Generate and apply migration:**
```bash
pnpm db:generate
```

This creates a migration to drop all five chat-related tables. The migration will auto-apply on next database interaction.

⚠️ **Data Loss Warning:** All chat data will be permanently deleted:
- Dify conversation threads
- Vercel conversations and messages
- Extracted memories
- Memory extraction jobs

**Optional:** Before running migration, export all data:
```sql
-- Connect to your database and run:
COPY vt_saas.threads TO '/path/to/backup/threads.csv' CSV HEADER;
COPY vt_saas.vercel_conversations TO '/path/to/backup/conversations.csv' CSV HEADER;
COPY vt_saas.vercel_messages TO '/path/to/backup/messages.csv' CSV HEADER;
COPY vt_saas.mem0_memories TO '/path/to/backup/memories.csv' CSV HEADER;
COPY vt_saas.memory_extraction_jobs TO '/path/to/backup/jobs.csv' CSV HEADER;
```

---

### 7. Remove Dependencies

Uninstall all chat-related packages:

```bash
# Remove Vercel AI SDK packages
pnpm remove ai @ai-sdk/openai

# Remove Assistant UI packages (if chat-only)
pnpm remove @assistant-ui/react @assistant-ui/react-ai-sdk @assistant-ui/react-devtools @assistant-ui/react-markdown

# Remove LangFuse packages
pnpm remove langfuse langfuse-vercel

# Remove Mem0 package
pnpm remove mem0ai

# If you installed Anthropic provider
pnpm remove @ai-sdk/anthropic

# Clean up unused dependencies
npm prune
npm dedupe
```

**Packages removed:**
- `ai` - Vercel AI SDK core
- `@ai-sdk/openai` - OpenAI provider
- `@ai-sdk/anthropic` - Anthropic provider (if installed)
- `@assistant-ui/react` - Chat UI components
- `@assistant-ui/react-ai-sdk` - Vercel AI SDK adapter
- `@assistant-ui/react-devtools` - Dev tools
- `@assistant-ui/react-markdown` - Markdown rendering
- `langfuse` - Observability
- `langfuse-vercel` - Vercel integration
- `mem0ai` - Memory extraction

**Packages to keep** (used by other template features):
- All Next.js, React, Drizzle, Supabase packages
- UI components (Radix, shadcn)
- Form handling, email, etc.

---

### 8. Remove Cron Jobs (if chat-only)

If your cron infrastructure is only for Mem0:

```bash
# Remove cron API routes
rm -rf src/app/api/cron/
```

If you have other cron jobs, keep the infrastructure and remove only chat-specific handlers.

---

### 9. Update Documentation References

**Update README.md:**

Remove chat from feature list:
```markdown
# Before:
- ✅ AI Chat (Dify + Vercel AI SDK implementations)
- ✅ LangFuse observability
- ✅ Mem0 memory extraction

# After:
(Remove these lines entirely)
```

**Update CLAUDE.md:**

Remove chat sections:
```markdown
# Remove these sections:
- Chat/AI Integration
- Dify Client
- Assistant UI
- LangFuse
- Mem0
```

---

### 10. Verify Removal

Run these commands to ensure complete clean removal:

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Build verification
pnpm build

# Run tests
pnpm test

# Run development server
pnpm dev
```

**Manual verification:**
1. Visit `/chat` - should return 404
2. Visit `/chat/dify` - should return 404
3. Visit `/chat/vercel` - should return 404
4. Check sidebar navigation - no chat links visible
5. Check browser console - no errors about missing modules
6. Navigate through dashboard, settings, profile - all work normally
7. Verify no API calls to `/api/chat/*` in network tab
8. Test authentication flow - should work without issues

---

## Verification Checklist

**Code Removal:**
- [ ] All chat routes deleted (`src/app/[locale]/(auth)/chat/`)
- [ ] All chat API endpoints deleted (`src/app/api/chat/`)
- [ ] All chat components deleted (`src/components/chat/`)
- [ ] All chat libraries deleted (dify, vercel-ai, langfuse, mem0)
- [ ] Chat configuration utility removed or cleaned

**Navigation & UI:**
- [ ] Navigation component updated (chat links removed)
- [ ] Chat-related icons removed from imports if unused
- [ ] Landing pages no longer reference chat features

**Configuration:**
- [ ] All chat env vars removed from `.env.example`
- [ ] All chat env vars removed from `.env.local`
- [ ] Middleware updated (optional - `/chat` removed from protectedPaths)

**Database:**
- [ ] Database schema updated (5 tables removed)
- [ ] Migration generated with `pnpm db:generate`
- [ ] Optional: Data exported for backup

**Dependencies:**
- [ ] Vercel AI SDK packages uninstalled
- [ ] Assistant UI packages uninstalled
- [ ] LangFuse packages uninstalled
- [ ] Mem0 package uninstalled
- [ ] `npm prune` executed
- [ ] `npm dedupe` executed

**Documentation:**
- [ ] README.md updated (chat features removed)
- [ ] CLAUDE.md updated (chat sections removed)
- [ ] Other docs updated if they reference chat

**Verification:**
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` completes successfully
- [ ] `pnpm test` passes (if tests exist)
- [ ] Development server runs without errors
- [ ] All `/chat/*` routes return 404
- [ ] Navigation shows no chat links
- [ ] Other features work normally

---

## Troubleshooting

### Build fails with import errors

**Symptom:** TypeScript errors about missing chat modules

**Solution:**
```bash
# Search for remaining chat-related imports across the codebase
grep -r "from '@/app/\[locale\]/\(auth\)/chat" src/
grep -r "from '@/app/api/chat" src/
grep -r "from '@/components/chat" src/
grep -r "from '@/libs/dify" src/
grep -r "from '@/libs/vercel-ai" src/
grep -r "from '@/libs/langfuse" src/
grep -r "from '@/libs/mem0" src/
grep -r "from 'ai'" src/
grep -r "from '@ai-sdk" src/
grep -r "from 'langfuse" src/
grep -r "from 'mem0ai'" src/
grep -r "from '@assistant-ui" src/

# Remove any found imports
```

### Navigation component errors

**Symptom:** TypeScript errors in `MainAppShell.tsx`

**Solution:**
- Ensure you removed the `chatConfig` variable declaration
- Remove `getPublicChatConfig` import
- Remove unused icon imports (`MessageSquare`, `Sparkles`)
- Clear build: `rm -rf .next/ && pnpm build`

### Database migration fails

**Symptom:** Error when generating migration

**Solution:**
- Verify you removed all five table definitions
- Check for no dangling commas or syntax errors
- Ensure no other code references the removed tables
- Try: `rm -rf drizzle/` and regenerate: `pnpm db:generate`

### Type errors persist after removal

**Symptom:** TypeScript complains about missing types

**Solution:**
```bash
# Clear all caches
rm -rf .next/
rm -rf node_modules/.cache/
rm -rf drizzle/

# Fresh install and build
pnpm install
pnpm build
```

### Routes still accessible

**Symptom:** `/chat` returns a page instead of 404

**Solution:**
- Verify you deleted `src/app/[locale]/(auth)/chat/` completely
- Check for symlinks or hidden files
- Clear build and restart:
```bash
rm -rf .next/
pnpm dev
```

### Middleware errors

**Symptom:** Middleware throws errors about missing modules

**Solution:**
- If you removed `chatConfig.ts`, ensure no middleware code imports it
- Check for any auth logic that references chat routes
- Review middleware for any chat-specific session checks

---

## What's Next

After removing all chat features:

1. **Clean up deployment configs**:
   - Remove all chat env vars from Vercel, Railway, or other hosting platforms
   - Update environment variable documentation

2. **Update branding/marketing**:
   - Remove chat from landing pages
   - Update screenshots/demos
   - Remove chat from feature comparison tables

3. **Cancel subscriptions**:
   - Dify API plan (if paid)
   - OpenAI/Anthropic API access (if dedicated to chat)
   - LangFuse plan (if paid)
   - Mem0 plan (if paid)

4. **Refactor dashboard**:
   - Consider what to show on main dashboard without chat
   - Add new primary features if chat was central

5. **Archive chat data**:
   - If you exported data, store backups securely
   - Document data retention for compliance

6. **Test thoroughly**:
   - Run full E2E test suite
   - Manual QA of all remaining features
   - Verify no broken links or missing pages

7. **Update documentation**:
   - Development guide
   - Deployment guide
   - User onboarding if it mentioned chat

**Alternative implementations:**
- If replacing chat with different AI features, see template docs for integration patterns
- Consider standalone chat libraries if you need basic support chat (not AI)

**Related Guides:**
- [Removing Dify Chat Only](./removing-dify-chat.md) - If you want to keep Vercel AI SDK
- [Removing Vercel Chat Only](./removing-vercel-chat.md) - If you want to keep Dify
- [API Proxy Pattern](../patterns/api-proxy.md) - For reference if building new integrations
- [SSE Streaming Pattern](../patterns/sse-streaming.md) - For reference if building new real-time features

---

## Frequently Asked Questions

**Q: Can I undo this later?**

A: Yes, but you'll need to:
1. Restore code from git history
2. Reinstall dependencies
3. Restore database tables (if you kept backups)
4. Reconfigure environment variables

**Q: Will this affect my authentication system?**

A: No. Chat features are completely separate from authentication. All auth flows remain intact.

**Q: What about the database migrations?**

A: Migrations that dropped chat tables remain in your migration history. This is normal and safe. Don't delete migration files.

**Q: Should I remove chat-related migrations from git?**

A: No. Keep all migration files to maintain database history consistency. Removing migrations can cause issues in production.

**Q: Can I keep some chat components for other features?**

A: Yes, but you'll need to manually select what to keep instead of deleting entire directories. Review each component carefully.

**Q: Will this reduce my bundle size?**

A: Yes, significantly. Removing AI SDK, Assistant UI, LangFuse, and Mem0 will reduce your production bundle by several hundred KB.

---

**Need help?** Open an issue on the template repository with:
- What step you're on
- The specific error message
- Your Node.js and npm versions
- Whether you modified chat code before removal
