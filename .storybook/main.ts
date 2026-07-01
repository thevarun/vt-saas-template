import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  // Only pick up story files. The `.mdx` glob was removed: it matched pSEO blog
  // content fixtures (YAML-frontmatter .mdx under src/libs/pseo), which webpack
  // can't parse and which broke `storybook build`. Autodocs come from the
  // `autodocs` tag on *.stories.tsx, so no MDX entry is needed.
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-onboarding', '@storybook/addon-links'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true,
  },
};

export default config;
