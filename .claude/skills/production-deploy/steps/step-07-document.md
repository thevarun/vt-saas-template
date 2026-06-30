---
name: step-07-document
description: Capture the deployment into durable docs so the next deploy doesn't start from scratch — writes/updates docs/deployment-guide.md, adds a deployment section to CLAUDE.md, updates project memory with decisions + incidents, exports the checklist state for archive.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-07-document.md
nextStepFile: .claude/skills/production-deploy/steps/step-08-backport.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
guideFile: docs/deployment-guide.md
claudeMdFile: CLAUDE.md
---

# Phase 7 — Document

## STEP GOAL

Convert the state file + discoveries of this deploy into reference material that survives the session: a human-readable `docs/deployment-guide.md` future-you can skim, a short CLAUDE.md section telling AI assistants how the project is deployed, a memory entry with key decisions, and an archived copy of the checklist.

## MANDATORY EXECUTION RULES

- Never overwrite existing content silently. If a file exists, diff before writing.
- Use the structure of the existing `docs/deployment-guide.md` if present (this pattern was established during prior deploys). Extend rather than replace.
- Capture decisions WITH their *why*, not just *what* — future reviewers need to evaluate if the rationale still holds.

## Sequence of Instructions

### 1. Write/update `docs/deployment-guide.md`

If file does not exist, scaffold from the template at `.claude/skills/production-deploy/templates/deployment-guide.template.md` (create this template if it doesn't exist yet — simple markdown with sections: Platform, Infrastructure Table, Key Architecture Decisions, CI/CD, Env Vars Strategy, DB Operations, Background Jobs, Observability, OAuth, Integrations, Known Issues & TODOs).

If file exists, extend with a dated "Deployment N — {date}" subsection covering:
- What changed vs prior deploy
- New integrations added
- Any drift reconciliations applied (e.g., env var renames)
- New known issues

### 2. Update `CLAUDE.md` deployment section

Add (or update) a short section `## Deployment` containing:
- Production URL
- Vercel project name
- Supabase project ref
- Critical commands (`npm run db:migrate`, how to run prod-setup.sql)
- Link to `docs/deployment-guide.md`
- Any project-specific deploy hazards (e.g., "never db:push — apply dev schema via Supabase MCP; migrations get generated on main")

### 3. Update project memory

Via memory system: write or update `project_production_deployment.md` with:
- Production URL
- Infrastructure table (Vercel, Supabase, Resend, Sentry, etc. with one-line purposes)
- Key decisions (free-tier lifecycle, TOKEN_ENCRYPTION_KEY policy, Sentry sampling, etc.) — each with a **Why** and **How to apply**
- Operational reference (checklist location, guide location)

### 4. Archive the state file

Copy `{stateFile}` to `_bmad-output/deployments/deploy-{date}.md` (or project's preferred archive pattern). The active state file can then be cleared or renamed for the next deploy.

### 5. Phase 7 Gate

```
=== PHASE 7: DOCUMENT — SUMMARY ===

docs/deployment-guide.md:  updated | created
CLAUDE.md deployment section: updated | added
Memory entry updated: project_production_deployment.md
State file archived: _bmad-output/deployments/deploy-{date}.md

[C] Continue to Phase 8 (backport to template)
[R] Revise a doc
[X] Exit (deploy is complete; skipping backport only)
```
