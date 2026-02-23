# Deep Audit — Deduplicated Findings

Generated: 2026-02-20 | Mode: Full (14 dimensions)

## Finding Registry

=== FINDING ===
id: F-001
agent: security-and-error-handling
severity: P1
confidence: 95
file: src/app/api/profile/update/route.ts
line: 41
dimension: Security
title: Profile update uses admin API (listUsers) via anon-key client
description: |
  The `/api/profile/update` route calls `supabase.auth.admin.listUsers()` using the regular user-scoped Supabase client (created with the anon key). This call will likely fail at runtime or, if RLS is misconfigured, expose all user data to any authenticated user.
suggestion: |
  Replace the admin `listUsers()` call with a database query against `userPreferences` table using the same pattern as `check-username/route.ts`.
=== END FINDING ===

=== FINDING ===
id: F-002
agent: security-and-error-handling
severity: P1
confidence: 90
file: src/app/api/profile/update/route.ts
line: 64-69
dimension: Security
title: Missing input validation on displayName in profile update
description: |
  The `displayName` field has zero validation beyond checking it is truthy — no length limit, no type check, no character restrictions. A user could send an extremely long string or non-string value.
suggestion: |
  Add Zod schema validation consistent with the other profile routes.
=== END FINDING ===

=== FINDING ===
id: F-003
agent: security-and-error-handling
severity: P1
confidence: 90
file: src/app/api/feedback/route.ts
line: 54
dimension: Security
title: No rate limiting on anonymous feedback endpoint
description: |
  The `/api/feedback` endpoint allows anonymous submissions with no rate limiting, CAPTCHA, or abuse prevention. An attacker could flood the database with unlimited feedback entries.
suggestion: |
  Implement IP-based rate limiting (~5 submissions/hour) or CAPTCHA for anonymous submissions.
=== END FINDING ===

=== FINDING ===
id: F-004
agent: security-and-error-handling
severity: P2
confidence: 90
file: src/libs/auth/isAdmin.ts
line: 22-24
dimension: Security
title: Admin check relies on user-writable user_metadata
description: |
  The `isAdmin` function checks `user.user_metadata?.isAdmin === true`. In Supabase, `user_metadata` can be modified by users, enabling potential privilege escalation.
suggestion: |
  Switch to `app_metadata` which is only settable via admin/service-role API calls.
=== END FINDING ===

=== FINDING ===
id: F-005
agent: security-and-error-handling
severity: P2
confidence: 85
file: src/app/api/chat/messages/route.ts
line: 32-33
dimension: Security
title: Missing validation on conversation_id in messages endpoint
description: |
  The GET `/api/chat/messages` endpoint passes `conversation_id` directly to Dify API without format validation, unlike the POST endpoint which validates with regex.
suggestion: |
  Add the same conversation ID validation regex used in `/api/chat/route.ts`.
=== END FINDING ===

=== FINDING ===
id: F-006
agent: security-and-error-handling
severity: P2
confidence: 85
file: src/app/api/admin/feedback/[id]/archive/route.ts
line: 34
dimension: Security
title: Missing UUID validation on feedback ID parameter in admin routes
description: |
  Admin feedback routes accept `id` parameter without UUID format validation. The admin user routes properly validate with `isValidUuid()`.
suggestion: |
  Add `isValidUuid(id)` check to archive, delete, and mark-reviewed feedback routes.
=== END FINDING ===

=== FINDING ===
id: F-007
agent: security-and-error-handling
severity: P2
confidence: 85
file: src/app/api/admin/users/[userId]/route.ts
line: 73
dimension: Error Handling
title: Supabase error messages leaked in admin API responses
description: |
  Multiple admin routes pass raw Supabase `error.message` to `internalError()`, potentially exposing internal details like schema names or connection info.
suggestion: |
  Use generic error messages for client responses while logging detailed errors server-side.
=== END FINDING ===

=== FINDING ===
id: F-008
agent: security-and-error-handling
severity: P2
confidence: 85
file: src/app/api/email/welcome/route.ts
line: 40
dimension: Error Handling
title: Email send failure details leaked in API response
description: |
  When the welcome email fails, `result.error` (from Resend) is returned directly, potentially revealing infrastructure details.
suggestion: |
  Return generic error message, log details server-side.
=== END FINDING ===

=== FINDING ===
id: F-009
agent: security-and-error-handling
severity: P2
confidence: 80
file: src/proxy.ts
line: 124
dimension: Security
title: Middleware matcher excludes all API routes from auth protection
description: |
  The middleware explicitly excludes `/api` routes, relying entirely on each route to implement its own authentication. Creates fragile defense model.
suggestion: |
  Add a shared `withAuth()` HOF or lightweight API middleware for rate limiting and auth.
=== END FINDING ===

=== FINDING ===
id: F-010
agent: security-and-error-handling
severity: P3
confidence: 85
file: src/app/api/profile/update/route.ts
line: 21
dimension: Error Handling
title: request.json() not wrapped in try-catch for malformed requests
description: |
  Multiple routes call `request.json()` without handling malformed JSON gracefully, falling through to generic 500 errors instead of 400.
suggestion: |
  Wrap in try-catch or use Zod `.safeParse()` which handles parse failures automatically.
=== END FINDING ===

=== FINDING ===
id: F-012
agent: security-and-error-handling
severity: P3
confidence: 80
file: src/app/api/chat/vercel/route.ts
line: 225-232
dimension: Security
title: User-supplied message roles passed to AI model without sanitization
description: |
  Users could craft requests with `role: "system"` messages to potentially inject system prompts.
suggestion: |
  Filter messages to only allow `user` and `assistant` roles before passing to AI model.
=== END FINDING ===

