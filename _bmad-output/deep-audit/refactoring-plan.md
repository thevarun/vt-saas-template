=== THEME ===
id: T-001
name: Centralize API Auth and Error Infrastructure
effort: L
risk: MEDIUM
finding_ids: F-009, F-028, F-007, F-008, F-010, F-042, F-080, F-082, F-083, F-089, F-068, F-070
dependencies: None
coverage_gate: REQUIRED
blast_radius: WIDE
warnings: Large blast radius — consider splitting into sub-themes
phase: 2
summary: |
  21+ API routes duplicate auth boilerplate and bypass the shared error infrastructure, leading to inconsistent error responses (missing code field, leaked internals, missing Sentry capture). F-028 shows 11 admin routes copy-paste identical auth checks. F-080, F-082, F-089 show routes returning raw {error} without the ApiErrorResponse contract. F-007 and F-008 leak Supabase/Resend error messages. F-042 reveals 40+ files using console.error instead of the structured logger. F-068 and F-083 show error codes outside the ApiErrorCode union.
steps: |
  1. Write characterization tests for 5 representative API routes (admin user, feedback archive, profile update, share, email/welcome) verifying current error response shapes
  2. Extract withAuth() HOF that handles Supabase session validation and returns typed user object
  3. Extract withAdminAuth() HOF that composes withAuth() with admin check
  4. Add TIMEOUT, RATE_LIMIT, SAVE_FAILED, USERNAME_TAKEN to ApiErrorCode union type
  5. Define ValidationDetails type (Record<string, string[]>) and update validationError() parameter
  6. Refactor profile/update route to use shared error helpers (unauthorizedError, validationError, internalError)
  7. Refactor share API routes to use shared error helpers and logApiError()
  8. Refactor email/welcome, admin/analytics, cron/memory-extraction routes to use shared error helpers
  9. Refactor all admin routes to use withAdminAuth() HOF
  10. Replace console.error/console.warn with logger.error()/logger.warn() across all production files (batch by directory)
  11. Sanitize error messages in admin routes — use generic messages for client, log details server-side
files: |
  - src/libs/api/errors/responses.ts
  - src/libs/api/errors/validation.ts
  - src/libs/api/errors/types.ts
  - src/libs/api/errors/index.ts
  - src/app/api/admin/users/[userId]/route.ts
  - src/app/api/admin/feedback/[id]/archive/route.ts
  - src/app/api/admin/feedback/[id]/delete/route.ts
  - src/app/api/admin/feedback/[id]/mark-reviewed/route.ts
  - src/app/api/admin/feedback/bulk/route.ts
  - src/app/api/admin/feedback/export/route.ts
  - src/app/api/admin/analytics/route.ts
  - src/app/api/admin/email/route.ts
  - src/app/api/profile/update/route.ts
  - src/app/api/profile/update-preferences/route.ts
  - src/app/api/profile/delete/route.ts
  - src/app/api/share/route.ts
  - src/app/api/share/[token]/route.ts
  - src/app/api/email/welcome/route.ts
  - src/app/api/cron/memory-extraction/route.ts
  - src/app/api/feedback/route.ts
  - src/proxy.ts
  - src/libs/Logger.ts
  - 40+ files with console.error (batched replacement)
tests_before: |
  Characterization tests for current error response shapes across 5 representative routes
tests_after: |
  - Unit tests for withAuth() and withAdminAuth() HOFs
  - Integration tests verifying all admin routes return ApiErrorResponse format
  - Test that logger.error is called instead of console.error in error paths
=== END THEME ===

=== THEME ===
id: T-002
name: Harden Security Vulnerabilities in API Layer
effort: M
risk: MEDIUM
finding_ids: F-001, F-002, F-003, F-004, F-005, F-006, F-011, F-012
dependencies: None
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: None
phase: 2
summary: |
  Eight security findings across the API layer. F-001 is a P1 where profile update calls admin listUsers via anon-key client. F-002 shows missing Zod validation on displayName. F-003 exposes the feedback endpoint to abuse with no rate limiting. F-004 reveals admin check uses user-writable user_metadata instead of app_metadata. F-005/F-006 show missing input validation on conversation_id and feedback IDs. F-011 and F-012 are lower-severity but address timing-safe comparison and message role sanitization.
