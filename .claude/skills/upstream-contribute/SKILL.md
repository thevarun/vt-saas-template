---
name: upstream-contribute
description: >
  Harvest a downstream product's generic, reusable improvements back into the
  base template it was forked from — as verified, dependency-ordered PRs — and
  supervise the merge with independent byte-level verification. Six phases:
  Identify → Plan → Produce → Verify → Merge → Harvest. Re-runnable each time a
  product accrues new contribution candidates. The template is the source of
  truth; contributing up here propagates to the whole product fleet on the next
  upstream-sync.
when_to_use: >
  Contributing code "up" from a product (e.g. ContentFlow) into its template
  (vt-saas-template), or periodically upstreaming accumulated improvements.
  Auto-detects whether you're in the template or a product and nudges. NOT for
  syncing template changes DOWN into a product — that is upstream-sync, the
  opposite direction.
disable-model-invocation: true
user-invocable: true
argument-hint: "[phase | group]  e.g. 'identify'  or  'produce oauth-layer'"
---

# Upstream Contribute — harvest a product's improvements back into the template

**Goal:** Take the generic, reusable improvements a product has accumulated since it forked, and land them in the base template as verified, dependency-ordered PRs — so the *next* product builds faster and the *whole fleet* improves together.

---

## WHY THIS EXISTS (the north star)

The template is the **single source of truth** for shared/infra code. Every product is a fork. When one product contributes a generic improvement *up* to the template, every other product — and every future product — inherits it on the next `upstream-sync`. That is how a fleet of solo-built SaaS products compounds instead of diverging.

So the test for everything this skill does is one line:

> **Contribute it back if it makes the *next* product faster to build, or improves the *whole fleet*. Otherwise leave it in the product.**

This is bidirectional fleet health: **contribute-up** (this skill) → **harvest-back** (re-apply, by hand, any product-source bugs found while porting) → **sync-down** (every product inherits it). Fix one thing once; the fleet gets it.

---

## PARTNER STANCE

You are a release engineer who has shipped a base template across a fleet of products and has the scars to prove it. You've watched an agent confidently report a security fix it never actually applied, watched a "green" CI that silently skipped every check, and watched two parallel branches each invent the same table. You trust artifacts, not reports. Bring that taste:

- **Trust bytes, never reports.** A produce agent's "I fixed it", a review bot's finding, a "green" check — all are *hypotheses*. Verify against the pushed diff (`git show`), re-run the exploit/test, confirm CI jobs actually *ran*. This is the spine; everything else is convenience.
- **Recommend, don't ask.** Every gate ships a default + one-line rationale. Steelman the runner-up in a line when it's close.
- **Serialize only what must be.** Maximize safe parallelism; sequence only where dependencies or the linear migration chain genuinely force it (see `plan`). Don't make 9 independent leaves wait on each other.
- **Strip to the pattern, not the instance.** Contribute the seam + a placeholder/example, never the product's copy, prices, brand, or domain endpoints. Keep the template a *scaffold, not a library*.
- **Red-team at every gate.** One bullet on the sharpest way this batch bites in three months.

---

## WHERE TO RUN THIS (auto-detected — step 01 nudges you)

The engine addresses both repos by absolute path (`SOURCE`/`TARGET`/`PLAN`), so the loop *functions* from any cwd. But the loaded `CLAUDE.md`/rules shape judgment, and running from the canonical home avoids divergent copies. Step 01 runs `scripts/detect-context.sh`, confirms repo **identity** (remote/marker, not cwd name), and nudges:

| Phase | Best run from | Why |
|-------|---------------|-----|
| Identify, Plan | the **product** | needs product depth; the plan is a product-side artifact |
| Produce, Verify, Merge | the **template** (default) | template conventions matter; canonical skill home; where the risk lives |
| Harvest | files issues on the **product** | (works from either cwd) |

Default to the template; optionally start Identify/Plan in the product, then switch. It's an optimization, not a requirement — but the resolved `SOURCE`/`TARGET`/`PLAN` are **always echoed for confirmation before any produce or merge.**

---

## HARD RULES (non-negotiable — these are the institutionalized scars)

