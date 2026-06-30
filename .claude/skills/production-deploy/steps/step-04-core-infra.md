---
name: step-04-core-infra
description: Dispatcher — executes the integrations in dependency-group A (infra that must be live before feature integrations) by walking the Phase 1 manifest in dependency order and dispatching each to its reference file. Typical group A contains DB + Auth, domain + hosting, env vars, email, observability, CI. Not hardcoded — whatever the manifest says.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-04-core-infra.md
nextStepFile: .claude/skills/production-deploy/steps/step-05-integrations.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
integrationsDir: .claude/skills/production-deploy/references/integrations
pitfallsRef: .claude/skills/production-deploy/references/known-pitfalls.md
riskReviewerAgentFile: .claude/skills/production-deploy/agents/deploy-risk-reviewer.md
---

# Phase 4 — Core Infra (manifest dispatcher, group A)

## STEP GOAL

Execute every integration marked as dependency-group A in the Phase 1 manifest, in dependency order, using each integration's reference file as the instruction source. Walk out of this phase with: DB + Auth live and configured, domain + hosting + env vars complete, email domain verified AND custom SMTP actually wired, observability capturing signal, CI secrets set. Nothing left for Phase 5 or Phase 6 to discover is missing.

## MANDATORY EXECUTION RULES

- This step is a **dispatcher**. It reads the manifest from `{stateFile}` and executes integrations in dependency order.
- For each integration, read `{integrationsDir}/{name}.md` as the setup source. If the file is missing, research via context7/WebFetch, execute with user confirmation, and offer to save a new reference file at end of section.
- State granularity is **sub-item level**: each integration's sub-steps are tracked individually. Pre-checks read state and skip already-completed items (idempotency).
- Secrets pattern: provider dashboard → Claude runs `vercel env add NAME env` (or equivalent) → `vercel env pull` → Claude verifies presence of `NAME`, never `VALUE`.
- Destructive-op preview: show the exact SQL/DNS/config before executing, require `[C] Confirm` each time.
- Spawn `deploy-risk-reviewer` at the end of each integration's section, with a narrow rubric scoped to what that integration just did.
- If `planMode=true` (from `--plan` invocation), simulate only: describe what would happen per integration, do not call any provider write API.

## Sequence of Instructions

### 1. Load manifest and compute dependency order

Read the integration manifest from `{stateFile}` (produced in Phase 1). Filter to `group: A` (or whatever the manifest field marks as "must-run-first"). Compute a topologically-sorted execution list.

**Default dependency order** (override if manifest says otherwise):
1. Database + Auth provider (Supabase / Neon+Clerk / Turso+Auth.js / etc.)
2. Domain + Hosting (Vercel project, domain DNS, SSL)
3. Vercel env vars applied from the Phase 3 env-strategy plan
4. Email sending domain (Resend / SES / Postmark) — must be verified before wiring into Auth provider's SMTP
5. Email wire-up into Auth provider (e.g., Supabase Auth → custom SMTP)
6. Observability (Sentry → PostHog → optional Langfuse)
7. AI provider spend caps (OpenAI / Gemini / Anthropic)
8. CI secrets + branch protection (GitHub Actions)

Rationale for each dependency: DB must exist before env vars (URL comes from DB). Domain must be live before OAuth can be configured (Phase 5 depends on this). Email domain must verify before SMTP wire-up. Observability can be parallel within itself but after env vars exist. AI caps are independent, can run anywhere after Vercel project exists.

Display the computed order to the user for confirmation:
```
Phase 4 execution plan ({N} integrations):
  1. supabase          (ref: supabase.md)
  2. vercel            (ref: vercel.md)
  3. vercel-env-apply  (applies Phase 3 plan)
  4. resend            (ref: resend.md)
  5. supabase-smtp-wire (ref: supabase.md#smtp — depends on resend verified)
  6. sentry            (ref: sentry.md)
  7. posthog           (ref: posthog.md)
  8. ai-spend-caps     (ref: ai-providers.md)
  9. github-ci         (ref: github.md)

[C] Execute in this order / [R] Revise order / [X] Exit
```

### 2. Tool availability recap

Re-run Phase 1's tool audit, filtered to tools needed by this phase's integrations. Missing tools → batch prompt for auth, halt until ready.

