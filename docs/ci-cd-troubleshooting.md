# CI/CD Troubleshooting Guide

Common issues and solutions for the CI/CD pipeline.

## Lint Failures

### Issue: ESLint Errors

**Symptom:**
```
Error: Command failed: npm run lint
✖ 10 problems (5 errors, 5 warnings)
```

**Solution:**
```bash
# Try auto-fix first
npm run lint:fix

# Then verify
npm run lint
```

**Common Causes:**
- Import order violations → Auto-fixable
- Unused variables → Remove or prefix with `_`
- Missing dependencies in useEffect → Add to deps or use eslint-disable comment
- Console statements → Remove or use proper logging

**If Auto-fix Doesn't Work:**
1. Read the error message carefully
2. Go to the file and line number
3. Fix manually according to the rule
4. Consider adding eslint-disable comment if intentional

### Issue: YAML Linting Errors

**Symptom:**
```
Error: Strings must use singlequote
Error: Must use plain style scalar
```

**Solution:**
- Remove quotes from YAML values unless they contain special characters
- Use plain scalars (no quotes) for simple strings
- Use single quotes only when necessary

**Example:**
```yaml
# Bad
name: "my-agent"
purpose: "Does things"

# Good
name: my-agent
purpose: Does things
```

## Type Check Failures

### Issue: TypeScript Errors

**Symptom:**
```
Error: Command failed: npm run check-types
src/components/Example.tsx:10:5 - error TS2322: Type 'string' is not assignable to type 'number'
```

**Solution:**
1. Run locally: `npm run check-types`
2. Fix type errors in your IDE
3. Use proper types, don't use `any`
4. Verify fix: `npm run check-types`

**Common Causes:**
- Missing type definitions
- Incorrect prop types
- Async/await without Promise type
- Missing null checks

**Tips:**
- Use your IDE's TypeScript features
- Hover over red squiggles for hints
- Use type inference when possible
- Be explicit when inference fails

### Issue: Missing Type Definitions

**Symptom:**
```
error TS7016: Could not find a declaration file for module 'some-package'
```

**Solution:**
```bash
# Install types
npm install --save-dev @types/some-package

# Or declare module in src/types/index.d.ts
declare module 'some-package';
```

## Test Failures

### Issue: Unit Tests Failing

**Symptom:**
```
Error: Command failed: npm test
FAIL src/components/Example.test.tsx
  ✕ should render correctly (5 ms)
```

**Solution:**
```bash
# Run tests locally
npm test

# Run specific test file
npm test src/components/Example.test.tsx

# Run in watch mode for debugging
npm test -- --watch

# See detailed output
npm test -- --verbose
```

**Common Causes:**
- Snapshot mismatches → Update with `npm test -- -u`
- Async timing issues → Use `waitFor` from Testing Library
- Mock issues → Verify mocks are set up correctly
- Environment differences → Check test setup files

### Issue: E2E Tests Failing

**Symptom:**
```
Error: Timeout 30000ms exceeded
Error: locator.click: Target closed
```

**Solution:**
```bash
# Run E2E locally
npm run test:e2e

# Run specific test
npx playwright test tests/e2e/Example.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Generate report
npx playwright show-report
```

**Common Causes:**
- Timeout issues → Increase timeout or fix slow operation
- Selector issues → Use Playwright Inspector to debug
- Race conditions → Add proper waits
- Environment variables missing → Check `.env.local`

### Issue: E2E Tests Pass Locally, Fail in CI

**Symptom:**
Tests pass on your machine but fail in GitHub Actions.

**Solution:**
1. Check environment variables are set in GitHub Secrets
2. Verify Playwright browsers are installed in CI
3. Check for timing issues (CI is slower)
4. Review CI logs for specific errors

**Common Causes:**
- Missing secrets in GitHub
- Different Node version (check `.nvmrc`)
- Race conditions exposed by slower CI environment
- File path differences (Windows vs Linux)

## Build Failures

### Issue: Next.js Build Fails

**Symptom:**
```
Error: Command failed: npm run build
Failed to compile.
```

**Solution:**
```bash
# Reproduce locally
npm run build

# Check for errors
# Fix issues in source files
# Verify fix
npm run build
```

**Common Causes:**
- TypeScript errors in production build
- Missing environment variables
- Import errors (case sensitivity)
- Circular dependencies
- Bundle size too large

### Issue: Build Succeeds Locally, Fails in CI

**Symptom:**
Build works on your machine but fails in GitHub Actions.

**Solution:**
1. Check environment variables in GitHub Secrets
2. Verify `SENTRY_AUTH_TOKEN` if using Sentry
3. Check for file system case sensitivity issues
4. Review build logs in CI

**Example:**
```bash
# Check if all required secrets are set
gh secret list
```

### Issue: Sentry Source Map Upload Fails

**Symptom:**
```
Error: Failed to upload source maps to Sentry
```

**Solution:**
1. Check `SENTRY_AUTH_TOKEN` is set in GitHub Secrets
2. Verify token has correct permissions
3. Build will still succeed (source map upload is optional)

**Note:** If you don't use Sentry, this warning is safe to ignore.

## Deployment Failures

### Issue: Vercel Preview Deployment Fails

**Symptom:**
PR comment shows "Deployment failed" or no preview URL.

**Solution:**
1. Check Vercel dashboard for error logs
2. Verify environment variables in Vercel project settings
3. Check build logs for specific errors
4. Ensure Vercel GitHub app has access to repository

**Common Causes:**
- Missing environment variables in Vercel
- Build command incorrect
- Output directory incorrect
- Vercel project not connected

### Issue: Vercel Production Deployment Fails

**Symptom:**
Merge to main doesn't trigger deployment or deployment fails.

