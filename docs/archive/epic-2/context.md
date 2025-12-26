# Context

## Available Documents

**Loaded Documentation (Brownfield):**

The following project documentation was loaded using the INDEX_GUIDED discovery strategy:

✓ **index.md** - Project documentation index
  - Quick reference to all documentation
  - Project stats and technology overview
  - Entry points for AI-assisted development

✓ **project-overview.md** - High-level project summary
  - Purpose: AI-powered health coaching SaaS application
  - Key features: Real-time AI chat, Supabase authentication, multi-language support (en, fr)
  - Development status: Active development with BMM methodology
  - Current sprint: Epic 1 - AI Health Coach (5 stories completed)

✓ **architecture.md** - Complete system architecture
  - Next.js App Router architecture with serverless functions
  - Layered architecture: Presentation → Application → Business Logic → Data Access
  - Security architecture: Supabase Auth with JWT + SSR session management
  - Deployment: Vercel-compatible serverless with GitHub Actions CI/CD
  - Testing strategy: Vitest (unit) + Playwright (E2E)

✓ **source-tree-analysis.md** - Annotated directory structure
  - Critical entry points: middleware.ts, app/[locale]/layout.tsx, app/api/chat/route.ts
  - Feature-based organization in src/features/
  - Component library: shadcn/ui + Radix UI in src/components/ui/
  - Integration points: Supabase, Dify AI, Stripe

✓ **development-guide.md** - Development setup and workflow
  - Development commands: npm run dev, npm test, npm run test:e2e
  - Database management: Drizzle Studio, migrations auto-apply on app start
  - Git workflow: Conventional Commits with Commitizen
  - Common tasks: Adding pages, API routes, components, database schema changes

**Not Found (Optional):**
- Product Brief: None (not required for quick-flow track)
- Research Documents: None (not required for quick-flow track)

**Analysis:**
This is a **brownfield project** with comprehensive existing documentation. All critical architectural, development, and deployment information is available, providing excellent context for creating a definitive technical specification.

## Project Stack

**Framework & Runtime:**
- **Next.js:** 14.2.25 (App Router with file-system routing)
- **React:** 18.3.1 (UI library with Server Components + Client Components)
- **TypeScript:** 5.6.3 (strict mode enabled)
- **Node.js:** 20+ (LTS)

**Frontend Stack:**
- **Styling:** Tailwind CSS 3.4.14 + tailwindcss-animate 1.0.7
- **Component Library:**
  - Radix UI primitives (accordion, dropdown, label, separator, slot, tooltip)
  - shadcn/ui pattern (components copied into codebase for full control)
  - Lucide React 0.453.0 (icons)
- **Chat Interface:** @assistant-ui/react 0.11.47 + @assistant-ui/react-ai-sdk 1.1.16
- **Markdown:** @assistant-ui/react-markdown 0.11.6 + remark-gfm 4.0.1
- **Theme:** next-themes 0.3.0 (dark mode support)
- **Forms:** react-hook-form 7.53.0 + @hookform/resolvers 3.9.0
- **Validation:** Zod 3.23.8
- **Tables:** @tanstack/react-table 8.20.5
- **Utilities:**
  - class-variance-authority 0.7.0 (component variants)
  - clsx 2.1.1 (conditional classes)
  - tailwind-merge 2.5.4 (Tailwind class merging)

**Backend & Data:**
- **Database ORM:** Drizzle ORM 0.35.1
- **Database:** PostgreSQL (Supabase-hosted)
- **Local Database:** @electric-sql/pglite 0.2.12 (offline development)
- **Database Driver:** pg 8.13.0
- **Migration Tool:** drizzle-kit 0.26.2

**Authentication:**
- **Provider:** Supabase (@supabase/supabase-js 2.86.0 + @supabase/ssr 0.1.0)
- **Strategy:** JWT tokens with HTTP-only cookies, SSR session validation

**AI & Features:**
- **AI Service:** Dify API (custom integration, proxied via /api/chat)
- **Payments:** Stripe 16.12.0 (ready for integration)
- **i18n:** next-intl 3.21.1 (English, French supported)

**DevOps & Monitoring:**
- **Error Tracking:** @sentry/nextjs 8.34.0 + @spotlightjs/spotlight 2.5.0
- **Logging:** Pino 9.5.0 + pino-pretty 11.3.0 + @logtail/pino 0.5.2
- **Environment:** @t3-oss/env-nextjs 0.11.1 (env validation)

**Testing:**
- **Unit Testing:** Vitest 2.1.9 + @vitejs/plugin-react 4.3.2
- **E2E Testing:** @playwright/test 1.48.1
- **Component Testing:** Storybook 8.3.5 (visual development)
- **Testing Libraries:**
  - @testing-library/react 16.0.1
  - @testing-library/jest-dom 6.6.1
  - @testing-library/user-event 14.5.2
