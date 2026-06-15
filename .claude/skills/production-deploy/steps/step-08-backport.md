---
name: step-08-backport
description: Review this deployment's discoveries for template-worthy fixes — drift reconciliations, version pins, scaffolding additions, pitfall callouts — and raise GitHub issues against thevarun/vt-saas-template so the next product fork doesn't re-learn them.
workflow_path: .claude/skills/production-deploy
thisStepFile: .claude/skills/production-deploy/steps/step-08-backport.md
workflowFile: .claude/skills/production-deploy/SKILL.md
stateFile: _bmad-output/deployment-checklist.md
templateRepo: thevarun/vt-saas-template
---

# Phase 8 — Backport to Template

## STEP GOAL

Feed learnings back to the shared base. For every template-generic fix or pitfall surfaced during this deploy, raise a GitHub issue on `vt-saas-template` describing the change and why future forks would benefit. User approves each issue before it's created.

## MANDATORY EXECUTION RULES

- Only propose backports for **template-generic** items. Project-specific integrations, tier names, brand choices, etc. stay in the project.
- Show the full proposed issue body before creating. User `[C]` approves → Claude runs `gh issue create`.
- Use the issue label `backport-from-deploy` (create if absent) so template maintainer can filter.
- If `gh` is not authenticated against the template repo, prompt the user and halt that backport.

## Sequence of Instructions

### 1. Scan for backport candidates

From the current state file and the risk-review findings across phases, extract:

| Category | Examples seen on real deploys |
|---|---|
| **Scaffolding files missing** | `supabase/prod-setup.sql` template, landing-page SSG pattern, `.env.example` key-coverage |
| **Framework/toolchain pins** | TS 6 `baseUrl` deprecation fix (`ignoreDeprecations: "6.0"` in tsconfig), Node version pin |
| **Runtime-config gaps** | `NODE_ENV=production` guard on DB auto-migration |
| **Upstream drift fixes** | PostHog env var name update (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`) |
| **Cost defaults** | Env-aware Sentry sampling defaults (0.1 prod, 1.0 dev) |
| **Security defaults** | `ADMIN_EMAILS` fallback check, dev-login hard block in prod |
| **Deploy-day pitfall additions** | Inngest Deployment Protection bypass flow, Supabase custom SMTP wiring gotcha (it's not enough to verify DNS — must toggle SMTP in Supabase Auth too) |
| **Provider instruction updates** | New dashboard paths, scope requirements, webhook event lists |

For each candidate, determine: is it a code/config change (makes sense as a PR), a doc update (deployment-guide template), or a pitfall callout (skill's `known-pitfalls.md`)? Classify accordingly.

### 2. Draft issue bodies

For each candidate, draft a GitHub issue with this shape:

```markdown
## Backport candidate: {title}

**Source deploy:** {project name} at {production URL}, deployed {date}
**Category:** {from table above}

### What surfaced
{concrete symptom during deploy — cite the phase / evidence}

### Why it's template-worthy
{why future forks will hit the same thing}

### Proposed change
{a code snippet, config addition, doc section, or pitfall entry}

### Risk / scope
{what it breaks if applied blindly, what testing is needed}

Label: `backport-from-deploy`
```

### 3. Review gate (batch)

Present all drafted issues in one panel:

```
Drafted {N} backport candidates:

1. [{category}] {title} — {one-line summary}
   → [C] Create / [S] Skip / [R] Revise

2. [{category}] ...

[C all]   Create all
[S all]   Skip all (close this phase)
[R all]   Revise any
[X]       Exit without action
```

### 4. Create approved issues

For each approved candidate:

```bash
gh issue create \
  --repo {templateRepo} \
  --title "{issue title}" \
  --label backport-from-deploy \
  --body-file {tmp-body-file}
```

If repo doesn't have the `backport-from-deploy` label, create it first:
```bash
gh label create backport-from-deploy \
  --repo {templateRepo} \
  --description "Fixes/additions surfaced during a production deploy of a fork" \
  --color 0E8A16
```

Record created issue URLs in the state file.

### 5. Phase 8 Gate (final)

```
=== PHASE 8: BACKPORT — SUMMARY ===

Backport candidates scanned: {N}
Issues created on {templateRepo}: {M}
  {list with URLs}
Skipped: {count} (with reasons)

=== DEPLOY COMPLETE ===

Production URL: {url}
Total time: {if trackable}
Phases: 1-8 all green
Deferred follow-ups: {list from various phases}

Next steps you might want:
  - Monitor Sentry + Vercel logs for the first 24h
  - Invite your first alpha user
  - Plan the Stripe live-mode transition when payments matter
  - Run `/production-deploy` again for your next product — the integration reference library is now seeded

Thank you for using production-deploy. Learnings captured; the next deploy will be faster.
```
