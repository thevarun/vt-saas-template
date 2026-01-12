# VT SaaS Template - Development Guide

**Generated:** 2026-01-02
**Last Updated:** 2026-01-02

---

## Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| Node.js | 20.x or 22.6+ | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| npm | 10.x+ | Package manager | Included with Node.js |
| Git | 2.x+ | Version control | [git-scm.com](https://git-scm.com) |
| PostgreSQL | 15+ | Database (optional for local) | [postgresql.org](https://postgresql.org) |

### Required Accounts

- **Supabase Account** - Authentication & database
- **Dify Account** - AI chat service
- **GitHub Account** - Code repository (optional)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vt-saas-template.git
cd vt-saas-template
```

### 2. Install Dependencies

```bash
npm install
```

**Installation Time:** ~2-3 minutes

### 3. Environment Setup

Create `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# Supabase (Public - safe for client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase (Server-side only - keep secret)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Dify API (Server-side only - keep secret)
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your_dify_api_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Sentry (Optional - for error tracking)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

**Getting API Keys:**

**Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Project Settings → API → Copy URL and anon key
3. Service role key in same location (keep secret!)

**Dify:**
1. Create account at [dify.ai](https://dify.ai)
2. Create AI application
3. Settings → API Key → Generate key

**Database URL:**
- Use Supabase PostgreSQL (automatic with Supabase project)
- Or use local PostgreSQL: `postgresql://localhost:5432/healthcompanion`
- Or use PGlite for offline development (auto-configured)

### 4. Database Setup

**Auto Migration (Recommended):**

Migrations apply automatically on first database interaction. Just run the dev server:

```bash
npm run dev
```

**Manual Migration (Optional):**

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

**Server URL:** http://localhost:3000

**Dev Features:**
- Hot reload (file changes auto-refresh)
- Sentry Spotlight (error debugging UI)
- Fast Refresh (React state preserved)

---

## Development Commands

### Core Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run dev` | Start dev server with Spotlight | Development |
| `npm run dev:next` | Start Next.js only (no Spotlight) | Lightweight dev |
| `npm run build` | Production build | Pre-deployment |
| `npm start` | Start production server | Testing prod locally |
| `npm run clean` | Remove build artifacts | Troubleshooting |

### Code Quality

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run lint` | Run ESLint | Check code quality |
| `npm run lint:fix` | Auto-fix ESLint issues | Fix common issues |
| `npm run check-types` | TypeScript type checking | Validate types |

### Testing

| Command | Description | Usage |
|---------|-------------|-------|
| `npm test` | Run unit tests (Vitest) | Test components/utils |
| `npm run test:e2e` | Run E2E tests (Playwright) | Test user flows |
| `npm run storybook` | Start Storybook | Component development |
| `npm run test-storybook:ci` | Visual regression tests | CI testing |

### Database

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run db:studio` | Open Drizzle Studio | Browse database |
| `npm run db:generate` | Generate migration | After schema changes |
| `npm run db:migrate` | Apply migrations manually | Edge runtime only |

### Git & Commits

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run commit` | Commitizen (conventional commits) | Create commit |
| `git push` | Push to remote | Triggers CI/CD |

### Build Analysis

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run build-stats` | Analyze bundle size | Optimize performance |

---

## Project Structure

```
vt-saas-template/
├── src/                    # Application source
│   ├── app/               # Next.js pages & API
│   ├── components/        # React components
│   ├── features/          # Feature modules
│   ├── libs/              # Integrations
│   ├── models/            # Database schemas
│   ├── utils/             # Utilities
│   └── middleware.ts      # Edge middleware
├── tests/                 # E2E tests
├── public/                # Static assets
├── docs/                  # Documentation
├── .env.local             # Environment variables (not committed)
└── package.json           # Dependencies & scripts
```

---

## Development Workflow

### 1. Pick a Task

- Check GitHub Issues or project board
- Review `docs/` for architecture context
- Read CLAUDE.md for AI assistant guidance

### 2. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

### 3. Develop & Test

```bash
# Make changes
# Run tests
npm test
npm run test:e2e

# Type check
npm run check-types

# Lint
npm run lint:fix
```

### 4. Commit Changes

```bash
# Use Commitizen for conventional commits
npm run commit
```

**Commit Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

**Example:**
```
feat(chat): add thread archiving

- Add archive button to thread items
- Update API to handle archive status
- Add archived filter to thread list

Closes #123
```

### 5. Push & Create PR

```bash
git push origin feature/my-feature
```

Create Pull Request on GitHub with:
- Clear description
- Screenshots (if UI changes)
- Test results
- Breaking changes noted

---

## Database Development

### Modifying Schema

1. **Edit Schema:**
   ```typescript
   // src/models/Schema.ts
   export const threads = healthCompanionSchema.table('threads', {
     // Add new column
     priority: int('priority').default(0),
   });
   ```

2. **Generate Migration:**
   ```bash
   npm run db:generate
   ```

   Creates: `migrations/0003_add_priority_column.sql`

3. **Migration Auto-Applies:**
   - Next database query applies pending migrations
   - No restart needed

4. **View Database:**
   ```bash
   npm run db:studio
   ```
   Opens: https://local.drizzle.studio

### Database Clients

**Development:**
- Drizzle Studio (web UI)
- psql (command line)
- TablePlus / DBeaver (GUI)

**Connection String:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

---

## Testing

### Unit Tests (Vitest)

**Run Tests:**
```bash
npm test
```

**Watch Mode:**
```bash
npm test -- --watch
```

**Coverage:**
```bash
npm test -- --coverage
```

**Test File Location:**
- Co-located with source: `Component.test.tsx`
- Test setup: `vitest-setup.ts`

**Example Test:**
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

**First Time Setup:**
```bash
npx playwright install
```

**Run E2E Tests:**
```bash
npm run test:e2e
```

**Headed Mode (Watch Browser):**
```bash
npx playwright test --headed
```

**Debug Mode:**
```bash
npx playwright test --debug
```

**Test Files:**
- Location: `tests/`
- Pattern: `*.spec.ts` or `*.e2e.ts`

**Example Test:**
```typescript
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Common Development Tasks

### Adding a New Page

1. Create route file:
   ```bash
   src/app/[locale]/(auth)/my-page/page.tsx
   ```

2. Add to protected paths (if needed):
   ```typescript
   // src/middleware.ts
   const protectedPaths = [
     '/dashboard',
     '/my-page', // Add here
   ];
   ```

3. Add navigation link:
   ```tsx
   // src/components/layout/MainAppShell.tsx
   <NavItem href="/my-page">My Page</NavItem>
   ```

### Adding a New API Endpoint

1. Create route file:
   ```bash
   src/app/api/my-endpoint/route.ts
   ```

2. Implement handler:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/libs/supabase/server';

   export async function GET(request: NextRequest) {
     const supabase = createClient(await cookies());
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     return NextResponse.json({ message: 'Hello!' });
   }
   ```

### Adding a Translation

1. Edit locale files:
   ```json
   // src/locales/en.json
   {
     "MyPage": {
       "title": "My Page Title"
     }
   }
   ```

2. Use in component:
   ```tsx
   import { useTranslations } from 'next-intl';

   export function MyPage() {
     const t = useTranslations('MyPage');
     return <h1>{t('title')}</h1>;
   }
   ```

---

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

**Database connection errors:**
- Check `DATABASE_URL` in `.env.local`
- Verify Supabase project is active
- Check firewall/network settings

**Type errors after npm install:**
```bash
npm run check-types
# Fix errors in code
# Or regenerate types:
rm -rf .next
npm run dev
```

**Migration errors:**
```bash
# Reset migrations (CAUTION: data loss)
rm -rf migrations/
npm run db:generate
```

**Build failures:**
```bash
# Clean and rebuild
npm run clean
rm -rf .next node_modules
npm install
npm run build
```

---

## Code Style Guide

### TypeScript

**Strict Mode:** Enabled
```typescript
// Use explicit types
function greet(name: string): string {
  return `Hello, ${name}`;
}

// Avoid 'any'
const data: unknown = fetchData();
```

### React

**Prefer Functional Components:**
```tsx
// Good
export function MyComponent({ name }: Props) {
  return <div>{name}</div>;
}

// Avoid class components
```

**Server Components by Default:**
```tsx
// Server Component (default)
export function Layout({ children }) {
  return <div>{children}</div>;
}

// Client Component (explicit)
'use client';
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Imports

**Use Absolute Imports:**
```typescript
// Good
import { Button } from '@/components/ui/button';

// Avoid relative imports
import { Button } from '../../../components/ui/button';
```

---

## Git Hooks

**Pre-commit:**
- Runs `lint-staged` (lints changed files)
- Type checks modified files
- Formats code with Prettier

**Commit-msg:**
- Validates conventional commit format
- Enforces commit message structure

**Bypass Hooks (Not Recommended):**
```bash
git commit --no-verify
```

---

## Helpful Resources

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Supabase Docs:** https://supabase.com/docs
- **Drizzle ORM:** https://orm.drizzle.team
- **Assistant UI:** https://www.assistant-ui.com
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
