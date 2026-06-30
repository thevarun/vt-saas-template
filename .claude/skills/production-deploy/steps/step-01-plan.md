---
name: step-01-plan
description: Scan the repo, detect integrations, audit tool availability, fetch current provider docs, and produce a customized deployment checklist plus an initial risk review.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-01-plan.md
nextStepFile: .claude/skills/production-deploy/steps/step-02-readiness.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
checklistTemplate: .claude/skills/production-deploy/templates/deployment-checklist.template.md
integrationsDir: .claude/skills/production-deploy/references/integrations
pitfallsRef: .claude/skills/production-deploy/references/known-pitfalls.md
---

# Phase 1 — Plan

## STEP GOAL

Walk out of this phase with (a) a complete inventory of what's being deployed, (b) a current-docs view of each provider involved, (c) a verified list of MCP/CLI tools available for automation, (d) a written deployment checklist persisted to `_bmad-output/deployment-checklist.md`, and (e) a risk review flagging concerns the user should address before real work starts.

## MANDATORY EXECUTION RULES

- Read this step file fully before any tool call.
- No code or infra changes in this phase. Plan only. Writes are limited to the state file and planning artifacts.
- When fetching provider docs, prefer `context7` (MCP). Cite the doc source for every non-obvious config instruction you will emit later.
- Spawn the `deploy-risk-reviewer` agent at the end of the phase for a phase-boundary review.

## Sequence of Instructions

### 1. Absorb prior context

Read in parallel:
- `CLAUDE.md` — project conventions + tech stack
- Dependency manifest (`package.json` / `requirements.txt` / equivalent) — dependencies, scripts
- Env schema (Zod validation file, `.env.example`, or however the project defines required env vars)
- `.env.example` — documented env vars (if separate from schema above)
- `{stateFile}` — if present, existing deployment state
- Deployment guide/notes in `docs/` — if present
- Project memory index if present

If user mentioned URLs, past incidents, or additional context in the invoking prompt, fetch/read those too before classifying.

### 1b. Check upstream for queued backport candidates (bidirectional loop — inbound)

Prior deploys may have left issues on `thevarun/vt-saas-template` labeled `backport-from-deploy` that haven't been resolved yet. Pulling relevant ones in *before* this deploy means we don't rediscover them mid-flight. Requires `gh` authenticated against the template repo.

```bash
gh issue list \
  --repo thevarun/vt-saas-template \
  --label backport-from-deploy \
  --state open \
  --json number,title,url,createdAt,body
```

If zero results or `gh` not authenticated: note in state file and continue.

If results exist, present a compact summary:
```
Open backport candidates from prior deploys of your vt-saas-template forks:

  #42 (14 days old): PostHog env var rename (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`)
  #38 (23 days old): TS 6 baseUrl — add `ignoreDeprecations: "6.0"` to tsconfig
  #31 (35 days old): Supabase schema exposure — document the Data API setting

Pulling these in now means this deploy won't rediscover them.

[R] Review each and cherry-pick into this repo before proceeding
[P] Proceed as-is (logs the skipped issues in the state file so the risk reviewer can flag)
[X] Exit — handle them on the template repo first
```

If `R`: for each selected issue, show the proposed change, offer to apply as a commit on the current repo. Gate per issue with `[C] Apply / [R] Revise / [S] Skip this one`.

If `P`: record skipped issue numbers in the state file under `## Phase 1 — Skipped backport candidates`. The risk-reviewer spawn in step 7 will get this list and flag any later phase where the skipped issue would bite.

### 2. Detect integrations

Scan the codebase to build an integration manifest. For each match, record: integration name, evidence (file path + line), category (template-generic vs project-specific).

Start with the heuristic patterns below, then extend by reading `package.json` deps and the project's env schema. Cluster external services by category:

