# Story 1.5: Rebrand to VT SaaS Template

**Epic:** Epic 1 - Template Foundation & Modernization
**Story ID:** 1.5
**Status:** ready-for-dev
**Assigned To:** refactor-specialist
**Priority:** High
**Estimate:** 3 story points

---

## User Story

As a **template user (developer)**,
I want **all HealthCompanion references replaced with VT SaaS Template**,
So that **the template is ready for customization without domain-specific content**.

---

## Acceptance Criteria

### AC1: Codebase Search
**Given** a search for "HealthCompanion" in the codebase
**When** I search all files (excluding node_modules, .git)
**Then** zero matches are found
**And** all instances replaced with "VT SaaS Template" or generic equivalent

### AC2: Application Metadata
**Given** the application metadata
**When** I check page titles, descriptions, and OG tags
**Then** they reflect "VT SaaS Template" branding
**And** no health-specific messaging remains

### AC3: UI Text
**Given** any UI text visible to users
**When** I review the application
**Then** content is generic/placeholder
**And** suitable for any SaaS use case

### AC4: Documentation
**Given** the README and documentation
**When** I review docs
**Then** project is described as "VT SaaS Template"
**And** setup instructions are template-focused

---

## Context

### Current State
**Verified via grep search (2026-01-12):**

**✅ Already Clean (No Changes Needed):**
- `src/` directory - NO HealthCompanion references found
- `src/utils/AppConfig.ts` - Already shows "VT SaaS Template"
- `src/locales/*.json` - No health-specific content
- `README.md` - Already branded as "VT SaaS Template"
- `package.json` - Already named "vt-saas-template"
- Main application code - Clean

**🔴 Needs Rebranding:**
1. **Documentation Files (docs/):**
   - `docs/api-contracts.md` (title + description)
   - `docs/project-overview.md` (title + description + project tree)
   - `docs/component-inventory.md` (title + description)
   - `docs/index.md` (title)
   - `docs/development-guide.md` (title + git clone example + tree)
   - `docs/data-models.md` (title)
   - `docs/architecture.md` (title + description)
   - `docs/deployment-guide.md` (title + description + step references)
   - `docs/source-tree-analysis.md` (title + tree)
   - `docs/project-scan-report.json` (paths + display name)

2. **Test Files:**
   - `tests/e2e/Auth.e2e.ts` - Line 23: "Join HealthCompanion and start your wellness journey"

3. **Planning Artifacts (_bmad-output/):**
   - Multiple references in PRD, architecture docs, epic files
   - These are historical/planning docs - SKIP (out of scope for template users)

### Replacement Strategy

**Primary Replacement:**
- "HealthCompanion" → "VT SaaS Template"

**Context-Aware Replacements:**
- "health coaching" → "AI assistance" or "AI-powered features"
- "wellness journey" → "productivity journey" or generic equivalent
- "AI health coach" → "AI assistant"
- "personalized health guidance" → "personalized assistance"

**Keep Generic:**
- Avoid inserting new domain-specific language
- Use "SaaS application", "web application", or "template" as descriptors
- Focus on technical capabilities, not business domain

---

## Tasks

### Task 1: Rebrand Documentation Files
**Description:** Update all documentation files in `docs/` directory to reflect VT SaaS Template branding

**Subtasks:**

#### 1.1: Update Documentation Titles
- [ ] File: `docs/api-contracts.md`
  - Change title: "HealthCompanion - API Contracts" → "VT SaaS Template - API Contracts"
  - Update description: Replace health-specific language with generic API description

- [ ] File: `docs/project-overview.md`
  - Change title: "HealthCompanion - Project Overview" → "VT SaaS Template - Project Overview"
  - Update description: Replace "AI-powered health coaching" with "AI-powered SaaS application"
  - Update project tree examples: "HealthCompanion/" → "vt-saas-template/"

- [ ] File: `docs/component-inventory.md`
  - Change title: "HealthCompanion - Component Inventory" → "VT SaaS Template - Component Inventory"
  - Update description: Remove "health coaching" references

- [ ] File: `docs/index.md`
  - Change title: "HealthCompanion Project Documentation" → "VT SaaS Template Project Documentation"

- [ ] File: `docs/development-guide.md`
  - Change title: "HealthCompanion - Development Guide" → "VT SaaS Template - Development Guide"
  - Update git clone example: Line 32-33
    ```bash
    git clone https://github.com/yourusername/vt-saas-template.git
    cd vt-saas-template
    ```
  - Update project tree: "HealthCompanion/" → "vt-saas-template/"

