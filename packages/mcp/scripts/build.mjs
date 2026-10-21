import { readFileSync } from 'node:fs';

import { build } from 'esbuild';

// Injected rather than imported: rootDir is src/, so package.json is out of
// bounds for the compiler, and the published bundle is a single file with no
// package.json beside it to read at runtime.
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  minify: true,
  sourcemap: false,
  external: ['@modelcontextprotocol/sdk', 'zod'],
  define: {
    __MCP_VERSION__: JSON.stringify(version)
  },
  banner: {
    js: '#!/usr/bin/env node'
  }
});
