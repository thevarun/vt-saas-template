---
name: 'step-03-complete'
description: 'Generate epic completion report and finalize execution'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/workflow.yaml'
reportTemplate: '{workflow_path}/templates/epic-completion-report.md'

# State files
sidecarFile: '{output_folder}/epic-execution-state.yaml'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'

# Output
reportOutputFolder: '{output_folder}/epic-reports'
---

# Step 3: Epic Completion

## STEP GOAL:

To generate the Epic Completion Report, update final status, and gracefully conclude the epic execution workflow.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER modify completed story results
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: Generate report from actual execution data
- 📋 YOU ARE FINALIZING the epic execution

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator completing the workflow
- ✅ You summarize execution results accurately
- ✅ You generate comprehensive but concise reports
- ✅ You provide actionable next steps

### Step-Specific Rules:

- 🎯 Focus ONLY on reporting and finalization
- 🚫 FORBIDDEN to execute additional stories
- 💬 Present clear summary to user
- 🚪 Archive or preserve sidecar as appropriate

## EXECUTION PROTOCOLS:

- 🎯 Gather all data from sidecar file
- 💾 Generate report using template
- 📖 Update sprint-status with epic completion
- 🚫 FORBIDDEN to modify historical execution data

## CONTEXT BOUNDARIES:

- Sidecar file contains complete execution history
- All story outcomes recorded in execution_log
- Sprint-status reflects final story states
- Report is the primary output of this step

---

## COMPLETION SEQUENCE:

### 1. Load Execution Data

Read the complete sidecar file at `{sidecarFile}`:

Gather:
- `epic_file`, `epic_name`
- `total_stories`
- `stories_completed` - count and list
- `stories_skipped` - count and list
- `stories_failed` - count and list
- `execution_log` - per-story details
- `started_at`, `completed_at`
- `specialist_agents_available` - agents used

Calculate:
- Total duration
- Average coverage across stories
- Total tests run/passed/failed
- Total git commits

### 2. Determine Completion Status

Based on execution results:

**Status: Completed**
- All stories finished (none skipped or failed)

**Status: Partial**
- Some stories completed, some skipped or failed

**Status: Failed**
- Critical failure caused early termination

### 3. Generate Completion Report

Create report file at `{reportOutputFolder}/epic-completion-{epic_name}-{date}.md`

Use template structure:

```markdown
# Epic Completion Report: {epic_name}

## Execution Summary

| Field | Value |
|-------|-------|
| **Epic File** | {epic_file} |
| **Started** | {started_at} |
| **Completed** | {completed_at} |
| **Duration** | {total_duration} |
| **Status** | {completion_status} |

## Stories Execution

| Story | Title | Status | Agent | Coverage | Tests | Duration |
|-------|-------|--------|-------|----------|-------|----------|
[For each story in execution_log]
| {story} | {title} | {status} | {agent} | {coverage}% | {passed}/{total} | {duration} |

### Stories Completed: {completed_count}/{total_count}

## Quality Metrics

- **Average Coverage:** {avg_coverage}%
- **Total Tests Run:** {total_tests}
- **Tests Passed:** {passed_tests}
- **Tests Failed:** {failed_tests}
- **Git Commits Created:** {commit_count}

## Agent Selection Summary

| Agent | Stories Handled | Selection Reason |
|-------|-----------------|------------------|
[For each unique agent used]
| {agent_name} | [{story_list}] | {selection_reason} |

## Issues & Escalations

### Retries
[For each story that required retries]
- {story}: {retry_reason} - {outcome}

### Escalations
[For each story that required user decision]
- {story}: {escalation_reason} - {resolution}

### Blockers Encountered
[List any blockers that occurred]
- {blocker_description}

## Session Information

- **Orchestrator Sessions:** {session_count}
- **Resume Points:** {resume_count}
- **Sidecar File:** {sidecar_path}
```

### 4. Update Sprint Status

Update `{sprintStatus}` to reflect epic completion:

```yaml
epic-N: done  # or partial
epic-N-retrospective: optional
```

### 5. Handle Sidecar File

Present option to user:

"Epic execution complete! The execution state file contains detailed logs.

Options:
- [A] Archive sidecar (move to `{output_folder}/archive/`)
- [K] Keep sidecar in place
- [D] Delete sidecar (execution data preserved in report)"

### 6. Present Final Summary

Display to user:

```
═══════════════════════════════════════════════════════════════
                    EPIC EXECUTION COMPLETE
═══════════════════════════════════════════════════════════════

📊 Results Summary

Epic: {epic_name}
Status: {completion_status}
Duration: {total_duration}

Stories:
  ✅ Completed: {completed_count}
  ⏸️ Skipped: {skipped_count}
  ❌ Failed: {failed_count}

Quality:
  📈 Average Coverage: {avg_coverage}%
  🧪 Tests: {passed_tests}/{total_tests} passed
  📝 Git Commits: {commit_count}

Report saved to:
  {report_path}

═══════════════════════════════════════════════════════════════

Next Steps:
- Review the completion report for details
- Run retrospective workflow if needed
- Address any skipped/failed stories manually

Thank you for using the Epic Execution Orchestrator!
```

### 7. Workflow Complete

The workflow ends here. No further steps to load.

If user has questions, respond helpfully and remind them the report contains full details.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Completion report generated accurately
- All execution data preserved in report
- Sprint-status updated with epic completion
- Sidecar handled per user preference
- Clear summary presented to user
- Workflow concluded gracefully

### ❌ SYSTEM FAILURE:

- Inaccurate report data
- Not updating sprint-status
- Losing execution history
- Attempting to execute more stories
- Not presenting clear summary

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
