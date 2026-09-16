import { defineConfig } from '@cio/sdk';
import { topNav } from '@cio/sdk/layouts';
import { createConfiguredPlugins } from './plugins';

export default defineConfig({
  theme: {
    primary: '#0F62FE',
    radius: 'sm',
    font: 'Inter'
  },
  layout: topNav(),
  nav: {
    remove: [],
    rename: {},
    add: []
  },
  terminology: {},
  plugins: createConfiguredPlugins()
});
