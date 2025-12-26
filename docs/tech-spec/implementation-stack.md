# Implementation Stack

**Complete Technology Stack:**

**Frontend:**
- Next.js 14.2.25 (App Router, SSR/SSG, API Routes)
- React 18.3.1 (Server + Client Components)
- TypeScript 5.6.3 (Strict mode)
- Tailwind CSS 3.4.14 (Utility-first styling)
- Radix UI (Accessible primitives)
- shadcn/ui (Component library)
- Assistant UI 0.11.47 (**Thread management**)
- Lucide React 0.453.0 (Icons)
- next-themes 0.3.0 (Dark mode)

**Backend:**
- Next.js API Routes (Serverless functions)
- Drizzle ORM 0.35.1 (Type-safe queries)
- PostgreSQL (via Supabase)
- PGlite 0.2.12 (Local development)
- Zod 3.23.8 (Runtime validation)

**Authentication:**
- Supabase 2.86.0 (Auth provider + database)
- @supabase/ssr 0.1.0 (SSR support)
- JWT tokens (HTTP-only cookies)

**AI Integration:**
- Dify API (Custom health coaching AI)
- Server-side proxy pattern (API key security)
- SSE streaming for real-time responses

**Development Tools:**
- Vitest 2.1.9 (Unit tests)
- Playwright 1.48.1 (E2E tests)
- ESLint 8.57.1 + @antfu/eslint-config 2.27.3
- Prettier (Code formatting)
- Husky 9.1.6 (Git hooks)
- Commitizen 4.3.1 (Conventional commits)
- **@assistant-ui/react-devtools** (Runtime debugging - **NEW**)

**Monitoring & Logging:**
- Sentry 8.34.0 (Error tracking)
- Pino 9.5.0 (Structured logging)
- @logtail/pino 0.5.2 (Log aggregation)
- Checkly 4.9.0 (Uptime monitoring)

**Internationalization:**
- next-intl 3.21.1 (English, Hindi, Bengali)

**Deployment:**
- Vercel-compatible (serverless)
- GitHub Actions (CI/CD)
- Semantic Release (versioning)

---
