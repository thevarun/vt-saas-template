# Development Context

## Relevant Existing Code

**Key Files for Epic 2 Implementation:**

**Story 1 - UX Enhancements:**

**Chat Interface:**
- `src/app/[locale]/(chat)/chat/page.tsx` - Main chat page component
- `src/components/chat/ChatInterface.tsx` - Assistant UI integration (if exists)
- `src/app/api/chat/route.ts` - Dify API proxy endpoint (SSE streaming)
- `src/libs/dify/client.ts` - Dify client wrapper

**Landing Page:**
- `src/app/[locale]/(unauth)/page.tsx` - Landing page with hero, features, CTA
- `src/templates/Navbar.tsx` - Navigation component
- `src/templates/Hero.tsx` - Hero section
- `src/templates/CTA.tsx` - Call-to-action section
- `src/features/landing/CenteredFooter.tsx` - Footer component

**Dashboard:**
- `src/app/[locale]/(auth)/dashboard/page.tsx` - Dashboard main page
- `src/app/[locale]/(auth)/dashboard/layout.tsx` - Dashboard layout with navigation
- `src/features/dashboard/DashboardScaffold.tsx` - Dashboard wrapper component

**Auth Pages:**
- `src/app/[locale]/(auth)/(center)/sign-in/page.tsx` - Sign-in page
- `src/app/[locale]/(auth)/(center)/sign-up/page.tsx` - Sign-up page
- `src/features/auth/` - Auth-related components

**i18n:**
- `src/libs/i18n.ts` - next-intl configuration
- `src/utils/AppConfig.ts` - App-wide configuration including locales
- `src/locales/en.json` - English translations
- `src/middleware.ts` - Handles i18n routing

**Story 2 - Architecture Simplification:**

**Files to Delete:** (See Source Tree Changes section for complete list)

**Files to Modify:**
- `src/models/Schema.ts:22-59` - organizationSchema and todoSchema to remove
- `src/utils/AppConfig.ts:7-74` - Name and pricing config to update/remove
- `next.config.mjs:35-37` - Sentry org/project names to fix
- `.github/workflows/CI.yml:81` - CLERK_SECRET_KEY reference to remove
- `package.json` - Remove stripe dependency

**Story 3 - E2E Test Suite:**

**Existing Test Infrastructure:**
- `playwright.config.ts` - Playwright configuration (already set up)
- `tests/e2e/` - Directory for E2E tests (currently empty)
- `.github/workflows/CI.yml:38-41` - E2E test execution in CI

**Reference Examples:**
- No existing E2E tests - creating from scratch

**Story 4 - Documentation:**

**Existing Documentation:**
- `README.md` - Current boilerplate README (573 lines to replace)
- `CLAUDE.md` - Project-specific Claude Code guide (good reference)
- `docs/architecture.md` - System architecture doc
- `docs/project-overview.md` - Project summary
- `docs/development-guide.md` - Dev setup instructions

## Dependencies

**Framework/Libraries:**

**Required for Epic 2:**
- **@assistant-ui/react** 0.11.47 - Chat interface (Story 1 fixes)
- **@supabase/supabase-js** 2.86.0 + **@supabase/ssr** 0.1.0 - Auth state detection (Story 1)
- **next-intl** 3.21.1 - i18n for hi/bn locales (Story 1)
- **drizzle-orm** 0.35.1 + **drizzle-kit** 0.26.2 - Database migration (Story 2)
- **@playwright/test** 1.48.1 - E2E testing (Story 3)
- All core dependencies: Next.js 14.2.25, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.14

**Removed in Story 2:**
- **stripe** 16.12.0 - Complete removal (billing feature unused)

**Unchanged:**
- All other dependencies remain (Sentry, Vitest, shadcn/ui, etc.)

**Internal Modules:**

**Story 1 - UX Enhancements:**
- `@/libs/supabase/server` - Server-side Supabase client for auth state
- `@/libs/i18n` - next-intl configuration
- `@/utils/AppConfig` - App configuration including locales
- `@/libs/dify/client` - Dify API wrapper (chat fixes)

**Story 2 - Architecture Simplification:**
- `@/models/Schema` - Database schema (removing organizationSchema, todoSchema)
- No new internal modules - only deletions

**Story 3 - E2E Tests:**
- No internal modules used - tests are external

**Story 4 - Documentation:**
- No internal modules affected

