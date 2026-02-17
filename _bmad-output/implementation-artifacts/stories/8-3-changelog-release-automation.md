# Story 8.3: Changelog Release Automation

**Epic:** Epic 8: Go-To-Market Features
**Status:** ready-for-dev
**Story Type:** DevOps/CI Enhancement
**Complexity:** Medium
**Sprint:** Epic 8, Story 3 of 5

---

## User Story

As a **product owner**,
I want **releases auto-generated from commits**,
So that **I don't manage versions manually**.

---

## Acceptance Criteria

### AC1: GitHub Release Workflow Triggers on Main Branch

**Given** a GitHub release is published
**When** the release event triggers
**Then** GitHub Action workflow runs
**And** workflow extracts release notes
**And** workflow prepares content for publishing

### AC2: Changelog Workflow Configuration

**Given** the changelog workflow
**When** I review .github/workflows/changelog.yml
**Then** workflow triggers on: push to main
**And** workflow extracts: version, date, notes
**And** workflow formats content appropriately

### AC3: Semantic-Release Automated Versioning

**Given** semantic-release configuration
**When** I review the release automation
**Then** uses `semantic-release` for automated versioning
**And** versioning follows semver (`MAJOR.MINOR.PATCH`)
**And** version auto-determined from Conventional Commit messages
**And** `feat:` → minor bump, `fix:` → patch bump
**And** `BREAKING CHANGE` footer → major bump (manual/intentional)

### AC4: Grouped Release Notes Output

**Given** release output
**When** semantic-release runs on push to main
**Then** GitHub Release created automatically with generated notes
**And** release notes grouped by commit type (features, fixes, etc.)
**And** content is saved to `docs/changelog/` or similar

### AC5: Optional Extension Points

**Given** content output options
**When** workflow completes
**Then** optionally: webhook is called (for n8n/Zapier)
**And** optionally: PR is created with new content

---

## Technical Specification

### Current State

The project already has:
- GitHub Actions workflow: `.github/workflows/release.yml`
- `semantic-release` installed and configured in `package.json`
- Conventional Commits enforced via Husky + commitlint
- Release triggers on push to main (after CI success)

**Existing semantic-release configuration:**
```json
{
  "release": {
    "branches": ["main"],
    "plugins": [
      ["@semantic-release/commit-analyzer", { "preset": "conventionalcommits" }],
      "@semantic-release/release-notes-generator",
      "@semantic-release/github"
    ]
  }
}
```

### Required Enhancements

1. **Add changelog file generation** using `@semantic-release/changelog` plugin
2. **Add git commit step** using `@semantic-release/git` plugin to persist changelog to repo
3. **Create docs/changelog directory structure** for markdown files
4. **Configure changelog format** to be Story 8.4-compatible

### Enhanced semantic-release Configuration

```json
{
  "release": {
    "branches": ["main"],
    "plugins": [
      [
        "@semantic-release/commit-analyzer",
        {
          "preset": "conventionalcommits",
          "releaseRules": [
            { "type": "feat", "release": "minor" },
            { "type": "fix", "release": "patch" },
            { "type": "perf", "release": "patch" },
            { "type": "revert", "release": "patch" },
            { "type": "docs", "release": false },
            { "type": "style", "release": false },
            { "type": "chore", "release": false },
            { "type": "refactor", "release": false },
            { "type": "test", "release": false },
            { "breaking": true, "release": "major" }
          ]
        }
      ],
      [
        "@semantic-release/release-notes-generator",
        {
          "preset": "conventionalcommits",
          "presetConfig": {
            "types": [
              { "type": "feat", "section": "Features" },
              { "type": "fix", "section": "Bug Fixes" },
              { "type": "perf", "section": "Performance Improvements" },
              { "type": "revert", "section": "Reverts" },
              { "type": "docs", "section": "Documentation", "hidden": false },
              { "type": "style", "section": "Styles", "hidden": true },
              { "type": "chore", "section": "Miscellaneous Chores", "hidden": true },
              { "type": "refactor", "section": "Code Refactoring", "hidden": true },
              { "type": "test", "section": "Tests", "hidden": true },
              { "type": "build", "section": "Build System", "hidden": true },
              { "type": "ci", "section": "Continuous Integration", "hidden": true }
            ]
          }
        }
      ],
      [
        "@semantic-release/changelog",
        {
          "changelogFile": "docs/CHANGELOG.md"
        }
      ],
      [
        "@semantic-release/npm",
        {
          "npmPublish": false
        }
      ],
      "@semantic-release/github",
      [
        "@semantic-release/git",
        {
          "assets": ["docs/CHANGELOG.md", "package.json", "package-lock.json"],
          "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ]
    ]
  }
}
```

