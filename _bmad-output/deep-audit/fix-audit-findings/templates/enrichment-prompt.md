# Theme Enrichment Prompt Template

=== THEME ENRICHMENT TASK ===

You are enriching refactoring theme {theme_id}: {theme_name} with concrete implementation details.

## Theme Data (from refactoring-plan.md)
{full theme block: id, name, effort, risk, steps, files, tests_before, tests_after, coverage_gate, blast_radius}

## Related Findings (from findings.md)
{for each finding_id: full finding block}

## Instructions

Analyze the theme and its findings, then produce an enriched version with these additions:

1. CROSS-REFERENCE steps with findings:
   - For each finding_id, verify the finding's `suggestion` is reflected in the theme's `steps`
   - Note any gaps where a finding's suggestion isn't covered

2. CONCRETE tests_before:
   - Search for existing test files related to the affected code
   - Determine exact `npm test` filter commands (e.g. `npm test -- src/libs/api`)
   - If coverage_gate is REQUIRED: specify what characterization tests to write (file path, what to assert)

3. CONCRETE tests_after:
   - Specify exact new test files/cases needed based on what the theme changes
   - Include what each test should assert

4. UI CHANGES detection:
   - Check if any file in the theme's `files` list is a .tsx file under src/app/, src/features/, or src/components/
   - Report: ui_changes: true/false

5. VALIDATE affected files:
   - Check each file in `files` exists in the project
   - Flag any stale references (file doesn't exist or path has changed)

## Return Format
Return the enriched theme as a structured block:
- enriched_steps: {original steps + any additions from finding gaps}
- concrete_tests_before: {specific commands, files, characterization test specs}
- concrete_tests_after: {specific new test files/cases with assertions}
- ui_changes: true/false
- stale_files: [any files that don't exist]
- gaps: [any finding suggestions not covered by steps]
=== END TASK ===
