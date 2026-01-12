---
project_name: 'VT SaaS Template'
user_name: 'Varun'
date: '2026-01-06'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'development_workflow', 'critical_dont_miss_rules']
existing_patterns_found: 15
status: 'complete'
completed_at: '2026-01-06'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Framework
- **Next.js**: 15.1.6 (App Router) - Upgraded from 14.2.25
- **React**: 19.2.3 - Upgraded from 18.3.1
- **TypeScript**: 5.7.3 (strict mode) - Upgraded from 5.6.3
- **Node.js**: Target ES2017

### Database & ORM
- **Drizzle ORM**: 0.35.1
- **PostgreSQL**: 15+ (via Supabase)
- **pg**: 8.13.0
- **PGlite**: 0.2.12 (local dev only)

### Authentication
- **Supabase SSR**: 0.1.0
- **Supabase JS**: 2.86.0

### UI & Styling
- **Tailwind CSS**: 3.4.14
- **Radix UI**: Latest stable (1.x and 2.x compatible versions)
- **shadcn/ui**: Pattern-based (Radix UI + CVA + clsx + tailwind-merge)
- **Assistant UI**: 0.11.47
- **Lucide React**: 0.453.0

### Forms & Validation
- **React Hook Form**: 7.53.0
- **Zod**: 3.23.8
- **@hookform/resolvers**: 3.9.0

### Internationalization
- **next-intl**: 3.21.1 (en, hi, bn)

### Testing
- **Vitest**: 2.1.9 (unit tests)
- **Playwright**: 1.48.1 (E2E tests)
- **Testing Library React**: 16.0.1
- **Storybook**: 8.6.14

### Code Quality
- **ESLint**: 8.57.1 with @antfu/eslint-config 2.27.3
- **Commitlint**: 19.5.0
- **Husky**: 9.1.6
- **lint-staged**: 15.2.10

### Monitoring & Logging
- **Sentry Next.js**: 8.34.0
- **Pino**: 9.5.0
- **@logtail/pino**: 0.5.2