- [ ] File: `docs/data-models.md`
  - Change title: "HealthCompanion - Data Models" → "VT SaaS Template - Data Models"

- [ ] File: `docs/architecture.md`
  - Change title: "HealthCompanion - System Architecture" → "VT SaaS Template - System Architecture"
  - Update description: Replace "AI health coaching platform" with "AI-powered SaaS platform"
  - Line 279: "Thread organization: HealthCompanion database" → "Thread organization: Application database"

- [ ] File: `docs/deployment-guide.md`
  - Change title: "HealthCompanion - Deployment Guide" → "VT SaaS Template - Deployment Guide"
  - Line 44: "Select your HealthCompanion repo" → "Select your vt-saas-template repo"

- [ ] File: `docs/source-tree-analysis.md`
  - Change title: "HealthCompanion - Source Tree Analysis" → "VT SaaS Template - Source Tree Analysis"
  - Update tree examples: "HealthCompanion/" → "vt-saas-template/"

#### 1.2: Update project-scan-report.json
- [ ] File: `docs/project-scan-report.json`
  - Line 9: Update "project_root" path from "HealthCompanion" to "vt-saas-template"
  - Line 10: Update "output_folder" path from "HealthCompanion" to "vt-saas-template"
  - Line 64: Update "display_name" from "HealthCompanion (Web App)" to "VT SaaS Template (Web App)"

**Test Coverage:**
- Run grep to verify zero "HealthCompanion" matches in docs/
- Manually review 2-3 doc files to ensure context makes sense
- Verify JSON is valid after edits

**Dev Notes:**
- Use search & replace in editor for efficiency
- Some docs may have multiple references per file
- Keep technical details intact - only change branding
- If descriptions mention health/wellness features, make them generic

---

### Task 2: Update Test Files
**Description:** Replace domain-specific test content with generic equivalents

**Subtasks:**

#### 2.1: Update Auth E2E Test
- [ ] File: `tests/e2e/Auth.e2e.ts`
  - Line 23: Update assertion text
    ```typescript
    // Before:
    await expect(page.getByText('Join HealthCompanion and start your wellness journey')).toBeVisible();

    // After:
    await expect(page.getByText('Join VT SaaS Template and start your journey')).toBeVisible();
    ```
  - **CRITICAL:** This change will FAIL the test until UI text is updated
  - Check if this text actually exists in the UI - if not, update to match actual text

#### 2.2: Verify UI Text Matches Test
- [ ] Search for "Join HealthCompanion" in `src/` directory
- [ ] If found, update UI component to match new test assertion
- [ ] If NOT found, update test to match actual UI text (likely already generic)

**Test Coverage:**
- Run `npm run test:e2e` - Auth test should pass
- If test fails, verify UI text vs test assertion mismatch

**Dev Notes:**
- Tests must match actual UI text - sync both sides
- This test may have been written against old UI that no longer exists
- If UI is already generic, just update test to match reality
- Run auth flow manually to verify messaging is appropriate

---

### Task 3: Verify Application UI (Manual Review)
**Description:** Manually review the running application to ensure no health-specific content in UI

**Subtasks:**

#### 3.1: Review Unauthenticated Pages
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to `/en` (landing page)
  - Check hero text - should be generic
  - Check feature descriptions - should not mention health
  - Check CTA buttons - should be generic
- [ ] Navigate to `/en/sign-in`
  - Check form labels and descriptions
  - Verify no "health journey" messaging
- [ ] Navigate to `/en/sign-up`
  - Check form text and descriptions
  - Verify registration messaging is generic

#### 3.2: Review Authenticated Pages
- [ ] Sign in with test account
- [ ] Navigate to `/en/dashboard`
  - Check welcome message
  - Check any placeholder content
  - Verify no health-specific widgets/cards
- [ ] Navigate to `/en/chat`
  - Check chat interface placeholder text
  - Check empty state messaging
  - Verify AI assistant descriptions are generic

#### 3.3: Review Other Locales
- [ ] Switch to Hindi (`/hi`)
  - Spot check landing page
  - Verify translations are generic
- [ ] Switch to Bengali (`/bn`)
  - Spot check landing page
  - Verify translations are generic

**Test Coverage:**
- No "health", "wellness", "fitness", "medical" terms visible in UI
- All messaging suitable for any SaaS product
- Translations in all locales are domain-neutral

**Dev Notes:**
- Focus on visible text only (not code comments)
- If health-specific text found, grep for it and update source
- Likely already clean based on earlier grep results
- Document any findings for potential follow-up stories

---

