---
name: 'step-02-orchestrate'
description: 'Main orchestration loop - execute all stories autonomously with sub-agents'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-02-orchestrate.md'
nextStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/workflow.yaml'

# State files
sidecarFile: '{output_folder}/epic-execution-state.yaml'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'

# Agent references
storyPrepAgent: '.claude/agents/story-prep-master.md'
qualityGateAgent: '.claude/agents/quality-gate-verifier.md'
codeReviewAgent: '.claude/agents/principal-code-reviewer.md'
specialistAgentsFolder: '.claude/agents/vt-bmad-dev-agents/'
fallbackDevAgent: '_bmad/bmm/agents/dev.md'

# Configuration
coverageThreshold: 80
maxRetries: 3
---

# Step 2: Story Orchestration Loop

## STEP GOAL:

To autonomously execute all pending stories in the epic by orchestrating specialized sub-agents through the complete implementation pipeline: create → develop → quality-gate → review → commit → finalize.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 PAUSE execution only on critical blockers or user-required decisions
- 📖 CRITICAL: Execute stories sequentially, one at a time
- 🔄 CRITICAL: Update sidecar state after EVERY phase completion
- 📋 YOU ARE THE ORCHESTRATOR - spawn agents, parse results, manage flow

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ You spawn sub-agents with fresh context for each task
- ✅ You parse handoff messages to determine next actions
- ✅ You handle failures gracefully with retry or escalation
- ✅ You output brief progress after each story completion

### Step-Specific Rules:

- 🎯 Execute stories in linear order from pending list
- 🚫 FORBIDDEN to skip phases within a story
- 💬 Output brief status after each story completes
- 🚪 ESCALATE to user only when required (blockers, complex failures)

## EXECUTION PROTOCOLS:

- 🎯 Update sidecar before each phase starts
- 💾 Parse agent handoff messages for status
- 📖 Verify sprint-status matches sidecar state
- 🚫 NEVER proceed if quality gate fails without retry/escalate

## CONTEXT BOUNDARIES:

- Sidecar file tracks current story and phase
- Each agent gets fresh context with specific instructions
- Sprint-status.yaml is source of truth for story states
- Handoff messages provide phase completion status

---

## STORY EXECUTION LOOP

For each story in `stories_pending`:

### PHASE A: Create Story

**Update sidecar:**
```yaml
current_story: "N.M"
current_phase: "create"
last_updated: "[timestamp]"
```

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Create story N.M"
  prompt: |
    You are the story-prep-master agent.
    Load and embody: {storyPrepAgent}

    Task: Create story N.M from the epic file.
    Epic file: [epic_path]
    Story location: {implementation_artifacts}/stories/
    Sprint status: {sprintStatus}

    Create a complete, developer-ready story file following BMAD story template.

    When complete, output handoff in this format:
    === AGENT HANDOFF ===
    agent: story-prep-master
    story: N.M
    status: completed | failed
    story_file: [path to created story]
    blockers: none | [list]
    next_action: proceed | escalate
    === END HANDOFF ===
```

**Parse handoff:**
- If status=completed → update sprint-status to `ready-for-dev`, proceed to Phase B
- If status=failed → handle failure (retry or escalate)

---

### PHASE B: Develop Story

**Update sidecar:**
```yaml
current_phase: "dev"
last_updated: "[timestamp]"
```

**Select specialist agent:**
1. Read story file content (title, tasks, dev notes)
2. Scan `{specialistAgentsFolder}` for agents
3. For each agent, read `specialty` field and `Specialty Context`
4. Match story content against agent specializations
5. If match found → use specialist
6. If no match → use fallback `{fallbackDevAgent}`

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Develop story N.M"
  prompt: |
    You are a specialized developer agent.
    Load and embody: [selected agent path]

    Task: Implement story N.M completely.
    Story file: [story_path]
    Sprint status: {sprintStatus}
    Project context: [project_context_path if exists]

    Follow the story's tasks/subtasks exactly.
    Write tests first (red-green-refactor).
    Mark tasks complete as you finish them.

    When complete, output handoff in this format:
    === AGENT HANDOFF ===
    agent: [agent_name]
    story: N.M
    status: completed | failed | blocked
    files_changed:
      - [list of files]
    tests_passed: true | false
    tests_run: [count]
    tests_failed: [count]
    coverage: [percentage]
    blockers: none | [list]
    next_action: proceed | escalate | retry
    error_summary: null | [description]
    === END HANDOFF ===
```

**Parse handoff:**
- If status=completed, tests_passed=true → proceed to Phase C
- If status=failed, blockers contains critical → escalate to user
- If tests_passed=false → retry (up to maxRetries)

---

### PHASE C: Quality Gate

