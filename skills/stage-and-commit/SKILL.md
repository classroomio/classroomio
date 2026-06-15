---
name: stage-and-commit
description: Stage changed files and create a commit following the repo's translation, formatting, and git workflow rules. Use when the user asks to stage, commit, or both.
---

Follow these steps in order. Do not skip steps or reorder them.

## 1. Translations (if applicable)

If `apps/dashboard/src/lib/utils/translations/en.json` is among the changed files:

```bash
cd apps/dashboard && pnpm translate
```

After running, review the generated locale files and verify that any placeholders wrapped in `{}` were preserved exactly. Fix translated variable names if needed before continuing.

## 2. Format changed files

Run the changed-file formatter from the repo root:

```bash
pnpm format:changed
```

If any files under `packages/ui/src/**` were changed, also run the UI prefix fixer first:

```bash
pnpm --filter @cio/ui prefix
```

Then re-run `pnpm format:changed` after the prefix fix.

## 3. Stage files

Stage only the files relevant to the task. Prefer explicit paths over broad commands:

```bash
git add path/to/file1 path/to/file2
```

Never use `git add -A` or `git add .` — those risk accidentally staging unrelated files, env files, or large binaries.

## 4. Pre-commit checks

Run these before creating the commit:

```bash
pnpm format:check
```

If staged changes include any file matching `packages/ui/src/**/*.{svelte,ts,tsx,js,jsx}`:

```bash
pnpm --filter @cio/ui prefix:check:staged
```

Fix any failures before proceeding.

## 5. Commit

Commit messages must follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>[optional scope]: <description>

[optional body]
```

Common types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`.

**Never** add `Co-Authored-By` trailers for Claude, Cursor, Codex, or any other AI tool.

```bash
git commit -m "$(cat <<'EOF'
type(scope): short description

Optional longer body if needed.
EOF
)"
```
