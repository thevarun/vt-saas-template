# VT SaaS Template - Deployment Guide

**Generated:** 2026-01-02
**Last Updated:** 2026-01-02

---

## Overview

VT SaaS Template is a Next.js 14 application designed for serverless deployment. This guide covers deployment to **Vercel** (recommended) and alternative platforms.

**Deployment Requirements:**
- Node.js 20.x or higher
- PostgreSQL database
- Environment variables configured
- Build passing all tests

---

## Vercel Deployment (Recommended)

### Why Vercel?

- **Native Next.js support** - Built by Next.js creators
- **Zero configuration** - Auto-detects Next.js
- **Edge Network** - Global CDN for fast delivery
- **Serverless Functions** - Auto-scaling API routes
- **Preview Deployments** - Every PR gets a preview URL
- **Free Tier** - Generous limits for small projects

### Prerequisites

1. **GitHub Repository** - Code pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project** - Database and auth ready
4. **Dify API Key** - AI service configured

### Step-by-Step Deployment

#### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your vt-saas-template repo
4. Click "Import"

#### 2. Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

**Node Version:** 20.x (auto-detected from `package.json`)

#### 3. Add Environment Variables

Click "Environment Variables" and add the following:

**Public Variables (Supabase):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Secret Variables (Server-side only):**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

**Optional (Monitoring):**
```
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Environment Selection:**
- Production: Required for all
- Preview: Optional (can copy from Production)
- Development: Optional (not used in Vercel)

#### 4. Deploy

1. Click "Deploy"
2. Wait for build (~2-3 minutes)
3. View deployment at `https://your-project.vercel.app`

#### 5. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `healthcompanion.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (auto-provisioned)

---

## Vercel Configuration

### vercel.json (Optional)

Create `vercel.json` in root for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": {
    "NODE_VERSION": "20"
  }
}
```

### Edge Middleware

Middleware runs on Vercel Edge Network automatically:
- **File:** `src/middleware.ts`
- **Execution:** Before all requests
- **Performance:** <10ms latency

### Serverless Functions

API routes auto-deploy as serverless functions:
- **Location:** `src/app/api/`
- **Runtime:** Node.js 20.x
- **Timeout:** 10s (Hobby), 60s (Pro)
- **Memory:** 1024 MB default

---

## CI/CD with GitHub Actions

### Automatic Deployments

**Configured in:** `.github/workflows/CI.yml`

**Triggers:**
- Push to `main` → Production deployment
- Pull Request → Preview deployment
- Manual workflow dispatch

### Build Pipeline

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run check-types
      - run: npm test
      - run: npm run build
```

### Semantic Release

**Configured in:** `.github/workflows/release.yml`

**Automatic Versioning:**
- Analyzes commit messages
- Bumps version number
- Generates CHANGELOG.md
- Creates GitHub release
- Commits version bump

**Commit Format Required:**
```
feat: new feature → minor version bump
fix: bug fix → patch version bump
BREAKING CHANGE: → major version bump
```

---

## Environment-Specific Configuration

### Production

**URL:** `https://healthcompanion.vercel.app`

**Environment Variables:**
- All required variables set
- Production Supabase project
- Production Dify API key
- Sentry DSN for error tracking

**Build Settings:**
- `NODE_ENV=production` (auto-set)
- Minification enabled
- Source maps uploaded to Sentry

### Preview (Staging)

**URL:** `https://healthcompanion-git-[branch]-[username].vercel.app`

**Environment Variables:**
- Can use same as production
- Or separate staging Supabase/Dify

**Features:**
- Created for every PR
- Auto-deleted when PR closed
- Password protection available

### Development

**Local only** - Not deployed to Vercel

**Environment:**
- `.env.local` file
- Local or PGlite database
- Development Dify API key

---

## Database Setup

### Supabase Production Database

1. **Create Production Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy connection details

2. **Run Migrations**
   ```bash
   # Set DATABASE_URL to production
   export DATABASE_URL="postgresql://..."

   # Apply migrations
   npm run db:migrate
   ```

3. **Verify Schema**
   - Open Supabase Dashboard
   - SQL Editor → Check `health_companion.threads` table exists

