export const meta = {
  name: 'port-to-template',
  description: 'Produce-only engine: port a product\'s generic improvements UP into its base template as opened, UNVERIFIED PRs (the skill\'s verify step is the gate)',
  phases: [
    { title: 'Setup', detail: 'fetch + clean-tree check on the template; report main HEAD' },
    { title: 'Produce', detail: 'per group: idempotent precheck → prep → implement + local-verify → ship PR (no merge)' },
    { title: 'Summary', detail: 'list opened PRs as UNVERIFIED; hand off to the skill\'s verify step' },
  ],
}

// ── What this engine is (and is NOT) ────────────────────────────────────────
// This is ONE instrument of the `upstream-contribute` skill: a deterministic,
// headless produce engine. It opens PRs and STOPS. It NEVER merges, never enables
// auto-merge, never waits for CI. Its output is ALWAYS UNVERIFIED — the skill's
// independent byte-verification step is the sole merge gate. The light self-review
// below is for DRAFT QUALITY only and carries ZERO weight at merge.
//
// Never resume a half-finished run: size batches to finish in one run. If a run
// dies mid-group, re-run that group fresh — the idempotent precheck skips
// already-merged work and reuses an open PR.

// ── Inputs (args only — cwd-agnostic) ───────────────────────────────────────
// Required: source, target, repo. The group set comes from `groups` (inline) or
// is parsed from the PLAN file (`plan`). FAIL-CLOSED: if no group set resolves,
// THROW — never default to "all".
//
// The harness sometimes delivers `args` as a JSON STRING; parse that first.
function parseArgs(a) {
  let v = a
  if (typeof v === 'string') {
    try { v = JSON.parse(v) } catch { return {} }
  }
  return (v && typeof v === 'object') ? v : {}
}
const A = parseArgs(args)

const SOURCE = A.source // product repo (read-only)
const TARGET = A.target // template repo (where work happens)
const REPO = A.repo // GitHub "owner/name" of the template
const PLAN = A.plan || '' // optional: product's contribution-plan file with the wave/group list

if (!SOURCE || !TARGET || !REPO) {
  throw new Error('port-to-template: missing required args. Provide { source, target, repo } (absolute paths + GitHub owner/name). Optionally { plan } and/or { groups }.')
}

// ── Group selection (FAIL-CLOSED) ───────────────────────────────────────────
// A group is: { id, branch, title, scope, notes? }. Two sources:
//  1) inline `args.groups` — an array of group objects, OR an array of {id} to
//     select FROM the plan, OR a single id string.
//  2) the PLAN file — the engine asks an agent to parse the product's
//     contribution-plan and return the wave/group list as structured objects.
// If neither yields a non-empty, valid set → THROW. Never run "all" by accident.

const GROUP_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    id: { type: 'string' }, branch: { type: 'string' }, title: { type: 'string' },
    scope: { type: 'string' }, notes: { type: 'string' },
  },
  required: ['id', 'branch', 'title', 'scope'],
}
const PLAN_GROUPS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { groups: { type: 'array', items: GROUP_SCHEMA } },
  required: ['groups'],
}

function inlineGroups(a) {
  let g = a.groups
  if (typeof g === 'string') {
    try { g = JSON.parse(g) } catch { g = [g] }
  }
  if (!Array.isArray(g) || !g.length) return { full: null, ids: null }
  // Fully-specified group objects?
  if (g.every(x => x && typeof x === 'object' && x.id && x.branch && x.title && x.scope)) {
    return { full: g, ids: null }
  }
  // Otherwise treat as id selectors (strings or {id}).
  const ids = g.map(x => (typeof x === 'string' ? x : (x && x.id))).filter(Boolean)
  return { full: null, ids: ids.length ? ids : null }
}

const inline = inlineGroups(A)
let GROUPS

