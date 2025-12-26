# Implementation Guide

## Setup Steps

**Before Starting Epic 2:**

1. **Create feature branch:**
   ```bash
   git checkout -b epic-2-production-readiness
   ```

2. **Ensure clean working directory:**
   ```bash
   git status  # Should show no uncommitted changes
   ```

3. **Verify build succeeds:**
   ```bash
   npm run build
   ```

4. **Run existing tests:**
   ```bash
   npm test
   npm run lint
   ```

**All setup steps complete - ready to implement!**

## Implementation Steps

**Execute stories in this order: Story 2 → Story 1 → Story 3 → Story 4**

**STORY 2: Architecture Simplification (Do First)**

**Phase 1: High-Impact Removals**
1. Delete sponsors feature files:
   ```bash
   rm -rf src/features/sponsors
   rm src/templates/Sponsors.tsx
   ```

2. Delete boilerplate image assets:
   ```bash
   rm public/assets/images/crowdin-*.png
   rm public/assets/images/sentry-*.png
   rm public/assets/images/arcjet-*.svg
   rm public/assets/images/nextjs-boilerplate-*.png
   rm public/assets/images/nextjs-starter-banner.png
   rm public/assets/images/clerk-logo-white.png
   rm public/assets/images/coderabbit-logo-*.svg
   rm public/assets/images/codecov-*.svg
   ```

3. Delete demo components:
   ```bash
   rm src/templates/DemoBanner.tsx
   rm src/components/DemoBadge.tsx
   ```

4. Remove imports from landing page (`src/app/[locale]/(unauth)/page.tsx`)
5. Remove imports from dashboard (`src/app/[locale]/(auth)/dashboard/page.tsx`)
6. Clean up translation files (remove Sponsors, Todos, Billing namespaces from `src/locales/en.json`)
7. Update AppConfig name: "SaaS Template" → "HealthCompanion"
8. Fix Sentry config in `next.config.mjs`
9. Delete/update `.github/FUNDING.yml`

**Validate:** `npm run build` succeeds

**Phase 2: Dead Navigation**
1. Remove Members/Settings links from `src/app/[locale]/(auth)/dashboard/layout.tsx`
2. Remove Members/Settings from `src/features/dashboard/DashboardScaffold.tsx`
3. Delete unused translation keys

**Validate:** `npm run build` succeeds

**Phase 3: Database Schema**
1. Edit `src/models/Schema.ts` - remove `organizationSchema` and `todoSchema`
2. Run `npm run db:generate` - creates migration
3. Migration auto-applies on next dev server start

**Validate:** Dev server starts without errors

**Phase 4: Stripe Removal**
1. Delete `src/features/billing/` directory
2. Delete `src/templates/Pricing.tsx`
3. Delete `src/types/Subscription.ts`
4. Remove pricing config from `src/utils/AppConfig.ts`
5. Remove Stripe env vars from `.env`
6. Run `npm uninstall stripe`
7. Run `npm install`

**Validate:** `npm run build` succeeds

**Phase 5: CI/CD Cleanup**
1. Update `.github/workflows/CI.yml` - remove CLERK_SECRET_KEY
2. Evaluate and optionally delete `crowdin.yml` and `checkly.yml`

**Phase 6: README Replacement**
1. Write new README.md from scratch (use CLAUDE.md as reference)

**Validate:** All Story 2 changes complete, build succeeds

---

**STORY 1: UX Enhancements (Do Second)**

1. **Fix Chat Interface:**
   - Debug `src/app/[locale]/(chat)/chat/page.tsx`
   - Fix multi-line input handling
   - Fix height/rendering issues
   - Fix thread history display

2. **Landing Page Auth State:**
   - Add Supabase session check to `src/app/[locale]/(unauth)/page.tsx`
   - Conditional rendering based on user state
   - Update `src/templates/Navbar.tsx` for auth state

3. **Dashboard Personalization:**
   - Update `src/app/[locale]/(auth)/dashboard/page.tsx` with user greeting
   - Already removed dead links in Story 2

4. **Auth Pages Polish:**
   - Update `src/app/[locale]/(auth)/(center)/sign-in/page.tsx`
   - Update `src/app/[locale]/(auth)/(center)/sign-up/page.tsx`
   - Add home navigation link
   - Apply Tailwind styling

