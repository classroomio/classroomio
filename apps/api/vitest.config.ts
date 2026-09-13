import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Vite does not resolve the nested wildcard subpath exports that `@cio/core`
    // publishes (`./services/*/*`), so point those specifiers at the package
    // sources instead. Node resolves them fine, which is why only the test
    // runner needs this.
    alias: [
      { find: '@api', replacement: path.resolve(__dirname, 'src') },
      { find: /^@cio\/core\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/core/src') + '/$1' },
      { find: /^@cio\/core$/, replacement: path.resolve(__dirname, '../../packages/core/src/index.ts') },
      { find: /^@cio\/db\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db/src') + '/$1' },
      // `@cio/db` sources refer to themselves through this alias.
      { find: /^@db\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/db/src') + '/$1' }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
