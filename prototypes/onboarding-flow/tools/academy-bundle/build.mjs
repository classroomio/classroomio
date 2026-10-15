/*
 * Builds the public academy + learner bundle from the repo's own Svelte sources:
 *   site/academy.js          Svelte components + runtime (window.CioAcademy)
 *   site/academy.css         the components' scoped styles
 *   site/academy-tw.css      Tailwind (unprefixed) for the classes written in this folder, as the dashboard has it
 *   site/academy-ui.css      the @cio/ui build (ui: prefix) plus the ui: classes written in this folder
 * Run: node tools/academy-bundle/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const siteDir = path.resolve(here, '../../site');
const uiSrc = path.join(repo, 'packages/ui/src');
const utilsSrc = path.join(repo, 'packages/utils/src');

function esmEntry(baseDir, name) {
  const pkgDir = fs.realpathSync(path.join(baseDir, 'node_modules', name));
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  const dot = pkg.exports?.['.'];
  const rel =
    typeof dot === 'string' ? dot : (dot?.import?.default ?? dot?.import ?? dot?.default ?? pkg.module ?? pkg.main);

  return pathToFileURL(path.join(pkgDir, rel)).href;
}

const { svelte } = await import(esmEntry(path.join(repo, 'packages/ui'), '@sveltejs/vite-plugin-svelte'));
const pluginDir = fs.realpathSync(path.join(repo, 'packages/ui/node_modules/@sveltejs/vite-plugin-svelte'));
const viteDir = path.resolve(pluginDir, '../../vite');
const { build } = await import(pathToFileURL(path.join(viteDir, 'dist/node/index.js')).href);
const svelteDir = fs.realpathSync(path.join(repo, 'packages/ui/node_modules/svelte'));

await build({
  root: here,
  configFile: false,
  logLevel: 'warn',
  cacheDir: path.join(process.env.TMPDIR ?? '/tmp', 'cio-academy-bundle-cache'),
  plugins: [svelte({ configFile: false })],
  resolve: {
    alias: [
      { find: /^svelte$/, replacement: `${svelteDir}/src/index-client.js` },
      { find: /^@vimeo\/player$/, replacement: path.join(here, 'shims/vimeo-player.ts') },
      { find: /^\$src$/, replacement: uiSrc },
      { find: /^\$src\//, replacement: `${uiSrc}/` },
      { find: /^@cio\/ui$/, replacement: path.join(uiSrc, 'index.ts') },
      { find: /^@cio\/ui\//, replacement: `${uiSrc}/` },
      { find: /^\$src$/, replacement: uiSrc },
      { find: /^\$src\//, replacement: `${uiSrc}/` },
      { find: /^@cio\/utils$/, replacement: path.join(utilsSrc, 'index.ts') },
      { find: /^@cio\/utils\//, replacement: `${utilsSrc}/` }
    ],
    dedupe: ['svelte']
  },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: siteDir,
    emptyOutDir: false,
    minify: true,
    cssCodeSplit: false,
    lib: {
      entry: path.join(here, 'entry.ts'),
      name: 'CioAcademyBundle',
      formats: ['iife'],
      fileName: () => 'academy.js',
      cssFileName: 'academy'
    }
  }
});

const tailwind = path.join(repo, 'packages/ui/node_modules/.bin/tailwindcss');
const tailwindIndex = path.join(fs.realpathSync(path.join(repo, 'packages/ui/node_modules/tailwindcss')), 'index.css');
const unprefixedInput = path.join(here, '.tw-input.css');

fs.writeFileSync(unprefixedInput, fs.readFileSync(path.join(here, 'tw.css'), 'utf8').replace("'tailwindcss'", `'${tailwindIndex}'`));

for (const [input, output] of [
  [unprefixedInput, 'academy-tw.css'],
  [path.join(here, 'ui.css'), 'academy-ui.css']
]) {
  execFileSync(tailwind, ['-i', input, '-o', path.join(siteDir, output), '--minify'], {
    stdio: ['ignore', 'ignore', 'inherit']
  });
}

fs.rmSync(unprefixedInput);

console.log('built academy bundle in', siteDir);
