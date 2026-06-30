---
name: step-05-integrations
description: Dispatcher — executes dependency-group B integrations (OAuth providers, payment processors, background jobs, custom webhooks — things that need Phase 4's infra to be live). Uses the same dispatcher pattern as Phase 4: manifest-driven, reference-file-sourced, sub-item state, per-integration risk review.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-05-integrations.md
nextStepFile: .claude/skills/production-deploy/steps/step-06-smoke-test.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
integrationsDir: .claude/skills/production-deploy/references/integrations
riskReviewerAgentFile: .claude/skills/production-deploy/agents/deploy-risk-reviewer.md
---

# Phase 5 — Feature Integrations (manifest dispatcher, group B)

## STEP GOAL

Execute every integration marked as dependency-group B in the Phase 1 manifest — the ones that need Phase 4's infra to be live first. Typical group B contains OAuth providers, Stripe sandbox, background jobs (Inngest/QStash), and custom webhook integrations (n8n/Zapier). Exits with every declared integration functional on the deployed app.

## MANDATORY EXECUTION RULES

- Same dispatcher pattern as Phase 4 — read manifest (group B), walk in dependency order, dispatch to reference files.
- **Live Stripe is out of scope** for this skill. Only configure Stripe in test/sandbox mode. Flag the live transition as a separate ceremony (future `stripe-live-transition` skill).
- Sub-item state granularity applies (same as Phase 4). Stripe product creation is non-idempotent-by-default — the reference file's pre-checks matter.
- Spawn `deploy-risk-reviewer` per integration with a narrow rubric.
- Respect `planMode` — dry-run describes, doesn't execute.

## Sequence of Instructions

### 1. Load manifest and compute dependency order for group B

Read `{stateFile}` manifest, filter to group B (or "feature" — whatever the manifest calls post-infra integrations).

**Typical group B order** (override if manifest says otherwise):
1. OAuth providers (parallel — no inter-dependency; but need domain live from Phase 4)
2. Payment processor sandbox (Stripe test mode: products → prices → webhook → restricted key → DB linking)
3. Background jobs (Inngest via Vercel integration, with Deployment Protection bypass)
4. Custom webhook integrations (n8n, Zapier, etc.)
5. Project-specific unknown integrations (context7-researched at runtime)

### 2. Dispatcher loop

Same shape as Phase 4 step 3. For each integration:

```
for integration in execution_list:
  if state_file[phase_5][integration].status == "complete": skip
  ref = read("{integrationsDir}/{integration}.md") or context7-generate
  display ref.summary
  for substep in ref.setup_steps:
    if state_file[phase_5][integration][substep.id].status == "complete": skip
    execute(substep)  # planMode: describe only
    state_file.save()
  spawn deploy-risk-reviewer (narrow rubric)
  mark integration complete
```

### 3. Integration-specific concerns (applied via reference files)

These notes are reminders of what the relevant reference files must cover. When authoring or updating a reference file, make sure these are addressed:

**OAuth providers** (`oauth-{provider}.md`):
- Dual-callback pattern for any provider used both for sign-in AND platform-connect. Register BOTH redirect URIs in the provider's app settings.
- Supabase OIDC wire-up (if sign-in): enable provider under Supabase Auth → Providers, paste Client ID/Secret.
- Verify the flow end-to-end via Playwright MCP if available.
- Handle Google Safe Browsing caveat for fresh domains (see known-pitfalls.md).

**Stripe sandbox** (`stripe.md`):
- **TEST MODE ONLY**. Skill must refuse live-mode in Phase 5 — direct user to the separate live-transition skill.
- Minimum webhook event set — grep `src/app/api/stripe/webhook` for what the app actually handles; don't subscribe to more.
- Restricted API key scope: narrowest possible.
- DB tier linking SQL: show before running.

**Background jobs** (`inngest.md` or equivalent):
- Deployment Protection bypass key — sync silently fails without it (see known-pitfalls.md).
- Verify function registration in provider dashboard after deploy.
- Fire one test event to confirm end-to-end.

**Custom webhooks** (`n8n.md`, `zapier.md`):
- Auth scheme from the app's webhook handler (`WEBHOOK_SECRET` HMAC / Bearer).
- If origin system has plan limitations (e.g., n8n Starter has no `$vars`), generate a config-update script for workflows that reference env vars the plan doesn't support.
- Test fire from origin → confirm app responds 200.

### 4. Unknown integrations (context7-first pattern)

For any integration in the manifest with no reference file:

1. Prompt user: "Describe what {name} does in this project."
2. Fetch current setup docs via context7 (or WebFetch fallback).
3. Propose setup steps; execute with user approval.
4. At phase end, offer to generate `{integrationsDir}/{name}.md` — persists the learning for future deploys of other forks.

### 5. Phase 5 Gate

Spawn `deploy-risk-reviewer` with phase-5 rubric: "for each integration, verify the flow works end-to-end, secrets are env-scoped correctly, webhook signatures verify, no drift between code and live config."

```
=== PHASE 5: FEATURE INTEGRATIONS — SUMMARY ===

Integrations executed ({completed}/{total} from group B):
  ✓ oauth-{provider}     — sign-in + platform-connect both working
  ✓ stripe-sandbox       — test mode; products + webhook; {N} events subscribed
  ✓ inngest              — {N} functions registered; bypass key configured
  ✓ custom-webhooks      — verified via test fire

New reference files generated for future deploys:
  <list if any>

Deferred for separate skills:
  - Stripe live mode — invoke `stripe-live-transition` when ready for paying customers.

Risk review: HIGH {n} | MEDIUM {n} | LOW {n}

[C] Continue to Phase 6 (smoke test)
[R] Re-run a specific integration
[X] Exit (state preserved)
```

**If C:** Load `{nextStepFile}`.
**If R:** Jump back; sub-item state ensures minimal re-work.
**If X:** Stop cleanly.
