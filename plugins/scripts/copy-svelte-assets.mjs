import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(pluginRoot, 'dist');
const skippedDirectories = new Set(['dist', 'node_modules', 'scripts', 'tests']);

async function copySvelteFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        await copySvelteFiles(sourcePath);
      }

      continue;
    }

    if (!entry.isFile() || path.extname(entry.name) !== '.svelte') continue;

    const relativePath = path.relative(pluginRoot, sourcePath);
    const outputPath = path.join(outputRoot, relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await cp(sourcePath, outputPath);
  }
}

await copySvelteFiles(pluginRoot);
