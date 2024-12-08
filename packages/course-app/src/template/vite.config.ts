import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [sveltekit()],
  resolve: {
    conditions: mode === 'test' ? ['browser'] : []
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    deps: {
      inline: [/^svelte/]
    },
    // Add these configurations
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/**/*.spec.*']
    },
    // Add path aliases to match SvelteKit's
    alias: {
      $lib: path.resolve('./src/lib'),
      $app: path.resolve('./src/mocks')
    }
  },
  optimizeDeps: {
    entries: ['src/routes/**/+*.{js,ts,svelte}']
  }
}));
