# Deployment Guide

**Generated:** 2026-07-03 | Deep scan

> Uses **pnpm** (`pnpm@10.16.1`). See also [ci-cd-pipeline.md](./ci-cd-pipeline.md) and [ci-cd-troubleshooting.md](./ci-cd-troubleshooting.md).

## Platform

Deploys to **Vercel**. Preview deploys on PRs; production deploys on merge to `main`. Production build runs `pnpm build`, which (only when `VERCEL_ENV=production`) runs migrations before `next build` and, in `postbuild`, registers a Sentry release deploy.

## CI/CD pipeline

**CI (`.github/workflows/CI.yml`)** — triggers on push and PR to `main`. Uses `pnpm/action-setup@v4` + `actions/setup-node@v6` (`node-version-file: .nvmrc`, `cache: pnpm`), installs with `pnpm install --frozen-lockfile --prefer-offline`. Jobs:

1. **Detect Changes** — `dorny/paths-filter` computes a `code` signal; `docs_only` PRs skip build/lint/test, `deps_only` PRs skip E2E, Dependabot PRs skip E2E.
2. **Install & Build** — `pnpm install`, `pnpm audit --prod --audit-level high` (currently advisory / `continue-on-error`), `pnpm build`; caches `node_modules` + `.next`. Build env uses `vt_saas` schema + placeholder Supabase/Dify secrets.
3. **Lint & Types** — commitlint on PR commits (skipped for Dependabot), then `pnpm lint` and `pnpm check-types`.
4. **Unit Tests** — `pnpm test` (node + jsdom), no coverage gate.
5. **Build & E2E** — installs Chromium (`pnpm exec playwright install`), runs `pnpm test:e2e` with real Supabase/Dify secrets; uploads traces/videos on failure. Skipped for docs-only, deps-only, Dependabot PRs.
6. **Storybook** — `pnpm test:stories` (headless Chromium via Storybook Vitest addon); runs even on Dependabot PRs (no secrets).
7. **CI Gate** — aggregate status check (`if: always()`); green when all upstream jobs passed or legitimately skipped. Intended as the single required branch-protection context.

**PR Title Lint (`pr-title-lint.yml`)** — validates the PR title against Conventional Commits. Merges are squashed and the PR title becomes the squash commit semantic-release reads.

**Release (`release.yml`)** — triggers on push to `main`. Runs `pnpm exec semantic-release`. Releases are **tag-only** (no commit back to `main`, so it never re-triggers itself); serialized via `concurrency: group: release, cancel-in-progress: false`. Version bump derives from commit type.

**Ancillary:** `docs-sync.yml` / `changelog-sync.yml` (doc + changelog upkeep), `dependabot-auto-merge.yml` (auto-squash-merges Dependabot patch/minor), `claude.yml` + `claude-code-review.yml` (Claude PR assistance/review).

## Production migration gating

Migrations apply at **build time on Vercel production only** — no auto-apply on first request. The `build` script:

```
if VERCEL_ENV = production:
  if RUN_PROD_MIGRATIONS = true → run `pnpm db:migrate:ci` (drizzle-kit migrate, journal-driven)
  else → skip with a warning
then always → next build
```

So prod migrations require **`RUN_PROD_MIGRATIONS=true`** in Vercel prod env. `db:migrate:ci` is journal-driven — only `.sql` files listed in `meta/_journal.json` run. `postbuild` also creates a Sentry release deploy on production builds. Supabase-side objects (RLS, grants, triggers, cross-schema FKs) live in `supabase/prod-setup.sql` and are applied separately after migrations.

## Required env / secrets

**Vercel production env vars:**

- **DB/schema:** `DB_SCHEMA`, `NEXT_PUBLIC_DB_SCHEMA` (`vt_saas`), `DATABASE_URL` (Transaction pooler, port 6543), `RUN_PROD_MIGRATIONS`.
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`.
- **AI:** `DIFY_API_KEY` / `DIFY_API_URL` and/or `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`), `AI_PROVIDER`, `DEFAULT_AI_MODEL`; optional `ENABLE_MEM0` / `MEM0_API_KEY`, `LANGFUSE_*`.
- **Email:** `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO`.
- **Analytics/monitoring:** `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- **Jobs/payments:** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `CRON_SECRET`; `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Misc:** `ADMIN_EMAILS`, `TOKEN_ENCRYPTION_KEY`, `NEXT_PUBLIC_SITE_URL`, optional search (`SEARCH_PROVIDER`, `TAVILY_API_KEY` / `PERPLEXITY_API_KEY`).

**GitHub Actions secrets** (repo Settings → Secrets): `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DIFY_API_KEY`, `DIFY_API_URL` (E2E), plus `CROWDIN_PROJECT_ID` / `CROWDIN_PERSONAL_TOKEN` (translation sync). `GITHUB_TOKEN` is auto-provided for release and auto-merge.

## Cron

`vercel.json` declares one cron: `/api/cron/memory-extraction` every 5 minutes (Mem0 drain), guarded by `CRON_SECRET`. Durable/retryable jobs run through Inngest (`/api/inngest`), registered only on production and local dev.

**Related:** [architecture.md](./architecture.md) (background jobs) · [database-workflow.md](./database-workflow.md) · [admin-setup.md](./admin-setup.md)
