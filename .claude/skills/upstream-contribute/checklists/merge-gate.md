# MERGE GATE — UNSKIPPABLE. Consult before merging ANY PR.

> **THE ONE RULE: TRUST BYTES, NOT REPORTS.**
> The produce run's "I fixed it", a review bot's finding, a "green" badge — all are *hypotheses*.
> Nothing merges until an **independent** subagent confirms it against the **pushed** bytes.
> The engine is unverified by definition; this gate is the only thing that makes a merge safe.

Every box must be ticked from **artifacts you re-checked yourself** — not from any upstream claim. One unticked box = do not merge.

- [ ] **Required CI green on the CURRENT head.** Checks ran against the rebased tip (not a stale pre-force-push run). A job reporting `skipping` counts as success. No `--admin` bypass; a red required check is signal, stop.
- [ ] **INDEPENDENT byte-verify = PASS** (step-05, fresh subagent with **no access** to the produce run's reports): every claimed change confirmed *present in the pushed diff* via `git show`; every security / HIGH finding's exploit or test **re-run** to prove fix; `file:line` evidence cited. This is explicitly **NOT** the engine's or produce run's self-report — those carry zero weight here.
- [ ] **Known collisions reconciled.** Migrations renumbered to the end of the chain **and** snapshot regenerated (journal lists the new file); additive registries (schema barrel, locale catalogs, `prod-setup.sql`) taken as a **union**; duplicate infra collapsed to the canonical one — no dupes.
- [ ] **Non-empty diff + rising test count vs base.** `git diff main...HEAD` is non-empty (empty = the change evaporated into a collision); test count rose vs main (the change's tests survived the rebase).
- [ ] **`main` append-only.** Rebase-merge only — no force-push, no rewrite, no rewind of main (revert forward if wedged).
- [ ] **Destructive git routed to the user.** Any feature-branch `push --force-with-lease` / hard-reset handed off as an exact `!` command; checks polled to green, never `--admin`-merged.
- [ ] **Loop-back captured.** Product-source bugs found while porting logged for the harvest issue; a tracking issue exists for every deferral.

---

**STOP RULE:** If you cannot tick the byte-verify box from the **actual pushed bytes** — do not merge. Loop back to step-05 (verify) and run the gate for real.
