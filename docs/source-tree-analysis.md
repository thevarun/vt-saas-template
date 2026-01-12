# VT SaaS Template - Source Tree Analysis

**Generated:** 2026-01-02
**Project Type:** Full-stack Next.js Web Application
**Structure:** Monolith

---

## Table of Contents

1. [Root Directory Structure](#root-directory-structure)
2. [Source Directory (`src/`)](#source-directory-src)
3. [Critical Directories](#critical-directories)
4. [Entry Points](#entry-points)
5. [Configuration Files](#configuration-files)
6. [Build & Output Directories](#build--output-directories)

---

## Root Directory Structure

```
vt-saas-template/
├── .github/                 # GitHub-specific configuration
│   └── workflows/          # GitHub Actions CI/CD
├── .husky/                 # Git hooks (pre-commit, commit-msg)
├── .storybook/             # Storybook configuration
├── _bmad/                  # BMAD workflow configuration
│   ├── bmm/               # BMM modules and workflows
│   └── core/              # BMAD core workflows
├── docs/                   # Project documentation
│   ├── archive/           # Archived documentation
│   └── *.md              # Generated documentation
├── migrations/             # Database migrations (Drizzle)
├── public/                 # Static assets (served as-is)
│   ├── assets/           # Images, icons, etc.
│   └── apple-touch-icon.png
├── src/                    # Application source code ⭐ PRIMARY
├── tests/                  # E2E test files (Playwright)
├── vitest-setup.ts        # Vitest configuration
├── next.config.mjs        # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Project dependencies
└── README.md              # Project README
```

### Directory Purpose Summary

| Directory | Purpose | Generated | Committed |
|-----------|---------|-----------|-----------|
| `.github/` | GitHub Actions, PR templates | No | Yes |
| `.husky/` | Git hooks for code quality | No | Yes |
| `.next/` | Next.js build output | Yes | No |
| `.storybook/` | Storybook config | No | Yes |
| `_bmad/` | BMAD workflow system | No | Yes |
| `docs/` | Project documentation | Partial | Yes |
| `migrations/` | Database migrations | Yes | Yes |
| `node_modules/` | npm dependencies | Yes | No |
| `public/` | Static assets | No | Yes |
| `src/` | Application code | No | Yes |
| `tests/` | E2E tests | No | Yes |

---

## Source Directory (`src/`)

The `src/` directory contains all application source code, organized by feature and function.

```
src/
├── app/                    # Next.js App Router (pages + API)
│   ├── [locale]/          # Internationalized routes
│   │   ├── (auth)/        # Protected pages (dashboard, onboarding)
│   │   ├── (chat)/        # Chat interface (protected)
│   │   ├── (unauth)/      # Public pages (landing)
│   │   ├── layout.tsx     # Root locale layout
│   │   └── not-found.tsx  # 404 page
│   ├── api/               # API Routes (serverless functions)
│   │   ├── chat/          # Chat proxy to Dify
│   │   └── threads/       # Thread CRUD operations
│   ├── auth/              # Auth callback handlers
│   │   └── callback/      # OAuth callback route
│   ├── layout.tsx         # Root app layout
│   └── sitemap.ts         # Sitemap generation
├── components/             # Reusable React components
│   ├── chat/              # Chat-specific components
│   ├── layout/            # Layout components
│   ├── ui/                # shadcn/ui components
│   └── *.tsx              # Shared components
├── features/              # Feature-based modules
│   ├── auth/              # Authentication features
│   ├── dashboard/         # Dashboard features
│   └── landing/           # Landing page features
├── hooks/                 # Custom React hooks
├── libs/                  # Third-party integrations
│   ├── dify/              # Dify AI client
│   └── supabase/          # Supabase clients
├── locales/               # i18n translation files
│   ├── en.json            # English
│   ├── hi.json            # Hindi
│   └── bn.json            # Bengali
├── models/                # Database schemas (Drizzle ORM)
│   └── Schema.ts          # Table definitions
├── styles/                # Global styles
│   └── global.css         # Tailwind imports + custom CSS
├── templates/             # Page templates
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
│   ├── AppConfig.ts       # App configuration
│   ├── Helpers.ts         # Helper functions
│   └── Logger.ts          # Logging utilities
└── middleware.ts          # Edge middleware (auth + i18n) ⭐ ENTRY POINT
```

---

## Critical Directories

### 1. `src/app/` - Application Routes & API

**Purpose:** Next.js App Router - all pages and API endpoints

**Structure:**
```
app/
├── [locale]/               # Locale-aware pages
│   ├── (auth)/            # Route group: Protected pages
│   │   ├── dashboard/
│   │   │   └── page.tsx   # /[locale]/dashboard
│   │   └── onboarding/
│   │       └── page.tsx   # /[locale]/onboarding
│   ├── (chat)/            # Route group: Chat interface
│   │   └── chat/
│   │       ├── page.tsx   # /[locale]/chat - Main chat UI
│   │       └── layout.tsx # Chat-specific layout (sidebar)
│   └── (unauth)/          # Route group: Public pages
│       └── page.tsx       # /[locale]/ - Landing page
└── api/                   # API Routes (no locale prefix)
    ├── chat/
    │   ├── route.ts       # POST /api/chat - AI chat proxy
    │   └── messages/
    │       └── route.ts   # GET /api/chat/messages
    └── threads/
        ├── route.ts       # GET/POST /api/threads
        └── [id]/
            ├── route.ts   # GET/PUT/DELETE /api/threads/:id
            └── archive/
                └── route.ts # POST /api/threads/:id/archive
```

**Key Files:**
- **`[locale]/layout.tsx`** - Root locale layout (providers, fonts)
- **`api/chat/route.ts`** - AI chat proxy endpoint ⭐ CRITICAL
- **`api/threads/route.ts`** - Thread management API

**Route Groups:**
- **(auth)** - Applies auth layout, requires authentication
- **(chat)** - Applies chat layout with sidebar
- **(unauth)** - Public pages, no auth required

### 2. `src/components/` - UI Components

**Purpose:** Reusable React components

**Organization:**
```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx        # Button component
│   ├── input.tsx         # Input component
│   ├── dialog.tsx        # Dialog/modal component
│   ├── form.tsx          # Form components
│   ├── toast.tsx         # Toast notifications
│   ├── tooltip.tsx       # Tooltip component
│   ├── dropdown-menu.tsx # Dropdown menus
│   ├── separator.tsx     # Separator line
│   ├── sheet.tsx         # Slide-out sheet
│   ├── skeleton.tsx      # Loading skeletons
│   ├── table.tsx         # Table components
│   ├── data-table.tsx    # Enhanced data table
│   ├── badge.tsx         # Badge component
│   ├── label.tsx         # Label component
│   ├── accordion.tsx     # Accordion component
│   └── toaster.tsx       # Toast container
├── chat/                 # Chat-specific components
│   ├── AppShell.tsx      # Chat layout wrapper
│   ├── ChatInterface.tsx # Main chat UI ⭐ CRITICAL
│   ├── ThreadListSidebar.tsx # Thread sidebar
│   ├── ThreadItem.tsx    # Single thread item
│   ├── ThreadView.tsx    # Thread display area
│   ├── ThreadTitleEditor.tsx # Inline title editor
│   ├── Thread.tsx        # Thread wrapper
│   ├── EmptyThreadState.tsx # Empty state UI
│   ├── ErrorThreadState.tsx # Error state UI
│   ├── ThreadListSkeleton.tsx # Loading skeleton
│   └── TypingIndicator.tsx # Typing animation
├── layout/               # Layout components
│   ├── MainAppShell.tsx  # Main app layout
│   └── NavItem.tsx       # Navigation item
├── ActiveLink.tsx        # Active link wrapper
├── Background.tsx        # Background gradient
├── LocaleSwitcher.tsx    # Language switcher
└── ToggleMenuButton.tsx  # Menu toggle button
```

**Component Count:** 38+ components

**Key Components:**
- **ChatInterface.tsx** - Integrates Assistant UI, handles streaming
- **ThreadListSidebar.tsx** - Thread management sidebar
- **MainAppShell.tsx** - Main application shell with navigation

### 3. `src/features/` - Feature Modules

**Purpose:** Feature-based code organization

**Structure:**
```
features/
├── auth/
│   ├── SignInForm.tsx       # Sign-in form component
│   ├── SignUpForm.tsx       # Sign-up form component
│   └── AuthContext.tsx      # Auth context provider (if exists)
├── dashboard/
│   ├── DashboardContent.tsx # Dashboard page content
│   └── DashboardStats.tsx   # Dashboard statistics
└── landing/
    ├── Hero.tsx             # Landing hero section
    ├── Features.tsx         # Features section
    └── CTA.tsx              # Call-to-action section
```

**Design Pattern:** Each feature is self-contained with related components, hooks, and utilities.

### 4. `src/libs/` - Integration Layer

**Purpose:** Third-party service integrations

**Structure:**
```
libs/
├── dify/
│   └── client.ts           # Dify API wrapper ⭐ CRITICAL
│       # - chatMessages() - Send chat message with streaming
│       # - getMessages() - Fetch message history
│       # Handles SSE streaming, timeout, API key
└── supabase/
    ├── client.ts           # Browser Supabase client
    ├── server.ts           # Server Supabase client ⭐ CRITICAL
    └── middleware.ts       # Middleware session helper
        # Different clients for different contexts:
        # - Browser: createBrowserClient()
        # - Server: createClient(cookieStore)
        # - Middleware: createServerClient()
```

**Key Responsibilities:**
- **Dify:** AI chat streaming, conversation management
- **Supabase:** Authentication, database access, session management

### 5. `src/models/` - Database Schema

**Purpose:** Drizzle ORM schema definitions

**Files:**
```
models/
└── Schema.ts               # Database table definitions ⭐ CRITICAL
    # Defines:
    # - healthCompanionSchema (PostgreSQL schema)
    # - threads table (uuid, userId, conversationId, etc.)
    # - Indexes for performance
```

**Schema:** `health_companion`
**Tables:** `threads`

### 6. `src/locales/` - Internationalization

**Purpose:** i18n translation files

**Structure:**
```
locales/
├── en.json                 # English translations
├── hi.json                 # Hindi translations
└── bn.json                 # Bengali translations
```

**Usage:** Loaded by next-intl based on URL locale (`/en/`, `/hi/`, `/bn/`)

### 7. `src/utils/` - Utilities

**Purpose:** Shared utility functions and configuration

**Files:**
```
utils/
├── AppConfig.ts            # App configuration ⭐ CRITICAL
│   # - Locales: ['en', 'hi', 'bn']
│   # - Default locale: 'en'
│   # - App name, description, URLs
├── Helpers.ts              # Helper functions
│   # - getBaseUrl()
│   # - String utilities
│   # - Data transformations
└── Logger.ts               # Logging utilities
    # - Pino logger configuration
    # - Log levels
    # - Logtail integration
```

---

## Entry Points

### Application Entry Points

1. **`src/middleware.ts`** ⭐ PRIMARY ENTRY POINT
   - **Runs:** On every request (edge runtime)
   - **Purpose:** i18n routing, session refresh, auth protection
   - **Flow:**
     1. Apply i18n middleware (locale detection/routing)
     2. Update Supabase session cookies
     3. Check if route is protected
     4. Validate user session
     5. Redirect if unauthorized

2. **`src/app/layout.tsx`**
   - **Runs:** Root layout for all pages
   - **Purpose:** HTML shell, global providers
   - **Includes:** Font setup, metadata, theme provider

3. **`src/app/[locale]/layout.tsx`**
   - **Runs:** Locale-specific layout
   - **Purpose:** i18n providers, locale-specific setup
   - **Includes:** next-intl provider, locale metadata

### Page Entry Points

| Route | File | Auth | Description |
|-------|------|------|-------------|
| `/` | `app/[locale]/(unauth)/page.tsx` | No | Landing page |
| `/dashboard` | `app/[locale]/(auth)/dashboard/page.tsx` | Yes | User dashboard |
| `/chat` | `app/[locale]/(chat)/chat/page.tsx` | Yes | Chat interface |
| `/onboarding` | `app/[locale]/(auth)/onboarding/page.tsx` | Yes | Onboarding flow |

### API Entry Points

| Endpoint | File | Method | Purpose |
|----------|------|--------|---------|
| `/api/chat` | `app/api/chat/route.ts` | POST | AI chat proxy |
| `/api/chat/messages` | `app/api/chat/messages/route.ts` | GET | Message history |
| `/api/threads` | `app/api/threads/route.ts` | GET, POST | Thread list/create |
| `/api/threads/[id]` | `app/api/threads/[id]/route.ts` | GET, PUT, DELETE | Thread CRUD |
| `/api/threads/[id]/archive` | `app/api/threads/[id]/archive/route.ts` | POST | Archive thread |

---

## Configuration Files

### Build & Framework Configuration

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js configuration (plugins, env vars, rewrites) |
| `tsconfig.json` | TypeScript compiler options (strict mode, paths) |
| `tailwind.config.ts` | Tailwind CSS configuration (theme, plugins) |
| `postcss.config.mjs` | PostCSS configuration (Tailwind, autoprefixer) |
| `drizzle.config.ts` | Drizzle ORM configuration (DB connection, migrations) |

### Development Tools

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest test runner configuration |
| `vitest-setup.ts` | Vitest global setup (testing-library) |
| `playwright.config.ts` | Playwright E2E test configuration |
| `.storybook/main.ts` | Storybook configuration |
| `.storybook/preview.ts` | Storybook global decorators |

### Code Quality

| File | Purpose |
|------|---------|
| `eslint.config.js` | ESLint rules (Antfu config) |
| `.prettierrc` | Prettier formatting rules |
| `commitlint.config.js` | Commit message linting |
| `.husky/pre-commit` | Pre-commit hooks (lint-staged) |
| `.husky/commit-msg` | Commit message validation |

### Package Management

| File | Purpose |
|------|---------|
| `package.json` | npm dependencies, scripts, metadata |
| `package-lock.json` | Lockfile for deterministic installs |

### Environment

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.example` | Example environment variables | Yes |
| `.env.local` | Local environment overrides | No |
| `.env.production` | Production environment (if exists) | No |

---

## Build & Output Directories

### Generated Directories (Not Committed)

```
.next/                      # Next.js build output
├── cache/                 # Build cache
├── server/                # Server bundles
├── static/                # Static chunks
└── types/                 # Auto-generated types

node_modules/              # npm dependencies

coverage/                  # Test coverage reports

storybook-static/          # Storybook build output

playwright-report/         # Playwright test reports

.drizzle/                  # Drizzle ORM cache
```

### Migration Files (Committed)

```
migrations/                # Drizzle migrations
├── 0000_*.sql            # Initial migration
├── 0001_*.sql            # Subsequent migrations
└── meta/                 # Migration metadata
```

---

## Critical File Summary

### ⭐ Must-Read Files for New Developers

1. **`README.md`** - Project overview and setup instructions
2. **`CLAUDE.md`** - AI assistant instructions and architecture notes
3. **`src/middleware.ts`** - Request flow entry point
4. **`src/app/api/chat/route.ts`** - AI chat proxy logic
5. **`src/libs/supabase/server.ts`** - Server-side auth client
6. **`src/libs/dify/client.ts`** - AI service integration
7. **`src/components/chat/ChatInterface.tsx`** - Main chat UI
8. **`src/models/Schema.ts`** - Database schema
9. **`src/utils/AppConfig.ts`** - App configuration
10. **`package.json`** - Dependencies and scripts

### 🔒 Files Containing Secrets (Never Commit)

- `.env.local`
- `.env.production`
- `*.env` (any environment files)

### 📝 Files Modified Frequently

- `src/models/Schema.ts` - Database schema changes
- `src/app/api/*/route.ts` - API logic
- `src/components/` - UI components
- `src/locales/*.json` - Translations

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
