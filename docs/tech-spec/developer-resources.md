# Developer Resources

## File Paths Reference

**Complete list of all files involved:**

**NEW Files:**
```
src/app/[locale]/(auth)/chat/layout.tsx
src/app/[locale]/(auth)/chat/page.tsx
src/app/[locale]/(auth)/chat/[threadId]/page.tsx
src/components/chat/AppShell.tsx
src/components/chat/ThreadListSidebar.tsx
src/components/chat/ThreadItem.tsx
src/components/chat/EmptyThreadState.tsx
src/components/chat/ThreadTitleEditor.tsx
src/app/api/threads/route.ts
src/app/api/threads/[id]/route.ts
src/app/api/threads/[id]/archive/route.ts
src/libs/supabase/threads.ts
```

**MODIFIED Files:**
```
src/models/Schema.ts                      # Add threads table
src/app/api/chat/route.ts                 # Add thread creation
src/components/chat/ChatInterface.tsx     # Replace with Thread component
package.json                               # Add @assistant-ui/react-devtools
```

**DELETED Files:**
```
src/app/[locale]/(chat)/chat/             # Old chat route (replaced)
```

## Key Code Locations

**Authentication & Session:**
- Middleware logic: `src/middleware.ts:1-50`
- Server-side Supabase client: `src/libs/supabase/server.ts:createClient()`
- Client-side Supabase client: `src/libs/supabase/client.ts:createClient()`

**Database & ORM:**
- Schema definitions: `src/models/Schema.ts`
- Database connection: `src/libs/DB.ts:db`
- Thread table schema: `src/models/Schema.ts:healthCompanionSchema.threads`
- Thread queries helper: `src/libs/supabase/threads.ts` (NEW)

**AI Integration:**
- Dify client: `src/libs/dify/client.ts:DifyClient`
- Chat API endpoint: `src/app/api/chat/route.ts:POST`
- Conversation ID handling: `src/app/api/chat/route.ts:48` (conversationId param)
- SSE streaming: `src/app/api/chat/route.ts:102-117`

**Assistant UI Components:**
- Thread list: `src/components/chat/ThreadListSidebar.tsx` (NEW)
- Thread view: `src/app/[locale]/(auth)/chat/[threadId]/page.tsx` (NEW)
- App shell: `src/components/chat/AppShell.tsx` (NEW)
- DevTools integration: `src/app/[locale]/(auth)/chat/layout.tsx` (NEW)

**UI Primitives (shadcn/ui):**
- Button: `src/components/ui/button.tsx`
- Sheet (sidebar): `src/components/ui/sheet.tsx`
- Input: `src/components/ui/input.tsx`
- Skeleton (loading): `src/components/ui/skeleton.tsx`
- Tooltip: `src/components/ui/tooltip.tsx`

## Testing Locations

**Unit Tests:**
```
src/app/api/threads/route.test.ts              # NEW - Thread API tests
src/components/chat/ThreadListSidebar.test.tsx # NEW - Component tests
src/components/chat/AppShell.test.tsx          # NEW - Layout tests
```

**E2E Tests:**
```
tests/e2e/multi-thread-chat.spec.ts            # NEW - Full flow tests
tests/e2e/thread-switching.spec.ts             # NEW - Navigation tests
tests/e2e/thread-editing.spec.ts               # NEW - Title edit tests
```

**Test Commands:**
```bash
npm test                              # Run all unit tests
npm test -- --watch                   # Watch mode
npm test src/app/api/threads/route.test.ts  # Specific test
npm run test:e2e                      # All E2E tests
npm run test:e2e -- --headed          # E2E with browser visible
npm run test:e2e -- --debug           # E2E debug mode
```

## Documentation to Update

**README.md:**
- Add feature: "Multi-threaded chat conversations"
- Update screenshots (before/after sidebar)
- Add note about health_companion schema in Supabase

**CHANGELOG.md:**
- Entry for this feature release
- Breaking changes: Old `/chat` route replaced with `/chat/[threadId]`

**docs/architecture.md:**
- Add database schema diagram for health_companion.threads
- Document thread management architecture
- Add Assistant UI integration notes

**docs/development-guide.md:**
- Add section on creating Supabase schemas
- Document thread management workflow
- Add Assistant UI devtools usage

**API Documentation (if exists):**
- Document new `/api/threads` endpoints
- Update `/api/chat` endpoint (thread creation behavior)
- Add request/response examples

---
