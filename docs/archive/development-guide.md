# Development Guide - HealthCompanion

**Generated:** 2025-12-04
**Scan Level:** Quick

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** database (or use PGlite for local development)
- **Supabase** account (for authentication)
- **Dify API** key (for AI chat features)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/HealthCompanion.git
cd HealthCompanion
```

### 2. Install dependencies

```bash
npm install
```

Dependencies are updated monthly.

### 3. Environment Setup

Create `.env.local` file in the project root:

```bash
# Supabase (Authentication & Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Dify AI
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your_dify_api_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe (Optional - for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Environment
BILLING_PLAN_ENV=dev  # or 'test' or 'production'
```

See `.env` file for all available environment variables.

## Development Commands

### Run Development Server

```bash
npm run dev
```

This starts:
- Next.js dev server on http://localhost:3000
- Sentry Spotlight for error monitoring

**Alternatively**, run only Next.js:

```bash
npm run dev:next
```

### Build for Production

```bash
npm run build
```

Builds optimized production bundle in `.next/` directory.

### Start Production Server

```bash
npm start
```

Runs the production build locally.

### Bundle Analysis

```bash
npm run build-stats
```

Generates bundle size analysis.

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Type Checking

```bash
npm run check-types
```

Runs TypeScript compiler in check mode.

### Formatting

Code is automatically formatted on save (Prettier + ESLint).

Staged files are linted via Husky pre-commit hooks.

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Watch mode (during development)
npm test -- --watch
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# First-time setup
npx playwright install
```

### Component Development (Storybook)

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run storybook:build
```

## Database Management

### Drizzle Studio

```bash
npm run db:studio
```

Opens Drizzle Studio at https://local.drizzle.studio for database exploration.

### Generate Migrations

```bash
npm run db:generate
```

Generates migration files from schema changes in `src/models/Schema.ts`.

### Apply Migrations

```bash
npm run db:migrate
```

Applies pending migrations to the database (Edge runtime only - for manual runs).

**Note:** Migrations auto-apply on app start in development.

## Git Workflow

### Committing Changes

Use Commitizen for conventional commits:

```bash
npm run commit
```

This provides an interactive prompt for creating standard commit messages.

**Commit Format:** Conventional Commits (enforced by Commitlint)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Git Hooks

- **Pre-commit:** Runs lint-staged (lints staged files)
- **Commit-msg:** Validates commit message format

## Project Structure

```
src/
├── app/[locale]/      # Next.js App Router pages (i18n)
├── components/        # Reusable React components
├── features/          # Feature-specific modules
├── libs/              # Third-party integrations
├── models/            # Database schema (Drizzle ORM)
├── utils/             # Utility functions
└── middleware.ts      # Auth + i18n middleware
```

## Common Tasks

### Add a New Page

1. Create file in `src/app/[locale]/your-page/page.tsx`
2. Export default React component
3. Page auto-routes to `/your-page` (English) or `/fr/your-page` (French)

### Add a New API Route

1. Create file in `src/app/api/your-endpoint/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`, etc.
3. Route available at `/api/your-endpoint`

### Add a New Component

1. Create in `src/components/YourComponent.tsx`
2. For UI primitives, use `src/components/ui/` (shadcn/ui)
3. For feature-specific, use `src/features/[feature]/`

### Modify Database Schema

1. Edit `src/models/Schema.ts`
2. Run `npm run db:generate` to create migration
3. Migration auto-applies on next app interaction
4. For Edge runtime, run `npm run db:migrate` manually

### Add Translations

1. Edit `src/locales/en.json` (English)
2. Edit `src/locales/fr.json` (French)
3. Use in components: `useTranslations('Namespace')`
4. Crowdin syncs automatically on push to `main`

## Debugging

### Sentry Spotlight

Development mode includes Sentry Spotlight for error monitoring:

- Automatically runs with `npm run dev`
- View errors in real-time during development
- Configure in `sentry.client.config.ts`

### VS Code Debugging

Launch configurations available in `.vscode/launch.json`:

- **Next.js: debug server-side**
- **Next.js: debug client-side**
- **Next.js: debug full stack**

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Database Connection Issues

1. Check `DATABASE_URL` in `.env.local`
2. Ensure PostgreSQL is running
3. For local dev, PGlite runs in-process (no external DB needed)

### Build Errors

```bash
# Clean build artifacts
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Type Errors

```bash
# Run type checker
npm run check-types

# Common fix: regenerate types
npm run db:generate
```

## Additional Resources

- **Tech Spec:** `docs/tech-spec/index.md`
- **Architecture:** See `docs/source-tree-analysis.md`
- **Claude Code Guide:** `CLAUDE.md`
- **Agents:** `AGENTS.md`

## Support

For issues or questions:

1. Check existing documentation in `docs/`
2. Review tech spec and implementation guides
3. Check sprint artifacts for feature-specific guidance
