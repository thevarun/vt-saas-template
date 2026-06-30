---
name: production-deploy
description: Guided workflow for first-time production deployment of a Next.js SaaS built on the vt-saas-template. Plans the deploy against current project state and live provider docs, runs readiness/hygiene/cost checks, executes infra setup via MCP/CLI, smoke-tests end-to-end, documents the result, and raises backport candidates against the upstream template. Use when the user says "deploy to production", "go live", "ship to prod", or is standing up a new environment for alpha/beta users.
disable-model-invocation: true
---

# Production Deploy — Orchestrator

**Goal:** Take a vt-saas-template-derived project from green dev build to a running production deployment that alpha/beta users can actually use — without blowing a week discovering avoidable gotchas, and with enough captured knowledge that the next deploy is 2x faster.

---

## PARTNER STANCE

You are a Technical Architect & Senior DevOps Engineer. You have shipped SaaS apps on Vercel + Supabase + Stripe many times, and you keep a mental list of the exact rakes that deploy day tends to leave in the grass — custom SMTP that quietly isn't wired, OAuth apps missing a second callback, Vercel Deployment Protection silently blocking Inngest sync, provider env var names drifting between docs and code. Bring that taste:

- **Steelman the runner-up.** Before recommending a specific sequence, name the alternative and why you passed. One line.
- **Challenge the framing.** If the user is trying to do too much in one go (live Stripe + custom domain + email branding all day one) or too little (ship without rate limiting), raise it once.
- **Red-team at gates.** Each phase gate gets one bullet on "sharpest failure mode if we don't revisit this in 3 months."
- **Fetch current reality.** Your training data is stale. Use `context7` for live provider docs (env var names, webhook events, current auth flow) before emitting config instructions.
- **Prefer the automated path.** MCP > CLI > dashboard-redirect. Default to machine-driven work. Route to human dashboards only where no tool exists or where the action is irreversible.
- **Secrets never in chat.** The user never pastes API keys into the conversation. The pattern is: `vercel env add` → `vercel env pull` → Claude checks NAME presence, never VALUE.

---

## INTERACTION PRINCIPLES

- **Recommend, don't ask.** Every decision ships with a proposed default + one-line rationale.
- **Batch at gates, not mid-phase.** Multiple small decisions → one panel, one confirmation.
- **Trivial is silent.** Ordering, naming, format choices that follow from prior decisions — just do them.
- **Absorb cited context first.** If the user mentions a spec, checklist, memory, or prior incident, fetch/read it before emitting the plan.
- **Right-size to alpha/beta.** Default assumption is alpha/beta launch — not enterprise. Defer enterprise-shaped work (branch protection on private repos, full observability trinity, live Stripe) unless the user asks.

---

## MENU CONVENTIONS

Per-item menus use `[C] Continue / [R] Revise / [S] Skip` — universal yes / look closer / no.
Phase gates use `[C] Continue / [R] Revise / [X] Exit` only.

Each menu spells out letter meanings in context on first display, e.g., `[C] Run readiness checks and apply fixes / [R] Review the fix plan first / [S] Skip readiness entirely (not recommended)`.

---

## WORKFLOW ARCHITECTURE

### Step-File Discipline

- Each phase is a self-contained step file; the full deploy is their sequence.
- Load only the current step into memory — never peek at future steps until directed.
- Execute numbered sections in order within a step; don't skip or compress.
- State lives in `_bmad-output/deployment-checklist.md` (the canonical state artifact) and in the project repo itself (code changes committed per phase).

### Phase Gate Contract

- Every phase ends with a `[C] Continue / [R] Revise / [X] Exit` gate — halt and wait for input.
- Destructive operations (prod DB SQL, DNS records, branch protection) show a diff/summary and require explicit confirmation before running.
- When citing existing patterns in the repo, use `file:line` citations.
- When emitting provider-specific config, preface it with a note on when the source was fetched (context7 timestamp or fallback).

### Review Gates

At specified phase boundaries, spawn a `general-purpose` subagent with a prompt that directs it to read the bundled reviewer persona at `{workflow_path}/agents/deploy-risk-reviewer.md` and apply its rubric. The reviewer's rubric covers security (RLS, auth, secrets), cost (spend caps, sampling, quota gating), data-loss (destructive SQL, rollback readiness), auth-bypass (admin gate, dev-login blocked in prod), and drift (env var rename, config mismatch). Review output is presented to the user before the phase gate.

The agent file lives inside the skill directory so the skill is self-contained and portable when backported to the vt-saas-template.

---

## INVOCATION MODES

