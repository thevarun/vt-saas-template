# CI/CD Pipeline Documentation

## Overview

VT SaaS Template uses a comprehensive CI/CD pipeline powered by GitHub Actions and Vercel to ensure code quality and automated deployments.

## Pipeline Architecture

```
Push/PR → GitHub Actions CI → Quality Gates → Vercel Deployment → Production
          ├─ Lint & Types
          ├─ Unit Tests
          ├─ Fork Smoke (first-boot gate)
          └─ Build & E2E Tests
```

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/CI.yml`)

Runs on every push to `main` and on all pull requests.

#### Job 1: Lint & Types (10 min timeout)

- **Triggers:** All pushes and PRs
- **Node Version:** From `.nvmrc` (v20)
- **Checks:**
  - ESLint validation (`pnpm lint`)
  - TypeScript type checking (`pnpm check-types`)
  - Commitlint validation (PR only)
- **Caching:** pnpm dependencies via `actions/setup-node@v4`

#### Job 2: Unit Tests (10 min timeout)

- **Triggers:** After lint job passes
- **Dependencies:** Requires `lint` job to complete
- **Checks:**
  - Vitest unit tests with coverage
- **Environment Variables:**
  - `DIFY_API_KEY`
  - `DIFY_API_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Caching:** pnpm dependencies

#### Job: Fork Smoke (10 min timeout)

- **What:** Runs `scripts/fork-smoke.sh` — boots the real `pnpm dev` (run-p + Spotlight sidecar) with `.env.example`-shaped env and asserts `/` returns 200 with a clean log.
- **Why:** `pnpm build` can't catch first-run failures (env validation, run-p flag forwarding, sidecar bins) — see issues #379/#380.
- **Secrets:** None. `DATABASE_URL` is blanked so `DB.ts` uses in-memory PGlite, so the job is green on a fresh fork's first CI run before any secrets exist. Run locally with `pnpm smoke`.

#### Job 3: Build & E2E (20 min timeout)

- **Triggers:** After lint job passes (runs parallel with unit tests)
- **Dependencies:** Requires `lint` job to complete
- **Steps:**
  1. Next.js production build
  2. Playwright E2E tests
- **Environment Variables:**
  - All variables from unit tests
  - `SUPABASE_SERVICE_ROLE_KEY` (for test account cleanup)
  - `SENTRY_AUTH_TOKEN` (optional)
- **Caching:**
  - pnpm dependencies
  - Playwright browsers (`~/.cache/ms-playwright`)
- **Artifacts:** Test results uploaded on failure

### Release Workflow (`.github/workflows/release.yml`)

Runs automatically after successful CI completion on `main` branch.

- **Trigger:** CI workflow completion (on successful CI run)
- **Tool:** semantic-release with automated changelog generation
- **Actions:**
  - Analyzes conventional commits since last release
  - Determines version bump based on commit types
  - Generates release notes grouped by commit type (Features, Bug Fixes, etc.)
  - Updates `docs/CHANGELOG.md` with new release notes
  - Updates version in `package.json` and `pnpm-lock.yaml`
  - Commits changes back to main with `[skip ci]` flag
  - Creates GitHub Release with generated notes
  - Does NOT publish to npm (`npmPublish: false`)
- **Permissions:**
  - `contents: write` - Create releases and commit changelog
  - `issues: write` - Comment on released issues
  - `pull-requests: write` - Comment on released PRs

#### Version Bumping Rules

semantic-release uses Conventional Commits to determine version bumps:

| Commit Type                             | Example                         | Version Bump          |
| --------------------------------------- | ------------------------------- | --------------------- |
| `feat:`                                 | `feat(auth): add OAuth support` | Minor (1.8.0 → 1.9.0) |
| `fix:`                                  | `fix(api): handle null user`    | Patch (1.8.0 → 1.8.1) |
| `perf:`                                 | `perf(db): optimize queries`    | Patch (1.8.0 → 1.8.1) |
| `revert:`                               | `revert: undo feature X`        | Patch (1.8.0 → 1.8.1) |
| `BREAKING CHANGE:`                      | `feat!: redesign API`           | Major (1.8.0 → 2.0.0) |
| `docs:`, `chore:`, `refactor:`, `test:` | Any non-code changes            | No release            |

