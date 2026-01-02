# Testing Approach

**Test Framework Stack:**
- Vitest 2.1.9 (unit tests)
- @testing-library/react 16.0.1 (component tests)
- Playwright 1.48.1 (E2E tests)
- @storybook/react 8.6.14 (component development - optional for MVP)

**MVP Testing Philosophy:**
- Focus on happy paths and critical failures
- Skip edge cases unlikely at <1000 users
- Prioritize integration over isolated unit tests
- Manual QA for UX polish

**Test Coverage Goals:**

| Layer | Coverage | Rationale |
|-------|----------|-----------|
| **API Routes** | Happy path + auth validation | Core functionality, prevent regressions |
| **Components** | Critical interactions | ThreadList, Thread component basics |
| **E2E** | Full user flows | Create thread, switch threads, archive |
| **Visual Regression** | Skipped (MVP) | Not critical for MVP launch |
| **Performance** | Skipped (MVP) | Load testing unnecessary at small scale |

**Automated Tests (CI/CD):**
```yaml
# .github/workflows/CI.yml (existing)
# Runs on: Pull requests to main
- Lint (ESLint)
- Type check (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright - headless)
- Build verification
```

**Manual Testing Checklist:**
(See "Manual QA Checklist" in Implementation Guide section above)

---
