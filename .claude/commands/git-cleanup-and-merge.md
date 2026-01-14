---
description: 'Analyze git branches, cleanup merged branches, push changes, create PRs, wait for CI, and merge to main'
---

IT IS CRITICAL THAT YOU FOLLOW THIS WORKFLOW EXACTLY.

<workflow CRITICAL="TRUE">

## Phase 0: Pre-flight Checks

Before any operations, verify the environment is safe:

1. **Check gh authentication**: Run `gh auth status`. If not authenticated, STOP and inform user.

2. **Check for uncommitted changes**: Run `git status --porcelain`. If output is non-empty, STOP and inform user to commit or stash changes first.

3. **Check for in-progress operations**: Check if any of these exist:
   - `.git/rebase-merge` (rebase in progress)
   - `.git/MERGE_HEAD` (merge in progress)
   - `.git/CHERRY_PICK_HEAD` (cherry-pick in progress)
   If any exist, STOP and inform user to complete or abort the operation.

4. **Detect remote name**: Run `git remote` and use the first result (usually `origin`).

5. **Detect default branch**: Run `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`. Fallback to `main` if this fails.

6. **Record current branch**: Run `git branch --show-current` to remember where to return at the end.

If any pre-flight check fails, STOP and clearly explain what the user needs to do.

---

## Phase 1: Branch Analysis

Gather comprehensive information about all branches:

1. Run `git fetch <remote>` to get latest remote state
2. Run `git branch -a` to list all branches
3. Run `git branch -a --merged <remote>/<default-branch>` to identify merged branches
4. Run `gh pr list --state merged --limit 50` to detect squash-merged branches
5. Run `git branch -vv` and look for `: gone]` to find orphaned tracking branches
6. For each local branch with a remote, run `git rev-list --left-right --count <remote>/<branch>...<branch>` to detect sync status
7. Run `gh pr list --state open` to check for open PRs
8. Run `gh pr list --state open --json number,createdAt,headRefName` to identify stale PRs (>30 days old)

**Present a summary table to the user with these columns:**
| Branch | Location | Sync Status | Open PR | Recommendation |

**Sync Status values:**
- `merged` - Already merged to default branch
- `synced` - Local and remote are identical
- `ahead` - Local has unpushed commits (show count)
- `behind` - Remote has commits not in local (show count)
- `diverged` - Both ahead and behind (show counts)
- `local-only` - No remote tracking branch
- `orphaned` - Remote tracking branch was deleted

---

## Phase 2: WIP Identification

Use the `AskUserQuestion` tool with `multiSelect: true` to ask the user which branches are Work-In-Progress and should be skipped.

Present all non-merged branches as options. Suggest the current branch (from Phase 0) as WIP by default in the description.

Store the WIP branches list for use in subsequent phases.

---

## Phase 3: Cleanup Merged Branches

For all branches identified as merged (via regular merge OR squash merge):

1. Show the user the list of branches to be deleted with their last commit info
2. Ask for confirmation before proceeding
3. If the current branch is in the delete list, first run `git checkout <default-branch>`
4. For each merged branch:
   - Delete local: `git branch -d <branch>` (use `-D` for squash-merged branches that git doesn't recognize as merged)
   - Delete remote (if exists): `git push <remote> --delete <branch>`
5. Clean orphaned tracking branches: `git branch -vv | grep ': gone]'` and delete them
6. Run `git fetch --prune` to clean up stale refs

---

## Phase 4: Push Local Changes to Remote

For branches that are NOT marked as WIP:

**Local-only branches:**
- Show the branch and its commits
- Confirm with user
- Run `git push -u <remote> <branch>`

**Branches ahead of remote (unpushed commits):**
- Show commits that will be pushed: `git log <remote>/<branch>..<branch> --oneline`
- Confirm with user
- Run `git push <remote> <branch>`

**Diverged branches (both ahead and behind):**
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

**Behind branches:**
- Warn user these need to be updated before further work
- Skip from PR creation unless user explicitly requests

---

## Phase 5: Create PRs

For branches that:
- Have commits ahead of the default branch
- Don't already have an open PR
- Are NOT marked as WIP
- For branches >30 days old, ask user before creating PR

For each eligible branch:
1. Check divergence: `git rev-list --left-right --count <default-branch>...<branch>`
2. If behind default branch, warn user rebase may be needed
3. Create PR: `gh pr create --head <branch> --title "<conventional commit title based on commits>" --body "<summary of changes>"`

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
   - Analyze the failure output
   - Attempt to fix the issue
   - Push the fix
   - Decrement retry counter
   - Re-run CI check
5. If max retries exceeded:
   - Ask user: "Skip this PR", "Abort workflow", or "Manual fix"
   - Handle accordingly

---

## Phase 7: Merge PRs

For each PR that passed CI:

**Pre-merge checks:**
1. Re-verify CI status (avoid race condition): `gh pr view <pr-number> --json statusCheckRollup`
2. Check merge state: `gh pr view <pr-number> --json mergeStateStatus,mergeable`

**If branch is behind default branch (`mergeStateStatus` is `BEHIND`):**
- Ask user: "Update branch via GitHub" or "Skip this PR"
- If update chosen: Use GitHub's update branch feature or `gh pr update-branch <pr-number>`
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

1. Run `git fetch --prune` to clean up all stale remote refs
2. Delete any local branches that were merged (check against PRs merged in Phase 7)
3. Switch back to the original branch recorded in Phase 0 (if it still exists, otherwise stay on default branch)

**Display a final summary:**
```
Git Branch Cleanup Complete!

✓ Deleted X merged branches (local + remote)
✓ Pushed X branches to remote
✓ Created X PRs
✓ Merged X PRs
○ Skipped X WIP branches
✗ X PRs skipped (CI failed / merge conflicts)

Remaining branches: [list]
```

</workflow>

## Safety Rules

- NEVER use force push (`--force` or `-f`)
- NEVER use force delete for branches (`-D`) unless confirmed squash-merged
- ALWAYS confirm with user before destructive operations
- NEVER merge without CI passing
- ALWAYS respect retry limits
- ALWAYS preserve the user's working context (return to original branch)
