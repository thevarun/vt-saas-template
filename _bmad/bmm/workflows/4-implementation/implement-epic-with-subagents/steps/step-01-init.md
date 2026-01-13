---
name: 'step-01-init'
description: 'Initialize epic execution by loading epic, validating prerequisites, and setting up execution state'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-01-init.md'
nextStepFile: '{workflow_path}/steps/step-02-orchestrate.md'
continueFile: '{workflow_path}/steps/step-01b-continue.md'
workflowFile: '{workflow_path}/workflow.md'

# Template References
# (none required for init step)

# Task References
# (none required for init step)

# State files
sidecarFile: '{output_folder}/epic-execution-state.yaml'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'

# Agent references
storyPrepAgent: '.claude/agents/story-prep-master.md'
qualityGateAgent: '.claude/agents/quality-gate-verifier.md'
codeReviewAgent: '.claude/agents/principal-code-reviewer.md'
specialistAgentsFolder: '.claude/agents/vt-bmad-dev-agents/'
fallbackDevAgent: '_bmad/bmm/agents/dev.md'

# Git workflow
gitBranchPrefix: 'feature/epic-'
baseBranch: 'main'

# Agent creation
agentCreatorSkill: '.claude/skills/agent-creator/SKILL.md'
---

# Step 1: Epic Execution Initialization

## STEP GOAL:

To initialize the epic execution workflow by loading the epic file, validating all prerequisites (agents, MCP tools), parsing stories, and setting up the execution state for autonomous processing.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Orchestrator-Specific Rules:

- 🛑 NEVER proceed without user confirmation on epic file
- 🔄 CRITICAL: Validate ALL prerequisites before starting execution
- 📋 YOU ARE AN ORCHESTRATOR, coordinating sub-agents

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ You coordinate multiple specialized agents to implement stories
- ✅ You maintain execution state and handle failures gracefully
- ✅ You communicate progress clearly and concisely

### Step-Specific Rules:

- 🎯 Focus ONLY on initialization and validation
- 🚫 FORBIDDEN to start story execution in this step
- 💬 Validate prerequisites thoroughly
- 🚪 DETECT existing sidecar state and route to continuation

## EXECUTION PROTOCOLS:

- 🎯 Show validation results before proceeding
- 💾 Create sidecar state file for execution tracking
- 📖 Parse all stories from epic before execution
- 🚫 FORBIDDEN to proceed if prerequisites fail

## CONTEXT BOUNDARIES:

- Variables from workflow.yaml are available
- Epic file path from user or auto-discovery
- Sprint-status.yaml provides story states
- Sidecar file tracks execution progress

## INITIALIZATION SEQUENCE:

### 1. Check for Existing Execution State

First, check if a sidecar state file exists:

- Look for file at `{sidecarFile}`
- If exists and has pending stories → route to step-01b-continue.md
- If exists and all stories complete → ask about new epic
- If not exists → proceed with fresh initialization

**If sidecar exists with pending work:**
- STOP here and load `{continueFile}` immediately
- Let step-01b handle the continuation logic

### 1.5 Git Sync Check

Before proceeding, verify git working directory status:

**Execute checks:**
1. `git status --porcelain` - Check for uncommitted changes
2. `git fetch origin {baseBranch}` - Fetch latest from remote
3. `git rev-list HEAD...origin/{baseBranch} --count` - Check commits behind/ahead

**Display results:**
- ✅ Clean working directory, synced with remote → proceed automatically
- ⚠️ Uncommitted changes found → list files, ask: "[C] Continue anyway | [S] Stop to commit first"
- ⚠️ Behind remote by N commits → warn, ask: "[P] Pull first | [C] Continue anyway"
- ⚠️ Ahead of remote → info only, proceed

**If user chooses to stop:** Exit workflow, preserve no state.

### 2. Load Sprint Status

Read sprint-status.yaml at `{sprintStatus}`:

1. Parse all epic entries
2. Identify epics with status `backlog` or `in-progress`
3. For each epic, count stories in backlog/ready-for-dev

**Display:**
```
Welcome to the Epic Execution Orchestrator!

Sprint Status Summary:
  Epic 2: Complete Authentication (8 stories) - backlog
  Epic 3: User Onboarding (7 stories) - backlog
  ...
```

### 3. Select Epic to Execute

**If user provided specific epic in initial message:**
- Use that epic, confirm selection

**If multiple epics available:**
- Display list with story counts
- Ask: "Which epic would you like to execute?"
- Options: [1] Epic 2 | [2] Epic 3 | ... | [A] All (sequential)

**Locate epic file:**
- Search `{implementation_artifacts}` for epic-N-*.md matching selection
- Parse and validate epic file

### 3.5 Create Feature Branch

Create dedicated branch for this epic's work:

1. Generate branch name: `{gitBranchPrefix}{epic_number}-{sanitized_epic_name}`
   - Sanitize: lowercase, replace spaces with hyphens, remove special chars
   - Example: `feature/epic-2-auth-experience`

2. Execute: `git checkout -b {branch_name}`

3. Store in sidecar:
```yaml
git_workflow:
  branch_name: "feature/epic-2-auth-experience"
  base_branch: "main"
  created_at: "[timestamp]"
```