| Category | Detect via |
|---|---|
| Database | ORM imports (`drizzle-orm`, `prisma`, `typeorm`), `DATABASE_URL` |
| Auth provider | `@supabase/*`, `better-auth`, `next-auth`, `clerk`, `@auth/*` |
| Hosting | `.vercel/`, `vercel.json`, `vercel.ts`, `netlify.toml`, `fly.toml` |
| Payments | `@stripe/*`, `STRIPE_SECRET_KEY` |
| OAuth providers | `*_CLIENT_ID` / `*_CLIENT_SECRET` pairs in env schema |
| Background jobs | `inngest`, `trigger.dev`, `bullmq`, cron routes |
| Email | `resend`, `@sendgrid/*`, `nodemailer`, SES |
| Observability | `@sentry/*`, `posthog-*`, `langfuse`, `@vercel/otel` |
| AI providers | Provider SDK imports (`@ai-sdk/*`, `openai`, `anthropic`), `*_API_KEY` |
| Webhooks | Webhook route handlers, `*_WEBHOOK_SECRET` env vars |

For each detected integration, check whether a reference file exists at `{integrationsDir}/<name>.md`. If yes, read it — it contains project-conventions and gotchas. If no, mark the integration as "new — will research via context7 in step 4".

Classify each integration:
- **Template-generic**: Supabase, Vercel, Resend (auth emails), Sentry, GitHub CI, PostHog. These are in every vt-saas-template deploy.
- **Project-specific**: everything else.

### 3. Audit tool availability

