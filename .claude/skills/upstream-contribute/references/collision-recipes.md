# Collision recipes — merge-time reconciliation playbook

Loaded by **step-06 (Merge)**. Plan (step-03) already classified these files SERIALIZING vs ADDITIVE and scheduled waves to avoid the worst of them; this is what to *do* when two PRs still land on the same file at rebase time. Drawn from real 4-wave experience.

Each recipe: **symptom → fix → trap**. The trap is the part that already bit us.

> Rebase posture for all of them: reconcile, then trust the rebase **only on evidence** — non-empty `git diff main...HEAD` (empty = the change evaporated into the collision) **and** a rising test count vs main. If either fails, the reconciliation ate the change. Recreate the branch fresh from `origin` and replay rather than fight a tangled rebase.

---

## 1. Migrations — SERIALIZING (the linear spine)

**Symptom.** PR adds migration `0042_*`; main already merged a different `0042_*` in the prior wave. The journal is an ordered chain — two files can't share an index.

**Fix.** Renumber this PR's migration to the *next* free idx (`0043`), then **regenerate the snapshot** (`db:generate` against the renumbered schema) and **append** the journal entry. The snapshot must be machine-produced from the schema, the journal must *list* the new file.

**Trap.**
- **Never hand-merge the snapshot JSON** under `migrations/meta/`. It's a derived artifact; a hand-edit drifts from the schema and ships a broken migration. Regenerate, always.
- A `.sql` file **not listed in `_journal.json` is silently skipped in prod** — renumbering the file without appending the journal looks merged but never runs.
- Plan caps **≤1 migration-bearer per wave** precisely so this is the *only* migration to renumber per merge. If you're renumbering two in one wave, the wave was mis-planned — surface it.

## 2. Schema barrel (`models/schema/index.ts`) — ADDITIVE

**Symptom.** Two PRs each added an `export * from './…'` line; rebase conflicts on the export block.

**Fix.** Take the **union** of export lines. Preserve existing ordering (let `lint:fix` sort if the repo auto-sorts) — don't reorder gratuitously.

**Trap.** Dropping one side because "it looks like the same block" — a missing barrel export is a dangling table that compiles locally (the model file exists) but breaks the next consumer. Union means *both* new lines survive.

## 3. `prod-setup.sql` — ADDITIVE

**Symptom.** Two PRs appended RLS policies / grants / triggers to the same setup file.

**Fix.** **Union the additive blocks.** Keep every policy/grant/trigger from both sides, in dependency order (grant before the policy that needs it).

**Trap.** This file is replayed on every prod setup — it **must stay idempotent**. Preserve the `DO $$ … IF NOT EXISTS … END $$;` / `CREATE … IF NOT EXISTS` / `DROP … IF EXISTS` guards on each block. A unioned-in bare `CREATE POLICY` without the existence guard fails the *second* run. If a block lost its guard in the merge, restore it.

## 4. Locale JSON — ADDITIVE (often auto-merges)

**Symptom.** Two PRs added keys to the same `*.json` catalog. Frequently **auto-merges** clean (new keys land in non-adjacent regions).

**Fix.** Union the keys. If git did flag it, take both sides' additions.

**Trap.** A union that produces invalid JSON (trailing comma, duplicate key, an orphaned brace from a sloppy three-way merge) ships a catalog the app can't parse at boot. **Validate `JSON.parse`** on every locale file you touched before trusting the rebase — auto-merged ones included.

## 5. `package.json` + lockfile — ADDITIVE deps, REGENERATED lock

**Symptom.** Two PRs each added dependencies; `package.json` and the lockfile both conflict.

**Fix.** In `package.json`, **keep ALL deps** — union the new ones from both sides into `dependencies`/`devDependencies` (mind which section each belongs in). Then **regenerate the lockfile** (`install` to resolve), don't hand-merge it.

**Trap.** Hand-resolving lockfile conflict markers produces a tree that resolves to versions nobody tested — a silent, wide blast radius. The lock is derived: union the manifest, regenerate the lock. (Watch dep-*placement* gotchas: a build/CLI tool that belongs in `devDependencies` unioned into `dependencies` can drag a vulnerable transitive into the runtime bundle.)

## 6. Duplicate infra — SERIALIZING (two PRs built the same thing)

**Symptom.** Two PRs independently created the same table / util / helper / subsystem seam. Not a file conflict — a *semantic* one: the fleet ends up with two of the same thing.

**Fix.** **Dependency order decides the owner.** The canonical owner merges **first** (it's the seam others build on). The consumer PR then **drops its duplicate** and **adapts to the canonical API** before its own rebase — re-point imports, delete the dup table/migration/util.

**Trap.** Merging both and "deduping later" — later never comes, and now two migrations created the same table (the second fails on a live DB). Plan should have caught the overlap and serialized them (step-03 fails *closed*: when unsure additive-vs-overlapping, treat as overlapping). If it surfaces only at merge, **stop and re-order** — don't merge the second until it's been adapted onto the first.

## 7. Re-trigger CI after a rebase

**Symptom.** Rebased the head onto current main; CI still shows the stale run from the pre-rebase tip.

**Fix.** Re-trigger by **force-pushing the rebased branch** (routed to the user as an exact `! git -C <repo> push --force-with-lease origin <branch>` — never run it yourself, never `--admin`).

**Trap.**
- **Close/reopen does NOT re-run CI** — it loses context and can skip path-filtered jobs. Force-push the rebase; that's the only reliable re-trigger.
- **Post-force-push pending race:** checks briefly read stale-green from the prior head. Poll for the *new* run to register before trusting status — and treat a job reporting **"skipping" as success** (path filters legitimately skip docs/CI on a code-only PR).
- **Land CI-correctness fixes FIRST.** If a wave includes a PR that fixes the CI itself (a broken workflow, a missing required check), merge it ahead of the batch so everything after it is gated by *real* CI — otherwise the rest of the wave goes green against a check that wasn't actually running.
