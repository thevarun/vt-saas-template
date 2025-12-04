# Project Overview - HealthCompanion

**Generated:** 2025-12-04
**Project Type:** Web Application (SaaS)
**Scan Level:** Quick (Pattern-based)

## Overview

HealthCompanion is a modern SaaS web application that provides AI-powered health coaching through an intuitive chat interface. Built on Next.js 14 with TypeScript, it combines cutting-edge web technologies with a focus on user experience, security, and scalability.

## Purpose

An AI health companion application that helps users manage their health through conversational AI, leveraging Dify's AI platform for intelligent responses and personalized health guidance.

## Key Features

### Core Functionality
- **AI Chat Interface:** Real-time streaming chat powered by Dify AI
- **User Authentication:** Secure authentication via Supabase (email, OAuth, magic links)
- **Multi-language Support:** English and French (expandable via Crowdin)
- **Dark Mode:** Full dark theme support
- **Responsive Design:** Mobile-first approach with Tailwind CSS

### Technical Capabilities
- **Server-Side Rendering:** Fast initial page loads with Next.js SSR
- **Real-time Streaming:** Server-Sent Events (SSE) for AI responses
- **Offline Development:** PGlite for local database
- **Type Safety:** Full TypeScript coverage with strict mode
- **Error Monitoring:** Sentry integration for production reliability

## Technology Summary

### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React hooks (no Redux/MobX)
- **Forms:** React Hook Form + Zod validation

### Backend Stack
- **Runtime:** Next.js API Routes (serverless)
- **Database:** PostgreSQL (Drizzle ORM)
- **Authentication:** Supabase Auth
- **AI Integration:** Dify API (proxied)
- **Payments:** Stripe (ready for integration)

### DevOps
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel-compatible
- **Monitoring:** Sentry + Checkly
- **Logging:** Pino + Logtail

## Project Structure

### Repository Organization

**Type:** Monolithic web application (single codebase)

**Structure:**
```
HealthCompanion/
├── src/               # Source code
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── features/      # Feature modules
│   ├── libs/          # Third-party integrations
│   ├── models/        # Database schema
│   └── utils/         # Utilities
├── docs/              # Documentation
├── public/            # Static assets
├── migrations/        # Database migrations
└── tests/             # Test files
```

**Total Components:** 20+ React components
**API Endpoints:** 2 (Chat AI proxy, Auth callback)
**Supported Languages:** 2 (English, French)

## Architecture Type

**Pattern:** Next.js App Router with Serverless Functions

**Characteristics:**
- Server Components for static content
- Client Components for interactivity
- API Routes for backend logic
- Middleware for auth & routing
- File-system based routing

**Deployment Model:** Serverless (Vercel)

## Development Status

### Existing Documentation

This project has comprehensive documentation:

**Planning & Specifications:**
- Technical specifications (`docs/tech-spec/`)
- Epics and user stories (`docs/epics.md`, `docs/sprint-artifacts/`)
- Product backlog (`docs/backlog.md`)

**Technical Documentation:**
- Architecture overview (`docs/architecture.md`)
- Source tree analysis (`docs/source-tree-analysis.md`)
- Development guide (`docs/development-guide.md`)
- Deployment guide (`docs/deployment-guide.md`)

**Integration Guides:**
- Claude Code instructions (`CLAUDE.md`)
- Agent documentation (`AGENTS.md`)

### Development Workflow

**Active Methodology:** BMM (Brownfield Method Methodology)
- Sprint-based development
- Story-driven implementation
- Continuous integration

**Current Sprint:** Epic 1 - AI Health Coach
- 5 user stories completed
- Sprint retrospective documented
- Status tracked in `docs/sprint-artifacts/sprint-status.yaml`

## Getting Started

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-repo/HealthCompanion.git
cd HealthCompanion

# Install dependencies
npm install

# Set up environment variables
cp .env .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Prerequisites

- Node.js 20+
- PostgreSQL database (or use PGlite for local dev)
- Supabase account
- Dify API key

For detailed setup instructions, see `docs/development-guide.md`.

## Team & Contributors

### Development Team

**Project Maturity:** Active development
**Development Approach:** AI-assisted development (Claude Code)
**Code Quality:** High (enforced via linting, type-checking, testing)

### Key Stakeholders

- **Developers:** TypeScript/React developers
- **Users:** Health-conscious individuals seeking AI assistance
- **Integrations:** Dify AI, Supabase, Stripe

## License

See LICENSE file for details.

## Links & Resources

### Documentation Index
- [Architecture](./architecture.md) - System architecture
- [Development Guide](./development-guide.md) - Setup & development
- [Deployment Guide](./deployment-guide.md) - Deployment instructions
- [Source Tree](./source-tree-analysis.md) - Codebase structure
- [Tech Spec](./tech-spec/index.md) - Technical specifications

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Dify Documentation](https://docs.dify.ai)
- [Tailwind CSS](https://tailwindcss.com)

## Project Stats

| Metric | Value |
|--------|-------|
| **Language** | TypeScript |
| **Framework** | Next.js 14 |
| **Components** | 20+ |
| **API Routes** | 2 |
| **Locales** | 2 (en, fr) |
| **Dependencies** | 60+ production |
| **Dev Dependencies** | 100+ |
| **Test Coverage** | Vitest + Playwright |
| **Documentation Files** | 20+ markdown files |

## Recent Updates

### Latest Changes (from CHANGELOG.md)

Recent epic completion:
- **Epic 1:** AI Health Coach functionality
- Assistant UI integration
- Dify streaming chat
- Authentication via Supabase

See `CHANGELOG.md` for complete version history.

## Support & Contact

### Getting Help

1. **Documentation:** Check `docs/` directory first
2. **Tech Spec:** Review `docs/tech-spec/index.md`
3. **Development Issues:** See `docs/development-guide.md`
4. **Deployment Issues:** See `docs/deployment-guide.md`

### Contributing

This project uses:
- **Conventional Commits** for git messages
- **ESLint** for code quality
- **Prettier** for formatting
- **Husky** for git hooks
- **Semantic Release** for versioning

Run `npm run commit` to use the interactive commit tool.

---

**Next Steps for New Contributors:**

1. Read `docs/development-guide.md` for setup
2. Review `docs/architecture.md` for system understanding
3. Check `docs/tech-spec/index.md` for feature details
4. Explore `docs/sprint-artifacts/` for current work
5. Review `CLAUDE.md` for AI-assisted development patterns

**For AI-Assisted Development:**

This project is optimized for Claude Code. See `CLAUDE.md` for:
- Project context
- Architecture patterns
- Common operations
- Development workflows
