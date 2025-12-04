# HealthCompanion - Technical Specification

**Author:** Varun
**Date:** 2025-12-04
**Project Level:** quick-flow
**Change Type:** Production Readiness & Cleanup
**Development Context:** Brownfield

---

## Context

### Available Documents

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

### Project Stack

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

### Existing Codebase Structure

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

### Testing Patterns & Standards

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

### Code Style & Conventions

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

## The Change

### Problem Statement

**Current State:**
HealthCompanion has completed Epic 1 (AI Health Coach functionality) with working Supabase authentication and Dify AI chat integration. However, the application suffers from three critical production-readiness issues:

**1. User Experience Quality Issues:**
- **Chat Interface (/chat):** Multiple technical defects affect usability:
  - Multi-line input handling is broken
  - Message display causes height/pre-rendering issues (page jumps as messages load)
  - Chat/thread history does not display properly
- **Landing Page:** Poor authentication state handling - shows sign-in/sign-out buttons even when user is already logged in
- **Dashboard:** Contains non-functional elements:
  - "Members" and "Settings" buttons lead to dead routes
  - Generic boilerplate welcome message instead of personalized content
- **Authentication Pages:** Sign-up and sign-in pages are purely functional with no visual polish, missing navigation back to home
- **Internationalization Mismatch:** Currently supports English + French, but business needs English + Hindi + Bengali

**2. Codebase Bloat from SaaS Boilerplate:**
The project was built from a commercial SaaS boilerplate template and carries **35-40% unused code** creating context overhead and maintenance burden:

- **Sponsors Feature:** Complete promotional system for boilerplate vendors (Crowdin, Sentry, Arcjet) with dedicated components, translations, and assets (~40+ files)
- **Marketing Content:** Demo banners, GitHub star widgets, Twitter badges, promotional copy linking to original template
- **Dead Navigation:** Dashboard links to non-existent routes (organization members, settings, todos)
- **Unused Database Schema:** `organization` table (multi-tenancy) and `todo` table (example CRUD) - both 100% unused
- **Stripe Integration Skeleton:** Complete billing infrastructure (components, types, translations, database schema) with zero implementation - adds complexity without value
- **Boilerplate Assets:** 30+ promotional images, screenshots, and logos for template marketing
- **Documentation Mismatch:** README.md is 573 lines of boilerplate documentation describing the template, not the actual HealthCompanion project
- **Configuration Remnants:** FIXME comments, boilerplate org/project names in Sentry config, generic "SaaS Template" branding

**Deep scan identified:**
- 40+ files for deletion
- ~2000+ lines of removable code
- ~15+ potentially unused dependencies
- CI/CD workflows consuming resources for unused services (Crowdin auto-sync, Checkly monitoring, visual testing)

**3. Lack of Regression Protection:**
No automated test coverage exists for critical user journeys. As the application evolves, there's no safety net to prevent regressions in:
- Authentication flows (sign-up, sign-in, OAuth, sign-out)
- Chat functionality (message sending, AI responses, conversation context)
- Session management (auth redirects, protected routes)

**Business Impact:**

**Why This Matters Now:**
- **Production Launch Blocker:** Cannot launch with broken UX (chat rendering issues, dead buttons, auth state bugs)
- **Developer Velocity:** 35-40% code bloat creates cognitive overhead, slowing all future development
- **Internationalization Mismatch:** French support is unused while Hindi/Bengali are business requirements
- **Professionalism:** Boilerplate marketing content (sponsor logos, demo banners, GitHub links) undermines brand credibility
- **Quality Assurance:** Zero test coverage means every code change risks breaking core functionality
- **Documentation Gap:** README misrepresents the project; new developers get incorrect information
- **Maintainability Crisis:** Unused Stripe infrastructure, dead database tables, and orphaned CI workflows add complexity without benefit

**What Happens If We Don't Fix This:**
1. Users encounter broken chat UX → Poor first impression, reduced engagement
2. Developers waste time navigating unused code → Slower feature development
3. No tests → High risk of regressions, manual QA burden
4. Wrong language support → Cannot serve target market (Hindi/Bengali speakers)
5. Boilerplate content → Unprofessional appearance, hurts brand trust
6. Stale documentation → Developer onboarding friction, incorrect assumptions