## Configuration Changes

**Story 1: UX Enhancements**

**i18n Configuration (`src/libs/i18n.ts`):**
```typescript
// BEFORE
export const locales = ['en', 'fr'] as const;

// AFTER
export const locales = ['en', 'hi', 'bn'] as const;
```

**AppConfig (`src/utils/AppConfig.ts`):**
```typescript
// BEFORE
locales: [Locales.EN, Locales.FR]

// AFTER
locales: [Locales.EN, Locales.HI, Locales.BN]
```

**Story 2: Architecture Simplification**

**AppConfig Name (`src/utils/AppConfig.ts`):**
```typescript
// BEFORE (line 9)
name: 'SaaS Template',

// AFTER
name: 'HealthCompanion',
```

**AppConfig Pricing Removal (`src/utils/AppConfig.ts`):**
- DELETE lines 23-74 (entire pricing plan configuration)

**Sentry Configuration (`next.config.mjs`):**
```javascript
// BEFORE (lines 35-37)
org: 'nextjs-boilerplate-org',
project: 'nextjs-boilerplate',

// AFTER
org: 'healthcompanion-org',  // or your actual Sentry org
project: 'healthcompanion',
```

**Environment Variables (`.env`):**
```bash
# REMOVE (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
BILLING_PLAN_ENV=dev

# KEEP (Existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DIFY_API_URL=...
DIFY_API_KEY=...
DATABASE_URL=...
```

**GitHub Actions CI (`.github/workflows/CI.yml`):**
```yaml
# REMOVE (line 81)
CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}

# Optionally REMOVE (if not using)
# Percy visual testing (lines 76-80)
# Codecov upload (lines 66-69)
```

**Package.json:**
```json
// REMOVE
"stripe": "^16.12.0"

// Run after removal
npm install
```

**GitHub Funding (`.github/FUNDING.yml`):**
- DELETE file OR update with HealthCompanion funding links

**Story 3: E2E Tests**

No configuration changes - uses existing `playwright.config.ts`

**Story 4: Documentation**

No configuration changes - documentation updates only

## Existing Conventions (Brownfield)

**CONFIRMED: Following all existing conventions**

**Code Style:**
- Semicolons required (ESLint enforced)
- `type` over `interface` for TypeScript definitions
- 1tbs brace style (opening brace on same line)
- Sorted imports (simple-import-sort plugin)
- Single quotes (JS/TS), double quotes (JSX attributes)
- 2-space indentation

**File Naming:**
- kebab-case for files
- PascalCase for components
- Absolute imports with @/ prefix

**Testing:**
- Unit: `*.test.ts(x)` with Vitest + Testing Library
- E2E: `*.spec.ts` or `*.e2e.ts` with Playwright
- Co-located with source or in tests/ directory
- Coverage tracking enabled

**React Patterns:**
- Functional components (Server Components default, Client when needed)
- React hooks for state management
- Props interfaces with TypeScript
- Composition over inheritance

**Error Handling:**
- Try/catch for async operations
- Error boundaries for components
- ServiceError pattern in services
- Sentry tracking in production

**Logging:**
- Pino structured logging (JSON format)
- Levels: error, warn, info, debug
- Logtail aggregation in production

## Test Framework & Standards

**Unit Testing (Vitest):**
- Framework: Vitest 2.1.9
- Environment: jsdom for components/hooks
- Libraries: @testing-library/react 16.0.1 + jest-dom + user-event
- File Pattern: `*.test.{ts,tsx}`
- Location: Co-located in src/ or tests/
- Setup: vitest-setup.ts
- Coverage: @vitest/coverage-v8
- Mocking: Vitest built-in (vi.mock, vi.fn, vi.spyOn)

**E2E Testing (Playwright):**
- Framework: Playwright 1.48.1
- File Pattern: `*.spec.ts` or `*.e2e.ts`
- Location: tests/ directory
- Browsers: Chromium (+ Firefox in CI)
- Setup/Teardown: `*.setup.ts` and `*.teardown.ts`
- Base URL: http://localhost:3000

**Test Commands:**
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- Coverage automatically tracked

**Assertion & Mocking:**
- Vitest globals enabled (expect, describe, it, test)
- @testing-library matchers (getByRole, getByText)
- @testing-library/jest-dom custom matchers
- @faker-js/faker for test data generation

---
