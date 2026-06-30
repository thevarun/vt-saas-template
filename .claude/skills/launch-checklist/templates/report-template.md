# Launch Readiness Report

**Project:** {{project_name}}
**Scanned:** {{timestamp}}
**Template Version:** VT SaaS Template

---

## Scorecard Summary

| Domain | Checks | Passed | Failed | Warnings |
|--------|:------:|:------:|:------:|:--------:|
{{#each domain_summaries}}
| {{domain}} | {{total}} | {{passed}} | {{failed}} | {{warned}} |
{{/each}}
| **TOTAL** | **{{total_checks}}** | **{{total_passed}}** | **{{total_failed}}** | **{{total_warned}}** |

---

## Detailed Results

{{#each domains}}
### {{domain_name}}
| # | Check | Status | Tier | Details |
|---|-------|:------:|------|---------|
{{#each checks}}
| {{id}} | {{name}} | {{status}} | {{tier}} | {{details}} |
{{/each}}

{{/each}}

---

## Launch Readiness

### Alpha Launch
**Verdict: {{alpha_verdict}}**
- {{alpha_passed}} of {{alpha_total}} alpha-must checks passing
{{#if alpha_blockers}}
- **Blockers:**
{{#each alpha_blockers}}
  - {{name}}: {{details}}
{{/each}}
{{/if}}

### Full Launch
**Verdict: {{full_verdict}}**
- {{full_passed}} of {{full_total}} full-launch-must checks passing
{{#if full_blockers}}
- **Blockers:**
{{#each full_blockers}}
  - {{name}}: {{details}}
{{/each}}
{{/if}}

### Polish Status
- {{polish_passed}} of {{polish_total}} polish checks passing
{{#if polish_opportunities}}
- **Opportunities:**
{{#each polish_opportunities}}
  - {{name}}: {{details}}
{{/each}}
{{/if}}

---

## Next Steps

{{#if alpha_blockers}}
### Priority 1 — Alpha Blockers
{{#each alpha_next_steps}}
{{@index_1}}. {{action}}
{{/each}}

{{/if}}
{{#if full_blockers}}
### Priority 2 — Full Launch Blockers
{{#each full_next_steps}}
{{@index_1}}. {{action}}
{{/each}}

{{/if}}
{{#if polish_opportunities}}
### Priority 3 — Polish Opportunities
{{#each polish_next_steps}}
{{@index_1}}. {{action}}
{{/each}}

{{/if}}

---

*Would you like help addressing any of these items? I can work through them with you or autonomously tackle specific fixes.*
