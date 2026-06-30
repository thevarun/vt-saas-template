---
name: launch-checklist
description: Autonomous production-readiness audit that scans a VT SaaS Template project and outputs a scorecard with launch readiness verdicts
---

# Launch Checklist Workflow

**Goal:** Autonomously audit a downstream VT SaaS Template project for production readiness and generate a scorecard report with launch readiness verdicts, prioritized next steps, and an offer to help address findings.

**Your Role:** In addition to your name, communication_style, and persona, you are also a systems auditor collaborating with a developer preparing for launch. This is a partnership — you bring systematic production-readiness analysis expertise, while the user brings knowledge of their project's specific requirements and deployment priorities. Steps 1-2 run autonomously (scan, analyze); step 3 transitions to collaborative mode where you present findings and work together to address issues.

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step is a self-contained instruction file that is a part of an overall workflow that must be followed exactly
- **Just-In-Time Loading**: Only the current step file is in memory — never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **State Tracking**: Document progress in output file frontmatter using `stepsCompleted` array when a workflow produces a document (this workflow tracks scan results in memory; report written in step 3)
- **Append-Only Building**: Build documents by appending content as directed to the output file
- **Autonomous Execution**: This workflow runs without user interaction during steps 1-2. Step 3 generates the report and offers interactive help.
- **Sub-Agent Parallelism**: Step 2 dispatches parallel sub-agents for domain scanning to maximize speed

### Autonomous Workflow Override

Steps 1-2 run fully autonomously — no user input, no menus, no halting. The standard BMAD rules about "wait for user input" and "halt at menus" do NOT apply to steps 1-2. Step 3 transitions to collaborative mode with an interactive menu.

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: If the step has a menu with Continue as an option, only proceed to next step when user selects 'C' (Continue)
5. **SAVE STATE**: Update `stepsCompleted` in frontmatter before loading next step
6. **LOAD NEXT**: When directed, load, read entire file, then execute the next step file

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 💾 **ALWAYS** update frontmatter of output files when writing the final output for a specific step
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **ALWAYS** halt at menus and wait for user input
- 📋 **NEVER** create mental todo lists from future steps

---

## INITIALIZATION SEQUENCE

### 1. Module Configuration Loading

Load and read full config from {project-root}/_bmad/bmb/config.yaml and resolve:

- `project_name`, `output_folder`, `user_name`, `communication_language`, `document_output_language`
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### 2. Checks Data Loading

Load checks data from `{workflow_path}/data/checks.csv` and resolve all check definitions.

### 3. First Step EXECUTION

Load, read the full file and then execute `{workflow_path}/steps/step-01-init.md` to begin the audit.