steps: |
  1. Write tests for profile update route covering listUsers bypass, displayName validation, and expected error responses
  2. Replace admin listUsers() call in profile/update with DB query against userPreferences table
  3. Add Zod schema validation for displayName (type, length, character restrictions) in profile/update
  4. Switch isAdmin() from user_metadata to app_metadata; update admin setup documentation
  5. Add conversation_id regex validation to GET /api/chat/messages (matching POST pattern)
  6. Add isValidUuid() check to admin feedback archive, delete, and mark-reviewed routes
  7. Implement IP-based rate limiting for /api/feedback (5 submissions/hour)
  8. Use crypto.timingSafeEqual() for cron secret comparison
  9. Filter message roles to only allow 'user' and 'assistant' before passing to AI model in vercel chat route
files: |
  - src/app/api/profile/update/route.ts
  - src/libs/auth/isAdmin.ts
  - src/app/api/chat/messages/route.ts
  - src/app/api/admin/feedback/[id]/archive/route.ts
  - src/app/api/admin/feedback/[id]/delete/route.ts
  - src/app/api/admin/feedback/[id]/mark-reviewed/route.ts
  - src/app/api/feedback/route.ts
  - src/app/api/cron/memory-extraction/route.ts
  - src/app/api/chat/vercel/route.ts
tests_before: |
  Tests for profile update route, admin auth flow, feedback submission
tests_after: |
  - Test profile update rejects invalid displayName values
  - Test admin check fails when user_metadata.isAdmin is set but app_metadata is not
  - Test rate limiting on feedback endpoint
  - Test message role filtering rejects 'system' role
=== END THEME ===

=== THEME ===
id: T-003
name: Remove Dead Code and Stale Artifacts
effort: S
risk: LOW
finding_ids: F-032, F-033, F-034, F-035, F-036, F-037, F-043, F-048, F-049, F-057, F-058, F-060
dependencies: None
coverage_gate: ADEQUATE
blast_radius: CONTAINED
warnings: None
phase: 1
summary: |
  Twelve findings identify dead code, unused exports, stale artifacts, and orphaned files totaling ~800+ lines. F-032 is a deprecated userProfiles table still exported. F-033 is an entire dead features/dashboard directory (~170 lines). F-034 is the unused LangFuse client singleton. F-035 has four unused validation formatters. F-036 has 7 unused client error parsing exports. F-057/F-058/F-060 are test artifacts (placeholder test, runtime type-check test, .bak file). F-043 has stale TODO referencing completed epic. F-048 ships devtools in production deps. F-049 identifies duplicate markdown libraries.
