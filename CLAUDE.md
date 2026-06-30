# CLAUDE.md

Behavioral guidance for this repo — kept deliberately lean. Detailed reference lives in `docs/` (start at the Documentation Map below); subsystem rules live in `.claude/rules/` and load automatically when you touch matching files.

## Project Overview

**VT SaaS Template** is a production-ready foundation for building SaaS web apps, optimized for a solo developer who prioritizes productivity. A fork is the starting point for a new product; this repo is the **upstream source of truth** for shared/infra code (see "Contributing back" below).

Ships: Supabase auth (SSR) · two interchangeable AI chat stacks (Dify proxy + Vercel AI SDK) · Drizzle/Postgres with PGlite for offline dev · next-intl i18n · Resend email · SEO (hreflang, OG, sitemap) · admin tooling.

## Tech Stack (decisions that carry constraints)

- **Framework:** Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript
- **Auth + DB:** Supabase (Postgres + Auth + SSR). Tables live in the schema named by `DB_SCHEMA` (e.g. `vt_saas` in dev, `public` in prod) — never hardcode the schema
- **Schema/ORM:** Drizzle — schema-as-code; apply to dev via Supabase MCP, generate the migration on `main`, migrate-on-prod (see DB rules below). **No `db:push`** (drift-destructive; intentionally absent)
- **Query client + types:** Supabase JS for runtime queries; `src/libs/supabase/types.ts` is **generated** (`npm run db:gen-types` after each migration) — that's what turns a dropped column into a `tsc` error instead of a prod 400
- **AI:** two stacks behind one `/chat` selector — see "Which chat to use." Vercel path uses AI SDK 6, provider-agnostic
- **UI:** shadcn/ui + Tailwind 4. No other UI libraries without approval
- **i18n:** next-intl — `en` (default), `hi`, `bn`. Strings in `src/locales/`
- **Email:** Resend, provider-agnostic via `src/libs/email/`
- **Validation:** Zod 4 at boundaries · **Deploy:** Vercel

Full dependency inventory: `package.json`.

## Documentation Map

| Topic                               | Full reference                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| Architecture                        | [docs/architecture.md](docs/architecture.md)                                                      |
| Development                         | [docs/development-guide.md](docs/development-guide.md)                                            |
| Database workflow                   | [docs/database-workflow.md](docs/database-workflow.md) · [legacy columns](docs/legacy-columns.md) |
| API errors                          | [docs/api-error-handling.md](docs/api-error-handling.md)                                          |
| Error boundaries                    | [docs/error-handling-guide.md](docs/error-handling-guide.md)                                      |
| Email system                        | [docs/email-system.md](docs/email-system.md)                                                      |
| SEO (hreflang, OG, sitemap, robots) | [docs/seo.md](docs/seo.md)                                                                        |
| SSE streaming                       | [docs/patterns/sse-streaming.md](docs/patterns/sse-streaming.md)                                  |
| CI/CD                               | [docs/ci-cd-pipeline.md](docs/ci-cd-pipeline.md)                                                  |
| Admin setup                         | [docs/admin-setup.md](docs/admin-setup.md)                                                        |
| Upstream sync                       | [docs/upstream-sync-guide.md](docs/upstream-sync-guide.md)                                        |

Subsystem rules in `.claude/rules/` (auto-load by path glob): `database.md` (schema/migration safety), `platforms.md` (third-party OAuth & token security), `blog.md` (pSEO authoring).

## Architecture Rules (mandatory)

- **Auth is Supabase, not Clerk.** Server client (`src/libs/supabase/server.ts`, cookie-based) for RSC/routes; client (`client.ts`) for components; `middleware.ts` refreshes the session.
- **Middleware order** (`src/proxy.ts`): i18n → Supabase session refresh → auth check. Protected paths: `/dashboard`, `/onboarding`, `/chat`, `/admin`, `/settings`; `/admin` also requires admin. To protect a route, add its segment to `protectedPaths` in `src/proxy.ts`.
- **Never expose the Dify API key client-side** — always proxy through `/api/chat`. Streaming responses need SSE headers.
- **Absolute imports** via `@/` (configured in `tsconfig.json`).
- **Async route params** (Next 15+): `params` is a Promise — `const { locale, id } = await props.params`.
- **Validation at boundaries only** — Zod for Route Handlers, Server Actions, env vars.
- **Tests co-located** with source (`Component.test.tsx`). **Error boundaries** per route segment (`error.tsx`).
- **Reuse before building** — extend the established patterns (auth wrappers, API error helpers, email service, SEO utils) rather than reinventing them.

### TypeScript & lint

Use `type`, not `interface` (`ts/consistent-type-definitions`). **Semicolons are required** and single quotes for JSX attributes (antfu `stylistic`). Imports are auto-sorted — let `npm run lint:fix` handle order, never hand-order.

