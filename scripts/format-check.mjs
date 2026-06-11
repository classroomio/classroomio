// Cross-platform Prettier check for the pre-commit hook (lefthook.yml).
// Replaces the previous shell one-liner, which used `xargs -0 -I{} sh -c '…'`
// and failed on Windows (`xargs: unknown option -- c`).
//
// Behavior: check only the *staged* files (the correct target for a pre-commit
// hook — the prior version diffed HEAD~1, i.e. the previous commit). Symlinks are
// skipped so Prettier never chokes on the CLAUDE.md -> AGENTS.md symlink.
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { createRequire } from 'node:module';

// Files staged for commit, excluding deletions. NUL-delimited to survive paths
// with spaces. -z pairs with the trailing split on '\0'.
const staged = execFileSync('git', ['diff', '--name-only', '-z', '--cached', '--diff-filter=d'], {
  encoding: 'utf8'
})
  .split('\0')
  .filter(Boolean)
  // Prettier errors on symlinks; the old hook filtered these with `[ ! -L "{}" ]`.
  .filter((file) => {
    try {
      return !lstatSync(file).isSymbolicLink();
    } catch {
      // Race: staged path no longer on disk. Let Prettier decide / skip it.
      return true;
    }
  });

if (staged.length === 0) {
  process.exit(0);
}

// Resolve Prettier's JS entry and run it with the current Node binary. This avoids
// spawning prettier.cmd / the .bin shim, which throws EINVAL on Windows without
// shell:true (Node's CVE-2024-27980 fix).
const require = createRequire(import.meta.url);
const prettierBin = require.resolve('prettier/bin/prettier.cjs');

// Batch to stay under the Windows command-line length limit (~32767 chars).
const BATCH_SIZE = 40;
let failed = false;

for (let i = 0; i < staged.length; i += BATCH_SIZE) {
  const batch = staged.slice(i, i + BATCH_SIZE);
  const result = spawnSync(process.execPath, [prettierBin, '--check', '--ignore-unknown', ...batch], {
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
