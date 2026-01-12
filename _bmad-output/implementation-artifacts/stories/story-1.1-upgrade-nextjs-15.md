# Story 1.1: Upgrade Next.js to Version 15

**Epic:** Epic 1 - Template Foundation & Modernization
**Story ID:** 1.1
**Status:** ready-for-dev
**Assigned To:** upgrade-specialist
**Priority:** High
**Estimate:** 5 story points

---

## User Story

As a **template user (developer)**,
I want **the template upgraded to Next.js 15**,
So that **I have access to the latest framework features and performance improvements**.

---

## Acceptance Criteria

### AC1: Package Upgrade
**Given** the current Next.js 14 installation
**When** I upgrade to Next.js 15
**Then** the package.json shows next@15.x
**And** all page components use async params/searchParams patterns
**And** `npm run build` completes with 0 errors
**And** `npm run dev` starts without errors
**And** all existing routes render correctly

### AC2: Async Params Pattern
**Given** any page using params or searchParams
**When** I review the component code
**Then** params and searchParams are awaited before use
**And** TypeScript types are updated for async params

---

## Context

### Current State
- **Next.js Version:** 14.2.25 (from package.json)
- **React Version:** 18.3.1 (will be upgraded in Story 1.2)
- **TypeScript Version:** 5.6.3 (will be upgraded in Story 1.4)

### Key Files Using Params/SearchParams
Based on codebase analysis:

**Page Components (require async params):**
- `src/app/[locale]/(auth)/chat/page.tsx` - Uses params for locale in generateMetadata
- `src/app/[locale]/(auth)/chat/[threadId]/page.tsx` - Uses params for locale and threadId
- `src/app/[locale]/(auth)/(center)/sign-in/page.tsx` - Uses params for locale
- `src/app/[locale]/(auth)/(center)/sign-up/page.tsx` - Uses params for locale
- `src/app/[locale]/(auth)/dashboard/page.tsx` - Async server component (already compatible)
- `src/app/[locale]/page.tsx` - Root page with locale param

**API Routes (URL searchParams - NOT affected):**
- `src/app/auth/callback/route.ts` - Uses URL searchParams (different pattern, no change needed)
- `src/app/api/chat/messages/route.ts` - Uses URL searchParams (different pattern, no change needed)

### Breaking Changes in Next.js 15
From Next.js 15 migration guide:

1. **Async Request APIs** (CRITICAL):
   - `params`, `searchParams` in page/layout/route components are now Promises
   - Must be awaited: `const { locale } = await props.params`
   - generateMetadata functions must await params
   - This is the PRIMARY breaking change for this codebase

2. **fetch() caching defaults**:
   - Changed from `cache: 'force-cache'` to `cache: 'no-store'`
   - Low impact: codebase uses Supabase SDK, not direct fetch for data

3. **Route handlers (GET/POST)**:
   - No longer cached by default (now dynamic by default)
   - Low impact: API routes already use dynamic data

4. **React 19 Support** (OPTIONAL in Next.js 15):
   - Can keep React 18 for now (upgrade in Story 1.2)
   - Next.js 15 supports both React 18 and 19

---

## Tasks

### Task 1: Upgrade Next.js Package
**Description:** Update Next.js to version 15.x and verify dependencies

**Subtasks:**
1. [ ] Update package.json: `next` to `^15.1.6` (latest stable as of Jan 2025)
2. [ ] Run `npm install` to update lockfile
3. [ ] Run `npm run build` - expect failures related to async params
4. [ ] Document any dependency warnings for future resolution

**Test Coverage:**
- Build completes after param migration (Task 3)
- No peer dependency conflicts

**Dev Notes:**
- Keep React 18.x for now (Story 1.2 handles React 19)
- Next.js 15.1.x fully supports React 18
- Review npm warnings but don't block on peer dependency notices

---

### Task 2: Migrate Page Components to Async Params Pattern
**Description:** Update all page/layout components to await params and searchParams

**Subtasks:**

#### 2.1: Update Chat Page with Locale Param
- [ ] File: `src/app/[locale]/(auth)/chat/page.tsx`
- [ ] Update generateMetadata:
  ```typescript
  export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    // rest of function unchanged
  }
  ```
- [ ] Update component signature if params are used in render
- [ ] Verify TypeScript types resolve correctly

#### 2.2: Update Chat Thread Page with Dynamic Params
- [ ] File: `src/app/[locale]/(auth)/chat/[threadId]/page.tsx`
- [ ] Update props type: `{ params: Promise<{ locale: string; threadId: string }> }`
- [ ] Await params in both generateMetadata and component body
- [ ] Example:
  ```typescript
  export default async function ChatThreadPage(props: {
    params: Promise<{ locale: string; threadId: string }>;
  }) {
    const { locale, threadId } = await props.params;
    // use locale and threadId
  }
  ```

#### 2.3: Update Sign-In Page
- [ ] File: `src/app/[locale]/(auth)/(center)/sign-in/page.tsx`
- [ ] Await params if locale is accessed in metadata or component
- [ ] Update props type signature