**If branch creation fails:** Display error, ask user to resolve, retry.

### 4. Load and Parse Epic

Once epic path is confirmed:

1. Read the complete epic file
2. Parse all stories using pattern: `### Story N.M:`
3. Extract for each story:
   - Story number (N.M)
   - Story title
   - Acceptance criteria summary
4. Build story execution list

**Display parsed stories:**
```
Found X stories in epic:
  - Story N.1: [title]
  - Story N.2: [title]
  ...
```

### 5. Validate Prerequisites

Check all required components exist:

**Agents:**
- [ ] story-prep-master agent at `{storyPrepAgent}`
- [ ] quality-gate-verifier agent at `{qualityGateAgent}`
- [ ] principal-code-reviewer agent at `{codeReviewAgent}`
- [ ] Fallback dev agent at `{fallbackDevAgent}`

**Specialist Agents (Optional):**
- [ ] Check `{specialistAgentsFolder}` for available specialists
- List found specialists with their specialties

**MCP Tools:**
- [ ] Context-7 MCP available (check via tool availability)

**Files:**
- [ ] Sprint-status.yaml exists at `{sprintStatus}`
- [ ] Project-context.md exists (optional, search `**/project-context.md`)

**Display validation results:**
```
Prerequisites Check:
  ✅ story-prep-master agent
  ✅ quality-gate-verifier agent
  ✅ principal-code-reviewer agent
  ✅ Fallback dev agent (Amelia)
  ✅ Specialist agents folder (X specialists found)
  ✅ Context-7 MCP
  ✅ Sprint-status.yaml
  ⚪ Project-context.md (optional, not found)
```

If any required prerequisite fails → display error and stop.

### 5.5 Create Specialist Agents

Analyze epic and create specialized dev agents for the stories:

**1. Analyze Epic Stories:**
- Read each story title and description from epic file
- Identify technical domains: frontend, backend, API, database, auth, etc.
- Group stories by primary domain

**2. Invoke Agent Creator:**
Load and follow `{agentCreatorSkill}` steps 1-4:
- Skip Step 0 (registry check) - always create fresh for this epic
- Step 1: Context already gathered from epic analysis
- Step 2: Design agents based on story domains
- Step 3: Skip community research (use built-in patterns)
- Step 4: Create agent files

**3. Register Created Agents:**
Add to sidecar:
```yaml
specialist_agents_created:
  - name: "auth-specialist"
    path: ".claude/agents/vt-bmad-dev-agents/auth-specialist.md"
    stories: ["2.1", "2.3", "2.6"]
  - name: "frontend-forms"
    path: ".claude/agents/vt-bmad-dev-agents/frontend-forms.md"
    stories: ["2.2", "2.4", "2.5"]
```

**4. Display Summary:**
```
Created X specialist agents for this epic:
  - auth-specialist (3 stories)
  - frontend-forms (3 stories)
  - general-dev (2 stories - fallback)
```

### 6. Create Sidecar State File

Initialize the execution state file:

```yaml
epic_execution_state:
  epic_file: "[epic path]"
  epic_name: "[parsed epic name]"
  total_stories: X
  current_story: null
  current_phase: "initialized"
  stories_completed: []
  stories_pending: ["N.1", "N.2", ...]
  stories_skipped: []
  stories_failed: []
  execution_log: []
  started_at: "[timestamp]"
  last_updated: "[timestamp]"

git_workflow:
  branch_name: "[feature/epic-N-name]"
  base_branch: "main"
  created_at: "[timestamp]"

specialist_agents_created:
  - name: "[agent-name]"
    path: "[path to agent file]"
    stories: ["N.1", "N.2"]

specialist_agents_available:
  - name: "[agent-name]"
    specialty: "[specialty]"

configuration:
  coverage_threshold: 80
  max_retries: 3
  auto_commit: true
```

### 7. Present Execution Plan

Display the execution plan summary:

"**Epic Execution Plan**

**Epic:** [epic name]
**Stories:** X total
**Agents:** 4 orchestrated agents per story
**Estimated Flow:**

For each story:
1. Create story file (story-prep-master)
2. Implement (specialist or dev agent)
3. Verify quality (quality-gate-verifier)
4. Review code (principal-code-reviewer)
5. Git commit
6. Update status

**Ready to begin autonomous execution?**"

### 8. Present MENU OPTIONS

Display: **Select an Option:** [C] Start Epic Execution

#### EXECUTION RULES:

- ALWAYS halt and wait for user confirmation
- User must explicitly approve execution start
- Display brief reminder about escalation behavior

#### Menu Handling Logic:

- IF C: Update sidecar with `current_phase: "executing"`, then load, read entire file, then execute `{nextStepFile}`
- IF Any questions: Respond and redisplay menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Epic file loaded and parsed successfully
- All required prerequisites validated
- Sidecar state file created
- Story list extracted and ready
- User confirmed execution start
- Routed to step-02 OR step-01b as appropriate

### ❌ SYSTEM FAILURE:

- Proceeding without epic file validation
- Not checking for existing sidecar state
- Skipping prerequisite validation
- Starting execution without user confirmation
- Not creating sidecar state file

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN [C] is selected and sidecar state is initialized, will you then load, read entire file, then execute `{nextStepFile}` to begin story orchestration.
