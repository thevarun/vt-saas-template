# Source Tree Analysis - HealthCompanion

**Generated:** 2025-12-04
**Project Type:** Web Application (Next.js 14 App Router)
**Scan Level:** Quick (Pattern-based)

## Directory Structure

```
HealthCompanion/
├── src/                           # Main source code directory
│   ├── app/                       # Next.js App Router (file-system routing)
│   │   ├── [locale]/              # Internationalized routes (en, hi, bn)
│   │   ├── api/                   # API Routes
│   │   │   └── chat/              # Dify AI proxy endpoint
│   │   └── auth/                  # Authentication routes
│   │       └── callback/          # Supabase auth callback
│   ├── components/                # Reusable React components
│   │   └── ui/                    # shadcn/ui + Radix UI components
│   ├── features/                  # Feature-specific modules
│   │   ├── landing/               # Landing page features
│   │   ├── auth/                  # Authentication features
│   │   └── dashboard/             # Dashboard features
│   ├── libs/                      # Third-party integrations & utilities
│   │   ├── supabase/              # Supabase client/server/middleware
│   │   ├── dify/                  # Dify AI integration
│   │   ├── DB.ts                  # Database connection (Drizzle ORM)
│   │   ├── Env.ts                 # Environment variables validation
│   │   ├── Logger.ts              # Pino logger setup
│   │   ├── i18n.ts                # next-intl configuration
│   │   └── i18nNavigation.ts      # Internationalized routing
│   ├── models/                    # Database schema definitions
│   │   └── Schema.ts              # Drizzle ORM schema
│   ├── styles/                    # Global styles
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── locales/                   # i18n translations
│   │   ├── en.json                # English translations
│   │   ├── hi.json                # Hindi translations
│   │   └── bn.json                # Bengali translations
│   ├── templates/                 # Email/notification templates
│   ├── hooks/                     # Custom React hooks
│   ├── middleware.ts              # Next.js middleware (auth + i18n)
│   └── instrumentation.ts         # Sentry instrumentation
│
├── public/                        # Static assets
│   └── assets/                    # Images, fonts, etc.
│       └── images/                # Image assets
│
├── migrations/                    # Database migrations
│   ├── meta/                      # Migration metadata
│   └── 0000_init-db.sql           # Initial schema migration
│
├── docs/                          # Project documentation
│   ├── tech-spec/                 # Technical specification
│   │   ├── index.md               # Tech spec overview
│   │   ├── context.md             # Project context
│   │   ├── implementation-*.md    # Implementation guides
│   │   └── developer-resources.md # Developer resources
│   ├── sprint-artifacts/          # Sprint planning & stories
│   │   ├── sprint-status.yaml     # Sprint tracking
│   │   ├── story-*.md             # User stories
│   │   └── epic-1-retro-*.md      # Epic retrospectives
│   ├── epics.md                   # Feature epics
│   ├── backlog.md                 # Product backlog
│   └── bmm-workflow-status.yaml   # BMM workflow tracking
│
├── tests/                         # Test files
│   ├── e2e/                       # Playwright E2E tests
│   └── integration/               # Integration tests
│       └── api/                   # API integration tests
│
├── .github/                       # GitHub configuration
│   └── workflows/                 # GitHub Actions CI/CD
│       ├── CI.yml                 # Continuous integration
│       ├── release.yml            # Semantic release
│       ├── crowdin.yml            # Translation sync
│       └── checkly.yml            # Monitoring checks
│
├── .husky/                        # Git hooks
├── .storybook/                    # Storybook configuration
├── .vscode/                       # VS Code workspace settings
│
├── package.json                   # Node dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── next.config.mjs                # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── drizzle.config.ts              # Drizzle ORM configuration
├── playwright.config.ts           # Playwright test configuration
├── vitest.config.mts              # Vitest test configuration
├── .env                           # Environment variables (public)
├── .env.local                     # Environment variables (private)
├── README.md                      # Project README
├── CLAUDE.md                      # Claude Code integration guide
├── AGENTS.md                      # Agent documentation
└── CHANGELOG.md                   # Version history
```

## Critical Directories Explained

### Entry Points

| File | Purpose |
|------|---------|
| `src/app/[locale]/layout.tsx` | Root layout with i18n and auth providers |
| `src/app/[locale]/page.tsx` | Landing page |
| `src/middleware.ts` | Request middleware (auth + i18n routing) |
| `src/app/api/chat/route.ts` | AI chat API endpoint |

### Core Architecture Components

#### Authentication Flow
- **Middleware**: `src/middleware.ts` - Route protection & session refresh
- **Supabase Client**: `src/libs/supabase/client.ts` - Client-side auth
- **Supabase Server**: `src/libs/supabase/server.ts` - Server-side auth (SSR)
- **Auth Callback**: `src/app/auth/callback/route.ts` - OAuth callback handler

#### AI Integration
- **Chat API**: `src/app/api/chat/route.ts` - Dify proxy endpoint (SSE streaming)
- **Dify Client**: `src/libs/dify/client.ts` - Dify API wrapper
- **Dify Config**: `src/libs/dify/config.ts` - API configuration

#### Database Layer
- **Schema**: `src/models/Schema.ts` - Drizzle ORM models
- **Connection**: `src/libs/DB.ts` - Database client
- **Migrations**: `migrations/` - SQL migration files

#### UI Components
- **Shared Components**: `src/components/` - Reusable React components
- **UI Library**: `src/components/ui/` - shadcn/ui + Radix components
- **Feature Components**: `src/features/*/` - Feature-specific components

### Development Patterns

**Routing Convention:**
- App Router with file-system routing
- Internationalized routes via `[locale]` directory
- API routes in `app/api/` directory
- Auth routes separate from main app

**Component Organization:**
- Shared components in `src/components/`
- Feature-specific components in `src/features/[feature]/`
- UI primitives in `src/components/ui/`

**State Management:**
- Server state via Next.js Server Components
- Client state via React hooks
- No centralized state library (Redux/MobX)

**Testing Structure:**
- E2E tests: `tests/e2e/` (Playwright)
- Integration tests: `tests/integration/` (Vitest)
- Component tests: Co-located with components

## Integration Points

### External Services
- **Supabase**: Authentication & Database
- **Dify AI**: Chat AI service (proxied via `/api/chat`)
- **Sentry**: Error tracking & monitoring
- **Logtail**: Log aggregation

### Build & Deployment
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel-compatible (no Dockerfile)
- **Database**: PostgreSQL (Supabase/Prisma Postgres)
- **Monitoring**: Checkly + Sentry

## Key File Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| `route.ts` | `src/app/**/` | Next.js API routes |
| `layout.tsx` | `src/app/**/` | Route layouts |
| `page.tsx` | `src/app/**/` | Route pages |
| `*.test.tsx` | Throughout `src/` | Component tests |
| `*.spec.ts` | `tests/e2e/` | E2E test specs |

## Notes

- **Quick Scan**: This analysis is pattern-based and does not include detailed code inspection
- **Multi-language**: Supports English, Hindi, and Bengali via next-intl
- **Type-safe**: Full TypeScript coverage with strict mode
- **Modular**: Feature-based organization for scalability
- **Well-documented**: Comprehensive tech spec and sprint artifacts