5. **i18n Change:**
   - Delete `src/locales/fr.json`
   - Create `src/locales/hi.json` (copy en.json structure)
   - Create `src/locales/bn.json` (copy en.json structure)
   - Update `src/libs/i18n.ts` - change locales array
   - Update `src/utils/AppConfig.ts` - change locales array

6. **Footer Attribution:**
   - Update `src/features/landing/CenteredFooter.tsx`

**Validate:** Manual testing of all UX changes

---

**STORY 3: E2E Test Suite (Do Third)**

1. **Install Playwright (if needed):**
   ```bash
   npx playwright install
   ```

2. **Create test files in `tests/e2e/`:**
   - `auth.spec.ts` - Authentication flows
   - `chat.spec.ts` - Chat functionality
   - `landing.spec.ts` - Landing page tests
   - `dashboard.spec.ts` - Dashboard tests

3. **Run tests:**
   ```bash
   npm run test:e2e
   ```

**Validate:** All tests pass

---

**STORY 4: Documentation (Do Last)**

1. **README already replaced in Story 2**

2. **Tech-spec created (this document)**

3. **Optional: Update other docs:**
   - `docs/architecture.md` - reflect removed features
   - `docs/source-tree-analysis.md` - update file list
   - `CLAUDE.md` - update if needed

**Validate:** Documentation accurately reflects final state

## Testing Strategy

**Story 2: Architecture Simplification**
- **Validation:** `npm run build` after each phase
- **Smoke test:** Manual verification of landing, dashboard, auth flows
- **Lint:** `npm run lint` to catch unused imports

**Story 1: UX Enhancements**
- **Manual testing:** Test all changed pages (landing, dashboard, chat, auth)
- **Browser testing:** Chrome, Firefox, Safari
- **Mobile responsive:** Test on actual mobile device or emulator
- **i18n testing:** Verify /hi/ and /bn/ routes work

**Story 3: E2E Test Suite**
- **Automated:** Playwright tests run via `npm run test:e2e`
- **CI integration:** Tests run automatically on PR/push

**Story 4: Documentation**
- **Review:** Read README and tech-spec for accuracy
- **Links:** Verify all internal links work

## Acceptance Criteria

**Story 1: UX Enhancements**
- ✅ Chat interface handles multi-line input correctly (Enter for new line, Shift+Enter to send)
- ✅ Chat messages render without page jumping or height issues
- ✅ Chat thread history displays complete conversation
- ✅ Landing page shows "Dashboard" button when logged in, "Sign In/Up" when logged out
- ✅ Dashboard displays personalized greeting with user email/name
- ✅ Dashboard has NO dead links (Members/Settings removed)
- ✅ Sign-in and sign-up pages have visual polish matching landing page aesthetic
- ✅ Auth pages include "Back to Home" navigation link
- ✅ Auth pages are responsive on mobile
- ✅ French locale removed, Hindi and Bengali locales added
- ✅ /hi/ and /bn/ routes work correctly
- ✅ Footer attribution updated (no boilerplate references)

**Story 2: Architecture Simplification**
- ✅ Zero sponsor references in codebase (files, imports, translations, images)
- ✅ No demo banners or badges
- ✅ No boilerplate marketing content (GitHub stars, Twitter badges)
- ✅ No Lorem ipsum or generic template text
- ✅ AppConfig name is "HealthCompanion"
- ✅ Sentry org/project names are correct (not boilerplate)
- ✅ organization and todo tables removed from database
- ✅ Stripe completely removed (files, dependencies, env vars, config)
- ✅ CI.yml has no CLERK_SECRET_KEY reference
- ✅ README accurately describes HealthCompanion (not boilerplate)
- ✅ `npm run build` succeeds
- ✅ `npm run lint` passes
- ✅ `npm test` passes

**Story 3: E2E Test Suite**
- ✅ Auth tests pass: sign-up, sign-in, sign-out, auth redirects, session persistence
- ✅ Chat tests pass: send message, receive response, conversation context, multi-line input
- ✅ Landing page tests pass: logged-in/out state detection
- ✅ Dashboard tests pass: personalized content, working navigation
- ✅ All tests run in <3 minutes
- ✅ Tests pass in CI
- ✅ Clear test names and error messages

**Story 4: Documentation**
- ✅ README describes HealthCompanion accurately
- ✅ README has no boilerplate/template references
- ✅ README includes setup instructions specific to HealthCompanion
- ✅ Tech-spec (this document) created
- ✅ Optional docs updated if needed

---
