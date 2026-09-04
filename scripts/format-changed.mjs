import { lstatSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const prettierMode = process.argv.includes('--check') ? '--check' : '--write';
const stagedOnly = process.argv.includes('--staged');

function runGitCommand(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const errorOutput = result.stderr || result.stdout || `git ${args.join(' ')} failed`;
    throw new Error(errorOutput.trim());
  }

  return result.stdout;
}

function getChangedFiles() {
  const commands = stagedOnly
    ? [['diff', '--name-only', '-z', '--cached', '--diff-filter=ACMR']]
    : [
        ['diff', '--name-only', '-z', '--diff-filter=d'],
        ['diff', '--name-only', '-z', '--cached', '--diff-filter=d'],
        ['ls-files', '--others', '--exclude-standard', '-z']
      ];

  const filePaths = new Set();

  for (const args of commands) {
    const output = runGitCommand(args);
    const paths = output.split('\0').filter(Boolean);

    for (const filePath of paths) {
      filePaths.add(filePath);
    }
  }

  return [...filePaths].filter((filePath) => {
    try {
      return !lstatSync(filePath).isSymbolicLink();
    } catch {
      return false;
    }
  });
}

function runPrettier(filePaths) {
  const chunkSize = 200;

  for (let index = 0; index < filePaths.length; index += chunkSize) {
    const chunk = filePaths.slice(index, index + chunkSize);
    const quotedChunk = chunk.map((filePath) => `"${filePath}"`);
    const result = spawnSync('prettier', [prettierMode, '--ignore-unknown', ...quotedChunk], {
      cwd: process.cwd(),
      stdio: 'inherit',
      // On Windows, `prettier` resolves to a .cmd shim that spawnSync can't
      // exec directly without shell resolution — without this, the process
      // fails to launch at all (ENOENT) and exits non-zero with no output,
      // indistinguishable from a real formatting failure. shell:true doesn't
      // quote args for us, so paths are quoted manually below to survive a
      // repo root containing spaces.
      shell: true
    });

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  console.log('No changed files to format.');
  process.exit(0);
}

runPrettier(changedFiles);
