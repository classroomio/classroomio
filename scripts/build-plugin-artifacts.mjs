import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = process.cwd();
const candidateRoots = [
  process.env.OFFICIAL_PLUGINS_PATH,
  path.resolve(repositoryRoot, '../classroomio-plugins'),
  path.resolve(repositoryRoot, '../../classroomio-plugins'),
  path.resolve(repositoryRoot, 'classroomio-plugins'),
  path.resolve(repositoryRoot, 'official-plugins')
].filter(Boolean);

const pluginsRepoRoot = candidateRoots.find((dir) => fs.existsSync(dir));
if (!pluginsRepoRoot) {
  console.error('Could not find classroomio-plugins repository.');
  console.error(
    'Please ensure the classroomio-plugins repository is located in your Dev folder or set OFFICIAL_PLUGINS_PATH.'
  );
  process.exit(1);
}

console.log(`Building plugin artifacts in ${pluginsRepoRoot}...`);
const result = spawnSync('pnpm', ['run', 'build:artifacts'], {
  cwd: pluginsRepoRoot,
  stdio: 'inherit'
});

process.exit(result.status ?? 0);
