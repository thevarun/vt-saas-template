# Architecture Documentation - HealthCompanion

**Generated:** 2025-12-04
**Scan Level:** Quick (Pattern-based)
**Project Type:** Web Application (Next.js 14)

## Executive Summary

HealthCompanion is a SaaS web application built on Next.js 14 with App Router, providing AI-powered health coaching through Dify integration. The application uses Supabase for authentication and database, with a component-based architecture following Next.js best practices.

**Key Characteristics:**
- **Architecture:** Monolithic web application
- **Framework:** Next.js 14 App Router
- **Language:** TypeScript (strict mode)
- **Primary Use Case:** AI health companion with chat interface
- **Deployment:** Vercel-compatible serverless

## Technology Stack

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 14.2.25 | React framework with SSR/SSG |
| UI Library | React | 18.3.1 | Component rendering |
| Styling | Tailwind CSS | 3.4.14 | Utility-first CSS |
| Components | Radix UI + shadcn/ui | Latest | Accessible component primitives |
| Icons | Lucide React | 0.453.0 | Icon library |
| Themes | next-themes | 0.3.0 | Dark mode support |

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Next.js API Routes | 14.2.25 | Serverless functions |
| Database ORM | Drizzle ORM | 0.35.1 | Type-safe database access |
| Database | PostgreSQL | Latest | Primary data store |
| Local DB | PGlite | 0.2.12 | Offline development |

### Authentication & User Management
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Auth Provider | Supabase | 2.86.0 | Authentication & session management |
| Auth Strategy | JWT + SSR | - | Server-side session handling |

### AI & Features
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| AI Service | Dify API | Custom | Chat-based AI assistant |
| Chat UI | Assistant UI | 0.11.47 | React chat interface with streaming |
| Payments | Stripe | 16.12.0 | Billing & subscriptions |
| i18n | next-intl | 3.21.1 | Internationalization (en, fr) |

### DevOps & Monitoring
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Error Tracking | Sentry | 8.34.0 | Error monitoring |
| Logging | Pino + Logtail | Latest | Application logging |
| Testing (Unit) | Vitest | 2.1.9 | Unit tests |
| Testing (E2E) | Playwright | 1.48.1 | End-to-end tests |
| CI/CD | GitHub Actions | - | Automated workflows |
| Monitoring | Checkly | Latest | Uptime & performance |

## Architecture Pattern

### Next.js App Router Architecture

HealthCompanion follows the **Next.js App Router** architectural pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Client Components (CSR)                      │   │
│  │  - Chat Interface (Assistant UI)                     │   │
│  │  - Interactive Forms                                │   │
│  │  - Client-side State                                │   │
│  └──────────────────┬──────────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────────┘
                      │ HTTP/SSE
┌─────────────────────┼──────────────────────────────────────┐
│                     ▼                                       │
│               Middleware Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/middleware.ts                                   │  │
│  │  - Session Refresh (Supabase)                        │  │
│  │  - Route Protection                                  │  │
│  │  - i18n Routing ([locale])                           │  │
│  └────────────┬────────────────────┬────────────────────┘  │
│               │                    │                        │
│    ┌──────────▼─────────┐  ┌──────▼───────────┐          │
│    │ Server Components  │  │  API Routes      │          │
│    │ (SSR)              │  │  (Serverless)    │          │
│    │                    │  │                  │          │
│    │ - Page Rendering   │  │ /api/chat        │          │
│    │ - Data Fetching    │  │  - Dify Proxy    │          │
│    │ - SEO Metadata     │  │  - SSE Streaming │          │
│    └────────────────────┘  │                  │          │
│                            │ /auth/callback   │          │
│                            │  - OAuth Handler │          │
│                            └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                      │
                      │ Database Queries
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Drizzle ORM (src/libs/DB.ts)                        │  │
│  │  - Type-safe queries                                 │  │
│  │  - Schema: src/models/Schema.ts                      │  │
│  │  - Migrations: migrations/                           │  │
│  └────────────┬─────────────────────────────────────────┘  │
│               │                                             │
│    ┌──────────▼─────────┐      ┌───────────────────────┐  │
│    │   PostgreSQL       │      │   Supabase Auth       │  │
│    │   (Production)     │      │   - User Management   │  │
│    │                    │      │   - Session Store     │  │
│    │   PGlite (Local)   │      │   - OAuth Providers   │  │
│    └────────────────────┘      └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Dify AI    │  │    Stripe    │  │   Sentry     │
│   Chat API   │  │   Payments   │  │   Errors     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Layered Architecture

**Presentation Layer:**
- React Server Components (RSC) for initial page render
- React Client Components for interactivity
- Component library: shadcn/ui + Radix UI
- Tailwind CSS for styling

