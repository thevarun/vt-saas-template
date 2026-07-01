# Fast execution — local-first, parallel, batch-PR

The stock loop (sequential waves · the engine opens a PR per group · merge one PR at a time) is **correct but slow**: it waits on remote CI per PR and serializes work the DAG doesn't force to be serial. For any non-trivial batch, prefer the **local-first, parallel, batch-PR** model below. It is the DEFAULT for medium/large contributions; keep the stock per-PR engine as the fallback for a handful of candidates where the orchestration overhead isn't worth it.

The one line: **maximize safe parallelism, do all verification locally, and touch remote CI once per batch — not once per candidate.**

## 1. Collapse waves → DAG-depth rounds

Waves in the plan are usually packed by the batch cap, not by real ordering. Re-derive the true constraint: **only genuine dependency edges + shared-file collisions force sequencing.** Group candidates by DAG *depth*:

- **Round 0** = every candidate with no unmerged dependency (the roots + all independent leaves). Usually the large majority.
- **Round 1** = candidates whose deps are all in Round 0.
- **Round N** = … produced only after Round N−1 is **merged to main** (so they build on real, on-main code).

A 9-wave plan often collapses to 2–3 rounds this way. Within a round, everything runs in parallel; across rounds is the only sequencing.

## 2. Produce in parallel, worktree-isolated, NO immediate PR

Fan out one produce agent per candidate in the round, each in its own git worktree (`isolation: 'worktree'`), each branching off current `origin/main`. Every agent applies its port + strip-recipe, runs the **local CI parity** (§5), and **commits locally** — it does **not** push and does **not** open a PR. Distinct-file candidates never collide; the engine's concurrency cap (~10) handles the fan-out.

Output is UNVERIFIED — same as the stock engine. The gate is still the byte-gate (`step-05`), now run locally.

## 3. Verify locally (byte-gate + reviews) before any remote round-trip

Run the whole gate against the **local branches** (`git diff origin/main...contrib/<id>`, re-run tests in throwaway worktrees) — see `step-05` for the risk-stratified layered gate. Fresh-context, produce-blind verifiers work identically on a local commit as on a pushed PR; the invariant is "verify real bytes, not the producer's report," which a local commit satisfies. This is where the speed comes from: **no per-PR remote-CI wait, no per-PR round-trip.**

## 4. Assemble & land as batch tier-PRs

Group the round's verified candidates into a few **tier-PRs** (e.g. guardrails / infra / drop-in / opt-in), not one PR per candidate. Per tier:

1. Octopus-merge the candidate branches onto a fresh tier branch off `origin/main` (distinct files → conflict-free), OR cherry-pick their commits for a **linear, rebase-mergeable** history.
2. Run the full local CI parity once on the assembled branch (catches cross-candidate interactions the per-candidate runs missed).
3. Push → open ONE PR → remote CI runs **once** → rebase-merge.

Remote CI now runs ~once per tier, not ~once per candidate. Cross-tier deps still sequence across rounds (a Round-1 tier is produced off the updated `main` after Round-0 tiers merge).

## 5. Local CI parity — run EXACTLY what remote CI runs

Local-first only saves time if local checks match CI; otherwise you churn on red remote CI. Before opening any PR, on the assembled tier branch run the full parity — and mind the template's gotchas that silently pass a naive local check:

- **Lint by EXIT CODE, not by grepping output.** eslint colorizes with ANSI codes, so `grep '  error  '` misses real errors → false "0 errors." Use `npm run lint` and check `$?`.
- **eslint lints workflow YAML too** — a `.yml` quote-style error fails `Lint & Types`.
- **Run the FULL test suite**, not a subset. A change to a shared component breaks its *consumers'* tests (e.g. a `ThemeToggle` change broke `AdminHeader.test.tsx`), which a scoped `vitest run src/components/theme` never sees.
- **commitlint**: subject ≤100 chars **and** lowercase-first-word after the type (`subject-case`). Cap produce commit subjects ≤70 to be safe.
- **`package-lock.json` sync**: if a candidate adds a dep to `package.json`, regenerate the lock (`npm install --package-lock-only`) and commit it, or CI's `npm ci` fails.
- **Required env vars**: set `DB_SCHEMA=vt_saas NEXT_PUBLIC_DB_SCHEMA=vt_saas` for any command that loads `Env` (both are required post-guardrails; a missing one throws at import → build/test fail).
- **A new required env var** must be added to the CI job env blocks AND flagged as a Vercel-env action for the maintainer (Vercel env is separate from GitHub CI).
- **Pre-existing local failures ≠ your regression**: the PGlite integration tests (`tests/integration/api/*`) fail locally with `type "…" already exists` (leftover local DB state) but pass in CI's fresh DB — confirm the same set fails on `origin/main` before worrying.
- **Contributing a fail-on-X gate** (e.g. `npm audit --audit-level=high`) to a repo with pre-existing debt: ship it **advisory** (`continue-on-error: true`) first + a tracked remediation, so it doesn't block on debt it didn't introduce.

## 6. Batch the human gates

Match human intervention to the risk, not to the mechanics. Get the user to **approve a round's scope once**, then run produce → local-verify → assemble autonomously; the hard, unskippable human gate is **merge** (append-only, rebase-only, force-push routed to the user). Don't gate every candidate or every wave — that's what made the stock loop feel heavy.
