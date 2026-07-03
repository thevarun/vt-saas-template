# Architecture

**Generated:** 2026-07-03 | Deep scan

## System type

VT SaaS Template is a **serverless full-stack monolith** on **Next.js 16 (App Router)**, deployed to **Vercel**. A single Next.js app serves everything: server-rendered marketing/app pages (RSC), Route Handler APIs, a background-job surface (Inngest + Vercel Cron), and static assets. There is no separate backend — persistence is **Supabase (Postgres + Auth)**, accessed via the Supabase JS client at runtime and **Drizzle** for schema-as-code/migrations.

The codebase is intentionally layered:

```
Request → proxy.ts (middleware) → app/ routes (RSC / Route Handlers)
                                        │
                                        ├── src/libs/*   (business logic, integrations, wrappers)
                                        │        └── src/models/  (Drizzle schema — source of truth)
                                        └── src/components / templates / features (UI)
```

Routes stay thin; anything reusable (auth wrappers, API error contract, email, SEO, AI clients, quota engine, background jobs) lives under `src/libs/` and is imported via the `@/` alias.

## Request lifecycle (middleware order)

The entrypoint is **`src/proxy.ts`**, matched on all non-asset, non-`/api`, non-`/auth` paths. It runs three stages **in strict order**:

1. **i18n** — `next-intl` resolves the locale (`en` default unprefixed, `hi`/`bn` prefixed; `localePrefix: 'as-needed'`) and produces the base `NextResponse`.
2. **Supabase session refresh** — `updateSession()` (`src/libs/supabase/middleware.ts`) creates a request/response-bound SSR client and calls `supabase.auth.getUser()` once, reading/writing auth cookies. This single call both refreshes the session and yields the auth check.
3. **Auth check** — for protected paths (`/dashboard`, `/onboarding`, `/chat`, `/admin`, `/settings`, matched as path segments after any locale prefix):
   - **Unauthenticated** → `/api/*` returns `401 {error, code:'AUTH_REQUIRED'}`; page routes redirect to the **landing page with the overlay auth dialog auto-opened** (`?auth=signin&redirect=<intended-path>`) via `redirectUnauthToLanding()`.
   - **Unverified email** → redirect to `/verify-email`.
   - **Non-admin on `/admin`** → redirect to `/dashboard?error=access_denied` (`isAdmin()` reads `app_metadata`/`ADMIN_EMAILS`, no DB hit).

`/api` and `/auth` are excluded from the matcher — API routes self-enforce auth via `withAuth` wrappers.

### Example flow — protected page, unauthenticated

```
Browser GET /settings?tab=billing
  → proxy.ts
      1. next-intl resolves locale (en)
      2. updateSession() → getUser() → null
      3. isProtectedRoute('/settings') = true, user = null
         → 307 → /?auth=signin&redirect=/settings?tab=billing
  → Landing page (RSC) renders inside (marketing) shell
      → AuthDialogAutoOpener reads ?auth → opens overlay dialog (Radix portal)
      → user signs in (Supabase) → redirected back to /settings?tab=billing
```

## Auth model

**Supabase SSR, cookie-based** (not Clerk). Client factories in `src/libs/supabase/`:

- **`server.ts`** — `createServerClient` bound to Next's `cookies()`; RSC + Route Handlers. Writes from Server Components are swallowed (middleware owns refresh).
- **`client.ts`** — `createBrowserClient`; Client Components.
- **`middleware.ts`** — request/response-bound client; the only place that refreshes the session.
- **`admin.ts`** — service-role singleton for privileged server work (crons, admin ops); bypasses RLS.
- **`cached-user.ts`** — request-cached `getUser` to avoid duplicate calls within a render.

All clients pin to the schema named by `DB_SCHEMA`/`NEXT_PUBLIC_DB_SCHEMA` (`vt_saas`) — never hardcoded. API routes/actions wrap handlers with `withAuth`/`withAdminAuth`/`withActionAuth`.

## Rendering strategy

- **RSC + SSR** by default. `[locale]` uses `generateStaticParams()` over `AllLocales`.
- **Theme FOUC prevention**: root layout injects an inline `<head>` script that stamps `.dark` + the selected theme onto `<html>` before first paint.
- **Marketing landing** is `export const dynamic = 'force-dynamic'`. pSEO blog pages render MDX from `content/blog/**`.
- Client interactivity (auth dialog, theme toggle, chat UI, dashboards) is isolated to `'use client'`; providers (`ThemeProvider`, `PostHogProvider`, `QueryProvider`, `NextIntlClientProvider`) wrap the tree in `[locale]/layout.tsx`.

## The two interchangeable chat stacks

Both live behind one `/chat` selector; nav hides whatever isn't configured. Selection is env-driven via **`src/utils/chatConfig.ts`** — `getChatConfig()` (server) reports `dify.configured` (needs `DIFY_API_URL` + `DIFY_API_KEY`) and `vercel.configured` (needs `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`); `getPublicChatConfig()` is the client-safe counterpart.

