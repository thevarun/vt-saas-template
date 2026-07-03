# Development Guide

**Generated:** 2026-07-03 | Deep scan

> The repo uses **pnpm** (`packageManager: pnpm@10.16.1`) — it migrated off npm. Use pnpm for all commands.

## Prerequisites

- **Node.js 22** — pinned via `.nvmrc` (`nvm use`; CI reads `node-version-file: .nvmrc`).
- **pnpm 10.16.1** — declared in `package.json`. Enable with `corepack enable` (recommended) or install directly.
- `.npmrc` sets `strict-peer-dependencies=false` and `auto-install-peers=true` (preserves the permissive peer-dep behavior from the npm era). Single-package repo — no `pnpm-workspace.yaml`.

## Setup

```bash
pnpm install                 # install deps (honors .npmrc + pnpm overrides)
cp .env.example .env.local   # fill in values; .env.local is gitignored
```

Required env in `.env.local`: `DB_SCHEMA` / `NEXT_PUBLIC_DB_SCHEMA` (default `vt_saas`), `DATABASE_URL` (Drizzle only — Transaction pooler, port 6543), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `SUPABASE_PROJECT_ID`. Everything else (Dify, OpenAI/Anthropic, Resend, PostHog, Langfuse, Mem0, Inngest, Stripe, Sentry) is optional and degrades gracefully when unset. Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIFY_API_KEY`) stay in `.env.local` only. `.env.example` is the canonical, annotated list.

## Dev

```bash
pnpm dev            # Next.js + Sentry Spotlight sidecar (Turbopack) — runs dev:* in parallel
pnpm dev:next       # Next.js dev server only
pnpm dev:spotlight  # Sentry Spotlight sidecar only
pnpm start          # serve the production build (next start)
```

## Quality (run all before pushing)

```bash
pnpm lint         # ESLint (antfu config)
pnpm lint:fix     # ESLint autofix (also auto-sorts imports — never hand-order)
pnpm check-types  # tsc --noEmit --pretty
pnpm build        # production build (next build)
```

## Test

Test account credentials (local + E2E): **`test@test.com` / `password`** (`TEST_USER_EMAIL` / `TEST_USER_PASSWORD`; admin flows use `admin@test.com` / `password`).

```bash
pnpm test                              # Vitest — node + jsdom projects (co-located *.test.ts / *.test.tsx)
pnpm exec vitest run path/to/file.test.ts   # single file
pnpm test:stories                      # runs every *.stories.tsx as a headless-Chromium browser test
pnpm test:e2e                          # Playwright E2E (tests/**, *.spec.ts / *.e2e.ts, Chromium-only)
pnpm test --coverage                   # v8 coverage on demand (not gated in CI)
```

**Test layering.** Vitest is the default (`node` for logic/libs/API, `jsdom` for components). Vitest is hermetic — `vitest.config.mts` blanks `DATABASE_URL` so `src/libs/DB.ts` uses in-memory PGlite; never point tests at a live Postgres. Reserve Playwright E2E for behavior that crosses a boundary (auth/session, middleware redirects, data persistence, SEO/metadata). Playwright runs `pnpm dev:next` locally / `pnpm start` in CI as its web server.

## Database

**No `db:push`** — intentionally absent (drift-destructive). Apply schema changes to dev manually on the feature branch (Supabase MCP / SQL editor), then generate and commit the migration. See [database-workflow.md](./database-workflow.md) and [.claude/rules/database.md](../.claude/rules/database.md).

```bash
pnpm db:generate    # migration from Schema.ts diff (feature branch, rebased onto main)
pnpm db:migrate     # dotenv -c production — journal-driven; targets PROD by design, don't run against shared dev
pnpm db:migrate:ci  # drizzle-kit migrate — used at build time on Vercel prod
pnpm db:gen-types   # regenerate src/libs/supabase/types.ts (run after every migration)
pnpm db:studio      # Drizzle Studio
```

Drizzle config (`drizzle.config.ts`): schema at `./src/models/schema/index.ts`, migrations output to `./migrations`, dialect `postgresql`, introspection scoped to `DB_SCHEMA` via `schemaFilter`.

## Email & Storybook

```bash
pnpm email:dev      # React Email preview — src/libs/email/templates, port 3001
pnpm email:render   # render Supabase auth templates (tsx script)
pnpm storybook      # Storybook dev server, port 6006
pnpm storybook:build
```

## Commits

```bash
pnpm commit         # Commitizen (Conventional Commits, one-line, no Co-Authored-By)
```

Remote `main` is protected — always branch, then PR. Run `pnpm lint && pnpm check-types && pnpm test && pnpm build` locally before pushing. semantic-release bumps version from commit type (`feat:`→minor, `fix:`→patch, `feat!:`→major).

**See also:** [architecture.md](./architecture.md) · [deployment-guide.md](./deployment-guide.md) · [api-error-handling.md](./api-error-handling.md) · [error-handling-guide.md](./error-handling-guide.md)
