# Checks Data Documentation

## File: checks.csv

Production-readiness audit checks for VT SaaS Template projects.

## Column Definitions

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | integer | yes | Unique sequential identifier (1-35) |
| `domain` | string | yes | Audit domain grouping (e.g., "Auth & Infrastructure", "SEO", "Email") |
| `name` | string | yes | Human-readable check name displayed in the report |
| `tier` | enum | yes | Launch gate: `alpha`, `full`, or `polish` |
| `scan_method` | string | yes | How the agent should execute this check (see syntax below) |
| `description` | string | yes | Detailed instruction for the scanning agent |

## Tier Definitions

- **alpha** — Must pass for any public deployment. Blockers prevent alpha launch.
- **full** — Must pass for production-ready launch. Blockers prevent full launch.
- **polish** — Nice-to-have. Failures are opportunities, not blockers.

## scan_method Syntax

| Prefix | Arguments | Example | Behavior |
|--------|-----------|---------|----------|
| `grep_env` | `VAR_NAME` | `grep_env:RESEND_API_KEY` | Search .env* files for variable name |
| `grep_file` | `path:pattern` | `grep_file:src/proxy.ts:protectedPaths` | Search specific file for pattern |
| `grep_source` | `pattern` | `grep_source:generateMetadata` | Search src/ directory for pattern (supports `\|` OR) |
| `grep_config` | `glob_pattern` | `grep_config:sentry.*.config.ts` | Search config files matching glob |
| `glob` | `pattern` | `glob:src/app/sitemap.ts` | Check if files matching glob exist (supports `AND`, `OR`) |
| `read_file` | `path` | `read_file:README.md` | Read file contents for analysis |
| `command` | `cmd` | `command:npm run build` | Execute shell command, check exit code |
| `compare_locale_keys` | (none) | `compare_locale_keys` | Special: compare JSON keys across locale files |
| `analyze_build_output` | (none) | `analyze_build_output` | Special: analyze .next/ output for bundle sizes |
| `check_framework_detection` | (none) | `check_framework_detection` | Special: verify Vercel framework auto-detection |

## Domains

| Domain | Check IDs | Count |
|--------|-----------|-------|
| Auth & Infrastructure | 1-7 | 7 |
| Security | 8, 34 | 2 |
| Observability | 9 | 1 |
| i18n | 10, 26-27 | 3 |
| Content | 11, 33 | 2 |
| SEO | 12-15, 24 | 5 |
| Email | 16-18, 25 | 4 |
| Legal | 19-20 | 2 |
| Performance | 21, 32 | 2 |
| UX | 22-23 | 2 |
| CI/CD | 29 | 1 |
| E2E | 30-31 | 2 |
| Analytics | 35 | 1 |
| Accessibility | 28 | 1 |

## Updating Checks

When adding new checks:

1. Assign the next sequential `id`
2. Place in the appropriate `domain` (or create a new one)
3. Set `tier` based on launch criticality
4. Define a `scan_method` using the syntax above
5. Write a `description` specific enough for an LLM agent to execute the check unambiguously
6. Update sub-agent groupings in `step-02-scan.md` to include the new check
