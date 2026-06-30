# Upstream Contribution Plan — {PRODUCT} → {TEMPLATE}

<!--
  PRODUCT-SIDE SIDECAR. Lives in the PRODUCT (e.g. _bmad-output/), never in the template —
  this is product state, and the template stays a scaffold, not a library.
  Authored in step-03 (plan); read/advanced through steps 04–07.
  It is the resume spine: the plan + the engine's idempotent precheck make the loop
  re-enterable at wave / PR boundaries. Keep the Progress tracker current as the only
  truth that outlives this transcript.
-->

- **SOURCE (product):** {SOURCE repo + identity}
- **TARGET (template):** {TARGET repo + identity}
- **Dedupe baseline:** template main `{SHA}` + `{k}` open PRs (checked in identify)
- **Run started:** {date}  ·  **Plan path (PLAN):** {abs path to this file}

---

## 1. Candidates

<!--
  One row per screened candidate from identify (skips included — visible skips are
  evidence the audit was honest). Tag is exactly one of drop-in / generalize / opt-in / skip.
  strip-recipe is REQUIRED for generalize (the exact copy/brand/domain/schema-name/prices to
  strip + the placeholder that replaces it) and for opt-in (the config/flag gating note).
  Leverage tier orders fleet payoff: guardrail > infra > drop-in > opt-in; bug-fix jumps the queue.
-->

| ID | Title | Tag | Tier | Strip-recipe / gating | Source files (`file:line`) |
|----|-------|-----|------|-----------------------|----------------------------|
| C1 | {…} | drop-in | {guardrail\|infra\|drop-in\|opt-in} | — | {file:line} |
| C2 | {…} | generalize | {tier} | strip `{product copy/brand/domain/schema-name}` → `{placeholder}` | {file:line} |
| C3 | {…} | opt-in | {tier} | ships `{config-gated / flagged}` so forks aren't forced in | {file:line} |
| C4 | {…} | skip | — | reason: `{product-specific / dormant / already upstream / no leverage}` | {file:line} |

---

## 2. Dependency DAG

<!--
  An edge A → B means B builds on a seam A introduces, so A must be MERGED TO MAIN before
  B can be produced. A real cycle is a planning bug — split or merge candidates to break it.
-->

```
{C1} → {C3}          # C3 imports the config helper C1 adds
{C1} → {C2}
{C5}                 # no deps — free leaf
```

- Roots (no deps): {…}
- Leaves (depended on by nothing): {…}
- Cycles broken: {none | how}

---

## 3. Collision graph (shared hot files)

<!--
  Two candidates collide when they both touch a file main sees at merge.
  Classify each shared file — treatment differs. When unsure additive vs overlapping,
  treat as overlapping (serialize): fail-closed, matching the engine's selector.
-->

| Shared file | Touched by | Class | Treatment |
|-------------|-----------|-------|-----------|
| `migrations/meta/_journal.json` (+ snapshots) | {C2, C6} | SERIALIZING — migration journal | ≤1 bearer/wave; chain the rest across waves |
| {same table / subsystem seam} | {C1, C3} | SERIALIZING — overlapping infra | dependency-order; never parallel |
| {schema barrel / `index.ts` / `prod-setup.sql` / locale JSON / `package.json`} | {C4, C5} | ADDITIVE — cheap union | parallel OK; reconcile the union at merge |

---

## 4. Wave schedule

<!--
  A wave is the unit the engine produces (step 04). Within a wave: parallel. Across waves:
  sequential — each wave is produced off the UPDATED main (deps + prior migrations merged),
  so produce sees zero reconciliation. Pack greedily against four gates per candidate:
    (1) all DAG deps in waves < N, (2) collision-free with the rest of wave N,
    (3) ≤1 migration-bearer in wave N, (4) within the batch cap (~3–4).
  Prefer more, smaller waves — big batches dilute the byte-gate and risk an unresumable half-run.
-->

### Wave 1
- **Group:** {C1, C5, …}
- **Parallel:** {which run together, and why they don't collide}
- **Migration-bearer (≤1):** {C? | none}
- **Why safe:** {no shared SERIALIZING file; deps are roots}

### Wave 2  *(produced off updated main; deps {…} already merged)*
- **Group:** {C2, C3, …}
- **Parallel:** {…}
- **Migration-bearer (≤1):** {C? | none}
- **Why safe:** {dep already on main; collision-free within wave}

<!-- add waves until every non-skip candidate is scheduled -->

**Serial migration spine:** {bearers} across {chain-length} waves — the linear `_journal.json` chain. All other PRs hang off it as parallel leaves.

---

## 5. Progress tracker

<!--
  The single source of truth that outlives this transcript — keep it CURRENT.
  Status lifecycle: planned → produced (engine opened the PR; UNVERIFIED) →
  verified (fresh-context byte-gate PASSed, step 05 — the only merge gate) →
  merged (rebase-merged into template main, step 06).
  FAIL at verify → back through produce FRESH (never patch the branch); reset that row to planned.
-->

| ID | Wave | Status | PR# | Verified by | Notes |
|----|------|--------|-----|-------------|-------|
| C1 | 1 | planned | — | — | {…} |
| C5 | 1 | planned | — | — | {…} |
| C2 | 2 | planned | — | — | {…} |
| C3 | 2 | planned | — | — | {…} |

Legend: `planned` · `produced` (unverified) · `verified` (byte-gate PASS) · `merged`

---

## 6. Deferrals

<!--
  Everything tagged skip, plus anything punted: "generalize later," an opt-in flag left
  unwired, a candidate no wave carried. Nothing lives only in memory — step 07 files a
  tracking issue for EACH so the next run rediscovers it as a candidate, not from scratch.
-->

| ID / item | Why deferred | What unblocks it | Tracking issue |
|-----------|--------------|------------------|----------------|
| {C4} | {product-specific / dormant / already upstream} | {n/a or condition} | {URL — filed in step 07} |
| {opt-in flag for C3} | {wired later} | {…} | {URL} |

---

## 7. Harvest issues filed

<!--
  Source bugs you tripped over while PORTING — confirmed against the PRODUCT source
  (open the file, prove the defect is real there; discard port artifacts).
  ONE issue per wave, batching that wave's confirmed bugs. The template PR is the SPEC,
  not a patch source — re-apply by hand in the product's idiom; never cherry-pick.
-->

| Wave | Confirmed bug(s) — product `file:line` | Severity | Template PR (spec) | Harvest issue |
|------|----------------------------------------|----------|--------------------|---------------|
| 1 | {file:line} | {sev} | {#PR} | {URL} |

- **Port artifacts discarded (checked, not real):** {note them so the reader knows they were verified, not missed}
- **Sync-down (source product):** {skip | run} — {one-line rationale; default skip — source is the origin of this batch}
