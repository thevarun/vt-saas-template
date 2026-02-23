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
```

## Customizing This Template

### Quick Rebrand Checklist

| Task | Files | Est. Time |
|------|-------|-----------|
| Brand Colors | `src/styles/global.css` → `@theme` colors | 30 min |
| Typography | `src/app/layout.tsx`, `src/styles/global.css` | 20 min |
| Logo & Assets | `/public/logo.svg`, `/public/favicon.ico` | 30 min |
| App Name | Search/replace "VT SaaS Template" throughout `/src/` | 20 min |
| Theme Variables | `src/styles/global.css` (shadcn/ui theming) | 20 min |

### Advanced Customization

- **Component Overrides**: shadcn/ui components live in `/src/components/ui/`. Modify base components or create variants using CVA.
- **Layout Changes**: Update layouts in `/src/app/[locale]/(auth)/layout.tsx` and similar files. Adjust navigation structure and responsive breakpoints.
- **Feature Removal**: Remove unwanted features by deleting routes from `/src/app/[locale]/`, cleaning up related components and API routes, and updating navigation.

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

## Database Management

This project uses Drizzle ORM with PostgreSQL.

### Making Schema Changes

1. Edit `src/models/Schema.ts`
2. Generate migration: `npm run db:generate`
3. Migration applies automatically on next DB interaction

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in `docs/`
- Review CLAUDE.md for AI assistant context

---

**VT SaaS Template** - Build your next SaaS product faster.