**Update sidecar:**
```yaml
current_phase: "quality"
last_updated: "[timestamp]"
```

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Verify story N.M"
  prompt: |
    You are the quality-gate-verifier agent.
    Load and embody: {qualityGateAgent}

    Task: Independently verify implementation quality for story N.M.
    Story file: [story_path]

    1. Run test suite independently (npm test or equivalent)
    2. Check coverage meets threshold ({coverageThreshold}%)
    3. Verify no skipped/pending tests
    4. Check for TODO/FIXME in changed files
    5. Compare with dev agent's reported results

    When complete, output handoff in this format:
    === QUALITY GATE HANDOFF ===
    agent: quality-gate-verifier
    story: N.M
    verification_status: passed | failed | suspicious
    tests_run: [count]
    tests_passed: [count]
    tests_failed: [count]
    tests_skipped: [count]
    coverage: [percentage]
    dev_handoff_match: true | false
    issues_found:
      - [list or none]
    recommendation: proceed | retry | escalate
    notes: [optional notes]
    === END HANDOFF ===
```

**Parse handoff:**
- If verification_status=passed → proceed to Phase D
- If verification_status=failed, recommendation=retry → go back to Phase B (track retry count)
- If verification_status=suspicious → escalate to user
- If retry count >= maxRetries → escalate to user

---

### PHASE D: Code Review

**Update sidecar:**
```yaml
current_phase: "review"
last_updated: "[timestamp]"
```

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Review story N.M"
  prompt: |
    You are the principal-code-reviewer agent.
    Load and embody: {codeReviewAgent}

    Task: Perform thorough code review for story N.M.
    Story file: [story_path]
    Files changed: [from dev handoff]

    Review for:
    - Code quality and patterns
    - Test coverage and quality
    - Security considerations
    - Performance implications
    - Adherence to project standards

    When complete, output handoff in this format:
    === CODE REVIEW HANDOFF ===
    agent: principal-code-reviewer
    story: N.M
    review_status: approved | changes_requested | rejected
    findings:
      critical: [count]
      major: [count]
      minor: [count]
      suggestions: [count]
    summary: [brief summary]
    next_action: proceed | fix_required | escalate
    === END HANDOFF ===
```

**Parse handoff:**
- If review_status=approved → proceed to Phase E
- If review_status=changes_requested → go back to Phase B (with review feedback)
- If review_status=rejected → escalate to user

---

### PHASE E: Git Commit

**Update sidecar:**
```yaml
current_phase: "commit"
last_updated: "[timestamp]"
```

**Execute git commit:**
```bash
git add .
git commit -m "feat(story-N.M): [story title]

Implemented via implement-epic-with-subagents workflow.
Agent: [dev_agent_name]
Coverage: [coverage]%
Tests: [passed]/[total]

Co-Authored-By: [agent_name] <noreply@anthropic.com>"
```

**Verify commit success** - if fails, log error but continue.

---

### PHASE F: Finalize Story

**Update sidecar:**
```yaml
current_story: null
current_phase: "between_stories"
stories_completed: [..., "N.M"]
stories_pending: [remaining stories]
last_updated: "[timestamp]"
execution_log:
  - story: "N.M"
    agent: "[dev_agent_used]"
    coverage: [X]
    tests: "[passed]/[total]"
    duration: "[time]"
    completed_at: "[timestamp]"
```

**Update sprint-status.yaml:**
- Set story N.M status to `done`

**Output progress to user:**
```
✅ Story N.M: [story title]
   Agent: [agent-name] | Coverage: X% | Tests: P/T | Duration: Xm
```

**Continue to next story** - loop back to Phase A for next pending story.

---

## FAILURE HANDLING

### On Failure (After Retries Exhausted):

1. Determine failure type from handoff
2. Display failure context to user:

```
⚠️ Story N.M Failed

Phase: [phase where failure occurred]
Error: [error summary]
Attempts: [retry count]

Context:
[relevant details from handoff]

Options:
[S] Skip this story and continue
[X] Stop epic execution
```

3. Wait for user decision
4. If Skip:
   - Add story to `stories_skipped` in sidecar
   - Update sprint-status to `skipped`
   - Continue to next story
5. If Stop:
   - Update sidecar with current state
   - Route to step-03-complete (partial completion)

### On Blocker (Human Decision Required):

1. Display blocker context:

```
🛑 Human Decision Required

Story: N.M
Blocker: [blocker description]

This requires your input:
[specific question or decision needed]
```

2. Wait for user response
3. Apply user's decision
4. Continue execution

---

## LOOP COMPLETION

When `stories_pending` is empty:

1. Update sidecar:
```yaml
current_phase: "complete"
completed_at: "[timestamp]"
```

2. Output summary:
```
🎉 Epic Execution Complete!

Stories: [completed]/[total]
Skipped: [count]
Failed: [count]

Proceeding to generate completion report...
```

3. Load, read entire file, then execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All stories processed (completed, skipped, or failed with user decision)
- Sidecar updated after every phase
- Sprint-status reflects actual story states
- Git commits created for completed stories
- Progress reported after each story
- Graceful handling of failures

### ❌ SYSTEM FAILURE:

- Skipping phases within a story
- Not updating sidecar state
- Proceeding after quality gate failure without retry/escalate
- Not parsing handoff messages
- Silent failures without user notification

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
