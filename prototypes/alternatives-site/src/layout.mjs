import crypto from 'node:crypto';
import fs from 'node:fs';
import { esc, ic } from './ui.mjs';
import { SLUGS, COMPETITORS, CHECKED } from './site.mjs';

function assetVersion(file) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url));
  return crypto.createHash('sha1').update(source).digest('hex').slice(0, 8);
}

const CSS_VERSION = assetVersion('assets/css/site.css');
const JS_VERSION = assetVersion('assets/js/site.js');

const MENUS = [
  {
    id: 'menu-product',
    label: 'Product',
    items: [
      ['Course builder', 'Draft, edit and organize courses', 'product.html#create'],
      ['Branded academy', 'Your domain, your colors', 'product.html#academy'],
      ['Analytics', 'See who is learning', 'product.html#analytics']
    ]
  },
  {
    id: 'menu-solutions',
    label: 'Solutions',
    items: [
      ['Customer education', 'Teach customers your product', 'solutions.html'],
      ['Compare platforms', 'Alternatives to nine platforms', 'alternatives/index.html']
    ]
  }
];

const RESOURCES = {
  id: 'menu-resources',
  label: 'Resources',
  items: [
    ['Articles', 'Guides for customer education teams', 'resources.html'],
    ['Alternatives', 'Compare before you switch', 'alternatives/index.html']
  ]
};

function nav(root, current) {
  const menu = (entry) => `<div class="nav-item">
      <button class="nav-link" data-menu aria-expanded="false" aria-controls="${entry.id}" ${current === entry.label ? 'aria-current="page"' : ''}>${entry.label}${ic('chevron')}</button>
      <div class="menu" id="${entry.id}">${entry.items
        .map(([title, text, href]) => `<a href="${root}${href}"><b>${title}</b><span>${text}</span></a>`)
        .join('')}</div>
    </div>`;
  const mobileGroup = (entry) =>
    `<details><summary>${entry.label}</summary>${entry.items.map(([title, , href]) => `<a href="${root}${href}">${title}</a>`).join('')}</details>`;
  return `<header class="nav">
  <div class="wrap nav-in">
    <a class="logo" href="${root}index.html" aria-label="ClassroomIO home"><img src="${root}assets/img/logo-mark.svg" alt="" />classroomio</a>
    <nav class="nav-links" aria-label="Main">
      ${menu(MENUS[0])}${menu(MENUS[1])}
      <div class="nav-item"><a class="nav-link" href="${root}pricing.html" ${current === 'Pricing' ? 'aria-current="page"' : ''}>Pricing</a></div>
      ${menu(RESOURCES)}
    </nav>
    <div class="nav-cta">
      <a class="btn secondary" href="${root}demo.html">Book a demo</a>
      <a class="btn primary" href="${root}get-started.html">Get started</a>
    </div>
    <button class="burger" data-burger aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">${ic('menu')}</button>
  </div>
  <div class="mobile-nav" id="mobile-nav">
    ${mobileGroup(MENUS[0])}${mobileGroup(MENUS[1])}
    <a href="${root}pricing.html">Pricing</a>
    ${mobileGroup(RESOURCES)}
    <a class="btn primary" href="${root}get-started.html">Get started</a>
    <a class="btn secondary" href="${root}demo.html">Book a demo</a>
  </div>
</header>`;
}

function footer(root, currentSlug) {
  const alt = SLUGS.map(
    (slug) =>
      `<li><a href="${root}alternatives/${slug}.html" ${slug === currentSlug ? 'aria-current="page" style="color:var(--blue)"' : ''}>${COMPETITORS[slug].name} alternatives</a></li>`
  ).join('');
  return `<footer class="footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand"><a class="logo" href="${root}index.html"><img src="${root}assets/img/logo-mark.svg" alt="" />classroomio</a><p>Customer education software for SaaS teams. Courses, a branded academy and learner analytics.</p></div>
      <div><h4>Product</h4><ul>
        <li><a href="${root}product.html">Product overview</a></li>
        <li><a href="${root}solutions.html">Customer education</a></li>
        <li><a href="${root}pricing.html">Pricing</a></li>
        <li><a href="${root}get-started.html">Get started</a></li>
        <li><a href="${root}demo.html">Book a demo</a></li>
      </ul></div>
      <div><h4>Resources</h4><ul>
        <li><a href="${root}resources.html">Articles</a></li>
        <li><a href="${root}alternatives/index.html">All alternatives</a></li>
      </ul></div>
      <div><h4>Compare platforms</h4><ul class="foot-alt">${alt}</ul></div>
    </div>
    <div class="foot-note"><span>Design prototype for review. Mockups are illustrative, not product screenshots.</span><span>Competitor details last checked ${CHECKED}.</span></div>
  </div>
</footer>`;
}

function simpleNav(root) {
  return `<header class="nav">
  <div class="wrap nav-in">
    <a class="logo" href="${root}index.html" aria-label="ClassroomIO home"><img src="${root}assets/img/logo-mark.svg" alt="" />classroomio</a>
    <div class="nav-cta nav-cta-solo">
      <a class="btn primary" href="${root}get-started.html">Get started</a>
    </div>
  </div>
</header>`;
}

function simpleFooter() {
  return `<footer class="footer footer-simple">
  <div class="wrap">
    <div class="foot-note foot-note-solo"><span>Design prototype for review. Mockups are illustrative, not product screenshots.</span><span>Competitor details last checked ${CHECKED}.</span></div>
  </div>
</footer>`;
}

export function layout({ title, description, root, current, currentSlug, body, head = '', minimal = false }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="noindex" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<link rel="icon" href="${root}assets/img/logo-mark.svg" type="image/svg+xml" />
<link rel="preload" href="${root}assets/fonts/Geist-Variable-latin.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="${root}assets/css/site.css?v=${CSS_VERSION}" />
${head}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${minimal ? simpleNav(root) : nav(root, current)}
<main id="main">
${body}
</main>
${minimal ? simpleFooter() : footer(root, currentSlug)}
<script src="${root}assets/js/site.js?v=${JS_VERSION}"></script>
</body>
</html>
`;
}