**Success Criteria for Epic 2:**
Production-ready application that is:
- **User-Friendly:** All UX issues resolved, proper auth states, working navigation, polished auth pages
- **Clean:** Zero boilerplate bloat, only code that serves HealthCompanion's actual features
- **Tested:** Basic E2E coverage preventing regressions in critical paths
- **Documented:** Accurate README and tech-spec reflecting current implementation
- **Localized:** Correct language support (English + Hindi + Bengali)
- **Maintainable:** Simplified codebase with removed dead code, unused schemas, and unnecessary services

### Proposed Solution

**Epic 2: Production Readiness & Cleanup** - A comprehensive, multi-faceted effort to transform HealthCompanion from a functional prototype into a production-ready application through **4 coordinated stories**.

**Story Breakdown (Quick-Flow: 4 Stories)**

**Story 1: UX Enhancements & Visual Polish**
**Goal:** Fix all user experience defects and create consistent, professional UI across the application.

**Scope:**
1. **Fix Chat Interface (/chat route):**
   - Resolve multi-line input handling (proper textarea behavior)
   - Fix message height/rendering issues (eliminate page jumping)
   - Implement proper chat/thread history display
   - Ensure Assistant UI integration works correctly

2. **Landing Page Auth State Handling:**
   - Detect logged-in state via Supabase session
   - Conditionally render: "Sign In" + "Sign Up" (logged out) vs "Dashboard" (logged in)
   - Hide/show appropriate navigation based on auth state

3. **Dashboard Improvements:**
   - Remove dead navigation links ("Members", "Settings")
   - Replace boilerplate welcome message with personalized greeting using user data from Supabase
   - Clean up dashboard layout for actual functionality

4. **Authentication Pages Polish:**
   - Redesign sign-up page: visual appeal, consistent styling
   - Redesign sign-in page: match sign-up aesthetic
   - Add navigation link back to home page on both pages
   - Ensure responsive design (mobile, tablet, desktop)

5. **Internationalization Change:**
   - Remove French (fr) locale files and configuration
   - Add Hindi (hi) locale files
   - Add Bengali (bn) locale files
   - Update next-intl configuration for new locales
   - Translate critical UI strings (auth pages, dashboard, landing) to Hindi + Bengali
   - Update routing to support /hi/ and /bn/ prefixes

6. **Update Attributions:**
   - Remove or update boilerplate attribution in footer
   - Add proper HealthCompanion branding/attribution

**Technical Approach:**
- Fix Assistant UI chat component props and styling
- Use Supabase `getUser()` in Server Components for auth state
- Tailwind CSS updates for visual polish
- next-intl locale file structure: `src/locales/hi.json`, `src/locales/bn.json`

---

**Story 2: Architecture Simplification - Remove Boilerplate Bloat**
**Goal:** Eliminate all unused boilerplate code, features, and infrastructure to create a clean, maintainable codebase focused solely on HealthCompanion's actual needs.

**Scope - Organized by Priority:**

**Phase 1: High-Impact Removals (Zero Risk)**
1. **Sponsors Feature - Complete Removal:**
   - Delete: `src/features/sponsors/SponsorLogos.tsx`, `src/templates/Sponsors.tsx`
   - Remove imports from: `app/[locale]/(unauth)/page.tsx`, `app/[locale]/(auth)/dashboard/page.tsx`
   - Delete translation keys: `Sponsors` namespace in en.json
   - Remove assets: All sponsor logos (Crowdin, Sentry, Arcjet, boilerplate) - 40+ files

2. **Demo/Marketing Components:**
   - Delete: `src/templates/DemoBanner.tsx`, `src/components/DemoBadge.tsx`
   - Remove imports from landing page

3. **Boilerplate Marketing Content:**
   - **Hero Section:** Remove Twitter badge, GitHub links, generic template messaging
   - **CTA Section:** Remove GitHub star links
   - **Footer:** Remove "Creative Designs Guru" attribution, replace placeholder links
   - **Navbar:** Remove dummy navigation links (or replace with real pages)
   - **Dashboard:** Remove "upgrade to PRO" link and nextjs-boilerplate.com references

