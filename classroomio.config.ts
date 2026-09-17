import { defineConfig } from '@cio/sdk';
import { sidebar } from '@cio/sdk/layouts';
import { configuredPlugins } from './plugins';

export default defineConfig({
  theme: {
    primary: '#0F62FE',
    radius: 'sm',
    font: 'Inter'
  },
  layout: sidebar(),
  nav: {
    remove: [],
    rename: {},
    add: []
  },
  terminology: {},
  plugins: configuredPlugins
});
