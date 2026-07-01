---
name: "step-01-context-prereqs"
description: "Resolve repo identity, package manager, gh/git readiness; resume-vs-new; nudge to the right repo/phase; echo + confirm SOURCE/TARGET/PLAN before anything downstream."
workflow_path: "${CLAUDE_SKILL_DIR}"
thisStepFile: "{workflow_path}/steps/step-01-context-prereqs.md"
nextStepFile: "{workflow_path}/steps/step-02-identify.md"
workflowFile: "{workflow_path}/SKILL.md"
detectScript: "{workflow_path}/scripts/detect-context.sh"
---

# Step 01 — Context & Prereqs

## STEP GOAL

Pin down _where we are_ and _that we can work_, then point at the right next move. By the end you've resolved repo **identity** (template or which downstream product), the package manager, `gh` auth and a clean tree; decided **resume vs. fresh**; nudged toward the canonical home for the requested phase; and **echoed + had the user confirm** the absolute `SOURCE` / `TARGET` / `PLAN` paths. Nothing produces or merges until that confirmation lands.

## Constraints

- **Fail closed on identity.** If `detect-context.sh` can't resolve which repo is which, STOP and ask — never guess `SOURCE`/`TARGET`. Two repos addressed by absolute path is the whole safety model; a wrong guess ports product copy into the template or merges into a product.
- **Identity = remote/marker, not folder name.** Worktrees and clones get renamed; the cwd basename lies. Trust the git remote or the template marker the script checks, never the directory name.
- **The engine is unverified and the plan is the only resumable state.** There is no "produce checkpoint" to resume — resuming means re-pointing at an in-progress plan sidecar in the _product_, not continuing a dead engine run (see HARD RULE 2 in `{workflowFile}`).
- **Confirmation is a hard gate.** No identify/produce/merge reasoning before the user OKs the echoed paths.

## Sequence of Instructions

### 1. Detect context

Run `{detectScript}` and read its output as the source of truth for: repo identity (template vs. a named product, by remote/marker), package manager (pnpm vs. npm), `gh` auth status, and whether the tree is clean. Don't re-derive any of this from the cwd name or your own `git` pokes — the script exists so judgment isn't load-bearing here.

If identity is ambiguous or the script errors, surface exactly what it couldn't resolve and ask. Do not proceed on a guess.

### 2. Readiness, stated plainly

Report the resolved facts in one compact block (identity, package manager, `gh`, tree state). Flag blockers, don't paper over them:

- Dirty tree → offer to stash (`git stash -u`) or stop; never barrel ahead.
- `gh` unauthenticated → produce/merge can't open or poll PRs; call it now, not at wave time.
- **npm + missing `node_modules`** → note the worktree friction: pre-commit hooks fire on tooling commits and there's no installed husky, so a `--no-verify` tooling commit is the escape hatch (and must be noted when used). **pnpm sidesteps this** — its worktree story is cleaner; mention it as the standing recommendation, don't force a switch.

### 3. Resume vs. fresh

Look for an in-progress contribution-plan sidecar in the **template's scratch area** (where the skill runs — assume template-run; see `step-03`), falling back to the product only for a product-driven run. If one exists, summarize it (wave schedule, what's merged, what's pending) and offer:

- **Continue** — adopt that plan, jump past Identify/Plan to where it left off.
- **Fresh** — start a new pass from Identify; leave the old sidecar untouched.

No sidecar → fresh, silently.

### 4. Nudge to the right repo for the phase

Per the WHERE-TO-RUN table in `{workflowFile}`: **Identify/Plan want the product** (product depth; the plan lives there); **Produce/Verify/Merge default to the template** (its conventions matter, it's the canonical skill home, it's where the risk lives); the engine is cwd-agnostic. If the current cwd doesn't match the upcoming phase, say so and recommend the switch — it's an optimization, not a wall. Don't block on it.

### 5. Echo SOURCE / TARGET / PLAN — and confirm

Resolve and print the three absolute paths:

```
SOURCE (product) : <abs path>
TARGET (template): <abs path>
PLAN  (sidecar)  : <abs path>   [new | resuming]
```

Get an explicit OK before any downstream phase touches these. This is the byte-level safety contract — wrong paths here defeat every later gate.

### 6. Route

If the user passed a `[phase | group]` argument, jump to that phase **after** detection + resume + path-confirm (never skip those). Otherwise fall through to the gate.

### 7. Phase Gate

```
=== CONTEXT SUMMARY ===

Identity        : <template | product:NAME>   (by remote/marker)
Package manager : <pnpm | npm>   <node_modules note if relevant>
gh / git tree   : <auth ok? | clean?>
Mode            : <fresh | resuming plan @ wave N>
SOURCE / TARGET / PLAN : <confirmed?>
Next phase      : <Identify | jumped-to: PHASE>   best run from: <product | template>

[C] Continue
[R] Revise — fix a resolved value or re-point a path
```

**If C:** Load and execute `{nextStepFile}`. Pass forward: identity, SOURCE, TARGET, PLAN, package manager (+ `node_modules` note), resume-mode, and any `[phase | group]` jump target.

**If R:** Ask what to revise (path, identity override, stash, resume choice), apply it, re-display the summary.
