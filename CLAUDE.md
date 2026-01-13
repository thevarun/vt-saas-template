# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VT SaaS Template is a production-ready SaaS template for building web applications. The project includes:

1. **Supabase Authentication** - Custom authentication with SSR support
2. **Dify AI Integration** - Chat-based AI assistant via proxy API
3. **Assistant UI** (@assistant-ui/react) - Modern chat interface with streaming support

## Core Architecture

### Authentication Flow
- **Middleware**: `src/middleware.ts` handles session refresh and route protection
- **Supabase Client**:
  - Server-side: `src/libs/supabase/server.ts` (uses cookies)
  - Client-side: `src/libs/supabase/client.ts`
  - Middleware: `src/libs/supabase/middleware.ts` (session updates)
- **Protected Routes**: `/dashboard`, `/onboarding`, `/chat`, `/api/*`
- Auth redirects to `/{locale}/sign-in` for unauthenticated users

### Chat/AI Integration
- **API Route**: `/api/chat` (`src/app/api/chat/route.ts`)
  - Validates Supabase session
  - Proxies requests to Dify API (keeps API key server-side only)
  - Returns Server-Sent Events (SSE) streaming responses
  - Handles conversation state via conversation_id
- **Dify Client**: `src/libs/dify/client.ts`
  - Wrapper for Dify Chat Messages API
  - Configurable timeout (default from config)
  - SSE streaming support
- **Chat UI**: `src/components/chat/ChatInterface.tsx`
  - Uses Assistant UI's runtime with custom adapter
  - Streams responses in real-time
  - Maintains conversation context
  - Client-side only (requires authentication via middleware)

### Database
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: `src/models/Schema.ts`
- **Migrations**: Auto-applied on app start, or manual via `npm run db:migrate`
- **Local Dev**: PGlite for offline development
- **Production**: Compatible with Prisma Postgres or any PostgreSQL provider

### Internationalization (i18n)
- **Library**: next-intl
- **Locales**: English (default), Hindi, Bengali
- **Location**: Translation files in `src/locales/`
- **Middleware**: Handles locale detection and prefix routing
- **Config**: `src/utils/AppConfig.ts`

### Routing Structure
```
src/app/[locale]/
├── (unauth)/         # Public pages (landing)
├── (auth)/
│   ├── (center)/     # Centered auth pages (sign-in, sign-up, sign-out)
│   └── dashboard/    # Protected dashboard
├── (chat)/
│   └── chat/         # Chat interface (protected)
└── api/
    └── chat/         # Dify proxy endpoint
```

### API Error Handling

All API endpoints return errors in a consistent format:

```typescript
// Error response format
{
  error: string;        // Human-readable message
  code: string;         // Machine-readable code
  details?: object;     // Optional (validation errors, debug info)
}
```

**Quick Reference:**

| Code | Status | When |
|------|--------|------|
| `AUTH_REQUIRED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Duplicate resource |
| `DB_ERROR` | 500 | Database error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

**Server-side:**
```typescript
import {
  unauthorizedError,
  validationError,
  formatZodErrors,
  logApiError,
} from '@/libs/api/errors';

// In API route
if (authError || !user) {
  return unauthorizedError();
}

const result = schema.safeParse(body);
if (!result.success) {
  const errors = formatZodErrors(result.error);
  return validationError(errors);
}
```

**Client-side:**
```typescript
import { parseApiError, getErrorMessage, isAuthError } from '@/libs/api/client';

const response = await fetch('/api/threads', { method: 'POST', body });

if (!response.ok) {
  const error = await parseApiError(response);
  if (isAuthError(error.code)) {
    router.push('/sign-in');
  }
  toast.error(getErrorMessage(error.code, t));
}
```

📖 **Full documentation:** [docs/api-error-handling.md](docs/api-error-handling.md)

## Environment Variables

### Required for Development
```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Dify API (Server-side only)
DIFY_API_URL=           # e.g., https://api.dify.ai/v1
DIFY_API_KEY=           # Keep in .env.local

