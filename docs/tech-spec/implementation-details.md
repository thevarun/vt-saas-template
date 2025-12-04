# Implementation Details

## Source Tree Changes

**Epic 2 will modify or delete the following files across 4 stories:**

**Story 1: UX Enhancements & Visual Polish**

**MODIFY (Chat Interface Fixes):**
- `src/app/[locale]/(chat)/chat/page.tsx` - Fix chat rendering, multi-line input
- `src/components/chat/ChatInterface.tsx` - Assistant UI integration fixes (if exists)
- Any chat-related component files - Debug height/rendering issues

**MODIFY (Landing Page Auth State):**
- `src/app/[locale]/(unauth)/page.tsx` - Add Supabase session detection, conditional rendering
- `src/templates/Navbar.tsx` - Update navigation based on auth state

**MODIFY (Dashboard Improvements):**
- `src/app/[locale]/(auth)/dashboard/page.tsx` - Personalized greeting using Supabase user data
- `src/app/[locale]/(auth)/dashboard/layout.tsx` - Remove Members/Settings navigation
- `src/features/dashboard/DashboardScaffold.tsx` - Remove dead navigation links

**MODIFY (Auth Pages Polish):**
- `src/app/[locale]/(auth)/(center)/sign-in/page.tsx` - Visual redesign + home navigation
- `src/app/[locale]/(auth)/(center)/sign-up/page.tsx` - Visual redesign + home navigation
- Related auth components in `src/features/auth/` - Style updates

**MODIFY (Footer Attribution):**
- `src/features/landing/CenteredFooter.tsx` - Update attribution, remove boilerplate links

**CREATE (New Locale Files):**
- `src/locales/hi.json` - Hindi translations
- `src/locales/bn.json` - Bengali translations

**DELETE (French Locale):**
- `src/locales/fr.json` - Remove French translations

**MODIFY (i18n Configuration):**
- `src/libs/i18n.ts` - Update locale configuration (remove fr, add hi, bn)
- `src/utils/AppConfig.ts` - Update supported locales array

---

**Story 2: Architecture Simplification**

**DELETE (Sponsors Feature):**
- `src/features/sponsors/SponsorLogos.tsx` - DELETE FILE
- `src/templates/Sponsors.tsx` - DELETE FILE
- `public/assets/images/crowdin-dark.png` - DELETE FILE
- `public/assets/images/crowdin-white.png` - DELETE FILE
- `public/assets/images/sentry-dark.png` - DELETE FILE
- `public/assets/images/sentry-white.png` - DELETE FILE
- `public/assets/images/arcjet-light.svg` - DELETE FILE
- `public/assets/images/arcjet-dark.svg` - DELETE FILE
- `public/assets/images/nextjs-boilerplate-saas.png` - DELETE FILE
- All other boilerplate screenshot files (8+ files matching `nextjs-boilerplate-saas-*.png`)
- `public/assets/images/nextjs-starter-banner.png` - DELETE FILE
- `public/assets/images/clerk-logo-white.png` - DELETE FILE (Clerk replaced)
- `public/assets/images/coderabbit-logo-*.svg` - DELETE FILES
- `public/assets/images/codecov-*.svg` - DELETE FILES

**DELETE (Demo/Marketing Components):**
- `src/templates/DemoBanner.tsx` - DELETE FILE
- `src/components/DemoBadge.tsx` - DELETE FILE

**DELETE (Stripe Feature):**
- `src/features/billing/` - DELETE ENTIRE DIRECTORY
- `src/templates/Pricing.tsx` - DELETE FILE
- `src/types/Subscription.ts` - DELETE FILE

**MODIFY (Remove Boilerplate References):**
- `src/app/[locale]/(unauth)/page.tsx` - Remove Sponsors import, DemoBanner import
- `src/app/[locale]/(auth)/dashboard/page.tsx` - Remove SponsorLogos import, boilerplate links
- `src/templates/Hero.tsx` - Remove Twitter badge, GitHub links, generic messaging
- `src/templates/CTA.tsx` - Remove GitHub star link
- `src/features/landing/CenteredFooter.tsx` - Remove Creative Designs Guru attribution
- `src/templates/Navbar.tsx` - Remove or replace dummy navigation links
- `src/utils/AppConfig.ts` - Change name "SaaS Template" → "HealthCompanion", remove pricing config

