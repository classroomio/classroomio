import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLUGS } from './src/site.mjs';
import { layout } from './src/layout.mjs';
import { competitorPage } from './src/sections.mjs';
import { staticPages } from './src/pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

function write(file, html) {
  const target = path.join(here, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  return file;
}

const written = [];

for (const slug of SLUGS) {
  const { default: content } = await import(`./src/content/${slug}.mjs`);
  const page = competitorPage(slug, content, '../');
  const html = layout({
    title: page.title,
    description: page.description,
    root: '../',
    current: 'Solutions',
    currentSlug: slug,
    body: page.body,
    head: page.head,
    minimal: true
  });
  written.push(write(`alternatives/${slug}.html`, html));
}

for (const page of staticPages()) {
  const html = layout({
    title: page.title,
    description: page.description,
    root: page.root,
    current: page.current,
    body: page.body
  });
  written.push(write(page.file, html));
}

console.log(`Wrote ${written.length} pages`);