=== FINDING ===
id: F-016
agent: performance-profiler
severity: P2
confidence: 95
file: src/libs/mem0/worker.ts
line: 74-192
dimension: Performance
title: N+1 DB queries and sequential dynamic imports in job processing loop
description: |
  Each job executes 7+ serial DB round-trips plus dynamic imports. With 100 jobs: 700+ serial DB queries.
suggestion: |
  Move dynamic imports to top-level. Batch inserts. Use bounded parallelism.
=== END FINDING ===

=== FINDING ===
id: F-019
agent: performance-profiler
severity: P2
confidence: 88
file: src/proxy.ts
line: 52-118
dimension: Performance
title: Two sequential Supabase auth.getUser() calls on every protected request
description: |
  Every protected route makes two sequential round-trips to Supabase Auth (~100ms total TTFB tax).
suggestion: |
  Refactor updateSession to return the user object and share it with the auth check.
=== END FINDING ===

=== FINDING ===
id: F-021
agent: performance-profiler
severity: P2
confidence: 87
file: src/app/api/chat/vercel/route.ts
line: 162-196
dimension: Performance
title: Sequential DB calls block chat stream start (150-400ms pre-streaming latency)
description: |
  Three sequential awaited DB operations before any tokens stream: conversation lookup/create, message persist, memory retrieval.
suggestion: |
  Parallelize independent operations with Promise.all. Move user message persistence to fire-and-forget.
=== END FINDING ===

=== FINDING ===
id: F-022
agent: performance-profiler
severity: P3
confidence: 85
file: src/components/analytics/PostHogProvider.tsx
line: 16-22
dimension: Performance
title: PostHog with autocapture:true adds ~40-60KB to main bundle
description: |
  PostHog is bundled into the main chunk and parsed on page load. Autocapture adds DOM mutation observers that can degrade INP.
suggestion: |
  Lazy-load PostHog via dynamic import after idle. Disable autocapture, use manual tracking.
=== END FINDING ===

=== FINDING ===
id: F-023
agent: performance-profiler
severity: P3
confidence: 82
file: src/components/chat/vercel/ConversationListSidebar.tsx
line: 98-107
dimension: Performance
title: Window:focus event triggers uncached API call on every tab switch
description: |
  Both chat sidebars refetch conversations on every tab focus without debounce or stale-time check.
suggestion: |
  Add 30-second stale-time check before triggering refetch.
=== END FINDING ===

=== FINDING ===
id: F-024
agent: architecture-and-complexity
severity: P1
confidence: 95
file: src/libs/supabase/threads.ts
line: 30
dimension: Architecture
title: Dify threads use stale "health_companion" schema while Drizzle uses "vt_saas"
description: |
  `threads.ts` hardcodes `THREADS_SCHEMA = 'health_companion'` while all Drizzle tables use `vt_saas`. Either a latent bug or dual-schema confusion.
suggestion: |
  Migrate threads.ts to use Drizzle ORM against the vt_saas schema.
=== END FINDING ===

=== FINDING ===
id: F-025
agent: architecture-and-complexity
severity: P1
confidence: 95
file: src/libs/queries/vercelConversations.ts
line: 48
dimension: Architecture
title: Vestigial _supabase parameter creates false security promise in Drizzle query layer
description: |
  Every function in vercelConversations.ts and vercelMessages.ts accepts unused `_supabase: SupabaseClient`. JSDoc claims "RLS ensures ownership" but Drizzle bypasses RLS entirely.
suggestion: |
  Remove _supabase parameter. Make userId required. Update JSDoc to reflect actual authorization model.
=== END FINDING ===

=== FINDING ===
id: F-026
agent: architecture-and-complexity
severity: P1
confidence: 90
file: src/libs/queries/vercelConversations.ts
line: 50-51
dimension: Architecture
title: Inconsistent data access: Supabase raw queries for Dify, Drizzle ORM for Vercel AI
description: |
  Two chat implementations use completely different data access strategies with different auth models, schema references, and return conventions.
suggestion: |
  Consolidate on Drizzle ORM. Supabase client should only be used for auth.
=== END FINDING ===

=== FINDING ===
id: F-027
agent: architecture-and-complexity
severity: P1
confidence: 90
file: src/libs/api/admin/analytics.ts
line: 27, 73
dimension: Architecture
title: Duplicated calculateTrend and listAllUsers functions across metrics modules
description: |
  `calculateTrend` is implemented twice with different return types. `listAllUsers` duplicates `fetchAllUsers`. Multiple analytics functions each independently call fetchAllUsers().
suggestion: |
  Consolidate to one calculateTrend in utils and one fetchAllUsers in metrics. Fetch users once per request.
=== END FINDING ===

=== FINDING ===
id: F-028
agent: architecture-and-complexity
severity: P2
confidence: 95
file: src/app/api/admin
line: multiple routes
dimension: Architecture
title: 11 admin API routes duplicate identical auth + admin authorization boilerplate
description: |
  Every admin route repeats 8 lines of auth/admin check boilerplate. Any change requires editing 11 files. ~10 more non-admin routes have similar auth duplication.
suggestion: |
  Extract `withAdminAuth()` and `withAuth()` higher-order functions to centralize auth.
=== END FINDING ===

=== FINDING ===
id: F-029
agent: architecture-and-complexity
severity: P2
confidence: 90
file: src/libs/vercel-ai/config.ts
line: 51-54
dimension: Architecture
title: Environment variable access bypasses validated Env.ts in multiple config modules
description: |
  Several config modules access `process.env` directly instead of through the validated `Env.ts` (vercel-ai, chatConfig, langfuse, mem0, supabase).
suggestion: |
  Route all environment variable access through Env.ts. Add missing keys.
=== END FINDING ===

=== FINDING ===
id: F-030
agent: architecture-and-complexity
severity: P2
confidence: 85
file: src/proxy.ts
line: 80-113
dimension: Architecture
title: Locale extraction logic duplicated 4 times in middleware
description: |
  Same locale extraction regex and validation repeated four times. `pathname.includes(path)` checks are also fragile (substring matching).
