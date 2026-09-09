import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|ts|svelte)'],
  staticDirs: ['../../../apps/dashboard/static'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-svelte-csf'
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {}
  }
};

export default config;
