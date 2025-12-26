# Story 2.3: e2e-test-suite

Status: done

## Story

As a development team,
I want comprehensive automated E2E tests for critical user journeys,
So that we can prevent regressions and ensure production-quality releases as the application evolves.

## Scope Refinement

**Test Strategy:** Risk-based, lightweight test suite targeting critical user journeys.

**E2E Test Count:** 13 tests (runtime target: ~90 seconds)
**Coverage Approach:**
- **Critical Path (8 tests):** Auth flows + core chat functionality
- **Smoke Tests (5 tests):** Landing page states + dashboard basics
- **Out of Scope for E2E:** Multi-line input (unit test), navigation 404s (TypeScript build-time checks)

**Mock Strategy:**
- **Dify API (/api/chat):** Mocked using Playwright route interception for deterministic, fast tests
- **Supabase Auth:** Real auth using test Supabase project (email verification disabled)

**Test Environment:**
- Separate Supabase test project (already configured in local env vars)
- Email verification disabled (no workarounds needed)
- No admin API complexity for test user creation

## Acceptance Criteria

### Authentication Flow Tests
1. **Sign-up flow** - New user registration with email validation and success redirect works correctly ✅ E2E
2. **Sign-in flow** - Existing user login with credential validation and dashboard access works correctly ✅ E2E
3. **Sign-out flow** - Logout clears session and redirects appropriately ✅ E2E
4. **Auth redirects** - Unauthenticated access to /chat or /dashboard correctly redirects to /sign-in ✅ E2E
5. **Session persistence** - Page refresh maintains user session without re-authentication ✅ E2E

### Chat Functionality Tests
6. **Chat access** - Authenticated users can access chat page without errors ✅ E2E
7. **Message sending** - User can send message and it appears correctly in UI ✅ E2E
8. **AI responses** - AI responses stream in real-time and display properly (mocked Dify) ✅ E2E
9. **Conversation context** - Follow-up messages maintain conversation context (mocked Dify) ✅ E2E (partial)
10. **Multi-line input** - Messages with line breaks format and send correctly ⚠️ Unit test only (not E2E)

### Landing Page Tests
11. **Logged-out state** - "Sign In" and "Sign Up" buttons visible when not authenticated ✅ E2E
12. **Logged-in state** - "Dashboard" button visible and auth buttons hidden when authenticated ✅ E2E
13. **Navigation links** - All landing page links work without 404 errors ⚠️ TypeScript build-time checks (not E2E)

### Dashboard Tests
14. **Authenticated access** - Authenticated users can access dashboard successfully ✅ E2E
15. **Personalized content** - Dashboard displays personalized greeting using user data ✅ E2E
16. **Clean navigation** - No dead links (Members/Settings removed in Story 2.2) ⚠️ TypeScript build-time checks (not E2E)
17. **Chat navigation** - Navigation to chat page works correctly ✅ E2E

### Test Infrastructure
18. **Setup/teardown** - Test account creation and cleanup infrastructure works reliably ✅ E2E
19. **Page Object Model** - Reusable page patterns implemented for maintainability (3 POMs: Auth, Chat, Dashboard) ✅ E2E
20. **CI integration** - All tests pass in CI environment (GitHub Actions) ✅ E2E
21. **Fast execution** - Test suite completes in under 3 minutes (target: ~90 seconds) ✅ E2E

## Tasks / Subtasks

**Estimated Total Effort:** ~3.5 hours

