# Testing Strategy

The goal for a solo-developer template: a suite **rigorous enough to catch regressions but cheap enough to stay green and fast** — and one that a downstream fork inherits without inheriting flakiness or feature-specific baggage. The enforceable version of this doc lives in [`.claude/rules/testing.md`](../.claude/rules/testing.md) (auto-loads when you touch test files).

## The one rule

> **Test at the lowest layer that proves the behavior.** Reserve the expensive browser layer for behavior that genuinely crosses a system boundary.

Most "UI tests" don't cross a boundary — they assert what a component renders given some props. Those are fast Vitest tests. A Playwright browser + real server + auth fixture should only pay for itself when the thing under test is the _integration_ between systems.

## The three layers

| Layer                | Where                                 | Env                           | Use for                                                                                                    | Cost                     |
| -------------------- | ------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
| **Unit / component** | co-located `*.test.ts` / `*.test.tsx` | `node`, or `jsdom` for `.tsx` | rendering, prop/variant states, validation, conditional rendering, dialogs, hooks, pure logic, Zod schemas | cheap, parallel          |
| **Integration**      | `tests/integration/**`                | `node` (deps mocked)          | Route Handlers / Server Actions with collaborators mocked                                                  | cheap (runs in unit job) |
| **E2E**              | `tests/**/*.spec.ts` · `*.e2e.ts`     | real browser + real Supabase  | boundary-crossing journeys only                                                                            | expensive                |

## What belongs in E2E (and what doesn't)

**Keep in E2E — crosses a boundary:**

- Auth + session: credentialed sign-in, sign-out + post-logout route protection
- Middleware enforcement: unauthenticated → protected route → redirect
- Authenticated rendering: a real session changing what a page shows
- SEO/metadata surviving the server-render pipeline (hreflang, robots, sitemap, OG) — see below
- Accessibility: axe-core scans of rendered pages

**Move to Vitest — component concern, no boundary:**
form validation · button enable/disable · field/read-only states · element visibility · dialog open/close · heading/greeting text · link `href` targets · password requirements · OAuth button presence.

The litmus test: _if it would pass against a single rendered component with mocked data, it is not an E2E test._

### SEO tests use the `request` fixture, not a browser

Verifying that robots.txt, the sitemap, hreflang links, and OG metadata reach the real HTTP response _is_ a boundary check (unit tests of the generator functions can't catch a layout that drops the metadata). But none of it needs a DOM — [`tests/seo.spec.ts`](../tests/seo.spec.ts) uses Playwright's `request` fixture (raw HTTP, no Chromium) and runs the whole SEO suite in a couple of seconds. Reach for `request` over `page` whenever there's no DOM to drive.

### Keep core journeys fork-agnostic

This repo is a template. Don't couple a core-journey E2E to an optional feature (e.g. chat) that a fork might delete — it would hand every fork a red pipeline. Optional-feature tests live with the optional feature.

## Hermeticity

- **No shared database.** `vitest.config.mts` blanks `DATABASE_URL` for the test process, so [`src/libs/DB.ts`](../src/libs/DB.ts) takes its in-memory **PGlite** branch. Every run gets a fresh, migrated, throwaway DB — no order-dependence, no "type already exists" collisions against a dev Postgres. Never put a real `DATABASE_URL` back into the test env.
- **`node` is the default Vitest environment.** Component (`.tsx`) tests get `jsdom` via the project split; the handful of `.ts` tests that need the DOM opt in with a top-of-file `// @vitest-environment jsdom` pragma. Keeping DOM setup off the pure-logic tests is the single biggest driver of unit-suite speed.

## Storybook

Storybook is the living catalog of shared UI primitives (`src/components/ui/*`) that forks inherit, built on the **Vite** framework (`@storybook/nextjs-vite`). Stories double as tests: `pnpm test:stories` runs every `*.stories.tsx` as a **Vitest browser test** (headless Chromium via `@storybook/addon-vitest`), so a broken import, a render error, or a failing play function fails CI. It's kept as a separate Vitest project (opt-in via `VITEST_STORYBOOK=1`) so the default `pnpm test` stays fast and browser-free. Add a story when you add a reusable primitive — it's documentation _and_ a render test in one.

> This replaced `@storybook/test-runner`, which crashed on Node 22 (`nyc`/`ERR_INVALID_ARG_TYPE`) and is being superseded upstream by the Vitest addon.

## Commands

```bash
pnpm test                                  # Vitest (node + jsdom projects, browser-free)
pnpm exec vitest run path/to/file.test.ts  # single file
pnpm test --coverage                       # coverage on demand (not gated in CI)
pnpm test:stories                          # stories as Vitest browser tests (Chromium)
pnpm test:e2e                              # Playwright E2E
```

## CI shape

Unit + integration run on every non-docs change (fast, no secrets needed for most). E2E runs on code changes but is skipped for docs-only, deps-only, and Dependabot PRs (no secrets there). The Storybook job runs `test:stories` on any non-docs change, including Dependabot, to catch dependency-driven story breakage. Details: [ci-cd-pipeline.md](ci-cd-pipeline.md).
