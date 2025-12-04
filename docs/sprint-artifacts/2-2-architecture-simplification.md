# Story 2.2: Architecture Simplification

Status: ready-for-dev

## Story

As a developer,
I want to eliminate all unused boilerplate code, features, and infrastructure from the codebase,
So that we have a clean, maintainable codebase focused solely on HealthCompanion's actual needs with reduced cognitive overhead and faster development velocity.

## Acceptance Criteria

1. **Zero sponsor references in codebase** - All sponsor-related files, imports, translations, and images completely removed
2. **No demo banners or badges** - DemoBanner, DemoBadge components and all references deleted
3. **No boilerplate marketing content** - GitHub stars, Twitter badges, dummy nav links removed from landing page, dashboard, footer
4. **Clean translation files** - Lorem ipsum, generic template text, unused namespaces (Sponsors, Todos, Billing) removed from all locale files
5. **Correct project branding** - AppConfig name is "HealthCompanion", Sentry org/project names corrected
6. **Dead navigation removed** - Members and Settings dashboard links completely removed from layout and components
7. **Database schema simplified** - `organization` and `todo` tables removed via migration, schema updated
8. **Stripe completely removed** - All billing files, dependencies, env vars, configuration deleted
9. **CI/CD cleaned up** - CLERK_SECRET_KEY reference removed, optional Crowdin/Checkly workflows evaluated
10. **Accurate README** - README.md replaced with HealthCompanion-specific content, no boilerplate references
11. **Build succeeds** - `npm run build` completes successfully
12. **Lint passes** - `npm run lint` completes with no errors
13. **Tests pass** - `npm test` unit tests complete successfully

## Tasks / Subtasks

