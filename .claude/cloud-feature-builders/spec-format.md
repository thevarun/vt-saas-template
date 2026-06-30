# Spec Format

- Never delete a section - write **Not Relevant** in one line if they genuinely don't apply — so its clear it was a conscious call, not a silent skip.
- Strip the `<!-- guidance -->` comments as you fill them.
- **Dense, not long** — prefer ASCII diagrams and tables over prose; comprehensive in coverage, not in word count.

---

## {Title}

`type:` feature | bugfix | refactor | chore

## Intent

**Problem:** what's broken or missing, and why it matters. 1–2 sentences.
**Approach:** the *what*, not the *how*. 1–2 sentences.

## Boundaries

**Always:** invariants the implementation must hold.
**Never:** out of scope + forbidden approaches (kills the "while I'm here…" failure mode).
**Flag:** things a human should confirm at review — surfaced, not blocking.

## Key Decisions

<!-- One block per decision. If the approach is obvious with no real alternatives, say so in
     one line. Be honest; never pad. -->

**Decision:** the question.
- **Options:** the real candidates, one line of trade-off each.
- **Recommendation:** lean toward X, because Y.
- **Call:** `obvious` (a clear best answer) | `judgment-call` (reasonable people differ).
- **Affects:** what this swings (components, UX, data).

<!-- If a `judgment-call` significantly shapes the feature AND has no obvious answer, do not
     pick arbitrarily — mark the spec BLOCKED and hand back for a human to decide. -->

## Cross-Feature Impact
<!-- always present; write "Not Relevant" if the change is self-contained -->

**Depends on:** what must already exist or be true.
**Affects:** features/components that consume or interact with this.
**Could break:** the realistic ripple — and how the spec guards against it.

## UX / Design
<!-- always present; write "Not Relevant" if there's no user-facing surface -->

**Layout:** structure and flow of the surface — where things go, the hierarchy.
**Components to reuse:** existing components/tokens *by name* — specify only the deltas, don't
restate the design system.
**Interaction states:** the states that matter here (rest, focus, loading, empty, error, …).
**Copy:** user-facing text that's load-bearing.

## Technical Architecture

**Key data flows** — as an ASCII diagram (renders anywhere; mermaid won't, in a Linear comment).
**Sequence diagrams** — ASCII (participants + `->` arrows).
**Module & Components** and how they should be wired up.
**Code Map** - `path/to/file` — its role / why it's in scope
**I/O & Edge Cases**

| Scenario | Input / State | Expected behavior | Error handling |
|---|---|---|---|
| happy path | … | … | — |

## Acceptance Criterion

<!-- behaviors the tasks must satisfy -->
- [ ] Given <precondition>, when <action>, then <expected result>

## Notes

<!-- Only non-obvious rationale -->

## Open Questions

<!-- Questions which could not be resolved as this time. Which require human input or further investigation -->

## Change Log
<!-- append-only; the review loop adds entries; starts empty -->
