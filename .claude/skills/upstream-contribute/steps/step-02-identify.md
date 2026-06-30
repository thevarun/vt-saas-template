---
name: 'step-02-identify'
description: 'Audit the product↔template delta and tag each candidate against the contribution rubric'
workflow_path: '${CLAUDE_SKILL_DIR}'
thisStepFile: '{workflow_path}/steps/step-02-identify.md'
nextStepFile: '{workflow_path}/steps/step-03-plan.md'
workflowFile: '{workflow_path}/SKILL.md'
---

# Identify — what is worth contributing up?

## STEP GOAL

Compute the delta between the product and template main, screen each candidate against the contribution rubric, and walk away with a **tagged candidate list** (drop-in / generalize / opt-in / skip) — the input the next phase turns into a wave schedule. Nothing is written to either repo here; this is a read-only audit ending in a gate.

## Constraints

- **Best run from the product** (per WHERE-TO-RUN) — the delta needs product depth, and the plan it feeds is a product-side artifact. If step 01 landed you in the template, say so and offer to switch; don't fake product depth from the template side.
- **Verify generic-vs-specific against source, never names.** A file called `email-service.ts` may be 90% template seam + 10% product copy. Read it. The one-line test for every candidate: *does this create fleet leverage?* If not, it stays in the product.
- **Dedupe ruthlessly.** A candidate already on template `main` or sitting in an open template PR is not a candidate. Check both before tagging.
- This phase is unverified scouting, not the byte-gate. Cite evidence so phase 03 can trust the list, but the merge gate is still phase 05.

## Sequence of Instructions

### 1. Fan out a read-only delta audit

Spread the audit across the product's subsystems rather than reading it as one blob — auth, middleware/proxy, AI layer, jobs/publish, payments/subscriptions, email, DB workflow/migrations, UI primitives, config/env, scripts/CI. Dispatch parallel **read-only** subagents, one per subsystem cluster, each returning candidates as `file:line` + a one-line "what's generic here." Maximize the fan-out; these don't depend on each other.

Each subagent's job is the *delta*, not an inventory: what does the product now have that is generic **and** not already upstream. Hand every subagent the dedupe inputs — template `main` (the canonical home) and the list of open template PRs (`gh pr list`) — so it screens before it reports.

### 2. Screen each candidate against the rubric

For every returned candidate, answer the spine's five questions against the actual source:

1. **Generic?** — pattern, not product instance. (If it carries ContentFlow copy/brand/domain/schema-name, it's not generic *as-is* — see the strip-recipe below.)
2. **Leverage?** — does it speed the *next* product, or prevent a *class* of bug? This is the one-line test; a yes here is the whole reason to contribute.
3. **Battle-tested?** — proven in product prod, not dormant/experimental code (e.g. don't harvest a phase-2 feature that's never shipped).
4. **Most forks want it?** — broadly useful, not a one-off product shape.
5. **Not already upstream?** — confirmed absent from template main + open PRs.

### 3. Tag each candidate

Resolve every screened candidate to exactly one TAG:

- **drop-in** — generic as-is; copies up unchanged. Low-effort.
- **generalize** — useful but carries product specifics. Attach a **strip-recipe**: the exact product copy / brand / domain endpoints / schema-name / prices to strip, and the placeholder or example that replaces it. *Strip to the pattern, not the instance — template = scaffold, not library.*
- **opt-in** — opinionated or heavy subsystem. Note how it ships config-gated / flagged so forks aren't forced into a product-shaping choice.
- **skip** — fails the rubric (product-specific, dormant, already upstream, or no fleet leverage). One-line reason each; skips are evidence the audit was honest, so keep them visible.

### 4. Phase Gate

Present the tagged list grouped by tag, each row: candidate · `file:line` · tag · one-line rationale (+ strip-recipe for generalize, gating note for opt-in). Add one red-team line: the sharpest way *missing* a candidate — or harvesting one that's secretly product-shaped — bites the fleet in three months.

```
=== IDENTIFY SUMMARY ===

Audited from:   <PRODUCT repo + identity>
Candidates:     <N>  →  drop-in <a> · generalize <b> · opt-in <c> · skip <d>
Deduped against: template main + <k> open PRs
Red-team:       <one line>

[C] Continue to Plan — build the dependency DAG + wave schedule
[R] Revise — re-audit a subsystem, retag, or move a candidate across tags
```

**If C:** Load and execute `{nextStepFile}`. Pass forward the tagged candidate list (candidate, `file:line`, tag, rationale, strip-recipe / gating notes), the resolved SOURCE/TARGET, and the dedupe baseline (template main SHA + open-PR set).

**If R:** Ask what to revise — re-run a subsystem audit, retag a candidate, or split/merge a generalize strip-recipe — apply it, and re-display the summary.