4. **Translation File Cleanup:**
   - Remove all generic boilerplate text in en.json
   - Remove "Star on GitHub" CTAs
   - Remove Lorem ipsum FAQ placeholders
   - Clean up meta descriptions mentioning "SaaS template"

5. **Configuration Updates:**
   - Update `src/utils/AppConfig.ts`: Change name from "SaaS Template" to "HealthCompanion"
   - Fix Sentry config in `next.config.mjs`: Remove boilerplate org/project names
   - Remove or update `.github/FUNDING.yml` (currently links to boilerplate author)

**Phase 2: Dead Navigation & Unused Features**
1. **Remove Dead Dashboard Links:**
   - Delete navigation to `/dashboard/organization-profile/organization-members` (Members)
   - Delete navigation to `/dashboard/organization-profile` (Settings)
   - Remove from: `app/[locale]/(auth)/dashboard/layout.tsx` and `features/dashboard/DashboardScaffold.tsx`

2. **Remove Unused Translation Namespaces:**
   - Delete: `Todos` namespace (lines 145-174 in en.json)
   - Delete: `Billing`, `BillingOptions`, `CheckoutConfirmation` namespaces
   - Delete: "todos", "members", "billing", "settings" dashboard keys

**Phase 3: Database Schema Cleanup**
1. **Remove Unused Tables:**
   - Delete `organizationSchema` from `src/models/Schema.ts` (multi-tenancy unused)
   - Delete `todoSchema` from `src/models/Schema.ts` (example CRUD unused)
   - Generate new migration: `npm run db:generate`
   - Apply migration to remove tables

**Phase 4: Stripe Integration - Complete Removal**
1. **Delete Stripe Files:**
   - Remove: `src/features/billing/` directory (PricingInformation, PricingCard, PricingFeature)
   - Remove: `src/templates/Pricing.tsx`
   - Remove: `src/types/Subscription.ts`

2. **Remove Stripe Configuration:**
   - Delete pricing plan config from `src/utils/AppConfig.ts` (lines 23-74)
   - Remove Stripe env vars from `.env`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

3. **Uninstall Stripe Dependency:**
   - Remove `stripe` from package.json dependencies
   - Run `npm install` to clean node_modules

4. **Remove Stripe-Related Translation Keys:**
   - Delete Stripe setup instructions from README.md

**Phase 5: CI/CD & Service Cleanup**
1. **GitHub Actions Workflow Decisions:**
   - **KEEP:** `release.yml` (semantic versioning)
   - **EVALUATE & LIKELY REMOVE:**
     - `crowdin.yml` - Auto-translation sync (if not using Crowdin service)
     - `checkly.yml` - Monitoring-as-code (requires paid Checkly account)

2. **Update CI.yml:**
   - Remove `CLERK_SECRET_KEY` reference (line 81) - replaced with Supabase
   - Optionally remove Percy visual testing (lines 76-80) if not using
   - Optionally remove Codecov upload (lines 66-69) if not using coverage dashboard

3. **Remove Checkly Configuration:**
   - Delete or update `checkly.config.ts` (points to react-saas.com production URL)

**Phase 6: README Complete Replacement**
1. **Create New README.md:**
   - Project description: HealthCompanion - AI health coaching application
   - Tech stack: Next.js 14, Supabase, Dify AI, PostgreSQL
   - Setup instructions specific to this project
   - Environment variables needed (Supabase, Dify)
   - Development commands
   - Deployment guide (Vercel-compatible)
   - Remove all boilerplate sponsor tables, screenshots, generic instructions

**Phase 7: Optional Dependency Cleanup (If Time Permits)**
- Audit `@percy/*` packages (visual testing - only in CI)
- Audit `@storybook/*` packages (only 1 story file exists)
- Run `npm run build` after removals to verify no breakage

**Technical Approach:**
- File deletions via `rm -rf` for directories
- Edit tool for surgical code removal
- Database migration via Drizzle: `npm run db:generate` → creates migration → auto-applies
- Package cleanup: `npm uninstall stripe` + other unused deps