suggestion: |
  Extract getLocalePrefix() helper. Use precise path matching.
=== END FINDING ===

=== FINDING ===
id: F-031
agent: architecture-and-complexity
severity: P2
confidence: 85
file: src/app/api/chat/vercel/route.ts
line: 77-411
dimension: Architecture
title: Vercel chat route is a 411-line god function with mixed concerns
description: |
  Single function handles auth, validation, conversation CRUD, message persistence, AI init, memory retrieval, streaming, post-stream persistence, metadata updates, memory extraction, token counting, latency tracking, and error categorization.
suggestion: |
  Extract parseMessage(), ensureConversation(), persistAssistantResponse() into composable pieces.
=== END FINDING ===

=== FINDING ===
id: F-032
agent: architecture-and-complexity
severity: P2
confidence: 85
file: src/models/Schema.ts
line: 24-45
dimension: Simplification
title: Deprecated userProfiles table still exported in schema
description: |
  Table marked "DEPRECATED: Do not use" but remains exported, participates in migrations, and occupies schema space.
suggestion: |
  Remove from Schema.ts. Generate migration to drop if no external consumers.
=== END FINDING ===

=== FINDING ===
id: F-033
agent: architecture-and-complexity
severity: P2
confidence: 90
file: src/features/dashboard
line: entire directory
dimension: Simplification
title: Entire features/dashboard directory and ProtectFallback.tsx are dead code (~170 lines)
description: |
  DashboardHeader.tsx, DashboardSection.tsx, MessageState.tsx, TitleBar.tsx, and ProtectFallback.tsx are never imported anywhere.
suggestion: |
  Delete src/features/dashboard/ and src/features/auth/ProtectFallback.tsx.
=== END FINDING ===

=== FINDING ===
id: F-034
agent: architecture-and-complexity
severity: P2
confidence: 85
file: src/libs/langfuse/client.ts
line: 42-97
dimension: Simplification
title: LangFuse client singleton module is entirely unused (~97 lines)
description: |
  Exports getLangfuseClient(), isLangfuseConfigured(), flushLangfuse() — none imported anywhere in application code.
suggestion: |
  Delete src/libs/langfuse/client.ts.
=== END FINDING ===

=== FINDING ===
id: F-035
agent: architecture-and-complexity
severity: P2
confidence: 90
file: src/libs/api/errors/validation.ts
line: 83-181
dimension: Simplification
title: Four of five validation formatters are unused outside their test file (~100 lines)
description: |
  Only formatZodErrors is used. formatZodErrorsFlat, getFirstZodError, formatFieldName, formatZodErrorsReadable are only in tests.
suggestion: |
  Remove unused formatters and their tests. Re-add when needed.
=== END FINDING ===

=== FINDING ===
id: F-036
agent: architecture-and-complexity
severity: P2
confidence: 85
file: src/libs/api/client
line: entire directory
dimension: Simplification
title: Client-side error parsing module has only one consumer (~150 lines unused)
description: |
  9 exported functions, only parseApiError actually imported (by one component).
suggestion: |
  Keep parseApiError and getErrorMessage. Remove 7 unused exports.
=== END FINDING ===

=== FINDING ===
id: F-037
agent: architecture-and-complexity
severity: P3
confidence: 85
file: src/lib/dashboard-utils.ts
line: entire file
dimension: Architecture
title: Stray lib/ directory creates confusing parallel to libs/ directory
description: |
  src/lib/ has 1 file; src/libs/ has 20+ modules. Split creates confusion about where utilities belong.
suggestion: |
  Move to src/libs/queries/dashboardUtils.ts. Delete src/lib/.
=== END FINDING ===

=== FINDING ===
id: F-038
agent: code-health
severity: P1
confidence: 98
file: src/app/api/chat/vercel/route.ts
line: 1-76
dimension: AI Slop Detection
title: 76-line module-level JSDoc and AC# comments throughout production routes
description: |
  Both chat routes contain dense acceptance-criteria references ("// AC #2:", "// AC #4 & #5:") and multi-page module docblocks. These are ticket-tracking artifacts that were never cleaned up.
suggestion: |
  Remove all "// AC #N:" comments. Keep single-sentence function descriptions only.
=== END FINDING ===

=== FINDING ===
id: F-039
agent: code-health
severity: P1
confidence: 95
file: src/libs/mem0/client.ts
line: 1-25
dimension: AI Slop Detection
title: Redundant module-level docblock headers on trivial config/client files
description: |
  Every file in /libs/mem0/ and /libs/langfuse/ opens with 15-25 line docblocks covering "Graceful Degradation", "Usage", "Flow", etc. For config files, the docblock is longer than the implementation.
suggestion: |
  Collapse to single-sentence @module description or remove entirely.
=== END FINDING ===

=== FINDING ===
id: F-040
agent: code-health
severity: P1
confidence: 96
file: src/libs/api/errors/responses.ts
line: 1-50
dimension: AI Slop Detection
title: Over-documented trivial error-response builder functions
description: |
  One-line functions like isValidationError() have 14-line docblocks. formatZodErrors (14 lines of code) has a 45-line docblock.
suggestion: |
  Reduce to function signature + one-sentence description.
=== END FINDING ===

=== FINDING ===
id: F-041
agent: code-health
severity: P1
confidence: 96
file: src/libs/mem0/client.ts
line: 64-73
dimension: AI Slop Detection
title: isMem0Enabled() is a redundant pass-through wrapper
description: |
  One-liner calling isEnabled() from config with a 7-line JSDoc. Same pattern in langfuse/client.ts with isLangfuseConfigured().
suggestion: |
  Remove wrappers. Export isEnabled()/isConfigured() directly from config.
=== END FINDING ===