### Connection Pooling

**Enabled by default in Supabase**

**Connection String Format:**
```
postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?pgbouncer=true
```

**Pooling Mode:** Transaction pooling (default)

---

## Monitoring & Error Tracking

### Sentry Setup

1. **Create Sentry Project**
   - Go to [sentry.io](https://sentry.io)
   - Create Next.js project
   - Copy DSN

2. **Add Environment Variables**
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

3. **Update Configuration**
   ```typescript
   // sentry.client.config.ts
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   });
   ```

### Vercel Analytics

**Enabled by default** - No configuration needed

**Metrics Tracked:**
- Page views
- Web Vitals (LCP, FID, CLS)
- Function execution time
- Error rate

**Access:** Vercel Dashboard → Analytics

---

## Alternative Deployment Platforms

### Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Import from Git

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**
   - Same as Vercel

4. **Deploy**

**Note:** Netlify has some limitations with Next.js App Router features.

### Railway

1. **Create Project**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub

2. **Configure**
   - Automatically detects Next.js
   - Add environment variables

3. **Deploy**

**Includes:** PostgreSQL database (no external DB needed)

### Self-Hosted (Docker)

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

**Build & Run:**
```bash
docker build -t healthcompanion .
docker run -p 3000:3000 --env-file .env.production healthcompanion
```

---

## Performance Optimization

### Build Optimizations

**Enabled by Default:**
- Automatic code splitting
- Image optimization (Next.js Image)
- CSS minimization
- JavaScript minification

**Bundle Analysis:**
```bash
npm run build-stats
```

Opens bundle analyzer to identify large dependencies.

### Caching Strategy

**Static Assets:**
- Cache-Control: `public, max-age=31536000, immutable`
- CDN caching via Vercel Edge Network

**API Routes:**
- No caching (dynamic content)
- Consider adding caching headers for static data

**Database:**
- Connection pooling (Supabase)
- Query result caching (future enhancement)

---

## Security Checklist

### Pre-Deployment

- [ ] No API keys in client code
- [ ] `.env.local` not committed to Git
- [ ] All environment variables set in Vercel
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured (if needed)
- [ ] Rate limiting considered (future)

### Post-Deployment

- [ ] Verify Supabase RLS policies
- [ ] Test authentication flow
- [ ] Check Sentry error reports
- [ ] Monitor API usage (Dify dashboard)
- [ ] Review security headers

### Security Headers

**Next.js Configuration:**
```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Instant rollback (no rebuild)

### Database Rollback

**Not automatic** - Manual process:

1. **Before Migration:**
   ```bash
   # Backup production database
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

2. **After Failed Migration:**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup-YYYYMMDD.sql
   ```

**Best Practice:** Test migrations on staging first.

---

## Troubleshooting

### Build Failures

**Common Issues:**
- TypeScript errors → Run `npm run check-types` locally
- Missing dependencies → Check `package.json`
- Environment variables → Verify in Vercel settings

**Debug Build:**
```bash
npm run build
```

### Runtime Errors

**Check Vercel Logs:**
1. Go to Deployment → View Function Logs
2. Filter by error status (500, 401, etc.)
3. Check Sentry for stack traces

**Common Issues:**
- Database connection → Verify `DATABASE_URL`
- Auth errors → Check Supabase keys
- Dify API errors → Verify API key and quota

### Performance Issues

**Check Vercel Analytics:**
- Function execution time
- Cold start latency
- Error rate

**Optimize:**
- Enable caching headers
- Reduce bundle size
- Optimize images

---

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] Sign-in/sign-up works
- [ ] Chat functionality operational
- [ ] Database connections working
- [ ] All environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Sentry receiving errors (test with intentional error)
- [ ] Analytics tracking
- [ ] Backup strategy in place

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs (Sentry)
- Check API usage (Dify dashboard)
- Monitor database size (Supabase)

**Monthly:**
- Update dependencies (`npm outdated`)
- Review security advisories
- Database backup verification

**Quarterly:**
- Performance review (Core Web Vitals)
- Cost optimization (Vercel/Supabase usage)
- Security audit

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs
- **Sentry Docs:** https://docs.sentry.io

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
