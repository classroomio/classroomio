import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      // Mirror `svelte.config.js` kit aliases. The `sveltekit()` vite plugin is
      // not active under vitest, so these resolve manually.
      { find: '$lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '$features', replacement: path.resolve(__dirname, 'src/lib/features') },
      { find: '$mail', replacement: path.resolve(__dirname, 'src/mail') },
      { find: /^@cio\/ui$/, replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: /^@cio\/ui\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/ui/src') + '/$1' }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
