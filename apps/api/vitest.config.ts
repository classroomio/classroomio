import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './src'),
      '@db/drizzle': path.resolve(__dirname, '../../packages/db/src/drizzle.ts'),
      '@db/schema': path.resolve(__dirname, '../../packages/db/src/schema.ts'),
      '@db': path.resolve(__dirname, '../../packages/db/src'),
      '@cio/db': path.resolve(__dirname, '../../packages/db/src'),
      '@cio/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@cio/email': path.resolve(__dirname, '../../packages/email/src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
