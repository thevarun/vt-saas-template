---
description: 'Analyze git branches, cleanup merged branches, push changes, create PRs, wait for CI, and merge to main'
---

IT IS CRITICAL THAT YOU FOLLOW THIS WORKFLOW EXACTLY.

<workflow CRITICAL="TRUE">

## Phase 0: Pre-flight Checks

Before any operations, verify the environment is safe:

1. **Check gh authentication**: Run `gh auth status`. If not authenticated, STOP and inform user.

2. **Check for uncommitted changes**: Run `git status --porcelain`. If output is non-empty, STOP and inform user to commit or stash changes first.

3. **Detect git directory** (worktree-compatible):
   - Run `git rev-parse --git-dir` to get the actual git directory path
   - This works correctly in both main and linked worktrees (where `.git` is a file, not a directory)
   - Store this path for use in step 4

4. **Check for in-progress operations**: Using the git directory from step 3, check if any of these exist:
   - `<git-dir>/rebase-merge` or `<git-dir>/rebase-apply` (rebase in progress)
   - `<git-dir>/MERGE_HEAD` (merge in progress)
   - `<git-dir>/CHERRY_PICK_HEAD` (cherry-pick in progress)
   If any exist, STOP and inform user to complete or abort the operation.

5. **Detect remote name**: Run `git remote` and use the first result (usually `origin`).

6. **Detect default branch**: Run `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`. Fallback to `main` if this fails.

7. **Record current branch and worktree**:
   - Run `git branch --show-current` to get current branch name
   - **If empty (detached HEAD)**: Run `git rev-parse HEAD` to save the commit SHA instead
   - Run `git rev-parse --show-toplevel` to record the current worktree path
   - Track whether we started in detached HEAD state for Phase 8 restoration

8. **Build worktree inventory**: Run `git worktree list --porcelain` to detect all worktrees.
   - Parse the output to build a map: `{ branch_name -> worktree_path }`
   - **For each worktree path, verify it exists on the filesystem**
   - **If a path doesn't exist (stale entry), run `git worktree prune` to clean it up before continuing**
   - Identify which worktree is the main worktree vs linked worktrees
   - For each branch, record if it's checked out in a worktree and where

9. **Check for uncommitted changes in other worktrees**: For each linked worktree (not the current one):
   - Run `git -C <worktree-path> status --porcelain`
   - If any worktree has uncommitted changes, WARN the user (but do not block)
   - Track which worktrees have uncommitted changes for later phases

10. **Display worktree overview** (if multiple worktrees exist):
    ```
    Worktrees detected:
      /path/to/main (main) - this worktree
      /path/to/feature (feature-x) - clean
      /path/to/docs (docs-update) - uncommitted changes!
    ```

11. **Initialize operation log**: Create an in-memory log to track all operations performed.
    - This log will be used for error recovery if something fails mid-workflow
    - Track: operation type, target (branch/worktree), status (success/failed)
    - Log each destructive operation as it completes (worktree removal, branch deletion, push, PR creation, merge)

If any pre-flight check fails, STOP and clearly explain what the user needs to do.

---

## Phase 1: Branch Analysis

Gather comprehensive information about all branches:

