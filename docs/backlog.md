# HealthCompanion - Technical Backlog

This file tracks technical debt, code quality improvements, and follow-up items identified during code reviews.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
|------|-------|------|------|----------|-------|--------|-------|
| 2025-12-02 | 1.1 | 1 | TechDebt | Med | TBD | Open | Improve type safety in middleware - replace `as any` with proper typing [src/middleware.ts:42-44] |
| 2025-12-02 | 1.1 | 1 | Enhancement | Med | TBD | Open | Add Zod schema validation to auth forms for better client-side UX [sign-in/page.tsx, sign-up/page.tsx] |
| 2025-12-02 | 1.1 | 1 | TechDebt | Low | TBD | Open | Replace `any` types with proper CookieOptions type [src/libs/supabase/server.ts:13,23, middleware.ts] |
| 2025-12-02 | 1.1 | 1 | Enhancement | Low | TBD | Open | Enhance error messages for better user debugging experience [sign-in/page.tsx:28, sign-up/page.tsx:30] |
| 2025-12-02 | 1.2 | 1 | Bug | High | TBD | Open | Preserve locale across Supabase auth navigation/redirects; build targets from `params.locale` to keep users in language context [src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx, sign-up, sign-out, CenteredLayout] |
| 2025-12-02 | 1.3 | 1 | Bug | High | TBD | Open | Restrict protected route detection to locale-aware prefix matches (not substrings) to avoid redirecting public pages [src/middleware.ts] |
| 2025-12-03 | 1.2 | 1 | Enhancement | Low | TBD | Open | Add specific JSON parsing error handling returning 400 BAD_REQUEST instead of 500 for malformed client requests [src/app/api/chat/route.ts:46] |
