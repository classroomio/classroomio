import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Integration tests that need a real Postgres database. Run with TEST_DATABASE_URL set
// (see `apps/api/package.json` → `test:db`); the regular `test` config excludes this folder.
export default defineConfig({
  resolve: {
    alias: [
      { find: '@api', replacement: path.resolve(__dirname, 'src') },
      { find: /^@cio\/core\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/core/src') + '/$1' },
      { find: /^@cio\/core$/, replacement: path.resolve(__dirname, '../../packages/core/src/index.ts') },
      { find: /^@cio\/db\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db/src') + '/$1' },
      { find: /^@cio\/utils\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/utils/src') + '/$1' },
      { find: '@cio/utils', replacement: path.resolve(__dirname, '../../packages/utils/src/index.ts') },
      { find: /^@db\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db/src') + '/$1' }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/db/**/*.db.test.ts'],
    setupFiles: ['src/__tests__/db/setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000
  }
});
