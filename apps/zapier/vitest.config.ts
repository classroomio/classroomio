import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@cio\/utils\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/utils/src') + '/$1' },
      { find: '@cio/utils', replacement: path.resolve(__dirname, '../../packages/utils/src/index.ts') }
    ]
  },
  test: {
    globals: true,
    environment: 'node'
  }
});
