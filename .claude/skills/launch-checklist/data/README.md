# Checks Data Documentation

## File: checks.csv

Production-readiness audit checks for VT SaaS Template projects.

## Column Definitions

| Column        | Type    | Required | Description                                                           |
| ------------- | ------- | -------- | --------------------------------------------------------------------- |
| `id`          | integer | yes      | Unique sequential identifier (1-43)                                   |
| `domain`      | string  | yes      | Audit domain grouping (e.g., "Auth & Infrastructure", "SEO", "Email") |
| `name`        | string  | yes      | Human-readable check name displayed in the report                     |
| `tier`        | enum    | yes      | Launch gate: `alpha`, `full`, or `polish`                             |
| `scan_method` | string  | yes      | How the agent should execute this check (see syntax below)            |
| `description` | string  | yes      | Detailed instruction for the scanning agent                           |

## Tier Definitions

- **alpha** — Must pass for any public deployment. Blockers prevent alpha launch.
- **full** — Must pass for production-ready launch. Blockers prevent full launch.
- **polish** — Nice-to-have. Failures are opportunities, not blockers.

## scan_method Syntax

| Prefix                      | Arguments           | Example                                     | Behavior                                                                              |
| --------------------------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `grep_env`                  | `VAR_NAME`          | `grep_env:RESEND_API_KEY`                   | Search .env* files for variable name                                                  |
| `grep_file`                 | `path:pattern`      | `grep_file:src/proxy.ts:protectedPaths`     | Search specific file for pattern                                                      |
| `grep_source`               | `pattern`           | `grep_source:generateMetadata`              | Search src/ directory for pattern (supports `\|` OR)                                  |
| `grep_config`               | `glob_pattern`      | `grep_config:sentry.*.config.ts`            | Search config files matching glob                                                     |
| `glob`                      | `pattern`           | `glob:src/app/sitemap.ts`                   | Check if files matching glob exist (supports `AND`, `OR`)                             |
| `read_file`                 | `path`              | `read_file:README.md`                       | Read file contents for analysis                                                       |
| `command`                   | `cmd`               | `command:npm run build`                     | Execute shell command, check exit code                                                |
| `compare_locale_keys`       | (none)              | `compare_locale_keys`                       | Special: compare JSON keys across locale files                                        |
| `analyze_build_output`      | (none)              | `analyze_build_output`                      | Special: analyze .next/ output for bundle sizes                                       |
| `check_framework_detection` | (none)              | `check_framework_detection`                 | Special: verify Vercel framework auto-detection                                       |
| `gh_api`                    | `path-or-jq`        | `gh_api:branches/main/protection`           | Live: `gh api repos/{owner}/{repo}/<path>`; interpret per description                 |
| `gh_cli`                    | `label`             | `gh_cli:secret-list`                        | Live: run a `gh` command (secret list, run/check status) per description              |
| `vercel_env`                | `VAR:env`\|`parity` | `vercel_env:RUN_PROD_MIGRATIONS:production` | Live: var exists in a Vercel env (Vercel MCP or `vercel env ls`); never prints values |
| `supabase_advisor`          | `type`              | `supabase_advisor:security`                 | Live: Supabase MCP `get_advisors(type)`                                               |

**Live checks (`gh_*`, `vercel_env`, `supabase_advisor`)** query the deployed platform, not the
filesystem. They MUST degrade to **WARN** (never a false PASS/FAIL) when the required tool
(`gh` CLI + auth, Vercel link, Supabase MCP) is unavailable.

## Domains

| Domain                | Check IDs | Count |
| --------------------- | --------- | ----- |
| Auth & Infrastructure | 1-7       | 7     |
| Security              | 8, 34, 43 | 3     |
| Observability         | 9         | 1     |
| i18n                  | 10, 26-27 | 3     |
| Content               | 11, 33    | 2     |
| SEO                   | 12-15, 24 | 5     |
| Email                 | 16-18, 25 | 4     |
| Legal                 | 19-20     | 2     |
| Performance           | 21, 32    | 2     |
| UX                    | 22-23     | 2     |
| CI/CD                 | 29        | 1     |
| E2E                   | 30-31     | 2     |
| Analytics             | 35        | 1     |
| Accessibility         | 28        | 1     |
| Platform              | 36-42     | 7     |

## Updating Checks

When adding new checks:

1. Assign the next sequential `id`
2. Place in the appropriate `domain` (or create a new one)
3. Set `tier` based on launch criticality
4. Define a `scan_method` using the syntax above
5. Write a `description` specific enough for an LLM agent to execute the check unambiguously
6. Update sub-agent groupings in `step-02-scan.md` to include the new check
