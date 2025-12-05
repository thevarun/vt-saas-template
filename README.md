# HealthCompanion

> AI-powered health coaching through conversational interface

HealthCompanion is a modern web application that provides personalized health guidance through AI-powered conversations. Built with Next.js 14 and powered by Dify AI, it offers users 24/7 access to intelligent health coaching in a secure, private environment.

## Features

- 🤖 **AI Health Coach** - Get personalized health guidance through natural conversations
- 🔒 **Secure Authentication** - Supabase-powered auth with email and OAuth support
- 💬 **Real-time Chat** - Streaming AI responses with conversation history
- 🌍 **Multi-language Support** - English, Hindi, and Bengali locales
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Modern Stack** - Built on Next.js 14 App Router with TypeScript

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
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
   git clone https://github.com/yourusername/HealthCompanion.git
   cd HealthCompanion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # Supabase (Public)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Supabase (Server-side - keep in .env.local)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Dify API (Server-side only)
   DIFY_API_URL=https://api.dify.ai/v1
   DIFY_API_KEY=your_dify_api_key

   # Database
   DATABASE_URL=your_postgresql_connection_string
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
npm run dev              # Start development server
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

The application is compatible with any platform that supports Next.js 14:
- Netlify
- Railway
- Render
- Self-hosted with Node.js

## Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DIFY_API_URL` - Dify API endpoint
- `DIFY_API_KEY` - Dify API key
- `DATABASE_URL` - PostgreSQL connection string

### Optional

- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- `SENTRY_DSN` - Error tracking
- `SENTRY_AUTH_TOKEN` - Source map uploads

## Architecture

HealthCompanion follows a serverless architecture:

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in `docs/`
- Review CLAUDE.md for AI assistant context

---

**HealthCompanion** - Your AI-powered health companion for a healthier life.