=== FINDING ===
id: F-042
agent: code-health
severity: P2
confidence: 91
file: Multiple files
line: various
dimension: AI Slop Detection
title: 40+ production files use console.error instead of structured logger
description: |
  Project has configured Pino/Logtail logger but 40+ files use bare console.error(). Missing structured JSON output, log levels, and Sentry integration.
suggestion: |
  Replace all production console.error/console.warn with logger.error() from @/libs/Logger.
=== END FINDING ===

=== FINDING ===
id: F-043
agent: code-health
severity: P2
confidence: 90
file: src/libs/email/mockEmailService.ts
line: 1-45
dimension: AI Slop Detection
title: Stale TODO stub referencing "Epic 4" that was already implemented
description: |
  Two TODO comments reference "Epic 4" for Resend integration — but the full email system already exists. Misleads developers.
suggestion: |
  Update or remove stale TODOs. Clarify the mock is intentional for admin UI testing.
=== END FINDING ===

=== FINDING ===
id: F-044
agent: code-health
severity: P2
confidence: 88
file: src/app/[locale]/(unauth)/share/[token]/page.tsx
line: 103-153
dimension: AI Slop Detection
title: Placeholder UI content shipped to end users in share link viewer
description: |
  "This is a template placeholder. In your implementation, fetch and display the actual resource content here." is visible to real users.
suggestion: |
  Implement actual rendering or gate the feature so users can't see scaffolding text.
=== END FINDING ===

=== FINDING ===
id: F-045
agent: code-health
severity: P2
confidence: 95
file: package.json
line: 75
dimension: Dependency Health
title: Next.js has 3 HIGH severity DoS vulnerabilities with a fix available
description: |
  Installed Next.js version falls in vulnerable range covering 3 CVEs (Image Optimizer, RSC deserialization, PPR Resume Endpoint DoS). Fix available via npm audit fix.
suggestion: |
  Run `npm audit fix` to upgrade Next.js to patched version.
=== END FINDING ===

=== FINDING ===
id: F-046
agent: code-health
severity: P2
confidence: 93
file: package.json
line: 74
dimension: Dependency Health
title: mem0ai depends on vulnerable axios version (prototype pollution DoS)
description: |
  mem0ai >=2.0.0 depends on axios with GHSA-43fc-jf86-j433 (DoS via __proto__ key). No non-breaking fix exists.
suggestion: |
  Pin mem0ai to 1.0.39, track upstream fix, or replace with fork using patched axios.
=== END FINDING ===

=== FINDING ===
id: F-047
agent: code-health
severity: P2
confidence: 90
file: package.json
line: 37
dimension: Dependency Health
title: @logtail/pino has HIGH severity vulnerability with no fix available
description: |
  @logtail/pino → @logtail/node → minimatch (ReDoS). Production logging dependency with no upstream fix.
suggestion: |
  Consider alternative BetterStack SDK or direct HTTP Pino transport.
=== END FINDING ===

=== FINDING ===
id: F-048
agent: code-health
severity: P3
confidence: 85
file: package.json
line: 32-34
dimension: Dependency Health
title: @assistant-ui/react-devtools shipped in production dependencies
description: |
  DevTools library in production deps, imported without environment guard, adds bundle size.
suggestion: |
  Move to devDependencies. Guard import with NODE_ENV check.
=== END FINDING ===

=== FINDING ===
id: F-049
agent: code-health
severity: P3
confidence: 82
file: package.json
line: 68
dimension: Dependency Health
title: Two markdown rendering libraries serve overlapping purposes
description: |
  Both react-markdown and @assistant-ui/react-markdown in production. May be redundant.
suggestion: |
  Audit usage. Remove react-markdown if @assistant-ui/react-markdown covers all cases.
=== END FINDING ===

=== FINDING ===
id: F-050
agent: test-strategy-analyst
severity: P1
confidence: 95
file: src/app/api/chat/vercel/route.ts
line: 1-411
dimension: Test Coverage
title: Vercel AI SDK chat route (411 LOC) has zero test coverage
description: |
  Critical path handling AI streaming, conversation creation, message persistence, memory integration, error handling — no tests.
suggestion: |
  Create integration tests mirroring tests/integration/api/chat.test.ts pattern.
=== END FINDING ===

=== FINDING ===
id: F-051
agent: test-strategy-analyst
severity: P1
confidence: 95
file: src/app/api/auth/callback/route.ts
line: 1-75
dimension: Test Coverage
title: Auth callback route (OAuth + email verification) has zero test coverage
description: |
  Security-critical path converting auth codes to sessions, detecting new users, triggering welcome emails. No tests.
suggestion: |
  Create tests for code exchange, new-user detection, redirect safety.
=== END FINDING ===

=== FINDING ===
id: F-052
agent: test-strategy-analyst
severity: P1
confidence: 92
file: src/proxy.ts
line: 1-126
dimension: Test Coverage
title: Middleware (auth/route protection, admin gating) has zero test coverage
description: |
  Central gatekeeper for all route protection, admin authorization, email verification — no tests for any of 5 security behaviors.
suggestion: |
  Create proxy.test.ts testing protected routes, API 401s, admin gating, email verification.
=== END FINDING ===

=== FINDING ===
id: F-053
agent: test-strategy-analyst
severity: P1
confidence: 90
file: src/app/api/profile/delete/route.ts
line: 1-92
dimension: Test Coverage
title: Account deletion API route has zero test coverage
description: |
  Irreversible destructive operation (permanent user deletion) with no test coverage.
suggestion: |
  Create tests for auth, service role check, Supabase admin deleteUser flow.
=== END FINDING ===

=== FINDING ===
id: F-054
agent: test-strategy-analyst
severity: P2
confidence: 95
file: tests/integration/api/thread-persistence.test.ts
line: 159-452
dimension: Test Coverage
title: 8 instances of setTimeout-based async waits create flaky tests
description: |
  Hardcoded delays (100ms-1000ms) for fire-and-forget operations are inherently flaky.