### Task 4: Verify Metadata and SEO
**Description:** Check HTML meta tags, OpenGraph tags, and page titles for branding

**Subtasks:**

#### 4.1: Check Landing Page Metadata
- [ ] Navigate to `/en`
- [ ] Open browser DevTools → Elements → `<head>` section
- [ ] Verify:
  - `<title>` tag - should reflect "VT SaaS Template"
  - `<meta name="description">` - should be generic
  - `<meta property="og:title">` - should be "VT SaaS Template"
  - `<meta property="og:description">` - should be generic
  - No health-specific keywords in meta tags

#### 4.2: Check Other Page Metadata
- [ ] Check `/en/sign-in` metadata
- [ ] Check `/en/dashboard` metadata
- [ ] Check `/en/chat` metadata
- [ ] Verify consistency across all pages

#### 4.3: Review i18n Metadata
- [ ] Check metadata for `/hi` locale
- [ ] Check metadata for `/bn` locale
- [ ] Verify translations are generic

**Test Coverage:**
- All page titles reflect "VT SaaS Template"
- All meta descriptions are domain-neutral
- OpenGraph tags appropriate for template showcase

**Dev Notes:**
- Metadata likely comes from:
  - `src/app/[locale]/layout.tsx` (root layout)
  - Individual page `generateMetadata()` functions
  - `src/locales/*.json` for translated content
- If metadata needs updating, it's a separate quick fix
- Most likely already correct based on AppConfig.ts verification

---

### Task 5: Final Verification & Documentation
**Description:** Comprehensive verification that rebranding is complete

**Subtasks:**

#### 5.1: Run Comprehensive Search
- [ ] Search entire codebase: `grep -r "HealthCompanion" . --exclude-dir={node_modules,.git,.next,_bmad-output}`
- [ ] Verify ZERO matches in:
  - `src/` directory
  - `docs/` directory
  - `tests/` directory
  - Root config files
- [ ] Document any matches in `_bmad-output/` (planning artifacts - OK to leave)

#### 5.2: Run Automated Tests
- [ ] Run unit tests: `npm test` - all should pass
- [ ] Run E2E tests: `npm run test:e2e` - all should pass
- [ ] Run type check: `npm run check-types` - no errors
- [ ] Run linting: `npm run lint` - no errors

#### 5.3: Build Verification
- [ ] Run production build: `npm run build` - should succeed
- [ ] Check build output for any warnings
- [ ] Start production server: `npm start`
- [ ] Smoke test key routes

#### 5.4: Update Story File
- [ ] Mark all tasks complete
- [ ] Document any deviations or findings
- [ ] Update status to "completed"

**Test Coverage:**
- Zero "HealthCompanion" matches in production code/docs/tests
- All automated tests passing
- Production build succeeds
- Application runs without errors

**Dev Notes:**
- This is the final gate before marking story complete
- Any failing tests must be fixed before completion
- Document edge cases for future reference

---

## Technical Notes

### Search Commands for Verification

**Initial Search (exclude planning artifacts):**
```bash
grep -r "HealthCompanion" . \
  --exclude-dir={node_modules,.git,.next,_bmad-output,.claude,coverage,out,storybook-static} \
  --exclude="*.lock" \
  --exclude="CHANGELOG.md"
```

**Focused Searches:**
```bash
# Source code only
grep -r "HealthCompanion" src/

# Documentation only
grep -r "HealthCompanion" docs/

# Tests only
grep -r "HealthCompanion" tests/

# Config files
grep -r "HealthCompanion" *.{json,md,ts,js} 2>/dev/null
```

**Case-insensitive search for related terms:**
```bash
grep -ri "health.companion\|wellness.journey\|health.coach" src/ docs/ tests/
```

### Files Confirmed Clean (No Action Needed)
- ✅ `src/utils/AppConfig.ts` - Already "VT SaaS Template"
- ✅ `README.md` - Already rebranded
- ✅ `package.json` - Already "vt-saas-template"
- ✅ `src/locales/*.json` - No health-specific content
- ✅ All `src/` code files - Zero matches

### Files Requiring Updates (Documented Above)
- 🔴 `docs/*.md` - 9 files with titles/descriptions
- 🔴 `docs/project-scan-report.json` - 3 path references
- 🔴 `tests/e2e/Auth.e2e.ts` - 1 assertion text

### Files Excluded from Scope
- ⚪ `_bmad-output/` - Planning artifacts (historical context, not shipped)
- ⚪ `.claude/` - AI agent configs (not user-facing)
- ⚪ `CHANGELOG.md` - Historical log (leave intact)
- ⚪ `.git/` - Version control (not editable)

