# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VT SaaS Template is a production-ready foundation for building SaaS web applications, designed for a solo developer who prioritizes productivity and efficiency. 

The project includes:
1. **Supabase Authentication** - Custom authentication with SSR support
2. **Dify AI Integration** - Chat-based AI assistant via proxy API
3. **Assistant UI** (@assistant-ui/react) - Modern chat interface with streaming support

## Documentation Map

| Topic | Full Docs |
|-------|-----------|
| API Errors | [docs/api-error-handling.md](docs/api-error-handling.md) |
| Error Boundaries | [docs/error-handling-guide.md](docs/error-handling-guide.md) |
| CI/CD | [docs/ci-cd-pipeline.md](docs/ci-cd-pipeline.md) |
| Development | [docs/development-guide.md](docs/development-guide.md) |

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

### Email Integration
- **Provider**: Resend (https://resend.com)
- **Email Service**: `src/libs/email/`
  - Client for sending emails (provider-agnostic interface)
  - React Email templates in `templates/` subdirectory
  - TypeScript types for email payloads
- **Development**: `npm run email:dev` starts template preview server (port 3001)
- **Configuration**: Environment variables for sender settings
- **Dev Mode**: Without API key, emails are logged to console (no actual sending)

### Email Error Handling

**Retry Logic:**
- Email sending automatically retries on transient failures
- Default: 3 attempts with exponential backoff (1s, 2s, 4s)
- Retryable errors: rate_limit_exceeded, temporarily_unavailable, internal_server_error
- Non-retryable errors: validation_error, invalid_api_key, domain_not_verified

**Logging:**
- All email events logged with structured JSON format
- Fields: type, emailType, recipient (hashed), status, messageId, durationMs
- Privacy: Email addresses hashed in logs (e.g., jo***@example.com)

**Non-Blocking Pattern (Critical Emails):**
```typescript
import { sendEmailAsync, sendWelcomeEmail } from '@/libs/email';

// Fire and forget - doesn't block user flow
sendEmailAsync(
  () => sendWelcomeEmail(user.email, user.name),
  { emailType: 'welcome', recipientHint: user.email }
);
```

**Development Mode:**
- Without RESEND_API_KEY: Emails logged to console with full details
- Shows: type, from, to, subject, content preview
- Returns mock success for testing

### Routing Structure
**Routes**: `src/app/[locale]/` - `(unauth)/` public, `(auth)/` protected + dashboard, `(chat)/` chat interface, `api/chat/` Dify proxy

### API Error Handling

| Code | Status | When |
|------|--------|------|
| `AUTH_REQUIRED` | 401 | Not authenticated |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

**Server**: Import from `@/libs/api/errors` (unauthorizedError, validationError, formatZodErrors)
**Client**: Import from `@/libs/api/client` (parseApiError, getErrorMessage, isAuthError)

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

# Email (Resend - Server-side only)
RESEND_API_KEY=           # Resend API key (optional in dev - logs to console)
EMAIL_FROM_ADDRESS=       # Sender email (default: noreply@example.com)
EMAIL_FROM_NAME=          # Sender name (default: VT SaaS Template)
EMAIL_REPLY_TO=           # Reply-to address (optional)
```

### Sensitive (.env.local only)
```bash
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=           # (also listed above - keep in .env.local only)
```

## Commands

Standard: `npm run dev`, `npm run build`, `npm test`, `npm run lint`, `npm run check-types`

**Project-specific:**
- `npm run db:generate` - Generate migration from schema changes
- `npm run db:studio` - Open Drizzle Studio
- `npm run commit` - Interactive commit with Commitizen
- `npm run test:e2e` - Playwright E2E tests
- `npm run dev:next` - Start Next.js only (no Sentry Spotlight)
- `npm run email:dev` - Start React Email preview server (port 3001)

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

### Adding New Email Templates
1. Create template in `src/libs/email/templates/YourTemplate.tsx`
2. Use React Email components from `@react-email/components`
3. Preview with `npm run email:dev` (hot-reload on port 3001)
4. Send with:
   ```typescript
   import { sendEmail } from '@/libs/email';
   import { YourTemplate } from '@/libs/email/templates/YourTemplate';

   await sendEmail(
     'recipient@example.com',
     'Subject Line',
     <YourTemplate data={yourData} />
   );
   ```

### Error Handling

See [docs/error-handling-guide.md](docs/error-handling-guide.md) for complete patterns.

**Key Points:**
- Route-level: Use `error.tsx` files (automatic by Next.js)
- Component-level: Wrap critical components with `<ErrorBoundary>` from `@/components/errors`
- Errors logged to Sentry automatically
- Error boundaries DON'T catch: event handlers, async code outside rendering, server errors

**Error Monitoring:**
- Development: Sentry Spotlight runs automatically with `npm run dev`
- Production: Update `org` and `project` in `next.config.mjs` and add DSN to `sentry.*.config.ts`

## CI/CD Pipeline

Remote main is protected. Always start a new branch for making changes so we can create PR later.
When fixing CI issues, run all tests locally before pushing new commits to get a faster feedback loop.

**Run all CI checks locally:**
```bash
npm run lint && npm run check-types && npm test && npm run build
```

**Quality Gates:** ESLint, TypeScript, Vitest, Build, Playwright E2E

**Deployment:** Preview on PRs (Vercel), Production on merge to main

**Required GitHub Secrets:** `DIFY_API_KEY`, `DIFY_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Testing Notes

- Screenshots directory - `_bmad-output/implementation-artifacts/screenshots`
- Test credentials - `test@test.com`, `password`

### Unit Tests (Vitest)
- Location: Co-located with source (e.g., `Component.test.tsx`)
- Environment: `jsdom` for components, `node` for utilities

### E2E Tests (Playwright)
- Location: `tests/` directory
- Pattern: `*.spec.ts` or `*.e2e.ts`
- Setup/teardown files handle test account creation

### Visual Development & Inspection
After implementing front-end changes, use Playwright MCP tools to navigate to affected pages, capture screenshots, and check console for errors.

## Important Implementation Notes

1. **Authentication**: This project uses Supabase Auth (not Clerk)
2. **Chat Proxy Pattern**: Never expose Dify API key to client - always proxy through `/api/chat`
3. **Streaming**: Chat uses SSE (Server-Sent Events) - ensure proper headers in responses
4. **Conversation Persistence**: Track `conversation_id` from Dify for multi-turn conversations
5. **Middleware Order**: i18n middleware runs first, then Supabase session update, then auth check
6. **Absolute Imports**: Use `@/` prefix for all imports (configured in `tsconfig.json`)
7. **Next.js 15 Async Params**: Route params are Promises that must be awaited:
   ```typescript
   export default async function Page(props: {
     params: Promise<{ locale: string; id: string }>;
   }) {
     const { locale, id } = await props.params;
     // use locale and id
   }
   ```

## Code Style

- **Commits**: Use Conventional Commits format. Keep messages succinct (one line). Do not add "Co-Authored-By" lines.
- **ESLint**: Antfu config (no semicolons, single quotes for JSX attributes)
- **Formatting**: Prettier + ESLint with auto-fix on save
- **Git Hooks**: Husky runs linting on staged files + commit message validation

## Research

- During planning, use targeted web search early to find proven approaches; prefer established libraries/repos over building from scratch.
- After 1-2 failed debugging attempts, online search for known issues/solutions before continuing.