**Solution:**
1. Check Vercel project settings → Git
2. Verify production branch is set to `main`
3. Check environment variables for production
4. Review deployment logs in Vercel dashboard

### Issue: Environment Variables Not Working in Vercel

**Symptom:**
Application errors about missing environment variables in deployed app.

**Solution:**
1. Go to Vercel project → Settings → Environment Variables
2. Add each required variable
3. Set correct environment (Production/Preview/Development)
4. Redeploy after adding variables

**Important:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to browser
- Other variables are server-side only
- Each environment needs variables set separately

## Branch Protection Issues

### Issue: Cannot Merge PR

**Symptom:**
"Required status checks must pass before merging"

**Solution:**
1. Check which CI checks are failing
2. Fix issues in your branch
3. Push fixes
4. Wait for CI to re-run
5. Merge when all checks pass

### Issue: Force Push Blocked

**Symptom:**
```
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally
```

**Solution:**
- Don't force push to protected branches
- Use `git pull` to sync with remote
- Resolve conflicts locally
- Push normally

**For Main Branch:**
Never force push to `main`. If you need to revert:
```bash
git revert <commit-hash>
git push origin main
```

## Secret Management Issues

### Issue: Secret Not Available in Workflow

**Symptom:**
```
Warning: Environment variable SECRET_NAME is not set
```

**Solution:**
```bash
# Check if secret exists
gh secret list

# Add secret
gh secret set SECRET_NAME

# Paste value when prompted
```

**Verify in Workflow:**
Secrets must be explicitly passed to steps:
```yaml
env:
  SECRET_NAME: ${{ secrets.SECRET_NAME }}
```

### Issue: Secret Values Changed

**Symptom:**
CI fails after rotating credentials.

**Solution:**
1. Update GitHub Secrets: `gh secret set SECRET_NAME`
2. Update Vercel Environment Variables
3. Re-run failed workflows

## Cache Issues

### Issue: CI Uses Stale Dependencies

**Symptom:**
CI fails with outdated dependencies after updating package.json.

**Solution:**
- Wait for CI to complete (cache updates automatically)
- Cache is keyed by `package-lock.json` hash
- New hash = fresh install

**Manual Cache Clear (if needed):**
1. Go to GitHub Actions → Caches
2. Delete relevant cache
3. Re-run workflow

### Issue: Playwright Browsers Not Cached

**Symptom:**
E2E job takes long time downloading browsers every run.

**Solution:**
- Check cache configuration in CI.yml
- Verify `PLAYWRIGHT_BROWSERS_PATH` is set correctly
- Check cache key matches

**Current Configuration:**
```yaml
env:
  PLAYWRIGHT_BROWSERS_PATH: ~/.cache/ms-playwright
```

## Workflow Syntax Errors

### Issue: Invalid YAML in Workflow File

**Symptom:**
```
Error: The workflow is not valid. .github/workflows/CI.yml: unexpected character
```

**Solution:**
1. Validate YAML syntax
2. Check indentation (must be consistent spaces, not tabs)
3. Verify all strings are properly quoted if needed
4. Test workflow on feature branch first

**Validation Tools:**
```bash
# Install actionlint
brew install actionlint  # macOS
# or see https://github.com/rhysd/actionlint

# Validate workflows
actionlint .github/workflows/*.yml
```

## Performance Issues

### Issue: CI Takes Too Long

**Symptom:**
CI runs exceed 15-20 minutes regularly.

**Current Optimizations:**
- npm caching enabled
- Playwright browser caching enabled
- Parallel job execution

**Further Optimization:**
1. Add Next.js build cache
2. Shard E2E tests
3. Run E2E conditionally (only when relevant files change)
4. Use faster CI runners (GitHub Actions)

### Issue: E2E Tests Timeout

**Symptom:**
```
Error: Test timeout of 30000ms exceeded
```

**Solution:**
1. Increase timeout in test:
   ```typescript
   test('slow test', async ({ page }) => {
     test.setTimeout(60000);
     // test code
   });
   ```

2. Or in playwright.config.ts:
   ```typescript
   export default {
     timeout: 60000,
     // ...
   };
   ```

3. Optimize test to be faster:
   - Use faster selectors
   - Reduce unnecessary waits
   - Mock external API calls

## Getting Help

### Check Logs

**GitHub Actions:**
```bash
# List recent runs
gh run list --workflow=CI.yml --limit=10

# View specific run
gh run view <run-id>

# View failed logs
gh run view <run-id> --log-failed
```

**Vercel:**
1. Visit Vercel dashboard
2. Go to Deployments
3. Click failed deployment
4. Review build logs

### Re-run Failed Jobs

```bash
# Re-run entire workflow
gh run rerun <run-id>

# Re-run only failed jobs
gh run rerun <run-id> --failed
```

### Still Stuck?

1. Check recent changes to workflow files
2. Compare with known working commit
3. Review GitHub Actions status: https://www.githubstatus.com
4. Check Vercel status: https://www.vercel-status.com
5. Search GitHub Actions community forum
6. Check project issues/discussions

## Prevention

### Before Pushing

Run checks locally:
```bash
# Full check
npm run lint && npm run check-types && npm test && npm run build

# Quick check
npm run lint && npm run check-types
```

### Before Creating PR

1. Ensure all tests pass locally
2. Run E2E tests if you changed features
3. Check your branch is up to date with main
4. Write clear commit messages (conventional commits)

### Good Practices

- Commit often, push frequently
- Keep PRs small and focused
- Test locally before pushing
- Monitor CI immediately after pushing
- Fix CI failures quickly (don't let them pile up)
- Update dependencies regularly
- Keep workflow files simple