if (inline.full) {
  // Inline, fully-specified groups — use as-is.
  GROUPS = inline.full
} else {
  // Need the plan to source group definitions.
  if (!PLAN) {
    throw new Error('port-to-template: no inline group objects given and no `plan` provided. Pass `groups` as full {id,branch,title,scope} objects, OR pass `plan` (+ optional `groups` ids to select from it). Refusing to default to "all".')
  }
  const parsed = await agent(
    `Read the product's contribution plan at ${PLAN}. Extract the wave/group list as structured objects. Each group must have: \`id\` (slug), \`branch\` (e.g. \`contrib/<id>\`), \`title\`, \`scope\` (the full port instruction — what to port, what to strip/parameterize, what to defer), and optional \`notes\`. Preserve the plan's wording for scope/notes; do NOT summarize away the strip/integrate guidance. Return EVERY group in the plan, in plan order.`,
    { label: 'parse-plan', phase: 'Setup', schema: PLAN_GROUPS_SCHEMA },
  )
  const all = (parsed && Array.isArray(parsed.groups)) ? parsed.groups : []
  if (!all.length) {
    throw new Error(`port-to-template: parsed 0 groups from plan ${PLAN}. Cannot resolve a group set — refusing to run.`)
  }
  GROUPS = inline.ids ? all.filter(g => inline.ids.includes(g.id)) : all
}

if (!GROUPS || !GROUPS.length) {
  throw new Error(`port-to-template: group selection resolved to EMPTY (ids: ${JSON.stringify(inline.ids)}). Check args.groups against the plan. Refusing to default to "all".`)
}

// Echo resolved inputs BEFORE running anything (HARD RULE: log resolved set).
log(`Resolved SOURCE: ${SOURCE}`)
log(`Resolved TARGET: ${TARGET}  (repo ${REPO})`)
log(`Resolved PLAN:   ${PLAN || '(none — inline groups)'}`)
log(`Resolved groups (${GROUPS.length}): ${GROUPS.map(g => g.id).join(', ')}`)

// ── Shared context for all produce agents ───────────────────────────────────
const CTX = `You are porting tested code FROM a product (SOURCE) INTO its base template (TARGET).${PLAN ? `\nThe product's contribution plan is at ${PLAN} — read the matching section for strip/integrate guidance.` : ''}

PATHS:
- SOURCE (read-only): ${SOURCE}  (the product, on its default branch)
- TARGET (where you work): ${TARGET}  (the base template)
- GitHub repo: ${REPO}

HARD RULES:
- Operate on TARGET without disruption: use \`git -C ${TARGET} ...\`, \`npm --prefix ${TARGET} run <script>\`, \`gh ... -R ${REPO}\`, Edit/Write with absolute paths. Avoid bare \`cd\`.
- The template is a GENERIC, multi-product SaaS starter — NOT this product. STRIP ALL product specifics: branding/copy, product-domain endpoints + integrations, the product's DB schema name, hardcoded product routes, and any product-only features. Strip to the PATTERN, not the instance — contribute the seam + a placeholder/example, never the product's copy, prices, brand, or domain endpoints. The template is a SCAFFOLD, not a library.
- INTEGRATE, DON'T TRANSPLANT: study how the template already does similar things (read CLAUDE.md, .claude/rules/, neighbouring files) and mirror them; REUSE existing template utilities/types/config instead of duplicating; place files where the template's structure dictates and fix import paths. The result must read as native template code.
- ADDITIVE + GENERIC: opinionated or heavy subsystems ship OPT-IN (config-gated/flagged) so forks aren't forced into product-shaping choices. Keep changes additive.
- Match template conventions: TS strict (noUnusedLocals/Parameters, noUncheckedIndexedAccess, noImplicitReturns; prefix unused with _), \`type\` not \`interface\`, kebab-case component files, snake_case DB, the template's server-action result shape, shadcn/ui only, Zod at boundaries. Let lint:fix handle import order.
- NEVER run \`db:push\`. Regenerate migrations from schema diffs; never hand-merge snapshots.
- DON'T HALLUCINATE: if you cite a rule/convention, quote it from an ACTUAL file in the repo (confirm the text exists); never invent rules.`