- **Dify** (`/chat/dify`, `src/app/api/chat/route.ts`) — server-side proxy to Dify. `withAuth`-gated, validates message/`conversation_id`, streams SSE, and via a `TransformStream` captures `conversation_id`/answer to fire-and-forget persist a `thread` row. The Dify key never reaches the client.
- **Vercel AI SDK** (`/chat/vercel`, `route.ts` + `conversations/*`) — full control via AI SDK 6 `streamText`, provider-agnostic (`src/libs/vercel-ai/`, OpenAI or Anthropic). Postgres-backed conversation/message persistence, optional **Mem0** memory injection and **Langfuse** tracing.

Shared **API-error contract** (`src/libs/api/errors` server, `src/libs/api/client` client): `{ error, code, details? }` with a fixed `ApiErrorCode` union. See [api-contracts.md](./api-contracts.md).

## Background job architecture

Two mechanisms coexist:

- **Inngest** (`src/app/api/inngest/route.ts` serves the functions) — the primary job runner. Functions in `src/libs/inngest/functions/`:
  - `scheduled-tasks` — cron that atomically **claims** due tasks (`src/libs/jobs/claim.ts`, `UPDATE…RETURNING`) and **fans out** one `vt-saas/task.process` event per task to a single-task worker, so each retries in isolation.
  - `token-refresh` — refreshes OAuth tokens in `platform_connections` expiring within a 30-day window, via the `OAuthProvider` seam (decrypt/re-encrypt through `src/libs/crypto/token-encryption`).
  - `force-expire-trials-and-promotions` + `trial-promotion-expiry-warnings` — reverse-trial lifecycle (no-op when `ENABLE_REVERSE_TRIAL` off; always registered so toggling needs no redeploy).
  - Registration is gated: only `VERCEL_ENV=production` or local `development` register functions — preview deploys stay empty.
- **Vercel Cron** (`vercel.json`) — one job hitting `/api/cron/memory-extraction` every 5 min, guarded by `CRON_SECRET`, draining the Mem0 extraction queue.

See [patterns/background-jobs.md](./patterns/background-jobs.md).

## Theming architecture

`next-themes`-based multi-theme system. **`src/components/theme/theme-config.ts`** is the type-safe registry: 4 groups (Default, Modern SaaS, Warm Sand, Sage Green) × light/dark = 8 `ThemeId`s, each mapping to a CSS class in `src/styles/global.css` using **OKLCH** palettes. `ThemeProvider` passes `ALL_THEME_IDS` + `system` to next-themes and includes `DarkClassSync` (keeps `.dark` on `<html>` for every `*-dark` theme so Tailwind `dark:` resolves). The inline head script prevents FOUC.

The **marketing shell has its own scoped theme**: the `(marketing)` layout applies `SITE_CONFIG.marketingTheme` as a CSS class over just that subtree (SSR'd), decoupling the landing look from the signed-in user's theme. Because Radix portals mount to `document.body` outside the shell, `MarketingThemeScope` mirrors the marketing theme class onto `body` so overlays inherit the palette — mirroring the admin panel's `[data-admin]` body-scope.

## i18n

**next-intl** with locales `en` (default, unprefixed), `hi`, `bn`. `AppConfig`/`AllLocales` (`src/utils/AppConfig.ts`) drive `localePrefix: 'as-needed'`. Server config in `src/libs/i18n.ts` (`getRequestConfig`) validates locale and loads `src/locales/<locale>.json`; `src/libs/i18nNavigation.ts` provides locale-aware navigation. Strings sync via **Crowdin** (`crowdin.yml`).

## Key architectural notes

- **Two auth-check surfaces, one model**: `proxy.ts` gates page/route access globally; `/api/*` is excluded from the matcher and self-guards via `withAuth`. Both rely on the same Supabase cookie session.
- **Unauth→landing overlay flow** is deliberate: protected-route redirects land on `/` with `?auth=signin&redirect=<path>`; the marketing shell's `AuthDialogAutoOpener` opens the dialog. Server-free helpers in `src/libs/auth/landing-auth-url.ts` keep this importable from middleware.
- **Fork seams are explicit**: `src/libs/actions/items.ts` + `queries/item.ts` + `hooks/use-item.ts` are a stubbed generic `item` entity exemplar a fork replaces; `config/site-config.ts` holds brand + `marketingTheme`.
- **Background jobs split by need**: durable/retryable work uses Inngest (memoized steps, fan-out); the single Mem0 drain uses a plain Vercel Cron endpoint.
- **Schema pinning everywhere**: every Supabase client sets `db.schema` from `(NEXT_PUBLIC_)DB_SCHEMA` — the `vt_saas` schema is never hardcoded.

**Related docs:** [source-tree-analysis.md](./source-tree-analysis.md) · [data-models.md](./data-models.md) · [api-contracts.md](./api-contracts.md) · [error-handling-guide.md](./error-handling-guide.md) · [subscriptions.md](./subscriptions.md) · [seo.md](./seo.md)
