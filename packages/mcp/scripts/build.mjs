import { build } from 'esbuild';

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
  banner: {
    js: '#!/usr/bin/env node'
  }
});