- **Coverage:** @vitest/coverage-v8 2.1.9
- **Visual Testing:** @percy/playwright 1.0.6 + @percy/cli 1.30.1
- **Test Utilities:** @faker-js/faker 9.0.3

**Code Quality:**
- **Linting:** ESLint 8.57.1 with @antfu/eslint-config 2.27.3
  - @next/eslint-plugin-next 14.2.15
  - @eslint-react/eslint-plugin 1.15.0
  - eslint-plugin-react-hooks 4.6.2
  - eslint-plugin-jsx-a11y 6.10.0 (accessibility)
  - eslint-plugin-tailwindcss 3.17.5
  - eslint-plugin-playwright 1.7.0
  - eslint-plugin-testing-library 6.3.0
  - eslint-plugin-simple-import-sort 12.1.1
  - eslint-plugin-format 0.1.2
- **Git Hooks:** Husky 9.1.6 + lint-staged 15.2.10
- **Commits:** Commitizen 4.3.1 + @commitlint/cli 19.5.0

**Build & Deploy:**
- **Bundler:** Next.js built-in (Turbopack/Webpack)
- **Bundle Analysis:** @next/bundle-analyzer 14.2.15
- **CI/CD:** GitHub Actions + semantic-release 24.1.2
  - @semantic-release/changelog 6.0.3
  - @semantic-release/git 10.0.1
- **Monitoring:** Checkly 4.9.0 (uptime & performance)
- **PostCSS:** postcss 8.4.47 + autoprefixer 10.4.20 + cssnano 7.0.6

**Utilities:**
- **Image Processing:** sharp 0.33.5 (Next.js image optimization)
- **CLI:** npm-run-all 4.1.5, cross-env 7.0.3, dotenv-cli 7.4.2
- **Build:** rimraf 6.0.1 (clean), tsx 4.19.1 (TypeScript execution)
- **Dev Server:** http-server 14.1.1, start-server-and-test 2.0.8

**Package Overrides:**
- axios: ^1.13.2 (security)
- cookie: ^0.7.2 (security)
- esbuild: ^0.25.1 (compatibility)
- glob: ^10.4.6 (security)

**Currency Assessment:**
All major dependencies are current (< 6 months old). The stack is modern and actively maintained. No outdated dependencies requiring migration.

## Existing Codebase Structure

**Project Organization:**
HealthCompanion follows a **monolithic web application** architecture with Next.js App Router patterns.

**Directory Structure:**

```
HealthCompanion/
├── src/                      # Main source code
│   ├── app/[locale]/         # Next.js App Router (i18n)
│   │   ├── (unauth)/         # Public pages (landing)
│   │   ├── (auth)/           # Protected routes
│   │   │   ├── (center)/     # Centered auth pages
│   │   │   └── dashboard/    # Dashboard routes
│   │   ├── (chat)/           # Chat interface
│   │   └── api/              # API Routes
│   │       └── chat/         # Dify proxy endpoint
│   ├── components/           # Reusable React components
│   │   └── ui/               # shadcn/ui + Radix components
│   ├── features/             # Feature modules
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── billing/
│   ├── libs/                 # Third-party integrations
│   │   ├── supabase/         # Auth client/server/middleware
│   │   ├── dify/             # AI integration
│   │   ├── DB.ts             # Drizzle ORM connection
│   │   └── Env.ts            # Environment validation
│   ├── models/               # Database schema
│   │   └── Schema.ts         # Drizzle ORM models
│   ├── locales/              # i18n translations (en, fr)
│   ├── middleware.ts         # Auth + i18n middleware
│   └── [utils, types, hooks] # Supporting code
│
├── docs/                     # Documentation
├── public/                   # Static assets
├── migrations/               # Database migrations
└── tests/                    # Test files
    ├── e2e/                  # Playwright E2E
    └── integration/          # Integration tests
```

**Key Entry Points:**
- `src/middleware.ts` - Request middleware (session refresh, route protection, i18n)
- `src/app/[locale]/layout.tsx` - Root layout with providers
- `src/app/api/chat/route.ts` - AI chat proxy (Dify API)
- `src/app/auth/callback/route.ts` - OAuth callback handler

**Architectural Patterns:**

1. **Next.js App Router:**
   - Server Components for static content (default)
   - Client Components for interactivity ('use client' directive)
   - File-system based routing
   - Route groups: (unauth), (auth), (chat)

2. **Feature-Based Organization:**
   - Each feature in `src/features/[feature]/`
   - Feature-specific components co-located
   - Shared components in `src/components/`

3. **Layered Architecture:**
   - Presentation: React components (Server + Client)
   - Application: Next.js middleware + API routes
   - Business Logic: Feature modules + utilities
   - Data Access: Drizzle ORM + service clients

4. **State Management:**
   - Server State: Next.js Server Components (fetch on server)
   - Client State: React hooks (useState, useReducer)
   - Form State: React Hook Form + Zod validation
   - No centralized state library (Redux/MobX)

**Code Patterns:**