**MODIFY (Translation Files):**
- `src/locales/en.json` - Remove: Sponsors, Todos, Billing namespaces; clean boilerplate text
- Keep only: Actually used translation keys for landing, auth, dashboard, chat

**MODIFY (Database Schema):**
- `src/models/Schema.ts` - DELETE organizationSchema, DELETE todoSchema

**CREATE (Database Migration):**
- `migrations/XXXX_remove_unused_tables.sql` - Generated via `npm run db:generate`

**MODIFY (Configuration Files):**
- `next.config.mjs` - Fix Sentry org/project names (lines 35-37)
- `.github/FUNDING.yml` - Remove or update boilerplate author links
- `checkly.config.ts` - Update or delete (if keeping Checkly)

**MODIFY (CI/CD Workflows):**
- `.github/workflows/CI.yml` - Remove CLERK_SECRET_KEY reference (line 81)
- `.github/workflows/crowdin.yml` - EVALUATE: Delete if not using Crowdin
- `.github/workflows/checkly.yml` - EVALUATE: Delete if not using Checkly

**MODIFY (Environment & Dependencies):**
- `.env` - Remove Stripe variables, update Sentry variables
- `package.json` - Remove `stripe` dependency

**DELETE/REPLACE (Documentation):**
- `README.md` - COMPLETE REPLACEMENT (new content written from scratch)

---

**Story 3: E2E Test Suite**

**CREATE (Test Files):**
- `tests/e2e/auth.spec.ts` - Authentication flow tests
- `tests/e2e/chat.spec.ts` - Chat functionality tests
- `tests/e2e/landing.spec.ts` - Landing page tests
- `tests/e2e/dashboard.spec.ts` - Dashboard tests
- `tests/e2e/setup.ts` - Test account creation (if needed)
- `tests/e2e/teardown.ts` - Test account cleanup (if needed)
- `tests/e2e/page-objects/` - Page Object Model classes (optional, for reusability)

**NO MODIFICATIONS to existing code** - Tests are additive only

---

**Story 4: Documentation Overhaul**

**CREATE/REPLACE:**
- `README.md` - Complete replacement with HealthCompanion-specific content
- `docs/tech-spec.md` - This document (already created)

**MODIFY (Optional):**
- `docs/architecture.md` - Update to reflect removed features
- `docs/source-tree-analysis.md` - Update after file deletions
- `CLAUDE.md` - Update if significant architecture changes

---

**Summary of File Changes:**

**Files to DELETE:** ~50+ files (sponsors, billing, boilerplate images, marketing components)
**Files to MODIFY:** ~25 files (pages, components, configs, translations)
**Files to CREATE:** ~10 files (locale files, test files, new README)
**Database Changes:** 1 migration (drop 2 tables)

## Technical Approach

**Story-Specific Technical Decisions:**

**Story 1: UX Enhancements**

**Chat Interface Fixes:**
- **Approach:** Debug Assistant UI integration - identify why multi-line input and message rendering fail
- **Multi-line Input:** Ensure textarea properly handles `Enter` key (new line) vs `Shift+Enter` (send message)
- **Height/Rendering Issues:** Fix CSS/layout issues causing page jumps - likely flexbox or dynamic height problems
- **Thread History:** Verify conversation_id persistence and proper message array handling
- **Tech:** @assistant-ui/react 0.11.47 - Review component props, styling overrides

**Auth State Detection:**
- **Approach:** Use Supabase Server Components for SSR-safe session checking
- **Implementation:**
  ```typescript
  import { cookies } from 'next/headers';
  import { createClient } from '@/libs/supabase/server';

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  // Conditional rendering based on user
  ```
- **Location:** Landing page (`src/app/[locale]/(unauth)/page.tsx`) - Server Component

