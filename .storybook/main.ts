import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  // Only pick up story files. The `.mdx` glob was removed: it matched pSEO blog
  // content fixtures (YAML-frontmatter .mdx under src/libs/pseo) that the bundler
  // can't parse. Autodocs come from the `autodocs` tag on *.stories.tsx.
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // addon-vitest turns stories into Vitest browser tests (see vitest.config.mts).
  addons: ['@storybook/addon-links', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true,
  },
};

export default config;