**Validation:**
- `npm run build` succeeds
- `npm run lint` passes
- `npm test` passes (unit tests)
- Manual verification: Landing page, dashboard, auth flows still work
- Database migration applied cleanly

---

**Story 3: Comprehensive E2E Test Suite**
**Goal:** Create basic automated regression coverage for critical user journeys to prevent future breakage as the codebase evolves.

**Scope:**

**Test Framework:** Playwright (already configured, zero tests currently exist)

**Test Coverage - Critical Paths:**

1. **Authentication Flow Test (`auth.spec.ts`):**
   - Sign-up: New user registration → Email validation → Success redirect
   - Sign-in: Existing user login → Credential validation → Dashboard access
   - Sign-out: Logout → Session cleared → Redirect to landing
   - Auth redirect: Unauthenticated access to /chat or /dashboard → Redirects to sign-in
   - Session persistence: Refresh page → User remains logged in

2. **Chat Functionality Test (`chat.spec.ts`):**
   - Access chat page (authenticated)
   - Send message → Verify message appears in UI
   - Receive AI response → Verify response streams and appears
   - Conversation context → Send follow-up → Verify context maintained
   - Multi-line input → Enter message with line breaks → Verify proper formatting

3. **Landing Page Test (`landing.spec.ts`):**
   - Logged-out state: "Sign In" and "Sign Up" buttons visible
   - Logged-in state: "Dashboard" button visible, auth buttons hidden
   - Navigation: All links work (no 404s)

4. **Dashboard Test (`dashboard.spec.ts`):**
   - Authenticated access successful
   - Personalized greeting displays user data
   - No dead links (removed Members/Settings buttons)
   - Chat navigation works

**Edge Cases (If Time Permits):**
- OAuth flow (Google/GitHub sign-in) - if enabled
- Session expiry handling
- Error states (invalid credentials, API failure)

**Test Patterns:**
- Setup/teardown files for test account creation/deletion
- Page Object Model for reusability
- Environment-based base URL (localhost:3000 dev, production URL in CI)

**Technical Approach:**
- File location: `tests/e2e/`
- File naming: `*.spec.ts` (Playwright convention)
- Browsers: Chromium (local), Chromium + Firefox (CI)
- Run command: `npm run test:e2e`
- CI integration: Already configured in CI.yml workflow

**Success Criteria:**
- All tests pass locally and in CI
- Tests run in under 3 minutes total
- Clear test names and error messages
- Can add new tests easily (documented pattern)

---

**Story 4: Documentation Overhaul**
**Goal:** Replace boilerplate documentation with accurate, HealthCompanion-specific guides for developers and stakeholders.

**Scope:**

**1. README.md - Complete Replacement**

**Current State:** 573 lines of boilerplate marketing + generic setup instructions
**New Content:**

**Structure:**
```markdown
# HealthCompanion

> AI-powered health coaching through conversational interface

## Overview
[Brief description of what HealthCompanion does]

## Features
- Real-time AI chat via Dify integration
- Secure authentication with Supabase
- Multi-language support (English, Hindi, Bengali)
- Responsive design

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, PostgreSQL, Drizzle ORM
- **Authentication:** Supabase Auth (email, OAuth, magic links)
- **AI:** Dify API (chat streaming via SSE)
- **Deployment:** Vercel-compatible serverless

## Prerequisites
- Node.js 20+
- PostgreSQL database (or use PGlite for local dev)
- Supabase account
- Dify API key

## Installation
[Step-by-step setup specific to HealthCompanion]

## Environment Variables
[Actual required variables: Supabase, Dify, Database URL]

## Development
```bash
npm run dev       # Start dev server
npm test          # Run unit tests
npm run test:e2e  # Run E2E tests
```

## Deployment
[Vercel deployment instructions]

## Architecture
[Brief overview, link to docs/architecture.md]

## Testing
[How to run tests, coverage requirements]

## Contributing
[If applicable]

## License
[License information]
```

**Key Removals:**
- All sponsor tables and promotional content
- Boilerplate screenshots
- Generic template setup instructions
- Attribution to "Creative Designs Guru"
- Links to react-saas.com and template purchase pages

**2. Create New Tech-Spec (This Document)**

**Purpose:** Production-ready technical specification for Epic 2 implementation.