**Dashboard Personalization:**
- **Approach:** Extract user data from Supabase session, display name/email in greeting
- **Implementation:** `const { data: { user } } = await supabase.auth.getUser();` → `<h1>Welcome, {user?.email}</h1>`
- **Navigation Cleanup:** Delete dead links from layout and scaffold components

**Auth Pages Redesign:**
- **Approach:** Tailwind CSS utility classes for visual polish
- **Add Home Link:** `<Link href="/">← Back to Home</Link>` at top of both pages
- **Styling:** Match existing landing page aesthetic (colors, spacing, typography)
- **Responsive:** Ensure mobile-friendly layout (already should be via Tailwind, verify)

**Internationalization Change:**
- **Approach:** next-intl locale system - add hi.json and bn.json
- **Configuration Update:**
  ```typescript
  // src/libs/i18n.ts
  export const locales = ['en', 'hi', 'bn'] as const; // Remove 'fr'
  ```
- **AppConfig Update:**
  ```typescript
  // src/utils/AppConfig.ts
  locales: [Locales.EN, Locales.HI, Locales.BN] // Remove Locales.FR
  ```
- **Translation Files:** Copy en.json structure to hi.json and bn.json, translate critical strings
- **Routing:** Next-intl handles /hi/ and /bn/ prefixes automatically

---

**Story 2: Architecture Simplification**

**File Deletion Strategy:**
- **Approach:** Aggressive deletion - if unused, delete immediately
- **Validation:** Run `npm run build` after each phase to catch import errors
- **Git Safety:** All changes committed incrementally - easy rollback

**Database Schema Cleanup:**
- **Approach:** Use Drizzle ORM migration system
- **Steps:**
  1. Edit `src/models/Schema.ts` - remove organizationSchema and todoSchema exports
  2. Run `npm run db:generate` - Drizzle detects schema changes, creates migration
  3. Migration auto-applies on next app start (or run `npm run db:migrate` manually)
- **Migration Content:** `DROP TABLE IF EXISTS organization; DROP TABLE IF EXISTS todo;`
- **Risk:** Zero - tables are unused, no foreign key dependencies

**Dependency Removal:**
- **Stripe:** `npm uninstall stripe` after deleting all Stripe code
- **Validation:** `npm run build` ensures no import errors

