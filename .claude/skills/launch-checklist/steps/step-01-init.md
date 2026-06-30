---
name: 'step-01-init'
description: 'Detect project structure, validate VT SaaS Template project, identify available MCPs'

# Path Definitions
workflow_path: '{workflow_path}'

# File References
thisStepFile: '{workflow_path}/steps/step-01-init.md'
nextStepFile: '{workflow_path}/steps/step-02-scan.md'
workflowFile: '{workflow_path}/SKILL.md'
checksData: '{workflow_path}/data/checks.csv'
reportTemplate: '{workflow_path}/templates/report-template.md'
---

# Step 1: Project Discovery

## STEP GOAL:

To detect the project structure, validate this is a VT SaaS Template project, identify available environment configuration, and detect any available MCPs that could enrich the audit. This step runs fully autonomously and auto-proceeds to scanning.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🤖 This step runs autonomously — scan and build context without user interaction
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a systems auditor performing an automated production-readiness scan
- ✅ If you already have been given a name, communication_style and persona, continue to use those while playing this new role
- ✅ Maintain systematic, prescriptive tone throughout
- ✅ You do not interact with the user during this step (autonomous scan)

### Step-Specific Rules:

- 🎯 Focus ONLY on project discovery and validation
- 🚫 FORBIDDEN to run any checks in this step — that's step 2
- 🚫 FORBIDDEN to ask the user any questions
- 🤖 This is an AUTONOMOUS step — auto-proceed to step 2 after discovery completes

## EXECUTION PROTOCOLS:

- 🎯 Scan project structure silently
- 💾 Build project context object in memory
- 📖 Auto-proceed to next step after completion
- 🚫 FORBIDDEN to halt for user input

## CONTEXT BOUNDARIES:

- No prior context — this is the first step
- Checks data loaded from {checksData}
- Focus ONLY on project discovery
- Do not run audit checks yet

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Audit Start

Display to the user:
"🔍 **Launch Readiness Audit Starting...**

Scanning your project for production readiness. This runs autonomously — sit back while I check everything."

### 2. Validate Project Structure

Verify this is a VT SaaS Template project by checking for key markers:

- `package.json` exists at project root
- `src/` directory exists
- `src/app/` directory exists (Next.js app router)
- `src/libs/supabase/` directory exists (Supabase auth)
- `CLAUDE.md` exists (template marker)

**If validation fails:** Report to user that this doesn't appear to be a VT SaaS Template project and halt.

### 3. Discover Environment Configuration

Scan for environment files (do NOT expose actual values — only detect presence):

- Check for `.env`, `.env.local`, `.env.production`, `.env.development`
- For each env file found, extract the list of variable NAMES (not values)
- Build a set of all configured env var names across all env files

### 4. Discover Project File Structure

Scan key directories to understand what exists:

- `src/app/[locale]/` — list route groups and pages
- `src/libs/` — list available library modules
- `src/components/` — check if components directory exists
- `src/locales/` — list locale directories
- `src/models/` — check for Schema.ts
- `tests/` — check if test directory exists
- `.github/workflows/` — check for CI config
- `public/` — check for static assets (og-image.png, etc.)

### 5. Detect Available MCPs

Check if enriched scanning is possible:

- **GitHub MCP**: Attempt to detect if GitHub CLI or MCP tools are available (check if `gh` commands work or GitHub MCP tools are accessible). If yes, flag `github_mcp: true`.
- **Vercel MCP**: Check if Vercel CLI or MCP tools are available. If yes, flag `vercel_mcp: true`.
- If neither is available, that's fine — all checks have local file fallbacks.

### 6. Load Checks Data

Read and parse `{checksData}` to load all check definitions. Organize them by domain for step 2.

### 7. Build Project Context

Compile all discovery results into a project context:

```
project_context:
  project_root: {detected root}
  is_valid_template: true/false
  env_files_found: [list]
  env_vars_configured: [set of var names]
  directories_found: {map of dir -> exists}
  files_found: {map of key files -> exists}
  mcps_available:
    github: true/false
    vercel: true/false
  checks: [loaded from CSV]
  locale_dirs: [list of locale directories]
```

### 8. Auto-Proceed to Scanning

Display: "**Proceeding to domain scanning...**"

## CRITICAL STEP COMPLETION NOTE

After project discovery completes and context is built, auto-proceed to scanning.
Load and read fully `{workflow_path}/steps/step-02-scan.md` to begin domain scanning.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Project validated as VT SaaS Template
- Environment configuration discovered
- File structure mapped
- MCP availability detected
- Checks data loaded
- Auto-proceeded to step 2

### ❌ SYSTEM FAILURE:

- Asking the user any questions
- Running audit checks in this step
- Not validating project structure
- Not loading checks data
- Halting for user input (except on validation failure)

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