### Changelog File Structure

```
docs/
├── CHANGELOG.md           # Main changelog (generated by semantic-release)
└── changelog/             # Individual release files (for Story 8.4)
    ├── 1.9.0.md          # Future: extracted from CHANGELOG.md
    ├── 1.8.0.md          # Future: extracted from CHANGELOG.md
    └── README.md         # Explains the directory structure
```

**Note:** Story 8.3 generates the main `CHANGELOG.md` file. Story 8.4 will extract individual release files into `docs/changelog/` directory for the changelog page.

### Package Dependencies to Add

```json
{
  "devDependencies": {
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/git": "^10.0.1"
  }
}
```

**Note:** `@semantic-release/npm` is already included in semantic-release core.

---

## Implementation Guidelines

### Task Breakdown

#### Task 1: Install Required Packages

```bash
npm install --save-dev @semantic-release/changelog @semantic-release/git
```

**Subtasks:**
1. Run npm install command
2. Verify package-lock.json updated
3. Commit changes: `chore(deps): add semantic-release changelog plugins`

#### Task 2: Update semantic-release Configuration

**Subtasks:**
1. Open `package.json`
2. Locate `"release"` section
3. Replace existing plugins array with enhanced configuration (see Technical Specification)
4. Verify JSON syntax is valid
5. Commit changes: `feat(ci): enhance semantic-release with changelog generation`

#### Task 3: Create Changelog Directory Structure

**Subtasks:**
1. Create `docs/changelog/` directory
2. Create `docs/changelog/README.md` with usage instructions
3. Add `.gitkeep` or README to ensure directory is tracked
4. Commit changes: `docs: add changelog directory for future release notes`

**README.md content:**
```markdown
# Changelog Directory

This directory will contain individual release notes extracted from the main CHANGELOG.md file.

Each release will have its own markdown file (e.g., `1.9.0.md`, `2.0.0.md`) that can be displayed on the changelog page.

**Note:** This directory is prepared for Story 8.4 (Changelog Page). Files will be populated after that story is implemented.
```

#### Task 4: Verify Existing Release Workflow

**Subtasks:**
1. Review `.github/workflows/release.yml`
2. Confirm workflow triggers on `push to main` after CI success
3. Confirm workflow has correct permissions (contents: write)
4. No changes needed - workflow already configured correctly

#### Task 5: Test Release Automation Locally

**Subtasks:**
1. Create test branch from main
2. Make a feat commit: `feat(test): test semantic-release changelog generation`
3. Push to test branch
4. Merge to main via PR (or use semantic-release dry-run)
5. Verify `docs/CHANGELOG.md` is created/updated
6. Verify version bump in `package.json`
7. Verify GitHub Release is created
8. Clean up test release if needed

**Dry-run command (for local testing):**
```bash
npx semantic-release --dry-run --no-ci
```

#### Task 6: Update Project Documentation

**Subtasks:**
1. Update `docs/ci-cd-pipeline.md` to document changelog automation
2. Add section explaining semantic-release workflow
3. Document version bumping rules (feat/fix/BREAKING CHANGE)
4. Document changelog file locations
5. Commit changes: `docs: document changelog release automation`

---

## Dev Notes

### Integration with Story 8.4

Story 8.4 (Changelog Page) depends on this story's output. The changelog page will:
- Read from `docs/CHANGELOG.md` (generated by this story)
- Or parse individual release files from `docs/changelog/` (extracted in Story 8.4)

**Important:** This story sets up the automation infrastructure. Story 8.4 will create the user-facing changelog page.

### Semantic-Release Behavior

**Version Bumping:**
- `feat:` commits → minor version bump (1.8.0 → 1.9.0)
- `fix:` commits → patch version bump (1.8.0 → 1.8.1)
- `BREAKING CHANGE:` footer → major version bump (1.8.0 → 2.0.0)
- No release commits (docs, chore, etc.) → no release