suggestion: |
  Replace with vi.waitFor() polling pattern or refactor production code to return promises.
=== END FINDING ===

=== FINDING ===
id: F-055
agent: test-strategy-analyst
severity: P2
confidence: 92
file: src/app/api/chat/vercel/conversations/route.ts
line: 1
dimension: Test Coverage
title: Vercel conversation CRUD API routes have zero test coverage
description: |
  Data mutation endpoints with auth checks and ownership verification — zero tests. Dify threads have comprehensive tests but parallel Vercel implementation does not.
suggestion: |
  Create tests following tests/integration/api/threads.test.ts pattern.
=== END FINDING ===

=== FINDING ===
id: F-056
agent: test-strategy-analyst
severity: P2
confidence: 85
file: .github/workflows/CI.yml
line: 149
dimension: Test Efficiency
title: CI installs Firefox browsers despite Playwright config only using Chromium
description: |
  CI downloads ~200MB Firefox unnecessarily, wasting ~30s per run.
suggestion: |
  Change to `npx playwright install --with-deps chromium` only.
=== END FINDING ===

=== FINDING ===
id: F-057
agent: test-strategy-analyst
severity: P2
confidence: 88
file: tests/integration/api/threads.test.ts
line: 438-457
dimension: Test Efficiency
title: Placeholder test with always-pass assertion expect(true).toBe(true)
description: |
  "AC #11: Happy Path Integration" test always passes regardless of code changes.
suggestion: |
  Delete or implement actual integration workflow test.
=== END FINDING ===

=== FINDING ===
id: F-058
agent: test-strategy-analyst
severity: P2
confidence: 85
file: tests/integration/dify-events.test.ts
line: 1-262
dimension: Test Efficiency
title: 262-line test validates TypeScript types at runtime with no production code under test
description: |
  Tests verify JS object assignment and JSON.parse, not production code. TypeScript compilation already validates types.
suggestion: |
  Delete or replace with tests exercising actual SSE parsing production code.
=== END FINDING ===

=== FINDING ===
id: F-059
agent: test-strategy-analyst
severity: P3
confidence: 90
file: src/components/ui/__tests__/skeleton.test.tsx
line: 1-145
dimension: Test Efficiency
title: UI component tests assert CSS class names across ~470 LOC total (skeleton, spinner, loading-card)
description: |
  Skeleton (145 LOC), Spinner (157 LOC), LoadingCard (168 LOC) tests primarily assert Tailwind class names. Tightly coupled to implementation, will break on styling refactors.
suggestion: |
  Reduce to 2-3 tests per component: renders, applies custom className, passes HTML attributes.
=== END FINDING ===

=== FINDING ===
id: F-060
agent: test-strategy-analyst
severity: P3
confidence: 85
file: tests/desk-check-6.1.spec.ts.bak
line: 1-109
dimension: Test Efficiency
title: Orphaned .bak test file not matched by any test runner
description: |
  109-line Playwright test renamed with .bak extension, never executes.
suggestion: |
  Delete tests/desk-check-6.1.spec.ts.bak.
=== END FINDING ===

=== FINDING ===
id: F-061
agent: type-design-analyzer
severity: P1
confidence: 95
file: src/libs/queries/vercelConversations.ts
line: 51, 97, 147, 214, 267
dimension: Type Design
title: Error return type is `any` throughout all DB query functions
description: |
  Every function returns `Promise<{ data: T | null; error: any }>`. Callers access error.code, error.message without any type checking.
suggestion: |
  Define `DbQueryError = { code?: string; message: string; detail?: string }` and use throughout.
=== END FINDING ===

=== FINDING ===
id: F-062
agent: type-design-analyzer
severity: P1
confidence: 92
file: src/app/api/chat/vercel/route.ts
line: 111, 114, 226, 229
dimension: Type Design
title: Inline `any` annotations on message/part arrays bypass type-checking of AI SDK request body
description: |
  Parsed body.messages iterated with `(m: any)` and `(p: any)` four times. No validation means malformed payloads produce empty messages silently.
suggestion: |
  Define Zod schema for request formats. Remove all `(m: any)` annotations.
=== END FINDING ===

=== FINDING ===
id: F-063
agent: type-design-analyzer
severity: P1
confidence: 90
file: src/app/api/chat/vercel/route.ts
line: 363, 344, 352
dimension: Type Design
title: catch blocks typed as `any` access .code, .status, .message unsafely
description: |
  `catch (error: any)` then accesses properties directly. Non-Error throws produce undefined comparisons that silently fall through.
suggestion: |
  Use `catch (error: unknown)` and narrow with instanceof Error.
=== END FINDING ===

=== FINDING ===
id: F-064
agent: type-design-analyzer
severity: P1
confidence: 88
file: src/libs/dify/types.ts
line: 27-28, 75-80
dimension: Type Design
title: Multiple `any` fields in Dify API types propagate unsafety through chat flow
description: |
  annotation_reply, retriever_resources, message_files, feedback, agent_thoughts, message_metadata all typed `any` or `any[]`.
suggestion: |
  Replace with `unknown` or define structural types from Dify API docs.
=== END FINDING ===

=== FINDING ===
id: F-065
agent: type-design-analyzer
severity: P2
confidence: 95
file: src/libs/api/admin/analytics.ts
line: 7-11
dimension: Type Design
title: TrendData type defined three times with incompatible shapes
description: |
  TrendData in analytics.ts has `value: string`, in calculateTrend.ts has `isPositive: boolean`, in AnalyticsMetricCard.tsx has `value: string`. Structurally incompatible.
suggestion: |
  Consolidate to single canonical TrendData. Delete duplicates.
=== END FINDING ===