1. **Independent byte-verification is the only merge gate.** A fresh subagent (no access to the produce run's reports) verifies the *pushed* PR: `git show` the claimed change, re-run the exploit/test, cite `file:line`. The engine's own review/fix is for draft quality only and **carries zero weight at merge.** See `checklists/merge-gate.md` — it is unskippable.
2. **Never resume a half-finished produce run.** Size batches to complete in one engine run. If a run dies mid-group, **re-run that group fresh** — the idempotent precheck skips already-merged work. Resuming desyncs reports from bytes (it once nearly shipped an open-redirect).
3. **Fail-closed selector + log resolved inputs.** The engine errors (never silently defaults to "all") if its group selection doesn't resolve, and logs the resolved set before running.
4. **`main` is append-only.** Rebase-merge only. Never force-push or rewrite `main`. Feature branches may be force-pushed — but **force-push and hard-reset are hard guards: hand the exact `! git … --force-with-lease …` command to the user**; never `--admin`-bypass a merge — poll the checks to green.
5. **Produce-only, then supervise.** The engine opens PRs; it never merges. Verify → merge is human-gated, dependency-ordered.
6. **Strip to the pattern; template = scaffold, not library.** No product copy/brand/domain endpoints/schema-name. Opinionated or heavy subsystems ship **opt-in** (config-gated/flagged) so forks aren't forced into product-shaping choices.
7. **Definition of done includes the loop-back.** Each run files a per-wave **harvest issue** on the product for source bugs found while porting (re-apply by hand, never cherry-pick — the divergence is real), and a **tracking issue for every deferral.**

---

## WORKFLOW ARCHITECTURE

Two orchestration primitives, deliberately separate:

- **Step files (this skill) = the conductor.** The main session walks the 6-phase lifecycle and owns everything needing judgment or a human gate (Identify, Plan, Verify, Merge, Harvest).
- **The engine (`workflows/port-to-template.js`) = one instrument.** A deterministic, headless `Workflow`-tool script that the **Produce** step invokes to fan out produce-agents (prep → implement → ship) in isolated branches, with an idempotent precheck and per-group failure isolation. Its output is **always treated as unverified** — the `verify` step is the sole gate.

### Step Processing Rules
1. READ COMPLETELY — read the entire step file before acting.
2. LOAD NEXT — only when directed; read the next step file fully, then execute.
3. WAIT FOR INPUT — halt at gates until the user selects.

---

## INITIALIZATION SEQUENCE

1. Set workflow variables:
   - `skill_dir`: `${CLAUDE_SKILL_DIR}`
   - `engine`: `{skill_dir}/workflows/port-to-template.js`
   - step files: `{skill_dir}/steps/step-01-context-prereqs.md` … `step-07-harvest.md`
2. Display a one-line intro:
   ```
   Upstream Contribute — harvest this product's generic improvements into the template.
   Six phases: identify → plan → produce → verify → merge → harvest.
   ```
3. Load, read in full, and execute: `{skill_dir}/steps/step-01-context-prereqs.md`.
   (If the user passed a `[phase | group]` argument, step 01 still runs detection + resume, then jumps to the named phase.)

---

## WORKFLOW STEPS

| Phase | File | Purpose |
|-------|------|---------|
| 01 | step-01-context-prereqs.md | Detect cwd/repo identity + package manager + gh/git; resume-vs-new; nudge to the right repo/phase; echo resolved SOURCE/TARGET/PLAN |
| 02 | step-02-identify.md | Audit the product↔template delta; screen each candidate against the contribution rubric → tag drop-in / generalize / opt-in / skip |
| 03 | step-03-plan.md | Build the dependency DAG + collision graph; leverage-tier; emit the **wave schedule** (parallel within a wave, sequential across) into the plan sidecar |
| 04 | step-04-produce.md | Run the engine one wave at a time (produce-only, fail-closed selector, small batches). Output is unverified |
| 05 | step-05-verify.md | Independent fresh-context byte-gate per PR — the unskippable spine |
| 06 | step-06-merge.md | Supervised dependency-ordered rebase-merge; append-only; reconcile known collisions; force-push → user |
| 07 | step-07-harvest.md | Verify product-source bugs → harvest issue; tracking issue per deferral; sync-down decision |

(Verify and Merge interleave per-PR: verify PR N → merge PR N → verify N+1. Verify is a mandatory gate before each merge.)

---

## ADOPTED PATTERNS

- **Fresh-context verification subagent** + **evidence-based (file:line) output** — the byte-gate. *Proven:* `meta/skills/fresh-eyes/SKILL.md`, `product-factory/skills/technical-audit/shared-agent-instructions.md`.
- **Multi-phase gates + resume sidecar** — gate between phases; the plan sidecar + the engine's idempotent precheck make the loop resumable at batch/PR boundaries. *Proven:* `product-factory/skills/fix-audit-findings/steps/step-01-plan.md`.
- **Scripts for deterministic work** — byte-diff, rising-test-count, JSON.parse, CI-poll (treat "skipping" = success) are scripts; review/synthesis is the LLM. *Proven:* `meta/skills/nash/prune_transcript.py`.
- **Tool/MCP detection + graceful degradation** — the cwd/package-manager nudge. *Proven:* `product-factory/skills/designer-founder/tools/stitch.md`.
- **Risk-stratified autonomy** — light review for drop-ins; adversarial + sub-batching for L-effort / payment / auth / security. *Proven:* `product-factory/skills/fix-audit-findings/steps/step-02-execute.md`.
- **Role-bounded handoff** — each produce/audit agent owns one group/dimension; structured returns. *Proven:* `product-factory/skills/implement-epic/steps/step-02-orchestrate.md`.

---

## SAFETY RULES

- Show a diff/preview before any write, commit, or PR; produce-only — no auto-merge.
- `main` is append-only; never force-push/rewrite it.
- Destructive git (force-push, hard-reset) and `rm -rf` are routed to the user via `!` or replaced with `git stash -u` / `mv`-to-backup; never `--admin`-bypass branch protection.
- Migration files: never `db:push`; regenerate (don't hand-merge) snapshots; in worktrees lacking `node_modules`, a `--no-verify` tooling commit is acceptable (note it).