**What It Covers:**
- Complete context (brownfield docs, stack, conventions)
- Epic 2 problem statement and solution
- All 4 story breakdowns with implementation details
- Testing approach
- Deployment considerations
- File paths and code locations for implementation

**Output:** This tech-spec.md file in docs/ directory

**3. Update Existing Documentation (If Needed)**

Optional updates to existing brownfield docs:
- `docs/architecture.md` - Update to reflect removed features (organization, todos, Stripe)
- `docs/source-tree-analysis.md` - Update after file deletions
- `CLAUDE.md` - Update if significant architecture changes

**Success Criteria:**
- README accurately describes HealthCompanion
- No references to boilerplate/template
- Clear setup instructions for new developers
- Tech-spec provides implementation roadmap for all 4 stories

---

**Integration Strategy:**

**Story Execution Order:**
1. **Story 2 First** (Architecture Simplification) - Removes bloat, reduces context
2. **Story 1 Second** (UX Enhancements) - Fixes user-facing issues on clean codebase
3. **Story 3 Third** (Test Suite) - Validates changes, prevents regressions
4. **Story 4 Last** (Documentation) - Documents final clean state

**Cross-Story Dependencies:**
- Story 2 must complete before Story 1 (clean codebase first)
- Story 3 should wait for Story 1 (test against final UX)
- Story 4 documents the end state (run last)

**Technical Approach - Key Decisions:**

**UX Stack (Story 1):**
- Assistant UI: Debug and fix existing integration (no replacement)
- Tailwind CSS: Visual polish via utility classes
- Supabase SSR: Use Server Components for auth state detection
- next-intl: Add hi.json and bn.json locale files

**Cleanup Strategy (Story 2):**
- Aggressive deletion: If unused, delete it (40+ files)
- Database migration: One migration removes both tables
- Dependency cleanup: Uninstall unused packages
- CI optimization: Disable workflows for unused services

**Testing Philosophy (Story 3):**
- Pragmatic coverage: Critical paths only, no overkill
- Playwright: Leverage existing config, minimal setup
- Fast execution: Target <3 minutes total runtime

**Documentation Focus (Story 4):**
- Accuracy over completeness
- Developer-first: Clear setup, no marketing
- Living document: Easy to update as project evolves

**Risk Mitigation:**
- Story 2 deletions validated by: `npm run build`, `npm test`, manual smoke test
- Story 1 UX changes tested manually before Story 3 automation
- All changes tracked in git: Easy rollback if needed

### Scope

**In Scope:**

**Epic 2: Production Readiness & Cleanup (4 Stories)**

**Story 1: UX Enhancements & Visual Polish**
- ✓ Fix chat interface rendering issues (multi-line input, message height, thread history)
- ✓ Landing page logged-in state detection and conditional rendering
- ✓ Dashboard personalization (remove dead links, add user greeting)
- ✓ Auth pages visual redesign (sign-up, sign-in)
- ✓ Add home navigation to auth pages
- ✓ Internationalization change: Remove French, add Hindi + Bengali
- ✓ Update footer attributions

**Story 2: Architecture Simplification**
- ✓ Complete removal of sponsors feature (files, imports, translations, assets)
- ✓ Delete demo/marketing components (DemoBanner, DemoBadge)
- ✓ Remove all boilerplate marketing content (GitHub links, Twitter badges, dummy nav links)
- ✓ Clean up translation files (remove Lorem ipsum, generic copy, unused namespaces)
- ✓ Update configuration (AppConfig, Sentry, FUNDING.yml)
- ✓ Remove dead dashboard navigation (Members, Settings)
- ✓ Database schema cleanup (delete organization + todo tables, generate migration)
- ✓ Complete Stripe removal (files, config, dependencies, env vars)
- ✓ CI/CD cleanup (evaluate Crowdin/Checkly workflows, remove Clerk reference)
- ✓ README complete replacement with HealthCompanion-specific content
- ✓ Optional: Dependency audit (Percy, Storybook)