1. Run `git fetch <remote>` to get latest remote state
2. Run `git branch -a` to list all branches
3. Run `git branch -a --merged <remote>/<default-branch>` to identify merged branches
4. Detect squash-merged branches:
   - Get merged PR branch names: `gh pr list --state merged --limit 100 --json headRefName,number,mergedAt`
   - For each local branch, check if its name matches a merged PR's `headRefName`
   - **If branch name matches a merged PR, trust the GitHub API - mark as "squash-merged"**
   - **Do NOT use `git rev-list` to verify** (commit ancestry doesn't work for squash merges since commits are rewritten into a single new commit)
5. Run `git branch -vv` and look for `: gone]` to find orphaned tracking branches
6. For each local branch with a remote, run `git rev-list --left-right --count <remote>/<branch>...<branch>` to detect sync status
7. Run `gh pr list --state open` to check for open PRs
8. Run `gh pr list --state open --json number,createdAt,headRefName` to identify stale PRs (>30 days old)
9. **Cross-reference with worktree inventory** (from Phase 0): For each branch, note if it's checked out in a worktree

**Present a summary table to the user with these columns:**
| Branch | Location | Sync Status | Open PR | Worktree | Recommendation |

**Worktree column values:**
- `-` - Not checked out in any worktree
- `/path/to/worktree` - Path where branch is checked out
- `/path/to/worktree (this)` - Checked out in the current worktree
- `/path/to/worktree (dirty)` - Checked out in a worktree with uncommitted changes

**Sync Status values:**
- `merged` - Already merged to default branch
- `synced` - Local and remote are identical
- `ahead` - Local has unpushed commits (show count)
- `behind` - Remote has commits not in local (show count)
- `diverged` - Both ahead and behind (show counts)
- `local-only` - No remote tracking branch
- `orphaned` - Remote tracking branch was deleted

**Recommendation adjustments for worktrees:**
- If branch is `merged` AND in a worktree → "remove worktree first, then delete"
- If branch is `merged` AND in current worktree → "switch to default, then delete"
- If branch is in a worktree with uncommitted changes → include "(worktree has changes)" warning

---

## Phase 2: WIP Identification

Use the `AskUserQuestion` tool with `multiSelect: true` to ask the user which branches are Work-In-Progress and should be skipped.

Present all non-merged branches as options with worktree context:
- **Current worktree branch**: Auto-select as WIP with description "(current worktree)"
- **Branches in other worktrees**: Include worktree path in description, e.g., "(in worktree: /path/to/feature)"
- **Branches with uncommitted worktree changes**: Add warning "(worktree has uncommitted changes)"

Example multi-select presentation:
```
Select WIP branches to skip:
[x] feature-current (current worktree) ← auto-selected
[ ] feature-x (in worktree: /path/to/feature-x)
[ ] feature-y (in worktree: /path/to/feature-y - has uncommitted changes!)
[ ] bugfix-1
[ ] docs-update
```

Store the WIP branches list for use in subsequent phases. Also maintain a separate list of branches that are in worktrees (regardless of WIP status) for Phase 3 handling.

---

## Phase 3: Cleanup Merged Branches

For all branches identified as merged (via regular merge OR squash merge):

### Step 1: Categorize merged branches by worktree status

**Category A - No worktree (safe to delete directly):**
- Branches not checked out in any worktree
- These can be deleted with standard `git branch -d`

**Category B - In linked worktrees (requires worktree handling first):**
- Branches checked out in worktrees OTHER than the current one
- Cannot delete until worktree is removed or switched to different branch

**Category C - In current worktree:**
- The branch you're currently on (if it's merged)
- Requires checkout to default branch first

### Step 2: Present categorized list to user

```
Merged branches to clean up:

A) Ready to delete (no worktree):
   - old-feature (last commit: abc123, 5 days ago)
   - bugfix-123 (last commit: def456, 2 weeks ago)

B) In linked worktrees (need handling first):
   - feature-x at /path/to/feature-x (clean)
   - docs-update at /path/to/docs (has uncommitted changes!)

C) In current worktree:
   - hotfix-1 (will switch to <default-branch> first)
```

### Step 3: Handle Category C (current worktree)

If the current branch is in the delete list:
- Run `git checkout <default-branch>` first
- Then proceed to delete the branch

### Step 4: Handle Category B (branches in linked worktrees)

For EACH branch in a linked worktree, use `AskUserQuestion` to ask:

```
Branch '<branch>' is checked out in worktree at '<path>'.

Options:
1. Remove worktree and delete branch (Recommended)
2. Skip this branch
3. Switch worktree to <default-branch>, then delete branch
```

**If option 1 (Remove worktree):**
1. Check for uncommitted changes: `git -C <worktree-path> status --porcelain`
2. If uncommitted changes exist:
   - WARN: "Worktree at '<path>' has uncommitted changes that will be LOST"
   - Ask for explicit confirmation: "Proceed anyway?" / "Skip this worktree"
   - If skip, move to next branch