**Breaking changes** trigger a major version bump via two syntaxes:

1. Add `!` after the type: `feat!: redesign API` or `feat(api)!: redesign API`
2. Include a `BREAKING CHANGE:` footer in the commit body

#### Changelog Generation

**Output Location:** `docs/CHANGELOG.md`

**Format:** Grouped by release version and commit type:

- Features
- Bug Fixes
- Performance Improvements
- Reverts
- Documentation (visible in changelog)

**Example Release Entry:**

```markdown
# [1.9.0](https://github.com/USER/REPO/compare/v1.8.0...v1.9.0) (2026-02-10)

### Features

- **share:** add share widget component ([abc123f](https://github.com/USER/REPO/commit/abc123f))
- **changelog:** add changelog page ([def456a](https://github.com/USER/REPO/commit/def456a))

### Bug Fixes

- **auth:** prevent null reference in login flow ([789ghij](https://github.com/USER/REPO/commit/789ghij))
```

**Changelog Directory:** `docs/changelog/` is reserved for individual release files (used by Story 8.4 - Changelog Page).

#### Testing Release Automation

**Dry-run (local):**

```bash
pnpm exec semantic-release --dry-run --no-ci
```

This command:

- Analyzes commits since last release
- Shows what version would be released
- Shows what changelog would be generated
- Does NOT create actual release or commits

## Quality Gates

### What Must Pass Before Merge

1. ✅ ESLint check (zero errors, warnings allowed)
2. ✅ TypeScript check (zero errors)
3. ✅ All unit tests passing
4. ✅ Production build completes
5. ✅ All E2E tests passing

### Current Status

**Branch Protection:** ⚠️ NOT CONFIGURED

- Main branch is not protected
- Recommendation: Enable branch protection requiring status checks

**Required Secrets:** ✅ CONFIGURED

- `DIFY_API_KEY` ✓
- `DIFY_API_URL` ✓
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓ (for E2E test cleanup)
- `SENTRY_AUTH_TOKEN` (optional)

## Vercel Deployment

### Integration Method

Vercel deployment is handled by the **Vercel GitHub App** (not GitHub Actions).

### Deployment Triggers

1. **Preview Deployments:**
   - Automatically created for every PR
   - URL posted to PR comments
   - Uses preview environment variables

2. **Production Deployments:**
   - Automatically triggered on merge to `main`
   - Uses production environment variables
   - Zero-downtime deployments

### Vercel Configuration

**Build Settings:**

- Framework: Next.js (auto-detected)
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install --frozen-lockfile`
- Node Version: v20 (from `.nvmrc`)

**Environment Variables in Vercel:**
Set separately for Production, Preview, and Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIFY_API_KEY`
- `DIFY_API_URL`
- `SENTRY_AUTH_TOKEN` (optional)
- `SENTRY_DSN` (optional)

## Performance Optimizations

### Current Optimizations

1. **pnpm Caching:**
   - Handled by `actions/setup-node@v4`
   - Cache key based on `pnpm-lock.yaml`
   - Uses `pnpm install --frozen-lockfile --prefer-offline --no-audit`

2. **Playwright Browser Caching:**
   - Cache path: `~/.cache/ms-playwright`
   - Cache key: `playwright-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}`
   - Only installs browsers on cache miss

3. **Parallel Job Execution:**
   - Unit tests and E2E tests run in parallel after lint
   - Reduces total pipeline time

### Pipeline Timing

Typical execution times:

- Lint & Types: 2-3 minutes
- Unit Tests: 2-3 minutes
- Build & E2E: 8-12 minutes
- **Total (parallel):** ~10-12 minutes

### Future Optimizations

Consider adding:

- Next.js build cache (`.next/cache`)
- E2E test sharding for faster execution
- Conditional E2E runs (only when relevant files change)

## Testing Locally

