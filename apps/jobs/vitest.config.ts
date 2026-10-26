import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [{ find: /^@cio\/core\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/core/src') + '/$1' }]
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