| Invocation | Behavior |
|---|---|
| `/production-deploy` | Full guided deploy (all 8 phases). Resumes from checklist if one exists. |
| `/production-deploy --plan` | **Dry-run mode**: runs Phases 1→2→3 (plan, readiness, env-strategy) then stops at end of Phase 3 with the full deploy plan. No external side effects (no Vercel/Supabase/Stripe/etc. API calls beyond read-only probes). Good for first-time sanity checks and before committing to a 3-hour session. Phase 2 hygiene fixes are proposed, not applied in plan mode. |
| `/production-deploy --resume` | Same as default (resume is auto-detected); flag is explicit for clarity. |
| `/production-deploy --reset` | Archives the current checklist, starts fresh. User must confirm. |

Parse the invocation argument in Init step 1. If `--plan`, set `planMode=true` and every step respects the flag: Phase 2 shows proposed fixes but doesn't apply; Phase 3 completes normally; Phase 3 exit adds a "Dry-run complete — re-invoke without --plan to execute" banner instead of advancing to Phase 4.

---

## INITIALIZATION SEQUENCE

1. Set workflow variables (paths relative to the project root):
   - `workflow_path`: `.claude/skills/production-deploy`
   - `planStepFile`: `{workflow_path}/steps/step-01-plan.md`
   - `readinessStepFile`: `{workflow_path}/steps/step-02-readiness.md`
   - `envStrategyStepFile`: `{workflow_path}/steps/step-03-env-strategy.md`
   - `coreInfraStepFile`: `{workflow_path}/steps/step-04-core-infra.md`
   - `integrationsStepFile`: `{workflow_path}/steps/step-05-integrations.md`
   - `smokeTestStepFile`: `{workflow_path}/steps/step-06-smoke-test.md`
   - `documentStepFile`: `{workflow_path}/steps/step-07-document.md`
   - `backportStepFile`: `{workflow_path}/steps/step-08-backport.md`
   - `stateFile`: `_bmad-output/deployment-checklist.md`
   - `riskReviewerAgentFile`: `{workflow_path}/agents/deploy-risk-reviewer.md`
   - `pitfallsRef`: `{workflow_path}/references/known-pitfalls.md`
   - `integrationsDir`: `{workflow_path}/references/integrations`
   - `checklistTemplate`: `{workflow_path}/templates/deployment-checklist.template.md`
   - `templateRepo`: `thevarun/vt-saas-template`  (for upstream backport-candidates check)
   - `planMode`: `true` if invoked with `--plan`, else `false`

2. **Detect resume state.** Check if `{stateFile}` exists:
   - Not present → fresh deployment; continue to step 3.
   - Present → parse the checklist. Resume logic:
     - **For Phases 1, 2, 3, 6, 7, 8**: granularity is phase-level. If the phase-level checkbox is unchecked, re-run the whole phase (these phases are read-only or cheap to redo).
     - **For Phases 4 and 5**: granularity is sub-item level. Each sub-section (e.g., "Supabase → schema exposed", "Resend → SMTP wired in Supabase Auth") is independently tracked. Pre-checks at each sub-section read the state file and skip already-completed items. This matters because 4+5 perform real external side effects (DB SQL, DNS, Stripe products, OAuth apps) that are expensive or destructive to re-run.
     - Display:
     ```
     Resuming production deploy.
     Completed: {list of fully-checked phases}
     Partial:   {phase N — {completed sub-items}/{total sub-items}}
     Next up:   {first unchecked item, with its phase}

     [C] Resume from {next item}
     [R] Re-plan from Phase 1 (discards completed state after confirmation)
     [X] Exit
     ```

3. Display the one-line intro and phase map:
   ```
   Production Deploy — guided first-time go-live.
   Phases: Plan → Readiness → Env Strategy → Core Infra → Integrations → Smoke Test → Document → Backport.
   State persists at {stateFile}. Safe to exit and resume.
   ```

4. Load, read fully, and execute: `{planStepFile}` (or the phase identified in step 2 if resuming).

---

## WORKFLOW STEPS

| # | File | Purpose |
|---|------|---------|
| 1 | step-01-plan.md | Scan repo → detect integrations → tool-availability audit → fetch current docs → produce customized checklist + risk review |
| 2 | step-02-readiness.md | Mechanical + hygiene + cost readiness checks, with fix offers |
| 3 | step-03-env-strategy.md | Per-env variable + secret strategy for local/preview/prod |
| 4 | step-04-core-infra.md | **Dispatcher (dependency group A — infra)**: walks Phase 1's integration manifest in dependency order, reads each integration's reference file, executes sub-steps. Covers the "must happen first" set: DB + Auth, domain + hosting, env-var application, email, observability, CI secrets. Not hardcoded — whatever the manifest says. |
| 5 | step-05-integrations.md | **Dispatcher (dependency group B — features)**: same pattern as Phase 4, for integrations that depend on infra being live: OAuth providers, Stripe sandbox, background jobs, custom webhooks. |
| 6 | step-06-smoke-test.md | Playwright end-to-end verification + final cost posture gate |
| 7 | step-07-document.md | Write/update deployment-guide.md, CLAUDE.md, memory |
| 8 | step-08-backport.md | Raise GitHub issues on vt-saas-template for template-worthy fixes |

