# VT SaaS Template - Project Overview

**Generated:** 2026-01-02
**Project Type:** Full-stack Next.js Web Application (Monolith)
**Version:** 1.6.1

---

## Executive Summary

VT SaaS Template is an AI-powered SaaS application that provides AI-powered assistance through conversational AI. Built on Next.js 14 with a modern serverless architecture, it combines secure authentication, real-time AI chat streaming, and multi-language support to deliver 24/7 AI assistance in a private, secure environment.

The application leverages Dify AI for intelligent conversations, Supabase for authentication and database services, and Assistant UI for a sophisticated chat interface with streaming support.

---

## Project Purpose

**Mission:** Provide a production-ready SaaS template with AI-powered conversations.

**Key Goals:**
- Provide instant, personalized AI assistance available 24/7
- Maintain user privacy and data security through proper authentication
- Support multi-language conversations (English, Hindi, Bengali)
- Deliver seamless real-time chat experience with conversation history
- Enable scalable, serverless deployment for global reach

**Target Users:**
- Developers building SaaS applications
- Startups needing a production-ready template
- Teams seeking a modern AI-powered web application foundation

---

## Technology Stack

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.25 | Full-stack React framework with App Router |
| React | 18.3.1 | UI component library |
| TypeScript | 5.6.3 | Type-safe development |
| Tailwind CSS | 3.4.14 | Utility-first styling |
| Assistant UI | 0.11.47 | Advanced chat interface with streaming |
| Radix UI | Various | Accessible UI primitives |
| shadcn/ui | Custom | Pre-built component library |

### Backend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.2.25 | Serverless API endpoints |
| Supabase Auth | 2.86.0 | Authentication & session management |
| PostgreSQL | - | Primary database (via Supabase) |
| Drizzle ORM | 0.35.1 | Type-safe database queries |
| Dify API | - | AI chat streaming service |

### AI/Chat Integration
| Technology | Version | Purpose |
|------------|---------|---------|
| Dify API | v1 | AI health coaching engine |
| Assistant UI React | 0.11.47 | Chat UI with streaming support |
| AI SDK Integration | 1.1.16 | AI SDK adapter for Assistant UI |

### Development & Quality
| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | 2.1.9 | Unit testing framework |
| Playwright | 1.48.1 | E2E testing |
| Storybook | 8.6.14 | Component development & visual testing |
| ESLint | 8.57.1 | Code linting (@antfu config) |
| Husky | 9.1.6 | Git hooks |
| Commitizen | 4.3.1 | Conventional commits |

### DevOps & Monitoring
| Technology | Purpose |
|------------|---------|
| GitHub Actions | CI/CD automation |
| Semantic Release | Automated versioning |
| Sentry | Error tracking & monitoring |
| Vercel | Deployment platform (recommended) |

---

## Architecture Classification

**Architecture Type:** Serverless Full-stack Monolith

**Architectural Pattern:** Full-stack Next.js with:
- **Server-Side Rendering (SSR)** for optimized page loads
- **API Routes** for backend logic (chat proxy, thread management)
- **Component-Based UI** with React Server Components
- **Middleware Layer** for authentication and internationalization
- **Database Integration** via Drizzle ORM with PostgreSQL

**Key Characteristics:**
- Single cohesive codebase (monolith structure)
- Serverless functions for API routes
- Edge middleware for auth/i18n
- Client-side streaming for real-time chat
- Proxy pattern for AI API security

---

## Repository Structure

**Type:** Monolith
**Parts:** 1 (unified full-stack application)

### High-Level Organization

```
vt-saas-template/
├── src/                    # Application source code
│   ├── app/               # Next.js App Router (pages + API)
│   ├── components/        # Reusable React components
│   ├── features/          # Feature-based modules
│   ├── libs/              # Third-party integrations
│   ├── models/            # Database schemas
│   ├── locales/           # i18n translations
│   └── utils/             # Utility functions
├── tests/                 # E2E test files
├── docs/                  # Project documentation
└── public/                # Static assets
```

**Critical Directories:**
- `src/app/[locale]/` - Internationalized pages
- `src/app/api/` - API route handlers
- `src/components/chat/` - Chat interface components
- `src/libs/supabase/` - Supabase client configurations
- `src/libs/dify/` - Dify AI client
- `src/models/` - Drizzle ORM schemas

---

## Entry Points

### Application Entry
- **Primary Entry:** `src/middleware.ts` (runs on all requests)
  - Handles Supabase session refresh
  - Manages i18n locale routing
  - Enforces authentication on protected routes

### Page Entry Points
- **Landing Page:** `src/app/[locale]/(unauth)/page.tsx`
- **Dashboard:** `src/app/[locale]/(auth)/dashboard/page.tsx`
- **Chat Interface:** `src/app/[locale]/(chat)/chat/page.tsx`

