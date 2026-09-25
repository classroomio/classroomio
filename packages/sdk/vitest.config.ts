import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@cio/certificates': path.resolve(__dirname, '../certificates/src/index.ts'),
      '@cio/plugins': path.resolve(__dirname, '../../plugins/index.ts'),
      '@cio/sdk/layouts': path.resolve(__dirname, './src/layouts/index.ts'),
      '@cio/sdk': path.resolve(__dirname, './src/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