**Translation File Cleanup:**
- **Approach:** Surgical deletion using Edit tool
- **Keep:** Auth, Dashboard, Landing, Chat namespaces
- **Remove:** Sponsors, Todos, Billing, BillingOptions, CheckoutConfirmation, generic boilerplate text
- **Validation:** No runtime errors (unused keys don't break anything)

**CI/CD Workflow Decisions:**
- **Crowdin:** If not actively translating with Crowdin service → Delete `.github/workflows/crowdin.yml`
- **Checkly:** If not using paid Checkly monitoring → Delete `.github/workflows/checkly.yml` and `checkly.config.ts`
- **CI.yml Update:** Remove CLERK_SECRET_KEY env var (line 81), optionally remove Percy/Codecov steps

**README Replacement:**
- **Approach:** Write new README from scratch using CLAUDE.md as reference
- **Structure:** Standard project README (overview, features, setup, deployment)
- **Tone:** Professional, developer-focused, no marketing

---

**Story 3: E2E Test Suite**

**Test Framework:** Playwright 1.48.1 (already configured in `playwright.config.ts`)

**Test Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should sign up new user', async ({ page }) => {
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

**Setup/Teardown:**
- **Approach:** Create test Supabase accounts in setup.ts, delete in teardown.ts
- **Alternative:** Use Supabase Test mode or mock auth for faster tests

**Page Object Model (Optional):**
```typescript
// tests/e2e/page-objects/AuthPage.ts
export class AuthPage {
  constructor(private page: Page) {}

  async signUp(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

**Chat Testing:**
- **Approach:** Test against actual Dify API (requires valid API key in test env)
- **Alternative:** Mock Dify responses for faster/deterministic tests

---

**Story 4: Documentation Overhaul**

**README Structure:**
```markdown
# HealthCompanion

> AI-powered health coaching through conversational interface

# Features
- Real-time AI chat via Dify
- Secure Supabase authentication
- Multi-language support (English, Hindi, Bengali)

# Tech Stack
[List actual stack]

# Getting Started
[Step-by-step setup]

# Environment Variables
[Required variables only]

# Development
[Commands: dev, test, build]

# Deployment
[Vercel instructions]
```

**Tech-Spec (This Document):**
- **Approach:** Comprehensive implementation guide for all 4 stories
- **Audience:** Developers implementing Epic 2
- **Content:** Problem, solution, file paths, technical decisions, acceptance criteria

## Existing Patterns to Follow

**CONFIRMED: All existing brownfield patterns MUST be followed**

**Code Style:**
- Semicolons required (ESLint enforced)
- `type` over `interface` for TypeScript definitions
- 1tbs brace style (opening brace on same line)
- Sorted imports via simple-import-sort plugin
- Absolute imports with `@/` prefix

**Component Patterns:**
- Server Components by default
- Client Components only when needed (`'use client'` directive)
- Props defined with TypeScript types
- Functional components (no classes)

**File Naming:**
- kebab-case for files (`user-profile.tsx`)
- PascalCase for components (`UserProfile`)
- Routes follow Next.js App Router conventions

**Database Operations:**
- Drizzle ORM for all database access
- Type-safe queries
- Migrations via `npm run db:generate`

**Authentication:**
- Supabase for all auth operations
- Server Components use `createClient(await cookies())`
- Client Components use `createClient()` (client version)
- Middleware handles session refresh

**Testing:**
- Unit tests: `*.test.ts(x)` with Vitest
- E2E tests: `*.spec.ts` with Playwright
- Co-located with source or in `tests/` directory

**Error Handling:**
- Try/catch for async operations
- Meaningful error messages
- Sentry tracking in production

**Translations:**
- next-intl for all user-facing strings
- Translation keys in `src/locales/{locale}.json`
- Use `useTranslations()` hook in components

## Integration Points

**Story 1: UX Enhancements**

**Chat Interface → Dify AI API:**
- Integration point: `/api/chat` route proxies to Dify
- SSE streaming for real-time responses
- Conversation ID tracking for context
- **Change:** Fix Assistant UI component integration

**Landing Page → Supabase Auth:**
- Integration point: Supabase Server Component session check
- Server-side rendering for auth state
- **Change:** Add session detection and conditional rendering

**Dashboard → Supabase User Data:**
- Integration point: `supabase.auth.getUser()`
- Extract user email/metadata for personalization
- **Change:** Display user-specific greeting

**Auth Pages → Supabase Auth:**
- Integration point: Supabase sign-up/sign-in methods
- Redirect handling after authentication
- **Change:** Visual updates only, no auth logic changes

**i18n → Next.js Routing:**
- Integration point: next-intl middleware + App Router
- Locale detection and routing
- **Change:** Add hi/bn locales, remove fr

---

**Story 2: Architecture Simplification**

**Database → Drizzle ORM:**
- Integration point: `src/models/Schema.ts`
- Schema changes trigger migrations
- **Change:** Remove unused tables (organization, todo)

**Build System → Next.js:**
- Integration point: `next.config.mjs`, `package.json`
- Dependency management
- **Change:** Remove Stripe, update configs

**CI/CD → GitHub Actions:**
- Integration point: `.github/workflows/` YAML files
- Automated testing and deployment
- **Change:** Remove unused workflow steps, update env vars

**Documentation → Git Repository:**
- Integration point: `README.md` as project entry point
- **Change:** Complete content replacement

---

**Story 3: E2E Test Suite**

**Playwright → Application:**
- Integration point: http://localhost:3000 (dev) or production URL (CI)
- Browser automation for user journey testing
- **Change:** New test files, no application changes

**Test Setup → Supabase:**
- Integration point: Test account creation/deletion
- May require Supabase Admin API or separate test database
- **Change:** Setup/teardown infrastructure

---

**Story 4: Documentation Overhaul**

**README → New Contributors:**
- Integration point: First file read by developers
- Links to other documentation
- **Change:** Accurate project representation

**Tech-Spec → Development Team:**
- Integration point: Implementation guide for Epic 2
- **Change:** This document provides complete roadmap

---