### Replacement Patterns

**Direct Replacements:**
| Original | Replacement |
|----------|-------------|
| HealthCompanion | VT SaaS Template |
| health-companion | vt-saas-template |
| healthcompanion.com | your-domain.com |

**Context-Aware Replacements:**
| Original Phrase | Generic Alternative |
|----------------|---------------------|
| AI health coaching | AI assistance / AI-powered features |
| wellness journey | journey / experience |
| health guidance | personalized assistance |
| medical advice | information / guidance |
| fitness tracking | data tracking |

### Testing Strategy

**Automated Verification:**
1. Grep for "HealthCompanion" - must return 0 matches (excluding _bmad-output)
2. Run unit tests - all pass
3. Run E2E tests - all pass
4. Build production - succeeds

**Manual Verification:**
1. Visual review of landing page
2. Check 3-5 doc files for context
3. Verify meta tags in browser
4. Smoke test auth flow

**Acceptance Gate:**
- Zero HealthCompanion references in src/, docs/, tests/
- All tests passing
- UI contains no domain-specific language
- Documentation reads naturally with new branding

---

## Testing Requirements

### Automated Tests
- [ ] All existing unit tests pass: `npm test`
- [ ] All E2E tests pass: `npm run test:e2e` (Auth test updated)
- [ ] Build succeeds: `npm run build`
- [ ] Type checking passes: `npm run check-types`
- [ ] Linting passes: `npm run lint`

### Manual Testing
- [ ] Landing page displays generic messaging (no health terms)
- [ ] Sign-in/Sign-up pages show appropriate template branding
- [ ] Dashboard contains no domain-specific content
- [ ] Chat interface uses generic AI assistant language
- [ ] All three locales (en, hi, bn) are domain-neutral
- [ ] Browser meta tags reflect "VT SaaS Template"

### Verification Commands
```bash
# Must return ZERO matches (exclude _bmad-output, .claude):
grep -r "HealthCompanion" . \
  --exclude-dir={node_modules,.git,.next,_bmad-output,.claude,coverage,out} \
  --exclude="*.lock" \
  --exclude="CHANGELOG.md"

# Verify docs are clean:
grep -r "HealthCompanion" docs/

# Verify tests are clean:
grep -r "HealthCompanion" tests/

# Verify source code is clean:
grep -r "HealthCompanion" src/
```

---

## Definition of Done

- [x] All documentation files updated with "VT SaaS Template" branding
- [x] Test files updated to reflect generic messaging
- [x] Grep search returns zero "HealthCompanion" matches (excluding planning artifacts)
- [x] UI manually reviewed - no health-specific content visible
- [x] Meta tags and SEO metadata verified as generic
- [x] All automated tests pass
- [x] Production build succeeds
- [x] Application runs without errors
- [x] Code review completed
- [x] Changes committed with conventional commit message

---

## Dependencies

**Depends On:**
- Story 1.1: Upgrade Next.js (for stable build)
- Story 1.2: Upgrade React (for stable runtime)
- Story 1.4: Upgrade TypeScript (for type safety)

**Blocks:**
- None (independent refactoring task)

**Related:**
- Story 1.9: Validate Existing Features (comprehensive testing includes this)

---

## Dev Notes for refactor-specialist Agent

### Execution Strategy

**Recommended Order:**
1. **Start with Task 1** - Documentation files (safest, no runtime impact)
2. **Run grep verification** - Confirm docs are clean
3. **Move to Task 2** - Update test files
4. **Run E2E tests** - Verify tests pass (may need UI sync)
5. **Task 3** - Manual UI review (quick visual check)
6. **Task 4** - Metadata verification (5-10 minutes)
7. **Task 5** - Final verification and build

**Time Estimate:**
- Task 1: 15-20 minutes (batch search & replace)
- Task 2: 5-10 minutes (one test file)
- Task 3: 10-15 minutes (manual review)
- Task 4: 5-10 minutes (browser DevTools)
- Task 5: 10-15 minutes (verification + tests)
- **Total: ~60 minutes** (3 story points appropriate)

### Common Pitfalls

1. **Over-editing documentation:**
   - Only change branding, not technical content
   - Keep code examples intact (just update names)
   - Don't rewrite entire paragraphs

2. **Breaking tests with UI mismatches:**
   - Test expects "Join HealthCompanion..." but UI may already be different
   - Check UI first, then sync test to match reality

3. **Missing context-specific replacements:**
   - "AI health coach" should become "AI assistant", not "AI VT SaaS Template"
   - Read the sentence, don't just find-replace

