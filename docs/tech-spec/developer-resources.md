# Developer Resources

## File Paths Reference

**Complete list of files affected by Epic 2 - See "Source Tree Changes" section above for full details**

**Critical paths:**
- Chat: `src/app/[locale]/(chat)/chat/page.tsx`
- Landing: `src/app/[locale]/(unauth)/page.tsx`
- Dashboard: `src/app/[locale]/(auth)/dashboard/page.tsx` + `layout.tsx`
- Auth: `src/app/[locale]/(auth)/(center)/sign-in/page.tsx` + `sign-up/page.tsx`
- Schema: `src/models/Schema.ts`
- Config: `src/utils/AppConfig.ts`, `src/libs/i18n.ts`
- i18n: `src/locales/{en,hi,bn}.json`
- Tests: `tests/e2e/*.spec.ts`

## Key Code Locations

**Authentication:**
- Server-side client: `src/libs/supabase/server.ts`
- Client-side client: `src/libs/supabase/client.ts`
- Middleware: `src/middleware.ts`

**Chat/AI:**
- API endpoint: `src/app/api/chat/route.ts`
- Dify client: `src/libs/dify/client.ts`

**Database:**
- Schema: `src/models/Schema.ts`
- Connection: `src/libs/DB.ts`
- Migrations: `migrations/` directory

**i18n:**
- Configuration: `src/libs/i18n.ts`
- Translations: `src/locales/`
- Middleware handling: `src/middleware.ts`

## Testing Locations

**Unit Tests:**
- Co-located with source files: `*.test.ts(x)`
- Setup: `vitest-setup.ts`
- Config: `vitest.config.mts`

**E2E Tests (Story 3 creates these):**
- Test files: `tests/e2e/*.spec.ts`
- Setup/teardown: `tests/e2e/*.setup.ts`, `tests/e2e/*.teardown.ts`
- Config: `playwright.config.ts`

**CI/CD:**
- Workflows: `.github/workflows/CI.yml`
- Test execution: Lines 38-41 (E2E), earlier lines (unit)

## Documentation to Update

**Story 2:**
- `README.md` - Complete replacement

**Story 4:**
- `docs/tech-spec.md` - This document (already created)
- Optional: `docs/architecture.md`, `docs/source-tree-analysis.md`, `CLAUDE.md`

---
