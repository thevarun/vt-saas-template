---
name: step-02-readiness
description: Three-bucket readiness audit — Mechanical (build/lint/test/PRs/git), Hygiene (rate limits, tiers, auth flows, admin gate, RLS, abuse), Cost (SSG, sampling, auto-migration, quotas, spend caps). Fixes gaps in-place before any production infra work begins.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-02-readiness.md
nextStepFile: .claude/skills/production-deploy/steps/step-03-env-strategy.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
---

# Phase 2 — Readiness

## STEP GOAL

Walk out of this phase with a repo that: (a) builds clean locally against production-like settings, (b) will not be abused or bypassed on day 1, and (c) won't leak money on idle traffic. Gaps found in any bucket are fixed in-place (committed to a branch, PR'd and merged) before moving on. If a gap cannot be fixed in-session, it gets logged in the state file with a decision ("defer with known risk" vs "block deploy").

## MANDATORY EXECUTION RULES

- **If `planMode=true` (from `--plan` invocation): propose fixes but do not apply or commit.** For each gap, output the proposed diff and note `[plan mode — not applied]`. Run all read-only checks (build, type-check, lint, test, audits) normally; skip every write/commit/PR. Mirrors the dry-run contract in `SKILL.md` ("Phase 2 hygiene fixes are proposed, not applied in plan mode") and the simulate-only pattern in `step-04-core-infra.md`.
- Read the Phase 1 risk-review findings first — many HIGH-severity drift items are auto-fixed in this phase (e.g., PostHog env var rename).
- Land readiness fixes before Phase 3 — branch + PR if the project gates on review, otherwise direct commits. Commit per bucket for legibility.
- Do not suppress errors. If build fails, diagnose the root cause and fix. Do not lower the lint bar to pass.
- Spawn `deploy-risk-reviewer` once at the end with the full Phase 2 artifact set.

## Sequence of Instructions

### 1. Mechanical readiness

Run the project's production build, type-check, lint, and test commands as defined in the package manifest (or equivalent for the detected package manager). Note any missing script as a gap rather than failing.

Checks to pass:
- Clean dependency install
- Production build
- Type checking (strict mode)
- Lint
- Unit tests
- No uncommitted drift (`git status --short`)
- Nothing left in flight (`git log main..HEAD --oneline`)
- Open PRs triaged (`gh pr list --state open`)

_e.g. (npm):_ `npm ci && npm run build && npm run check-types && npm run lint && npm run test`

Also verify:
- Node version matches Vercel's current default (context7 fetch or `vercel.json` engines)
- TypeScript version pinned in `package.json`
- No migration files committed on a non-main branch (project's pre-commit hook verifies this)
- Latest `main` pulled

**Decisions:**
- Failing checks → fix, do not proceed.
- Open PRs → triage (merge/close). Stale Dependabot major bumps are a specific risk (session history: eslint group major broke post-deploy). Recommend merge/close all before starting Phase 3 so a clean main is the deploy base.

### 2. Hygiene readiness

Verify the following hygiene properties by inspecting the project's middleware, route handlers, and relevant utility modules:

| Check | What to verify |
|---|---|
| RLS on all app tables | Row-level security policies exist for every user-facing table (check migration files + live DB) |
| Quota/tier enforcement | AI and paid-feature endpoints are gated by the project's quota/tier mechanism |
| Admin gate (defense in depth) | Admin routes protected at BOTH middleware and handler level |
| Dev-only auth bypass blocked | Any development-only login endpoint is environment-gated to reject production requests |
| Rate limiting on public endpoints | Rate limiter applied to each public API route |
| CORS scoped | Allowed origins restricted to the project's domains |
| Auth flow works | Run signup + sign-in locally against dev auth provider |
| No secrets in repo | `git grep -E "(api_key|secret|password).*=.*['\"][^'\"]{20,}['\"]"` |
| Env example current | Diff `.env.example` (or equivalent) against the env schema |

_Discovery approach:_ Read the project's auth setup, middleware, and API directory to locate the actual function/module names. Do not assume specific symbols.

For any gap: propose fix, show diff, confirm, apply, commit.

### 3. Cost readiness

| Check | Fix if gap |
|---|---|
| Landing page is SSG (not server-rendered per request) | Add `setRequestLocale()` + `generateStaticParams()` for locales |
| Sentry `tracesSampleRate` env-aware (prod ≤ 0.1, dev = 1.0) | Env-gated config |
| Sentry `replaysOnErrorSampleRate` off for alpha | 0 in prod |
| DB auto-migration disabled in production | Guard `migratePg()` with `NODE_ENV !== 'production'` |
| Free/expired user AI quotas gated to fallback model | Verify `src/libs/ai/config.ts` or quota gate |
| Premium AI features quota-gated (image gen, high-tier models) | Verify `checkQuota` entries |
| Separate API keys planned for prod vs dev | Flag for Phase 3 env strategy |
| Vercel on-demand cap proposal | Default $200 for alpha; confirm with user |
| OpenAI monthly cap | Proposal ($20-30 for alpha) |

For each gap: propose fix, confirm, apply, commit.

### 4. Land readiness fixes

If `planMode=true`: do not land anything — present the consolidated set of proposed fixes (each marked `[plan mode — not applied]`) and move to the gate.

Otherwise, land all readiness fixes before Phase 3. If the project gates on code review, use a feature branch + PR + merge. Otherwise, direct commits to the working branch are acceptable. Keep the bucket-per-commit structure for legibility regardless of workflow.

### 5. Phase 2 Gate

Spawn `deploy-risk-reviewer` with phase-2 rubric: "review the readiness fixes and confirm no regressions introduced. Flag any gap that was not fixed but should have been."

Show summary, gate as standard:
```
=== PHASE 2: READINESS — SUMMARY ===

Mechanical:  <pass/fail counts>
Hygiene:     <gaps found / fixed / deferred>
Cost:        <gaps found / fixed / deferred>

Deferred items (with rationale):
  - <item>: <why deferred — will address in Phase <N>>

Risk review findings: HIGH {n} | MEDIUM {n} | LOW {n}

[C] Continue to Phase 3 (env strategy)
[R] Revise — re-run a specific bucket / fix a specific gap
[X] Exit (state preserved)
```

**If C:** Load `{nextStepFile}`. Pass forward: PR URL, list of deferred items.

**If R:** Jump to specific fix.

**If X:** Stop cleanly.
