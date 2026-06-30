---
name: 'step-07-harvest'
description: 'Close the loop — verify and file product-source bugs as harvest issues, file a tracking issue per deferral, decide on sync-down, and conclude the run as re-runnable.'
workflow_path: '${CLAUDE_SKILL_DIR}'
thisStepFile: '{workflow_path}/steps/step-07-harvest.md'
workflowFile: '{workflow_path}/SKILL.md'
harvestIssueTemplate: '{workflow_path}/templates/harvest-issue.template.md'
---

# Phase 07 — Harvest (terminal)

## STEP GOAL

The PRs are merged; the template improved. Now pay the debt the merge created. While porting, you almost certainly tripped over bugs that live in the **product's own source** — and you accumulated deferrals (candidates skipped, generalizations punted, opt-in flags left for later). Both must leave this run as **tracked artifacts on the product**, not as facts that survive only in this transcript. Harvest is part of "done," not a nicety. You walk away with: one harvest issue per real product-source bug, a tracking issue per deferral, an explicit sync-down call, and a completion summary that names this loop as re-runnable.

## Constraints

- **Verify each suspected bug against the product source BEFORE filing.** Many "bugs" you saw while porting are *port artifacts* — the seam shifted, an import got generalized, a placeholder replaced product copy — and do not exist in the product. Open the cited product file, confirm the defect is real there, capture `file:line`. No verification, no issue. This is the same trust-bytes spine as the merge gate, pointed the other way.
- **Re-apply by hand, never cherry-pick.** The template PR is the *spec*, not a patch source — the divergence between template and product is real. The harvest issue points at the template PR and the product `file:line`; the human applies the fix in the product's idiom on its own schedule.
- **One harvest issue per wave**, batching that wave's verified bugs — not one per bug, not one for the whole run.
- **Nothing lives only in memory.** Every deferral gets an issue, even the small ones. A deferral you can't be bothered to file is a deferral you've silently dropped.

## Sequence of Instructions

### 1. Triage suspected product-source bugs

Collect every "this looks wrong in the source too" you flagged during produce/verify/merge. For each, open the **product** file at the cited location and decide: real product defect, or port artifact? Discard the artifacts (note them in the summary so the reader knows they were checked, not missed). Keep the confirmed ones with severity + product `file:line` + the template PR that fixes the same shape upstream.

### 2. File one harvest issue per wave

Using `{harvestIssueTemplate}`, file ONE issue on the **product** repo per wave that produced confirmed bugs. Each lists: severity, product `file:line`, fix-intent, and the template PR as the spec — with an explicit "re-apply by hand, do not cherry-pick" note. Show the drafted body and get a `[C]` before `gh issue create`. Record the issue URLs.

### 3. File a tracking issue per deferral

Walk the plan sidecar's deferral set — skipped candidates, "generalize later," opt-in flags not yet wired, anything the rubric tagged but a wave didn't carry. File a tracking issue (on the product, or the template if the deferral is template-side) for **each**, so the next run of this loop rediscovers them as candidates instead of re-deriving them from scratch. One line of rationale each: why deferred, what unblocks it.

### 4. Decide sync-down

Note that the whole fleet inherits these template changes on its next `upstream-sync` — that's automatic and out of scope here. The only open question is the **source product**: should it run a formal sync-down to pull its own contributions back as canonical template code? Usually **no** — the source is the origin of most of this batch, so a sync-down is redundant churn and risks re-introducing the strip-to-pattern divergence you just resolved. Recommend skip unless the generalization meaningfully reshaped the seam (then the product benefits from adopting the cleaned-up template form). State the call with a one-line rationale; don't run it.

### 5. Phase Gate (final)

```
=== PHASE 07: HARVEST — SUMMARY ===

Suspected source bugs triaged: {N}  ({k} confirmed, {N-k} port artifacts discarded)
Harvest issues filed:          {per wave, with URLs}
Deferrals tracked:             {count, with URLs}
Sync-down (source product):    {skip | run} — {one-line rationale}

=== UPSTREAM-CONTRIBUTE COMPLETE ===

Waves merged:        {list}  (all byte-verified at the gate)
Template PRs landed: {count}
Fleet impact:        propagates to every product on its next upstream-sync
Loop-back closed:    source bugs + deferrals are now tracked artifacts, not memory

This loop is re-runnable. As the product accrues new contribution candidates,
start again at step-01 — the plan sidecar and idempotent precheck mean prior
work is recognized and skipped, not redone.

[C] Continue / [R] Revise
```

**If C:** The run is complete — there is no next step. Confirm closure and stop; the loop re-enters at `step-01-context-prereqs.md` only when the user re-invokes the skill on fresh candidates.

**If R:** Ask which artifact to revise (a harvest issue body, a missed/over-eager bug call, a deferral, the sync-down decision), apply the change, re-display the summary.
