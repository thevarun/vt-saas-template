# {PROJECT_NAME} Production Deployment Checklist

**Started:** {YYYY-MM-DD}
**Domain:** {PRODUCTION_DOMAIN}
**Invocation:** `/production-deploy` | `--plan` (dry-run) | `--resume`

---

## State file conventions

This file is the **canonical state artifact**. The `production-deploy` skill reads and writes it. Notes for consumers:

- **Phases 1, 2, 3, 6, 7, 8** track at phase granularity. An unchecked phase means "re-run the phase" — these phases are read-only or cheap to redo.
- **Phases 4 and 5** track at sub-item granularity. Each integration has its own checklist filled from its reference file. Pre-checks at each sub-step read this state and skip already-completed items — mid-phase crash doesn't force redoing DB writes, DNS records, Stripe products, etc.
- Safe to exit the skill at any gate; state persists.

---

## Phase 1 — Plan

- [ ] Prior context absorbed (CLAUDE.md, Env.ts, .env.example, deployment-guide.md, memory)
- [ ] Upstream backport candidates checked (`gh issue list --repo {template-repo} --label backport-from-deploy`)
- [ ] Integrations detected (see manifest below)
- [ ] Tool availability audited (see tool table below)
- [ ] Context7 coverage probed (see coverage table below)
- [ ] Current provider docs fetched for drift-prone providers
- [ ] Risk review pass complete (findings logged)
- [ ] Pitfalls-to-watch list surfaced

**Integration manifest:**
_(populated by step-01-plan — includes per-integration group assignment A vs B, dependencies, reference file status)_

**Tool availability:**
_(populated by step-01-plan — per tool: present | not-authenticated | not-installed)_

**Context7 coverage:**
_(populated by step-01-plan — per provider: ✓ library_id | ✗ no match → fallback plan)_

**Drift findings:**
_(populated by step-01-plan — e.g., "code uses NEXT_PUBLIC_POSTHOG_KEY, current docs use NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN")_

**Skipped backport candidates:**
_(populated if user chose `[P] Proceed as-is` in step-01-plan#1b — risk reviewer flags downstream)_

---

## Phase 2 — Readiness

### Mechanical
- [ ] `pnpm build` passes locally
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Git state clean
- [ ] Open PRs triaged

### Hygiene
- [ ] RLS enabled on every app-schema table
- [ ] User tier enforcement on quota-gated endpoints
- [ ] Admin gate in middleware + route handlers
- [ ] Dev-login endpoint blocked in prod
- [ ] Rate limiting wired on public endpoints
- [ ] `.env.example` up to date

### Cost
- [ ] Landing SSG
- [ ] Sentry sampling env-aware
- [ ] DB auto-migration disabled in prod
- [ ] Free-tier AI quota gating active
- [ ] Spend caps planned (Vercel, OpenAI, Google AI)

---

## Phase 3 — Env Strategy

- [ ] Env-plan table produced (see appendix)
- [ ] Per-env classifications decided
- [ ] Drift reconciliations logged
- [ ] CI secrets pointed at dev (not prod)

**Env-plan table:**
_(populated by step-03-env-strategy)_

**If `--plan` invocation, dry-run ends here.** Re-invoke without `--plan` to execute Phases 4-8.

---

## Phase 4 — Core Infra (dispatcher, group A)

**This section is populated at runtime from the Phase 1 manifest — sub-items vary by detected stack.** Fine-grained sub-item state enables safe resume. Pre-checks skip already-completed sub-items.

### Execution plan
_(populated at Phase 4 start — topologically-sorted list of group-A integrations with their reference files)_

### Per-integration state

_Template for each integration (repeated per manifest entry):_

#### Integration: {name}  (ref: `references/integrations/{name}.md`)
- [ ] Pre-check passed / skipped (already complete)
- [ ] Sub-step 1: {from ref}
- [ ] Sub-step 2: {from ref}
- [ ] …
- [ ] Per-integration risk review (deploy-risk-reviewer)

_Typical group A integrations (will vary):_ supabase, vercel, vercel-env-apply, resend, supabase-smtp-wire, sentry, posthog, (langfuse), ai-spend-caps, github-ci.

### Phase 4 cross-cutting gates
- [ ] Env var completeness verified (0 missing required)
- [ ] First prod deploy green
- [ ] Landing page returns 200, SSL active
- [ ] **Custom SMTP actually wired** — test signup email's From confirmed branded
- [ ] Phase 4 comprehensive risk review

---

## Phase 5 — Feature Integrations (dispatcher, group B)

**Same dispatcher pattern as Phase 4, for integrations that depend on infra being live.**

### Execution plan
_(populated at Phase 5 start)_

### Per-integration state

_Template for each integration:_

#### Integration: {name}  (ref: `references/integrations/{name}.md`)
- [ ] Pre-check passed / skipped
- [ ] Sub-step 1: {from ref}
- [ ] …
- [ ] Per-integration risk review

_Typical group B integrations:_ oauth-{provider}, stripe-sandbox, inngest (or equivalent background jobs), custom-webhook integrations, unknown integrations (context7-researched).

**Stripe live mode is out of scope.** If the user asks, direct to a future `stripe-live-transition` skill.

---

## Phase 6 — Smoke Test

- [ ] Landing (SSG verified via Vercel logs — no function invocation on landing view)
- [ ] Signup + magic link (branded sender confirmed — inspect email From field)
- [ ] Sign-in (session persists across refresh)
- [ ] OAuth connects (per provider in manifest)
- [ ] Core feature path exercised
- [ ] Admin gate (non-admin gets 403, admin email gets access)
- [ ] Dev-login returns 403
- [ ] Observability captures events (Sentry, PostHog, Langfuse if applicable)
- [ ] Cost posture final review (every spend cap active, sample rates correct in prod)

---

## Phase 7 — Document

- [ ] `docs/deployment-guide.md` updated (per-deploy section appended)
- [ ] `CLAUDE.md` deployment section added/updated
- [ ] Memory entry updated (`project_production_deployment.md`)
- [ ] State file archived to `_bmad-output/deployments/deploy-{date}.md`

---

## Phase 8 — Backport

- [ ] Backport candidates scanned from this run's findings
- [ ] Issues drafted and reviewed with user
- [ ] `backport-from-deploy` label created on template repo (if missing)
- [ ] Issues raised against `thevarun/vt-saas-template`
- [ ] Created issue URLs logged below

**Created issues:**
_(populated by step-08-backport)_

---

## Deferred follow-ups

_(anything skipped-with-note across any phase — not blocking but should be tracked. Example: "Stripe live-mode transition — invoke separate skill when ready".)_

---

## Decisions log

_(key decisions made during this deploy, with rationale — memory-file candidates. Example: "Free tier = 30-day trial, then expired-with-reduced-quotas (vs full paywall) — lower friction for alpha users.")_
