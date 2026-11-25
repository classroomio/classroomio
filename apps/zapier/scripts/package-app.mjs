import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPPORTED_ACTIONS = new Set(['build', 'push', 'upload']);
const PLATFORM_PACKAGE = 'zapier-platform-core';
const APP_DIR = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const CLI_PATH = join(APP_DIR, 'node_modules/zapier-platform-cli/src/bin/run');
const BUNDLE_PATH = join(APP_DIR, 'dist/index.js');
const LINKED_APP_PATH = join(APP_DIR, '.zapierapprc');
const BUILD_DIR_NAME = 'build';

const [action = 'build', ...cliArguments] = process.argv.slice(2);

if (!SUPPORTED_ACTIONS.has(action)) {
  throw new Error(`Usage: package-app.mjs <${[...SUPPORTED_ACTIONS].join('|')}> [...zapier-platform flags]`);
}

if (!existsSync(BUNDLE_PATH)) {
  throw new Error('Run the build script before packaging the Zapier app.');
}

const appPackage = JSON.parse(readFileSync(join(APP_DIR, 'package.json'), 'utf8'));
const platformVersion = appPackage.dependencies?.[PLATFORM_PACKAGE];

if (!platformVersion) {
  throw new Error(`${PLATFORM_PACKAGE} must be a runtime dependency of the Zapier app.`);
}

const stagingDir = mkdtempSync(join(tmpdir(), 'classroomio-zapier-'));

try {
  writeFileSync(
    join(stagingDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'classroomio',
        version: appPackage.version,
        private: true,
        type: 'module',
        main: 'index.js',
        exports: './index.js',
        dependencies: { [PLATFORM_PACKAGE]: platformVersion }
      },
      null,
      2
    )}\n`
  );
  cpSync(BUNDLE_PATH, join(stagingDir, 'index.js'));
  writeFileSync(join(stagingDir, '.gitignore'), 'node_modules/\n');

  if (existsSync(LINKED_APP_PATH)) {
    cpSync(LINKED_APP_PATH, join(stagingDir, '.zapierapprc'));
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execFileSync(npmCommand, ['install', '--omit=dev', '--no-audit', '--no-fund', '--loglevel=error'], {
    cwd: stagingDir,
    stdio: 'inherit'
  });

  execFileSync(process.execPath, [CLI_PATH, action, '--skip-dep-install', ...cliArguments], {
    cwd: stagingDir,
    stdio: 'inherit'
  });

  const buildArtifacts = join(stagingDir, BUILD_DIR_NAME);

  if (existsSync(buildArtifacts)) {
    cpSync(buildArtifacts, join(APP_DIR, BUILD_DIR_NAME), { recursive: true });
  }
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
