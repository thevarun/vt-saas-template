# Source Tree Analysis

**Generated:** 2026-07-03 | Deep scan

Annotated directory tree. Entry points marked **[ENTRY]**.

```
vt-saas-template/
├── src/
│   ├── proxy.ts                         [ENTRY] Middleware: i18n → Supabase session refresh → auth/admin/verify gate
│   ├── instrumentation.ts               Sentry/OTel server + edge instrumentation hooks
│   │
│   ├── app/                             [ENTRY] Next.js App Router root
│   │   ├── global-error.tsx             Top-level error boundary
│   │   ├── robots.ts · sitemap.ts       SEO: robots.txt + multi-locale sitemap
│   │   ├── auth/                        Supabase auth callback handling (locale via query param)
│   │   │
│   │   ├── [locale]/                    [ENTRY] Locale-segmented app; generateStaticParams over en/hi/bn
│   │   │   ├── layout.tsx               Root shell: <html>, FOUC theme script, Theme/PostHog/Query/Intl providers
│   │   │   ├── error.tsx · not-found.tsx
│   │   │   ├── (unauth)/                Public route group
│   │   │   │   ├── (marketing)/         Marketing shell: navbar+footer+AuthDialogProvider, scoped marketingTheme
│   │   │   │   │   ├── page.tsx         Landing (Hero/Features/FAQ/CTA) + overlay AuthDialogAutoOpener
│   │   │   │   │   └── about · blog · changelog · terms · privacy
│   │   │   │   ├── (center)/            Centered-card auth pages: sign-in/up, forgot/reset-password,
│   │   │   │   │                        verify-email, dev-sign-in, auth-code-error
│   │   │   │   └── share/[token]/       Public share-link viewer
│   │   │   ├── (auth)/                  Protected route group (login required)
│   │   │   │   ├── dashboard/           User dashboard (share-links, user-profile)
│   │   │   │   ├── settings/ · onboarding/ · sign-out/
│   │   │   │   ├── chat/{dify,vercel}/  The two chat UIs behind the /chat selector
│   │   │   │   ├── demo-share/ · design-system/   Template exemplars
│   │   │   └── (admin)/admin/           Admin-only: users, analytics, audit, email, feedback
│   │   │
│   │   └── api/                         [ENTRY] Route Handlers (excluded from proxy; self-auth via withAuth)
│   │       ├── chat/route.ts            Dify SSE proxy (+ thread persistence)
│   │       ├── chat/messages/           Dify thread messages
│   │       ├── chat/vercel/             Vercel AI SDK streaming + conversations/[id]
│   │       ├── inngest/route.ts         Inngest function server (registers all cron functions)
│   │       ├── cron/memory-extraction/  Vercel Cron endpoint (CRON_SECRET-gated Mem0 worker)
│   │       ├── auth/                    OAuth callback/[provider], connect/[provider], dev-login, verify-complete
│   │       ├── admin/                   users, analytics, feedback (bulk/export)
│   │       ├── profile/ · subscriptions/usage · threads/[id] · share/[token]
│   │       ├── stripe/webhook · feedback · email/welcome · ai/example
│   │
│   ├── libs/                            Business logic, integrations, cross-cutting wrappers (imported via @/)
│   │   ├── supabase/                    Client factories: server, client, admin, middleware, cached-user; gen'd types
│   │   ├── DB.ts                        Drizzle connection (pg Pool prod / PGlite dev), hot-reload-safe singleton
│   │   ├── auth/                        isAdmin, safe-path open-redirect guards, landing-auth-url, post-auth destination
│   │   ├── api/                         Route wrappers (withAuth/withAdminAuth/withWebhookSecret), errors, client, rateLimit
│   │   │   ├── errors/                  Canonical {error,code,details} contract + typed builders + Sentry logging
│   │   │   └── client/                  parseApiError/getErrorMessage (frontend)
│   │   ├── dify/                        Dify SSE client, config (graceful degradation), types → powers /api/chat
│   │   ├── vercel-ai/                   AI SDK provider client (OpenAI/Anthropic resolver), config, types
│   │   ├── ai/                          AI-quota vocabulary over quota engine, prompts, schemas, Langfuse telemetry
│   │   ├── mem0/                        Long-term memory: client, extraction queue, cron worker, retrieval
│   │   ├── langfuse/                    LLM-observability config gate
│   │   ├── search/                      Web search barrel (Tavily/Perplexity), Jina reader
│   │   ├── inngest/                     Client + cron functions: scheduled-tasks, token-refresh, trial expiry
│   │   ├── jobs/                        Scheduled-task primitives: atomic claim, blocking, row types
│   │   ├── platforms/                   OAuth connection layer: OAuthProvider seam, encrypted token storage, health
│   │   ├── crypto/                      AES-256-GCM token encryption for secrets at rest
│   │   ├── email/                       Resend client w/ retry+logging, persona senders, React email templates
│   │   ├── preferences/                 User email-preferences read/write
│   │   ├── audit/                       logAdminAction → admin_audit_log
│   │   ├── stripe/                      Lazy Stripe SDK singleton
│   │   ├── subscriptions/               Product-agnostic quota engine: period usage, tier resolution, quota cache
│   │   ├── queries/                     TanStack Query fetchers + DB queries (typo-proof key namespace)
│   │   ├── actions/                     Server Actions (item stub exemplar, billing, subscriptions) → ActionResult<T>
│   │   ├── validations/                 Shared Zod validators (chat, username)
│   │   ├── seo/                         hreflang, OpenGraph, JSON-LD (XSS-safe), config/constants
│   │   ├── pseo/                        Programmatic-SEO MDX blog engine (content/blog/**)
│   │   ├── analytics/                   PostHog event tracking (client init, server singleton, activation/referral)
│   │   ├── keyboard/                    Product-neutral keyboard-shortcut registry + binder
│   │   ├── tours/                       driver.js product tour hook
│   │   ├── hooks/ · utils/ · constants/
│   │   ├── i18n.ts · i18nNavigation.ts  next-intl request config + locale-aware navigation
│   │   ├── Env.ts                       t3-env + Zod validated environment schema (graceful-degradation optionals)
│   │   └── Logger.ts                    Pino logger → BetterStack/Logtail or pretty console
│   │
│   ├── models/                          Drizzle schema-as-code (source of truth for DB)
│   │   ├── Schema.ts                    Barrel re-export of schema/*
│   │   └── schema/                      threads, vercel-chat, subscription-tiers/tier-quotas/user-subscriptions,
│   │                                    resource-usage, platform-connections, share-links, scheduled-tasks,
│   │                                    feedback, audit, preferences, stripe-webhook-events, _db-schema
│   ├── components/                      React UI (43 shadcn/ui primitives in ui/)
│   │   ├── marketing/                   Navbar, footer, overlay auth-dialog, marketing-theme-scope, nav-config
│   │   ├── theme/                       ThemeProvider (DarkClassSync), ThemeToggle, theme-config (8-theme OKLCH registry)
│   │   ├── auth/ · dashboard/ · chat/ · admin/ · settings/ · onboarding/
│   │   ├── analytics/ · providers/ · errors/ · feedback/ · share/ · subscriptions/
│   │   ├── blog/ · pseo/ · legal/ · layout/ · ui/
│   ├── features/landing/               Landing section building blocks (Hero, FeatureCard, CTABanner, ...)
│   ├── templates/                      Composed marketing sections (Hero, Features, FAQ, CTA, Logo)
│   ├── config/site-config.ts           Brand identity + marketingTheme (fork customization point)
│   ├── stores/                         Zustand stores (editor, entity-dialog, keyboard-shortcut)
│   ├── hooks/                          App-level React hooks (useUser, useOAuth, username validation)
│   ├── locales/                        en.json (default) · hi.json · bn.json (Crowdin-synced)
│   ├── styles/global.css               Tailwind 4 + per-theme OKLCH token blocks + [data-admin] scope
│   ├── types/ · utils/                 Shared types (Auth, Enum, shareLink); AppConfig, chatConfig, Helpers
│   │
├── migrations/                         Drizzle SQL migrations (0000–0005) + meta/_journal.json (journal-driven)
├── supabase/                           Supabase local config/seed + prod-setup.sql (grants, RLS, triggers, cross-schema FKs)
├── content/blog/                       MDX blog posts (pSEO source)
├── tests/                              Playwright E2E (e2e/, integration/, accessibility.spec, seo.spec)
├── docs/                               Reference docs (this file, architecture.md, per-subsystem guides)
├── .github/workflows/                  CI.yml, release.yml, claude-code-review, claude, docs-sync, changelog-sync,
│                                       pr-title-lint, dependabot-auto-merge
├── .claude/                            Rules (database/platforms/blog), skills, commands, worktrees
├── scripts/                            Build/DB/ops scripts
├── vercel.json                         Declares the memory-extraction cron
└── drizzle.config.ts · next.config.mjs · vitest.config.mts · playwright.config.ts · .nvmrc (Node 22)
```