> **Never** use an `eslint-disable` to lazy-`require()` a local ESM module under Next 16 + Turbopack — the production bundle drops the named export under ESM↔CJS interop (this silently broke a provider module's named export in prod). Use static `import` for local modules. Every `eslint-disable` needs a `-- reason`.

## Which chat to use

Two AI chat stacks share the `/chat` selector; both degrade gracefully (nav hides what isn't configured — detect via `getChatConfig()` server / `getPublicChatConfig()` client from `src/utils/chatConfig.ts`):

- **Dify** (`/chat/dify`) — managed, minimal setup. `/api/chat` proxies to Dify (key stays server-side), streams SSE, tracks `conversation_id`. Use for simple managed chat.
- **Vercel AI SDK** (`/chat/vercel`) — full control. `/api/chat/vercel/*` + `/api/conversations/*`, Postgres-backed conversation persistence, optional Mem0 memory + Langfuse tracing. Use when you need conversation management or provider control.

API-error contract (`AUTH_REQUIRED` 401, `VALIDATION_ERROR` 400, `NOT_FOUND` 404, `INTERNAL_ERROR` 500): import helpers from `@/libs/api/errors` (server) and `@/libs/api/client` (client). Details: [docs/api-error-handling.md](docs/api-error-handling.md).

## Database — non-negotiables

1. **On a feature branch, apply schema changes to dev manually — don't commit migrations.** Edit `src/models/Schema.ts`, then apply the equivalent SQL to the dev Supabase DB via **Supabase MCP `apply_migration`** or the SQL editor. A pre-commit hook blocks `migrations/` writes on non-`main` branches. Run `npm run db:gen-types` so `src/libs/supabase/types.ts` stays in sync.
2. **Generate the committed migration on `main`, after merge.** Run `npm run db:generate` once on `main`, inspect the SQL (red flags: `DROP POLICY` / `DROP TRIGGER` / `DROP CONSTRAINT`), and commit the `.sql` + `meta/_journal.json` + `NNNN_snapshot.json` together. `db:migrate` is **journal-driven** — only `.sql` files listed in `_journal.json` run; a hand-written file not in the journal is silently skipped.
3. **Prod applies at build time — there is no auto-apply.** Vercel runs `npm run db:migrate:ci` before `next build`, gated behind `RUN_PROD_MIGRATIONS=true`. Nothing applies migrations on first interaction. (`db:migrate` runs under `dotenv -c production` and targets prod by design — don't run it locally against shared dev.)

Three-home model, dev→prod flow, destructive-change checklist: [`.claude/rules/database.md`](.claude/rules/database.md) → [docs/database-workflow.md](docs/database-workflow.md).

## Commands

```bash
# Dev
npm run dev              # Next.js + Sentry Spotlight (Turbopack)
npm run dev:next         # Next.js only

# Quality  (run all before pushing)
npm run lint             # ESLint (antfu)            npm run lint:fix
npm run check-types      # tsc --noEmit
npm run build            # production build

# Test  (creds: test@test.com / password)
npm run test                              # Vitest (unit, co-located)
npx vitest run path/to/file.test.ts       # single file
npm run test:e2e                          # Playwright

# Database  (no db:push — see "Database" above)
npm run db:generate      # migration from schema diff (on main, after merge)
npm run db:migrate       # apply migrations (journal-driven)
npm run db:gen-types     # regenerate Supabase types after a migration
npm run db:studio        # Drizzle Studio

npm run email:dev        # React Email preview, port 3001
npm run storybook        # port 6006
npm run commit           # Commitizen
```

Environment variables: copy and fill `.env.example` (the canonical, annotated list). Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIFY_API_KEY`) stay in `.env.local` only.

**Fork lifecycle (Claude Code commands):** `/init-downstream` (run first after forking — renames the DB schema, sets `.gitattributes` merge strategies, retargets the `gh` CLI, cleans template artifacts) · `/upstream-sync` (pull template updates; needs `/init-downstream` first) · `/launch-checklist` (production-readiness audit).

## Testing notes

- Unit (Vitest): co-located, `jsdom` for components / `node` for utilities.
- E2E (Playwright): `tests/`, `*.spec.ts` / `*.e2e.ts`; setup/teardown create the test account.
- After a frontend change, do a quick visual check (Playwright/Chrome MCP) and save screenshots to `_bmad-output/implementation-artifacts/screenshots`.

## Commits & CI

- **Remote `main` is protected** — always branch, then PR. Run `npm run lint && npm run check-types && npm test && npm run build` locally before pushing (faster feedback than CI).
- **Conventional Commits**, one-line, no "Co-Authored-By". semantic-release bumps version from commit type (`feat:`→minor, `fix:`→patch, `feat!:`→major) and writes `docs/CHANGELOG.md`.
- Quality gates: ESLint · TypeScript · Vitest · Build · Playwright E2E. Preview deploy on PRs, production on merge. Required secrets + details: [docs/ci-cd-pipeline.md](docs/ci-cd-pipeline.md).

## Deployment & QA skills

- **`/production-deploy`** — provider-agnostic 8-phase first-deploy orchestrator, resume-safe via `_bmad-output/deployment-checklist.md`. Writes production specifics into `docs/deployment-guide.md` and a `## Deployment` section here once a real deploy runs.
- **`/qa`** — manual-QA runner for flows unit/E2E can't cover (real browser, real email, real env). `--dev` / `--prod`; reads `QA_EMAIL` / `QA_PASSWORD` from `.env.local`.

Compose with the read-only `/launch-checklist`: audit → execute (`/production-deploy`) → verify (`/qa`).

## Contributing back to the template

**This template is the source of truth for shared/infra code.** When a product accrues a generic, reusable improvement, contribute it **up** here so it reaches every product (and future fork) via `upstream-sync`. Never keep divergent copies of shared code.

- **`/upstream-contribute`** — harvest loop (Identify → Plan → Produce → Verify → Merge → Harvest). A produce-only fan-out (`workflows/port-to-template.js`) opens dependency-ordered PRs; merge is human-supervised and gated on **independent byte-level verification** — trust the pushed bytes, never an agent's "I fixed it" report.
- **What to contribute:** does it make the _next_ product faster to build, or improve the whole fleet? If not, leave it in the product. Strip to the pattern, not the instance — keep the template a scaffold, not a library.

## Research

- During planning, use targeted web search early; prefer established libraries/repos over building from scratch.
- After 1-2 failed debugging attempts, search online for known issues before continuing.
