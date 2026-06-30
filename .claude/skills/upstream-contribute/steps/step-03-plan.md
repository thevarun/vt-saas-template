---
name: 'step-03-plan'
description: 'Turn tagged candidates into a dependency-ordered wave schedule; write the plan sidecar in the product'
workflow_path: '${CLAUDE_SKILL_DIR}'
thisStepFile: '{workflow_path}/steps/step-03-plan.md'
nextStepFile: '{workflow_path}/steps/step-04-produce.md'
workflowFile: '{workflow_path}/SKILL.md'
planTemplate: '{workflow_path}/templates/contribution-plan.template.md'
---

# Phase 03 — Plan: candidates → wave schedule

## STEP GOAL

Take the rubric-tagged candidates from Identify and schedule them into **waves** — batches the engine can produce in parallel without stepping on each other. You walk away with a wave schedule written to the **product-side plan sidecar** (the produce phase's input), and the user has signed off on order, batching, and the serial migration spine.

A wave is the unit the engine runs (step 04). Get the waves right here and produce is mechanical; get them wrong and you'll reconcile collisions PR-by-PR at merge.

## Constraints

- **The plan sidecar lives in the PRODUCT** (e.g. `_bmad-output/`), built from `{planTemplate}`. Never write it into the template engine — the template stays a scaffold, and this artifact is product state.
- **The migration journal is a serial spine, not a parallel field.** `migrations/meta/_journal.json` is an ordered, linear chain — two PRs that each append a migration cannot coexist in one wave. Cap **≤1 migration-bearer per wave**; chain the rest across waves. Most non-migration PRs hang off this spine as parallel leaves.
- **Across waves is sequential by construction:** the next wave is produced *off the updated `main`* (deps + prior migrations already merged), so produce sees zero reconciliation. Within a wave is parallel. Don't serialize leaves that don't collide.
- **Engine batch cap ~3–4 per wave.** Bigger batches dilute the byte-gate and risk a half-run you can't resume (HARD RULE 2). Prefer more, smaller waves.
- Planning only — no branches, no PRs, no engine. Skip anything tagged `skip`; it never enters a wave (but record the deferral so step 07 files a tracking issue).

## Sequence of Instructions

### 1. Build the dependency DAG (what needs what ON MAIN first)

For each candidate, ask: does this build on a seam another candidate introduces? An opt-in feature that imports a config helper, a route that needs a middleware wrapper, a second migration that assumes the first table — these are edges. The dependent can't be produced until its dependency is *merged to main*. Resolve cycles by splitting or merging candidates; a real cycle is a planning bug.

### 2. Build the collision graph over shared hot files

Two PRs collide when they both touch a file `main` will see at merge time. Classify each shared file — the treatment differs:

- **SERIALIZING — migration journal** (`migrations/meta/_journal.json` + snapshots): the linear chain. ≤1 migration-bearer per wave; the rest become a dependency chain across waves.
- **SERIALIZING — overlapping infra:** two candidates building the *same* table / the *same* subsystem seam. Dependency-order them; never parallel, even if files look additive — the second must be produced against the first.
- **ADDITIVE — cheap union** (schema barrel/`index.ts`, prod-setup, locale JSON, `package.json`): append-only edits that union trivially. Parallel within a wave is fine; reconcile the union at merge.

When unsure whether two PRs are additive or overlapping, treat as overlapping (serialize) — fail-closed, matching the engine's selector posture.

### 3. Assign leverage tier

Order by fleet payoff, per the spine: **guardrails & discipline > infra spine > drop-in features > opt-in heavy**. Bug-fixes jump the queue regardless (one fix, whole fleet, on next sync-down). Tier breaks ties on wave ordering and sets how hard the byte-gate leans in step 05 — higher-risk tiers (auth/payment/security/infra) get adversarial verification.

### 4. Emit the WAVE SCHEDULE

Pack waves greedily against four gates. A candidate is eligible for wave N when:

1. all its DAG deps are in waves `< N` (buildable depth — they'll be on main),
2. it's collision-free with every other candidate in wave N (no shared SERIALIZING file),
3. wave N holds **≤1 migration-bearer**, and
4. wave N is **within the batch cap (~3–4)**.

Within a wave: parallel. Across waves: sequential, each produced off the updated main. The result is a serial migration chain with parallel leaves fanning off each wave. State for each candidate: tier, deps, the hot files it touches, and which collision class triggered its placement — so the user can see *why* it landed where it did.

### 5. Write the sidecar, present, gate

Read `{planTemplate}`, populate it in the product (resolved `PLAN` path from step 01), and write the wave schedule + the deferral list (everything tagged `skip` or punted). Then present the schedule and gate.

### 6. Phase Gate

```
=== PLAN SUMMARY ===

Candidates scheduled: {N}  ·  deferred: {M}
Waves: {W}   (serial migration chain: {migration-bearers} across {chain-length} waves)
Leverage mix: {guardrails}/{infra}/{drop-in}/{opt-in}  ·  bug-fixes: {B}

  Wave 1: {ids}        ← {migration-bearer? }, leaves: {…}
  Wave 2: {ids}        ← off updated main; deps {…} merged
  …

Sidecar: {PLAN}
Sharpest risk (3-month): {one line — the collision or dep most likely to bite}

[C] Continue to Produce
[R] Revise — reorder, re-tier, re-batch, or split a candidate
```

**If C:** Load and execute `{nextStepFile}`. Pass forward: the wave schedule, the `PLAN` sidecar path, resolved `SOURCE`/`TARGET`, and the deferral list.

**If R:** Ask what to revise (wave membership, ordering, tier, batch size, a split/merge), apply it, re-validate the four gates, rewrite the sidecar, re-display.