**Naming Conventions:**
- Files: kebab-case (`user-profile.tsx`)
- Components: PascalCase (`UserProfile`)
- Functions/Variables: camelCase (`getUserProfile`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

**Import Patterns:**
- Absolute imports with `@/` prefix (configured in tsconfig.json)
- Import sorting enforced via simple-import-sort plugin
- Default exports for components, named exports for utilities

**Component Patterns:**
- Composition over inheritance
- Small, reusable components
- TypeScript interfaces for props
- Server Components by default, Client Components when needed

**Error Handling:**
- Try/catch for async operations
- Error boundaries for React components
- ServiceError pattern in services
- Sentry for production error tracking

**Logging:**
- Pino structured logging
- Log levels: error, warn, info, debug
- Logtail for production aggregation

## Testing Patterns & Standards

**CONFIRMED: Following Existing Test Conventions**

**Test Framework:**
- **Unit Tests:** Vitest 2.1.9 + @testing-library/react 16.0.1
- **E2E Tests:** Playwright 1.48.1
- **Component Development:** Storybook 8.3.5

**File Naming & Organization:**
- **Unit Tests:** `*.test.{ts,tsx}` co-located in `src/` or `tests/`
- **E2E Tests:** `*.spec.ts` or `*.e2e.ts` in `tests/` directory
- **Setup/Teardown:** `*.setup.ts` and `*.teardown.ts` in tests/

**Test Environment:**
- **Component Tests:** jsdom (configured in vitest.config.mts)
- **Hook Tests:** jsdom (for src/hooks/**/*.test.ts)
- **E2E Tests:** Chromium (Firefox in CI)

**Testing Libraries:**
- @testing-library/react (React component testing)
- @testing-library/jest-dom (custom matchers)
- @testing-library/user-event (user interaction simulation)
- @faker-js/faker (test data generation)

**Assertion Style:**
- Vitest globals enabled (`expect`, `describe`, `it`, `test`)
- @testing-library matchers (getByRole, getByText, etc.)
- @testing-library/jest-dom matchers (toBeInTheDocument, toHaveTextContent)

**Coverage Requirements:**
- Coverage tracking enabled via @vitest/coverage-v8
- Include: `src/**/*`
- Exclude: Storybook files (`*.stories.{js,jsx,ts,tsx}`), type definitions (`**/*.d.ts`)

**Mocking Strategies:**
- Vitest built-in mocking (`vi.mock`, `vi.fn`, `vi.spyOn`)
- Next.js specific mocks for router, navigation
- Module mocking for third-party integrations

**Test Setup:**
- Setup file: `vitest-setup.ts` (auto-loaded before tests)
- Playwright config: `playwright.config.ts`
- Setup/teardown files for E2E tests (account creation/deletion)

**Test Scripts:**
- `npm test` - Run all unit tests (Vitest)
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npx playwright install` - First-time Playwright setup

## Code Style & Conventions

**CONFIRMED: Following Existing Conventions**

**ESLint Configuration:**
- **Base:** @antfu/eslint-config 2.27.3 (less opinionated mode)
- **Plugins:** React, TypeScript, Next.js, Tailwind, a11y, Testing Library, Playwright

**Style Rules:**
- **Semicolons:** Required (semi: true)
- **Type Definitions:** Use `type` over `interface` (ts/consistent-type-definitions)
- **Brace Style:** 1tbs - one true brace style (opening brace on same line)
- **Import Sorting:** Enforced via simple-import-sort plugin
- **Quotes:** Single quotes for JavaScript/TypeScript, double quotes in JSX attributes
- **Indentation:** 2 spaces (Antfu config default)

**Import Order:**
- Auto-sorted via simple-import-sort plugin
- Enforced as error (simple-import-sort/imports, simple-import-sort/exports)

**React Patterns:**
- Prefer functional components over class components
- No destructuring assignment preference (react/prefer-destructuring-assignment: off)
- React hooks rules enforced (eslint-plugin-react-hooks)

**Accessibility:**
- jsx-a11y plugin enforced (recommended rules)
- ARIA labels required for interactive elements
- Keyboard navigation support

**Next.js Specific:**
- Next.js recommended rules + core-web-vitals
- No unoptimized images
- No HTML in <head> (use next/head or metadata)

**Test File Conventions:**
- Padding around test blocks (test/padding-around-all)
- Lowercase or uppercase titles allowed (test/prefer-lowercase-title: off)
- Testing Library best practices enforced for `*.test.ts(x)` files
- Playwright best practices enforced for `*.spec.ts` and `*.e2e.ts` files

**File Organization:**
- Feature-based structure in src/features/
- Shared components in src/components/
- UI primitives in src/components/ui/
- Third-party integrations in src/libs/
- Absolute imports with @/ prefix

**Documentation Style:**
- TypeScript types serve as documentation
- JSDoc comments for public APIs (not required everywhere)
- README files in feature directories where helpful

---