Run the same checks that CI runs:

```bash
# Lint check
pnpm lint

# Type check
pnpm check-types

# Unit tests
pnpm test

# Unit tests with coverage
pnpm test -- --coverage

# Production build
pnpm build

# E2E tests (requires build first)
pnpm test:e2e
```

## Common Workflows

### Creating a Pull Request

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push branch: `git push origin feature/my-feature`
4. Create PR: `gh pr create --title "Add Feature" --body "Description"`
5. Wait for CI checks to pass
6. Check Vercel preview deployment
7. Request review and merge

### Fixing Failed CI

1. **Lint Failures:**

   ```bash
   pnpm lint:fix  # Auto-fix issues
   pnpm lint      # Verify
   ```

2. **Type Failures:**

   ```bash
   pnpm check-types  # See errors
   # Fix type issues manually
   ```

3. **Test Failures:**

   ```bash
   pnpm test              # Run locally
   pnpm test -- --watch   # Debug specific test
   ```

4. **Build Failures:**
   ```bash
   pnpm build         # Reproduce locally
   # Check build logs for errors
   ```

### Debugging CI Issues

**View workflow runs:**

```bash
gh run list --workflow=CI.yml --limit=10
```

**View specific run:**

```bash
gh run view <run-id>
```

**View failed logs:**

```bash
gh run view <run-id> --log-failed
```

**Re-run failed jobs:**

```bash
gh run rerun <run-id>
```

## Secrets Management

### GitHub Secrets

**How to add:**

```bash
# Via GitHub CLI
gh secret set SECRET_NAME

# Via GitHub UI
Settings → Secrets and variables → Actions → New repository secret
```

**Required secrets:**

- `DIFY_API_KEY` - Dify API key (keep secret)
- `DIFY_API_URL` - Dify API URL (e.g., https://api.dify.ai/v1)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for E2E test account cleanup)
- `SENTRY_AUTH_TOKEN` - Optional for source map uploads

**List secrets:**

```bash
gh secret list
```

### Vercel Environment Variables

**How to add:**

1. Visit Vercel project settings
2. Go to "Environment Variables"
3. Add variable for each environment:
   - Production (main branch)
   - Preview (all PRs)
   - Development (local dev)

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Branch Protection (Recommended Setup)

### Enable Protection Rules

**Via GitHub UI:**

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass:
     - `lint` (Lint & Types)
     - `unit-tests` (Unit Tests)
     - `e2e` (Build & E2E)
   - ✅ Require branches to be up to date
   - ✅ Restrict force pushes
   - ✅ Restrict deletions

**Via GitHub CLI:**

```bash
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=lint \
  --field required_status_checks[contexts][]=unit-tests \
  --field required_status_checks[contexts][]=e2e \
  --field enforce_admins=true \
  --field required_pull_request_reviews[required_approving_review_count]=1
```

## Monitoring & Observability

### GitHub Actions Dashboard

View all workflow runs:
https://github.com/USER/REPO/actions

### Vercel Dashboard

View all deployments:
https://vercel.com/USER/PROJECT

### Build Artifacts

**Test Results:**

- Uploaded on E2E test failure
- Location: Workflow run → Artifacts
- Includes: `test-results/` and `playwright-report/`

## Maintenance

### Updating Dependencies

When updating dependencies that affect CI:

1. Update `package.json` and run `pnpm install`
2. Test locally: `pnpm lint && pnpm check-types && pnpm test && pnpm build`
3. Push to feature branch and verify CI passes
4. Merge if all green

### Updating Workflows

When modifying `.github/workflows/*.yml`:

1. Test on feature branch first
2. Verify workflow syntax with `actionlint` (if available)
3. Monitor first run carefully
4. Document changes in this file

## Support

**Common Issues:**

- See `docs/ci-cd-troubleshooting.md` for detailed troubleshooting

**GitHub Actions Documentation:**

- https://docs.github.com/en/actions

**Vercel Documentation:**

- https://vercel.com/docs

**Next.js CI/CD:**

- https://nextjs.org/docs/deployment