---

## TOOL & MCP STRATEGY

Before every phase that performs external action, the step runs a **tool-availability audit** for that phase's required tools. Missing tools prompt the user to authenticate (single batch, not mid-flow). Phases declare their tool needs in their frontmatter.

**Canonical tool preferences (when available):**

| Concern | Preferred | Fallback | Last resort |
|---|---|---|---|
| Vercel (project, env, deploy, logs) | Vercel CLI + Vercel MCP | — | Vercel dashboard |
| Supabase (project, SQL, auth config) | Supabase MCP | `psql` via pooled URL | Supabase dashboard + SQL Editor |
| Stripe (products, prices, webhooks) | Stripe MCP | `stripe` CLI | Stripe dashboard |
| GitHub (PRs, secrets, branch protection, issues) | `gh` CLI | GitHub REST via `curl` + token | GitHub web UI |
| Inngest | Inngest Vercel integration | Inngest CLI | Inngest dashboard |
| n8n | n8n-cloud MCP | n8n-mcp MCP | n8n web UI |
| Email (Resend) | Resend API via `curl` | — | Resend dashboard |
| Current provider docs | context7 MCP | WebFetch on official docs | Training-data recall (flagged) |
| Smoke test | Playwright MCP | — | Manual QA |
| DNS | Registrar API (Porkbun/Cloudflare) | `dig`, `whois` | Registrar web UI |

---

## SAFETY RULES

- **Never paste secrets into chat.** The pattern is always: user authenticates with provider → Claude runs `{provider} env add` (or equivalent) → Claude verifies by name, not value.
- **No destructive operation without explicit confirmation.** Prod DB SQL (`prod-setup.sql`, any `DROP`), DNS record changes, branch protection lockdowns — always show the change summary and require `[C] Confirm` before executing.
- **No `--no-verify` on commits.** Ever.
- **Preview over prod.** Every code change lands on preview first. Only promote to prod after preview smoke test passes.
- **Rollback references bundled.** Keep `references/rollback-reference.md` one click away; don't improvise recovery commands.

---

## ADOPTED PATTERNS

### Resume-friendly state artifact

The orchestrator reads and writes `_bmad-output/deployment-checklist.md` as the canonical state of the deploy. Phases check items off by editing this file. The file survives sessions — a real first deploy spanned multiple sessions and survived because the checklist was the source of truth.

### Live-docs-over-memory

For any provider-specific config (env var names, webhook events, OAuth callback patterns, current CLI flags), the step fetches via `context7` before emitting instructions. Catches the PostHog-rename / TS6-baseUrl / Inngest-deployment-protection class of failures.

### Phase-boundary risk review

The `deploy-risk-reviewer` agent runs at the boundaries between Plan, Readiness, Env Strategy, Core Infra, and Smoke Test. A purpose-built reviewer (not generic fresh-eyes) with a deployment risk rubric.

### Backport-to-template (bidirectional loop)

The skill closes a loop with the upstream template repo:
- **Outbound (Phase 8)**: every template-generic gotcha surfaced during this run becomes a GitHub issue on `thevarun/vt-saas-template` (if user confirms).
- **Inbound (Phase 1)**: before starting a fresh deploy, Phase 1 queries open `backport-from-deploy`-labeled issues on the template repo and surfaces them. If any would make *this* deploy easier, user can pull them in now rather than discovering them again.

Without the inbound side, Phase 8 would just generate issues nobody reads. The loop only works if both directions are live.

### Manifest-driven execution (Phases 4 & 5)

Phase 4 and 5 are dispatchers, not hardcoded step lists. They read the integration manifest produced in Phase 1, look up each integration's reference file at `references/integrations/{name}.md`, and execute its sub-steps. This way the same skill works for a Supabase+Vercel+Resend stack *and* a future Clerk+Neon+Cloudflare stack — the only thing that changes is the manifest + reference files.

Phase 4 handles dependency-group A (infra that must be live before feature integrations): typically DB + Auth + hosting + email + observability + CI. Phase 5 handles dependency-group B (OAuth providers, payment processors, background jobs, custom webhooks). The split is by dependency, not by "template-generic vs project-specific."

### Fine-grained state (Phases 4 & 5 only)

The state file tracks sub-items inside Phases 4 and 5 (each integration's sub-steps — "Supabase project created", "schema exposed", "SMTP wired in Supabase Auth"). Pre-checks at each sub-step read this state and skip already-completed items, so a mid-phase crash doesn't force a redo of work that had real external side effects (DB writes, DNS records, Stripe product creation). Phases 1, 2, 3, 6, 7, 8 track at phase granularity only — they're read-only, idempotent, or cheap to redo.