**Application Layer:**
- Next.js middleware for cross-cutting concerns (auth, i18n)
- API routes for backend logic
- Server Actions for mutations (where applicable)

**Business Logic Layer:**
- Feature-based organization (`src/features/`)
- Shared utilities (`src/utils/`)
- Custom hooks (`src/hooks/`)

**Data Access Layer:**
- Drizzle ORM for type-safe database access
- Supabase client for authentication
- Third-party service clients (`src/libs/`)

## Data Architecture

### Database Schema

**ORM:** Drizzle ORM
**Schema Location:** `src/models/Schema.ts`
**Migrations:** `migrations/`

**Tables** (Pattern-based identification):
- Organization management (multi-tenancy)
- User profiles
- Todo items (example CRUD)
- Additional tables defined in Schema.ts

**Key Relationships:**
- User ↔ Organizations (many-to-many via memberships)
- Organization-scoped data

### Database Strategy

- **Development:** PGlite (embedded PostgreSQL)
- **Production:** PostgreSQL (Supabase/Prisma Postgres)
- **Migrations:** Auto-applied on startup (or manual via drizzle-kit)
- **Type Safety:** Full TypeScript types generated from schema

## API Design

### API Routes

**Base Path:** `/api/`

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/chat` | POST | AI chat proxy (Dify) | Required (Supabase session) |
| `/auth/callback` | GET | OAuth callback handler | Public |

### API Patterns

**Chat API (`/api/chat`):**
- **Input:** User message, conversation_id (optional)
- **Output:** Server-Sent Events (SSE) stream
- **Auth:** Validates Supabase session before proxying
- **Security:** API key hidden on server-side
- **Flow:**
  1. Validate user session
  2. Proxy request to Dify API
  3. Stream response via SSE
  4. Return conversation_id for context

**Auth Callback (`/auth/callback`):**
- **Purpose:** Handle OAuth provider callbacks
- **Flow:**
  1. Receive auth code
  2. Exchange for session (Supabase)
  3. Redirect to application

### External API Integrations

**Dify AI Integration:**
- **Location:** `src/libs/dify/client.ts`
- **Pattern:** Proxy via `/api/chat` (never expose key to client)
- **Features:** Streaming responses, conversation context

**Stripe Integration:**
- **Purpose:** Payment processing, subscription management
- **Pattern:** Server-side only (API routes)

## Component Architecture

### Component Organization

```
src/components/
├── ui/                    # shadcn/ui primitives (Radix)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dropdown-menu.tsx
│   └── ...
├── chat/                  # Chat-specific components
│   └── ChatInterface.tsx  # Assistant UI integration
└── [shared]/              # Other shared components
```

**Component Patterns:**
- **Server Components:** Default for static content, data fetching
- **Client Components:** For interactivity (`'use client'` directive)
- **Composition:** Small, reusable components
- **Props:** TypeScript interfaces for type safety

### State Management

**Philosophy:** No centralized state library (Redux/MobX)

**State Strategies:**
- **Server State:** Next.js Server Components (fetch on server)
- **Client State:** React hooks (`useState`, `useReducer`)
- **Form State:** React Hook Form + Zod validation
- **URL State:** Next.js router (search params, dynamic routes)
- **Global Client State:** Context API (where necessary)

### UI Component Library

**Design System:** shadcn/ui pattern
- Components copied into codebase (full control)
- Built on Radix UI primitives
- Styled with Tailwind CSS
- Accessible by default (ARIA compliant)

## Security Architecture

### Authentication Flow

**Provider:** Supabase Auth

```
1. User initiates login (email, OAuth, magic link)
   ↓
2. Redirect to Supabase hosted UI or OAuth provider
   ↓
3. Callback to /auth/callback with auth code
   ↓
4. Exchange code for session (JWT)
   ↓
5. Store session in HTTP-only cookie
   ↓
6. Middleware validates session on each request
   ↓