For the required tool set (see orchestrator's Tool Strategy table) plus any provider-specific tools, run availability probes:

```bash
# CLIs
vercel --version 2>/dev/null && vercel whoami 2>/dev/null
gh --version 2>/dev/null && gh auth status 2>/dev/null
stripe --version 2>/dev/null
dig -v 2>&1 | head -1
# Node/TS versioning vs Vercel
node --version
cat package.json | grep -E '"(typescript|next)"'
```

For MCPs, attempt a trivial read-only call for each (e.g., `context7:resolve-library-id` with a known lib; Stripe MCP `get_stripe_account_info`; Supabase MCP `authenticate` status check). Record availability.

Produce a tool-availability table:
```
Tool                     | Status      | Action required
------------------------ | ----------- | ---------------
Vercel CLI               | OK          | —
Vercel MCP               | Not auth'd  | Run: /mcp authenticate vercel
gh CLI                   | OK          | —
Supabase MCP             | Not auth'd  | Run: /mcp authenticate supabase
Stripe MCP               | OK          | —
context7 MCP             | OK          | —
Playwright MCP           | OK          | —
...
```

If any critical tool is missing (Vercel CLI, `gh`, context7), halt and ask the user to authenticate them. Offer to auto-auth the MCPs the user approves.

### 3b. Context7 coverage probe

Before relying on context7 as the primary source for current provider docs, check coverage. For each detected provider, attempt to resolve a library ID:

```
for each provider in detected_integrations:
  result = mcp__context7__resolve-library-id(provider_name)
  if result has match: record library_id
  else: record as "no context7 coverage"
```

Produce a coverage table:
```
Provider      | context7 library_id              | Status
------------- | -------------------------------- | --------
supabase      | /supabase/supabase-js            | ✓ covered
vercel        | /vercel/vercel                   | ✓ covered
stripe        | /stripe/stripe-js                | ✓ covered
nextjs        | /vercel/next.js                  | ✓ covered
resend        | /resend/resend-node              | ✓ covered
sentry        | /getsentry/sentry-javascript     | ✓ covered
posthog       | /posthog/posthog-js              | ✓ covered
oauth-{provider} | —                             | ✗ no match — will use WebFetch
inngest       | —                                | ✗ no match — will use WebFetch
n8n           | —                                | ✗ no match — will use WebFetch
langfuse      | /langfuse/langfuse               | ✓ covered
```

**Fail loudly, not quietly.** If any provider with known drift risk (PostHog, Supabase, Next.js-on-Vercel, Sentry) lacks context7 coverage, surface as a HIGH-severity item to the Phase 1 gate — the skill's "live-docs-over-memory" guarantee is weaker for these and the user should know. For low-risk providers (unchanging OAuth providers like Google), note but don't block.

For uncovered providers, step 4 falls back to `WebFetch` on the provider's canonical setup URL (stored per-provider in `references/integrations/{provider}.md`); training-data recall is tertiary and always flagged `[LLM memory — verify]`.

### 4. Fetch current provider docs (live-docs-over-memory)

For each detected integration with drift risk, fetch current setup docs via context7 (or the fallback chain from step 3b). Cross-reference findings against `{pitfallsRef}` for known drift sites.

For each provider, validate that the project's code (env schema, config files) uses **current** API names, patterns, and conventions. Record any mismatches as "drift findings" to present at phase gate.

_Focus areas:_ env var naming (providers rename these regularly), SDK initialization patterns, webhook event names, auth token scopes, DNS record formats.

### 5. Build the deployment checklist

Copy `{checklistTemplate}` to `{stateFile}` if the state file does not exist (or is empty). If it exists, preserve completed items.

For each detected integration, ensure the checklist has a line item under the appropriate phase. For unknown integrations, append a phase-5 line item tagged `project-specific: <name>` with a "research via context7 at execution time" note.

Write any drift findings from step 4 as "Pre-execution fixes" at the top of Phase 2 (Readiness).

### 6. Known-pitfalls pass

Read `{pitfallsRef}`. For each pitfall entry, check whether it applies to this project (match by integration + conditions listed). Apply dated filter — flag entries older than 6 months as "verify current via context7 before relying on this".

Produce a "pitfalls to watch" list sized to the integrations detected.

### 7. Spawn deploy-risk-reviewer (first invocation — establishes the pattern)

The reviewer is bundled inside the skill, not at `.claude/agents/`. Spawn a `general-purpose` subagent with `model="opus"` and a prompt of the shape:

```
Read your persona and rubric at: .claude/skills/production-deploy/agents/deploy-risk-reviewer.md

You are reviewing Phase 1 (Plan) of a production deployment. Apply the 5-dimension rubric with focus on security and drift for this phase.

Artifacts to review (do not explore beyond these):
- Integration manifest (below)
- Tool-availability table (below)
- Drift findings (below)
- Pitfalls-to-watch list (below)
- .claude/CLAUDE.md (project conventions)
- src/libs/Env.ts (or the project's Zod env schema)
- package.json (dependencies + scripts)

<paste the manifest / table / findings / pitfalls here>

Return findings per the template in the agent file. Cap at 10. Include a Confidence line at the end.
```

Subsequent step files use the same pattern ("Spawn `deploy-risk-reviewer` with {phase} rubric..."); the invocation shape is fixed to the above.

### 8. Phase 1 Gate

Present:

```
=== PHASE 1: PLAN — SUMMARY ===

Integrations detected: <count>
  Template-generic: <list>
  Project-specific: <list>
  New (no local reference): <list>

Tools ready:    <count ready / total>
Tools missing:  <list, with one-line auth instructions>

Drift findings: <count>
  <one-line each>

Risk review findings (deploy-risk-reviewer):
  HIGH:   <count> — <short list>
  MEDIUM: <count>
  LOW:    <count>

State written to: _bmad-output/deployment-checklist.md

Sharpest failure mode 3 months in if we skip fixing the HIGHs:
  <one bullet, opinionated>

[C] Continue to Phase 2 (Readiness)
[R] Revise — address a specific finding or re-plan
[X] Exit (state preserved; safe to resume)
```

**If C:** Load and execute `{nextStepFile}`. Pass forward: integration manifest, tool-availability table, drift findings, risk review findings, state file path.

**If R:** Ask what to revise. Address the specific item (rerun a tool audit, fetch a specific provider doc, update the checklist, spawn the reviewer with a different rubric). Re-display the summary.

**If X:** Stop cleanly. Ensure the state file is saved.
