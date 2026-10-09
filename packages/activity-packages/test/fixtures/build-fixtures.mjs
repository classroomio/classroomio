import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)));
const sourcesDir = join(root, 'sources');

const packages = [
  'scorm12-minimal',
  'scorm2004-minimal',
  'scorm2004-three-modules',
  'scorm12-quiz-mastery',
  'streamed-launcher',
  'reject-external-launch',
  'reject-assets-only'
];

/**
 * Zips each hand-written source folder into test/fixtures/<name>.zip.
 * Throws when a source folder lacks imsmanifest.xml.
 */
export function buildFixtures() {
  const built = [];

  for (const name of packages) {
    const source = join(sourcesDir, name);
    const out = join(root, `${name}.zip`);

    if (!existsSync(join(source, 'imsmanifest.xml'))) {
      throw new Error(`missing imsmanifest.xml: ${source}`);
    }

    execFileSync('zip', ['-qrX', out, '.'], { cwd: source });
    built.push(out);
  }

  return built;
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const built = buildFixtures();

  for (const path of built) {
    console.log(`built ${path}`);
  }

  console.log(`sources: ${readdirSync(sourcesDir).join(', ')}`);
}