### Critical Version Constraints
- TypeScript must stay on 5.x (breaking changes in 6.x)
- Next.js 14 → 15 migration planned (breaking changes in App Router)
- React 18 → 19 migration planned (Server Components changes)
- All Radix UI packages should use compatible versions

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**Strict Mode Configuration (CRITICAL):**
- All strict checks enabled - code must pass strict null checks, no implicit any, no unchecked indexed access
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`, always check before use
- `noImplicitReturns: true` - All code paths must return
- `noUnusedLocals` and `noUnusedParameters` - Remove unused variables/parameters
- `allowUnreachableCode: false` - No dead code allowed

**Import/Export Patterns:**
- ALWAYS use path aliases: `@/*` for `./src/*`, `@/public/*` for `./public/*`
- Use `@/` prefix for all src imports (NOT relative paths like `../../`)
- Example: `import { Button } from '@/components/ui/button'`
- ES modules only (import/export, no require)

**Critical TypeScript Patterns:**

1. **Array/Object Access** - Always check for undefined:
   ```typescript
   const item = array[0]; // Type: T | undefined
   if (item) { /* use item */ } // Required check
   ```

2. **Null/Undefined Checks** - strictNullChecks enforced:
   ```typescript
   const user = getUser();
   if (user) {
     console.log(user.name);
   } // Required check
   ```

3. **Function Returns** - All paths must return:
   ```typescript
   function getValue(flag: boolean): string {
     if (flag) {
       return 'yes';
     }
     return 'no'; // Required - can't have implicit undefined
   }
   ```

**Error Handling:**
- Use try/catch for async operations
- Never swallow errors silently
- Throw typed errors or use Result pattern

**Async Patterns:**
- Prefer async/await over raw Promises
- Always handle Promise rejections
- Use Promise.all() for parallel operations

### Framework-Specific Rules (Next.js 14 App Router + React 18)

**Next.js App Router Patterns (CRITICAL):**

**Server vs Client Components:**
- **Default to Server Components** - All components are Server Components unless marked with `'use client'`
- Only use `'use client'` when you need:
  - React hooks (useState, useEffect, useContext, etc.)
  - Event handlers (onClick, onChange, etc.)
  - Browser-only APIs (window, document, localStorage)
  - Third-party libraries requiring client rendering

**Middleware (src/middleware.ts):**
- Runs on EVERY request (Edge runtime)
- Execution order: i18n routing → Supabase session refresh → auth protection
- NEVER do heavy operations (no DB queries, no external APIs)
- Keep middleware fast (<50ms)

**API Route Patterns:**
- Location: `src/app/api/{resource}/route.ts`
- ALWAYS validate session first (Supabase server client)
- ALWAYS validate request body (Zod schema)
- Error format: `{ error: string, code: string, details?: any }`
- Success format: `{ data: T }`

**Route Groups:**
- `(unauth)` - Public pages
- `(auth)` - Protected pages (requires authentication)
- `(chat)` - Protected chat pages with custom layout
- Route groups don't affect URL structure

**React 18 Patterns:**

**Hooks Rules:**
- Use hooks ONLY in Client Components (`'use client'`)
- Custom hooks must start with `use` prefix
- Follow Rules of Hooks (top level only, not in conditionals/loops)

**State Management:**
- Local state: `useState` for component-specific state
- Global state: React Context (providers in `[locale]/layout.tsx`)
- Form state: React Hook Form + Zod
- Server state: Server Components fetch directly (no client state)

**Component Communication:**
- Server Components: Async, can fetch data directly, use `await`
- Client Components: Sync, fetch via API routes
- Pass serializable props only (no functions, no class instances)

**Performance:**
- Lazy load with `next/dynamic` for heavy components
- Use `next/image` for all images (automatic optimization)
- Implement loading.tsx and error.tsx for better UX
- Use Suspense boundaries for async components

**Supabase Integration (CRITICAL - Three Different Clients):**
- `createClient(cookieStore)` - Server Components/API Routes
- `createBrowserClient()` - Client Components
- `createServerClient()` - Middleware ONLY
- NEVER mix clients - use correct client for context
- Session managed via cookies, not client state

### Testing Rules

**Test Organization:**
- **Unit tests**: Co-located with code (`Component.test.tsx`, `utils.test.ts`)
- **E2E tests**: `tests/` directory (`*.spec.ts`, `*.e2e.ts`)
- **Storybook**: Component stories (`Component.stories.tsx`)

**Vitest Unit Testing:**
- Environment: jsdom for components, node for utilities
- Global functions: describe, it, expect (no imports needed)
- Testing Library React 16.0.1 for component testing
- Structure: Arrange-Act-Assert pattern

**Mock Patterns:**
- Use `vi.mock()` for module mocking
- Mock Supabase client (never hit real auth in tests)
- Mock API routes for component tests
- Use `@testing-library/user-event` for interactions

**Playwright E2E Testing:**
- Runs against `http://localhost:3000`
- Test full user journeys (not individual components)
- Use test fixtures for setup/teardown (`tests/fixtures/`)
- Clean up test data after each test

**Test Quality:**
- Tests must be independent (no shared state)
- Use descriptive names (behavior, not implementation)
- Test behavior, not implementation details
- Follow Arrange-Act-Assert pattern

**Coverage:**
- No specific percentage enforced
- Focus on critical paths (auth, API routes, core features)
- Don't test third-party libraries
- Don't test trivial code (getters/setters)

**Storybook:**
- Stories for all components in `components/ui/`
- Use CSF3 format (Component Story Format 3)
- Include multiple variants per component

### Code Quality & Style Rules

**ESLint (Antfu Config) - Critical Style Rules:**

**No Semicolons:**
- ❌ `const x = 5;` (ERROR)
- ✅ `const x = 5` (CORRECT)

**Single Quotes for JSX:**
- ❌ `<Button className="primary">` (ERROR)
- ✅ `<Button className='primary'>` (CORRECT)

**No Unused Imports:**
- ESLint errors on unused imports
- Auto-removed with `npm run lint:fix`

**Import Organization (auto-sorted):**
- Order: Built-ins → External → Internal → Parent → Sibling
- Example:
  ```typescript
  import { NextRequest } from 'next/server';
  import { useEffect } from 'react';

  import { Button } from '@/components/ui/button';
  ```

