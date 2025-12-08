import * as path from 'path';

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      '@cio/ui': path.resolve(__dirname, '../ui/src'),
      $src: path.resolve(__dirname, '../ui/src')
    },
    conditions: ['svelte', 'browser', 'import']
  },
  optimizeDeps: {
    include: ['svelte-tiptap'],
    exclude: ['@tiptap/core', '@tiptap/pm', 'svelte-easy-crop']
  },
  ssr: {
    noExternal: ['svelte-tiptap']
  }
});
