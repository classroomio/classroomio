/**
 * Registers newly added content/help/**\/*.mdx pages into the matching group
 * of `navigation.sidebar` in blume.config.ts.
 *
 * Why this exists: navigation.sidebar is an explicit array — Blume does not
 * infer the sidebar from the content folder tree (see blume.config.ts's own
 * top comment) — so a page the CMS creates is otherwise invisible in
 * navigation until someone manually adds its path here. The CMS can only
 * ever add pages inside an EXISTING content/help/<folder>, never a new
 * folder, so a new page's target group is always determinable from its
 * folder name — that's what makes this safe to automate rather than needing
 * a human to decide where a page belongs.
 *
 * Deliberately does NOT decide ordering within a group beyond "append at the
 * end" — picking a smarter position would mean also reading every existing
 * page's frontmatter, and a slightly-out-of-order sidebar is a cosmetic,
 * easily-fixed-later problem, unlike a page that's silently missing from
 * navigation entirely.
 *
 * Run from apps/help/: `node scripts/register-sidebar-pages.mjs [baseRef]`
 * (baseRef defaults to origin/main). Only touches blume.config.ts on disk —
 * committing/pushing the result is the caller's job (see
 * .github/workflows/help-cms-register-pages.yml).
 */
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind } from 'ts-morph';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: appRoot }).toString().trim();
const contentRoot = resolve(appRoot, 'content/help');
const configPath = resolve(appRoot, 'blume.config.ts');

const baseRef = process.argv[2] ?? 'origin/main';

function findAddedMdxFiles() {
  const contentRootFromRepoRoot = relative(repoRoot, contentRoot).split(sep).join('/');
  const diffOutput = execFileSync(
    'git',
    ['diff', '--name-status', '--diff-filter=A', `${baseRef}...HEAD`, '--', contentRootFromRepoRoot],
    { cwd: repoRoot }
  ).toString();

  return diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t')[1])
    .filter((file) => file?.endsWith('.mdx'))
    .map((file) => resolve(repoRoot, file));
}

function toSitePath(absoluteFile) {
  const rel = relative(contentRoot, absoluteFile).split(sep).join('/');
  const withoutExt = rel.replace(/\.mdx$/, '');
  const segments = withoutExt.split('/');
  if (segments.at(-1) === 'index') segments.pop();
  return `/${segments.join('/')}`;
}

function folderOf(sitePath) {
  return sitePath.split('/').filter(Boolean)[0];
}

function getSidebarArray(sourceFile) {
  const defineConfigCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => call.getExpression().getText() === 'defineConfig');
  if (!defineConfigCall) {
    throw new Error('Could not find a defineConfig(...) call in blume.config.ts');
  }

  const configObject = defineConfigCall.getArguments()[0].asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const navigation = configObject
    .getPropertyOrThrow('navigation')
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow(SyntaxKind.ObjectLiteralExpression);
  const sidebar = navigation
    .getPropertyOrThrow('sidebar')
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow(SyntaxKind.ArrayLiteralExpression);

  return sidebar;
}

function findGroupForFolder(sidebarArray, folder) {
  for (const element of sidebarArray.getElements()) {
    if (!element.asKind(SyntaxKind.ObjectLiteralExpression)) continue; // skips the bare '/' entry

    const group = element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const itemsProp = group.getProperty('items');
    if (!itemsProp) continue;

    const itemsArray = itemsProp
      .asKindOrThrow(SyntaxKind.PropertyAssignment)
      .getInitializerOrThrow(SyntaxKind.ArrayLiteralExpression);
    const existingPaths = itemsArray.getElements().map((el) => el.getText().slice(1, -1));

    if (existingPaths.some((path) => path === `/${folder}` || path.startsWith(`/${folder}/`))) {
      return itemsArray;
    }
  }

  return null;
}

const addedFiles = findAddedMdxFiles();

if (addedFiles.length === 0) {
  console.log('[help] No newly added content/help/**/*.mdx files — nothing to register.');
  process.exit(0);
}

const project = new Project();
const sourceFile = project.addSourceFileAtPath(configPath);
const sidebarArray = getSidebarArray(sourceFile);

let changed = false;

for (const file of addedFiles) {
  const sitePath = toSitePath(file);
  const folder = folderOf(sitePath);
  const itemsArray = findGroupForFolder(sidebarArray, folder);

  if (!itemsArray) {
    console.warn(
      `[help] No existing sidebar group found for folder "${folder}" (page ${sitePath}) — leaving ` +
        'navigation.sidebar untouched for this page. This should not happen for a page added through ' +
        'the CMS, since it can only add pages under folders that already have a collection/group; ' +
        'register it in apps/help/blume.config.ts by hand.'
    );
    continue;
  }

  const existingPaths = itemsArray.getElements().map((el) => el.getText().slice(1, -1));
  if (existingPaths.includes(sitePath)) {
    console.log(`[help] ${sitePath} is already registered in navigation.sidebar — skipping.`);
    continue;
  }

  itemsArray.addElement(`'${sitePath}'`);
  changed = true;
  console.log(`[help] Registered ${sitePath} in its sidebar group.`);
}

if (changed) {
  sourceFile.saveSync();
  // ts-morph's inserted node doesn't inherit sibling indentation, so run the
  // project's own Prettier over the file rather than hand-rolling formatting
  // rules that would just drift from .prettierrc over time.
  execFileSync('pnpm', ['exec', 'prettier', '--write', `"${configPath}"`], {
    cwd: repoRoot,
    stdio: 'inherit',
    // pnpm resolves to a .cmd shim on Windows, which execFileSync can't
    // exec directly without shell resolution. shell:true doesn't quote args
    // for you, so a path containing spaces has to be quoted here manually.
    shell: true
  });
  console.log('[help] Updated apps/help/blume.config.ts.');
} else {
  console.log('[help] No sidebar changes needed.');
}
