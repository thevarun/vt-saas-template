---
name: step-06-merge
description: Supervised, dependency-ordered, append-only merge of VERIFIED PRs into the template — rebase each onto current main, reconcile known collisions, re-trigger CI via force-push (routed to the user), poll to green, then rebase-merge. One PR at a time; main never rewinds.
workflow_path: '${CLAUDE_SKILL_DIR}'
thisStepFile: '{workflow_path}/steps/step-06-merge.md'
nextStepFile: '{workflow_path}/steps/step-07-harvest.md'
workflowFile: '{workflow_path}/SKILL.md'
collisionRecipes: '{workflow_path}/references/collision-recipes.md'
mergeGate: '{workflow_path}/checklists/merge-gate.md'
---

# Phase 6 — Merge (supervised, dependency-ordered, append-only)

## STEP GOAL

Land the PRs that **passed step-05's byte-gate** into the template, one at a time, in dependency order — so the next product inherits them on the next sync. Each PR is rebased onto the *current* main, has its known collisions reconciled, gets CI re-triggered and polled to green, and is then rebase-merged. Main advances; the next PR rebases onto the new tip. You walk away with verified work merged and main never rewound.

## Constraints

- **Verification (step-05) is the precondition.** Never merge a PR the fresh-context byte-gate hasn't passed — the engine's own review/fix carries *zero* weight here (`{mergeGate}`). Verify N → merge N → verify N+1; never batch-merge ahead of the gate.
- **`main` is append-only.** Rebase-merge only. Never force-push, hard-reset, or otherwise rewrite `main` — not even to "fix" a bad merge (revert forward instead).
- **Destructive git is the user's to run.** Any feature-branch `push --force-with-lease` / hard-reset is *handed to the user* as an exact `!`-prefixed command. Never run it yourself; never `--admin`-bypass branch protection.
- **Dependency order is load-bearing.** Merge along the plan's wave schedule. A leaf that depends on an unmerged parent has nothing correct to rebase onto — wait.

## Sequence of Instructions

### 1. Confirm the merge queue

Take the verified PRs in plan dependency order (parents before children; within a wave, any order). Echo the resolved `TARGET` repo and the ordered queue for confirmation before touching anything. Skip any PR not marked verified — surface it, don't merge it.

### 2. Per PR: rebase onto current main

Main has moved since produce. Rebase the head onto the live tip. If branch integrity is in any doubt (mid-run death, dirty local state, a force-push you didn't author), don't fight a tangled rebase — **recreate the branch fresh from `origin`** and replay the change.

Reconcile the **known collisions** per `{collisionRecipes}` — these recur every wave:
- **Migrations:** renumber to the end of the chain and **regenerate the snapshot** (never hand-merge `meta/`); the journal must list the new file or prod silently skips it.
- **Additive registries** (schema barrel, locale catalogs, `prod-setup.sql`): take the **union**, not one side.
- **Duplicate infra** (two branches added the same helper/table): collapse to the **canonical** one; drop the dupe.

Then **trust the rebase only on evidence**: a *non-empty* diff vs main (`git show` / `git diff main...HEAD` — empty means the change evaporated into a collision) **and** a *rising* test count vs main (the change's tests survived the rebase, didn't get clobbered). Both must hold before you proceed.

### 3. Re-trigger CI and poll to green

CI must run against the rebased head. Re-trigger by **force-pushing the rebased branch** — *not* close/reopen (that loses context and can skip path-filtered jobs). This is a destructive op: hand the user the exact command and wait for them to run it.

```
! git -C <repo> push --force-with-lease origin <branch>
```

Then poll the **required** checks to green:
- Treat a job reporting **"skipping" as success** (path filters legitimately skip docs/CI on a code-only PR, and vice-versa).
- Handle the **post-force-push pending race** — checks briefly read stale/green from the prior head; wait for the new run to register before trusting status. Poll, don't trust the first read.
- **Never `--admin`.** If a required check is red, stop and surface it — a red gate is signal, not friction.

### 4. Rebase-merge — main advances

With green CI and an evidence-backed rebase, **rebase-merge** (append-only — fast-forwards main, no merge commit rewrite, no force-push to main). Confirm main's new tip. Then move to the next PR/wave — it rebases onto *this* new tip, repeating from step 2.

If a merge ever wedges main, **revert forward** with a new commit. Do not rewind.

### 5. Phase 6 Gate

```
=== PHASE 6: MERGE — SUMMARY ===

Merged (dependency order): {N}
  {list: PR # · branch · new main tip}
Collisions reconciled: {migrations renumbered / unions / dup-infra collapsed}
Force-pushes routed to user: {count}
Deferred / blocked (red CI, unmet dep): {list with reason}
main: append-only — never rewound ✓

Red-team (one line): {sharpest way this wave bites the fleet in three months}

[C] Continue to harvest
[R] Revise — re-order the queue, re-rebase a PR, or hold one back
```

**If C:** Load and execute `{nextStepFile}`. Pass forward: merged PRs (with new main tips), any product-source bugs noticed while rebasing/reconciling, and the deferred/blocked list.

**If R:** Ask what to revise (queue order, a specific PR's rebase, a hold), apply it, re-display the summary.