3. Remove worktree: `git worktree remove <worktree-path>`
4. If removal fails (locked, etc.), inform user and skip
5. Proceed to delete branch (now safe)

**If option 2 (Skip):**
- Skip this branch entirely
- Add to "skipped due to worktree" list for summary

**If option 3 (Switch worktree branch):**
1. Run `git -C <worktree-path> checkout <default-branch>`
2. If checkout fails, inform user and skip
3. Proceed to delete branch (now safe)

### Step 5: Delete Category A branches and handled Category B/C branches

For each branch now eligible for deletion:
- Delete local: `git branch -d <branch>` (use `-D` for squash-merged branches that git doesn't recognize as merged)
- Delete remote (if exists): `git push <remote> --delete <branch>`

### Step 6: Clean up orphaned tracking branches

- Run `git branch -vv | grep ': gone]'` and delete them

### Step 7: Final cleanup

- Run `git fetch --prune` to clean up stale refs
- Run `git worktree prune` to clean up stale worktree admin entries

---

## Phase 4: Push Local Changes to Remote

For branches that are NOT marked as WIP:

**Local-only branches:**
- Show the branch and its commits
- Confirm with user
- Run `git push -u <remote> <branch>`
- Note: Branches in worktrees CAN be pushed without issues - just note "(in worktree: /path)" in the confirmation

**Branches ahead of remote (unpushed commits):**
- Show commits that will be pushed: `git log <remote>/<branch>..<branch> --oneline`
- If branch is in a worktree, note: "(checked out at /path)"
- Confirm with user
- Run `git push <remote> <branch>`

**Diverged branches (both ahead and behind):**

*If branch is NOT in a worktree:*
- Warn user that rebase is needed
- Ask: "Skip this branch", "Attempt rebase", or "Manual fix"
- If rebase chosen:
  - Run `git checkout <branch>`
  - Run `git rebase <remote>/<branch>`
  - If rebase has conflicts:
    - Run `git rebase --abort`
    - Inform user of the conflict
    - Skip this branch
  - If rebase succeeds:
    - Run `git push <remote> <branch>`
- Return to original branch when done

*If branch IS in a linked worktree:*
- Cannot checkout branch (already checked out elsewhere)
- Ask user with `AskUserQuestion`:
  ```
  Branch '<branch>' has diverged and is checked out at '<path>'.

  Options:
  1. Rebase in that worktree (Recommended)
  2. Skip this branch
  3. Manual fix
  ```
- If option 1 (Rebase in worktree):
  - Check for uncommitted changes: `git -C <worktree-path> status --porcelain`
  - If uncommitted changes exist, WARN and ask to skip or proceed
  - Run `git -C <worktree-path> fetch <remote>`
  - Run `git -C <worktree-path> rebase <remote>/<branch>`
  - If rebase has conflicts:
    - Run `git -C <worktree-path> rebase --abort`
    - Inform user of the conflict
    - Skip this branch
  - If rebase succeeds:
    - Run `git -C <worktree-path> push <remote> <branch>`

*If branch is in the CURRENT worktree:*
- Handle same as non-worktree case (can checkout and rebase normally in current worktree)

**Behind branches:**
- Warn user these need to be updated before further work
- Skip from PR creation unless user explicitly requests

---

## Phase 5: Create PRs

Identify eligible branches:
- Have commits ahead of the default branch
- Don't already have an open PR
- Are NOT marked as WIP

**Before creating PRs:**
1. Build a summary table of all PRs to be created:
   | Branch | Proposed Title | # Commits | Age |
2. Show the table to user
3. Use `AskUserQuestion` to ask: "Create all X PRs?", "Let me select which ones", "Skip PR creation"
4. If "select", present branches as multi-select options
5. Proceed only with confirmed branches

For each confirmed branch:
1. Check divergence: `git rev-list --left-right --count <default-branch>...<branch>`
2. If behind default branch, warn user rebase may be needed after PR creation
3. For branches >30 days old, add note in PR body about age
4. Create PR: `gh pr create --head <branch> --title "<conventional commit title based on commits>" --body "<summary of changes>"`

---

## Phase 6: CI Loop

For each open PR (including newly created ones):

**Configuration:**
- Max 3 fix attempts per PR
- Max 5 minute wait per CI run
- 30 second polling interval

**Process:**
1. Check CI status: `gh pr checks <pr-number>` or `gh pr view <pr-number> --json statusCheckRollup`
2. If CI is running:
   - Display: "Waiting for CI on PR #<number>... (attempt X/3, Xs elapsed)"
   - Wait 30 seconds
   - Re-check (up to 5 minutes total)
3. If CI passes: Mark PR as ready for merge, proceed to Phase 7
4. If CI fails:
   - Fetch and display the failure output
   - Categorize the failure:
     - **Lint/Formatting errors**: Offer to run `npm run lint -- --fix` automatically
     - **Type errors**: Show errors, ask user: "Skip this PR", "I'll fix manually"
     - **Test failures**: Show test output, ask user: "Skip this PR", "I'll fix manually"
     - **Build errors**: Show error, ask user: "Skip this PR", "I'll fix manually"
   - If auto-fix chosen (lint only):
     - Run the fix command
     - Show the diff to user
     - Ask for confirmation before committing
     - Commit with message: "fix: auto-fix lint errors"
     - Push and decrement retry counter
   - If manual fix chosen:
     - Inform user and pause for this PR
     - Ask: "Continue with other PRs?" or "Wait for manual fix?"
5. If max retries exceeded:
   - Ask user: "Skip this PR", "Abort workflow", or "I'll fix manually"
   - Handle accordingly

**IMPORTANT**: NEVER auto-fix test failures or type errors. Only lint/formatting issues are safe to auto-fix.

---

## Phase 7: Merge PRs

For each PR that passed CI:

**Pre-merge checks:**
1. Re-verify CI status (avoid race condition): `gh pr view <pr-number> --json statusCheckRollup`
2. Check merge state: `gh pr view <pr-number> --json mergeStateStatus,mergeable`

**If branch is behind default branch (`mergeStateStatus` is `BEHIND`):**
- Ask user: "Update branch via GitHub" or "Skip this PR"
- If update chosen:
  - Run: `gh api repos/{owner}/{repo}/pulls/{pr-number}/update-branch -X PUT`
  - If the API call fails (e.g., merge conflicts), inform user and offer to skip
- Wait for CI to re-run after update
- Re-check merge state

**If merge conflicts exist (`mergeable` is `CONFLICTING`):**
- STOP - cannot auto-merge
- Show the PR URL
- Ask user: "Skip this PR" or "I'll resolve conflicts manually"
- If manual resolution, wait for user confirmation then re-check

**Merge:**
- Run `gh pr merge <pr-number> --delete-branch`
- This respects the repository's merge strategy settings
- The `--delete-branch` flag removes the remote branch after merge

**If merge fails:**
- Report the error
- Ask user how to proceed

---

## Phase 8: Final Cleanup & Summary

### Step 1: Handle orphaned worktrees from merged PRs

For any worktrees whose branches were merged in Phase 7:
- The remote branch is now deleted, but the local worktree may still exist
- For each such worktree, ask user:
  ```
  Worktree at '<path>' is now on merged branch '<branch>'.

  Options:
  1. Remove worktree (Recommended)
  2. Keep worktree (switch to <default-branch>)
  ```
- If remove: `git worktree remove <path>`
- If keep: `git -C <path> checkout <default-branch>`

### Step 2: Clean up stale refs and worktree entries

1. Run `git fetch --prune` to clean up all stale remote refs
2. Run `git worktree prune` to clean up stale worktree admin entries
3. Delete any local branches that were merged (check against PRs merged in Phase 7)
   - Skip branches that are checked out in remaining worktrees

### Step 3: Return to original context

- **If original state was a branch**: Run `git checkout <original-branch>` (if it still exists, otherwise stay on default branch)
- **If original state was detached HEAD**: Run `git checkout <original-commit-sha>` to restore exact position
- If the original branch was merged and deleted, inform user: "Your original branch '<branch>' was merged. You are now on '<default-branch>'."

### Step 4: Display final summary

```
=====================================================
        Git Branch Cleanup Complete!
=====================================================

BRANCHES:
✓ Deleted X merged branches (local + remote)
✓ Pushed X branches to remote
✓ Created X PRs
✓ Merged X PRs
○ Skipped X WIP branches
✗ X PRs skipped (CI failed / merge conflicts)

WORKTREES:
✓ Removed X worktrees (merged branches)
✓ Pruned X stale worktree entries
○ Preserved X active worktrees

CURRENT STATE:
  Branch: <current-branch>
  Worktree: <current-worktree-path>

REMAINING BRANCHES:
  - feature-wip (in worktree: /path/to/feature-wip)
  - bugfix-active (ahead 2)

ACTIVE WORKTREES:
  /path/to/main        main        (this worktree)
  /path/to/feature     feature-wip clean

WARNINGS (if any):
  - PR #42 has merge conflicts, needs manual resolution
  - Worktree at /path/to/feature has uncommitted changes
=====================================================
```

</workflow>

## Error Recovery

If the workflow fails at any point, display:

1. **Operations completed successfully** (from the operation log)
2. **The operation that failed** and the error message
3. **Current repository state**:
   - Current branch: `git branch --show-current`
   - Uncommitted changes: `git status --porcelain`
   - Any in-progress operations: check for rebase/merge/cherry-pick

4. **Recovery guidance based on failure point**:

   **If failed during worktree removal:**
   - Worktree may be partially removed
   - Run: `git worktree prune` to clean up
   - Branch was NOT deleted (safe)

   **If failed during branch deletion:**
   - Local branch may be deleted but remote still exists (or vice versa)
   - Check: `git branch -a | grep <branch>`
   - Manual cleanup: `git branch -d <branch>` or `git push origin --delete <branch>`

   **If failed during push:**
   - Changes are local, nothing lost
   - Retry: `git push <remote> <branch>`

   **If failed during PR creation:**
   - Branch is pushed, PR was not created
   - Retry: `gh pr create --head <branch>`

   **If failed during merge:**
   - PR still exists, not merged
   - Check PR status: `gh pr view <number>`
   - Retry via GitHub UI or: `gh pr merge <number>`

   **If failed during rebase:**
   - Rebase may be in progress
   - Check: `git status`
   - Abort if needed: `git rebase --abort`
   - Branch is in original state (safe)

5. **Always safe to re-run**: The workflow is idempotent - running it again will skip already-completed operations.

---

## Safety Rules

### Branch Safety Rules
- NEVER use force push (`--force` or `-f`)
- NEVER use force delete for branches (`-D`) unless confirmed squash-merged
- ALWAYS confirm with user before destructive operations
- NEVER merge without CI passing
- ALWAYS respect retry limits
- ALWAYS preserve the user's working context (return to original branch)

### Worktree Safety Rules
- NEVER remove a worktree with uncommitted changes without explicit user confirmation
- NEVER force remove a worktree (`git worktree remove --force`) - always handle uncommitted changes properly
- ALWAYS check worktree status (`git -C <path> status --porcelain`) before attempting branch deletion
- ALWAYS run `git worktree prune` after removing worktrees to clean up stale entries
- NEVER attempt to remove the main worktree (git will error, but check anyway)
- ALWAYS use `git -C <path>` for operations in linked worktrees (never cd into them)
- NEVER delete a branch without first handling its worktree (remove or switch branch)
- ALWAYS warn user if an operation will affect a worktree they're not currently in
- ALWAYS preserve at least one worktree (the main one cannot be removed)
- ALWAYS check for in-progress operations (rebase, merge, cherry-pick) in worktrees before operating on them
