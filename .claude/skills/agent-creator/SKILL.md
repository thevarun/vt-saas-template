---
name: vt-bmad-dev-agents-creator
description: Creates custom Claude Code sub-agents for project tasks. Use when the user wants to create specialized agents, design agent workflows, or needs help breaking down complex tasks into agent-based solutions. All created agents are stored in .claude/agents/vt-bmad-dev-agents/.
tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Task, LSP
---

# Agent Creator Skill

Create custom Claude Code sub-agents tailored to your project's needs. All agents are stored in `.claude/agents/vt-bmad-dev-agents/`.

## Story-Based Agents (Default Behavior)

**All created agents are story-focused by default.** This means:
1. Every agent accepts a **story identifier** as input (story number or name)
2. Every agent **must invoke `/dev-story`** as their first action when launched
3. The story context drives all agent work

### Why Story-Based?
- Ensures traceability from story → implementation
- Provides clear scope boundaries for the agent
- Maintains sprint tracking via `sprint-status.yaml`
- Aligns with BMAD Method workflows

## Workflow Overview

This skill follows a 5-step interactive process:

0. **Memory Check** - Check registry for reusable patterns (may skip to step 4)
1. **Context Assessment** - Analyze project and task requirements
2. **Agent Design** - Determine needed agents and their specialties
3. **Community Research** - Reference GitHub repos for patterns and inspiration
4. **Agent Creation** - Generate and validate agent specification files
5. **Deployment & Registry** - Save files, verify, and optionally save to registry

---

## Step 0: Quick Start (Always First)

**Check for existing patterns before designing from scratch.**

### Check Registry & Templates
```bash
cat .claude/skills/agent-creator/REGISTRY.yaml 2>/dev/null
ls .claude/skills/agent-creator/templates/ 2>/dev/null
```

### If Match Found
- Ask: "I found a pattern for [X]. Reuse it or create fresh?"
- If reuse: Skip to Step 4 with the template
- If fresh: Continue to Step 1

### If No Match
- For simple requests ("quick agent for..."): Skip to Step 4
- For complex needs: Continue to Step 1

### Consider Built-in Agents First
Before creating custom agents, check if built-ins suffice:
- **Explore** - Codebase research
- **general-purpose** - Multi-step tasks
- **Plan** - Implementation planning

Only create custom agents when you need project-specific knowledge or custom workflows.

---

## Step 1: Context Assessment

Before creating agents, gather comprehensive context:

### Project Analysis
```bash
# Understand project structure (use ls if tree not available)
ls -la . && ls -la src/ 2>/dev/null

# Check existing agents
ls -la .claude/agents/vt-bmad-dev-agents/ 2>/dev/null || echo "No agents directory yet"

# Check existing templates in registry
ls -la .claude/skills/agent-creator/templates/ 2>/dev/null || echo "No templates yet"
```

Also read these files for context:
- `CLAUDE.md` - Project instructions
- `README.md` - Project overview
- `package.json` - Dependencies and scripts (if exists)

### Task Analysis Questions
Ask the user:
- What is the main task or goal you want to accomplish?
- Are there specific technologies or frameworks involved?
- What is the expected complexity (simple fix, feature, refactor, new project)?
- Do you have preferences for how work should be divided?

### CHECKPOINT 1
Present findings to user:
- Project type and tech stack identified
- Task scope and complexity assessed
- Proposed number of agents needed

**Wait for user approval before proceeding.**

## Step 2: Agent Design

Based on context, design the agent architecture:

### Common Agent Patterns (All Story-Based)

All agents below accept a story identifier and invoke `/dev-story`. The specialty provides context.

| Agent Type | Specialty Focus | Key Tools |
|------------|-----------------|-----------|
| `frontend` | UI/React component stories | Read, Glob, Grep, Bash, Edit, Write |
| `backend` | API/server-side stories | Read, Glob, Grep, Bash, Edit, Write |
| `fullstack` | End-to-end feature stories | Read, Glob, Grep, Bash, Edit, Write |
| `tester` | Test-focused stories | Read, Glob, Grep, Bash, Edit, Write |
| `database` | Schema/migration stories | Read, Glob, Grep, Bash, Edit, Write |
| `api-integrator` | External API integration stories | Read, Glob, Grep, Bash, Edit, Write, WebFetch |

### Non-Story Agent Patterns (Rare - Only When Explicitly Requested)

| Agent Type | Use Case | Key Tools |
|------------|----------|-----------|
| `explorer` | Codebase research, file discovery | Read, Glob, Grep |
| `documenter` | Documentation-only updates | Read, Write |

### Design Considerations
- **Story-first**: Default to story-based agents that invoke `/dev-story`
- **Single responsibility**: Each agent has one specialty focus
- **Minimal wrapper**: Agents delegate to `/dev-story` for all implementation
- **Model selection**: Use `sonnet` for story agents (complex reasoning needed)

### CHECKPOINT 2
Present agent design to user:
- List of proposed agents with names and descriptions
- Each agent's specialty and tool access
- How agents will collaborate (if applicable)

**Wait for user approval before proceeding.**

## Step 3: Community Research

**IMPORTANT: Reference the detailed guide at `.claude/skills/agent-creator/COMMUNITY-REPOS.md`**

### Research Limits (Mandatory)

| Activity | Maximum |
|----------|---------|
| GitHub repo searches | 3 queries |
| Repos to evaluate in detail | 5 repos |
| Web searches | 2 queries |
| Total research time | 10 minutes |

### Curated Repos (Check First)

