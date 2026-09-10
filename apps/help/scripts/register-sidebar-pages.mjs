/**
 * Registers newly added content/help/**\/*.mdx pages into the matching group
 * of `navigation.sidebar` in blume.config.ts — otherwise a CMS-added page is
 * invisible in navigation until someone adds it by hand. Safe to automate
 * because the CMS can only add pages under an existing content/help/<folder>,
 * so a new page's target group is always determinable from its folder name.
 * New pages are appended at the end of their group; ordering isn't decided.
 *
 * Run from apps/help/: `node scripts/register-sidebar-pages.mjs [baseRef]`
 * (baseRef defaults to origin/main). Only touches blume.config.ts on disk —
 * see the "register" job in .github/workflows/help-cms.yml for commit/push.
 */
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind } from 'ts-morph';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: appRoot }).toString().trim();
const contentRoot = resolve(appRoot, 'content/help');
const configPath = resolve(appRoot, 'blume.config.ts');

// pnpm's `run <script> -- <args>` forwards the literal '--' through to argv, so skip it rather than assume a fixed index.
const baseRef = process.argv.slice(2).find((arg) => arg !== '--') ?? 'origin/main';

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
    if (!element.asKind(SyntaxKind.ObjectLiteralExpression)) continue;

    const found = findGroupInObject(element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression), folder);
    if (found) return found;
  }

  return null;
}

// navigation.sidebar is two levels deep, so items may hold nested groups.
function findGroupInObject(group, folder) {
  const itemsProp = group.getProperty('items');
  if (!itemsProp) return null;

  const itemsArray = itemsProp
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerOrThrow(SyntaxKind.ArrayLiteralExpression);
  const elements = itemsArray.getElements();

  const existingPaths = elements
    .filter((el) => el.asKind(SyntaxKind.StringLiteral))
    .map((el) => el.getText().slice(1, -1));
  if (existingPaths.some((path) => path === `/${folder}` || path.startsWith(`/${folder}/`))) {
    return itemsArray;
  }

  for (const el of elements) {
    const nestedGroup = el.asKind(SyntaxKind.ObjectLiteralExpression);
    if (!nestedGroup) continue;
    const found = findGroupInObject(nestedGroup, folder);
    if (found) return found;
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
  // ts-morph's inserted node doesn't inherit sibling indentation, so re-run Prettier.
  execFileSync('pnpm', ['exec', 'prettier', '--write', `"${configPath}"`], {
    cwd: repoRoot,
    stdio: 'inherit',
    // pnpm resolves to a .cmd shim on Windows, needing shell:true — which doesn't
    // quote args itself, hence the manual quotes above for paths containing spaces.
    shell: true
  });
  console.log('[help] Updated apps/help/blume.config.ts.');
} else {
  console.log('[help] No sidebar changes needed.');
}
