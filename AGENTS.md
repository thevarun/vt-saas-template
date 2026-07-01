# Repository Guidelines

## Quick Start
- `pnpm dev`: Start local dev server.
- `pnpm lint`: Lint (run `pnpm lint:fix` to auto-fix).
- `pnpm check-types`: TypeScript type check.
- `pnpm test`: Run Vitest unit/integration tests.

## More Context
- Also refer to `CLAUDE.md` and `_bmad-output/project-context.md` for repo-specific conventions and background.

## Project Structure & Module Organization
- `src/app`: Next.js App Router routes and API handlers; keep route folders kebab-case.
- `src/components` & `src/features`: Reusable UI primitives and domain-specific bundles; prefer co-locating styles and tests nearby.
- `src/libs`, `src/utils`, `src/hooks`: Shared helpers, client/server SDK wrappers, and custom hooks.
- `src/styles/global.css`, `components.json`: Design tokens and Shadcn/Tailwind v4 setup (CSS-based config).
- `src/locales`: next-intl translations; update keys alongside feature work.
- `migrations` & `drizzle.config.ts`: Database schema and Drizzle migrations.
- `tests/integration`, `tests/e2e`: Vitest + React Testing Library and Playwright suites. Static assets live in `public/`.

## Build, Test, and Development Commands
- `pnpm dev`: Start Next.js with live reload on http://localhost:3000.
- `pnpm build` / `pnpm start`: Production build and serve.
- `pnpm lint` / `pnpm lint:fix`: ESLint (Antfu + Next + Tailwind rules), optional auto-fix.
- `pnpm check-types`: TypeScript noEmit type check.
- `pnpm test`: Vitest run (unit/integration); fails on console errors by default.
- `pnpm test:e2e`: Playwright E2E against the built app; ensure server is running or use `pnpm exec playwright install` first.
- `pnpm storybook` / `pnpm storybook:build`: Isolated component dev and static build.
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`: Drizzle schema generation, migrations, and UI studio (requires env vars).
- `pnpm clean`: Remove build artifacts (`.next`, `out`, `coverage`).

## Environment Setup
- Copy `.env.example` to `.env.local` if present; update required values before running the app.
- Use the T3 Env schema when adding new environment variables.

## Coding Style & Naming Conventions
- Language: TypeScript; prefer functional components and server components when possible.
- App Router: default to server components; add `"use client"` only when client hooks, state, or browser APIs are needed.
- Imports: use `@/...` absolute paths; group and sort imports (simple-import-sort). React hooks start with `use*`; components in `PascalCase.tsx`; utilities/helpers in `camelCase.ts`.
- Styling: Tailwind-first and Shadcn-first; keep custom CSS to a minimum and co-locate any exceptions with components.
- Formatting: ESLint drives formatting; run `pnpm lint:fix` before pushes. Follow 2-space indentation and trailing commas where ESLint applies.

## Testing Guidelines
- Place Vitest specs next to code for component/unit tests; use `tests/integration` for broader flows. Name files `*.test.ts(x)`.
- Prefer React Testing Library for components; avoid shallow renders; assert user-visible behavior.
- Playwright specs live in `tests/e2e`; record screenshots when UI changes and note them in PRs.
- Keep new code covered; add regression tests for reported bugs. Use `vitest --coverage` when touching critical paths.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (commitlint enforced). Use `pnpm commit` (Commitizen) to stay compliant.
- Pre-commit hooks (husky + lint-staged) run linting/tests on staged files; ensure a clean pass.
- PRs should include: clear summary, linked issue, screenshots/gifs for UI changes, notes on migrations or feature flags, and test results (`pnpm test`, `pnpm test:e2e` when relevant).
- Target `main`; keep PRs small and focused. If adding migrations, mention expected data impacts and rollback steps.

## Security & Configuration Tips
- Secrets live in `.env.local` (never commit); use T3 Env schema for new variables and update `.env.example` if present.
- Sentry and Supabase keys are required for error reporting/auth; provide dummy values for local dev when safe.
- When working with Drizzle migrations, back up data before running `pnpm db:migrate` in shared environments.
