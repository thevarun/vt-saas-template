---
name: "step-04-produce"
description: "Run the engine for ONE wave, produce-only — open PRs, verify nothing"
workflow_path: "${CLAUDE_SKILL_DIR}"
thisStepFile: "{workflow_path}/steps/step-04-produce.md"
nextStepFile: "{workflow_path}/steps/step-05-verify.md"
workflowFile: "{workflow_path}/SKILL.md"
engine: "{workflow_path}/workflows/port-to-template.js"
---

# Phase 04 — Produce (one wave, produce-only)

## STEP GOAL

Fan out the engine across exactly **one wave** of the plan's schedule — produce-agents prep, implement, and push each group's branch and open its PR — and hand the resulting PR list to verify. You walk away with N draft PRs and **zero confidence in them**. The engine's output (including any self-review it ran) is a hypothesis; it carries **zero weight**. The gate is step-05, not here.

> **DEFAULT to the faster local-first model for non-trivial batches — see [`references/fast-execution.md`](../references/fast-execution.md).** Instead of the stock "sequential waves · engine opens a PR per group · merge one-at-a-time", collapse waves → **DAG-depth rounds**, produce all independent candidates **in parallel** (worktree-isolated, NO immediate PR), **verify locally**, then assemble & land as **batch tier-PRs** so remote CI runs once per tier, not once per candidate. The step below (stock per-PR engine) remains the fallback for a handful of candidates where orchestration overhead isn't worth it. Either way, produce output is UNVERIFIED and step-05 is the gate.

## Constraints

- **Best run from the template** (canonical skill home, where the risk lives). The engine addresses both repos by absolute path, so it functions from any cwd — but confirm repo _identity_ before invoking, not cwd name.
- **One wave only.** Never widen the group set to drain the backlog faster. Small batches are what let a single engine run finish without resuming, and what keep the verify gate tractable. Later waves come back through this step.
- **Fail-closed, never default to "all".** If the wave's group set doesn't resolve cleanly from the plan sidecar, STOP and surface it. A silent fallback to every group is the failure this guard exists to prevent — the engine itself errors on an unresolved selector, and so do you.
- **Never resume a half-finished produce run.** If the engine dies mid-group, re-run that group **fresh** — the idempotent precheck skips already-merged work, so a clean re-run is safe and a resume is not (resuming desyncs reports from bytes). Do not hand the engine a "continue from group K" instruction.
- **Produce-only.** The engine opens PRs; it never merges. Nothing here touches `main`.

## Sequence of Instructions

### 1. Resolve this wave's group set

Read the plan sidecar (the wave schedule emitted by step-03). Identify the **next wave that isn't fully merged** and pull its group set — the groups that are parallel-safe _within_ this wave. If resolution is ambiguous or empty, treat it as the fail-closed case below — do not guess.

### 2. Echo resolved inputs + confirm (fail-closed)

Before invoking anything, echo the resolved `SOURCE` / `TARGET` / `PLAN` (absolute paths) and the **exact group set** for this wave. This is the same log-the-resolved-set discipline the engine enforces, surfaced to the user. If any of these failed to resolve — STOP here, report what's missing, and wait. Do not default to "all".

```
=== WAVE n / N ===
SOURCE: {abs path}      TARGET: {abs path}      PLAN: {abs path}
Groups (parallel this wave): {group, group, …}
Proceed? [C] produce  ·  [R] revise the wave
```

### 3. Invoke the engine (Workflow tool)

On confirm, run the engine via the **Workflow** tool — not Bash, not Task:

- `scriptPath`: `{engine}` (i.e. `${CLAUDE_SKILL_DIR}/workflows/port-to-template.js`)
- `args`: `{ source, target, plan, groups }` — `groups` = exactly the resolved set from step 1, never broader.

Let it run to completion for this wave. It fans out produce-agents in isolated branches with per-group failure isolation; a single group failing does not poison its siblings.

### 4. On completion — list the opened PRs, claim nothing

Collect the PRs the engine opened this wave (number, branch, group). Report them as a plain inventory. Do **not** echo, paraphrase, or lend weight to any self-review, "I fixed X", or "looks good" the engine emitted — that output is unverified by construction and the next step re-derives the truth from the pushed bytes.

If a group failed or its PR is missing: note it, and **re-run that one group fresh** through steps 2–3 (fresh, never resumed). Do not advance to verify with a phantom PR in the list.

### 5. Phase Gate

```
=== PRODUCE SUMMARY (wave n / N) ===
Groups run:   {set}
PRs opened:   #… ({group}), #… ({group}), …
Failed/re-run: {group | none}
Status:       UNVERIFIED — engine output carries zero weight

[C] Continue to verify (the only merge gate)
[R] Revise — re-run a group fresh, or re-resolve the wave
```

**If C:** Load and execute `{nextStepFile}`. Pass forward: `SOURCE`, `TARGET`, `PLAN`, this wave's group set, and the opened-PR inventory.

**If R:** Ask which group/wave to redo, re-run it **fresh** via steps 2–3 (never a resume), then re-display this summary.
