const colors = require('tailwindcss/colors');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  framework: {
    name: '@storybook/svelte',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  core: {
    builder: 'webpack5',
  },
  features: {
    storyStoreV7: true,
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.svelte$/,
      use: {
        loader: 'svelte-loader',
        options: {
          preprocess: require('svelte-preprocess')(),
          emitCss: true,
        },
      },
    });
    return config;
  },
  typescript: {
    check: true,
    checkOptions: {},
  },
  svelteOptions: {
    preprocess: require('svelte-preprocess')(),
  },
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/lib/components/**/*.svelte',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        gray: {
          ...colors.gray,
          900: '#121212', // Darker black for dark mode
        },
        base: {
          dark: '#eee', // Dark grey
        },
        // Hero header background
        'hero-light': '#F5F8FE',
        'hero-dark': '#1A1A1A', // Different from the SVG background
      },
    },
  },
};