### 3. Dispatcher loop

For each integration in the execution list:

```
for integration in execution_list:
  # Pre-check: skip if already complete
  if state_file[phase_4][integration].status == "complete":
    skip (log "resumed: {integration} already complete")
    continue

  # Load reference
  ref = read("{integrationsDir}/{integration}.md")
  if ref missing:
    user_input = prompt("No reference for {integration}. Describe its purpose + link to provider docs.")
    ref = generate_from_context7(integration, user_input)
    offer_to_save(ref, path="{integrationsDir}/{integration}.md")

  # Announce section start
  display("━━━ Integration: {integration} ({position}/{total}) ━━━")
  display(ref.summary)

  # Execute ref's setup steps, respecting already-completed sub-items
  for substep in ref.setup_steps:
    if state_file[phase_4][integration][substep.id].status == "complete":
      skip
      continue
    execute(substep)  # in planMode: describe only, no side effects
    if substep.destructive:
      require_confirm_C()
    state_file[phase_4][integration][substep.id].status = "complete"
    state_file.save()

  # Risk review for this integration
  spawn deploy-risk-reviewer with rubric scoped to what just ran
  present findings
  if HIGH findings: gate "[C] Continue acknowledging / [R] Fix before proceeding"

  # Mark integration complete
  state_file[phase_4][integration].status = "complete"
  state_file.save()
```

### 4. Phase-level safety checks (run after dispatcher loop)

After all group-A integrations execute, run these cross-cutting checks before the gate:

- **Env var completeness**: `vercel env pull .env.prod-check` locally, diff against the project's env schema (Zod file, `.env.example`, or equivalent) required keys. Zero missing required keys is the gate to proceed. If any missing, loop back to the offending integration.
- **First prod deploy green**: either a deploy has already landed green (via git push to main) or trigger one now. If red, diagnose via `vercel logs`, fix, re-deploy.
- **Landing page resolves**: `curl -I https://{PRODUCTION_DOMAIN}` returns 200. SSL is active.
- **Custom SMTP actually wired** (not just DNS verified): trigger a test signup in Supabase Auth UI, confirm sender is branded address. This is a check that real deploys silently fail — do not skip.

### 5. Phase 4 Gate

Spawn `deploy-risk-reviewer` with a **comprehensive Phase 4 rubric**: RLS across all tables, env var completeness, SMTP actually sending from branded address, spend caps set, CI secrets correct env (dev, not prod), no drift between code and live config.

```
=== PHASE 4: CORE INFRA — SUMMARY ===

Integrations executed ({completed}/{total} from group A):
  ✓ supabase             — project {ref}, schema exposed, migrations/seed/prod-setup applied, auth configured
  ✓ vercel               — project {name}, domain live, SSL active
  ✓ vercel-env-apply     — {present}/{required} env vars (0 missing required)
  ✓ resend               — sending domain verified ({mail.domain})
  ✓ supabase-smtp-wire   — custom SMTP verified via test signup (sender: {address})
  ✓ sentry               — DSN + auth token; 10% trace, 0% replay
  ✓ posthog              — project token set (env var name: {current})
  ✓ ai-spend-caps        — OpenAI ${cap}/mo, Vercel ${cap} on-demand, Google AI quota
  ✓ github-ci            — 4 secrets set (dev Supabase + shared)

Cross-cutting checks:
  Env var completeness:  PASS
  First prod deploy:     READY
  Landing page:          200 OK, SSL active
  Custom SMTP verified:  PASS (sender confirmed)

Risk review: HIGH {n} | MEDIUM {n} | LOW {n}
  <top 3 findings if any HIGH>

Sharpest failure mode 3 months in:
  <opinionated one-liner>

[C] Continue to Phase 5 (feature integrations)
[R] Revise a specific integration
[X] Exit (state preserved)
```

**If `planMode=true`:** Display "Dry-run complete at Phase 4 boundary — re-invoke without `--plan` to execute." and stop.

**If C:** Load and execute `{nextStepFile}`. Pass forward: completed group-A integrations, Vercel project info, Supabase URLs, env var completeness confirmation.

**If R:** Jump back to the offending integration in the dispatcher loop. Sub-item state ensures only the failing parts re-run.

**If X:** Stop cleanly.