// ── Schemas (kept minimal — a StructuredOutput glitch once made a post-ship ──
// agent fail to return; prefer no-schema or thin-schema agents) ──────────────
const PORTSPEC_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    group: { type: 'string' },
    portable: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
      title: { type: 'string' }, action: { type: 'string', enum: ['add', 'modify'] },
      targetPath: { type: 'string' }, sourcePath: { type: 'string' },
      transforms: { type: 'string', description: 'what to strip/rename/parameterize' },
      integration: { type: 'string', description: 'existing template utilities/types/config to reuse (not duplicate), correct target placement, import fixes' },
      tests: { type: 'string' }, rationale: { type: 'string' },
    }, required: ['title', 'action', 'targetPath', 'transforms'] } },
    newDeps: { type: 'array', items: { type: 'string' } },
    deferred: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
      title: { type: 'string' }, reason: { type: 'string' }, dependsOn: { type: 'string' },
    }, required: ['title', 'reason'] } },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    syncDownRisk: { type: 'string' },
    prTitle: { type: 'string' }, prBody: { type: 'string' },
  },
  required: ['group', 'portable', 'newDeps', 'deferred', 'prTitle', 'prBody'],
}

const IMPL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    branch: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    verify: { type: 'object', additionalProperties: false, properties: {
      lint: { type: 'string' }, types: { type: 'string' }, test: { type: 'string' }, build: { type: 'string' },
    }, required: ['lint', 'types', 'test', 'build'] },
    status: { type: 'string', enum: ['green', 'blocked'] },
    blockers: { type: 'string' },
  },
  required: ['branch', 'status', 'verify'],
}

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['pass', 'changes-needed', 'block'] },
    findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
      file: { type: 'string' }, issue: { type: 'string' }, fix: { type: 'string' },
    }, required: ['severity', 'issue'] } },
    summary: { type: 'string' },
  },
  required: ['verdict', 'findings', 'summary'],
}

const SHIP_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { prUrl: { type: 'string' }, prNumber: { type: 'number' }, notes: { type: 'string' } },
  required: ['prUrl'],
}

const PRECHECK_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { state: { type: 'string', enum: ['merged', 'open', 'none'] }, prNumber: { type: 'number' } },
  required: ['state'],
}

// ── Phase: Setup ────────────────────────────────────────────────────────────
phase('Setup')
const setup = await agent(
  `${CTX}\n\nSETUP: 1) \`git -C ${TARGET} fetch origin --prune\`. 2) Confirm the working tree is clean (\`git -C ${TARGET} status --porcelain\`); if dirty, STOP and report what's dirty. 3) Report \`origin/main\` HEAD sha + subject. 4) Confirm \`gh auth status\` can see ${REPO}. Return a short status line. Don't change branches.`,
  { label: 'setup', phase: 'Setup' },
)
log(`Setup: ${String(setup).slice(0, 300)}`)

// ── Phase: Produce (per-group, produce-only, failure-isolated) ──────────────
const results = []

