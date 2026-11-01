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

## 4. Fact-check the commit against the docs

Every commit gets an independent fact-check before it is created. The code being checked is the change in this commit: the staged diff (`git diff --cached`).

Spin up a sub agent for it (the `Agent` tool; a read-only type such as `Explore` is enough). Do not do the check yourself, and do not hand the sub agent your summary of the change: it exists to catch what you assumed. Give it:

- the instruction to read the staged diff with `git diff --cached`
- where our docs live: `apps/docs/content/docs`, `apps/help/content/help`, `apps/website/src`, `README.md`, `packages/*/README.md`, `prd/`, and `apps/dashboard/src/lib/utils/translations/en.json` when the diff changes UI copy
- the task: for every user-visible behavior the diff adds, changes, or removes (UI labels and what a page shows or lets you do, flows, limits, plans, endpoints, scopes, error codes, env vars, commands), find the documentation statements that describe it and verify each one against the code, not against the diff alone. For a docs-only commit, verify each new or changed claim against the code instead.
- the output: per finding, the doc `file:line`, the quoted claim, what the code does, a verdict (inaccurate or accurate), and suggested replacement text; plus every screenshot that shows UI the diff changes. It must not edit files.

Then act on the report before committing:

- Fix every inaccurate statement and stage the doc fixes in the same commit.
- Recapture every screenshot that shows changed UI following `skills/add-docs-image/SKILL.md`. If one cannot be recaptured now, remove the reference rather than ship a stale image, and name it in the PR as outstanding.
- If fixing a finding changes code, run the fact-check again on the new diff.
- If the sub agent finds nothing, say so in your reply.

Skip this only for a commit that changes no product behavior or documentation: a clean merge commit, or a commit that only edits agent instruction files (`skills/`, `AGENTS.md`).

## 5. Pre-commit checks

Run these before creating the commit:

```bash
pnpm format:check
```

If staged changes include any file matching `packages/ui/src/**/*.{svelte,ts,tsx,js,jsx}`:

```bash
pnpm --filter @cio/ui prefix:check:staged
```

Fix any failures before proceeding.

## 6. Commit

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