**Story 3: E2E Test Suite**
- ✓ Authentication flow tests (sign-up, sign-in, sign-out, auth redirects, session persistence)
- ✓ Chat functionality tests (message send/receive, streaming, conversation context, multi-line input)
- ✓ Landing page tests (logged-in/out states)
- ✓ Dashboard tests (personalization, working navigation)
- ✓ Setup/teardown infrastructure for test accounts
- ✓ Page Object Model patterns for reusability

**Story 4: Documentation Overhaul**
- ✓ README.md complete rewrite (project-specific, no boilerplate)
- ✓ Tech-spec creation (this document)
- ✓ Optional: Update architecture.md, source-tree-analysis.md, CLAUDE.md if needed

**Integration & Validation:**
- ✓ Story execution order: 2 → 1 → 3 → 4
- ✓ Build validation after Story 2 deletions
- ✓ Manual smoke testing after Story 1 UX changes
- ✓ E2E test validation after Story 3 completion

**Out of Scope:**

**Explicitly NOT Included in Epic 2:**

- ✗ **Branding & Visual Identity** (custom colors, logos, brand copy) - **DEFERRED** until after production readiness
- ✗ **New Features** - Epic 2 is cleanup/polish only, no new functionality
- ✗ **Payment Integration** - Stripe being removed, not implemented
- ✗ **Multi-tenancy** - Organization feature being removed
- ✗ **Advanced Testing** (performance tests, load tests, visual regression beyond basic E2E)
- ✗ **Developer Onboarding Guide** (originally requested, then removed from scope)
- ✗ **Database Performance Optimization** - Current schema is simple, no optimization needed yet
- ✗ **Mobile App Development** - Web application only
- ✗ **Admin Dashboard** - User-facing features only
- ✗ **Analytics Integration** - Not included in production readiness scope
- ✗ **Email Templating System** - Supabase handles auth emails
- ✗ **User Profile Management Beyond Auth** - Basic auth only
- ✗ **Advanced Internationalization** (RTL support, locale-specific formatting) - Basic i18n only
- ✗ **Accessibility Audit** - jsx-a11y enforced via linting, but no comprehensive audit
- ✗ **SEO Optimization** - Not part of production readiness scope
- ✗ **Migration from PGlite to Production PostgreSQL** - Already using Supabase in production

**Dependencies NOT Being Removed (Despite Audit):**
- @assistant-ui/* - Active use for chat
- @supabase/* - Core authentication
- next-intl - Internationalization (expanded, not reduced)
- drizzle-orm - Database ORM
- All Next.js, React, TypeScript, Tailwind core dependencies
- Sentry (error monitoring used in production)
- Vitest + Playwright (test frameworks)

**Work That Can Be Done Later:**
- Branding finalization (Epic 3 or later)
- Payment integration (if/when needed)
- Advanced features (notifications, user profiles, admin tools)
- Performance optimization
- Advanced analytics

---

## Implementation Details

### Source Tree Changes

{{source_tree_changes}}

### Technical Approach

{{technical_approach}}

### Existing Patterns to Follow

{{existing_patterns}}

### Integration Points

{{integration_points}}

---

## Development Context

### Relevant Existing Code

{{existing_code_references}}

### Dependencies

**Framework/Libraries:**

{{framework_dependencies}}

**Internal Modules:**

{{internal_dependencies}}

### Configuration Changes

{{configuration_changes}}

### Existing Conventions (Brownfield)

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

### Test Framework & Standards

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

## Implementation Stack

{{implementation_stack}}

---

## Technical Details

{{technical_details}}

---

## Development Setup

{{development_setup}}

---

## Implementation Guide

### Setup Steps

{{setup_steps}}

### Implementation Steps

{{implementation_steps}}

### Testing Strategy

{{testing_strategy}}

### Acceptance Criteria

{{acceptance_criteria}}

---

## Developer Resources

### File Paths Reference

{{file_paths_complete}}

### Key Code Locations

{{key_code_locations}}

### Testing Locations

{{testing_locations}}

### Documentation to Update

{{documentation_updates}}

---

## UX/UI Considerations

{{ux_ui_considerations}}

---

## Testing Approach

{{testing_approach}}

---

## Deployment Strategy

### Deployment Steps

{{deployment_steps}}

### Rollback Plan

{{rollback_plan}}

### Monitoring

{{monitoring_approach}}
