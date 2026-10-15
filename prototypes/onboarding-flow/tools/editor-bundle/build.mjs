import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const siteDir = path.resolve(here, '../../site');

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
const uiSrc = path.join(repo, 'packages/ui/src');
const utilsSrc = path.join(repo, 'packages/utils/src');

const linkedModules = path.join(here, 'node_modules');

if (!fs.existsSync(linkedModules)) fs.symlinkSync(path.join(repo, 'packages/ui/node_modules'), linkedModules);

fs.copyFileSync(
  path.join(repo, 'apps/dashboard/src/lib/features/course/components/exercise/question-labels.ts'),
  path.join(here, 'shims/question-labels.generated.ts')
);

await build({
  root: here,
  configFile: false,
  logLevel: 'warn',
  cacheDir: path.join(process.env.TMPDIR ?? '/tmp', 'cio-editor-bundle-cache'),
  plugins: [svelte({ configFile: false })],
  resolve: {
    alias: [
      { find: /^svelte$/, replacement: `${svelteDir}/src/index-client.js` },
      { find: /^\$lib\/utils\/functions\/translations$/, replacement: path.join(here, 'shims/translations.ts') },
      { find: /^@vimeo\/player$/, replacement: path.join(here, 'shims/vimeo-player.ts') },
      { find: /^@cio\/utils$/, replacement: path.join(utilsSrc, 'index.ts') },
      { find: /^@cio\/utils\//, replacement: `${utilsSrc}/` },
      { find: /^\$src$/, replacement: uiSrc },
      { find: /^\$src\//, replacement: `${uiSrc}/` }
    ],
    dedupe: ['svelte']
  },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: siteDir,
    emptyOutDir: false,
    minify: true,
    cssCodeSplit: false,
    cssFileName: 'editor-bundle',
    lib: {
      entry: path.join(here, 'entry.ts'),
      name: 'CioEditorBundle',
      formats: ['iife'],
      fileName: () => 'editor-bundle.js'
    }
  }
});
console.log('built', path.join(siteDir, 'editor-bundle.js'));

const { execFileSync } = await import('node:child_process');

execFileSync(
  path.join(repo, 'packages/ui/node_modules/.bin/tailwindcss'),
  ['-i', path.join(here, 'frame.css'), '-o', path.join(siteDir, 'editor-frame.css'), '--minify'],
  { stdio: 'inherit' }
);
console.log('built', path.join(siteDir, 'editor-frame.css'));
