# Context

## Available Documents

**Brownfield Project Documentation:**
Successfully loaded comprehensive project documentation via INDEX_GUIDED strategy:

- ✅ **index.md** - Project documentation index with navigation
- ✅ **project-overview.md** - High-level summary, purpose, tech stack, and getting started
- ✅ **architecture.md** - Complete system architecture including tech stack, patterns, security, deployment
- ✅ **source-tree-analysis.md** - Annotated directory structure with critical paths and conventions
- ✅ **development-guide.md** - Development setup, commands, testing, git workflow, troubleshooting

**Product Brief & Research:**
- ○ No product brief files found
- ○ No research documents found

This brownfield project has extensive existing documentation covering architecture, patterns, and development workflows - providing solid foundation for implementation.

## Project Stack

**Framework & Runtime:**
- **Next.js** 14.2.25 - React framework with App Router, SSR/SSG capabilities
- **React** 18.3.1 - UI library for component rendering
- **Node.js** 20+ - Runtime environment
- **TypeScript** 5.6.3 - Type-safe development with strict mode

**Frontend Stack:**
- **Tailwind CSS** 3.4.14 - Utility-first CSS framework
- **Radix UI** (multiple packages) - Accessible component primitives
- **shadcn/ui** - Component library built on Radix (copied into codebase)
- **Lucide React** 0.453.0 - Icon library
- **next-themes** 0.3.0 - Dark mode support
- **Assistant UI** 0.11.47 - Chat interface with streaming support (CRITICAL for this feature)
- **@assistant-ui/react-markdown** 0.11.6 - Markdown rendering in chat

**Backend & Data:**
- **PostgreSQL** - Production database (via Supabase)
- **Drizzle ORM** 0.35.1 - Type-safe database queries and schema management
- **PGlite** 0.2.12 - Embedded PostgreSQL for local development
- **Supabase** 2.86.0 - Authentication provider and database hosting
- **@supabase/ssr** 0.1.0 - Server-side rendering support for auth

**AI Integration:**
- **Dify API** (custom) - Chat AI service for health coaching
- Custom Dify client wrapper in `src/libs/dify/client.ts`
- Proxy pattern via `/api/chat` to keep API key server-side

**Development Tools:**
- **Vitest** 2.1.9 - Unit testing framework with React Testing Library
- **Playwright** 1.48.1 - End-to-end testing
- **ESLint** 8.57.1 with **@antfu/eslint-config** 2.27.3 - Linting (no semicolons, single quotes)
- **Prettier** - Code formatting (integrated with ESLint)
- **Husky** 9.1.6 - Git hooks for pre-commit linting
- **Commitizen** 4.3.1 - Conventional commits

**Monitoring & Logging:**
- **Sentry** 8.34.0 - Error tracking and monitoring
- **Pino** 9.5.0 - Structured logging
- **@logtail/pino** 0.5.2 - Log aggregation
- **Checkly** 4.9.0 - Uptime and performance monitoring

**Internationalization:**
- **next-intl** 3.21.1 - i18n support for English, Hindi, Bengali

## Existing Codebase Structure

**Architecture Pattern:** Next.js App Router with Serverless Functions

**Directory Organization:**
```
src/
├── app/[locale]/              # App Router with i18n
│   ├── (unauth)/              # Public pages (landing)
│   ├── (auth)/                # Protected pages
│   │   ├── (center)/          # Centered auth pages (sign-in, sign-up)
│   │   └── dashboard/         # Dashboard (WILL BE MODIFIED)
│   ├── (chat)/
│   │   └── chat/              # Current chat page (WILL BE REPLACED)
│   └── api/
│       └── chat/              # Dify proxy endpoint (WILL BE MODIFIED)
├── components/                # Reusable React components
│   ├── ui/                    # shadcn/ui primitives (Button, Input, etc.)
│   └── chat/                  # Chat-specific components (WILL BE EXPANDED)
├── features/                  # Feature modules
│   ├── landing/
│   ├── auth/
│   └── dashboard/             # Dashboard features (WILL BE ENHANCED)
├── libs/                      # Third-party integrations
│   ├── supabase/              # Supabase client/server/middleware
│   ├── dify/                  # Dify AI client
│   ├── DB.ts                  # Database connection (Drizzle)
│   └── Env.ts                 # Environment validation
├── models/
│   └── Schema.ts              # Drizzle ORM schema (WILL BE MODIFIED)
├── locales/                   # i18n translations (en, hi, bn)
├── middleware.ts              # Auth + i18n middleware
└── utils/                     # Utility functions
```

**Key Integration Points:**
- **Authentication:** Middleware (`src/middleware.ts`) handles session refresh and route protection
- **Database:** Drizzle ORM with auto-migrations on startup
- **API Routes:** Serverless functions in `app/api/`
- **Chat:** Current implementation at `app/[locale]/(chat)/chat/` using Assistant UI
- **Supabase Database:** Shared across multiple projects (requires dedicated schema)

**Existing Code Patterns:**
- File-system based routing via App Router
- Server Components by default, Client Components with `'use client'` directive
- Absolute imports with `@/` prefix (configured in tsconfig.json)
- Component files use PascalCase, utilities use camelCase
- API routes export named HTTP method handlers (GET, POST, etc.)
- Type safety enforced with TypeScript strict mode

**Current Chat Implementation:**
- Location: `src/app/[locale]/(chat)/chat/page.tsx`
- Uses Assistant UI `@assistant-ui/react` for chat interface
- Proxies to Dify API via `/api/chat` endpoint
- Already accepts `conversationId` parameter (optional)
- Current limitation: Single conversation only, no thread management

**Database Schema Location:**
- **File:** `src/models/Schema.ts`
- **ORM:** Drizzle ORM with PostgreSQL
- **Migrations:** Auto-applied on app start (or manual via `npm run db:migrate`)
- **Current State:** Minimal schema, primarily relies on Supabase Auth for user management

---