# Database
DATABASE_URL=           # PostgreSQL connection string
```

### Sensitive (.env.local only)
```bash
SUPABASE_SERVICE_ROLE_KEY=
```

## Common Development Commands

### Development
```bash
npm run dev              # Start dev server (includes Spotlight for Sentry)
npm run dev:next         # Start Next.js only (no Spotlight)
npm run build            # Production build
npm start                # Start production server
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix auto-fixable issues
npm run check-types      # TypeScript type checking
```

### Testing
```bash
npm test                 # Run unit tests (Vitest)
npm run test:e2e         # Run E2E tests (Playwright)
npx playwright install   # First-time Playwright setup
```

### Database
```bash
npm run db:generate      # Generate migration from schema changes
npm run db:migrate       # Manually apply migrations (Edge runtime only)
npm run db:studio        # Open Drizzle Studio (https://local.drizzle.studio)
```

### Other
```bash
npm run commit           # Interactive commit with Commitizen
npm run build-stats      # Analyze bundle size
npm run storybook        # Start Storybook
```

## Key Development Patterns

### Adding a New Protected Route
1. Add route path to `protectedPaths` array in `src/middleware.ts`
2. Create route in `src/app/[locale]/(auth)/` directory structure
3. Access user session via Supabase client:
   ```typescript
   import { cookies } from 'next/headers';

   import { createClient } from '@/libs/supabase/server';

   const cookieStore = await cookies();
   const supabase = createClient(cookieStore);
   const { data: { user } } = await supabase.auth.getUser();
   ```

### Modifying Database Schema
1. Edit `src/models/Schema.ts`
2. Run `npm run db:generate` to create migration
3. Migration auto-applies on next DB interaction (no restart needed)
4. For Edge runtime: disable auto-migration in `src/libs/DB.ts` and run manually

### Adding Translations
1. Add keys to `src/locales/{locale}/` JSON files
2. Use in components:
   ```typescript
   import { useTranslations } from 'next-intl';
   const t = useTranslations('Namespace');
   ```
3. Crowdin syncs translations automatically via GitHub Actions on push to `main`

### Error Handling

The project implements a comprehensive error handling strategy with multiple layers of protection:

**Error Boundary Hierarchy:**
1. **Global Error Boundary** (`src/app/global-error.tsx`) - Catches errors in root layout (last resort)
2. **Locale Error Boundary** (`src/app/[locale]/error.tsx`) - Catches errors in all locale routes
3. **Auth Routes Error Boundary** (`src/app/[locale]/(auth)/error.tsx`) - Isolates dashboard errors
4. **Chat Route Error Boundary** (`src/app/[locale]/(auth)/chat/error.tsx`) - Isolates chat errors
5. **Component Error Boundary** (`src/components/errors/ErrorBoundary.tsx`) - Reusable wrapper for critical components

**When to Use Each:**
- **File-based boundaries** (`error.tsx`): Use for route-level isolation (automatic by Next.js)
- **Component boundaries**: Use for critical components with:
  - Complex async operations (API calls, streaming)
  - Third-party integrations
  - Heavy data processing
  - High-risk state management

**Adding Error Boundaries to Components:**
```typescript
import { ErrorBoundary, CardErrorFallback } from '@/components/errors';

