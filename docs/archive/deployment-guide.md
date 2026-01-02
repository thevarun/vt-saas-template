# Deployment Guide - HealthCompanion

**Generated:** 2025-12-04
**Scan Level:** Quick

## Deployment Overview

HealthCompanion is configured for Vercel deployment but can be deployed to any platform supporting Next.js.

## Vercel Deployment (Recommended)

### Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- Environment variables configured

### Deployment Steps

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Connect GitHub repository
   - Select `main` branch for production

2. **Configure Environment Variables**

Required variables in Vercel dashboard:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Dify AI
DIFY_API_URL=
DIFY_API_KEY=

# Database
DATABASE_URL=

# Stripe (if using billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Sentry (optional)
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# Environment
BILLING_PLAN_ENV=production
```

3. **Deploy**
   - Push to `main` branch
   - Automatic deployment via GitHub integration
   - Preview deployments on pull requests

### Build Settings

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 20.x

## CI/CD Pipeline

### GitHub Actions Workflows

Located in `.github/workflows/`:

#### 1. **CI.yml** - Continuous Integration

Runs on every push and pull request:

- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Build verification

#### 2. **release.yml** - Semantic Release

Runs on push to `main`:

- Analyzes commit messages
- Determines version bump
- Generates CHANGELOG.md
- Creates GitHub release
- Publishes release notes

Uses Conventional Commits for versioning.

#### 3. **crowdin.yml** - Translation Sync

Runs on push to `main`:

- Syncs translation files to Crowdin
- Pulls updated translations
- Creates PR with translation updates

#### 4. **checkly.yml** - Monitoring

Runs monitoring checks:

- API endpoint health
- Page load performance
- Uptime monitoring

## Database Deployment

### Production Database Setup

**Recommended:** Prisma Postgres or Supabase PostgreSQL

1. **Create Database**
   - Provision PostgreSQL database
   - Note connection string

2. **Configure Environment**
   ```bash
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

3. **Run Migrations**

   Migrations auto-apply on app start. For manual runs:

   ```bash
   npm run db:migrate
   ```

### Database Considerations

- **Connection Pooling:** Use with serverless (Supabase Pooler, PgBouncer)
- **SSL:** Required for production (`sslmode=require`)
- **Backup:** Configure automatic backups
- **Scaling:** Consider read replicas for high traffic

## Environment-Specific Configuration

### Development
```bash
BILLING_PLAN_ENV=dev
# Uses PGlite for local database
# Stripe test mode
```

### Staging/Preview
```bash
BILLING_PLAN_ENV=test
# Preview database
# Stripe test mode
```

### Production
```bash
BILLING_PLAN_ENV=production
# Production database
# Stripe live mode
```

## Error Monitoring

### Sentry Configuration

1. **Create Sentry Project**
   - Sign up at sentry.io
   - Create Next.js project
   - Note DSN, org, and project name

2. **Configure Environment Variables**
   ```bash
   SENTRY_DSN=https://...@sentry.io/...
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   ```

3. **Update Configuration**

   Edit `next.config.mjs`:
   ```javascript
   {
     org: 'your-org',
     project: 'your-project',
   }
   ```

4. **Deploy**
   - Source maps uploaded automatically during build
   - Errors tracked in Sentry dashboard

## Monitoring

### Checkly Setup

1. **Create Checkly Account**
   - Configure at checklyhq.com
   - Connect to repository

2. **Configure Checks**
   - API monitoring
   - Browser checks
   - Alert channels (Slack, email)

3. **Deploy**
   - Checks run automatically
   - Alerts on failures

## Performance Optimization

### Build Optimizations

- **Bundle Analysis:** `npm run build-stats`
- **Image Optimization:** Next.js automatic optimization
- **Code Splitting:** Automatic via Next.js App Router
- **Caching:** Configured in `next.config.mjs`

### Recommended Settings

```javascript
// next.config.mjs
{
  poweredByHeader: false,  // Hide X-Powered-By
  reactStrictMode: true,    // Enable strict mode
}
```

## Security

### Environment Variables

- **Never commit** `.env.local` or secrets
- Use Vercel environment variables for production
- Rotate API keys regularly
- Use different keys per environment

### Headers

Security headers configured in middleware:

- CORS policies
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options

### Authentication

- Supabase handles auth securely
- Session refresh via middleware
- Protected routes enforced

## Scaling Considerations

### Horizontal Scaling

Vercel auto-scales:
- Serverless functions
- Edge functions
- Static assets (CDN)

### Database Scaling

- Connection pooling (required for serverless)
- Read replicas for heavy read workloads
- Query optimization via Drizzle ORM

### Caching

- Static page caching (Next.js ISR)
- API response caching
- CDN caching for assets

## Rollback Strategy

### Vercel Rollback

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Select previous working deployment
4. Click "Promote to Production"

### Database Rollback

**Important:** Database migrations are irreversible by default.

For critical rollbacks:
1. Have database backup ready
2. Restore from backup
3. Roll back application deployment

## Health Checks

### Monitoring Endpoints

- **App Health:** `/` (landing page)
- **API Health:** `/api/chat` (requires auth)
- **Auth Status:** `/sign-in` (redirects when authenticated)

### Metrics to Monitor

- Response times
- Error rates
- Database connection pool
- API rate limits
- Memory usage

## Troubleshooting Deployment

### Build Failures

1. Check build logs in Vercel dashboard
2. Verify environment variables
3. Run `npm run build` locally
4. Check for type errors: `npm run check-types`

### Runtime Errors

1. Check Sentry for error reports
2. Review Vercel function logs
3. Verify database connectivity
4. Check API key validity

### Database Connection Issues

1. Verify `DATABASE_URL` format
2. Check SSL requirements
3. Verify network access/firewall
4. Check connection pool limits

## Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs
- **Sentry Next.js:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