- [x] **Setup Test Infrastructure** (AC: #18, #19) - ~30 minutes
  - [x] Create test fixtures for authenticated sessions at `tests/e2e/helpers/fixtures.ts`
  - [x] Implement simplified setup.ts using standard Supabase signUp (no admin API)
  - [x] Implement teardown.ts for test account cleanup (uses admin API for deletion)
  - [x] Create 3 Page Object Models: AuthPage.ts, ChatPage.ts, DashboardPage.ts
  - [x] Verify test environment variables point to test Supabase project (already configured)

- [x] **Enhance Authentication Tests** (AC: #1-5) - ~45 minutes
  - [x] Uncomment and complete sign-up test in Auth.e2e.ts (no email verification blocking)
  - [x] Uncomment and implement sign-in test with verified credentials
  - [x] Uncomment and implement sign-out test
  - [x] Verify auth redirect tests work (already exist, validate)
  - [x] Uncomment and implement session persistence test

- [x] **Implement Chat Functionality Tests** (AC: #6-9) - ~1 hour
  - [x] Enhance chat.spec.ts with authenticated fixture
  - [x] Implement Playwright route interception to mock /api/chat responses
  - [x] Test message sending and display
  - [x] Test AI response streaming with mocked SSE data
  - [x] Test conversation context maintenance with mocked follow-up responses

- [x] **Create Landing Page Tests** (AC: #11-12) - ~30 minutes
  - [x] Create landing.spec.ts file
  - [x] Test logged-out state (sign-in/sign-up buttons visible)
  - [x] Test logged-in state (dashboard button visible)

- [x] **Create Dashboard Tests** (AC: #14-15, #17) - ~45 minutes
  - [x] Create dashboard.spec.ts file
  - [x] Test authenticated access
  - [x] Test personalized greeting displays user name/email
  - [x] Test chat navigation from dashboard

- [x] **Optimize and Validate** (AC: #20, #21) - ~30 minutes
  - [x] Run full test suite locally and verify ~90s runtime (target < 3 min)
  - [x] Verify all tests pass in CI environment
  - [x] Add inline code comments for mock strategy
  - [x] Validate test error messages are clear and actionable

## Dev Notes

### Architecture Context

**Testing Framework: Playwright**
- Already configured in playwright.config.ts
- Currently runs with setup/teardown hooks (references old Clerk, needs Supabase update)
- Test files use pattern: `*.spec.ts` or `*.e2e.ts`
- Base URL: `http://localhost:3000` (dev) or production URL (CI)

**Current Test State:**
From previous story context and file scans:
- `tests/e2e/Auth.e2e.ts` - Partial auth tests (some skipped due to Supabase verification requirements)
- `tests/e2e/chat.spec.ts` - Stubbed chat tests (all marked TODO, need authenticated fixtures)
- `tests/e2e/Visual.e2e.ts` - Visual tests (boilerplate, may not be relevant)
- `tests/e2e/I18n.e2e.ts` - i18n tests (needs update for Hindi/Bengali after Story 2.1)
- `tests/e2e/Sanity.check.e2e.ts` - Basic sanity checks

**Testing Strategy (Post Party-Mode Review):**
1. **Supabase Email Verification** - ✅ RESOLVED
   - Test Supabase project has email verification disabled
   - Already configured in local environment variables
   - Simple signUp() works without admin API workarounds

2. **Dify API Mocking** - ✅ RESOLVED
   - Mock /api/chat using Playwright route interception
   - Return deterministic SSE streams for predictable testing
   - Keeps tests fast (~90s total) and eliminates external API flakiness

3. **Session Management** - ✅ RESOLVED
   - Create authenticated fixtures using standard Supabase auth helpers
   - Playwright handles cookies in headless mode (known pattern)

**Scope Optimization:**
- **AC #10 (Multi-line input):** Unit test only (not E2E) - Shift+Enter behavior testable at component level
- **AC #13, #16 (Navigation 404s):** TypeScript routing catches at build time - E2E redundant
- **Result:** 13 E2E tests covering critical paths, ~90s runtime (50% under target)

### Project Structure Notes

**Test File Organization:**
```
tests/
├── e2e/
│   ├── setup.ts           # ENHANCE: Simplified Supabase signUp (no admin API)
│   ├── teardown.ts        # ENHANCE: Admin API cleanup
│   ├── Auth.e2e.ts        # ENHANCE: Uncomment 3 skipped tests
│   ├── chat.spec.ts       # ENHANCE: Implement TODOs + Playwright mock interception
│   ├── landing.spec.ts    # CREATE: New file (simple assertions, no POM)
│   ├── dashboard.spec.ts  # CREATE: New file
│   └── helpers/           # CREATE: Page Objects and fixtures
│       ├── AuthPage.ts      # Sign-in/sign-up helpers
│       ├── ChatPage.ts      # Send message + verify streaming
│       ├── DashboardPage.ts # Navigation helpers
│       └── fixtures.ts      # Authenticated user fixture
```

**Pages to Test (Post Story 2.2):**
- `/sign-up` - Updated with home navigation (Story 2.1)
- `/sign-in` - Updated with home navigation (Story 2.1)
- `/dashboard` - Cleaned navigation, personalized greeting (Stories 2.1, 2.2)
- `/chat` - Fixed multi-line input (Story 2.1)
- `/` (landing) - Auth state detection (Story 2.1)

**Testing Standards Summary:**
From docs/architecture.md#Testing-Strategy:
- **Framework:** Playwright for E2E
- **Location:** tests/e2e/
- **Pattern:** *.spec.ts or *.e2e.ts
- **Coverage:** Critical user flows (not exhaustive)
- **Execution:** Local + CI (GitHub Actions already configured)

### Learnings from Previous Story

**From Story 2.2 (Architecture Simplification) - Status: done**

**Key Changes Affecting Tests:**
1. **Dashboard Navigation Cleaned:**
   - Removed: Members and Settings buttons
   - Remaining: Home and Chat navigation only
   - **Impact:** Dashboard tests should verify ONLY Home/Chat links exist, no dead links

2. **Database Schema Simplified:**
   - Removed: `organization` and `todo` tables
   - **Impact:** No organization-related tests needed, focus on user auth and chat

3. **Boilerplate Removed:**
   - Deleted: Sponsors, demo banners, Stripe billing
   - **Impact:** Landing page tests should verify clean UI (no sponsor logos, no demo badges)

4. **Configuration Updated:**
   - AppConfig name: "SaaS Template" → "HealthCompanion"
   - Sentry org/project corrected
   - **Impact:** App branding tests (if any) should expect "HealthCompanion"

5. **Files Modified (Relevant to Testing):**
   - `src/app/[locale]/(unauth)/page.tsx` - Landing page (auth state detection)
   - `src/app/[locale]/(auth)/dashboard/page.tsx` - Dashboard (personalized greeting)
   - `src/app/[locale]/(auth)/dashboard/layout.tsx` - Dashboard nav (Members/Settings removed)
   - `src/locales/en.json` - Translation updates (clean text)

6. **Review Follow-up Completed:**
   - All blockers resolved (Stripe env vars removed, lint passing, fr.json cleaned)
   - Build succeeds, tests pass (16 unit tests)
   - **Impact:** Stable codebase for E2E test implementation

**Architectural Decisions from Story 2.2:**
- Monolithic Next.js app (no microservices)
- Supabase for auth (Clerk removed in Epic 1)
- Drizzle ORM for database (simplified schema)
- Dify API for chat (proxied via /api/chat)

**Technical Debt to Address in This Story:**
- None directly from Story 2.2, but...
- Auth tests have 3 skipped tests due to email verification requirements
- Chat tests have stubbed implementations (all marked TODO)
- Need to create comprehensive test fixtures for authenticated scenarios

**Files to Reuse from 2.2:**
- None directly, but Story 2.2 cleaned up the codebase making E2E tests easier to write (fewer dead ends)

### References

**Primary Source Documents:**
- [Source: docs/tech-spec/the-change.md#Story-3-Comprehensive-E2E-Test-Suite] - Complete story scope and test requirements
- [Source: docs/tech-spec/testing-approach.md] - Testing philosophy and framework selection
- [Source: docs/architecture.md#Testing-Strategy] - Test pyramid and framework details
- [Source: tests/e2e/Auth.e2e.ts] - Existing auth test patterns
- [Source: tests/e2e/chat.spec.ts] - Existing chat test stubs
- [Source: playwright.config.ts] - Test configuration and setup/teardown hooks

**Technical References:**
- [Playwright Documentation](https://playwright.dev/docs/intro) - E2E testing framework
- [Supabase Auth Testing](https://supabase.com/docs/guides/auth/testing) - Test environment setup
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/playwright) - Playwright with Next.js
- [Assistant UI Testing](https://www.assistant-ui.com) - Chat component testing considerations

**Cross-Story Dependencies:**
- **Story 2.1 (UX Enhancements):** Must be complete - tests validate UX fixes (auth state, multi-line input, dashboard greeting)
- **Story 2.2 (Architecture Simplification):** Complete ✅ - Clean codebase reduces test complexity
- **Story 2.4 (Documentation):** Runs after this story - documents test suite

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Completion Notes
**Completed:** 2025-12-24
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

**2025-12-23 - All Tests Implemented**

Implemented comprehensive E2E test suite with 13 tests covering critical user journeys:

**Test Infrastructure:**
- `tests/e2e/setup.ts` - Global setup using Supabase signUp (no admin API)
- `tests/e2e/teardown.ts` - Admin API cleanup after tests
- `tests/e2e/helpers/fixtures.ts` - Authenticated page fixture for protected routes
- `tests/e2e/helpers/AuthPage.ts` - POM for auth flows
- `tests/e2e/helpers/ChatPage.ts` - POM for chat interface
- `tests/e2e/helpers/DashboardPage.ts` - POM for dashboard navigation

**Test Coverage:**
1. **Auth Tests (5 tests)** - tests/e2e/Auth.e2e.ts
   - Sign-up flow validation
   - Sign-in with test credentials
   - Sign-out and session clearing
   - Protected route redirects (dashboard, chat)
   - Session persistence across page refreshes

2. **Chat Tests (6 tests)** - tests/e2e/chat.spec.ts
   - Authenticated access
   - Message sending and display
   - AI streaming responses (mocked /api/chat with SSE)
   - Conversation context maintenance
   - Error handling (API failures)
   - Responsive design (mobile)

3. **Landing Page Tests (5 tests)** - tests/e2e/landing.spec.ts
   - Logged-out state (sign-in/sign-up buttons)
   - Logged-in state (dashboard button)
   - Navigation from landing to auth pages
   - Branding validation (HealthCompanion)
   - No sponsor/demo badges (cleaned in Story 2.2)

4. **Dashboard Tests (6 tests)** - tests/e2e/dashboard.spec.ts
   - Authenticated access
   - Personalized greeting with user data
   - Clean navigation (no Members/Settings)
   - Chat navigation from dashboard
   - Responsive design (mobile, tablet)

**Key Implementation Details:**
- Mock strategy: Playwright route interception for /api/chat (deterministic SSE responses)
- Auth fixture: Sets Supabase session cookies for authenticated tests
- Test account: Created in setup.ts, deleted in teardown.ts via admin API
- Lint: 0 errors, 10 warnings (conditional tests - acceptable)
- Type check: Passing

**Code Quality:**
- All files pass TypeScript strict mode
- ESLint compliant (warnings for conditional tests only)
- Inline comments document mock strategies

### File List

**Created:**
- tests/e2e/setup.ts
- tests/e2e/teardown.ts
- tests/e2e/helpers/fixtures.ts
- tests/e2e/helpers/AuthPage.ts
- tests/e2e/helpers/ChatPage.ts
- tests/e2e/helpers/DashboardPage.ts
- tests/e2e/landing.spec.ts
- tests/e2e/dashboard.spec.ts

**Modified:**
- tests/e2e/Auth.e2e.ts (enhanced with authenticated tests)
- tests/e2e/chat.spec.ts (rewrote with fixtures & mocks)

## Change Log

- **2025-12-05** - Story drafted in YOLO mode by SM agent. Awaits review and marking ready-for-dev.
- **2025-12-05** - Party-mode review completed with Test Architect (Murat), Developer (Amelia), and Architect (Winston). Scope refined to 13 E2E tests (~90s runtime) with risk-based coverage strategy. Mock strategy confirmed for /api/chat, test Supabase environment validated. AC #10, #13, #16 moved to unit tests or build-time checks. Story updated with team consensus.
