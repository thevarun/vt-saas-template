# Story 2.3: e2e-test-suite

Status: drafted

## Story

As a development team,
I want comprehensive automated E2E tests for critical user journeys,
So that we can prevent regressions and ensure production-quality releases as the application evolves.

## Acceptance Criteria

### Authentication Flow Tests
1. **Sign-up flow** - New user registration with email validation and success redirect works correctly
2. **Sign-in flow** - Existing user login with credential validation and dashboard access works correctly
3. **Sign-out flow** - Logout clears session and redirects appropriately
4. **Auth redirects** - Unauthenticated access to /chat or /dashboard correctly redirects to /sign-in
5. **Session persistence** - Page refresh maintains user session without re-authentication

### Chat Functionality Tests
6. **Chat access** - Authenticated users can access chat page without errors
7. **Message sending** - User can send message and it appears correctly in UI
8. **AI responses** - AI responses stream in real-time and display properly
9. **Conversation context** - Follow-up messages maintain conversation context
10. **Multi-line input** - Messages with line breaks format and send correctly

### Landing Page Tests
11. **Logged-out state** - "Sign In" and "Sign Up" buttons visible when not authenticated
12. **Logged-in state** - "Dashboard" button visible and auth buttons hidden when authenticated
13. **Navigation links** - All landing page links work without 404 errors

### Dashboard Tests
14. **Authenticated access** - Authenticated users can access dashboard successfully
15. **Personalized content** - Dashboard displays personalized greeting using user data
16. **Clean navigation** - No dead links (Members/Settings removed in Story 2.2)
17. **Chat navigation** - Navigation to chat page works correctly

### Test Infrastructure
18. **Setup/teardown** - Test account creation and cleanup infrastructure works reliably
19. **Page Object Model** - Reusable page patterns implemented for maintainability
20. **CI integration** - All tests pass in CI environment (GitHub Actions)
21. **Fast execution** - Test suite completes in under 3 minutes

## Tasks / Subtasks

- [ ] **Setup Test Infrastructure** (AC: #18, #19)
  - [ ] Create test fixtures for authenticated sessions (Supabase)
  - [ ] Implement setup.ts file for test account creation
  - [ ] Implement teardown.ts file for test account cleanup
  - [ ] Create Page Object Models for common pages (Auth, Chat, Dashboard, Landing)
  - [ ] Configure test environment variables for Supabase test instance

- [ ] **Enhance Authentication Tests** (AC: #1-5)
  - [ ] Expand existing Auth.e2e.ts with full sign-up flow (currently partial)
  - [ ] Implement sign-in test with verified credentials (currently skipped)
  - [ ] Implement sign-out test (currently skipped)
  - [ ] Verify auth redirect tests work (already exist, validate)
  - [ ] Implement session persistence test (currently skipped)

- [ ] **Implement Chat Functionality Tests** (AC: #6-10)
  - [ ] Enhance chat.spec.ts with authenticated fixture
  - [ ] Test message sending and display
  - [ ] Test AI response streaming (may need mocked Dify responses)
  - [ ] Test conversation context maintenance
  - [ ] Test multi-line input handling (Shift+Enter behavior)

- [ ] **Create Landing Page Tests** (AC: #11-13)
  - [ ] Create landing.spec.ts file
  - [ ] Test logged-out state (sign-in/sign-up buttons visible)
  - [ ] Test logged-in state (dashboard button visible)
  - [ ] Test all navigation links (no 404s)

- [ ] **Create Dashboard Tests** (AC: #14-17)
  - [ ] Create dashboard.spec.ts file
  - [ ] Test authenticated access
  - [ ] Test personalized greeting displays user name/email
  - [ ] Verify no dead navigation links (Members/Settings removed)
  - [ ] Test chat navigation from dashboard

- [ ] **Optimize and Validate** (AC: #20, #21)
  - [ ] Run full test suite locally and verify < 3 min runtime
  - [ ] Verify all tests pass in CI environment
  - [ ] Add test documentation (README or comments)
  - [ ] Validate test error messages are clear and actionable

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

**Key Testing Challenges:**
1. **Supabase Email Verification** - Sign-up requires email verification which blocks full auth flow testing
   - **Solution:** Use Supabase test environment with auto-confirm or programmatic verification
2. **Dify API Mocking** - Chat tests need AI responses to validate streaming
   - **Solution:** Mock /api/chat responses OR use real Dify in controlled test mode
3. **Session Management** - Tests need authenticated context
   - **Solution:** Create authenticated fixtures using Supabase auth helpers

### Project Structure Notes

**Test File Organization:**
```
tests/
├── e2e/
│   ├── setup.ts           # CREATE: Test account setup
│   ├── teardown.ts        # CREATE: Test cleanup
│   ├── Auth.e2e.ts        # ENHANCE: Add skipped tests
│   ├── chat.spec.ts       # ENHANCE: Implement TODO tests
│   ├── landing.spec.ts    # CREATE: New file
│   ├── dashboard.spec.ts  # CREATE: New file
│   └── helpers/           # CREATE: Page Objects and fixtures
│       ├── AuthPage.ts
│       ├── ChatPage.ts
│       ├── DashboardPage.ts
│       └── fixtures.ts
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

### File List

## Change Log

- **2025-12-05** - Story drafted in YOLO mode by SM agent. Awaits review and marking ready-for-dev.
