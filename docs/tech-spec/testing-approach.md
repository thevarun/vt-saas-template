# Testing Approach

**Manual Testing (Stories 1 & 2):**
- **Browsers:** Chrome, Firefox, Safari (at minimum)
- **Devices:** Desktop, tablet, mobile (or responsive mode)
- **User Journeys:** Walk through signup → login → chat → logout
- **Edge Cases:** Test with/without auth, invalid inputs, slow network

**Automated Testing (Story 3):**
- **Framework:** Playwright for E2E
- **Coverage:** Critical paths only (pragmatic, not exhaustive)
- **Execution:** Local dev + CI on every PR
- **Mocking:** Consider mocking Dify API for faster, deterministic tests

**Regression Prevention:**
- E2E tests run on every commit (CI)
- Manual smoke test before marking story complete
- Build validation after each Story 2 phase

---
