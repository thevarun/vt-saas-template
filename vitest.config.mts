import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const env = loadEnv('', process.cwd(), '');

// Shared test settings applied to every project.
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
    // Two projects split by environment. Component tests (*.test.tsx) need
    // jsdom; everything else (logic, libs, API routes, integration) runs in the
    // much cheaper `node` environment. A per-file `// @vitest-environment jsdom`
    // pragma overrides the project env for the few `.ts` tests that touch the DOM.
    projects: [
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
