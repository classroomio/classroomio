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
const viteHref = pathToFileURL(path.join(viteDir, 'dist/node/index.js')).href;
const { build } = await import(viteHref);
const svelteDir = fs.realpathSync(path.join(repo, 'packages/ui/node_modules/svelte'));

await build({
  root: here,
  configFile: false,
  logLevel: 'warn',
  cacheDir: path.join(process.env.TMPDIR ?? '/tmp', 'cio-site-bundle-cache'),
  plugins: [svelte()],
  resolve: {
    alias: [{ find: /^svelte$/, replacement: `${svelteDir}/src/index-client.js` }],
    dedupe: ['svelte']
  },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: siteDir,
    emptyOutDir: false,
    minify: true,
    lib: { entry: path.join(here, 'entry.ts'), name: 'CioSiteBundle', formats: ['iife'], fileName: () => 'bundle.js' }
  }
});
console.log('built', path.join(siteDir, 'bundle.js'));
