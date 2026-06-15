# {PROJECT_NAME} — Deployment Guide

**Last updated:** {YYYY-MM-DD} | **Domain:** {PRODUCTION_DOMAIN}

---

## Deployment Platform

{PROJECT_NAME} deploys to **Vercel** via Git Integration. Pushes to `main` trigger automatic production deployments. PR branches get preview deployments.

**Vercel project:** `{vercel-project-name}` — env vars scoped per environment.

---

## Production Infrastructure

| Service | Account | Purpose |
|---|---|---|
| **Vercel** | {plan} | Hosting, serverless functions, CDN |
| **Supabase** | `{project-ref}` ({plan}) | PostgreSQL, Auth, RLS |
| **Resend** | `mail.{domain}` sending | Transactional emails |
| **Sentry** | `{org/project}` | Error tracking |
| **PostHog** | shared project | Product analytics |
| **Domain** | {registrar} | Domain registrar / DNS |
| _(add per project integrations)_ |  |  |

---

## Key Architecture Decisions

_(capture per-deploy — each decision with Why + How-to-apply)_

### Database
- Schema: all tables in `{DB_SCHEMA}` (not `public`), via `DB_SCHEMA` env var
- Migration strategy: push-in-dev, migrate-on-main
- Auto-migration disabled in production (`NODE_ENV` guard in `src/libs/DB.ts`)
- Execution order: `db:migrate` → `seed.sql` → `prod-setup.sql`

### Subscription lifecycle
_(if applicable — trial, expiry, tier transitions)_

### Cost Optimization
- Landing page SSG
- Sentry: ~10% traces / 0% replays in prod, 100% in dev
- Separate AI provider keys for prod vs dev (cost attribution)
- Spend caps: Vercel ${cap}, OpenAI ${cap}/mo

### Security
- RLS on all app-schema tables
- Dev-login endpoint 403 in prod
- `TOKEN_ENCRYPTION_KEY` differs per env (prod tokens undecryptable in dev)
- Custom SMTP via Resend (branded sender in auth emails)

---

## CI/CD Pipeline

### GitHub Actions
_(describe pipeline jobs — CI, release, dependabot)_

### Branch Protection
_(status — enforced vs configured)_

---

## Environment Variables

### Scoping Strategy

See `_bmad-output/deployment-checklist.md` (archived per-deploy at `_bmad-output/deployments/`) for the full env plan produced in Phase 3.

### GitHub Actions Secrets
Point to **dev** Supabase project (CI tests shouldn't touch prod):
- `NEXT_PUBLIC_SUPABASE_URL` (dev)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (dev)
- `SUPABASE_SERVICE_ROLE_KEY` (dev)
- `SENTRY_AUTH_TOKEN` (shared for source maps)

---

## Database Operations

### Production Setup (one-time)

```bash
# 1. Run Drizzle migrations
DATABASE_URL="<prod-pooler-url>" DB_SCHEMA={schema} npx drizzle-kit migrate

# 2. Seed via Supabase SQL Editor
# File: supabase/seed.sql

# 3. Prod-setup via Supabase SQL Editor
# File: supabase/prod-setup.sql
```

### Ongoing Schema Changes
Feature branch: edit schema files, apply to dev via Supabase MCP `apply_migration` (never `db:push`). Never commit migration files on feature branches.
Main branch: run `npm run db:generate` to produce canonical migration, commit.
Production: `npm run db:migrate:ci` via the Vercel build.

---

## Background Jobs

_(if applicable — Inngest, QStash, Vercel Cron)_

| Function | Schedule | Purpose |
|---|---|---|
| ... | ... | ... |

---

## Monitoring & Observability

| Service | Purpose | Sample rate | Dashboard |
|---|---|---|---|
| Sentry | Error tracking | 10% traces, 0% replays (alpha) | sentry.io |
| PostHog | Product analytics | client-side, lazy-loaded | app.posthog.com |
| Vercel | Deploy + function logs | all requests | vercel.com |

### Alerts
- Sentry high-priority issues (auto-rule)
- Vercel on-demand spend cap at ${cap}
- OpenAI monthly budget with alert thresholds

---

## OAuth Configuration

_(per provider in use — include BOTH callback URLs if dual-use)_

### {Provider}
- App/platform-connect callback: `https://{domain}/api/auth/callback/{provider}`
- Supabase Auth OIDC callback: `https://{supabase-ref}.supabase.co/auth/v1/callback`

---

## Known Issues & TODOs

_(carry-forward list — track what's deferred)_

- [ ] _(item)_

---

## Runbook: Rollback

See `.claude/skills/production-deploy/references/rollback-reference.md` for tested rollback commands per provider.

---

## Deployment History

### Deploy {N} — {YYYY-MM-DD}
- **What changed:** {summary}
- **New integrations:** {list}
- **Drift reconciliations:** {list}
- **Incidents during deploy:** {list}

_(append per deploy in reverse chronological order)_
