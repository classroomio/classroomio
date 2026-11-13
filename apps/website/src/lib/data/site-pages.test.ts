import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { NON_INDEXED_ROUTES, STATIC_SITE_PAGES } from './site-pages.ts';
import { UI_FEATURE_AREAS } from './ui-feature-map.ts';

const routesRoot = new URL('../../routes', import.meta.url).pathname;
const helpContentRoot = new URL('../../../../help/content/help', import.meta.url).pathname;

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const fullPath = join(directory, name);

    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

const staticRoutePaths = listFiles(routesRoot)
  .filter((file) => file.endsWith(`${sep}+page.svelte`))
  .map((file) => relative(routesRoot, file).split(sep).slice(0, -1))
  .filter((segments) => !segments.some((segment) => segment.startsWith('[')))
  .map((segments) => `/${segments.filter((segment) => !segment.startsWith('(')).join('/')}`);

const registeredPaths = new Set(STATIC_SITE_PAGES.map((page) => page.path));

for (const routePath of staticRoutePaths) {
  if (NON_INDEXED_ROUTES.includes(routePath)) continue;

  assert.ok(
    registeredPaths.has(routePath),
    `Page ${routePath} is not in STATIC_SITE_PAGES (src/lib/data/site-pages.ts). Add it so llms.txt and the sitemap list it.`
  );
}

for (const page of STATIC_SITE_PAGES) {
  assert.ok(
    page.title.trim().length > 0 && page.description.trim().length > 20,
    `${page.path} needs a title and description`
  );
}

assert.equal(registeredPaths.size, STATIC_SITE_PAGES.length, 'STATIC_SITE_PAGES has duplicate paths');

const seenArticles = new Set<string>();

for (const area of UI_FEATURE_AREAS) {
  for (const article of area.articles) {
    assert.ok(
      existsSync(join(helpContentRoot, `${article}.mdx`)),
      `${area.area}: help article ${article} does not exist in apps/help/content/help`
    );
    assert.ok(!seenArticles.has(article), `${article} appears in more than one feature area`);
    seenArticles.add(article);
  }
}

console.log(`checked ${staticRoutePaths.length} routes and ${seenArticles.size} mapped help articles`);
