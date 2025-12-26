# Implementation Stack

**Epic 2 uses the existing HealthCompanion stack with these specific technologies:**

**Story 1: UX Enhancements**
- Next.js 14.2.25 Server Components for auth state detection
- @assistant-ui/react 0.11.47 for chat interface
- Supabase 2.86.0 for user authentication and data
- next-intl 3.21.1 for i18n (adding Hindi/Bengali)
- Tailwind CSS 3.4.14 for visual polish

**Story 2: Architecture Simplification**
- Drizzle ORM 0.35.1 + drizzle-kit 0.26.2 for schema migrations
- Git for incremental deletions and rollback safety
- npm for dependency management

**Story 3: E2E Test Suite**
- Playwright 1.48.1 for browser automation
- @playwright/test for test runner
- Chromium (+ Firefox in CI) for test execution

**Story 4: Documentation**
- Markdown for README and tech-spec
- Git for version control

**All stories leverage:**
- TypeScript 5.6.3 (strict mode)
- ESLint + Prettier for code quality
- GitHub Actions for CI/CD

---
