---
stepsCompleted: [1, 2]
lastStep: step-02-discover
workflowType: edit-workflow
targetWorkflow: implement-epic-with-subagents
date: 2026-01-14
---

# Workflow Edit: implement-epic-with-subagents

## User Goal

Add git worktree support to the workflow:
1. During initialization, set up a new work tree before doing anything else
2. Create the specialized dev agents in that work tree
3. Instruct the user to restart the Claude session in that work tree
4. During completion, create a PR with all changes and optionally remove the work tree

---

## Workflow Analysis

### Target Workflow

- **Path**: `_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/`
- **Name**: implement-epic-with-subagents
- **Module**: bmm (4-implementation phase)
- **Format**: Standalone (workflow.md + steps/)

### Structure Analysis

- **Type**: Meta-workflow / Autonomous Orchestration
- **Total Steps**: 4 (step-01-init, step-01b-continue, step-02-orchestrate, step-03-complete)
- **Step Flow**: Linear with continuation branch (1 → 2 → 3, or 1b → 2 → 3)
- **Files**:
  ```
  implement-epic-with-subagents/
  ├── workflow.md
  ├── workflow.yaml
  ├── steps/
  │   ├── step-01-init.md (~380 lines)
  │   ├── step-01b-continue.md (~210 lines)
  │   ├── step-02-orchestrate.md (~440 lines)
  │   └── step-03-complete.md (~390 lines)
  ├── templates/
  │   └── epic-completion-report.md
  └── validation/
  ```

### Content Characteristics

- **Purpose**: Automate entire epic execution by orchestrating sub-agents (story-prep, dev, code-review) to implement all stories sequentially with minimal human intervention
- **Instruction Style**: Prescriptive with autonomous execution patterns
- **User Interaction**: Minimal - escalation-only during execution (init and failures only)
- **Complexity**: High - multi-agent coordination, state management, failure handling

### Current Git Workflow

1. **Section 1.5** - Git sync check (uncommitted changes, behind/ahead remote)
2. **Section 3.5** - Creates feature branch: `feature/epic-{N}-{name}`
3. **Phase D** - Commits after each story completion
4. **Section 6** - Creates PR via `gh pr create` at completion

### Initial Assessment

#### Strengths

- Well-structured autonomous execution pattern
- Comprehensive sidecar state tracking for resumption
- Clear agent handoff protocols
- Good failure handling with retry/escalate patterns
- Already has git workflow foundation (branch creation, commits, PR)

#### Potential Issues

- step-01-init.md is ~380 lines (larger than typical 80-250 guideline)
- No isolation - workflow runs in main working directory
- Main repo blocked during epic execution
- Session restart for agent loading not ideal

#### Format-Specific Notes

- Uses workflow.yaml for configuration (common in bmm module)
- Sidecar file pattern for state management
- Template usage for completion report

### Best Practices Compliance

- **Step File Structure**: Good (clear sections, numbered sequences)
- **Frontmatter Usage**: Excellent (all variables defined and used)
- **Menu Implementation**: Good (but minimal menus due to autonomous pattern)
- **Variable Consistency**: Good (uses frontmatter variables throughout)

---

## Party Mode Insights (from agent discussion)

### Winston (Architect)
- Worktree should be sibling directory (`../{project}-epic-{N}`)
- Explicit user confirmation for cleanup (potentially destructive)
- "Boring technology that actually works"

### Wendy (Workflow Builder)
- Section 1.6 for worktree creation (after git sync check)
- Hard stop for session restart instruction
- Section 6.5 for cleanup (after PR creation)
- Sidecar tracks worktree path

### Amelia (Developer)
- Commands: `git worktree add -b`, `git worktree remove`
- Sidecar schema: `worktree_path`, `is_worktree: true`
- `npm install` required in worktree before dev work

### BMad Master
- workflow.yaml needs: `worktree_directory_pattern`, `auto_cleanup_worktree`

---

## Web Research: Git Worktree Best Practices

Sources:
- [Supercharge Your AI Coding Workflow (DEV.to)](https://dev.to/bhaidar/supercharge-your-ai-coding-workflow-a-complete-guide-to-git-worktrees-with-claude-code-60m)
- [incident.io Git Worktrees Guide](https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees)

Key patterns:
- Naming: `ai/{task}` branch, `{project}-ai-{task}` directory
- Each worktree needs own dependency installation
- Run `/init` in new worktree to orient Claude
- Confirm before worktree removal (check uncommitted changes)
- Worktrees share git history but have isolated working directories

---

_Analysis completed on 2026-01-14_

---

## Improvement Goals

### Motivation

- **Trigger**: Enable parallel development while epic executes autonomously
- **User Feedback**: Main repo is blocked during epic execution, can't work on other things
- **Success Issues**: Current workflow works but lacks isolation; session restart for agents is clunky

### User Experience Issues

- Main working directory blocked during execution
- Can't run multiple epics in parallel
- Session restart required for specialist agents but no clear pause/resume

### Performance Gaps

- Single sidecar file doesn't support multiple parallel epics
- No worktree isolation means potential interference with main repo

### Growth Opportunities

- Git worktree support for true isolation
- Multiple parallel epic executions
- Cleaner session handoff with pause/resume pattern
- Optional worktree mode for flexibility

### Instruction Style Considerations

- **Current Style**: Prescriptive autonomous execution
- **Desired Changes**: Add worktree decision point; clear session restart instructions
- **Style Fit Assessment**: Good fit - worktree setup is a one-time decision at init

### Prioritized Improvements

#### Critical (Must Fix)

1. **Worktree mode prompt** - Ask user: [W] Worktree / [M] Main repo at init
2. **workflow.yaml configuration** - Add `worktree_mode`, `worktree_directory_pattern`, `dependency_command`
3. **Epic-specific sidecars** - New pattern: `_bmad-output/epic-executions/epic-{N}-state.yaml` (gitignored)
4. **Worktree creation** (if chosen) - Branch + directory + automatic dependency installation
5. **Session restart pause** (if worktree) - Clear instructions + sidecar phase update + STOP
6. **Worktree detection on resume** - Detect worktree context, find matching sidecar via absolute path
7. **Cleanup with commands** - Mark for removal + provide commands to run from main repo

#### Important (Should Fix)

8. **Existing epic detection** - On startup, list pending sidecars with worktree paths
9. **Sidecar schema updates** - Add `worktree_config` section with paths, branch, deps status
10. **Completion report updates** - Include worktree info and cleanup status
11. **Sprint-status conflict documentation** - Note that parallel epics may cause merge conflicts

#### Nice-to-Have (Could Fix)

12. **Package manager auto-detect** - npm/yarn/pnpm/bun detection
13. **Worktree health check** - Verify worktree still exists on resume
14. **.gitignore update** - Add `_bmad-output/epic-executions/` entry

### Focus Areas for Next Step

- step-01-init.md: Major changes (worktree prompt, creation, deps, pause)
- step-01b-continue.md: Worktree detection and sidecar lookup
- step-03-complete.md: Cleanup section with user confirmation
- workflow.yaml: New configuration variables

### Technical Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Worktree mode | Optional (ask at runtime) | Flexibility; backwards compatible |
| Sidecar location | Main repo (`epic-executions/`) | Survives worktree deletion; central visibility |
| Sidecar git status | Gitignored subfolder | Other outputs remain versioned |
| Dependency install | Automatic | Reduces user friction |
| Cleanup | User-confirmed + commands | Can't remove from inside worktree |
| Sprint-status conflicts | Accept for simplicity | Easy to resolve; different story sections |

---

_Goals identified on 2026-01-14_
