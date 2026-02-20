# Deployment Guide

**Generated:** 2026-02-20 | **Scan Level:** Deep

---

## Platform

**Primary:** Vercel (auto-deploy from GitHub)
**Database:** Supabase PostgreSQL (or any PostgreSQL provider)

---

## CI/CD Pipeline

### Quality Gates (CI.yml)
Runs on push to `main` and all PRs:

1. **Change Detection** - Skips tests for docs-only changes
2. **Lint & Types** - ESLint + TypeScript check (always runs)
3. **Unit Tests** - Vitest with coverage (skipped for docs-only)
4. **Build & E2E** - Production build + Playwright (skipped for docs-only, E2E skipped for Dependabot)

### Release (release.yml)
Runs after CI passes on `main`:
- semantic-release with Conventional Commits
- `feat:` -> minor, `fix:` -> patch, `feat!:` -> major
- Creates GitHub releases + changelog

### Auto-fix (codex-ci-fixer.yml)
On CI failure: triggers Codex bot to auto-fix (max 3 attempts)

### Dependabot (dependabot-auto-merge.yml)
Auto-merges patch and minor dependency updates.

---

## Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations |
| `DIFY_API_KEY` | Dify AI (if using) |
| `DIFY_API_URL` | Dify API URL |
| `SENTRY_AUTH_TOKEN` | Source map upload |
| `CODEX_TRIGGER_PAT` | Codex bot token |

---

## Vercel Configuration

### Environment Variables
Set all variables from `.env.example` in Vercel dashboard:
- Production: Real API keys
- Preview: Test/staging keys
- `NEXT_PUBLIC_SITE_URL`: Auto-detected on Vercel

### Build Settings
- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`
- **Output:** `.next/`
- **Node.js:** 20.x

### Cron Jobs
Configure in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/memory-extraction",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## Branch Protection

- `main` is protected - always create feature branches
- PRs require CI to pass before merge
- Run all checks locally before pushing:
```bash
npm run lint && npm run check-types && npm test && npm run build
```

---

## Security Headers

Configured in `next.config.mjs`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=63072000
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

---

## Monitoring

- **Production:** Sentry (configure org/project in `next.config.mjs`)
- **Development:** Sentry Spotlight (runs with `npm run dev`)
- **Logging:** Pino + Logtail (optional)
- **LLM Observability:** LangFuse (optional)
- **Analytics:** PostHog (optional)