- [ ] **Phase 1: High-Impact Removals** (AC: #1, #2, #3, #4, #5)
  - [ ] Delete sponsors feature directory (`src/features/sponsors/`)
  - [ ] Delete sponsors template (`src/templates/Sponsors.tsx`)
  - [ ] Remove sponsor imports from landing page and dashboard
  - [ ] Delete 40+ boilerplate image assets (Crowdin, Sentry, Arcjet, template logos)
  - [ ] Delete demo components (`src/templates/DemoBanner.tsx`, `src/components/DemoBadge.tsx`)
  - [ ] Remove demo component imports from landing page
  - [ ] Clean hero section: remove Twitter badge, GitHub links
  - [ ] Clean CTA section: remove GitHub star links
  - [ ] Clean footer: remove "Creative Designs Guru" attribution, replace placeholder links
  - [ ] Clean navbar: remove dummy navigation links
  - [ ] Clean dashboard: remove "upgrade to PRO" link and boilerplate.com references
  - [ ] Remove Sponsors namespace from `src/locales/en.json`
  - [ ] Remove "Star on GitHub" CTAs from translations
  - [ ] Remove Lorem ipsum FAQ placeholders from translations
  - [ ] Clean meta descriptions mentioning "SaaS template"
  - [ ] Update `src/utils/AppConfig.ts`: "SaaS Template" → "HealthCompanion"
  - [ ] Fix Sentry config in `next.config.mjs`: remove boilerplate org/project names
  - [ ] Delete or update `.github/FUNDING.yml`
  - [ ] Validate: `npm run build` succeeds

- [ ] **Phase 2: Dead Navigation & Unused Features** (AC: #6, #4)
  - [ ] Remove Members navigation from `src/app/[locale]/(auth)/dashboard/layout.tsx`
  - [ ] Remove Settings navigation from dashboard layout
  - [ ] Remove Members/Settings from `src/features/dashboard/DashboardScaffold.tsx`
  - [ ] Delete `Todos` namespace from `src/locales/en.json` (lines 145-174)
  - [ ] Delete `Billing`, `BillingOptions`, `CheckoutConfirmation` namespaces
  - [ ] Delete "todos", "members", "billing", "settings" dashboard translation keys
  - [ ] Validate: `npm run build` succeeds

- [ ] **Phase 3: Database Schema Cleanup** (AC: #7)
  - [ ] Delete `organizationSchema` from `src/models/Schema.ts`
  - [ ] Delete `todoSchema` from `src/models/Schema.ts`
  - [ ] Generate migration: `npm run db:generate`
  - [ ] Apply migration (auto-applies on dev server start or manual run)
  - [ ] Validate: Dev server starts without errors

- [ ] **Phase 4: Stripe Integration - Complete Removal** (AC: #8)
  - [ ] Delete `src/features/billing/` directory
  - [ ] Delete `src/templates/Pricing.tsx`
  - [ ] Delete `src/types/Subscription.ts`
  - [ ] Remove pricing plan config from `src/utils/AppConfig.ts` (lines 23-74)
  - [ ] Remove Stripe env vars from `.env`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - [ ] Uninstall Stripe: `npm uninstall stripe`
  - [ ] Run `npm install` to clean node_modules
  - [ ] Remove Stripe setup instructions from README.md
  - [ ] Validate: `npm run build` succeeds

- [ ] **Phase 5: CI/CD & Service Cleanup** (AC: #9)
  - [ ] Update `.github/workflows/CI.yml`: remove `CLERK_SECRET_KEY` reference (line 81)
  - [ ] Evaluate `crowdin.yml` workflow - remove if not using Crowdin service
  - [ ] Evaluate `checkly.yml` workflow - remove if not using paid Checkly account
  - [ ] Optionally remove Percy visual testing from CI.yml (lines 76-80)
  - [ ] Optionally remove Codecov upload from CI.yml (lines 66-69)
  - [ ] Delete or update `checkly.config.ts` (points to react-saas.com)
  - [ ] Validate: CI workflows parse correctly

- [ ] **Phase 6: README Complete Replacement** (AC: #10)
  - [ ] Create new README.md structure:
    - Project description: HealthCompanion - AI health coaching application
    - Tech stack: Next.js 14, Supabase, Dify AI, PostgreSQL
    - Setup instructions specific to this project
    - Environment variables needed (Supabase, Dify)
    - Development commands
    - Deployment guide (Vercel-compatible)
  - [ ] Remove all boilerplate sponsor tables
  - [ ] Remove boilerplate screenshots
  - [ ] Remove generic template instructions
  - [ ] Validate: README is accurate and helpful

- [ ] **Phase 7: Optional Dependency Cleanup** (AC: #11, #12, #13)
  - [ ] Audit `@percy/*` packages - consider removal if visual testing unused
  - [ ] Audit `@storybook/*` packages - consider removal if only 1 story exists
  - [ ] Run `npm run build` - verify no breakage
  - [ ] Run `npm run lint` - verify passes
  - [ ] Run `npm test` - verify all tests pass
  - [ ] Manual smoke test: landing page, dashboard, auth flows work correctly

## Dev Notes

### Architecture Context

**Current State (From docs/architecture.md):**
- Next.js 14 App Router with serverless functions
- Feature-based organization in `src/features/`
- shadcn/ui component library in `src/components/ui/`
- Drizzle ORM with PostgreSQL database
- Supabase authentication

**Removal Strategy:**
The codebase carries 35-40% unused code from the original SaaS boilerplate template. This story performs aggressive cleanup to reduce cognitive overhead and maintenance burden without affecting core HealthCompanion functionality.

**Key Technical Approach:**
- File deletions via `rm -rf` for directories (or equivalent file deletion tools)
- Edit tool for surgical code removal from existing files
- Database migration via Drizzle: `npm run db:generate` creates migration, auto-applies on next DB interaction
- Package cleanup: `npm uninstall stripe` + potentially other unused deps
- Validation after each phase: `npm run build`, `npm run lint`, `npm test`

### Project Structure Notes

**Files to Delete (40+ total):**

**Directories:**
- `src/features/sponsors/`
- `src/features/billing/`

**Component Files:**
- `src/templates/Sponsors.tsx`
- `src/templates/DemoBanner.tsx`
- `src/templates/Pricing.tsx`
- `src/components/DemoBadge.tsx`

**Type Files:**
- `src/types/Subscription.ts`

**Image Assets (40+ files):**
- `public/assets/images/crowdin-*.png`
- `public/assets/images/sentry-*.png`
- `public/assets/images/arcjet-*.svg`
- `public/assets/images/nextjs-boilerplate-*.png`
- `public/assets/images/nextjs-starter-banner.png`
- `public/assets/images/clerk-logo-white.png`
- `public/assets/images/coderabbit-logo-*.svg`
- `public/assets/images/codecov-*.svg`

**Files to Edit:**

**Core Configuration:**
- `src/utils/AppConfig.ts` - Update name, remove pricing config
- `next.config.mjs` - Fix Sentry org/project names
- `.github/FUNDING.yml` - Delete or update
- `.env` - Remove Stripe env vars

**Page Components:**
- `src/app/[locale]/(unauth)/page.tsx` - Remove sponsor/demo imports
- `src/app/[locale]/(auth)/dashboard/page.tsx` - Remove sponsor imports, boilerplate references
- `src/app/[locale]/(auth)/dashboard/layout.tsx` - Remove Members/Settings navigation

**Feature Components:**
- `src/features/dashboard/DashboardScaffold.tsx` - Remove dead navigation links
- `src/features/landing/CenteredFooter.tsx` - Update attributions
- `src/templates/Navbar.tsx` - Remove dummy navigation

**Database:**
- `src/models/Schema.ts` - Remove organizationSchema, todoSchema

**Translations:**
- `src/locales/en.json` - Remove Sponsors, Todos, Billing namespaces, clean boilerplate text
- `src/locales/fr.json` - Same cleanup (though this file may be removed in Story 2.1)

**CI/CD:**
- `.github/workflows/CI.yml` - Remove CLERK_SECRET_KEY, evaluate Percy/Codecov
- `.github/workflows/crowdin.yml` - Evaluate for removal
- `.github/workflows/checkly.yml` - Evaluate for removal
- `checkly.config.ts` - Delete or update

**Package Dependencies:**
- `package.json` - Remove `stripe` dependency

**Documentation:**
- `README.md` - Complete replacement

### Database Migration Strategy

**Schema Changes:**
1. Remove `organizationSchema` from `src/models/Schema.ts`
2. Remove `todoSchema` from `src/models/Schema.ts`
3. Run `npm run db:generate` to create migration file
4. Migration auto-applies on next database interaction (dev server start or manual migration command)

**Migration Safety:**
- Both tables are 100% unused (no business logic depends on them)
- Zero risk of data loss (no production data in these tables)
- Can be rolled back via migration rollback if needed

**Verification:**
- Dev server starts successfully after migration
- No console errors related to missing tables
- Application functionality unaffected (these tables unused)

### Testing Standards Summary

**From docs/tech-spec/context.md:**
- Unit tests: Vitest + @testing-library/react
- Test files: `*.test.{ts,tsx}` co-located in `src/` or `tests/`
- Coverage tracking via @vitest/coverage-v8
- Run command: `npm test`

**Validation Testing for This Story:**
- Build validation: `npm run build` after each phase
- Lint validation: `npm run lint` to catch unused imports
- Unit tests: `npm test` to ensure no test breakage
- Manual smoke test: Verify landing, dashboard, auth flows still work

### References

**Primary Source Documents:**
- [Source: docs/tech-spec/the-change.md#Story-2-Architecture-Simplification] - Complete story scope and phases
- [Source: docs/tech-spec/implementation-guide.md#Story-2-Architecture-Simplification] - Implementation steps
- [Source: docs/tech-spec/context.md#Existing-Codebase-Structure] - Project structure patterns
- [Source: docs/architecture.md#Component-Architecture] - Component organization
- [Source: docs/architecture.md#Data-Architecture] - Database schema information

**Technical References:**
- [Source: docs/tech-spec/context.md#Testing-Patterns-Standards] - Testing approach
- [Source: docs/tech-spec/context.md#Code-Style-Conventions] - ESLint configuration and style rules
- [Source: docs/development-guide.md#Database-Management] - Drizzle ORM migration workflow

**Cross-Story Dependencies:**
- **Story 2.1 (UX Enhancements)** should wait for this story to complete (clean codebase first)
- **Story 2.3 (E2E Tests)** should wait for Story 2.1 (test against final UX)
- **Story 2.4 (Documentation)** - README replacement happens in this story, tech-spec created separately

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/2-2-architecture-simplification.context.xml` (Generated: 2025-12-04)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after story completion -->

### File List

<!-- Will be filled by dev agent with NEW, MODIFIED, DELETED file lists -->
