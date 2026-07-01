---
name: "step-05-verify"
description: "Independent fresh-context byte-gate per PR — the only merge gate"
workflow_path: "${CLAUDE_SKILL_DIR}"
thisStepFile: "{workflow_path}/steps/step-05-verify.md"
nextStepFile: "{workflow_path}/steps/step-06-merge.md"
workflowFile: "{workflow_path}/SKILL.md"
merge_gate: "{workflow_path}/checklists/merge-gate.md"
verify_helpers: "{workflow_path}/scripts/verify-pushed-pr.sh"
---

# Step 5: Verify — independent byte-gate per PR

## STEP GOAL

The spine. For every PR the produce wave opened, an independent fresh-context subagent verifies the **pushed bytes** match the claim — `git show` proves the change exists, security/HIGH findings get their exploit or test **re-run**, every PASS cites `file:line`. The engine's "I fixed it" is a hypothesis; this is where it becomes fact or gets sent back. You walk away with a PASS/FAIL verdict per PR and evidence behind each — only PASS PRs cross into merge.

## Constraints

- **This is the ONLY merge gate.** The produce run's own review/fix carries zero weight here (`merge-gate.md` is unskippable). Nothing merges that didn't independently PASS.
- **The verifier is fresh-context and produce-blind.** Its entire context is: PR number/branch, the original finding/claim, and `{merge_gate}`. Do **not** hand it (and instruct it never to read) the produce reports, engine logs, or implementation brief. By construction it sees only the pushed branch — that's the point. A verifier that read the report would just be grading the report.
- **Trust bytes, not reports.** "Green CI", "tests pass", an engine summary — all hypotheses until `git show` / a re-run confirms them. Treat a check that _skipped_ as not-run, not as pass.
- **FAIL means re-produce fresh, not patch-in-place.** Never resume or hand-tweak a failed branch from the main session — that desyncs reports from bytes. Loop the failed group back through produce clean (step 04); the idempotent precheck skips what already merged.
- Read-only here. This step opens no PRs and merges nothing.

## Sequence of Instructions

### 1. Enumerate what the wave actually pushed

Collect the PRs this wave opened — number, branch, the finding/claim each one answers, and its risk tier (carried from the plan). Confirm each is real and open (`gh pr view`); a PR the engine _reported_ but didn't push is itself a FAIL — flag it, no verifier needed.

### 2. Tier verification depth by risk

Match scrutiny to blast radius — over-verifying drop-ins wastes the budget that security needs.

- **Drop-in / low-risk** (config, copy-stripped scaffold, mechanical): light pass — confirm the bytes exist and nothing product-specific leaked.
- **Generalize / medium**: standard gate — bytes + the relevant test re-run + strip-to-pattern check.
- **Security / payment / auth / HIGH**: adversarial — spawn **multiple skeptics**, and **replay the exploit or failing test against the pushed branch** (the helpers in `{verify_helpers}` exist for exactly this). One PASS isn't enough until the original attack provably no longer works.

### 2b. Layer independent reviews on the byte-gate (the byte-gate alone is claim-blind)

The byte-gate verifies **claim-fidelity** — that the pushed code _matches what the produce agent said it would do_. Necessary, but **structurally blind to whether the claim itself is correct**: if the design has a hole the claim never covered, the byte-gate PASSes a real defect. Close that blind spot by layering fresh-context, **produce-blind** reviews on top, scaled by risk:

- **`/code-review` on every tier** (correctness + reuse/simplification). Catches design/logic defects the claim omits and re-implementations of things the template already has. _Proven:_ it caught a webhook concurrency regression the claim-check passed, and a PostHog `$set`-nesting no-op whose mocked test passed.
- **`/security-review` on the payment / auth / entitlement / security tiers** (authz, injection, secret handling, data exposure).
- **Adversarial skeptics** (per the HIGH tier above) — prompt them to _refute_ and re-run the exploit/test; they catch entitlement/logic holes a single verifier misses. _Proven:_ skeptics caught a never-expiring-promotion defect the primary verifier passed.

Run these on the same bytes (local branch or pushed PR — see `references/fast-execution.md`), produce-blind, and treat any confirmed finding as a FAIL routed back through produce/fix → re-verify. Cheap on drop-ins; worth every token on payment/auth.

### 3. Spawn one fresh verifier per PR

Give each subagent only its three inputs (PR/branch · claim · `{merge_gate}`) and the depth from step 2. It must:

- `git show` / diff the **pushed branch** and confirm the claimed change is actually there.
- For security/HIGH: re-run the exploit or failing test via `{verify_helpers}` and show it now fails-closed/passes.
- Return **PASS or FAIL with evidence** — `file:line` cites, command output, exploit result. A PASS without evidence is a FAIL.
- Stay strip-to-pattern aware: leaked product copy/brand/domain/schema-name is a FAIL even if the logic is correct.

Run independent verifiers in parallel; they share no state.

### 4. Aggregate verdicts

For each PR: PASS (with evidence) or FAIL (with the specific gap — missing bytes, exploit still fires, leaked instance, skipped check). PASS PRs are cleared to merge. Keep the evidence — step 06 reconciles in dependency order and may want it.

### 5. Route the failures

Any FAIL → the affected group goes **back through produce, fresh** (step 04), then back here. Do not hand-wave, do not patch the branch by hand, do not "just re-push." Re-verify the re-produced result from scratch. A group churning twice is a signal the finding itself is wrong — say so rather than forcing a green.

### 6. Phase Gate

```
=== VERIFY SUMMARY ===

Wave: {wave}
PRs verified: {n}   PASS: {p}   FAIL: {f}
  PASS → cleared for merge (dependency-ordered): {list}
  FAIL → re-produce fresh (step 04): {list + one-line gap each}
Adversarial (security/payment/auth): {which PRs, exploit-replay result}
Red-team: the sharpest way a PASS here still bites in 3 months — {one line}

[C] Continue to merge (only PASS PRs advance)
[R] Revise — re-tier a PR, re-run a verifier, or send a group back to produce
```

**If C:** Load and execute `{nextStepFile}`. Pass forward: the PASS PR list with evidence, the wave's dependency order, and any open FAIL groups still owed a re-produce.

**If R:** Ask what to revise (depth tier, a single verifier re-run, or routing a group back to step 04), apply it, re-run the affected verification, re-display the summary.