#### 2.4: Update Sign-Up Page
- [ ] File: `src/app/[locale]/(auth)/(center)/sign-up/page.tsx`
- [ ] Await params if locale is accessed in metadata or component
- [ ] Update props type signature

#### 2.5: Update Root Locale Page
- [ ] File: `src/app/[locale]/page.tsx`
- [ ] Await params for locale access
- [ ] Update any metadata generation

#### 2.6: Review Unauth Page
- [ ] File: `src/app/[locale]/(unauth)/page.tsx`
- [ ] Verify if params are used (if yes, await them)

#### 2.7: Review Dashboard Page
- [ ] File: `src/app/[locale]/(auth)/dashboard/page.tsx`
- [ ] Already async server component
- [ ] Verify no params usage or update if needed

**Test Coverage:**
- All routes render without TypeScript errors
- Locale detection works correctly
- Dynamic routes (threadId) receive correct params
- generateMetadata functions execute without errors

**Dev Notes:**
- searchParams in pages also become async in Next.js 15 (if used)
- Current codebase doesn't use searchParams in page components (only in API routes via URL)
- Focus on params migration only
- Use TypeScript strict mode to catch missed awaits

---

### Task 3: Verify Build & Development Server
**Description:** Ensure clean build and dev server startup

**Subtasks:**
1. [ ] Run `npm run build` - must complete with 0 errors
2. [ ] Run `npm run dev` - must start without errors
3. [ ] Run `npm run check-types` - must pass with 0 type errors
4. [ ] Check terminal for any Next.js warnings about deprecated patterns
5. [ ] Document any warnings for future stories

**Test Coverage:**
- Production build succeeds
- Development server starts on port 3000
- TypeScript compilation clean

**Dev Notes:**
- If build fails, review error messages for additional async patterns
- Check for any dynamic route segments not yet migrated
- Verify no runtime errors in browser console on startup

---

### Task 4: Manual Route Verification
**Description:** Manually test all routes to ensure they render correctly

**Subtasks:**
1. [ ] Test unauthenticated routes:
   - Navigate to `/en` (landing page)
   - Navigate to `/en/sign-in`
   - Navigate to `/en/sign-up`
   - Verify locale switching works (change to `/hi`, `/bn`)

2. [ ] Test authenticated routes (sign in first):
   - Navigate to `/en/dashboard`
   - Verify personalized greeting appears
   - Navigate to `/en/chat`
   - Verify chat interface loads
   - Navigate to `/en/chat/[any-id]` (test dynamic route)
   - Verify thread page loads

3. [ ] Test edge cases:
   - Refresh page on dynamic route
   - Direct URL access to protected routes
   - Invalid locale handling
   - Invalid threadId handling

**Test Coverage:**
- All routes accessible
- No white screens or runtime errors
- Console shows no errors related to params
- Redirects work correctly (auth middleware)

**Dev Notes:**
- Use browser dev tools to monitor console
- Check Network tab for failed requests
- Verify middleware still intercepts correctly
- Test both hot reload and hard refresh

---

### Task 5: Update Type Definitions (if needed)
**Description:** Ensure TypeScript types align with Next.js 15 patterns

**Subtasks:**
1. [ ] Review `next-env.d.ts` - should auto-update after build
2. [ ] Check for any custom page prop types in codebase
3. [ ] Update any utility types that reference page props
4. [ ] Run `npm run check-types` to verify no type regressions

**Test Coverage:**
- TypeScript compilation succeeds
- IDE autocomplete works for params/searchParams
- No `any` types introduced

**Dev Notes:**
- Next.js 15 types are in `@types/react` and built-in Next.js types
- If custom types exist, update to: `{ params: Promise<T> }`
- VSCode should show correct types on hover

---

### Task 6: Documentation Update
**Description:** Update codebase documentation to reflect Next.js 15 patterns

**Subtasks:**
1. [ ] Update `CLAUDE.md` if it references Next.js 14 patterns
2. [ ] Check README.md for version-specific instructions
3. [ ] Add note about async params pattern to developer guide
4. [ ] Update package.json version number (next release)

**Test Coverage:**
- Documentation accurately reflects new patterns
- No outdated code examples

**Dev Notes:**
- Keep migration notes minimal - focus on "what changed"
- Link to Next.js 15 upgrade guide if needed
- Ensure CLAUDE.md reflects async params requirement

---

## Technical Notes

### Migration Strategy
1. **Incremental Approach:** Upgrade package first, then fix compile errors
2. **Type Safety First:** Let TypeScript guide you to missed migrations
3. **Test Early:** Run build after each file migration to catch issues
4. **No Runtime Flags:** Next.js 15 has no feature flags for async params (always on)

### Common Migration Patterns

**Before (Next.js 14):**
```typescript
export default function Page({ params }: { params: { locale: string } }) {
  const { locale } = params; // synchronous
  return <div>{locale}</div>;
}
```