steps: |
  1. Delete src/features/dashboard/ directory and src/features/auth/ProtectFallback.tsx
  2. Delete src/libs/langfuse/client.ts
  3. Remove deprecated userProfiles table from Schema.ts (generate migration to drop table)
  4. Remove unused validation formatters (formatZodErrorsFlat, getFirstZodError, formatFieldName, formatZodErrorsReadable) and their tests
  5. Remove 7 unused exports from src/libs/api/client (keep parseApiError, getErrorMessage)
  6. Move src/lib/dashboard-utils.ts to src/libs/queries/dashboardUtils.ts, delete src/lib/
  7. Update stale TODO in mockEmailService.ts — clarify mock is intentional for dev mode
  8. Move @assistant-ui/react-devtools to devDependencies, guard import with NODE_ENV check
  9. Audit react-markdown vs @assistant-ui/react-markdown usage; remove redundant package if confirmed
  10. Delete tests/desk-check-6.1.spec.ts.bak
  11. Delete placeholder test in threads.test.ts (AC #11 always-pass)
  12. Delete or replace dify-events.test.ts runtime type-check test with actual SSE parsing tests
files: |
  - src/features/dashboard/
  - src/features/auth/ProtectFallback.tsx
  - src/libs/langfuse/client.ts
  - src/models/Schema.ts
  - src/libs/api/errors/validation.ts
  - src/libs/api/client/
  - src/lib/dashboard-utils.ts
  - src/libs/email/mockEmailService.ts
  - package.json
  - tests/desk-check-6.1.spec.ts.bak
  - tests/integration/api/threads.test.ts
  - tests/integration/dify-events.test.ts
tests_before: |
  Run existing test suite to confirm passing baseline before deletions
tests_after: |
  - Verify build succeeds after all deletions
  - Verify no import errors in remaining code
=== END THEME ===

=== THEME ===
id: T-004
name: Clean Up AI-Generated Comment Bloat
effort: S
risk: LOW
finding_ids: F-038, F-039, F-040, F-041
dependencies: None
coverage_gate: ADEQUATE
blast_radius: CONTAINED
warnings: None
phase: 1
summary: |
  Four P1 AI slop findings: 76-line module-level docblocks in chat routes (F-038), 15-25 line docblocks on trivial config files (F-039), over-documented one-liner functions (F-040), and redundant pass-through wrappers like isMem0Enabled() (F-041). These obscure actual logic and increase cognitive overhead.
steps: |
  1. Remove all "// AC #N:" comments from chat route files
  2. Collapse module-level docblocks in /libs/mem0/ and /libs/langfuse/ to single-sentence @module descriptions
  3. Reduce docblocks in /libs/api/errors/ to function signature + one-sentence description
  4. Remove isMem0Enabled() wrapper — export isEnabled() directly from mem0 config
  5. Remove isLangfuseConfigured() wrapper — export isConfigured() directly from langfuse config (if langfuse client.ts still exists after T-003, otherwise skip)
files: |
  - src/app/api/chat/vercel/route.ts
  - src/app/api/chat/route.ts
  - src/libs/mem0/client.ts
  - src/libs/mem0/config.ts
  - src/libs/langfuse/config.ts
  - src/libs/api/errors/responses.ts
  - src/libs/api/errors/validation.ts
tests_before: |
  Existing tests passing (comment removal should not affect behavior)
tests_after: |
  - Verify all imports of isMem0Enabled/isLangfuseConfigured are updated to new export names
  - Verify build and tests pass
=== END THEME ===

=== THEME ===
id: T-005
name: Fix Admin Analytics Performance (N+1 and Memory Bloat)
effort: M
risk: MEDIUM
finding_ids: F-013, F-014, F-017, F-018, F-027
dependencies: None
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: None
phase: 3
summary: |
  Five findings expose severe performance issues in the admin analytics and user management layer. F-013 loads entire user table into memory for every analytics page load. F-014 fetches all users on every admin page navigation or search keystroke. F-017 loads the entire feedback table for trend computation. F-018 makes N+1 Supabase API calls to resolve admin emails in audit logs. F-027 shows duplicated calculateTrend and listAllUsers functions across modules.
steps: |
  1. Write characterization tests for analytics endpoints verifying current response shapes and data accuracy
  2. Consolidate calculateTrend into single utility function with consistent return type
  3. Consolidate listAllUsers/fetchAllUsers into single function, called once per request
  4. Replace in-memory user counting with SQL COUNT + WHERE aggregates for analytics metrics
  5. Replace in-memory feedback filtering with parameterized COUNT queries via Promise.all
  6. Implement server-side pagination for admin user list using Supabase Admin listUsers({page, perPage, filter})
  7. Cache adminId→email map with 5-minute TTL for audit log email resolution
  8. Add 5-minute TTL caching layer for analytics aggregates
files: |
  - src/libs/api/admin/analytics.ts
  - src/libs/queries/users.ts
  - src/libs/queries/auditLog.ts
  - src/app/api/admin/analytics/route.ts
tests_before: |
  Characterization tests for analytics response shapes and calculation accuracy
tests_after: |
  - Performance test verifying analytics queries execute in <200ms for 1000+ rows
  - Test that calculateTrend returns consistent type
  - Test pagination parameters are properly forwarded
  - Test cache TTL behavior
=== END THEME ===

=== THEME ===
id: T-006
name: SEO and Accessibility Quick Fixes
effort: S
risk: LOW
finding_ids: F-090, F-091, F-092, F-094, F-095, F-096, F-097, F-098, F-099, F-100
dependencies: None
coverage_gate: ADEQUATE
blast_radius: MODERATE
warnings: None
phase: 1
summary: |
  Ten SEO/accessibility findings, seven at P1 severity. F-090: hero title is div not h1. F-091: footer social links lack aria-labels. F-092: navbar missing nav landmark. F-094: duplicate h1 in MainAppShell. F-095: toast close button has no accessible label. F-096: missing canonical URL. F-097: animations lack reduced-motion guard. F-098: password reveal unreachable by keyboard. F-099: no skip-to-content link. F-100: breadcrumbs use undefined env var.
steps: |
  1. Change hero title from div to h1 in CenteredHero.tsx; update Section.tsx to use h2
  2. Add aria-label to each footer social icon link; add aria-hidden="true" to SVGs
  3. Wrap navbar in <header>/<nav aria-label="Main navigation">; add aria-label to logo link
  4. Change mobile header h1 to span in MainAppShell.tsx
  5. Add aria-label="Dismiss notification" to ToastClose
  6. Add canonical URL in root layout generateMetadata
  7. Add @media (prefers-reduced-motion: reduce) overrides in global.css
  8. Remove tabIndex={-1} from password reveal button
  9. Add visually-hidden skip-to-main-content link; add id="main-content" to main element
  10. Replace NEXT_PUBLIC_APP_URL with getSiteUrl() in Breadcrumbs.tsx
files: |
  - src/features/landing/CenteredHero.tsx
  - src/features/landing/Section.tsx
  - src/templates/Footer.tsx
  - src/features/landing/CenteredMenu.tsx
  - src/components/layout/MainAppShell.tsx
  - src/components/ui/toast.tsx
  - src/app/[locale]/layout.tsx
  - src/styles/global.css
  - src/components/ui/password-input.tsx
  - src/components/pseo/Breadcrumbs.tsx
tests_before: |
  Existing build and lint pass
tests_after: |
  - Add accessibility smoke test (axe-core) for landing page, dashboard, and sign-in
  - Verify canonical tag renders in page source
  - Verify h1 count is exactly 1 per page
=== END THEME ===

=== THEME ===
id: T-007
name: Strengthen Type Safety Across Chat and Query Layers
effort: M
risk: MEDIUM
finding_ids: F-061, F-062, F-063, F-064, F-065, F-066, F-067, F-069
dependencies: None
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: None
phase: 3
summary: |
  Eight type-safety findings. F-061: all DB query functions return error typed as `any`. F-062: inline `any` annotations on message/part arrays in the Vercel chat route. F-063: catch blocks typed as `any`. F-064: multiple `any` fields in Dify types. F-065: TrendData defined three times with incompatible shapes. F-066: MemoryJob.status as string instead of union. F-067: VercelMessage.role as string instead of MessageRole. F-069: parseSSEEvent returns Record<string,any> instead of DifyStreamEvent.
steps: |
  1. Write type-level tests (tsd or ts-expect-error) confirming current type shapes for DbQueryResult, TrendData, MemoryJob
  2. Define DbQueryError type (code?, message, detail?) and replace `any` in all query return types
  3. Consolidate TrendData to single canonical type; update analytics.ts, calculateTrend.ts, AnalyticsMetricCard.tsx
  4. Define MemoryJobStatus union type ('pending' | 'processing' | 'completed' | 'failed'); update memoryJobs.ts
  5. Change VercelMessage.role from string to MessageRole type
  6. Define Zod schema for Vercel chat request body; remove all `(m: any)` and `(p: any)` annotations
  7. Change all `catch (error: any)` to `catch (error: unknown)` with instanceof narrowing in chat routes
  8. Replace `any` fields in Dify types with `unknown` or structural types
  9. Change parseSSEEvent return type to DifyStreamEvent | null
files: |
  - src/libs/queries/vercelConversations.ts
  - src/libs/queries/vercelMessages.ts
  - src/libs/queries/memoryJobs.ts
  - src/libs/api/admin/analytics.ts
  - src/components/admin/analytics/AnalyticsMetricCard.tsx
  - src/app/api/chat/vercel/route.ts
  - src/app/api/chat/route.ts
  - src/libs/dify/types.ts
  - src/libs/api/errors/responses.ts
tests_before: |
  Characterization tests for query functions confirming current return value shapes
tests_after: |
  - Type-level tests ensuring DbQueryError, MemoryJobStatus, MessageRole are enforced
  - Test that catch blocks properly narrow unknown errors
  - Test parseSSEEvent returns typed DifyStreamEvent
=== END THEME ===

=== THEME ===
id: T-008
name: Fix Data Layer Integrity Issues
effort: M
risk: HIGH
finding_ids: F-071, F-072, F-073, F-074, F-075, F-076, F-077, F-078, F-079
dependencies: None
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: Mixed concerns — separate structural changes from behavior changes
phase: 3
summary: |
  Nine data-layer findings covering race conditions, missing constraints, and authorization gaps. F-071: race condition on share link accessCount. F-072: missing FK constraints on memory tables. F-073: updatedAt never auto-updates. F-074: TOCTOU race in username uniqueness. F-075: multi-step chat mutation without transaction. F-076: race on user preferences auto-creation. F-077: text columns instead of pgEnum. F-078: optional userId creates authorization bypass. F-079: redundant indexes.
steps: |
  1. Write characterization tests for share link access counting, username update, user preferences creation, and conversation creation
  2. Fix share link accessCount with SQL atomic increment
  3. Fix username uniqueness: catch constraint violation (23505) and return 409, or use onConflictDoNothing()
  4. Fix user preferences auto-creation with .onConflictDoNothing({ target: userPreferences.userId })
  5. Wrap conversation creation + user message persistence in db.transaction()
  6. Make userId required in getConversationById, updateConversation, deleteConversation
  7. Add FK constraints on mem0Memories.conversationId and memoryExtractionJobs.conversationId (generate migration)
  8. Add database trigger for automatic updatedAt management (generate migration)
  9. Define pgEnum types for vercelMessages.role, mem0Memories.memoryType, memoryExtractionJobs.status, adminAuditLog.action (generate migration)
  10. Remove redundant btree indexes on shareableLinks.token and threads.conversationId (generate migration)
files: |
  - src/app/api/share/[token]/route.ts
  - src/app/api/profile/update-username/route.ts
  - src/app/[locale]/(auth)/dashboard/page.tsx
  - src/app/api/chat/vercel/route.ts
  - src/libs/queries/vercelConversations.ts
  - src/models/Schema.ts
tests_before: |
  Characterization tests for share link counting, username update error handling, preferences creation, conversation creation flow
tests_after: |
  - Test concurrent share link access produces correct count (atomic increment)
  - Test duplicate username returns 409 instead of 500
  - Test concurrent dashboard loads don't produce constraint violation
  - Test conversation + message creation atomicity (rollback on message failure)
  - Test that userId is required for conversation queries
=== END THEME ===

=== THEME ===
id: T-009
name: Refactor Vercel Chat Route (Decompose God Function)
effort: L
risk: HIGH
finding_ids: F-031, F-050, F-021, F-025, F-026
dependencies: T-001, T-007, T-008
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: None
phase: 3
summary: |
  The Vercel chat route is a 411-line god function (F-031) with zero test coverage (F-050), sequential DB calls adding 150-400ms pre-streaming latency (F-021), vestigial _supabase parameters (F-025), and inconsistent data access patterns vs Dify implementation (F-026). This theme decomposes the route into testable, performant pieces.
steps: |
  1. Write comprehensive integration tests for the Vercel chat route covering auth, conversation CRUD, streaming, error handling
  2. Remove _supabase parameter from all vercelConversations.ts and vercelMessages.ts functions; make userId required; update JSDoc
  3. Extract parseAndValidateMessages() function from inline message parsing
  4. Extract ensureConversation() function handling lookup/creation
  5. Extract persistAssistantResponse() function for post-stream persistence
  6. Parallelize independent pre-stream DB operations with Promise.all (conversation lookup + memory retrieval)
  7. Move user message persistence to fire-and-forget pattern
  8. Migrate Dify threads.ts from raw Supabase queries to Drizzle ORM against vt_saas schema
files: |
  - src/app/api/chat/vercel/route.ts
  - src/libs/queries/vercelConversations.ts
  - src/libs/queries/vercelMessages.ts
  - src/libs/supabase/threads.ts
tests_before: |
  Full integration test suite for Vercel chat route (auth, streaming, conversation management, error paths)
tests_after: |
  - Unit tests for each extracted function (parseAndValidateMessages, ensureConversation, persistAssistantResponse)
  - Integration test verifying pre-stream latency reduction
  - Test that Dify threads work against vt_saas schema
=== END THEME ===

=== THEME ===
id: T-010
name: Standardize API Contracts and REST Conventions
effort: M
risk: MEDIUM
finding_ids: F-081, F-084, F-085, F-086, F-087, F-088, F-044
dependencies: T-001
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: None
phase: 3
summary: |
  Seven findings on API contract inconsistencies. F-081: "not found" returns 400 instead of 404. F-084: DELETE actions exposed via POST to verb-suffixed URLs. F-085: snake_case vs camelCase query params. F-086: inconsistent collection metadata field names. F-087: DELETE returns 200 instead of 204. F-088: doubled "not found" in error message. F-044: placeholder UI content shipped to users.
steps: |
  1. Write characterization tests for affected endpoints verifying current response shapes and status codes
  2. Fix "Conversation not found" to use notFoundError('Conversation') returning 404
  3. Fix notFoundError('Share link not found') to notFoundError('Share link')
  4. Rename conversation_id query param to conversationId in GET /api/chat/messages
  5. Standardize collection metadata field to "total" across /threads and /conversations
  6. Change DELETE profile to return 204 No Content
  7. Restructure feedback admin routes: DELETE /feedback/[id], PATCH /feedback/[id] with { status: 'archived'|'reviewed' }
  8. Gate or implement actual content for share link viewer (remove placeholder text)
files: |
  - src/app/api/chat/vercel/route.ts
  - src/app/api/share/[token]/route.ts
  - src/app/api/chat/messages/route.ts
  - src/app/api/threads/route.ts
  - src/app/api/chat/vercel/conversations/route.ts
  - src/app/api/profile/delete/route.ts
  - src/app/api/admin/feedback/[id]/archive/route.ts
  - src/app/api/admin/feedback/[id]/delete/route.ts
  - src/app/api/admin/feedback/[id]/mark-reviewed/route.ts
  - src/app/[locale]/(unauth)/share/[token]/page.tsx
tests_before: |
  Characterization tests for current status codes and response shapes
tests_after: |
  - Test 404 status for missing conversations and share links
  - Test 204 for successful profile deletion
  - Test camelCase query parameter support
  - Test REST verb conventions for feedback admin routes
=== END THEME ===

=== THEME ===
id: T-011
name: Write Critical Path Test Coverage
effort: L
risk: LOW
finding_ids: F-051, F-052, F-053, F-054, F-055, F-093
dependencies: None
coverage_gate: REQUIRED
blast_radius: CONTAINED
warnings: None
phase: 2
summary: |
  Six findings identify zero test coverage on critical security and data paths. F-051: auth callback route (OAuth + email verification). F-052: middleware (route protection, admin gating). F-053: account deletion API. F-055: Vercel conversation CRUD routes. F-054: 8 instances of setTimeout-based flaky async waits. F-093: auth form validation errors not associated via aria-describedby (needs test to prevent regression after fix).
steps: |
  1. Create proxy.test.ts testing: protected route redirect, API 401, admin gating, email verification redirect, locale handling
  2. Create auth/callback/route.test.ts testing: code exchange, new-user detection, redirect safety, error handling
  3. Create profile/delete/route.test.ts testing: auth check, service role usage, Supabase admin deleteUser flow, error paths
  4. Create conversations/route.test.ts following tests/integration/api/threads.test.ts pattern
  5. Replace all setTimeout-based waits in thread-persistence.test.ts with vi.waitFor() polling
  6. Add aria-describedby to form error messages in sign-up and sign-in pages; write accessibility test
files: |
  - src/proxy.ts (test target)
  - src/app/api/auth/callback/route.ts (test target)
  - src/app/api/profile/delete/route.ts (test target)
  - src/app/api/chat/vercel/conversations/route.ts (test target)
  - tests/integration/api/thread-persistence.test.ts
  - src/app/[locale]/(unauth)/(center)/sign-up/page.tsx
  - src/app/[locale]/(unauth)/(center)/sign-in/page.tsx
tests_before: |
  N/A — this theme IS the test-writing effort
tests_after: |
  - proxy.test.ts with 5+ test cases covering all security behaviors
  - auth/callback/route.test.ts with 4+ test cases
  - profile/delete/route.test.ts with 3+ test cases
  - conversations/route.test.ts with 5+ CRUD test cases
  - All setTimeout waits replaced with vi.waitFor()
=== END THEME ===

=== THEME ===
id: T-012
name: Consolidate Environment Config and Fix Middleware Performance
effort: S
risk: MEDIUM
finding_ids: F-029, F-030, F-019, F-024
dependencies: None
coverage_gate: REQUIRED
blast_radius: MODERATE
warnings: None
phase: 2
summary: |
  Four findings on configuration and middleware. F-029: multiple config modules bypass validated Env.ts and access process.env directly. F-030: locale extraction logic duplicated 4 times in middleware with fragile substring matching. F-019: two sequential Supabase auth.getUser() calls on every protected request (~100ms TTFB tax). F-024: hardcoded stale schema reference in threads.ts (addressed partially in T-009 but schema config belongs here).
steps: |
  1. Write test for middleware verifying locale extraction and auth behavior
  2. Add missing environment variable keys to Env.ts (OPENAI_API_KEY, AI_PROVIDER, DEFAULT_AI_MODEL, LANGFUSE_*, MEM0_*, CRON_SECRET)
  3. Route all process.env access in vercel-ai/config, chatConfig, langfuse, mem0, supabase through Env.ts
  4. Extract getLocalePrefix() helper in middleware; replace 4 duplicated extraction blocks
  5. Use precise path matching instead of pathname.includes() for route checks
  6. Refactor updateSession to return the user object; share with auth check to eliminate duplicate getUser() call
files: |
  - src/utils/Env.ts
  - src/libs/vercel-ai/config.ts
  - src/utils/chatConfig.ts
  - src/libs/langfuse/config.ts
  - src/libs/mem0/config.ts
  - src/libs/supabase/server.ts
  - src/libs/supabase/middleware.ts
  - src/proxy.ts
tests_before: |
  Test for middleware locale extraction and auth behavior
tests_after: |
  - Test that Env.ts validates all required variables
  - Test getLocalePrefix() handles all locale patterns
  - Test that updateSession returns user object
  - Verify ~50ms TTFB improvement (single getUser call)
=== END THEME ===

=== THEME ===
id: T-013
name: Fix Remaining Performance Issues
effort: M
risk: MEDIUM
finding_ids: F-015, F-016, F-020, F-022, F-023, F-056, F-059
dependencies: None
coverage_gate: ADEQUATE
blast_radius: MODERATE
warnings: None
phase: 4
summary: |
  Seven remaining performance and efficiency findings. F-015: connection pool capped at max:1 starves concurrent requests. F-016: N+1 queries and sequential dynamic imports in mem0 worker. F-020: 10k-row feedback export loaded entirely into memory. F-022: PostHog with autocapture adds 40-60KB. F-023: uncached refetch on every tab focus. F-056: CI installs unused Firefox browser. F-059: UI component tests assert CSS class names (~470 LOC of brittle tests).
steps: |
  1. Increase pg Pool max to 5 for production; add comment explaining reasoning
  2. Move dynamic imports in mem0/worker.ts to top-level; batch DB inserts; add bounded parallelism
  3. Stream CSV feedback export using TransformStream; fetch rows in batches of 500
  4. Lazy-load PostHog via dynamic import after idle; disable autocapture
  5. Add 30-second stale-time check to conversation list refetch on tab focus
  6. Change CI to `npx playwright install --with-deps chromium` only
  7. Reduce UI component tests (skeleton, spinner, loading-card) to 2-3 tests each: renders, custom className, HTML attributes
files: |
  - src/libs/DB.ts
  - src/libs/mem0/worker.ts
  - src/app/api/admin/feedback/export/route.ts
  - src/components/analytics/PostHogProvider.tsx
  - src/components/chat/vercel/ConversationListSidebar.tsx
  - .github/workflows/CI.yml
  - src/components/ui/__tests__/skeleton.test.tsx
  - src/components/ui/__tests__/spinner.test.tsx
  - src/components/ui/__tests__/loading-card.test.tsx
tests_before: |
  Existing tests pass (particularly feedback export and mem0 worker if any exist)
tests_after: |
  - Test streaming CSV export produces valid output
  - Test PostHog loads only after idle
  - Test stale-time prevents rapid refetches
  - Verify CI pipeline time reduction
=== END THEME ===

=== THEME ===
id: T-014
name: Patch Dependency Vulnerabilities
effort: S
risk: MEDIUM
finding_ids: F-045, F-046, F-047
dependencies: None
coverage_gate: ADEQUATE
blast_radius: WIDE
warnings: None
phase: 1
summary: |
  Three dependency vulnerability findings. F-045: Next.js has 3 HIGH severity DoS CVEs with fix available via npm audit fix. F-046: mem0ai depends on vulnerable axios (prototype pollution DoS). F-047: @logtail/pino has HIGH severity vulnerability with no upstream fix.
steps: |
  1. Run npm audit fix to patch Next.js vulnerabilities
  2. Pin mem0ai to 1.0.39 or verify current version; track upstream axios fix
  3. Evaluate @logtail/pino alternatives: BetterStack SDK or direct HTTP Pino transport
  4. Run full test suite and build to verify no regressions
files: |
  - package.json
  - package-lock.json
tests_before: |
  Full test suite and build pass before patching
tests_after: |
  - npm audit shows no HIGH severity vulnerabilities with available fixes
  - Full test suite and build pass after patching
=== END THEME ===

=== EXECUTION ORDER ===
phase_1: T-003, T-004, T-006, T-014
phase_2: T-011, T-012, T-001, T-002
phase_3: T-005, T-007, T-008, T-009, T-010
phase_4: T-013
quick_wins: T-003, T-004, T-006
total_effort: XL
summary: |
  The refactoring plan addresses 100 code findings across 14 themes in 4 phases. Phase 1 (quick wins) removes ~800+ lines of dead code, cleans AI-generated comment bloat, fixes 10 accessibility/SEO issues, and patches known dependency vulnerabilities — all low-risk with immediate quality improvement. Phase 2 builds the safety net: critical path tests for middleware/auth/deletion (T-011), environment config consolidation (T-012), centralized API auth/error infrastructure (T-001), and security hardening (T-002). Phase 3 tackles the highest-impact structural work: admin analytics performance (T-005), type safety (T-007), data integrity (T-008), chat route decomposition (T-009), and API contract standardization (T-010). Phase 4 handles remaining performance optimizations and test cleanup. Total estimated effort is XL (>10 days) for a senior developer, though phases 1 and 2 can be completed in approximately 5 days. Documentation: MAJOR update recommended after completing all code changes. Run /docs-quick-update to sync docs with refactored code, then address remaining gaps from Documentation Health findings F-101, F-102, F-103, F-104, F-105.
=== END EXECUTION ORDER ===
