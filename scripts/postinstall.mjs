// Cross-platform postinstall: install lefthook git hooks only when this is a
// git working copy (skips published-tarball / CI-without-git installs). Replaces
// the previous `test -d .git && lefthook install || true`, which relied on the
// Unix-only `test`/`true` builtins and failed on Windows cmd.exe.
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

if (existsSync('.git')) {
  try {
    execSync('lefthook install', { stdio: 'inherit' });
  } catch {
    // Git hooks are a dev convenience — never fail the install over them.
  }
}
