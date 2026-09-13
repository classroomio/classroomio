import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import mkcert from 'vite-plugin-mkcert';

const useHttps = process.env.HTTPS === 'true' || process.env.VITE_USE_HTTPS_ON_LOCALHOST === 'true';
const host = process.env.HOST || (useHttps ? '0.0.0.0' : undefined);

export default defineConfig({
  server: { host },
  plugins: [sveltekit(), ...(useHttps ? [mkcert()] : [])],

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },

  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  }
});