**After (Next.js 15):**
```typescript
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // async
  return <div>{locale}</div>;
}
```

**generateMetadata Pattern:**
```typescript
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Chat' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}
```

### Known Edge Cases
- **API Routes:** Use `new URL(request.url).searchParams` (NOT affected by this change)
- **Middleware:** Continues to use `NextRequest.nextUrl.searchParams` (NOT affected)
- **Client Components:** Cannot use async params (must receive via props from server)
- **Layout Components:** Also require async params if they access route params

### Performance Implications
- **Positive:** Next.js 15 has improved build times and smaller bundle sizes
- **Neutral:** Async params add negligible overhead (params are always async in runtime anyway)
- **Watch:** First build after upgrade may be slower (cache rebuild)

### Rollback Plan
If critical issues arise:
1. Revert package.json to `next@14.2.25`
2. Run `npm install`
3. Revert param migrations
4. Document blocker for team review

---

## Testing Requirements

### Automated Tests
- [ ] All existing unit tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Type checking passes: `npm run check-types`
- [ ] Linting passes: `npm run lint`

### Manual Testing
- [ ] Landing page loads at `/en`, `/hi`, `/bn`
- [ ] Sign-in flow completes successfully
- [ ] Dashboard displays personalized greeting
- [ ] Chat interface loads and accepts input
- [ ] Dynamic chat thread route works (`/chat/[threadId]`)
- [ ] Middleware redirects work (unauth → sign-in)
- [ ] Locale switching works across all pages
- [ ] No console errors on any route

### Regression Checks
- [ ] Dark mode toggle works
- [ ] Responsive design intact (mobile, tablet, desktop)
- [ ] i18n translations load correctly
- [ ] Supabase auth session persists
- [ ] Chat streaming still functions

---

## Definition of Done

- [x] Next.js upgraded to 15.x in package.json
- [x] All page components migrated to async params pattern
- [x] Build completes with 0 errors
- [x] Development server starts without errors
- [x] All routes render correctly (manual verification)
- [x] TypeScript types updated and passing
- [x] No new console errors or warnings
- [x] All automated tests pass
- [x] Documentation updated
- [x] Code review completed
- [x] Changes committed with conventional commit message

---

## Dependencies

**Depends On:**
- None (first story in epic)

**Blocks:**
- Story 1.2: Upgrade React to Version 19 (Next.js 15 required first)
- Story 1.4: Upgrade TypeScript (should happen after framework stable)

**Related:**
- Story 1.8: Validate CI/CD Pipeline (will test this upgrade in CI)
- Story 1.9: Validate Existing Features (comprehensive post-upgrade check)

---

## Dev Notes for upgrade-specialist Agent

### Execution Order (CRITICAL)
1. **Start with Task 1** - package upgrade first
2. **Expect build to fail** - that's normal, params aren't migrated yet
3. **Migrate files one by one** (Task 2) - test build after each 2-3 files
4. **Run full verification** (Tasks 3-4) only after all migrations done
5. **Update docs last** (Task 6) - ensures examples are tested

### TypeScript is Your Friend
- Run `npm run check-types` frequently
- TypeScript will show exactly which params need awaiting
- Look for errors like: "Property 'locale' does not exist on type 'Promise<...>'"
- Fix by adding `await` before destructuring

### Common Pitfalls
1. **Forgetting `await` keyword** - most common error
2. **Not making component async** - must be `async function` to use `await`
3. **Mixing up API route searchParams** - those use URL object, not affected
4. **Client component params** - if you see `'use client'`, skip it or pass via props

### Quick Verification Commands
```bash
# After each migration:
npm run check-types        # Should show fewer errors each time
npm run build              # Try build (may fail until all done)

# Final verification:
npm run build && npm run dev
npm test
npm run lint
```

### If You Get Stuck
1. Check Next.js 15 migration guide: https://nextjs.org/docs/app/building-your-application/upgrading/version-15
2. Review error messages - they usually point to exact line
3. Search for "params:" in codebase to find all usages
4. Use `grep -r "params:" src/app --include="*.tsx"` to find all occurrences

### Quality Checklist Before Marking Complete
- [ ] No TypeScript errors (`npm run check-types`)
- [ ] No build errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Manual test of at least 5 routes
- [ ] Check browser console for runtime errors
- [ ] Verify hot reload works in dev mode

---

## Story Metadata

**Created:** 2026-01-12
**Epic:** Epic 1 - Template Foundation & Modernization
**Sprint:** Sprint 1
**Story Points:** 5
**Risk Level:** Medium (breaking changes, but well-documented)
**Technical Debt:** None introduced (actually reduces debt by modernizing)

---

## References

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Async Request APIs RFC](https://github.com/vercel/next.js/discussions/58724)
- Project CLAUDE.md: `/Users/varuntorka/Coding/vt-saas-template/CLAUDE.md`
- Current package.json: Shows Next.js 14.2.25, React 18.3.1, TypeScript 5.6.3
