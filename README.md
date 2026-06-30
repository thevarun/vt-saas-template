# VT SaaS Template

[![CI](https://github.com/thevarun/vt-saas-template/workflows/CI/badge.svg)](https://github.com/thevarun/vt-saas-template/actions)

> Production-ready SaaS template with authentication, AI chat, and modern UI

VT SaaS Template is a modern web application template that provides a solid foundation for building SaaS products. Built with Next.js 16 and powered by Dify AI, it offers authentication, real-time AI chat, and a responsive UI out of the box.

## Features

- 🤖 **AI Integration** - Chat interface with Dify AI backend
- 🔒 **Secure Authentication** - Supabase-powered auth with email and OAuth support
- 💬 **Real-time Chat** - Streaming AI responses with conversation history
- 🌍 **Multi-language Support** - English, Hindi, and Bengali locales
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Modern Stack** - Built on Next.js 16 App Router with TypeScript

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Chat Interface**: Assistant UI (@assistant-ui/react)

### Backend
- **Runtime**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **AI Integration**: Dify API (chat streaming)

### DevOps
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint (@antfu/eslint-config)
- **Error Tracking**: Sentry
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel-compatible

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (or use PGlite for local development)
- Supabase account (for authentication)
- Dify API key (for AI chat functionality)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vt-saas-template.git
   cd vt-saas-template
   ```

   > **Forked or used "Use this template"?** After installing dependencies, run the `/init-downstream` Claude Code command to rename the DB schema, configure merge strategies, and clean up template artifacts. See [Building a Product on This Template](#building-a-product-on-this-template) for the full workflow.

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase URL, anon key, and other settings
   ```

4. **Run database migrations**

   Migrations are applied automatically on first database interaction. Alternatively, run manually:
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Development

### Available Scripts

```bash
npm run dev              # Start development server (with Sentry Spotlight)
npm run dev:next         # Start Next.js dev server only (without Spotlight)
npm run build            # Create production build
npm start                # Start production server
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # Run ESLint
npm run lint:fix         # Fix auto-fixable issues
npm run check-types      # TypeScript type checking
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate migration from schema

# Claude Code commands (run inside Claude Code):
/init-downstream          # Post-fork project initialization
/upstream-sync            # Pull upstream template updates
```

### Optional: Claude-Powered Docs Sync

An automated docs-maintenance workflow ships with this template (`.github/workflows/docs-sync.yml`). On pushes to `main` that touch watched code surfaces, Claude reviews recent changes and accumulates documentation updates into a single rolling PR on the `docs-sync/auto` branch. Cold periods cost zero GitHub Actions minutes — the path filter prevents the workflow from starting.

**One-time setup per repo:**

1. Run `/install-github-app` in Claude Code (terminal). This installs the Claude Code GitHub App and configures the `CLAUDE_CODE_OAUTH_TOKEN` repo secret.
2. Adjust the `paths:` filter in `.github/workflows/docs-sync.yml` to match your project's documented code surfaces (default covers `src/libs`, `src/models`, `src/app/api`, etc.).
3. Adjust `.github/docs-sync.config.json` — `allowlist` / `denylist` (which doc files Claude may edit) and `rangeDays` (diff window).

**To disable:** delete `.github/workflows/docs-sync.yml`.

The workflow vendors a copy of the upstream `meta:docs-quick-update` command at `.github/prompts/docs-quick-update.md` — refresh that file when the upstream command improves.

## Customizing This Template

### Quick Rebrand Checklist

| Task | Files | Est. Time |
|------|-------|-----------|
| Brand Colors | `src/styles/global.css` → `@theme` colors | 30 min |
| Typography | `src/app/layout.tsx`, `src/styles/global.css` | 20 min |
| Logo & Assets | `/public/logo.svg`, `/public/favicon.ico` | 30 min |
| App Name | Search/replace "VT SaaS Template" throughout `/src/` | 20 min |
| Theme Variables | `src/styles/global.css` (shadcn/ui theming) | 20 min |

### Applying a Theme from VT Design Studio

Theme token files (`themes/*.tokens.json` in `vt-design-studio`) map directly to this template's CSS variables.

**To apply a theme manually:**

1. Open the theme's `.tokens.json` file (e.g., `rang.tokens.json`)
2. In `src/styles/global.css`, replace the HSL values in `:root` with values from `colors.light`, and `.dark` with values from `colors.dark`
3. Convert camelCase token names to kebab-case CSS variables (e.g., `primaryForeground` → `--primary-foreground`)
4. Update `--radius` from `borderRadius.default`
5. Update fonts in `src/app/layout.tsx` if the theme specifies different `fonts.heading`/`fonts.body`

The token names match 1:1 — `primary`, `background`, `muted`, `sidebar`, `chart1`–`chart5`, etc.

### Advanced Customization

- **Component Overrides**: shadcn/ui components live in `/src/components/ui/`. Modify base components or create variants using CVA.
- **Layout Changes**: Update layouts in `/src/app/[locale]/(auth)/layout.tsx` and similar files. Adjust navigation structure and responsive breakpoints.
- **Feature Removal**: Remove unwanted features by deleting routes from `/src/app/[locale]/`, cleaning up related components and API routes, and updating navigation.

### Template Content to Replace

Beyond branding, these stubs ship with placeholder content you should replace or remove:

| Stub | Location | Action |
|------|----------|--------|
| Navbar links (Product, Docs, Community, Company) | `src/templates/Navbar.tsx` | Point to real pages or remove |
| Footer links (Terms, Privacy, social icons) | `src/templates/Footer.tsx` | Create real pages or remove |
| Sidebar nav stubs (Pricing, Settings — disabled) | `src/components/layout/MainAppShell.tsx` | Implement or remove |
| Sidebar design system routes | `src/components/layout/MainAppShell.tsx` | Remove for production |
| Onboarding feature tour | `src/components/onboarding/OnboardingFeatureTour.tsx` + `src/locales/en.json` | Replace with your product's features |
| Dashboard placeholder | `src/components/dashboard/WelcomeDashboard.tsx` | Replace with your product's dashboard |
| Mem0 cron job | `vercel.json` | Remove if not using Mem0 |
| PSEO article data | `src/libs/pseo/data.ts` | Replace with your domain content or remove `src/app/[locale]/(unauth)/articles/` |

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── [locale]/       # Internationalized routes
│   │   ├── (unauth)/   # Public pages (landing)
│   │   ├── (auth)/     # Protected pages (dashboard)
│   │   └── (chat)/     # Chat interface
│   └── api/            # API routes
├── components/         # Shared components
│   ├── ui/            # shadcn/ui components
│   └── chat/          # Chat-specific components
├── features/          # Feature-based modules
│   ├── dashboard/     # Dashboard components
│   └── landing/       # Landing page components
├── libs/              # Third-party integrations
│   ├── supabase/      # Supabase clients
│   └── dify/          # Dify AI client
├── locales/           # Translation files (en, hi, bn)
├── models/            # Database schemas
├── templates/         # Page templates
└── utils/             # Utility functions
```

## Building a Product on This Template

### What Stays vs What You Customize

| Keep As-Is | Customize for Your Product | Optional — Remove If Unneeded |
|-----------|---------------------------|-------------------------------|
| Auth flow & middleware | Landing page copy & layout | AI Chat (see `docs/customization/`) |
| Admin panel | Onboarding feature tour | PSEO articles |
| Email infrastructure | Dashboard content | Changelog page |
| CI/CD pipeline | Nav items & sidebar | Extra locales (hi, bn) |
| Design system (shadcn/ui) | Branding (see Rebrand Checklist above) | |
| SEO infrastructure | OG image & SEO defaults | |
| Error handling | Email templates | |

### First Steps After Forking

Run the `/init-downstream` Claude Code command to set up your project as an independent downstream repo:

```bash
# Using Claude Code (recommended):
/init-downstream
```

This interactive command handles:
1. **Database schema rename** -- regenerates a clean migration under your project's schema name (replaces `vt_saas`)
2. **Merge strategy config** -- sets up `.gitattributes` with `merge=ours` for files you customize, so upstream syncs don't overwrite your branding
3. **gh CLI targeting** -- runs `gh repo set-default` so PRs and issues target your repo, not the template
4. **Template artifact cleanup** -- removes template-only files (planning docs, archived workflows) listed in `.template-cleanup`

If you're not using Claude Code, see the [manual equivalent](docs/upstream-sync-guide.md#manual-equivalent-without-claude-code) in the Upstream Sync Guide.

> **Suggested workflow:** `/init-downstream` (5 min) → branding pass (20 min) → stub cleanup (30 min) → start building your first feature.

### Syncing Upstream Updates

When new features or fixes are released in the template, pull them into your project:

```bash
# With Claude Code (recommended):
/upstream-sync

# Or manually:
git fetch upstream --tags
git merge v3.2.0
npm install
npm run lint && npm run check-types && npm test && npm run build
```

See [Upstream Sync Guide](docs/upstream-sync-guide.md) for detailed instructions and conflict resolution strategies.

> **Prerequisite:** Run `/init-downstream` first if you haven't already -- it configures the merge strategies that make upstream syncs clean.

### Should You Build a POC Separately?

**Recommendation: Build directly on the template.**

- Auth, session handling, and middleware take 2–3 days to re-integrate if you build separately first
- PGlite means zero database setup — start building your product logic immediately
- The admin panel gives you visibility into users and data during early testing

One exception: if you're validating a core algorithm that doesn't need a user-facing app yet, a standalone script or notebook is faster.

> **Suggested workflow:** Branding pass (20 min) + stub cleanup (30 min) makes it feel like "your app" quickly. Then start building your first feature.

### When to Enable Optional Services

| Service | Enable At | Notes |
|---------|----------|-------|
| Supabase | Day 1 | Required for auth |
| Vercel | Day 1 | Recommended for hosting |
| Resend | Alpha | Welcome emails; logs to console without it |
| PostHog | Alpha | Track user behavior from the start |
| Sentry | Alpha | Catch errors before users report them |
| Dify / OpenAI / Anthropic | When building AI features | Choose one chat implementation |
| LangFuse | Post-launch | After AI features are stable |
| Mem0 | Only if AI memory is core | Most products don't need this |
| Crowdin | Only if multi-language | Skip for English-only products |
| Percy | Post-launch | After design stabilizes |

> **Suggested default:** Supabase + Vercel day 1. Resend + PostHog + Sentry at alpha. Everything else only if the product needs it.

## Database Management

This project uses Drizzle ORM with PostgreSQL.

### Schema Isolation

The `DB_SCHEMA` environment variable controls which PostgreSQL schema all tables are created in. This is **required** — the app will fail to start without it.

| Environment | `DB_SCHEMA` | Why |
|-------------|-------------|-----|
| **Development** (shared Supabase) | `vt_saas` (or your project name) | Isolates tables from other projects sharing the same instance |
| **Production** (dedicated Supabase) | `public` | Standard PostgreSQL default; simplest setup for a dedicated instance |

Set it in `.env.local`:
```bash
DB_SCHEMA=vt_saas
```

When forking this template, run `/init-downstream` (Claude Code) to rename the schema and regenerate migrations automatically. Without Claude Code: update `DB_SCHEMA` in `.env.example` and `.env.local`, delete existing migrations, and run `npm run db:generate`.

### Making Schema Changes

This project uses **Drizzle** for migrations (files in `./migrations/`), **not** the Supabase CLI — see [docs/database-workflow.md](docs/database-workflow.md) for the full flow.

1. Edit `src/models/Schema.ts`.
2. **On a feature branch:** apply the equivalent SQL to the dev DB via the Supabase MCP or SQL editor — don't commit migration files (a pre-commit hook blocks them off `main`). Locally, `src/libs/DB.ts` auto-applies committed migrations on startup (PGlite and dev Postgres).
3. **On `main` after merge:** run `npm run db:generate`, inspect the SQL, and commit it. Production applies migrations at build time via `db:migrate:ci` (gated on `RUN_PROD_MIGRATIONS`).

> ⚠️ **Don't run `supabase db push`** — the Supabase CLI reads `supabase/migrations/` (empty here) and will silently report "up to date" while never applying the Drizzle migrations in `./migrations/`. Use `npm run db:migrate` or the Supabase MCP instead.

### Viewing Database

```bash
npm run db:studio
```

Opens Drizzle Studio at `https://local.drizzle.studio`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy

### Other Platforms

The application is compatible with any platform that supports Next.js 16:
- Netlify
- Railway
- Render
- Self-hosted with Node.js

## Launch Checklists

> **Automated audit:** Run `/launch-checklist` in Claude Code to scan 35 checks across auth, security, SEO, email, legal, performance, and more — outputs a scored report with fix guidance.

### Alpha Launch

- [ ] Branding pass complete (see Quick Rebrand Checklist above)
- [ ] Template stubs cleaned up (see Template Content to Replace above)
- [ ] Supabase project configured with env vars
- [ ] Vercel project connected to repo
- [ ] `ADMIN_EMAILS` set to your email
- [ ] CI passes: `npm run lint && npm run check-types && npm test && npm run build`
- [ ] Sign up → onboarding → dashboard flow works end-to-end
- [ ] See [Deployment Guide](docs/deployment-guide.md) for Vercel env vars and GitHub secrets

### Production Launch

Everything from alpha, plus:

- [ ] Custom domain on Vercel
- [ ] Sentry configured (see [Deployment Guide](docs/deployment-guide.md))
- [ ] PostHog configured
- [ ] Terms of Service & Privacy Policy pages live (replace footer stub links)
- [ ] Resend configured with verified sending domain
- [ ] Supabase email templates customized (verification, password reset)
- [ ] SEO verified: check `/sitemap.xml`, `/robots.txt`, test OG images at [opengraph.xyz](https://www.opengraph.xyz/)
- [ ] Sitemap submitted to Google Search Console

## Common Gotchas

- **Next.js 16 async params**: Route params are Promises — always `await props.params`. See [Next.js docs](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates).
- **Mem0 cron 404s**: If you see repeated 404s for `/api/cron/memory-extraction` in Vercel logs, remove the cron entry from `vercel.json` (Mem0 is disabled by default).
- **PGlite vs production**: PGlite auto-migrates locally; production PostgreSQL needs `npm run db:migrate`.
- **Email in dev**: Without `RESEND_API_KEY`, emails log to console — this is intentional, not a bug.
- **Chat nav visibility**: Chat nav items auto-show/hide based on whether API keys are set in env vars.
- **App name in multiple places**: Update in `src/utils/AppConfig.ts`, `src/libs/seo/constants.ts`, and `src/components/layout/MainAppShell.tsx` (3 hardcoded strings), plus `src/libs/Env.ts` default.

## Environment Variables

See [`.env.example`](.env.example) for the complete list with descriptions. Key variables:

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Optional — Chat
- `DIFY_API_KEY` / `DIFY_API_URL` - Dify AI chat (server-side only)
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` - Vercel AI SDK chat
- `AI_PROVIDER` / `DEFAULT_AI_MODEL` - AI provider configuration

### Optional — Features
- `ADMIN_EMAILS` - Comma-separated admin email addresses
- `RESEND_API_KEY` - Email via Resend (logs to console without)
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics
- `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` - LLM observability
- `ENABLE_MEM0` / `MEM0_API_KEY` - Memory extraction
- `CRON_SECRET` - Cron job authentication
- `NEXT_PUBLIC_SITE_URL` - SEO (auto-detected on Vercel)

### Optional — Monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking
- `SENTRY_AUTH_TOKEN` - Source map uploads

### Sensitive (.env.local only)
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

## Architecture

VT SaaS Template follows a serverless architecture:

- **Frontend**: React Server Components with selective client components
- **Middleware**: Handles authentication and i18n routing
- **API Routes**: Serverless functions for backend logic
- **Database**: PostgreSQL with connection pooling
- **AI Proxy**: `/api/chat` proxies requests to Dify (keeps API key secure)

See `docs/architecture.md` for detailed architecture documentation.

## Testing

### Unit Tests (Vitest)

```bash
npm test
```

Tests are co-located with source files (`*.test.ts`, `*.test.tsx`)

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

E2E tests are in the `tests/` directory

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`npm run commit` for conventional commits)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- ESLint: Enforced via pre-commit hooks
- Prettier: Auto-formatting enabled
- Conventional Commits: Required (use `npm run commit`)

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Core Documentation
- **[API Error Handling](docs/api-error-handling.md)** - Error handling patterns for API routes
- **[Error Handling Guide](docs/error-handling-guide.md)** - Error boundaries and error handling strategies
- **[Development Guide](docs/development-guide.md)** - Development workflows and best practices
- **[CI/CD Pipeline](docs/ci-cd-pipeline.md)** - Continuous integration and deployment setup
- **[Admin Setup](docs/admin-setup.md)** - Admin user configuration
- **[Email System](docs/email-system.md)** - Email integration with Resend

### Patterns & Architecture
- **[API Proxy Pattern](docs/patterns/api-proxy.md)** - Securely integrate external APIs by proxying requests server-side
- **[SSE Streaming Pattern](docs/patterns/sse-streaming.md)** - Learn how to implement Server-Sent Events for AI streaming

### Customization Guides
- **[Removing Dify Chat](docs/customization/removing-dify-chat.md)** - Remove Dify implementation while keeping Vercel AI SDK
- **[Removing Vercel AI SDK Chat](docs/customization/removing-vercel-chat.md)** - Remove Vercel implementation while keeping Dify
- **[Removing All Chat Features](docs/customization/removing-all-chat.md)** - Completely remove all chat functionality

### Maintenance
- **[Upstream Sync Guide](docs/upstream-sync-guide.md)** - Pull new features and fixes from the template
- **Claude Code commands** - `/init-downstream` (post-fork setup) and `/upstream-sync` (pull template updates) -- see [Building a Product](#building-a-product-on-this-template)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in `docs/`
- Review CLAUDE.md for AI assistant context

---

**VT SaaS Template** - Build your next SaaS product faster.