for (let i = 0; i < GROUPS.length; i++) {
  const g = GROUPS[i]
  phase(`G${i + 1}: ${g.title}`)
  log(`▶ Group ${i + 1}/${GROUPS.length}: ${g.title}`)

  try {
    // 0) Idempotency — skip merged, reuse an already-open PR.
    const pre = await agent(
      `Check existing PRs for head branch "${g.branch}" on ${REPO}: \`gh pr list -R ${REPO} --head ${g.branch} --state all --json number,state,mergedAt\`. If any MERGED → state="merged". Else if any OPEN → state="open" with prNumber. Else "none".`,
      { label: `precheck:${g.id}`, phase: `G${i + 1}: ${g.title}`, schema: PRECHECK_SCHEMA },
    )
    if (pre && pre.state === 'merged') {
      log(`  ⏭ ${g.id} already merged — skip`)
      results.push({ group: g.id, skipped: true, prUrl: '(already merged)' })
      continue
    }
    const existingPr = (pre && pre.state === 'open') ? (pre.prNumber || 0) : 0

    // 1) Prep — study target, trace deps, plan native integration.
    const spec = await agent(
      `${CTX}\n\n## GROUP: ${g.title}\n${g.scope}\nNotes: ${g.notes || ''}\n\nProduce a concrete PortSpec. (1) STUDY THE TARGET FIRST (CLAUDE.md, .claude/rules/, nearest existing files) so the port integrates idiomatically; identify existing utilities to REUSE. (2) Read each SOURCE file and TRACE ITS IMPORTS — DEFER anything needing a later wave or a subsystem not yet on template main (with a reason). (3)${PLAN ? ` Read the matching plan section (${PLAN}) for strip guidance;` : ''} check \`git -C ${TARGET} ls-files\` to avoid duplicating. For each portable item set BOTH \`transforms\` (strip/rename → generic) and \`integration\` (reuse template utilities, correct placement). List newDeps, deferrals, acceptance criteria, sync-down risk, conventional-commit PR title + body. No code in this step.`,
      { label: `prep:${g.id}`, phase: `G${i + 1}: ${g.title}`, schema: PORTSPEC_SCHEMA },
    )
    if (!spec || !spec.portable || spec.portable.length === 0) {
      log(`  ${g.id}: nothing portable (all deferred) — skip`)
      results.push({ group: g.id, skipped: true, deferred: spec ? spec.deferred : [], reason: 'no portable items' })
      continue
    }

    // 2) Implement + local verify (iterate to green).
    let impl = await agent(
      `${CTX}\n\n## IMPLEMENT GROUP: ${g.title}\nPortSpec:\n${JSON.stringify(spec)}\n\nSteps: (a) \`git -C ${TARGET} fetch origin -q && git -C ${TARGET} checkout -B ${g.branch} origin/main\`. (b) Apply every portable item — create/modify target files, applying BOTH \`transforms\` and \`integration\` so it reads as native template code. (c) If newDeps: add to package.json and \`npm --prefix ${TARGET} install\`. (d) Write/adapt tests in the template's style. (e) Run \`npm --prefix ${TARGET} run lint\`, \`run check-types\`, \`run test\`, \`run build\` — fix and re-run until all pass (lint:fix for import order). If you can't reach green, status=blocked + explain. Do NOT commit/push yet.`,
      { label: `impl:${g.id}`, phase: `G${i + 1}: ${g.title}`, schema: IMPL_SCHEMA },
    )
    if (!impl) throw new Error(`implement agent died for ${g.id}`)

    // 3) LIGHT self-review for DRAFT QUALITY ONLY — NOT a gate. The skill's
    //    independent byte-verification step is the sole merge gate. One pass,
    //    no heavy re-review loops that would imply authority.
    const diffCmd = `git -C ${TARGET} diff origin/main...${g.branch}`
    const review = await agent(
      `${CTX}\n\nLIGHT self-review (DRAFT QUALITY ONLY — this is NOT a merge gate; an independent verifier checks the pushed PR later) of the diff (\`${diffCmd}\`) for the "${g.title}" port. Focus on FUNCTIONALITY, CORRECTNESS, and SECURITY hygiene: real bugs / broken logic, broken type/contract changes, missing error handling on important paths, secret/token handling (never logged or returned), missing input validation at boundaries, dev-only endpoints that must be prod-gated, and leftover PRODUCT specifics that break genericness (product endpoints/schema-name/brand/copy in shared code).\nDO NOT flag COSMETIC/STYLE (comment length, JSDoc, naming, import order, commit wording, whitespace) — at most 'low', never critical/high.\nVERIFY BEFORE FLAGGING — only cite a rule if you can quote it from an ACTUAL repo file; cite file:line per finding.`,
      { label: `self-review:${g.id}`, phase: `G${i + 1}: ${g.title}`, schema: REVIEW_SCHEMA },
    )

    // 4) Fix only VERIFIED real findings (severity × effort gate). Single pass.
    const findings = (review && review.findings) || []
    if (findings.length) {
      log(`  ${g.id}: ${findings.length} self-review finding(s) — verifying then fixing the real ones`)
      impl = await agent(
        `${CTX}\n\n## ADDRESS SELF-REVIEW FINDINGS on branch ${g.branch} for "${g.title}".\nFINDINGS:\n${JSON.stringify(findings)}\n\nFor EACH finding:\n1) VERIFY against the actual code/source — if it cites a rule, confirm that exact text exists. If unfounded (non-existent rule, misread code) → SKIP.\n2) If COSMETIC/style → SKIP.\n3) For VERIFIED real functional/correctness/security findings, apply a SEVERITY × EFFORT gate: critical/high → fix; medium → fix if reasonable, else SKIP and note for human review; low → fix only if cheap, else note.\nThis is DRAFT cleanup, not the gate — don't over-engineer. After fixes, re-run lint/check-types/test/build to green. In \`blockers\`, list what you FIXED and what you SKIPPED-and-why. Return updated impl status.`,
        { label: `fix:${g.id}`, phase: `G${i + 1}: ${g.title}`, schema: IMPL_SCHEMA },
      )
    }
    if (!impl || impl.status !== 'green') {
      throw new Error(`STOP (local verify not green): ${impl ? impl.blockers : 'impl agent died'}`)
    }

    // 5) Ship (PRODUCE-ONLY) — commit + push + open PR, idempotent. No merge,
    //    no auto-merge, no wait, no main-sync. NO output schema here: a thin/no
    //    schema avoids the StructuredOutput glitch that once made a post-ship
    //    agent fail to return AFTER it had already shipped.
    const ship = await agent(
      `${CTX}\n\n## OPEN PR for GROUP: ${g.title} (branch ${g.branch}) — PRODUCE-ONLY: do NOT merge, do NOT enable auto-merge, do NOT wait for CI.\nSteps: (a) Commit with a conventional-commit message. (b) \`git -C ${TARGET} push -u origin ${g.branch}\`. (c) IDEMPOTENT — check \`gh pr list -R ${REPO} --head ${g.branch} --state open --json number -q '.[0].number'\` (known open PR is #${existingPr} when >0); if one exists, REUSE it (your push updates it) — do NOT open a second. Otherwise \`gh pr create -R ${REPO} --base main --head ${g.branch} --title "${spec.prTitle.replace(/"/g, "'")}" --body <body>\` using:\n---\n${spec.prBody}\n---\nReturn ONLY the PR URL on the last line as \`PR: <url>\`. Then STOP.`,
      { label: `ship:${g.id}`, phase: `G${i + 1}: ${g.title}` },
    )
    const prUrl = (String(ship).match(/https?:\/\/\S*\/pull\/\d+/) || [])[0] || ''
    if (!prUrl) {
      throw new Error(`STOP (PR url not found in ship output): ${String(ship).slice(0, 300)}`)
    }

    log(`  📬 ${g.id} PR opened (UNVERIFIED): ${prUrl}`)
    results.push({
      group: g.id, opened: true, prUrl, verified: false,
      deferred: spec.deferred, selfReview: review && review.verdict,
      skippedFindings: impl.blockers || '',
    })
    // No merge / no main-sync: each group branches off the same origin/main; any
    // package.json overlap is reconciled at the skill's supervised merge step.
  } catch (err) {
    // Per-group failure isolation: one blocked group does NOT halt the wave.
    // Each group branches off origin/main independently, so a failure is local.
    const msg = String(err && err.message ? err.message : err)
    results.push({ group: g.id, opened: false, stopped: msg })
    log(`  ⚠️ ${g.id} blocked: ${msg} — continuing to next group`)
  }
}

// ── Phase: Summary ──────────────────────────────────────────────────────────
phase('Summary')
const opened = results.filter(r => r.opened)
return {
  engine: 'port-to-template',
  unverified: true,
  ran: GROUPS.map(g => g.id),
  opened: opened.map(r => ({ group: r.group, prUrl: r.prUrl, verified: false, selfReview: r.selfReview })),
  skipped: results.filter(r => r.skipped).map(r => r.group),
  blocked: results.filter(r => r.opened === false && r.stopped).map(r => ({ group: r.group, error: r.stopped })),
  results,
  reminder: `${opened.length} PR(s) OPENED and UNVERIFIED — engine output carries ZERO merge weight. Hand off to the skill's VERIFY step: a fresh-context subagent (no access to this run's reports) byte-verifies each pushed PR (\`git show\`, re-run the exploit/test, cite file:line) BEFORE any merge. Merge is human-gated, dependency-ordered, append-only (rebase only; force-push → user). After the wave merges, file a per-wave HARVEST issue on the product for source bugs found while porting (re-apply by hand, never cherry-pick) + a tracking issue per deferral. Never resume a half-finished run — re-run a blocked group fresh.`,
}
