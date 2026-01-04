# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Health Companion is a SaaS application built on Next.js 14 with App Router. The project has been customized from a SaaS boilerplate to include:

1. **Supabase Authentication** (replaced Clerk) - Custom authentication with SSR support
2. **Dify AI Integration** - Chat-based AI health assistant via proxy API
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

### Error Monitoring
- **Development**: Sentry Spotlight runs automatically with `npm run dev`
- **Production**: Update `org` and `project` in `next.config.mjs` and add DSN to `sentry.*.config.ts` files

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

1. **Authentication**: This project uses Supabase, not Clerk (README mentions Clerk but it's been replaced)
2. **Chat Proxy Pattern**: Never expose Dify API key to client - always proxy through `/api/chat`
3. **Streaming**: Chat uses SSE (Server-Sent Events) - ensure proper headers in responses
4. **Conversation Persistence**: Track `conversation_id` from Dify for multi-turn conversations
5. **Middleware Order**: i18n middleware runs first, then Supabase session update, then auth check
6. **Absolute Imports**: Use `@/` prefix for all imports (configured in `tsconfig.json`)

## Code Style

- **Commits**: Use Conventional Commits format via `npm run commit`
- **ESLint**: Antfu config (no semicolons, single quotes for JSX attributes)
- **Formatting**: Prettier + ESLint with auto-fix on save
- **Git Hooks**: Husky runs linting on staged files + commit message validation

## Research 

- Use targeted web search early to find proven approaches; prefer established libraries/repos over building from scratch.
- After 1–2 failed debugging attempts, online search for known issues/solutions before continuing.
  