export function MyComponent() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <CardErrorFallback
          error={error}
          onReset={reset}
          message="Custom error message"
        />
      )}
    >
      <CriticalComponent />
    </ErrorBoundary>
  );
}
```

**Recovery Patterns:**
- All error boundaries provide "Try Again" buttons that reset the error state
- Navigation escape routes (homepage, dashboard, chat)
- Graceful degradation (preserve conversation state, show partial data)

**Error Logging:**
- All errors are automatically logged to Sentry with context
- Development: Sentry Spotlight shows errors in real-time
- Production: Errors include user ID, route context, and error digest

**What Error Boundaries DON'T Catch:**
- Event handler errors (use try/catch)
- Async code outside rendering (use try/catch or .catch())
- Errors in the error boundary itself
- Server-side errors (use API error handling)

### Error Monitoring
- **Development**: Sentry Spotlight runs automatically with `npm run dev`
- **Production**: Update `org` and `project` in `next.config.mjs` and add DSN to `sentry.*.config.ts` files

## CI/CD Pipeline

The project uses GitHub Actions and Vercel for automated testing and deployment.
Remote main is protected. Always start a new branch for making changes so we can create PR later. 

### Quick Reference

**Run all CI checks locally:**
```bash
npm run lint && npm run check-types && npm test && npm run build
```

**GitHub Actions Workflows:**
- `.github/workflows/CI.yml` - Runs lint, type check, unit tests, build, and E2E tests
- `.github/workflows/release.yml` - Automated semantic versioning and releases

**Quality Gates:**
- ESLint (zero errors, warnings allowed)
- TypeScript type check (zero errors)
- All unit tests passing (Vitest)
- Production build completes
- All E2E tests passing (Playwright)

**Deployment:**
- **Preview**: Automatic on all PRs (Vercel)
- **Production**: Automatic on merge to main (Vercel)

**Required GitHub Secrets:**
- `DIFY_API_KEY`
- `DIFY_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for E2E test cleanup)
- `SENTRY_AUTH_TOKEN` (optional)

**Branch Protection:** ⚠️ NOT CONFIGURED - Recommended to enable on `main` branch

📖 **Full documentation:** [docs/ci-cd-pipeline.md](docs/ci-cd-pipeline.md)
📖 **Troubleshooting:** [docs/ci-cd-troubleshooting.md](docs/ci-cd-troubleshooting.md)

## Testing Notes

### Unit Tests (Vitest)
- Location: Co-located with source (e.g., `Component.test.tsx`)
- Environment: `jsdom` for components, `node` for utilities
- Setup file: `vitest-setup.ts`

### E2E Tests (Playwright)
- Location: `tests/` directory
- Pattern: `*.spec.ts` or `*.e2e.ts`
- Runs against `http://localhost:3000` by default
- CI runs production build, local dev runs dev server
- Setup/teardown files handle test account creation

### Visual Development

**Quick Visual Check**
IMMEDIATELY after implementing any front-end change:

1. Identify what changed - Review the modified components/pages
2. Navigate to affected pages - Use mcp__playwright__browser_navigate to visit each changed view
3. Verify design compliance - Compare against /context/design-principles.md and /context/style-guide.md
4. Validate feature implementation - Ensure the change fulfills the user's specific request
5. Check acceptance criteria - Review any provided context files or requirements
6. Capture evidence - Take full page screenshot at desktop viewport (1440px) of each changed view
7. Check for errors - Run mcp__playwright__browser_console_messages

This verification ensures changes meet design standards and user requirements.

## Important Implementation Notes

1. **Authentication**: This project uses Supabase Auth (not Clerk)
2. **Chat Proxy Pattern**: Never expose Dify API key to client - always proxy through `/api/chat`
3. **Streaming**: Chat uses SSE (Server-Sent Events) - ensure proper headers in responses
4. **Conversation Persistence**: Track `conversation_id` from Dify for multi-turn conversations
5. **Middleware Order**: i18n middleware runs first, then Supabase session update, then auth check
6. **Absolute Imports**: Use `@/` prefix for all imports (configured in `tsconfig.json`)
7. **Next.js 15 Async Params**: This project uses Next.js 15 where `params` and `searchParams` are Promises that must be awaited in page/layout components

### Next.js 15 Async Params Pattern

In Next.js 15, route params are async and must be awaited:

```typescript
// Page component with params
export default async function Page(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  // use locale and id
}

// generateMetadata with params
export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PageName' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

// Layout component with params
export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  // use locale
  return <div>{props.children}</div>;
}
```

Note: API routes use URL searchParams (not affected by this change)

## Code Style

- **Commits**: Use Conventional Commits format via `npm run commit`
- **ESLint**: Antfu config (no semicolons, single quotes for JSX attributes)
- **Formatting**: Prettier + ESLint with auto-fix on save
- **Git Hooks**: Husky runs linting on staged files + commit message validation

## Research

- During planning, use targeted web search early to find proven approaches; prefer established libraries/repos over building from scratch.
- After 1–2 failed debugging attempts, online search for known issues/solutions before continuing.
