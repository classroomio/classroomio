import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `package.json` sets `"type": "module"`, so Node resolves the built output as
 * ESM and refuses a relative import with no file extension. `tsc` emits these
 * specifiers unchanged, and nothing else in the build runs the entrypoint — so
 * an extensionless import here means the published image cannot start at all.
 */
describe('encoder ESM specifiers', () => {
  const sourceDirectory = join(__dirname);
  const files = readdirSync(sourceDirectory).filter((name) => name.endsWith('.ts'));

  it('finds the encoder sources', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s imports relative modules with a .js extension', (file) => {
    const contents = readFileSync(join(sourceDirectory, file), 'utf8');
    const specifiers = [...contents.matchAll(/from\s+'(\.[^']*)'/g)].map(([, specifier]) => specifier);

    for (const specifier of specifiers) {
      expect(specifier, `${file} imports "${specifier}" without a .js extension`).toMatch(/\.js$/);
    }
  });
});
