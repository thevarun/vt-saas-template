# System Architecture

**Generated:** 2026-02-23 | **Scan Level:** Quick (rescan)
**Architecture:** Serverless Full-stack Monolith | **Framework:** Next.js 16 (App Router)

---

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router + Turbopack) | 16.1.6 |
| UI | React | 19.2.4 |
| Language | TypeScript (strict) | 5.9.3 |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.1.18 |
| Auth | Supabase SSR | 0.8.0 |
| Database | PostgreSQL + Drizzle ORM | 0.45.1 |
| AI (Dify) | Assistant UI + Dify API | 0.12.9 |
| AI (Vercel) | Vercel AI SDK + OpenAI/Anthropic | 6.0.86 |
| Validation | Zod v4 | 4.0.0 |
| Analytics | PostHog | 1.342.1 |
| Charts | Recharts | 2.15.4 |
| Email | Resend + React Email | 6.9.2 |
| Monitoring | Sentry + OpenTelemetry | 10.39.0 |
| i18n | next-intl | 4.8.2 |
| Memory | Mem0 | 2.2.2 |
| Observability | LangFuse | 3.38.6 |
| Unit Tests | Vitest | 4.0.17 |
| E2E Tests | Playwright | 1.58.1 |
| Visual Tests | Storybook 10 | 10.1.11 |
| CI/CD | GitHub Actions + semantic-release | - |
| Dev DB | PGlite (in-memory) | 0.3.15 |

---

## Architecture Pattern

**Serverless full-stack monolith** deployed on Vercel:
- Server-rendered pages (SSR/SSG) via App Router
- API routes for backend logic (serverless functions)
- Middleware for auth, i18n, and routing (`src/proxy.ts`)
- Component-based UI with shadcn/ui design system

---

## Request Flow

```
Client Request
    |
    v
[Next.js Middleware - src/proxy.ts]
    |-- 1. next-intl (locale detection/prefix)
    |-- 2. Supabase session update (cookie refresh)
    |-- 3. Protected route check → redirect to /sign-in if unauthenticated
    |-- 4. Email verification check → redirect to /verify-email if unverified
    |-- 5. Admin route check → redirect to /dashboard if not admin
    |
    v
[App Router - src/app/[locale]/]
    |-- (unauth)/ → Public pages (landing, auth, articles)
    |-- (auth)/   → Protected pages (dashboard, chat, onboarding)
    |-- (admin)/  → Admin pages (users, analytics, audit)
    |
    v
[API Routes - src/app/api/]
    |-- Auth validation (Supabase session check)
    |-- Zod request validation
    |-- Business logic
    |-- Drizzle ORM database operations
    |-- Response (JSON or SSE stream)
```

---

## Authentication Architecture

```
Supabase Auth (External)
    |
    |-- Email/Password signup → email verification
    |-- Social OAuth (Google, GitHub)
    |-- Magic link
    |
    v
[Server] createClient(cookies) → session
[Client] createClient() → browser session
[Middleware] updateSession() → cookie refresh
    |
    v
Admin Check: user.app_metadata.is_admin || ADMIN_EMAILS
```

**Key Files:**
- `src/proxy.ts` - Route protection middleware
- `src/libs/supabase/server.ts` - Server client
- `src/libs/supabase/client.ts` - Browser client
- `src/libs/supabase/middleware.ts` - Cookie management
- `src/libs/auth/isAdmin.ts` - Admin detection

---

## Data Architecture

```
[Supabase PostgreSQL]
    |
    |-- $DB_SCHEMA schema (configurable, e.g. vt_saas or public)
    |   |-- threads (Dify conversations)
    |   |-- userPreferences (settings)
    |   |-- feedback (user feedback)
    |   |-- adminAuditLog (admin actions)
    |   |-- vercelConversations + vercelMessages (AI SDK chat)
    |   |-- shareableLinks (share URLs)
    |   |-- mem0Memories + memoryExtractionJobs (memory)
    |
    |-- Row-Level Security (RLS) on threads, conversations
    |
    v
[Drizzle ORM] → src/models/Schema.ts
    |
    |-- Auto-migration on startup
    |-- PGlite for local development
```

**9 tables, 2 enums, 7 migrations**

---

## Chat Architecture (Dual Implementation)

### Dify Implementation
```
Browser → ChatInterface (Assistant-UI)
    |
    v
POST /api/chat → SSE Proxy
    |-- Validates session
    |-- Proxies to Dify API (API key stays server-side)
    |-- Streams SSE response
    |-- Fire-and-forget: saves thread with conversation_id
    |
    v
Dify API (external) → SSE stream → Client
```

### Vercel AI SDK Implementation
```
Browser → VercelChatInterface (useChat hook)
    |
    v
POST /api/chat/vercel → streamText()
    |-- Validates session
    |-- Loads memory context (Mem0)
    |-- Streams via Vercel AI SDK
    |-- LangFuse tracing
    |-- Saves messages + token counts
    |
    v
OpenAI/Anthropic API → SSE stream → Client
```

---

## Component Architecture

```
[Design System - src/components/ui/]
    |-- 37 shadcn/ui primitives (Radix UI)
    |-- Tailwind CSS v4 styling
    |-- Dark mode via next-themes
    |
    v
[Feature Components]
    |-- Admin (30) - User mgmt, analytics, audit, feedback
    |-- Chat (16) - Dify + Vercel implementations
    |-- Landing (9) - Hero, features, CTA
    |-- Onboarding (8) - Username, preferences, tour
    |-- Share (8) - Link generation, management
    |-- Dashboard (5) - Welcome, actions, profile
    |
    v
[Layouts]
    |-- MainAppShell - Collapsible sidebar, mobile Sheet
    |-- AdminLayoutClient - Admin sidebar
    |-- Centered layout - Auth forms
```

---

## Email Architecture

```
[Resend API]
    |
    v
src/libs/email/client.ts
    |-- Retry: 3 attempts, exponential backoff
    |-- Dev mode: console logging
    |-- React Email templates
    |
    v
sendEmail() / sendEmailAsync() (fire-and-forget)
```

---

## Analytics Architecture

```
[PostHog]
    |
    v
src/libs/analytics/
    |-- Type-safe event tracking
    |-- UTM parameter capture
    |-- Referral tracking
    |
    v
Components: PostHogProvider, LandingPageTracker, UserIdentifier

[LangFuse]
    |-- LLM call tracing via OpenTelemetry
    |-- Token usage, latency tracking
```

---

## SEO Architecture

- **Hreflang:** Auto-generated for en, hi, bn + x-default
- **OG Images:** Dynamic generation at `/api/og` (Edge Runtime)
- **Sitemap:** Auto-generated at `/sitemap.xml`
- **Robots.txt:** Auto-generated, protects /dashboard, /admin, /api
- **PSEO:** Article pages with structured data (breadcrumbs, schema.org)

---

## Security

- **Headers:** HSTS, X-Frame-Options DENY, nosniff, Permissions-Policy
- **Auth:** Centralized API auth infrastructure with server-side session validation
- **API Keys:** Never exposed to client (Dify, OpenAI via server proxy)
- **RLS:** Row-level security on database tables
- **Admin:** Double-check via metadata + ADMIN_EMAILS
- **Share Tokens:** 256-bit crypto-random, expiration support
- **CSRF:** SameSite cookies via Supabase SSR
- **Dependency Overrides:** Pinned axios, cookie, esbuild, glob for security patches
