# Test Prompts — upstream-contribute

Manual iteration aids. Invoke the skill with each and note pass/fail; no automated harness.

## Should handle well
1. "Contribute this product's reusable improvements back to the template."
2. "Audit what's worth upstreaming from this product into vt-saas-template."
3. "Run the next contribution wave" / "produce the oauth-layer group."
4. "Verify and merge the open contribution PRs."
5. "We've added a generic rate-limiter and an email helper here — harvest them up to the template."

## Should NOT trigger (out of scope — recognize and redirect)
1. "Sync the latest template changes **down** into this product." → that's `upstream-sync` (the opposite direction).
2. "Deploy this product to production." → `/production-deploy`.
3. "Fix this bug in the product's checkout flow." → normal product dev, not a contribution.

## Smoke checks (when dry-running)
- Step 01 detects repo identity by remote/marker (not folder name) and **echoes resolved SOURCE/TARGET/PLAN** before anything downstream.
- The fail-closed selector **errors** (never silently runs "all") when groups don't resolve.
- The `verify` step spawns a **fresh, produce-blind** subagent and checks **pushed bytes** (`git show` / re-run), not the engine's report.
- `main` is only ever **rebase-merged**; force-pushes are handed to the user via `!`.
