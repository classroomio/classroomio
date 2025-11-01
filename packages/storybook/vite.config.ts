import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
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
    exclude: ['@tiptap/core', '@tiptap/pm']
  },
  ssr: {
    noExternal: ['svelte-tiptap']
  }
});