### API Entry Points
- **Chat Proxy:** `src/app/api/chat/route.ts`
- **Thread Management:** `src/app/api/threads/route.ts`
- **Thread Details:** `src/app/api/threads/[id]/route.ts`
- **Archive Thread:** `src/app/api/threads/[id]/archive/route.ts`
- **Chat Messages:** `src/app/api/chat/messages/route.ts`

### Database Entry
- **Schema Definition:** `src/models/Schema.ts`
- **Migrations:** Auto-applied via Drizzle ORM

---

## Key Features

### 1. AI Health Coach
- Conversational AI powered by Dify
- Personalized health guidance
- Context-aware responses
- Streaming real-time responses

### 2. Secure Authentication
- Supabase Auth integration
- Email + OAuth providers
- Server-side session management
- Protected route middleware

### 3. Multi-threaded Conversations
- Multiple chat threads per user
- Thread persistence and history
- Thread archiving
- Title editing and management

### 4. Multi-language Support
- English, Hindi, Bengali locales
- next-intl for translations
- Locale-aware routing
- RTL support ready

### 5. Real-time Chat Interface
- Server-Sent Events (SSE) streaming
- Assistant UI components
- Typing indicators
- Message history

### 6. Responsive Design
- Mobile-first approach
- Desktop, tablet, mobile optimized
- Dark mode support (next-themes)
- Accessible UI (Radix primitives)

---

## Development Approach

**Methodology:** Agile development with conventional commits

**Code Quality Standards:**
- TypeScript strict mode
- ESLint with Antfu config
- Pre-commit hooks (Husky)
- Conventional commit messages
- Semantic versioning

**Testing Strategy:**
- Unit tests: Vitest (co-located with components)
- E2E tests: Playwright (tests/ directory)
- Visual regression: Storybook + Chromatic
- Test coverage tracking

**Branching Strategy:**
- Main branch: `main`
- Feature branches: `feature/description`
- Semantic Release for automated versioning

---

## Integration Points

### External Services
1. **Supabase**
   - Authentication & user management
   - PostgreSQL database hosting
   - Row-level security (RLS)

2. **Dify AI**
   - AI chat model hosting
   - Conversation state management
   - Streaming response generation

3. **Vercel** (Deployment)
   - Edge functions
   - Serverless API routes
   - Static asset CDN

### Internal Integration
- **Frontend ↔ API Routes:** RESTful HTTP + SSE streaming
- **API ↔ Supabase:** Authentication validation, database queries
- **API ↔ Dify:** Proxied AI requests (keeps API key secure)
- **Middleware ↔ Supabase:** Session refresh on each request

---

## Security Considerations

**Authentication:**
- Server-side session validation
- Middleware-enforced route protection
- HTTP-only cookies for sessions

**API Security:**
- Dify API key kept server-side only
- Proxy pattern for AI requests
- Supabase RLS for database access

**Data Privacy:**
- User data isolated by user_id
- Secure environment variable management
- No sensitive data in client bundles

---

## Deployment Architecture

**Platform:** Vercel (recommended) or any Next.js-compatible host

**Components:**
- **Edge Middleware:** Authentication + i18n routing
- **Serverless Functions:** API route handlers
- **Static Assets:** CDN-served public files
- **Database:** External PostgreSQL (Supabase)

**Environment Requirements:**
- Node.js 20.x or higher
- PostgreSQL database
- Supabase project
- Dify API access

---

## Documentation Links

### Generated Documentation
- [Architecture](./architecture.md) - Detailed system architecture
- [API Contracts](./api-contracts.md) - API endpoint specifications
- [Data Models](./data-models.md) - Database schema documentation
- [Component Inventory](./component-inventory.md) - UI component catalog
- [Development Guide](./development-guide.md) - Setup and development workflow
- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Source Tree Analysis](./source-tree-analysis.md) - Codebase structure

### Existing Documentation
- [../README.md](../README.md) - Project README
- [../CLAUDE.md](../CLAUDE.md) - AI assistant instructions
- [../CHANGELOG.md](../CHANGELOG.md) - Version history

---

## Project Statistics

- **Version:** 1.6.1
- **Primary Language:** TypeScript
- **Lines of Code:** ~15,000+ (estimated)
- **API Endpoints:** 5
- **UI Components:** 38+
- **Database Tables:** 1 (threads)
- **Supported Languages:** 3 (English, Hindi, Bengali)
- **Test Coverage:** Unit + E2E + Visual
- **CI/CD:** GitHub Actions with Semantic Release

---

## Future Considerations

**Scalability:**
- Serverless architecture supports horizontal scaling
- Database connection pooling via Supabase
- CDN for global asset delivery

**Extensibility:**
- Modular feature structure (`src/features/`)
- Plugin-based UI components (shadcn/ui)
- Configurable AI models (via Dify)

**Maintainability:**
- Type-safe codebase (TypeScript + Drizzle)
- Automated testing at multiple levels
- Conventional commits for clear history
- Comprehensive documentation

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