**Release Process:**
1. CI workflow completes successfully on main
2. Release workflow triggers via `workflow_run` event
3. semantic-release analyzes commits since last release
4. Determines next version based on commit types
5. Generates release notes grouped by type
6. Updates `docs/CHANGELOG.md` and `package.json`
7. Commits changes back to main with `[skip ci]` flag
8. Creates GitHub Release with generated notes

**Skip CI Flag:**
The `[skip ci]` flag in the release commit prevents infinite loop:
```
chore(release): 1.9.0 [skip ci]

## Features
- Added share widget component
```

### Edge Cases

1. **No releasable commits:** If only chore/docs commits since last release, semantic-release skips release
2. **Manual releases:** Can trigger manually via GitHub Actions UI
3. **Hotfix releases:** Push to main with `fix:` commits
4. **Breaking changes:** Require explicit `BREAKING CHANGE:` footer in commit message

### Future Extensions (Out of Scope)

These are noted in AC5 but NOT required for this story:
- Webhook to n8n/Zapier on release
- Automated PR creation for changelog updates
- Slack/Discord notifications on release

Story 8.3 focuses on core automation only. Extensions can be added in future stories if needed.

### Testing Strategy

**Pre-merge Testing:**
1. Test semantic-release dry-run locally
2. Verify configuration syntax in package.json
3. Verify docs/changelog directory exists
4. Verify CI pipeline still passes

**Post-merge Testing:**
1. Monitor first automated release on main branch
2. Verify CHANGELOG.md is created/updated
3. Verify GitHub Release is created
4. Verify version bump in package.json
5. Verify release commit has [skip ci] flag

**Rollback Plan:**
If release automation fails:
1. Revert package.json changes
2. Remove @semantic-release/changelog and @semantic-release/git plugins
3. Release workflow will continue creating GitHub Releases without CHANGELOG.md

---

## Definition of Done

- [ ] `@semantic-release/changelog` and `@semantic-release/git` installed in devDependencies
- [ ] `package.json` release configuration updated with enhanced plugins
- [ ] Release rules configured for feat/fix/BREAKING CHANGE commit types
- [ ] Release notes generator configured to group by commit type
- [ ] `docs/changelog/` directory created with README.md
- [ ] Existing `.github/workflows/release.yml` verified (no changes needed)
- [ ] Local dry-run test completed successfully
- [ ] Documentation updated in `docs/ci-cd-pipeline.md`
- [ ] First automated release tested on main branch
- [ ] `docs/CHANGELOG.md` generated and committed
- [ ] GitHub Release created with grouped release notes
- [ ] Version bumped in package.json
- [ ] Release commit has `[skip ci]` flag
- [ ] No infinite loop in CI pipeline
- [ ] All existing CI checks still pass

---

## Related Stories

- **8.4: Changelog Page** - Depends on this story's CHANGELOG.md output
- **1.8: Validate CI/CD Pipeline** - Related CI/CD infrastructure

---

## Notes for Developer

### Important: This Story Enhances Existing Automation

The project already has semantic-release configured and running. This story adds:
1. Changelog file generation (`@semantic-release/changelog`)
2. Automated commit of changelog back to repo (`@semantic-release/git`)
3. Directory structure for Story 8.4

**Do NOT rewrite the existing release workflow** - it's already working correctly.

### Commit Message Format Reminder

The project uses Conventional Commits (enforced by Husky). Examples:

```bash
# Minor version bump (1.8.0 → 1.9.0)
feat(share): add share widget component

# Patch version bump (1.8.0 → 1.8.1)
fix(auth): prevent null reference in login flow

# Major version bump (1.8.0 → 2.0.0)
feat(api)!: redesign API authentication

BREAKING CHANGE: API now requires Bearer token in Authorization header

# No release (skipped)
docs: update changelog automation guide
chore(deps): update dependencies
```

### Verification Checklist

After merging this story to main:

1. Wait for CI to complete
2. Wait for Release workflow to trigger
3. Check GitHub Releases page for new release
4. Check `docs/CHANGELOG.md` exists and has content
5. Check package.json version is bumped
6. Check git history for release commit with `[skip ci]`
7. Verify no additional CI runs triggered by release commit

If any step fails, check workflow logs in GitHub Actions.

---

## Desk Check

**Status:** pending
**Date:** 2026-02-10
**Notes:** Story created by story-prep-master agent. Ready for developer review.