7. Auto-refresh before expiry
```

**Session Management:**
- **Storage:** HTTP-only cookies (secure)
- **Refresh:** Middleware handles auto-refresh
- **SSR:** Server-side session validation (`src/libs/supabase/server.ts`)
- **Client:** Client-side methods (`src/libs/supabase/client.ts`)

### Route Protection

**Middleware** (`src/middleware.ts`):
- Runs on every request
- Checks protected paths array
- Validates Supabase session
- Redirects unauthenticated users to `/sign-in`

**Protected Routes:**
- `/dashboard/*`
- `/onboarding/*`
- `/chat/*`
- `/api/*` (except public endpoints)

### Security Best Practices

- ✅ Environment variables for secrets (never in code)
- ✅ API keys server-side only (Dify, Stripe)
- ✅ HTTPS enforced (Vercel auto-SSL)
- ✅ CORS configured
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Drizzle ORM parameterized queries)
- ✅ XSS prevention (React escapes by default)
- ✅ CSRF protection (SameSite cookies)

## Deployment Architecture

### Hosting Strategy

**Platform:** Vercel (or compatible)

**Deployment Model:**
- **Serverless Functions:** API routes
- **Edge Functions:** Middleware
- **Static Assets:** CDN-distributed
- **ISR:** Incremental Static Regeneration for pages

### Build & Deploy Pipeline

**CI/CD:** GitHub Actions

**Workflows:**
1. **CI (`CI.yml`):** Lint, test, type-check on PRs
2. **Release (`release.yml`):** Semantic versioning on main
3. **Crowdin (`crowdin.yml`):** Translation sync
4. **Checkly (`checkly.yml`):** Monitoring checks

**Build Process:**
```
1. Install dependencies (npm install)
2. Run linters (ESLint)
3. Type check (TypeScript)
4. Run tests (Vitest + Playwright)
5. Build Next.js (npm run build)
6. Deploy to Vercel
```

### Scalability

**Horizontal Scaling:**
- Vercel auto-scales serverless functions
- No server state (stateless functions)
- Database connection pooling required

**Performance Optimizations:**
- Static page generation where possible
- Image optimization (Next.js Image component)
- Code splitting (automatic via Next.js)
- CDN for assets
- Lazy loading for heavy components

## Testing Strategy

### Test Pyramid

```
        ┌──────────────┐
        │     E2E      │  Playwright (integration/user flows)
        │   (Slow)     │
        ├──────────────┤
        │  Integration │  API route tests
        │   (Medium)   │
        ├──────────────┤
        │     Unit     │  Vitest + React Testing Library
        │    (Fast)    │  Component tests, utility tests
        └──────────────┘
```

**Unit Tests:**
- **Framework:** Vitest + React Testing Library
- **Location:** Co-located with source (`*.test.tsx`)
- **Coverage:** Components, utilities, business logic

**E2E Tests:**
- **Framework:** Playwright
- **Location:** `tests/e2e/`
- **Coverage:** Critical user flows (auth, chat, dashboard)

**Component Development:**
- **Storybook:** Visual testing & development

## Internationalization (i18n)

**Library:** next-intl
**Supported Locales:** English (en), French (fr)

**Architecture:**
- **Routing:** `/[locale]/` prefix pattern
- **Translations:** JSON files in `src/locales/`
- **Management:** Crowdin for collaborative translation
- **Auto-sync:** GitHub Actions workflow

## Error Handling & Monitoring

**Error Tracking:** Sentry
- Client-side errors
- Server-side errors
- Source maps for debugging

**Logging:** Pino + Logtail
- Structured JSON logs
- Log levels: error, warn, info, debug
- Production log aggregation

**Monitoring:** Checkly
- API endpoint health
- Page performance
- Uptime monitoring

## Development Workflow

### Local Development

```
npm install          # Install dependencies
npm run dev          # Start dev server
npm run db:studio    # Open Drizzle Studio
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
```

### Code Quality

- **Linting:** ESLint (Antfu config)
- **Formatting:** Prettier
- **Type Checking:** TypeScript strict mode
- **Git Hooks:** Husky (pre-commit, commit-msg)
- **Commits:** Conventional Commits (enforced)

## Future Considerations

_Note: Quick scan - detailed architectural decisions may require deep analysis_

**Potential Enhancements:**
- Caching layer (Redis) for API responses
- Real-time features (WebSockets for notifications)
- Analytics integration
- Advanced monitoring (APM)
- Multi-region deployment
- Database read replicas

## Appendices

### Related Documentation

- **Source Tree:** `source-tree-analysis.md`
- **Development Guide:** `development-guide.md`
- **Deployment Guide:** `deployment-guide.md`
- **Tech Spec:** `tech-spec/index.md`
- **Project Context:** `CLAUDE.md`

### Key Files Reference

| Purpose | Location |
|---------|----------|
| Next.js Config | `next.config.mjs` |
| TypeScript Config | `tsconfig.json` |
| Database Schema | `src/models/Schema.ts` |
| Drizzle Config | `drizzle.config.ts` |
| Tailwind Config | `tailwind.config.ts` |
| Middleware | `src/middleware.ts` |
| Supabase Client | `src/libs/supabase/` |
| Dify Integration | `src/libs/dify/` |

### Conventions

- **File Naming:** kebab-case for files, PascalCase for components
- **Import Paths:** Absolute imports with `@/` prefix
- **Component Exports:** Default export for components
- **API Routes:** Named exports for HTTP methods

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Scan Type:** Quick (Pattern-based)
**Confidence:** High (based on config files and project structure)

For more detailed architectural analysis, consider running a deep or exhaustive scan.
