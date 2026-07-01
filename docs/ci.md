# CI Pipeline

Simple CI pipeline for solo development.

## Pipeline

```
Lint & Types ──┬──> Unit Tests
               └──> Build & E2E
```

- **Lint & Types**: ESLint + TypeScript (~2 min)
- **Unit Tests**: Vitest with coverage (~2 min)
- **Build & E2E**: Next.js build + Playwright (~8 min)

**Total: ~10-12 min** (Unit and E2E run in parallel after lint)

## Run Locally

```bash
# Full CI check before pushing
./scripts/ci-local.sh

# Skip E2E for quick check
./scripts/ci-local.sh --skip-e2e
```

## Debugging Failures

1. Download artifacts from GitHub Actions (test-results, playwright-report)
2. View trace: `pnpm exec playwright show-trace path/to/trace.zip`
3. Run locally with debug: `pnpm test:e2e -- --debug`

## Required Secrets

Set in GitHub > Settings > Secrets:

| Secret | Required |
|--------|----------|
| `DIFY_API_KEY` | Yes |
| `DIFY_API_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SENTRY_AUTH_TOKEN` | Optional |

## Badge

```markdown
[![CI](https://github.com/thevarun/vt-saas-template/actions/workflows/CI.yml/badge.svg)](https://github.com/thevarun/vt-saas-template/actions/workflows/CI.yml)
```
