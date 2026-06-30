---
name: 'step-03-report'
description: 'Generate the launch readiness scorecard report and offer to help address findings'

# Path Definitions
workflow_path: '{workflow_path}'

# File References
thisStepFile: '{workflow_path}/steps/step-03-report.md'
workflowFile: '{workflow_path}/SKILL.md'
reportTemplate: '{workflow_path}/templates/report-template.md'
outputFile: '{output_folder}/launch-readiness-report.md'
---

# Step 3: Report Generation & Next Steps

## STEP GOAL:

To compile all scan results into a comprehensive launch readiness scorecard, write it to an output file, present a summary to the user, and offer to help address any findings. This is the final step.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📊 Report is generated from scan results; interactive help menu follows
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: This is the final step — no next step to load
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a systems auditor presenting findings and offering actionable help
- ✅ If you already have been given a name, communication_style and persona, continue to use those while playing this new role
- ✅ You bring systematic reporting expertise, while the user brings knowledge of their project's priorities
- ✅ Prioritize findings by impact — alpha blockers first, then full launch, then polish
- ✅ At the end, you become collaborative — offering to help fix issues together

### Step-Specific Rules:

- 🎯 Focus on generating a clear, actionable report
- 🚫 FORBIDDEN to re-run any checks — use results from step 2
- ✅ Next steps must be specific and actionable, not generic advice
- ✅ The offer to help at the end is genuine — be ready to act on it

## EXECUTION PROTOCOLS:

- 🎯 Compile results into scorecard format
- 💾 Write report to {outputFile}
- 📖 Present summary in conversation
- ✅ Offer to help address findings

## CONTEXT BOUNDARIES:

- Check results from step 2 are available in memory
- Project context from step 1 is available in memory
- Report template from {reportTemplate} guides format
- This is the FINAL step — workflow completes here

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Calculate Domain Summaries

For each audit domain, calculate:
- Total checks in domain
- Number passed
- Number failed
- Number warned

### 2. Determine Launch Readiness Verdicts

**Alpha Launch:**
- Collect all checks where tier = "alpha"
- Count passed vs total
- Verdict = **READY** if ALL alpha checks pass (no FAIL)
- List any alpha blockers (FAIL status checks)

**Full Launch:**
- Collect all checks where tier = "alpha" OR tier = "full"
- Count passed vs total
- Verdict = **READY** if ALL alpha AND full checks pass (no FAIL)
- List any full-launch blockers (FAIL status checks)

**Polish Status:**
- Collect all checks where tier = "polish"
- Count passed vs total
- List opportunities (FAIL or WARN status checks)

### 3. Generate Prioritized Next Steps

Create specific, actionable next steps ordered by priority:

**Priority 1 — Alpha Blockers** (if any):
For each failing alpha check, generate a specific action item:
- What exactly needs to be done
- Where to do it (file path or config location)
- Example of what it should look like

**Priority 2 — Full Launch Blockers** (if any):
For each failing full-launch check, generate a specific action item with the same detail.

**Priority 3 — Polish Opportunities** (if any):
For each failing or warned polish check, generate a brief action item.

### 4. Compile the Report

Using the structure from {reportTemplate}, generate the complete markdown report:

1. **Header**: Project name, scan timestamp, template version
2. **Scorecard Summary**: Domain-level overview table
3. **Detailed Results**: Per-domain check tables with status, tier, and details
4. **Launch Readiness**: Alpha verdict, Full Launch verdict, Polish status
5. **Next Steps**: Prioritized, specific action items
6. **Offer**: Closing message offering to help

### 5. Write Report to File

Write the compiled report to `{outputFile}`.

Display: "📄 Report saved to `{outputFile}`"

### 6. Present Summary to User

Display a concise summary in the conversation:

```
🚀 **Launch Readiness Audit Complete**

**Scorecard:** {{total_passed}}/{{total_checks}} checks passing ({{total_failed}} failed, {{total_warned}} warnings)

**Alpha Launch: {{alpha_verdict}}**
{{#if alpha_blockers}}⚠️ {{alpha_blocker_count}} blocker(s) remaining{{/if}}

**Full Launch: {{full_verdict}}**
{{#if full_blockers}}⚠️ {{full_blocker_count}} blocker(s) remaining{{/if}}

**Polish:** {{polish_passed}}/{{polish_total}} checks passing

📄 Full report: {outputFile}
```

### 7. Present MENU OPTIONS

Display:

"**Would you like help addressing any of these items?**

I can:
- **[A] Fix automatically** — For items like missing env vars, config files, or template customization, I can make the changes directly.
- **[G] Guide you through** — For items needing your input (legal pages, branding, domain setup), I can walk you through each one.
- **[T] Tackle a specific area** — Pick a domain (e.g., 'fix all SEO issues') and I'll handle it.
- **[D] Done** — Wrap up the audit.

Just tell me what you'd like to tackle first."

#### Menu Handling Logic:

- **[A] Fix automatically**: Address all auto-fixable items (missing env vars, config files, template customization). After each fix, report what was done. Return to menu after completion.
- **[G] Guide you through**: Walk the user through items needing their input (legal pages, branding, domain setup). One item at a time. Return to menu after completion.
- **[T] Tackle a specific area**: Ask user which domain to focus on, then handle all issues in that domain. Return to menu after completion.
- **[D] Done**: Display "Great! Your launch readiness report is saved at `{outputFile}`. Good luck with your launch! 🚀"

#### EXECUTION RULES:

- **Wait for user response.** This is the ONLY interactive moment in the entire workflow.
- If user wants help (A, G, or T): Address the specific items, use project context and check details for precise fixes, report what was done after each fix.
- If user says done (D): Display closing message and end workflow.
- After completing a help action, re-present the menu unless user says done.

---

## CRITICAL STEP COMPLETION NOTE

This is the **final step** of the workflow. The workflow completes when:
- The report has been written to `{outputFile}`
- The summary has been presented to the user
- The user has been offered help and either completed fixes or said "done"

There is no next step to load.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Report compiled with all check results
- Verdicts calculated correctly (alpha and full launch)
- Next steps are specific and actionable (not generic)
- Report written to output file
- Summary presented clearly
- Offer to help is genuine and specific

### ❌ SYSTEM FAILURE:

- Re-running checks instead of using step 2 results
- Generic next steps like "improve your SEO" (must be specific)
- Not writing report to file
- Not offering to help
- Calculating verdicts incorrectly (e.g., ignoring alpha checks in full launch verdict)

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
