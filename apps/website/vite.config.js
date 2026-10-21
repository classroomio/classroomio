import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

const useHttps = process.env.HTTPS === 'true' || process.env.VITE_USE_HTTPS_ON_LOCALHOST === 'true';
const host = process.env.HOST || (useHttps ? '0.0.0.0' : undefined);

export default defineConfig({
  server: {
    host
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  plugins: [sveltekit(), ...(useHttps ? [mkcert()] : [])],
  build: {
    sourcemap: true
  },
  optimizeDeps: {
    entries: ['src/routes/**/+*.{js,ts,svelte}']
  },
  ssr: {
    noExternal: ['bits-ui', 'svelte-toolbelt', '@lucide/svelte', 'runed', 'svelte-motion', 'svelte-inview']
  },
  resolve: {
    mainFields: ['browser']
  }
});