4. **Editing planning artifacts:**
   - `_bmad-output/` files are historical - leave them alone
   - Only edit user-facing code, docs, and tests

### Efficient Workflow

**Batch Operations (save time):**
```bash
# In your editor (VS Code, etc):
# 1. Open all docs/*.md files
# 2. Search & Replace across all files:
#    "HealthCompanion" → "VT SaaS Template"
# 3. Manual review each file (10 seconds each)
# 4. Save all
```

**Quick Verification Loop:**
```bash
# After docs update:
grep -r "HealthCompanion" docs/  # Should be empty

# After test update:
npm run test:e2e -- --grep="Auth"  # Run just Auth test

# After all updates:
npm run build && npm test && npm run test:e2e  # Full suite
```

### Quality Checklist

Before marking complete:
- [ ] Ran grep - zero matches in src/, docs/, tests/
- [ ] All tests passing (unit + E2E)
- [ ] Build succeeds without warnings
- [ ] Manually viewed landing page - looks generic
- [ ] Checked 2-3 doc files - read naturally
- [ ] Browser DevTools shows correct meta tags

### If You Find Additional Health References

**In Source Code (src/):**
- Update the file to use generic language
- Add subtask to Task 3 documenting the change
- Run tests to verify no breakage

**In Translations (src/locales/):**
- Update all three locale files (en, hi, bn) consistently
- Maintain parallel structure across locales
- Verify translations make sense in context

**In Tests (tests/):**
- Update test assertion or fixture data
- Ensure tests still validate correct behavior
- Run full test suite to verify

### Edge Cases

1. **CHANGELOG.md contains HealthCompanion:**
   - This is historical - leave it as-is
   - Changelog documents what was changed, when

2. **Git commit history:**
   - Don't try to rewrite history
   - Old commits can reference old names - that's fine

3. **Planning artifacts (_bmad-output/):**
   - These are context docs for AI agents
   - NOT shipped to end users - skip them

4. **Comments in code:**
   - Update if user-facing (JSDoc, etc)
   - Less critical for internal comments
   - Use judgment - don't over-edit

### Success Criteria

**The Story is Complete When:**
1. ✅ A developer cloning this template sees ZERO health/wellness references
2. ✅ Documentation describes a generic SaaS application
3. ✅ Tests validate generic functionality
4. ✅ UI is domain-neutral and ready for customization
5. ✅ All automated checks pass

**The Story is NOT Complete If:**
1. ❌ Grep still finds "HealthCompanion" in src/, docs/, or tests/
2. ❌ Any test is failing
3. ❌ Build produces errors or warnings
4. ❌ UI still shows health-specific messaging
5. ❌ Documentation reads awkwardly after changes

---

## Story Metadata

**Created:** 2026-01-12
**Epic:** Epic 1 - Template Foundation & Modernization
**Sprint:** Sprint 1
**Story Points:** 3
**Risk Level:** Low (search & replace refactoring, no logic changes)
**Technical Debt:** Removes domain-specific debt, improves template reusability

---

## References

- Project README: `/Users/varuntorka/Coding/vt-saas-template/README.md`
- App Config: `/Users/varuntorka/Coding/vt-saas-template/src/utils/AppConfig.ts`
- Documentation: `/Users/varuntorka/Coding/vt-saas-template/docs/`
- Tests: `/Users/varuntorka/Coding/vt-saas-template/tests/`
- Epic File: `_bmad-output/planning-artifacts/epics/epic-1-template-foundation-modernization.md`

---

## Appendix: Grep Analysis Results

**Search Date:** 2026-01-12

**Files with "HealthCompanion" references:**

**Category: Documentation (9 files - NEEDS UPDATE)**
1. docs/api-contracts.md
2. docs/project-overview.md
3. docs/component-inventory.md
4. docs/index.md
5. docs/development-guide.md
6. docs/data-models.md
7. docs/architecture.md
8. docs/deployment-guide.md
9. docs/source-tree-analysis.md
10. docs/project-scan-report.json

**Category: Tests (1 file - NEEDS UPDATE)**
1. tests/e2e/Auth.e2e.ts (line 23)

**Category: Planning Artifacts (SKIP - out of scope)**
- _bmad-output/planning-artifacts/* (multiple files)
- .claude/agents/* (agent configs)

**Category: Already Clean (NO ACTION NEEDED)**
- src/ (all source files) ✅
- README.md ✅
- package.json ✅
- src/locales/*.json ✅
- CLAUDE.md ✅

**Total files requiring updates: 11**
**Estimated effort: 3 story points** ✅
