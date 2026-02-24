# Source Tree Analysis

**Generated:** 2026-02-23 | **Scan Level:** Quick (rescan) | **Structure:** Monolith

---

## Project Root

```
vt-saas-template/
├── .github/                    # CI/CD workflows
│   ├── workflows/
│   │   ├── CI.yml              # Main test pipeline (lint, unit, e2e)
│   │   ├── release.yml         # Semantic release on main
│   │   ├── codex-ci-fixer.yml  # Auto-fix CI failures
│   │   ├── codex-followup.yml  # Follow-up on review feedback
│   │   ├── dependabot-auto-merge.yml
│   │   └── codex-followup.yml  # Follow-up on review feedback
│   └── dependabot.yml
├── migrations/                 # Drizzle SQL migrations (7 SQL + meta)
├── public/                     # Static assets
│   └── og-image.png           # Default OG image (1200x630)
├── src/                        # Application source
│   ├── app/                    # Next.js App Router
│   ├── components/             # React components (138 files)
│   ├── features/               # Feature modules (9 files)
│   ├── hooks/                  # Custom React hooks (5 files)
│   ├── lib/                    # Utility library
│   ├── libs/                   # Core libraries (22 modules)
│   ├── locales/                # i18n translations (en, hi, bn)
│   ├── models/                 # Database schema (Drizzle)
│   ├── styles/                 # Global styles (Tailwind v4)
│   ├── templates/              # Email + page templates
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── instrumentation.ts      # OpenTelemetry + Sentry setup
│   └── proxy.ts                # Middleware (auth, i18n, routing)
├── tests/                      # E2E tests (Playwright)
├── docs/                       # Project documentation (this folder)
├── _bmad/                      # BMAD workflow system
├── package.json                # Dependencies & scripts
├── next.config.mjs             # Next.js 16 config
├── tsconfig.json               # TypeScript config
├── drizzle.config.ts           # Database config
├── vitest.config.mts           # Unit test config
├── playwright.config.ts        # E2E test config
├── eslint.config.mjs           # ESLint config
├── CLAUDE.md                   # AI development instructions
└── README.md                   # Project README
```

---

## App Router (`src/app/`)

```
app/
├── [locale]/                           # i18n locale prefix
│   ├── (unauth)/                       # PUBLIC pages
│   │   ├── (center)/                   # Centered layout
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── verify-email/expired/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   ├── auth-code-error/page.tsx
│   │   │   └── layout.tsx
│   │   ├── articles/page.tsx           # PSEO articles
│   │   ├── articles/[category]/page.tsx
│   │   ├── articles/[category]/[slug]/page.tsx
│   │   ├── changelog/page.tsx
│   │   ├── share/[token]/page.tsx      # Public share access
│   │   └── layout.tsx
│   │
│   ├── (auth)/                         # PROTECTED pages
│   │   ├── chat/page.tsx               # Chat selector
│   │   ├── chat/dify/page.tsx          # Dify chat
│   │   ├── chat/dify/[threadId]/page.tsx
│   │   ├── chat/vercel/page.tsx        # Vercel AI chat
│   │   ├── chat/vercel/[conversationId]/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── dashboard/user-profile/page.tsx
│   │   ├── dashboard/share-links/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── sign-out/page.tsx
│   │   ├── design-system/page.tsx      # Component showcase
│   │   ├── demo-share/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (admin)/                        # ADMIN pages
│   │   ├── admin/page.tsx              # Admin dashboard
│   │   ├── admin/analytics/page.tsx
│   │   ├── admin/audit/page.tsx
│   │   ├── admin/email/page.tsx
│   │   ├── admin/feedback/page.tsx
│   │   ├── admin/users/page.tsx
│   │   └── layout.tsx
│   │
│   ├── page.tsx                        # Homepage
│   ├── layout.tsx                      # Root layout
│   ├── error.tsx                       # Global error boundary
│   └── not-found.tsx
│
├── api/                                # API routes (37 endpoints)
│   ├── auth/callback/route.ts
│   ├── auth/verify-complete/route.ts
│   ├── chat/route.ts                   # Dify SSE proxy
│   ├── chat/messages/route.ts
│   ├── chat/vercel/route.ts            # Vercel AI SDK
│   ├── chat/vercel/conversations/route.ts
│   ├── chat/vercel/conversations/[id]/route.ts
│   ├── profile/                        # 5 profile routes
│   ├── feedback/route.ts
│   ├── threads/                        # 5 thread routes
│   ├── share/                          # 4 share routes
│   ├── email/welcome/route.ts
│   ├── admin/                          # 11 admin routes
│   ├── cron/memory-extraction/route.ts
│   └── og/route.tsx                    # Dynamic OG images
│
├── auth/callback/route.ts              # Supabase auth callback
├── global-error.tsx
├── robots.ts
├── sitemap.ts
└── sitemap.test.ts
```

---

## Libraries (`src/libs/`)

```
libs/
├── analytics/          # PostHog type-safe events
├── api/                # API error handling
│   ├── admin/          # Admin API utilities
│   ├── client/         # Client error parsing
│   └── errors/         # Server error builders
├── audit/              # Admin action logging
├── auth/               # isAdmin check
├── constants/          # App constants
├── dify/               # Dify AI chat client
├── email/              # Resend email service
│   └── templates/      # React Email templates
├── langfuse/           # LLM observability
├── mem0/               # Memory/context library
├── pseo/               # Page SEO utilities
├── queries/            # Database queries
├── seo/                # SEO metadata (OG, hreflang)
├── supabase/           # Auth (server/client/middleware)
├── utils/              # General utilities
├── vercel-ai/          # Vercel AI SDK config
├── DB.ts               # Database connection (PGlite dev / PG prod)
├── Env.ts              # T3 Env validation (Zod)
├── i18n.ts             # next-intl config
└── Logger.ts           # Pino + Logtail
```

---

## Components (`src/components/`)

```
components/
├── admin/              # Admin panel (30 files)
│   └── analytics/      # Dashboard charts
├── analytics/          # PostHog tracking (7)
├── auth/               # Auth buttons/toasts (6)
├── chat/               # Chat interfaces (16)
│   └── vercel/         # Vercel AI chat (3)
├── dashboard/          # Dashboard widgets (5)
├── errors/             # Error boundary (3)
├── feedback/           # Feedback modal (3)
├── layout/             # App shell/nav (6)
├── onboarding/         # Onboarding flow (8)
├── pseo/               # SEO components (7)
├── share/              # Share links (8)
├── theme/              # Dark mode (2)
└── ui/                 # shadcn primitives (37)
```

---

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Middleware | `src/proxy.ts` | i18n -> session -> auth -> verification -> admin check |
| App Root | `src/app/[locale]/layout.tsx` | Providers, theme, globals |
| API Gateway | `src/app/api/` | 37 API route handlers |
| DB Schema | `src/models/Schema.ts` | 9 tables in configurable schema (`DB_SCHEMA` env var) |
| Instrumentation | `src/instrumentation.ts` | OpenTelemetry + Sentry |
| Env Validation | `src/libs/Env.ts` | Runtime env validation (Zod) |