| Repository | URL |
|------------|-----|
| claude-code-templates | https://github.com/davila7/claude-code-templates |
| wshobson/agents | https://github.com/wshobson/agents |
| claude-flow | https://github.com/ruvnet/claude-flow |
| awesome-claude-code | https://github.com/hesreallyhim/awesome-claude-code |
| SuperClaude Framework | https://github.com/SuperClaude-Org/SuperClaude_Framework |
| compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin |
| claude-code-workflows | https://github.com/OneRedOak/claude-code-workflows |

### Evaluation Criteria

Before using patterns from a repo, verify:
1. **Recent Activity**: Last commit < 30 days (ideal) or < 90 days (acceptable)
2. **Stars**: 50+ preferred, 10+ minimum
3. **Relevance**: Directly applicable to the task

```bash
# Quick repo check (if gh CLI available)
gh repo view {owner}/{repo} --json stargazerCount,pushedAt

# Fallback if gh CLI not available - use WebFetch
# WebFetch("https://api.github.com/repos/{owner}/{repo}")
```

### CHECKPOINT 3
Share research findings:
- Which repos were checked (max 5)
- Relevant patterns found
- Adaptations proposed for this project

**Wait for user approval before proceeding.**

## Step 4: Agent Creation

Create agent files following Claude Code's native format.

### Templates

**Use the template files for full specifications:**
- **Story-Based (Default)**: `.claude/skills/agent-creator/STORY-AGENT-TEMPLATE.md`
- **Non-Story (Rare)**: `.claude/skills/agent-creator/NON-STORY-AGENT-TEMPLATE.md`

Read the appropriate template file before creating agents.

### File Naming Convention
- Location: `.claude/agents/vt-bmad-dev-agents/{name}.md`
- Naming: lowercase, hyphens only
- Examples: `frontend.md`, `api-integrator.md`

### Pre-Save Validation
Before presenting to user, validate each agent:

1. **Name format**: Must be `{lowercase-alphanumeric-hyphens}`
   - Valid: `frontend`, `api-client`, `db-migrator`
   - Invalid: `my_agent`, `MyAgent`, `FRONTEND`

2. **Tools list**: Only valid Claude Code tools
   - Valid: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Task, LSP
   - Invalid: AskUserQuestion, CustomTool

3. **Model**: Must be one of: `sonnet`, `haiku`, `opus`, `inherit`

4. **Description**: Should be 20-300 characters, specific enough to trigger correctly
   - **Story agents MUST include**: "Requires story number or name"

5. **No duplicates**: Check `.claude/agents/vt-bmad-dev-agents/` for existing agent with same name

6. **Story-based validation** (for story agents):
   - Description mentions story input requirement
   - Content includes "Required Input" section for story identifier
   - Content includes `/dev-story` invocation instruction
   - Content does NOT include direct implementation steps (only /dev-story delegation)

### CHECKPOINT 4
For each agent, show:
- Complete agent file content
- File path where it will be saved
- Validation status (all checks passed)

**Wait for user approval of each agent before saving.**

## Step 5: Validation & Deployment

### Save Agent Files
```bash
# Ensure agents directory exists
mkdir -p .claude/agents/vt-bmad-dev-agents

# Write each approved agent file
# (Done via Write tool after user approval)
```

### Verify Installation
```bash
# List created agents
ls -la .claude/agents/vt-bmad-dev-agents/

# Show agent count
echo "Created $(ls .claude/agents/vt-bmad-dev-agents/*.md 2>/dev/null | wc -l) agents"
```

### Usage Instructions
After creation, agents work in two ways:
- **Automatic**: When your task matches the agent's description, Claude may use it automatically
- **Explicit**: Reference the agent by name in your prompt, e.g., "Use the tester agent to..."

### Cleanup Instructions
When agents are no longer needed:
```bash
# Remove all agents in the directory
rm -rf .claude/agents/vt-bmad-dev-agents/

# Or remove specific agent
rm .claude/agents/vt-bmad-dev-agents/{name}.md
```

### CHECKPOINT 5 (Final)
Present summary:
- All agents created successfully
- How to use them
- How to clean them up later

**Ask user**: "Would you like to save this pattern to the registry for future reuse?"

### If User Wants to Save Pattern
Update `.claude/skills/agent-creator/REGISTRY.yaml`:

1. Add entry to `successful_agents`:
```yaml
- name: {agent-name-without-tmp}
  purpose: What task/specialization it handles
  tools: [list of tools]
  model: model used
  created: YYYY-MM-DD
  project_context: What project/task it was created for
```

2. Optionally save template file:
```bash
mkdir -p .claude/skills/agent-creator/templates
cp .claude/agents/vt-bmad-dev-agents/{name}.md .claude/skills/agent-creator/templates/{name}.md
```

3. Update `stats.total_agents_created`

### If Agent Doesn't Work (Later Feedback)
If user reports issues later, record in `failed_patterns`:
```yaml
- name: agent-name
  reason: Why it failed
  lesson: What to do differently
```

**Confirm completion with user.**

## Quick Reference

### Templates

See the dedicated template files for full examples and minimal templates:
- **Story-Based**: `STORY-AGENT-TEMPLATE.md`
- **Non-Story**: `NON-STORY-AGENT-TEMPLATE.md`

### Available Tools Reference
| Tool | Purpose |
|------|---------|
| `Read` | Read file contents |
| `Write` | Create new files |
| `Edit` | Modify existing files |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `Bash` | Run shell commands |
| `WebFetch` | Fetch web content |
| `WebSearch` | Search the web |
| `Task` | Delegate to subagents |
| `LSP` | Code intelligence |

### Model Selection Guide
| Model | Best For | Cost |
|-------|----------|------|
| `haiku` | Simple, fast tasks | Lowest |
| `sonnet` | Balanced reasoning | Medium |
| `opus` | Complex reasoning | Highest |
| `inherit` | Match parent model | Varies |
