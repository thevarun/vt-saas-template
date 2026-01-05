---
name: 'step-01b-continue'
description: 'Resume epic execution from previous session using sidecar state'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-01b-continue.md'
nextStepFile: '{workflow_path}/steps/step-02-orchestrate.md'
completionStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/workflow.md'

# Template References
# (none required for continuation step)

# Task References
# (none required for continuation step)

# State files
sidecarFile: '{output_folder}/epic-execution-state.yaml'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'
---

# Step 1B: Epic Execution Continuation

## STEP GOAL:

To resume epic execution from a previous session by loading the sidecar state, determining the exact resume point (which story, which phase), and seamlessly continuing autonomous execution.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Orchestrator-Specific Rules:

- 🛑 NEVER modify completed story results
- 🔄 CRITICAL: Determine exact resume point from sidecar state
- 📋 YOU ARE AN ORCHESTRATOR resuming execution

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ You are resuming a previously started epic execution
- ✅ You maintain execution continuity without loss of progress
- ✅ You communicate resume status clearly

### Step-Specific Rules:

- 🎯 Focus ONLY on analyzing state and resuming
- 🚫 FORBIDDEN to re-execute completed stories
- 💬 Confirm resume point with user
- 🚪 DETECT if all stories are already complete

## EXECUTION PROTOCOLS:

- 🎯 Show current state analysis before resuming
- 💾 Update sidecar with resume timestamp
- 📖 Preserve all completed story data
- 🚫 FORBIDDEN to modify historical execution data

## CONTEXT BOUNDARIES:

- Sidecar file contains complete execution state
- Previous stories may be completed, in-progress, or pending
- Current phase indicates where to resume within a story
- Sprint-status.yaml reflects actual story states

## CONTINUATION SEQUENCE:

### 1. Load Sidecar State

Read the complete sidecar file at `{sidecarFile}`:

Extract:
- `epic_file`: Path to epic being executed
- `epic_name`: Name of the epic
- `current_story`: Story that was being processed (may be null)
- `current_phase`: Phase within story (create/dev/quality/review/commit)
- `stories_completed`: List of finished stories
- `stories_pending`: List of remaining stories
- `stories_skipped`: List of skipped stories
- `stories_failed`: List of failed stories
- `started_at`: Original start timestamp
- `last_updated`: Last activity timestamp

### 2. Analyze Execution State

Determine resume scenario:

**Scenario A: Mid-Story Resume**
If `current_story` is set and `current_phase` is not null:
- Resume at the specific phase of that story
- Example: Story 2.3 was in "dev" phase → resume dev

**Scenario B: Between Stories**
If `current_story` is null or phase is "complete":
- Start next story from `stories_pending[0]`

**Scenario C: All Stories Complete**
If `stories_pending` is empty:
- Route to step-03-complete for report generation

### 3. Display Resume Summary

"**Welcome Back!**

**Epic:** [epic_name]
**Started:** [started_at]
**Last Activity:** [last_updated]

**Progress:**
- ✅ Completed: [X] stories
- ⏸️ Skipped: [X] stories
- ❌ Failed: [X] stories
- ⏳ Pending: [X] stories

**Resume Point:**
[Based on scenario - describe where we'll resume]

Example outputs:
- 'Resuming Story 2.3 at development phase'
- 'Starting Story 2.4 (previous story completed)'
- 'All stories complete - ready to generate report'"

### 4. Validate Resume Readiness

Quick prerequisite check:
- Epic file still exists and readable
- Sprint-status.yaml accessible
- Required agents still available

If any critical issue → report and ask user how to proceed.

### 5. Confirm Continuation Intent

"**Ready to continue?**

Would you like to:
- [C] Continue from [resume point]
- [R] Restart epic from beginning (will lose progress)
- [S] Show detailed execution log"

### 6. Handle Menu Selection

#### IF C (Continue):
1. Update sidecar: add `resumed_at: [timestamp]` to execution_log
2. Set `current_phase` appropriately for resume
3. Route based on scenario:
   - Scenario A/B → load step-02-orchestrate.md
   - Scenario C → load step-03-complete.md

#### IF R (Restart):
1. Confirm: "This will clear all progress. Are you sure? [Y/N]"
2. If Y: Delete sidecar, route to step-01-init.md
3. If N: Redisplay menu

#### IF S (Show Log):
1. Display execution_log entries
2. Show per-story details
3. Redisplay menu

### 7. Present MENU OPTIONS

Display: **Select an Option:** [C] Continue | [R] Restart | [S] Show Log

#### EXECUTION RULES:

- ALWAYS halt and wait for user selection
- Confirm restart with double-check
- Show execution context before continuing

#### Menu Handling Logic:

- IF C: Update sidecar with resume timestamp, then:
  - If stories pending → load `{nextStepFile}`
  - If all complete → load `{completionStepFile}`
- IF R: Confirm and handle restart
- IF S: Display log and redisplay menu
- IF Any questions: Respond and redisplay menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Sidecar state loaded and analyzed correctly
- Resume point determined accurately
- User confirmed continuation
- Proper routing to next step
- Resume timestamp recorded

### ❌ SYSTEM FAILURE:

- Not loading complete sidecar state
- Incorrect resume point determination
- Re-executing completed stories
- Not confirming with user before resuming
- Modifying historical execution data

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN user selects [C] and sidecar is updated with resume info, will you then load the appropriate next step file based on execution state.
