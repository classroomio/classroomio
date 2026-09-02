import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';

if (process.platform === 'win32') {
  console.log('kill-watchers only supports macOS/Linux, skipping.');
  process.exit(0);
}

const killAll = process.argv.includes('--all');
const repoRoot = realpathSync(process.cwd());

const WATCHER_PATTERNS = [/\btsc\b.*--watch/, /\btsx\b.*\bwatch\b/, /\bvite\b/, /\btailwindcss\b.*--watch/];

const psOutput = execFileSync('ps', ['-axo', 'pid=,command='], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024
});

const staleWatchers = [];

for (const line of psOutput.split('\n')) {
  const trimmedLine = line.trim();
  if (!trimmedLine) continue;

  const firstSpaceIndex = trimmedLine.indexOf(' ');
  const pid = Number(trimmedLine.slice(0, firstSpaceIndex));
  const command = trimmedLine.slice(firstSpaceIndex + 1).trim();

  if (!Number.isInteger(pid) || pid === process.pid) continue;
  if (!killAll && !command.includes(repoRoot)) continue;
  if (!WATCHER_PATTERNS.some((pattern) => pattern.test(command))) continue;

  staleWatchers.push({ pid, command });
}

if (staleWatchers.length === 0) {
  console.log('No leftover watcher processes found.');
  process.exit(0);
}

for (const watcher of staleWatchers) {
  try {
    process.kill(watcher.pid, 'SIGTERM');
    console.log(`Killed ${watcher.pid}: ${watcher.command}`);
  } catch (error) {
    if (error.code === 'ESRCH') continue;

    console.error(`Failed to kill ${watcher.pid}: ${error.message}`);
  }
}

console.log(`\nKilled ${staleWatchers.length} leftover watcher process(es) from this checkout.`);
console.log('Tip: run with --all to also stop watchers from other projects/checkouts.');
