#!/usr/bin/env node
// After `tsc && tsc-alias`, the emitted .d.ts files reference workspace deps
// through relative node_modules paths like `../../../node_modules/@cio/utils/dist/...`.
// Cross-package consumers (apps/api) then trip TS2742 because they see those
// types as a different copy of @cio/utils. Rewrite those references back to
// bare package specifiers so the .d.ts is portable across the workspace.

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

const PATTERNS = [
  // `../../../node_modules/@cio/utils/dist/validation/course/index.js`
  // -> `@cio/utils/validation/course`
  {
    regex: /(['"])(?:\.\.\/)+node_modules\/(@cio\/[a-z-]+)\/dist\/(.*?)(?:\/index)?\.js\1/g,
    replace: (_match, q, pkg, subpath) => `${q}${pkg}/${subpath}${q}`
  },
  // `.../node_modules/@cio/utils/dist/index.js` -> `@cio/utils`
  {
    regex: /(['"])(?:\.\.\/)+node_modules\/(@cio\/[a-z-]+)\/dist\/index\.js\1/g,
    replace: (_match, q, pkg) => `${q}${pkg}${q}`
  }
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...(await walk(full)));
    else if (entry.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

const files = await walk(DIST);
let touched = 0;
for (const file of files) {
  const before = await readFile(file, 'utf8');
  let after = before;
  for (const { regex, replace } of PATTERNS) after = after.replace(regex, replace);
  if (after !== before) {
    await writeFile(file, after);
    touched += 1;
  }
}
console.log(`restore-bare-specifiers: rewrote ${touched}/${files.length} files`);