=== FINDING ===
id: F-066
agent: type-design-analyzer
severity: P2
confidence: 92
file: src/libs/queries/memoryJobs.ts
line: 29, 151
dimension: Type Design
title: MemoryJob.status typed as string despite four known literal values
description: |
  Status should be 'pending' | 'processing' | 'completed' | 'failed'. TypeScript can't warn if caller passes 'done'.
suggestion: |
  Define MemoryJobStatus union type.
=== END FINDING ===

=== FINDING ===
id: F-067
agent: type-design-analyzer
severity: P2
confidence: 90
file: src/libs/queries/vercelMessages.ts
line: 23
dimension: Type Design
title: VercelMessage.role typed as string when MessageRole union exists
description: |
  Requires unsafe `as 'user' | 'assistant' | 'system'` casts at multiple callsites.
suggestion: |
  Change to MessageRole type from @/libs/vercel-ai/types.
=== END FINDING ===

=== FINDING ===
id: F-068
agent: type-design-analyzer
severity: P2
confidence: 87
file: src/app/api/chat/vercel/route.ts
line: 383, 396
dimension: Type Design
title: TIMEOUT and RATE_LIMIT error codes not in ApiErrorCode union
description: |
  Route uses literal string codes outside the typed union. Client-side handlers silently fall through.
suggestion: |
  Add TIMEOUT and RATE_LIMIT to ApiErrorCode. Use createErrorResponse().
=== END FINDING ===

=== FINDING ===
id: F-069
agent: type-design-analyzer
severity: P2
confidence: 88
file: src/app/api/chat/route.ts
line: 47
dimension: Type Design
title: parseSSEEvent returns Record<string, any> instead of DifyStreamEvent
description: |
  All property accesses on parsed events are untyped despite DifyStreamEvent being well-defined.
suggestion: |
  Change return type to DifyStreamEvent | null.
=== END FINDING ===

=== FINDING ===
id: F-070
agent: type-design-analyzer
severity: P2
confidence: 90
file: src/libs/api/errors/responses.ts
line: 114
dimension: Type Design
title: validationError() parameter typed as `any`, nullifying type safety
description: |
  Called with Zod arrays, formatted maps, and raw strings. Client-side then casts to Record<string, string[]>.
suggestion: |
  Define ValidationDetails = Record<string, string[]>. Use throughout chain.
=== END FINDING ===

=== FINDING ===
id: F-071
agent: data-layer-reviewer
severity: P1
confidence: 90
file: src/app/api/share/[token]/route.ts
line: 61-68
dimension: Data Layer & Database
title: Race condition on accessCount increment (read-then-write)
description: |
  Share link counter reads current value, increments in JS, writes back. Concurrent requests lose updates.
suggestion: |
  Use SQL atomic increment: `sql\`${shareableLinks.accessCount} + 1\``.
=== END FINDING ===

=== FINDING ===
id: F-072
agent: data-layer-reviewer
severity: P1
confidence: 90
file: src/models/Schema.ts
line: 50-77
dimension: Data Layer & Database
title: Missing foreign key constraints on inter-table relationships
description: |
  mem0Memories.conversationId and memoryExtractionJobs.conversationId have no FK to vercelConversations.id. Orphaned records accumulate on deletion.
suggestion: |
  Add FK references with onDelete cascade/set null.
=== END FINDING ===

=== FINDING ===
id: F-074
agent: data-layer-reviewer
severity: P2
confidence: 92
file: src/app/api/profile/update-username/route.ts
line: 50-88
dimension: Data Layer & Database
title: TOCTOU race condition in username uniqueness check
description: |
  Check-then-write for username. UNIQUE constraint provides safety net but constraint violation falls through to generic 500.
suggestion: |
  Catch constraint violation error (code 23505) and return 409. Or use onConflictDoNothing().
=== END FINDING ===

=== FINDING ===
id: F-075
agent: data-layer-reviewer
severity: P2
confidence: 90
file: src/app/api/chat/vercel/route.ts
line: 196-360
dimension: Data Layer & Database
title: Multi-step chat mutation without transaction wrapping
description: |
  Conversation creation + user message persistence not wrapped in transaction. Partial failure creates orphaned conversations.
suggestion: |
  Wrap steps 1 and 2 in db.transaction().
=== END FINDING ===

=== FINDING ===
id: F-076
agent: data-layer-reviewer
severity: P2
confidence: 88
file: src/app/[locale]/(auth)/dashboard/page.tsx
line: 23-36
dimension: Data Layer & Database
title: Race condition on user preferences auto-creation
description: |
  Check-then-insert on every dashboard load. Two simultaneous tabs cause UNIQUE constraint violation → 500 error.
suggestion: |
  Use .onConflictDoNothing({ target: userPreferences.userId }).
=== END FINDING ===

=== FINDING ===
id: F-078
agent: data-layer-reviewer
severity: P2
confidence: 82
file: src/libs/queries/vercelConversations.ts
line: 47-67
dimension: Data Layer & Database
title: Optional userId parameter creates authorization bypass risk
description: |
  getConversationById, updateConversation, deleteConversation accept optional userId. Omission bypasses ownership filtering.
suggestion: |
  Make userId required. Create separate admin functions if needed.
=== END FINDING ===

=== FINDING ===
id: F-079
agent: data-layer-reviewer
severity: P3
confidence: 90
file: src/models/Schema.ts
line: 197-198
dimension: Data Layer & Database
title: Redundant btree index on columns with UNIQUE constraint
description: |
  shareableLinks.token and threads.conversationId have both UNIQUE constraint and explicit btree index. PostgreSQL UNIQUE already creates an index.
suggestion: |
  Remove redundant explicit indexes.
=== END FINDING ===

=== FINDING ===
id: F-080
agent: api-contract-reviewer
severity: P1
confidence: 98
file: src/app/api/profile/update/route.ts
line: 15-86
dimension: API Contracts & Interface Consistency
title: Profile update endpoint bypasses shared error infrastructure
description: |
  Returns raw `{ error: string }` without code field, diverging from ApiErrorResponse `{ error, code, details? }` used everywhere else.
