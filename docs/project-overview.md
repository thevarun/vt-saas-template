# Project Overview

**Generated:** 2026-07-03 | Deep scan | Version 1.8.0

## What it is

**VT SaaS Template** is a production-ready foundation for building SaaS web apps, optimized for a solo developer who prioritizes productivity. A fork is the starting point for a new product; this repo is the **upstream source of truth** for shared/infra code.

**Type:** Monolith — serverless full-stack Next.js 16 web application, deployed to Vercel.

Ships: Supabase auth (SSR) · two interchangeable AI chat stacks (Dify proxy + Vercel AI SDK) · Drizzle/Postgres with PGlite for offline dev · subscriptions + quota engine (Stripe) · Inngest background jobs · next-intl i18n (en/hi/bn) · Resend email · SEO (hreflang, OG, sitemap, pSEO blog) · multi-theme system (OKLCH) · admin tooling.

## Tech stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, RSC, Turbopack) | ^16.2.6 |
| UI runtime | React / react-dom | ^19.2.6 |
| Language | TypeScript | ^6.0.3 |
| Runtime | Node.js | 22 (`.nvmrc`) |
| Package manager | pnpm | 10.16.1 |
| Auth + DB | Supabase JS / SSR | 2.105.4 / 0.10.3 |
| ORM / migrations | Drizzle ORM / drizzle-kit | ^0.45.2 / ^0.31.10 |
| Offline DB | PGlite | ^0.4.2 |
| AI | Vercel AI SDK (`ai`) / @ai-sdk/openai | ^6.0.177 / ^3.0.41 |
| AI UI | assistant-ui | ^0.14.24 |
| AI memory / tracing | Mem0 / Langfuse | ^2.4.2 / ^3.38.6 |
| UI kit | Tailwind CSS / shadcn CLI / Radix | ^4.1.18 / ^4.7.0 |
| i18n | next-intl | ^4.11.2 |
| Email | Resend / React Email | ^6.12.2 / ^1.0.12 |
| Validation | Zod / t3-env | ^4.0.0 / ^0.13.11 |
| Analytics | posthog-js / posthog-node | ^1.368.0 / ^5.28.2 |
| Background jobs | Inngest | ^4.5.0 |
| Payments | Stripe | ^22.2.1 |
| Monitoring | @sentry/nextjs | ^10.51.0 |
| State / forms | zustand / react-hook-form / TanStack Query | ^5.0.14 / ^7.72.1 / ^5.101.0 |
| Testing | Vitest / Playwright / Storybook | ^4.1.9 / ^1.59.1 / ^10.4.6 |
| Tooling | ESLint (antfu) / semantic-release / commitizen | ^10.5.0 / ^25.0.5 / ^4.3.1 |

`pnpm.overrides` pin transitive deps for security (`axios`, `cookie`, `esbuild`, `glob`); `pnpm.onlyBuiltDependencies` allowlists native build scripts.

## Architecture at a glance

- **Serverless full-stack monolith.** One Next.js app: RSC pages + Route Handler APIs + Inngest/Cron jobs + static assets. Persistence is Supabase.
- **Middleware order** (`src/proxy.ts`): i18n → Supabase session refresh → auth/admin/verify gate. Protected: `/dashboard`, `/onboarding`, `/chat`, `/admin`, `/settings`.
- **Auth:** Supabase SSR, cookie-based; server/client/middleware/admin client factories in `src/libs/supabase/`.
- **Layered:** thin routes → `src/libs/*` (logic/integrations) → `src/models/schema/*` (Drizzle source of truth).
- **Two chat stacks** behind `/chat`, env-selected via `chatConfig.ts`; both degrade gracefully.
- **Everything degrades gracefully** — optional integrations (AI, email, analytics, payments, memory, tracing) are absent-safe.

See [architecture.md](./architecture.md) for the full design and [source-tree-analysis.md](./source-tree-analysis.md) for the annotated tree.

## Project statistics

| Metric | Value |
|---|---|
| API endpoints (`route.ts`) | 39 |
| React components (`.tsx`, non-test) | ~235 (121 client) |
| shadcn/ui primitives | 43 |
| Database tables | 16 |
| SQL migrations | 6 (0000–0005) |
| Postgres enums | 3 |
| Supported languages | 3 (en, hi, bn) |
| CI/CD workflows | 8 |
| E2E/spec test files | 10 |
| Total test files | ~189 |

## Getting started

1. Install **Node 22** + **pnpm 10.16.1** (`corepack enable`), run `pnpm install`.
2. Copy `.env.example` → `.env.local` and fill Supabase + `DB_SCHEMA`.
3. `pnpm dev`, then run tests: `pnpm test` / `pnpm test:e2e`.

Full setup: [development-guide.md](./development-guide.md). Deploy: [deployment-guide.md](./deployment-guide.md).
