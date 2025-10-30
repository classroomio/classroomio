import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
import registry from '../exports.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, '../package.json');
const viteConfigPath = path.resolve(__dirname, '../vite.config.js');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

// --- Build the entry object for Vite ---
const entryString = `{\n${registry
  .map((item) => `'${item.name}': path.resolve(__dirname, '${'./' + item.src}')`)
  .join(',\n')}\n      }`;

// --- Update exports in package.json ---
pkg.exports = {};
registry.forEach((item) => {
  if (item.name === 'index') {
    pkg.exports['.'] = {
      types: `./${item.src}`,
      import: `./dist/js/index.es`,
      require: `./dist/js/index.cjs`
    };

    return;
  }

  pkg.exports[`./${item.name}`] = {
    types: `./${item.src}`,
    import: `./dist/js/${item.name}.es`,
    require: `./dist/js/${item.name}.cjs`
  };
});
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// --- Update entry in vite.config.ts ---
let viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
viteConfig = viteConfig.replace(/const entry = [^;]+;/s, `const entry = ${entryString};`);
fs.writeFileSync(viteConfigPath, viteConfig);

console.log('✓ Synced exports in package.json and Vite entry!');