## Critical directories at a glance

| Directory | Purpose |
|---|---|
| `src/proxy.ts` | The single middleware entry — locale, session refresh, auth gate |
| `src/app/[locale]/` | All user-facing pages, grouped by `(unauth)` / `(auth)` / `(admin)` |
| `src/app/[locale]/(unauth)/(marketing)/` | Marketing shell (landing, blog, legal) with its own scoped theme |
| `src/app/api/` | All Route Handlers; self-guard via `withAuth`; two chat stacks + inngest + cron |
| `src/libs/` | Business logic & integrations — the bulk of reusable code |
| `src/libs/supabase/` | Auth client factories (server/client/middleware/admin) |
| `src/libs/api/` | Route wrappers + canonical error contract |
| `src/libs/inngest/` + `src/libs/jobs/` | Background jobs (claim/fan-out, token refresh, trial expiry) |
| `src/libs/subscriptions/` | Product-agnostic quota engine |
| `src/models/schema/` | Drizzle schema modules — the DB source of truth |
| `migrations/` | Journal-driven SQL migrations |
| `supabase/prod-setup.sql` | Grants, RLS policies, triggers, cross-schema FKs (not expressible in Drizzle) |
| `src/components/` | UI: shadcn primitives (`ui/`) + feature components by domain |
| `src/config/site-config.ts` | Fork customization point (brand + marketing theme) |

## Fork seams (deliberate exemplars a downstream product replaces)

- `src/libs/actions/items.ts` + `src/libs/queries/item.ts` + `src/hooks/use-item.ts` — a stubbed generic `item` entity showing the action → query → hook data pattern.
- `src/config/site-config.ts` — brand identity + `marketingTheme`.
- `src/app/[locale]/(auth)/design-system/` — living design-system exemplar.
