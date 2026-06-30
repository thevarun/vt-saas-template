**Harvest from wave `{WAVE_ID}` — bugs found while porting code UP to the template.**

These defects surfaced while generalizing this product's code into [`{TEMPLATE_REPO}`]({TEMPLATE_REPO_URL}). Each one was **verified to exist in this product's own source** (cited `file:line` below), not invented by the port — port artifacts were triaged out before filing.

**Re-apply BY HAND. Do not cherry-pick.** The linked template PR is the **spec**, not a patch source. Its code is generalized — stripped to the seam, placeholders swapped for product copy/brand/domain, schema name neutralized. Pulling it verbatim re-introduces the divergence the strip-to-pattern pass just resolved. Read the PR, then fix each one in this product's own idiom, on your own schedule.

---

<!-- repeat this block once per confirmed bug in the wave -->
### [{SEVERITY}] {SHORT_TITLE}

- **Where:** `{PRODUCT_FILE}:{LINE}`
- **Problem:** {what's actually wrong here in the product source — the defect, not the symptom}
- **Fix:** {fix-intent in one or two lines — what the corrected behavior is, not a diff}
- **Spec:** {TEMPLATE_PR_URL} — the same shape, fixed upstream

<!-- /repeat -->

---

**Source:** wave `{WAVE_ID}` of the `upstream-contribute` loop · template PRs {TEMPLATE_PR_LIST}
**Verified against:** product `main` @ `{PRODUCT_COMMIT_SHA}` ({YYYY-MM-DD})

This is part of the bidirectional fleet-health loop (contribute-up → harvest-back → sync-down). The harvest pattern continues each time a wave ships — expect a follow-up issue per future wave that trips over product-source bugs.
