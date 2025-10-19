import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  resolve: {
    alias: {
      '@lib': resolve(__dirname, './src/lib')
    }
  }
});
