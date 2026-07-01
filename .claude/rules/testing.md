---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.e2e.ts"
  - "**/*.stories.tsx"
  - "tests/**"
  - "vitest.config.mts"
  - "playwright.config.ts"
---

# Testing rules

The layer boundary that keeps the suite rigorous without becoming slow or fragile. Full rationale: [docs/testing-strategy.md](../../docs/testing-strategy.md).

## Pick the layer by what the test proves

- **Vitest unit/component (`*.test.ts` / `*.test.tsx`, co-located)** — the default. Rendering, prop/variant states, validation, conditional rendering, dialogs open/close, hooks, pure logic, Zod schemas. Component tests run in `jsdom`; everything else in `node`.
- **Vitest integration (`tests/integration/**`, `node` env, mocked deps)** — Route Handlers / Server Actions with their collaborators mocked. Runs in the unit-tests CI job.
- **Playwright E2E (`tests/**/*.spec.ts` / `*.e2e.ts`)** — ONLY behavior that crosses a system boundary.

## Before adding an E2E test, it must cross a boundary

An E2E test is justified **only** if it exercises one of: auth/session flow, middleware enforcement (protected-route redirect), real data persistence, or SEO/metadata surviving the server-render pipeline. If a check would pass against a single rendered component with mocked data, it belongs in Vitest — **do not** write it as E2E.

- **Never** assert component concerns in E2E: form validation, button enable/disable, field/read-only states, element visibility, dialog open/close, heading or greeting text, link `href` targets. These have co-located Vitest homes.
- **Prefer the `request` fixture over a browser page** when no DOM is needed (HTTP endpoints, robots/sitemap, metadata in served HTML, OG image). It's an order of magnitude cheaper than driving Chromium. See `tests/seo.spec.ts`.
- **Keep E2E feature-agnostic for forks.** Don't couple core-journey specs to optional features (e.g. chat) a downstream fork may remove — that would inherit red CI.

## Hermeticity & environment

- **Tests must not touch a shared database.** `vitest.config.mts` blanks `DATABASE_URL` so `src/libs/DB.ts` uses in-memory PGlite; never re-introduce a real `DATABASE_URL` into the test env or migrate against a live Postgres.
- **`node` is the default Vitest environment.** A `.ts` test that needs the DOM must opt in with a top-of-file `// @vitest-environment jsdom` pragma (the pragma overrides the project env).
- **Stories are tests.** Every `*.stories.tsx` runs as a Vitest browser test via `npm run test:stories` (Storybook Vitest addon, headless Chromium) — a broken import, render error, or failing play function fails CI. It's a separate opt-in project (`VITEST_STORYBOOK=1`); keep it out of the default `npm test` so that run stays browser-free. Add a story when you add a shared `components/ui/*` primitive.