**Naming Conventions:**
- **Component Files**: `PascalCase.tsx` (Button.tsx, UserProfile.tsx)
- **Utility Files**: `camelCase.ts` (helpers.ts, logger.ts)
- **Test Files**: `PascalCase.test.tsx` or `camelCase.test.ts`
- **React Components**: `PascalCase` function names
- **Functions**: `camelCase` (getUserData, formatDate)
- **Variables**: `camelCase` (userName, isLoading)
- **Constants**: `UPPER_SNAKE_CASE` (API_URL, MAX_RETRIES)
- **Types/Interfaces**: `PascalCase` (User, ApiResponse)
- **Directories**: `kebab-case` (user-profile, api-routes)

**File Structure Pattern:**
```typescript
// 1. Imports (auto-sorted)
// 2. Types/Interfaces
// 3. Component/Function (export)
// 4. Helper functions (unexported)
```

**Documentation:**
- JSDoc for complex functions (optional but recommended)
- Inline comments for non-obvious logic only
- No comments for self-evident code

**Pre-commit Enforcement (Husky + lint-staged):**
- Auto-fixes ESLint errors on commit
- Blocks commit if errors can't be fixed
- Runs TypeScript type checking

**Commit Messages (Conventional Commits):**
- Format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(auth): add OAuth sign-in`
- Use `npm run commit` for interactive helper

**Accessibility (jsx-a11y):**
- All interactive elements keyboard accessible
- Images must have alt text
- Buttons must have accessible labels
- Forms must have proper labels
- Color contrast meets WCAG AA

### Development Workflow Rules

**Git Workflow (GitHub Flow):**
- **Main Branch**: Protected, requires PR approval
- **Feature Branches**: `feature/description` or `fix/description`
- **Commit Early, Commit Often**: Small, focused commits
- **Never commit directly to main** - Always use PRs

**Pull Request Requirements:**
- All PRs must pass CI checks before merge
- CI Pipeline runs:
  - TypeScript type checking (`npm run check-types`)
  - ESLint linting (`npm run lint`)
  - Unit tests (`npm test`)
  - E2E tests (`npm run test:e2e`)
  - Build verification (`npm run build`)

**CI/CD Pipeline (GitHub Actions):**
- **On PR**: Runs all checks (lint, types, tests, build)
- **On merge to main**: Auto-deploys to Vercel production
- **Preview Deployments**: Every PR gets preview URL
- **Environment Variables**: Managed via Vercel dashboard

**Deployment Pattern (Vercel):**
- **Automatic Deployment**: Push to main → Production deploy
- **Preview Deployments**: Every PR branch gets unique URL
- **Environment Config**: Production uses Vercel env vars
- **Zero-downtime**: Atomic deployments with instant rollback

**Environment Configuration:**
```bash
# Development (.env.local)
NEXT_PUBLIC_SUPABASE_URL=          # Public
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public
DATABASE_URL=                       # Server-only
DIFY_API_KEY=                       # Server-only (NEVER expose)

# Production (Vercel Environment Variables)
# Same vars, managed via Vercel dashboard
# NEVER commit .env files to git
```

**Development Commands (Critical):**
```bash
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Production build (must pass before PR merge)
npm run lint          # Check code style
npm run lint:fix      # Auto-fix linting issues
npm run check-types   # TypeScript validation (must pass)
npm test              # Run unit tests
npm run test:e2e      # Run E2E tests (requires app running)
npm run commit        # Interactive commit (Conventional Commits)
npm run db:studio     # Open database GUI
```

**Code Review Checklist (For PRs):**
- [ ] TypeScript strict mode compliance (no `any`, proper null checks)
- [ ] No semicolons, single quotes in JSX (Antfu config)
- [ ] Path aliases used (`@/` not `../../`)
- [ ] Server/Client components correctly split (`'use client'` only when needed)
- [ ] Supabase client usage correct (Server/Browser/Middleware)
- [ ] API routes validate session first
- [ ] Request bodies validated with Zod
- [ ] Tests added/updated for changes
- [ ] No secrets in client code or committed files
- [ ] Responsive design works (mobile + desktop)
- [ ] Accessibility checks pass (keyboard nav, alt text, labels)

### Critical Don't-Miss Rules ⚠️

**THESE VIOLATIONS WILL BREAK THE APPLICATION - AI AGENTS MUST NEVER DO THESE**

#### 🚨 Security Rules (CRITICAL)

**RULE 1: NEVER Expose Secrets Client-Side**
```typescript
// ❌ WRONG - API key exposed to browser
const response = await fetch('https://api.dify.ai/v1/chat', {
  headers: { Authorization: `Bearer ${process.env.DIFY_API_KEY}` }
});

