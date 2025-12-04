# HealthCompanion - Project Documentation Index

**Generated:** 2025-12-04
**Scan Type:** Quick (Pattern-based)
**Project Type:** Web Application (Next.js 14)

> **Primary Entry Point for AI-Assisted Development**
>
> This index provides comprehensive navigation to all project documentation. Use this as your starting point for understanding the codebase, architecture, and development workflows.

---

## Project Overview

- **Name:** HealthCompanion
- **Type:** Monolithic Web Application (SaaS)
- **Primary Language:** TypeScript
- **Framework:** Next.js 14 (App Router)
- **Architecture:** Serverless with SSR/SSG

### Quick Reference

| Aspect | Details |
|--------|---------|
| **Tech Stack** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Database** | PostgreSQL (Drizzle ORM) |
| **Authentication** | Supabase Auth |
| **AI Integration** | Dify API (chat streaming) |
| **Payments** | Stripe (ready) |
| **Deployment** | Vercel-compatible |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Locales** | English, French |
| **Components** | 20+ React components |
| **API Endpoints** | 2 (Chat, Auth callback) |

---

## Generated Documentation

### Core Documentation

#### [Project Overview](./project-overview.md)
High-level project summary, purpose, tech stack, and getting started guide.

#### [Architecture](./architecture.md)
Complete system architecture including:
- Technology stack details
- Architecture patterns (Next.js App Router)
- Data architecture (PostgreSQL + Drizzle ORM)
- API design (REST + SSE streaming)
- Security architecture (Supabase Auth)
- Component architecture
- Deployment strategy

#### [Source Tree Analysis](./source-tree-analysis.md)
Annotated directory structure with:
- Critical directories explained
- Entry points documented
- Integration points identified
- File patterns and conventions

### Development Guides

#### [Development Guide](./development-guide.md)
Complete development setup and workflow:
- Prerequisites and installation
- Environment configuration
- Development commands
- Database management
- Testing strategies
- Git workflow
- Common tasks
- Troubleshooting

#### [Deployment Guide](./deployment-guide.md)
Production deployment instructions:
- Vercel deployment steps
- Environment configuration
- CI/CD pipeline (GitHub Actions)
- Database deployment
- Error monitoring (Sentry)
- Monitoring (Checkly)
- Scaling considerations
- Rollback strategies

### Detailed Documentation

#### [API Contracts](./api-contracts.md) _(To be generated)_
API endpoint documentation (requires deep scan):
- `/api/chat` - Dify AI proxy with SSE streaming
- `/auth/callback` - Supabase OAuth callback handler

_Run deep scan or exhaustive scan to generate detailed API documentation._

#### [Data Models](./data-models.md) _(To be generated)_
Database schema documentation (requires deep scan):
- Table definitions
- Relationships
- Constraints
- Migrations

_Run deep scan to extract complete schema from Drizzle ORM._

#### [Component Inventory](./component-inventory.md) _(To be generated)_
UI component catalog (requires deep scan):
- Component library (shadcn/ui + Radix)
- Custom components
- Component patterns
- Design system

_Run deep scan to analyze all 20+ components in detail._

---

## Existing Project Documentation

### Planning & Specifications

#### [Technical Specification - Index](./tech-spec/index.md)
Main technical specification entry point covering:
- Project context and requirements
- Implementation details and stack
- Development setup and resources
- Technical architecture
- Testing approach
- UX/UI considerations
- Deployment strategy

#### [Epics](./epics.md)
Feature epics and user stories breakdown.

#### [Product Backlog](./backlog.md)
Prioritized product backlog items.

### Sprint Artifacts

Located in `docs/sprint-artifacts/`:

- **Sprint Status:** `sprint-status.yaml` - Current sprint tracking
- **User Stories:**
  - `story-ai-health-coach-1.md` through `story-ai-health-coach-5.md`
- **Retrospectives:**
  - `epic-1-retro-2025-12-03.md` - Epic 1 retrospective

### Workflow Tracking

- **BMM Workflow Status:** `bmm-workflow-status.yaml` - Methodology tracking
- **Archived Status:** `archive/` - Historical workflow states

### Project Context

- **[CLAUDE.md](../CLAUDE.md)** - Claude Code integration guide
  - Project overview for AI
  - Core architecture
  - Authentication flow
  - Chat/AI integration
  - Database layer
  - Routing structure
  - Common development commands

- **[AGENTS.md](../AGENTS.md)** - Agent documentation and workflows

- **[README.md](../README.md)** - Main project README with feature list

- **[CHANGELOG.md](../CHANGELOG.md)** - Version history and release notes

---

## Getting Started

### For New Developers

1. **Start Here:** Read [Project Overview](./project-overview.md)
2. **Setup Environment:** Follow [Development Guide](./development-guide.md)
3. **Understand Architecture:** Review [Architecture](./architecture.md)
4. **Explore Codebase:** Use [Source Tree Analysis](./source-tree-analysis.md)
5. **Check Current Work:** Review `sprint-artifacts/` for active stories

### For AI-Assisted Development (Claude Code)

**Primary Context File:** `../CLAUDE.md`

This file contains:
- Project-specific conventions
- Authentication patterns
- Common development patterns
- Key file locations
- Testing approaches

**Workflow:**
1. Load `../CLAUDE.md` for project context
2. Reference this index for specific documentation
3. Use architecture.md for system design decisions
4. Check tech-spec for detailed requirements

### Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Open Drizzle Studio
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests

# Code Quality
npm run lint             # Run linter
npm run check-types      # Type check

# Database
npm run db:generate      # Generate migration
npm run db:migrate       # Apply migrations

# Build
npm run build            # Production build
npm start                # Start production server
```

---

## Project Structure Reference

```
HealthCompanion/
├── src/                      # Source code
│   ├── app/[locale]/         # Next.js App Router (i18n)
│   │   ├── api/chat/         # AI chat proxy endpoint
│   │   └── auth/callback/    # OAuth callback
│   ├── components/           # React components
│   │   └── ui/               # shadcn/ui components
│   ├── features/             # Feature modules
│   │   ├── landing/          # Landing page
│   │   ├── auth/             # Authentication
│   │   ├── dashboard/        # Dashboard
│   │   └── billing/          # Stripe billing
│   ├── libs/                 # Third-party integrations
│   │   ├── supabase/         # Supabase client/server
│   │   ├── dify/             # Dify AI client
│   │   ├── DB.ts             # Database connection
│   │   └── Env.ts            # Environment validation
│   ├── models/               # Database schema
│   │   └── Schema.ts         # Drizzle ORM schema
│   ├── locales/              # Translations (en, fr)
│   ├── middleware.ts         # Auth + i18n middleware
│   └── [utils, types, hooks] # Supporting code
│
├── docs/                     # Documentation (YOU ARE HERE)
│   ├── index.md              # This file
│   ├── architecture.md       # Architecture docs
│   ├── project-overview.md   # Project overview
│   ├── source-tree-analysis.md
│   ├── development-guide.md
│   ├── deployment-guide.md
│   ├── tech-spec/            # Technical specifications
│   └── sprint-artifacts/     # Sprint tracking
│
├── public/                   # Static assets
├── migrations/               # Database migrations
├── tests/                    # Test files
│   ├── e2e/                  # Playwright tests
│   └── integration/          # Integration tests
│
└── [config files]            # Various config files
```

---

## Key Technologies

### Frontend
- **Next.js 14:** React framework with App Router
- **React 18:** UI library
- **TypeScript:** Type safety
- **Tailwind CSS:** Utility-first styling
- **shadcn/ui:** Component library (Radix UI)
- **Assistant UI:** Chat interface with streaming

### Backend
- **Next.js API Routes:** Serverless functions
- **PostgreSQL:** Relational database
- **Drizzle ORM:** Type-safe ORM
- **Supabase:** Auth & database hosting

### Integrations
- **Dify AI:** Chat AI platform
- **Stripe:** Payment processing
- **Sentry:** Error monitoring
- **Checkly:** Uptime monitoring

### Development
- **Vitest:** Unit testing
- **Playwright:** E2E testing
- **ESLint:** Linting (Antfu config)
- **GitHub Actions:** CI/CD
- **Husky:** Git hooks
- **Commitizen:** Conventional commits

---

## Documentation Maintenance

### Scan Levels

This documentation was generated with a **Quick Scan** (pattern-based analysis).

#### Available Scan Levels:

1. **Quick Scan** ✅ (Current)
   - Pattern-based analysis
   - No source file reading
   - Fast execution
   - Best for: Project overview, initial understanding

2. **Deep Scan** (Run if needed)
   - Reads files in critical directories
   - Extracts detailed information
   - Generates: API contracts, Data models, Component inventory
   - Best for: Comprehensive documentation for brownfield PRD

3. **Exhaustive Scan** (Run if needed)
   - Reads all source files
   - Complete code analysis
   - Maximum detail
   - Best for: Migration planning, detailed audit

### Regenerating Documentation

To update or expand this documentation:

```bash
# Run from Claude Code with analyst agent
/bmad:bmm:agents:analyst

# Then select:
*document-project

# Choose scan level based on needs
```

### Incomplete Documentation

Documents marked with **_(To be generated)_** require a deep or exhaustive scan. These include:
- API Contracts (detailed endpoint documentation)
- Data Models (complete schema analysis)
- Component Inventory (component catalog)

---

## Additional Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Dify Documentation](https://docs.dify.ai)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)

### Related Files
- **Environment Setup:** `.env` (template), `.env.local` (your config)
- **TypeScript Config:** `tsconfig.json`
- **Next.js Config:** `next.config.mjs`
- **Tailwind Config:** `tailwind.config.ts`
- **Database Config:** `drizzle.config.ts`
- **Test Configs:** `vitest.config.mts`, `playwright.config.ts`

---

## Support & Contributing

### Getting Help
1. Check this index for relevant documentation
2. Review technical specification in `tech-spec/`
3. Check sprint artifacts for feature-specific guidance
4. Consult CLAUDE.md for AI development patterns

### Making Changes
- **Commits:** Use `npm run commit` (Conventional Commits)
- **Linting:** Auto-fixes via `npm run lint:fix`
- **Testing:** Run tests before committing
- **Migrations:** Generate via `npm run db:generate`

---

**Last Updated:** 2025-12-04
**Scan Version:** 1.0 (Quick)
**Next Recommended Action:** Review project-overview.md and architecture.md for system understanding

For detailed code analysis or to generate missing documentation, run a **deep scan** or **exhaustive scan** of the project.
