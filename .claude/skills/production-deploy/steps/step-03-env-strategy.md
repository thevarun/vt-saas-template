---
name: step-03-env-strategy
description: Produce the per-environment variable + secret strategy for local / preview / production. Decides what must differ per env, what stays shared, what is auto-set by integrations. Output is a reference table Phase 4 executes against.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-03-env-strategy.md
nextStepFile: .claude/skills/production-deploy/steps/step-04-core-infra.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
---

# Phase 3 — Env Strategy

## STEP GOAL

Walk out of this phase with an env-plan document appended to `{stateFile}` listing, for every env var the project needs: its value-type (same-across-envs | per-env | auto-set | secret-rotated-per-env), its source (user-input | provider-dashboard | CLI-generated | integration-managed), and where it ends up (Vercel prod / preview / dev, GitHub Actions secrets, local `.env.local`). No infra action in this phase; pure planning.

## MANDATORY EXECUTION RULES

- Read `src/libs/Env.ts` (or the project's Zod env schema) as source of truth for required vars.
- Read `.env.example` for documented defaults.
- Do not add actual values anywhere in this phase. Names and strategy only.
- Fetch current env var naming for providers via context7 (catches drift, e.g., PostHog).

## Sequence of Instructions

### 1. Build the canonical var list

From `src/libs/Env.ts` + `.env.example`, produce the full list of required env vars. For each, start a row with: `name`, `type` (string / number / enum / secret), `used_by` (client | server | both — detected via `NEXT_PUBLIC_` prefix).

### 2. Classify each var

For each var, assign one of five strategies:

| Strategy | Description | Examples |
|---|---|---|
| **`shared-all-envs`** | Same value in local, preview, production | `SEARCH_PROVIDER`, `EMAIL_FROM_NAME`, `DB_SCHEMA` |
| **`per-env`** | Different value per env (cost attribution, scope, env tag) | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `OPENAI_API_KEY`, `TAVILY_API_KEY`, `LANGFUSE_TRACING_ENVIRONMENT` |
| **`rotate-per-env`** | Must be unique per env for security; rotate together | `TOKEN_ENCRYPTION_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` |
| **`auto-set`** | Integration creates and injects (do not manage) | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `VERCEL_*` |
| **`prod-only`** | Exists only in production (preview uses auto-detect, dev omits) | `NEXT_PUBLIC_APP_URL` (preview auto-uses Vercel URL) |

### 3. Apply the cost lens (fold in Phase 2 findings)

For any var that has a paid provider: decide whether prod and dev share the same key or use separate keys for cost attribution. Default: separate keys for paid AI providers (OpenAI, Anthropic, Gemini, Tavily, Perplexity), shared for unmetered providers (PostHog until growth, Langfuse if same project can env-tag).

### 4. Apply the observability lens

For observability providers:
- **Sentry**: DSN shared across envs is OK (events tagged with env). Auth token shared OK (for source maps).
- **Langfuse**: Same project + `LANGFUSE_TRACING_ENVIRONMENT=production|preview|development` is the cheap pattern.
- **PostHog**: Same project is typical; env tag via event property.

### 5. Assign destinations

For each var, list destinations:
- `vercel:production`
- `vercel:preview`
- `vercel:development` (if Vercel dev env used)
- `github-actions:secrets` (CI only — typically dev-project Supabase, not prod)
- `local:.env.local`

Rule: **CI secrets should NOT point to prod** (CI tests shouldn't touch prod data). Point CI at dev-project Supabase.

### 6. Output the env-plan table

Append to `{stateFile}` under `## Phase 3 — Env Plan`:

```markdown
| Name | Strategy | Vercel prod | Vercel preview | Vercel dev | GH Actions | .env.local |
|---|---|---|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | per-env | prod-url | dev-url | dev-url | dev-url | dev-url |
| TOKEN_ENCRYPTION_KEY | rotate-per-env | prod-key | dev-key | dev-key | — | dev-key |
| OPENAI_API_KEY | per-env | prod-key | dev-key | dev-key | — | dev-key |
| INNGEST_EVENT_KEY | auto-set | auto | auto | — | — | — |
| NEXT_PUBLIC_APP_URL | prod-only | https://prod | — | — | — | — |
| ... | | | | | | |
```

Also capture **var names that came out of context7 drift checks** (e.g., `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` vs legacy `NEXT_PUBLIC_POSTHOG_KEY` — confirm which one the code uses now; reconcile if needed).

### 7. Flag secret-rotation concerns

For each `rotate-per-env` var, note rotation strategy:
- `TOKEN_ENCRYPTION_KEY`: rotating orphans encrypted-at-rest tokens. Plan: not rotated casually; tied to env creation.
- `STRIPE_WEBHOOK_SECRET`: rotate when the webhook endpoint is re-created.
- `SUPABASE_SERVICE_ROLE_KEY`: keep safe; rotate only on compromise.

### 8. Phase 3 Gate

```
=== PHASE 3: ENV STRATEGY — SUMMARY ===

Total vars: {N}
  shared-all-envs:    {n}
  per-env:            {n}
  rotate-per-env:     {n}
  auto-set:           {n}
  prod-only:          {n}

Drift reconciliations required: {n}
  <one-liner each>

Cost-attribution pairs (separate keys prod vs dev): {list}

Destinations matrix appended to {stateFile}

Sharpest failure mode 3 months in:
  <typical: "prod env var mis-scoped to preview, leaking prod data through preview URLs">

[C] Continue to Phase 4 (core infra execution using this plan)
[R] Revise a strategy assignment
[X] Exit
```

**If `planMode=true`:** Display `[Dry-run complete — phases 1–3 executed; re-invoke without --plan to run phases 4–8]` and stop. Do not load `{nextStepFile}`. This is the documented dry-run boundary (`SKILL.md` invocation modes: "Phase 3 exit adds a 'Dry-run complete — re-invoke without --plan to execute' banner instead of advancing to Phase 4").

**If C:** Load `{nextStepFile}`. Pass forward: env-plan table.

**If R:** Edit specific rows, re-display.

**If X:** Stop cleanly.
