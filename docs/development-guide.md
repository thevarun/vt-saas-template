# Development Guide

**Generated:** 2026-02-23 | **Scan Level:** Quick (rescan)

---

## Prerequisites

- **Node.js:** 20.x or 22.6+ (check `.nvmrc`)
- **Package Manager:** npm
- **Database:** PostgreSQL (production) or PGlite (development, auto)
- **Editor:** VS Code recommended (Next.js plugin)

---

## Quick Start

```bash
# Clone and install
git clone <repo-url>
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys (see Environment Variables below)

# Start development
npm run dev          # Next.js + Sentry Spotlight
npm run dev:next     # Next.js only (faster)
```

The app starts at `http://localhost:3000`.

---

## Environment Variables

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
```

### Optional - Chat
```bash
# Dify (choose one or both chat implementations)
DIFY_API_KEY=                    # Server-only
DIFY_API_URL=https://api.dify.ai/v1

# Vercel AI SDK
OPENAI_API_KEY=                  # Or ANTHROPIC_API_KEY
AI_PROVIDER=openai               # Or anthropic
DEFAULT_AI_MODEL=gpt-4o-mini
```

### Optional - Features
```bash
ADMIN_EMAILS=admin@example.com   # Comma-separated admin emails
RESEND_API_KEY=                  # Email (logs to console without)
NEXT_PUBLIC_POSTHOG_KEY=         # Analytics
LANGFUSE_PUBLIC_KEY=             # LLM observability
ENABLE_MEM0=false                # Memory extraction
CRON_SECRET=                     # Cron job auth
NEXT_PUBLIC_SITE_URL=            # SEO (auto on Vercel)
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server + Sentry Spotlight |
| `npm run dev:next` | Start Next.js only |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run check-types` | TypeScript type check |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run commit` | Interactive conventional commit |
| `npm run db:generate` | Generate migration from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run email:dev` | Email template preview (port 3001) |
| `npm run storybook` | Storybook dev server (port 6006) |

---

## Database Development

### Local Development (PGlite)
No PostgreSQL needed locally. PGlite runs in-memory with auto-migration.

### Schema Changes
1. Edit `src/models/Schema.ts`
2. Run `npm run db:generate`
3. Migration auto-applies on next DB interaction

### Production Database
```bash
# Apply migrations manually
npm run db:migrate

# Visual database browser
npm run db:studio
```

---

## Testing

### Unit Tests (Vitest)
```bash
npm test                    # Run all
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
```
- Co-located with source: `Component.test.tsx`
- Environment: jsdom for components, node for utilities
- Setup: `vitest-setup.ts`

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Run all
npx playwright test --ui    # Interactive UI
```
- Location: `tests/` directory
- Test credentials: `test@test.com` / `password`
- Global setup creates test account

### Visual Development
After frontend changes, use Playwright MCP to navigate to affected pages and capture screenshots. Save to `_bmad-output/implementation-artifacts/screenshots`.

---

## Code Style

- **ESLint:** @antfu/eslint-config (no semicolons, single quotes in JSX)
- **Formatting:** Prettier + ESLint auto-fix
- **Git Hooks:** Husky runs linting on staged files + commitlint
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`)
- **Imports:** Absolute with `@/` prefix, auto-sorted

### Bundler gotcha: no lazy-`require()` of local ESM modules

Under Next 16 + Turbopack, always use static `import` for local modules. Never reach for an `eslint-disable` to lazy-`require()` a local ESM module — the production bundle drops the named export under ESM↔CJS interop, so a module that works in dev silently loses its export in prod. Every `eslint-disable` needs a `-- reason`.

---

## Key Patterns

### Adding a Protected Route
1. Add path to `protectedPaths` in `src/proxy.ts`
2. Create in `src/app/[locale]/(auth)/`
3. Access user via Supabase server client

### Adding Translations
1. Add keys to `src/locales/{en,hi,bn}.json`
2. Use `useTranslations('Namespace')` hook
3. Crowdin syncs on push to `main`

### Adding API Routes
1. Create `src/app/api/<path>/route.ts`
2. Import error builders from `@/libs/api/errors`
3. Validate with Zod, check auth via Supabase

### Adding Email Templates
1. Create in `src/libs/email/templates/`
2. Preview with `npm run email:dev`
3. Send with `sendEmail()` or `sendEmailAsync()`
