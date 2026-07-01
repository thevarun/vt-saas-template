---
name: "step-02-scan"
description: "Execute all audit checks across all domains using parallel sub-agents"

# Path Definitions
workflow_path: "{workflow_path}"

# File References
thisStepFile: "{workflow_path}/steps/step-02-scan.md"
nextStepFile: "{workflow_path}/steps/step-03-report.md"
workflowFile: "{workflow_path}/SKILL.md"
checksData: "{workflow_path}/data/checks.csv"
---

# Step 2: Domain Scanning

## STEP GOAL:

To execute all ~43 production-readiness checks across all audit domains by dispatching parallel sub-agents. Each sub-agent handles a group of related domains and returns structured results. This step runs fully autonomously and auto-proceeds to report generation.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🤖 This step runs autonomously — execute checks and collect results without user interaction
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are a systems auditor executing a comprehensive parallel scan
- ✅ If you already have been given a name, communication_style and persona, continue to use those while playing this new role
- ✅ Maintain systematic, prescriptive tone throughout
- ✅ You dispatch sub-agents, collect, validate, and merge results

### Step-Specific Rules:

- 🎯 Focus ONLY on executing checks and collecting results
- 🚫 FORBIDDEN to generate the report in this step — that's step 3
- 🚫 FORBIDDEN to ask the user any questions
- 🤖 This is an AUTONOMOUS step — auto-proceed to step 3 after all scans complete
- ⚠️ If a check cannot be determined, mark as WARN (never guess PASS or FAIL)

## EXECUTION PROTOCOLS:

- 🎯 Dispatch sub-agents in parallel for speed
- 💾 Collect structured results from each agent
- 📖 Auto-proceed to next step after all results collected
- 🚫 FORBIDDEN to halt for user input

## CONTEXT BOUNDARIES:

- Project context from step 1 is available in memory
- Checks loaded from {checksData} in step 1
- MCP availability flags from step 1
- Focus ONLY on executing checks

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Prepare Check Groups

Organize checks from {checksData} into sub-agent groups:

**Agent 1 — Auth & Infrastructure + Database** (checks 1-7)

- Supabase URL/key validation
- Protected routes check
- DATABASE_URL validation
- Migration files existence
- Build success
- Deployment config

**Agent 2 — Security** (checks 8, 34)

- API key exposure scan
- CSP headers check

**Agent 3 — SEO + Content** (checks 11-15, 24, 33)

- Site URL configuration
- Sitemap, robots.txt, OG images
- Hreflang tags
- README customization
- Help/FAQ page

**Agent 4 — Email + Legal** (checks 16-20, 25)

- Resend API key
- From address customization
- Email templates existence
- Privacy policy page
- Terms of service page
- Sender domain check

**Agent 5 — i18n + Performance/UX + Accessibility** (checks 10, 21-23, 26-28, 32)

- Default locale and middleware
- Bundle size check
- Viewport meta tag
- Onboarding flow
- Locale file completeness
- Translation key comparison
- Image alt tags
- next/image usage

**Agent 6 — CI/CD + E2E + Observability + Analytics** (checks 9, 29-31, 35)

- Sentry DSN configuration
- GitHub Actions workflow files
- Playwright test files and config
- Analytics integration

**Agent 7 — Platform (LIVE checks)** (checks 36-43)

- GitHub: main branch protection, CI passing on main, auto-delete-branch, squash-only merge, required CI secrets present
- Vercel: RUN_PROD_MIGRATIONS in production, prod↔local env parity
- Supabase: security advisors (RLS/exposed views) clean
- ⚠️ These query the DEPLOYED platform via `gh`/Vercel/Supabase MCP. Pass the `live_tooling`
  flags + `repo_slug` from step 1. If a required tool is unavailable/unauthed, return **WARN**
  for that check with a short reason — NEVER guess PASS/FAIL. Never print secret values.

### 2. Dispatch Sub-Agents

Launch all 7 sub-agents in parallel using the Task tool. Each agent receives:

**Input for each agent:**

- The project context from step 1 (project root, env vars found, files found, dirs found)
- The specific checks assigned to that agent (from checks.csv)
- MCP availability flags

**Instructions for each agent:**

Each sub-agent must:

1. Execute each assigned check using the appropriate scan method
2. For each check, determine status: **PASS**, **FAIL**, or **WARN**
3. Return results as a structured list

**Agent prompt template:**

```
You are a production-readiness auditor scanning a VT SaaS Template project.

Project root: {project_root}
Env vars found: {env_vars_list}
Live tooling - gh CLI (authed): {github_cli} | repo: {repo_slug} | Vercel: {vercel} | Supabase MCP: {supabase_mcp}

Execute the following checks and return results as a structured list.
For each check, report: check_id, status (PASS/FAIL/WARN), and a brief detail.

If you cannot determine a check's status, use WARN with detail explaining why.
Do NOT guess — only report what you can verify.

Checks to execute:
{list of checks with id, name, scan_method, description}

Return format (one per line):
CHECK_ID | STATUS | Detail message
```

### 3. Execute Special Checks

Some checks require special handling:

**Check 6 — App builds successfully:**

- Run `pnpm build` using the Bash tool
- PASS if exit code 0, FAIL otherwise
- Capture any error output as details
- NOTE: This is a blocking check — it takes time. Run via sub-agent.

**Check 21 — Bundle size:**

- After build completes, check `.next/` output for oversized chunks
- WARN if any JS chunk > 500KB
- This depends on check 6 passing first

**Check 27 — Translation key comparison:**

- Read all locale JSON files
- Compare key sets between default locale and other locales
- Report missing keys per locale

### 4. Collect and Merge Results

After all sub-agents complete:

1. Collect results from each agent
2. Merge into a single results array
3. Validate all check IDs are accounted for
4. If any agent failed or timed out, mark those checks as WARN with "scan incomplete"

**Expected result structure:**

```
check_results: [
  { id: 1, domain: "Auth & Infrastructure", name: "Supabase URL is real value", status: "PASS", tier: "alpha", details: "Found in .env.local" },
  { id: 2, domain: "Auth & Infrastructure", name: "Supabase anon key is real value", status: "FAIL", tier: "alpha", details: "Not found in any env file" },
  ...
]
```

### 5. Validate Completeness

Check that results exist for all checks in {checksData}:

- If any check is missing from results, add it with status WARN and details "Check not executed"
- Log a count: "Completed X of Y checks"

### 6. Auto-Proceed to Report Generation

Display: "**Proceeding to report generation...**"

## CRITICAL STEP COMPLETION NOTE

After all sub-agent results are collected, merged, and validated for completeness, auto-proceed to report generation.
Load and read fully `{workflow_path}/steps/step-03-report.md` to generate the scorecard.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All sub-agents dispatched in parallel
- All check results collected and merged
- Results validated for completeness
- Auto-proceeded to step 3

### ❌ SYSTEM FAILURE:

- Asking the user any questions
- Running checks sequentially when parallel is possible
- Generating the report in this step
- Marking a check as PASS or FAIL when it can't be verified (should be WARN)
- Not validating result completeness

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