suggestion: |
  Refactor to use unauthorizedError(), invalidRequestError(), conflictError(), internalError().
=== END FINDING ===

=== FINDING ===
id: F-081
agent: api-contract-reviewer
severity: P1
confidence: 97
file: src/app/api/chat/vercel/route.ts
line: 172
dimension: API Contracts & Interface Consistency
title: "Conversation not found" returns 400 instead of 404
description: |
  Uses invalidRequestError() for a missing resource. Every other not-found case uses notFoundError() → 404.
suggestion: |
  Replace with notFoundError('Conversation').
=== END FINDING ===

=== FINDING ===
id: F-082
agent: api-contract-reviewer
severity: P1
confidence: 96
file: src/app/api/share/route.ts
line: 62-90
dimension: API Contracts & Interface Consistency
title: Share API endpoints bypass shared error infrastructure entirely
description: |
  Both POST and GET use plain NextResponse.json() without code field or Sentry capture. No logApiError() calls.
suggestion: |
  Replace with shared helpers. Add logApiError()/Sentry.captureException().
=== END FINDING ===

=== FINDING ===
id: F-083
agent: api-contract-reviewer
severity: P1
confidence: 95
file: src/app/api/profile/update-preferences/route.ts
line: 80-85
dimension: API Contracts & Interface Consistency
title: Undocumented error codes SAVE_FAILED and USERNAME_TAKEN not in ApiErrorCode union
description: |
  Routes use custom error codes not defined in the ApiErrorCode type. Clients receiving these can't match them.
suggestion: |
  Add to ApiErrorCode or map to existing codes.
=== END FINDING ===

=== FINDING ===
id: F-085
agent: api-contract-reviewer
severity: P2
confidence: 95
file: src/app/api/chat/messages/route.ts
line: 32-35
dimension: API Contracts & Interface Consistency
title: Query parameter naming inconsistency: snake_case conversation_id vs camelCase
description: |
  GET /api/chat/messages uses conversation_id (snake_case). Every other endpoint uses camelCase.
suggestion: |
  Rename to conversationId for consistency.
=== END FINDING ===

=== FINDING ===
id: F-086
agent: api-contract-reviewer
severity: P2
confidence: 94
file: src/app/api/threads/route.ts
line: 62-64
dimension: API Contracts & Interface Consistency
title: Collection metadata field named inconsistently: "count" vs "total"
description: |
  /threads returns { count }, /conversations returns { total }. Neither reflects true collection size.
suggestion: |
  Standardize field name. Return actual total count for pagination.
=== END FINDING ===

=== FINDING ===
id: F-087
agent: api-contract-reviewer
severity: P2
confidence: 92
file: src/app/api/profile/delete/route.ts
line: 78-81
dimension: API Contracts & Interface Consistency
title: DELETE profile returns 200 with body instead of 204 No Content
description: |
  Returns { message: 'Account deleted successfully' }. Other deletes return 204 No Content.
suggestion: |
  Return new Response(null, { status: 204 }) for consistency.
=== END FINDING ===

=== FINDING ===
id: F-088
agent: api-contract-reviewer
severity: P2
confidence: 91
file: src/app/api/share/[token]/route.ts
line: 141
dimension: API Contracts & Interface Consistency
title: notFoundError() called with full message producing doubled "not found"
description: |
  `notFoundError('Share link not found')` produces "Share link not found not found".
suggestion: |
  Change to notFoundError('Share link').
=== END FINDING ===

=== FINDING ===
id: F-089
agent: api-contract-reviewer
severity: P2
confidence: 90
file: src/app/api/email/welcome/route.ts
line: 24
dimension: API Contracts & Interface Consistency
title: Multiple endpoints bypass shared error infrastructure, skipping Sentry
description: |
  /email/welcome, /admin/analytics, /cron/memory-extraction, all admin feedback routes return raw { error } without code field or logApiError().
suggestion: |
  Apply shared error helpers and logApiError() across all routes.
=== END FINDING ===

=== FINDING ===
id: F-090
agent: seo-accessibility-auditor
severity: P1
confidence: 98
file: src/features/landing/CenteredHero.tsx
line: 10-12
dimension: SEO & Accessibility
title: Hero title rendered as div instead of h1
description: |
  Landing page has no h1. Violates WCAG 2.4.6 and harms search ranking.
suggestion: |
  Change div to h1. Update Section.tsx to use h2 for section titles.
=== END FINDING ===

=== FINDING ===
id: F-091
agent: seo-accessibility-auditor
severity: P1
confidence: 97
file: src/templates/Footer.tsx
line: 20-74
dimension: SEO & Accessibility
title: Footer social icon links have no accessible text (WCAG 2.4.4)
description: |
  Seven SVG-only links with no aria-label, aria-hidden, or title element.
suggestion: |
  Add aria-label per link ("Follow us on GitHub"). Add aria-hidden="true" on SVGs.
=== END FINDING ===

=== FINDING ===
id: F-092
agent: seo-accessibility-auditor
severity: P1
confidence: 96
file: src/features/landing/CenteredMenu.tsx
line: 21-45
dimension: SEO & Accessibility
title: Landing page navbar missing nav landmark and logo has no accessible label
description: |
  No <header> or <nav> wrapping. Logo link has no aria-label. Mobile toggle lacks accessible label.
suggestion: |
  Wrap in <header>/<nav aria-label="Main navigation">. Add aria-label to logo link.
=== END FINDING ===

=== FINDING ===
id: F-093
agent: seo-accessibility-auditor
severity: P1
confidence: 95
file: src/app/[locale]/(unauth)/(center)/sign-up/page.tsx
line: 227-259
dimension: SEO & Accessibility
title: Form validation errors not associated with inputs via aria-describedby (WCAG 1.3.1, 3.3.1)
description: |
  aria-invalid is set but no aria-describedby links error messages to inputs. Pattern repeated across all auth forms.
