import adapter from '@sveltejs/adapter-auto';
import path from 'path';
import { fileURLToPath } from 'url';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({
    script: true
  }),

  kit: {
    adapter: adapter(),

    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
      '@cio/ui': path.resolve(__dirname, './node_modules/@cio/ui/src'),
      '@cio/ui/*': path.resolve(__dirname, './node_modules/@cio/ui/src/*')
    }
  }
};

export default config;
