import * as path from 'path';

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import mkcert from 'vite-plugin-mkcert';

const useHttps = process.env.HTTPS === 'true' || process.env.VITE_USE_HTTPS_ON_LOCALHOST === 'true';
const host = process.env.HOST || (useHttps ? '0.0.0.0' : undefined);

export default defineConfig({
  server: { host },
  plugins: [tailwindcss(), svelte(), ...(useHttps ? [mkcert()] : [])],
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
