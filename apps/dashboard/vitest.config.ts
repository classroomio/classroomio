import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      // The `sveltekit()` vite plugin is not active under vitest, so kit aliases are declared here.
      { find: '$lib', replacement: path.resolve(currentDir, 'src/lib') },
      { find: '$features', replacement: path.resolve(currentDir, 'src/lib/features') },
      { find: '$mail', replacement: path.resolve(currentDir, 'src/mail') },
      { find: /^@cio\/ui$/, replacement: path.resolve(currentDir, '../../packages/ui/src') },
      {
        find: /^@cio\/ui\/(.*)$/,
        replacement: `${path.resolve(currentDir, '../../packages/ui/src')}/$1`
      },
      {
        find: /^@cio\/question-types$/,
        replacement: path.resolve(currentDir, '../../packages/question-types/src/index.ts')
      },
      {
        find: /^@cio\/question-types\/(.*)$/,
        replacement: `${path.resolve(currentDir, '../../packages/question-types/src')}/$1`
      },
      { find: /^@cio\/utils$/, replacement: path.resolve(currentDir, '../../packages/utils/src/index.ts') },
      { find: /^@cio\/utils\/(.*)$/, replacement: `${path.resolve(currentDir, '../../packages/utils/src')}/$1` }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
