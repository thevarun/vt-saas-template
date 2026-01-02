# Development Setup

**Prerequisites:**
- Node.js 20+ (verify: `node --version`)
- npm (comes with Node.js)
- PostgreSQL database access (Supabase or local)
- Supabase account with project created
- Dify API key

**Initial Setup Steps:**

1. **Install Dependencies:**
   ```bash
   npm install
   npm install @assistant-ui/react-devtools
   ```

2. **Environment Configuration:**
   - Copy `.env` to `.env.local`
   - Fill in Supabase credentials (URL, anon key, service role key)
   - Fill in Dify API credentials
   - Verify `DATABASE_URL` points to Supabase PostgreSQL

3. **Database Setup:**
   ```bash
   # Create health_companion schema in Supabase SQL Editor
   # Run SQL from "Database Changes" section above

   # Generate Drizzle migration
   npm run db:generate

   # Open Drizzle Studio to verify
   npm run db:studio
   ```

4. **Development Server:**
   ```bash
   npm run dev
   # Opens http://localhost:3000
   # Sentry Spotlight runs alongside for error debugging
   ```

5. **Verify Setup:**
   - Navigate to `/chat`
   - Should see auth redirect (if not logged in)
   - Log in via `/sign-in`
   - Verify empty chat state loads

**Development Workflow:**

```bash
# Start development
npm run dev                 # Dev server + Spotlight

# Run tests (in separate terminal)
npm test                    # Unit tests (watch mode: npm test -- --watch)
npm run test:e2e           # E2E tests (headless)

# Code quality
npm run lint                # Check linting
npm run lint:fix           # Auto-fix issues
npm run check-types        # TypeScript validation

# Database
npm run db:studio          # Visual database explorer
npm run db:generate        # Create migration after schema changes

# Commits
npm run commit             # Interactive conventional commit
```

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill` |
| Database connection error | Check `DATABASE_URL` in `.env.local`, verify Supabase project status |
| Build errors | `rm -rf .next node_modules && npm install && npm run build` |
| Type errors | `npm run check-types` to identify, fix imports/types |
| Assistant UI not rendering | Verify `@assistant-ui/react@0.11.47` installed, check browser console |

---
