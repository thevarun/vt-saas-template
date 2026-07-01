import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = loadEnv('', process.cwd(), '');

// The storybook project is opt-in (VITEST_STORYBOOK=1, set by `npm run test:stories`).
// It's a browser project and its plugin loads the Storybook → Next config, so
// keeping it out of the default `npm test` keeps that run fast and browser-free.
const withStorybook = !!process.env.VITEST_STORYBOOK;

// Loading the Storybook → Next config validates app env (Env.ts) at config-resolution
// time, before any .env file is read into process.env. Stories don't touch Supabase,
// so fill the required public keys with placeholders when they're absent/empty. Real
// values (e.g. a developer's populated env) take precedence via the `||=` guard.
if (withStorybook) {
  process.env.DB_SCHEMA ||= 'vt_saas';
  process.env.NEXT_PUBLIC_DB_SCHEMA ||= 'vt_saas';
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://placeholder.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'placeholder-anon-key';
}

// Shared test settings applied to the node/jsdom projects.
const shared = {
  globals: true, // needed by @testing-library cleanup
  setupFiles: ['./vitest-setup.ts'],
  env: {
    ...env,
    // Hermetic DB: blank DATABASE_URL for the test process so src/libs/DB.ts
    // takes the in-memory PGlite branch instead of migrating against a shared
    // Postgres (a dev .env.local). A shared DB makes runs order-dependent and
    // collides on enum re-creation ("type ... already exists"). CI already runs
    // without DATABASE_URL, so this just makes local match CI.
    DATABASE_URL: '',
  },
};

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Stub optional dependency that may not be installed
      '@ai-sdk/anthropic': new URL('./__mocks__/@ai-sdk/anthropic.ts', import.meta.url).pathname,
    },
  },
  test: {
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}', '**/*.d.ts'],
    },
    // Projects are mutually exclusive by run:
    //  - default (`npm test`): `node` (logic/libs/API/integration — cheap) and
    //    `jsdom` (React component `*.test.tsx`; a `.ts` test opts into the DOM with
    //    a `// @vitest-environment jsdom` pragma). Both browser-free.
    //  - `npm run test:stories` (VITEST_STORYBOOK=1): only the `storybook` project,
    //    which runs every *.stories.tsx as a real browser test via the Storybook
    //    Vitest addon. Kept separate so the default run needs no browser.
    projects: withStorybook
      ? [{
          extends: true,
          plugins: [
            storybookTest({ configDir: path.join(dirname, '.storybook') }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: 'chromium' as const }],
            },
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        }]
      : [
          {
            extends: true,
            test: {
              ...shared,
              name: 'node',
              environment: 'node',
              include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
            },
          },
          {
            extends: true,
            test: {
              ...shared,
              name: 'jsdom',
              environment: 'jsdom',
              include: ['src/**/*.test.tsx', 'tests/**/*.test.tsx'],
            },
          },
        ],
  },
});
