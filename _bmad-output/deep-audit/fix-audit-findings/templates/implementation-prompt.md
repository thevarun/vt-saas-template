# Theme Implementation Prompt Template

=== THEME IMPLEMENTATION TASK ===

You are implementing refactoring theme {theme_id}: {theme_name}

## Theme Details
{theme block with enriched_steps from Phase B}

## Related Findings
{for each finding_id: full finding block}

## Enrichment Notes
{gaps, stale_files from Phase B — so sub-agent is aware of any issues}

## Instructions

Follow this sequence exactly:

1. READ all affected files to understand current state:
{list of files}

2. TESTS BEFORE (if coverage_gate is REQUIRED):
   {concrete_tests_before from enrichment}
   - Write characterization tests first
   - Run the specified test commands
   - Verify they pass before making changes

3. IMPLEMENT fixes following these steps IN ORDER:
{enriched_steps with finding cross-references}

For each step, reference the related finding's suggestion for context.

4. VALIDATE after implementation:
   Run: npm run lint && npm run check-types && npm test
   Fix any issues before proceeding.

5. TESTS AFTER:
   {concrete_tests_after from enrichment}
   - Write specified new tests
   - Verify they pass

6. VISUAL CHECK (only if ui_changes is true):
   - Use Playwright MCP to navigate to affected routes
   - Take screenshots, save to: {screenshotsFolder}
   - Review for visual regressions
   - Auto-fix any CSS/layout issues found

## Return Format
When complete, report:
- files_changed: [list of files you modified]
- tests_written: [list of new test files/cases]
- tests_passed: true/false
- test_output: [summary of test results]
- issues_encountered: [any problems or deviations from plan]
- screenshot_paths: [paths to screenshots, if applicable]
- visual_status: pass/fail/N/A
=== END TASK ===