suggestion: |
  Add id to error paragraphs and aria-describedby on inputs.
=== END FINDING ===

=== FINDING ===
id: F-094
agent: seo-accessibility-auditor
severity: P1
confidence: 93
file: src/components/layout/MainAppShell.tsx
line: 276-286
dimension: SEO & Accessibility
title: Mobile header h1 "VT SaaS Template" creates duplicate h1 on every authenticated page
description: |
  Every page using MainAppShell has this persistent h1 conflicting with page-specific h1s.
suggestion: |
  Change h1 to span.
=== END FINDING ===

=== FINDING ===
id: F-095
agent: seo-accessibility-auditor
severity: P1
confidence: 92
file: src/components/ui/toast.tsx
line: 65-78
dimension: SEO & Accessibility
title: Toast close button has no accessible label (WCAG 4.1.2)
description: |
  ToastClose renders X icon with no aria-label or visually hidden text.
suggestion: |
  Add aria-label="Dismiss notification".
=== END FINDING ===

=== FINDING ===
id: F-096
agent: seo-accessibility-auditor
severity: P1
confidence: 91
file: src/app/[locale]/layout.tsx
line: 19-73
dimension: SEO & Accessibility
title: Root layout missing canonical URL tag for homepage
description: |
  No alternates.canonical set. Search engines may index prefixed and unprefixed versions as separate pages.
suggestion: |
  Add canonical URL in generateMetadata.
=== END FINDING ===

=== FINDING ===
id: F-097
agent: seo-accessibility-auditor
severity: P2
confidence: 95
file: src/styles/global.css
line: 40-58
dimension: SEO & Accessibility
title: Animations lack prefers-reduced-motion media query (WCAG 2.3.3)
description: |
  Accordion animations and transition-all usages throughout have no motion-reduce guards.
suggestion: |
  Add @media (prefers-reduced-motion: reduce) overrides in global.css.
=== END FINDING ===

=== FINDING ===
id: F-098
agent: seo-accessibility-auditor
severity: P2
confidence: 93
file: src/components/ui/password-input.tsx
line: 24-37
dimension: SEO & Accessibility
title: Password reveal button uses tabIndex=-1, unreachable by keyboard (WCAG 2.1.1)
description: |
  Keyboard-only users cannot toggle password visibility.
suggestion: |
  Remove tabIndex={-1}.
=== END FINDING ===

=== FINDING ===
id: F-099
agent: seo-accessibility-auditor
severity: P2
confidence: 91
file: src/components/layout/MainAppShell.tsx
line: 276-286
dimension: SEO & Accessibility
title: Missing skip-to-main-content link (WCAG 2.4.1)
description: |
  No skip navigation link anywhere in the application. Keyboard users must tab through entire sidebar.
suggestion: |
  Add visually-hidden skip link as first child of body. Add id="main-content" to main element.
=== END FINDING ===

=== FINDING ===
id: F-100
agent: seo-accessibility-auditor
severity: P2
confidence: 89
file: src/components/pseo/Breadcrumbs.tsx
line: 36-43
dimension: SEO & Accessibility
title: BreadcrumbList structured data uses undefined NEXT_PUBLIC_APP_URL
description: |
  Uses NEXT_PUBLIC_APP_URL which is not set. Project uses NEXT_PUBLIC_SITE_URL. Generates invalid schema.org URLs.
suggestion: |
  Replace with getSiteUrl() from @/libs/seo/config.
=== END FINDING ===

=== FINDING ===
id: F-101
agent: documentation-health
severity: P1
confidence: 100
file: README.md
line: 7, 16, 21, 184
dimension: Documentation Health
title: README references Next.js 14 throughout; project is on Next.js 16
description: |
  Four occurrences of "Next.js 14" in README. Actual version is 16.1.6.
suggestion: |
  Replace all "Next.js 14" with "Next.js 16".
=== END FINDING ===

=== FINDING ===
id: F-102
agent: documentation-health
severity: P1
confidence: 100
file: CLAUDE.md
line: 28, 32, 231
dimension: Documentation Health
title: CLAUDE.md references src/middleware.ts which does not exist; actual file is src/proxy.ts
description: |
  Three references to non-existent src/middleware.ts. Developers following "Adding a New Protected Route" will look for a file that doesn't exist.
suggestion: |
  Replace all references to src/middleware.ts with src/proxy.ts.
=== END FINDING ===

=== FINDING ===
id: F-103
agent: documentation-health
severity: P1
confidence: 100
file: README.md
line: 117-122
dimension: Documentation Health
title: Quick Rebrand Checklist references tailwind.config.js which no longer exists (Tailwind v4)
description: |
  After Tailwind v3→v4 migration, tailwind.config.js was removed. README also references src/app/globals.css instead of actual src/styles/global.css.
suggestion: |
  Update to reflect Tailwind v4's CSS-based config. Fix globals.css path.
=== END FINDING ===

=== FINDING ===
id: F-104
agent: documentation-health
severity: P2
confidence: 98
file: README.md
line: 192-204
dimension: Documentation Health
title: README env var section omits 12+ variables defined in Env.ts
description: |
  Lists only 7 of 24+ variables. LangFuse, Mem0, PostHog, CRON_SECRET, email config, Sentry all missing.
suggestion: |
  Reference .env.example directly. Expand env vars section.
=== END FINDING ===

=== FINDING ===
id: F-105
agent: documentation-health
severity: P2
confidence: 90
file: docs/development-guide.md
line: 24
dimension: Documentation Health
title: README installation differs from development-guide.md (inconsistent onboarding)
description: |
  dev-guide says `cp .env.example .env.local`. README says manually create. Users get incomplete env without .env.example.
suggestion: |
  Update README to reference .env.example.
=== END FINDING ===
