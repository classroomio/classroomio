import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  root: dirname,
  plugins: [tailwindcss(), svelte(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@cio/ui': path.resolve(dirname, 'node_modules/@cio/ui/src'),
      '@cio/ui/*': path.resolve(dirname, 'node_modules/@cio/ui/src/*'),
      $src: path.resolve(dirname, 'node_modules/@cio/ui/src')
    },
    conditions: ['svelte', 'browser', 'import']
  },
  optimizeDeps: {
    include: ['svelte-tiptap'],
    exclude: ['@tiptap/core', '@tiptap/pm']
  },
  build:
    command === 'build'
      ? {
          outDir: 'dist',
          emptyOutDir: true,
          cssCodeSplit: false,
          lib: {
            entry: path.resolve(dirname, 'src/widgets/question-type-picker/bootstrap.ts'),
            name: 'CIOEmbeds',
            formats: ['es'],
            fileName: () => 'question-type-picker.js'
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: false,
              // Hashed names so CDN/browser can cache chunks immutably; bootstrap entry stays `question-type-picker.js`.
              chunkFileNames: 'question-type-picker-[name]-[hash].js'
            }
          }
        }
      : {},
  server: {
    port: 5180
  }
}));
