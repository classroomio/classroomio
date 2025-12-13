import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  plugins: [sveltekit()],
  build: {
    sourcemap: true
  },
  optimizeDeps: {
    entries: ['src/routes/**/+*.{js,ts,svelte}']
  },
  ssr: {
    noExternal: ['bits-ui', 'svelte-toolbelt', '@lucide/svelte', 'runed']
  },
  resolve: {
    mainFields: ['browser']
  }
});