// ✅ CORRECT - Proxy through API route
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
```
- **Check**: Only `NEXT_PUBLIC_*` env vars are safe for client code
- **Pattern**: Always proxy external APIs through `/api/*` routes
- **Impact**: Secret exposure = immediate security breach

**RULE 2: NEVER Skip API Route Authentication**
```typescript
// ❌ WRONG - No auth check
export async function POST(request: Request) {
  const body = await request.json();
  await db.deleteUser(body.userId); // Anyone can call this!
}

// ✅ CORRECT - Validate session first
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  await db.deleteUser(body.userId); // Now safe
}
```
- **Why**: Middleware protects pages, but API routes need explicit checks
- **Impact**: Unprotected routes = unauthorized access

**RULE 3: NEVER Skip Input Validation**
```typescript
// ❌ WRONG - No validation
// ✅ CORRECT - Validate with Zod
import { z } from 'zod';

export async function POST(request: Request) {
  const body = await request.json();
  await sendEmail(body.email); // Unsafe!
}

const EmailSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const body = await request.json();
  const validated = EmailSchema.parse(body); // Throws if invalid
  await sendEmail(validated.email);
}
```
- **Rule**: ALL API inputs MUST be validated with Zod
- **Impact**: Missing validation = crashes, injection attacks

#### 🚨 Authentication Rules (CRITICAL)

**RULE 4: NEVER Mix Supabase Client Types**
```typescript
// ❌ WRONG - Browser client in Server Component
'use server';
import { createBrowserClient } from '@/libs/supabase/client'; // FAILS
// ✅ CORRECT - Browser client in Client Component
import { createBrowserClient } from '@/libs/supabase/client';
// ✅ CORRECT - Server client in Server Component
import { createClient } from '@/libs/supabase/server';
import { createClient } from '@/libs/supabase/server'; // FAILS
const supabase = createBrowserClient();
const supabase = createClient(await cookies());

// ❌ WRONG - Server client in Client Component
'use client';
const supabase = createClient(cookies());
const supabase = createBrowserClient();
```
- **Rule**: Server Components → `createClient(cookies())` | Client Components → `createBrowserClient()` | Middleware → `createServerClient()`
- **Impact**: Wrong client = auth failures, runtime errors

#### 🚨 TypeScript Strict Mode Rules (CRITICAL)

**RULE 5: NEVER Skip Undefined Checks**
```typescript
// ❌ WRONG - TypeScript error with noUncheckedIndexedAccess
const users = await getUsers();
const firstUser = users[0];
console.log(firstUser.name); // ERROR: might be undefined

// ✅ CORRECT - Check before use
const firstUser = users[0];
if (firstUser) {
  console.log(firstUser.name);
}

// ✅ ALSO CORRECT - Optional chaining
const userName = users[0]?.name ?? 'Unknown';
```
- **Why**: `noUncheckedIndexedAccess: true` enforces safety
- **Impact**: Skipped checks = TypeScript compilation errors

#### 🚨 Performance Rules (CRITICAL)

**RULE 6: NEVER Do Heavy Work in Middleware**
```typescript
// ❌ WRONG - Slow middleware blocks all requests
export async function middleware(request: NextRequest) {
  const user = await fetch('/api/user').then(r => r.json())
  const permissions = await db.query('SELECT...') // NO DB IN MIDDLEWARE
}

// ✅ CORRECT - Fast middleware delegates work
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  await supabase.auth.getUser() // Fast session validation only
}
```
- **Rule**: Middleware must complete in <50ms
- **Impact**: Slow middleware = site-wide performance collapse

**RULE 7: NEVER Fetch Client-Side When Server Can Do It**
```typescript
// ❌ WRONG - Client-side fetch (slow, complex)
'use client'
export default function UserProfile() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser)
  }, [])
  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}

// ✅ CORRECT - Server Component (fast, simple)
export default async function UserProfile() {
  const user = await getUser()
  return <div>{user.name}</div>
}
```
- **Rule**: Default to Server Components for data fetching
- **Impact**: Unnecessary client fetching = slower app, worse UX

#### 🚨 Code Organization Rules (CRITICAL)

**RULE 8: NEVER Use Relative Imports for src/ Files**
```typescript
// ❌ WRONG - Brittle relative imports
// ✅ CORRECT - Path aliases
import { Button } from '@/components/ui/button';

import { Button } from '../../../components/ui/button';
```
- **Rule**: ALWAYS use `@/` prefix
- **Impact**: Relative imports break when files move

**RULE 9: NEVER Add 'use client' Without Reason**
```typescript
// ❌ WRONG - Unnecessary client component
'use client' // Why? No hooks, events, or browser APIs
export default function UserList({ users }: { users: User[] }) {
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}

// ✅ CORRECT - Server Component (default)
export default function UserList({ users }: { users: User[] }) {
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```
- **Rule**: Only use `'use client'` for hooks/events/browser APIs
- **Impact**: Unnecessary client components = larger bundle, slower app

#### 🚨 Database Rules (CRITICAL)

**RULE 10: NEVER Modify Schema Without Migration**
```typescript
// ❌ WRONG - Direct schema edit without migration
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  newField: text('new_field') // Added without migration - BREAKS PROD
});

// ✅ CORRECT - Generate migration
// 1. Edit Schema.ts
// 2. Run: npm run db:generate
// 3. Review migration
// 4. Migration auto-applies
```
- **Rule**: Schema changes REQUIRE `npm run db:generate`
- **Impact**: No migration = production database errors

**RULE 11: NEVER Use camelCase for Database Columns**
```typescript
// ❌ WRONG - camelCase in database
export const users = pgTable('users', {
  userId: uuid('userId'), // WRONG
  firstName: text('firstName') // WRONG
});

// ✅ CORRECT - snake_case in database
export const users = pgTable('users', {
  userId: uuid('user_id'), // TypeScript: camelCase, DB: snake_case
  firstName: text('first_name')
});
```
- **Rule**: Database columns use `snake_case`
- **Impact**: Wrong casing = SQL query failures

#### 🚨 Internationalization Rules (CRITICAL)

**RULE 12: NEVER Hardcode User-Facing Text**
```typescript
// ❌ WRONG - Hardcoded text
<Button>Sign In</Button>
<p>Welcome to HealthCompanion</p>

// ✅ CORRECT - Translation keys
const t = useTranslations('Auth')
<Button>{t('signIn')}</Button>
<p>{t('welcome')}</p>
```
- **Rule**: ALL user text uses `next-intl` translation keys
- **Impact**: Hardcoded text breaks multi-language support (en, hi, bn)

---

## Quick Reference: "Will Break Everything" Checklist

**Before implementing ANY feature, verify:**
- [ ] ✅ No secrets in client code (only `NEXT_PUBLIC_*` vars)
- [ ] ✅ API routes validate session first
- [ ] ✅ All inputs validated with Zod schemas
- [ ] ✅ Correct Supabase client for context (Server/Browser/Middleware)
- [ ] ✅ Array/object access has undefined checks
- [ ] ✅ No heavy operations in middleware (<50ms rule)
- [ ] ✅ Server Components by default (`'use client'` only when needed)
- [ ] ✅ Path aliases used (`@/` not `../../`)
- [ ] ✅ Database schema changes have migrations
- [ ] ✅ Database columns use `snake_case`
- [ ] ✅ User-facing text uses translation keys
- [ ] ✅ No semicolons, single quotes in JSX

**If you only remember ONE thing:**
🔐 **NEVER expose secrets client-side** + ⚡ **Server Components by default**
