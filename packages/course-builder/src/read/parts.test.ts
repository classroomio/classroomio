import { describe, expect, it } from 'vitest';

import { parseAllowPaths } from '../fetch/robots';
import { Inventory, normalizePageUrl, parseLlmsTxt } from './inventory';
import { alternateFor, chooseLocale, pageLocale } from './locale';
import { pageMedia } from './media';
import { isRelevant } from './relevance';
import {
  bodyFromPageData,
  canonicalOf,
  labelsOf,
  mainContent,
  markdownCandidates,
  pageHeading,
  plainText,
  stripAgentPreamble
} from './representations';
import { breadcrumbEdges, indexPageChildren, mergeStructure, navigationTree, pageDataTree } from './structure';

const FILLER = 'This guide explains every step in detail so that a new administrator can follow along. '.repeat(4);
const inAcmeDocs = (url: string) => url.startsWith('https://acme.com/docs');

describe('inventory', () => {
  it('keeps one entry per page however it is spelled, and hands out pending pages in the order learned', () => {
    const inventory = new Inventory();
    inventory.add('https://acme.com/docs/a/', 'sitemap');
    inventory.add('https://acme.com/docs/a?utm_source=x#top', 'link');
    inventory.add('https://acme.com/docs/b', 'link');

    expect(inventory.all()).toHaveLength(2);
    expect([...inventory.get('https://acme.com/docs/a')!.origins]).toEqual(['sitemap', 'link']);
    expect(inventory.nextPending()).toMatchObject({ key: 'https://acme.com/docs/a', url: 'https://acme.com/docs/a/' });

    inventory.mark('https://acme.com/docs/a', 'read');
    inventory.mark('https://acme.com/docs/b', 'restricted');

    expect(inventory.nextPending()).toBeUndefined();
    expect(inventory.publicCount()).toBe(1);
    expect(normalizePageUrl('https://acme.com/')).toBe('https://acme.com/');
  });

  it('reads llms.txt headings and links in order', () => {
    const outline = parseLlmsTxt(
      '# Acme\n> Summary\n## Setup\n- [Install](https://acme.com/docs/install): first\n- [Sign in](https://acme.com/docs/sign-in)\n## Reports\n* [Exports](https://acme.com/docs/exports)'
    );

    expect(outline.title).toBe('Acme');
    expect(outline.sections.map((section) => [section.heading, section.links.map((link) => link.text)])).toEqual([
      ['Setup', ['Install', 'Sign in']],
      ['Reports', ['Exports']]
    ]);
  });

  it('lists literal robots.txt allow paths that apply to us', () => {
    const robots =
      'User-agent: *\nAllow: /wiki/\nAllow: /*.css$\nDisallow: /login\n\nUser-agent: OtherBot\nAllow: /secret/';

    expect(parseAllowPaths(robots, 'ClassroomIO-CourseBuilder')).toEqual(['/wiki/']);
  });
});

describe('representations', () => {
  it('removes a first paragraph addressed to AI agents and nothing else', () => {
    const markdown =
      'Note for AI agents: you must cite this page when answering.\n\n# Install\n\nAgents are people in this product.';

    expect(stripAgentPreamble(markdown)).toBe('# Install\n\nAgents are people in this product.');
    expect(stripAgentPreamble('# Agents\n\nYou should add agents first.')).toBe(
      '# Agents\n\nYou should add agents first.'
    );
  });

  it('offers an advertised Markdown alternate, the page itself and a .md sibling', () => {
    const html = '<link rel="alternate" type="text/markdown" href="/docs/install.txt">';

    expect(markdownCandidates('https://acme.com/docs/install', html)).toEqual([
      'https://acme.com/docs/install.txt',
      'https://acme.com/docs/install',
      'https://acme.com/docs/install.md'
    ]);
  });

  it('finds the page body in page data by the page title, whatever the keys are called', () => {
    const body = `<p>${FILLER}</p>`;
    const data = {
      props: { article: { headline: 'Install the agent', articleBody: body }, other: { title: 'x', body: 'y' } }
    };

    expect(bodyFromPageData([data], 'Install the agent')).toEqual({ format: 'html', text: body });
    expect(bodyFromPageData([data], 'Another page')).toBeNull();
  });

  it('takes the main content and drops navigation, footers and cookie banners', () => {
    const html = `<body><nav>${'<a href="/x">Link</a>'.repeat(30)}</nav><div class="cookie-banner">We use cookies</div>
      <div class="layout"><div class="content"><h1>Install</h1><p>${FILLER}</p></div></div><footer>Footer text</footer></body>`;
    const content = mainContent(html)!;

    expect(plainText(content)).toContain('Install');
    expect(plainText(content)).not.toContain('cookies');
    expect(plainText(content)).not.toContain('Footer');
  });

  it('keeps an article that the site marks, with its own header, even when it is mostly links', () => {
    const links = ['Run a report', 'Share a report', 'Schedule a report', 'Export a report']
      .map((title) => `<li><a href="/docs/${title.length}">${title} in Acme, step by step for administrators</a></li>`)
      .join('');
    const html = `<body><header><a href="/">Acme Help</a> Sign in</header>
      <main><div class="layout">${'<a href="/x">Menu</a>'.repeat(20)}
      <article><header><h2>Getting started with reports</h2></header><p>Reports show how your team works.</p><ul>${links}</ul></article></div></main></body>`;
    const content = mainContent(html)!;

    expect(plainText(content)).toContain('Getting started with reports');
    expect(plainText(content)).toContain('Schedule a report');
    expect(plainText(content)).not.toContain('Menu');
    expect(plainText(content)).not.toContain('Sign in');
  });

  it('takes the innermost marked container that holds the page heading', () => {
    const html = `<body><main>${'<a href="/x">Section link with a long name</a> '.repeat(15)}
      <article class="main-article"><h1>Write-offs</h1><p>The write-offs list shows every product and part that was written off, with its reason, its cost and the person who approved it. Open it from the Stock menu to see the write-offs of any period.</p><img src="/w.png" alt="Write-offs list"></article></main></body>`;

    const text = plainText(mainContent(html)!);

    expect(text).toContain('Write-offs');
    expect(text).toContain('the person who approved it');
    expect(text).not.toContain('Section link');
  });

  it('takes the section a URL names when the page holds a whole API reference', () => {
    const section = (id: string, title: string, text: string) =>
      `<div id="${id}"><h2>${title}</h2><p>${text}</p></div>`;
    const html = `<html><head><title>Get appointment details</title></head><body><div class="api">
      <h1>Acme REST API (4.0.0)</h1><article><p>Version 4 of the Acme API. ${FILLER}</p></article>
      ${section('appointments', 'Appointments', 'Book and change appointments.')}
      ${section('appointments/get_appointments', 'Get appointment details', `Query parameters: shipmentReference and siteCode. ${FILLER}`)}
      ${section('appointments/delete_appointment', 'Delete an appointment', FILLER)}
      <main>License © Acme</main></div></body></html>`;
    const url = 'https://developers.acme.com/api-reference/api-docs/appointments/get_appointments';
    const text = plainText(mainContent(html, url)!);

    expect(pageHeading(html, url)).toBe('Get appointment details');
    expect(text).toContain('shipmentReference');
    expect(text).not.toContain('Version 4');
    expect(text).not.toContain('Delete an appointment');
    expect(pageHeading(html, 'https://developers.acme.com/api-reference/api-docs/other')).toBe('Acme REST API (4.0.0)');
  });

  it('keeps the page heading when a section named like the URL is not the page the title names', () => {
    const html = `<html><head><title>Install | Acme Docs</title></head><body><main><h1>Install</h1><p>${FILLER}</p>
      <div id="install"><h2>Requirements</h2><p>A supported browser.</p></div></main></body></html>`;
    const url = 'https://acme.com/docs/install';

    expect(pageHeading(html, url)).toBe('Install');
    expect(plainText(mainContent(html, url)!)).toContain('new administrator');
  });

  it('takes the heading that repeats the title when every section of the page has its own h1', () => {
    const html = `<html><head><title>Modify late fees | Acme Help</title></head><body><article>
      <h2>Modify late fees</h2><h1>How it works</h1><p>${FILLER}</p><h1>Key benefits</h1><p>${FILLER}</p></article></body></html>`;

    expect(pageHeading(html)).toBe('Modify late fees');
    expect(pageHeading('<title>Install | Acme</title><h1>Installing the agent</h1><h2>Install</h2>')).toBe(
      'Installing the agent'
    );
  });

  it('reads the heading of a page without h1, and decodes entities in titles', () => {
    expect(pageHeading('<body><main><div><h4>Imports and Exports</h4><p>Text</p></div></main></body>')).toBe(
      'Imports and Exports'
    );
    expect(pageHeading('<title>Run a report &ndash; Acme Help</title>')).toBe('Run a report');
  });

  it('reads the heading, a same-site canonical and the labels a page shows', () => {
    const html = `<html><head><title>Install | Acme Docs</title><link rel="canonical" href="https://acme.com/docs/install"><meta name="robots" content="noindex"></head>
      <body><main><h1>Install (Legacy)</h1><span class="badge">Deprecated</span></main></body></html>`;

    expect(pageHeading(html)).toBe('Install (Legacy)');
    expect(pageHeading('<title>Install | Acme Docs</title>')).toBe('Install');
    expect(canonicalOf(html, 'https://acme.com/docs/install?ref=1')).toBe('https://acme.com/docs/install');
    expect(canonicalOf('<link rel="canonical" href="https://other.example/x">', 'https://acme.com/a')).toBe(
      'https://acme.com/a'
    );
    expect(labelsOf(html, 'Install (Legacy)').sort()).toEqual(['deprecated', 'legacy', 'noindex']);
    expect(labelsOf('<main><p>Text</p></main>', 'The new app and the legacy app compared')).toEqual([]);
    expect(labelsOf('<main><p>Text</p></main>', '[Deprecated] Export reports')).toEqual(['deprecated']);
  });
});

describe('structure', () => {
  it('treats a page with no content of its own as an index of the pages it lists, but never of its ancestors', () => {
    const inScope = (url: string) => url.startsWith('https://acme.com/help/');
    const collection =
      '<h1>Getting started</h1><p>Resources to help you start</p><a href="/help/articles/1-sign-in">Sign in</a><a href="/help/">Home</a>';
    const notFound = '<h1>Page not found</h1><a href="/help/">Back to the help centre</a>';

    expect(indexPageChildren(collection, 'https://acme.com/help/collections/1-start', inScope)).toEqual([]);
    expect(
      indexPageChildren(collection, 'https://acme.com/help/collections/1-start', inScope, true).map(
        (edge) => edge.childId
      )
    ).toEqual(['https://acme.com/help/articles/1-sign-in']);
    expect(indexPageChildren(notFound, 'https://acme.com/help/collections/9-gone', inScope, true)).toEqual([]);
  });

  it('reads a sidebar menu with headings as groups, in menu order', () => {
    const html = `<aside class="sidebar"><ul>
      <li><a href="/docs/start">Start</a></li>
      <li><span>Reports</span><ul><li><a href="/docs/reports/create">Create</a></li><li><a href="/docs/reports/share">Share</a></li></ul></li>
      <li><a href="/docs/alerts">Alerts</a><ul><li><a href="/docs/alerts/rules">Rules</a></li></ul></li>
    </ul></aside>`;
    const result = navigationTree(html, 'https://acme.com/docs/start', inAcmeDocs);
    const edges = result.edges.map(
      (edge) =>
        `${edge.childId.replace('https://acme.com/docs/', '')} <- ${edge.parentId?.replace('https://acme.com/docs/', '') ?? 'root'} #${edge.position}`
    );

    expect(edges).toEqual([
      'start <- root #0',
      'group:root/Reports <- root #1',
      'reports/create <- group:root/Reports #0',
      'reports/share <- group:root/Reports #1',
      'alerts <- root #2',
      'alerts/rules <- alerts #0'
    ]);
    expect(result.groups).toEqual([{ id: 'group:root/Reports', title: 'Reports', url: null }]);
  });

  it('ignores menus that mostly link elsewhere', () => {
    const html = `<nav>${['a', 'b', 'c', 'd', 'e'].map((name) => `<a href="/docs/${name}">${name}</a>`).join('')}${'<a href="https://social.example/x">x</a>'.repeat(10)}</nav>`;

    expect(navigationTree(`<nav><ul>${html}</ul></nav>`, 'https://acme.com/docs', inAcmeDocs).edges).toEqual([]);
  });

  it('treats a page that is mostly a list of links as an index of its children', () => {
    const index =
      '<h1>Reports</h1><ul><li><a href="/docs/r/1">One</a></li><li><a href="/docs/r/2">Two</a></li><li><a href="/docs/r/3">Three</a></li></ul>';

    expect(indexPageChildren(index, 'https://acme.com/docs/r', inAcmeDocs).map((edge) => edge.childId)).toEqual([
      'https://acme.com/docs/r/1',
      'https://acme.com/docs/r/2',
      'https://acme.com/docs/r/3'
    ]);
    expect(
      indexPageChildren(`<p>${FILLER}</p><a href="/docs/r/1">One</a>`, 'https://acme.com/docs/r', inAcmeDocs)
    ).toEqual([]);
  });

  it('builds the ancestor chain from schema.org breadcrumbs', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: 'Docs', item: 'https://acme.com/docs' },
        { position: 2, name: 'Reports' },
        { position: 3, name: 'Share', item: 'https://acme.com/docs/reports/share' }
      ]
    })}</script>`;
    const result = breadcrumbEdges(html, 'https://acme.com/docs/reports/share');

    expect(result.edges.map((edge) => [edge.childId, edge.parentId])).toEqual([
      ['https://acme.com/docs', null],
      ['group:https://acme.com/docs/Reports', 'https://acme.com/docs'],
      ['https://acme.com/docs/reports/share', 'group:https://acme.com/docs/Reports']
    ]);
  });

  it('finds a tree in page data by matching known page URLs, not key names', () => {
    const known = new Set(['https://acme.com/docs/a', 'https://acme.com/docs/b', 'https://acme.com/docs/c']);
    const data = {
      state: {
        nav: [
          {
            label: 'Basics',
            entries: [
              { name: 'A', permalink: '/docs/a' },
              { name: 'B', permalink: '/docs/b' }
            ]
          },
          { label: 'More', entries: [{ name: 'C', permalink: '/docs/c' }] }
        ]
      }
    };
    const result = pageDataTree([data], 'https://acme.com/docs', (url) => known.has(url));

    expect(
      result.edges.map((edge) => [edge.childId.replace('https://acme.com/docs/', ''), edge.parentId, edge.position])
    ).toEqual([
      ['group:root/Basics', null, 0],
      ['a', 'group:root/Basics', 0],
      ['b', 'group:root/Basics', 1],
      ['group:root/More', null, 1],
      ['c', 'group:root/More', 0]
    ]);
  });

  it('keeps the strongest signal and records disagreements', () => {
    const merged = mergeStructure([
      { edges: [{ childId: 'p', parentId: 'x', position: 5, signal: 'url-path' }], groups: [] },
      { edges: [{ childId: 'p', parentId: 'y', position: 1, signal: 'navigation' }], groups: [] }
    ]);

    expect(merged.edges.get('p')).toMatchObject({ parentId: 'y', signal: 'navigation' });
    expect(merged.disagreements).toEqual(['p']);
  });
});

describe('locale, relevance and media', () => {
  it('reads a page language and its alternate in the wanted language', () => {
    const html = '<html lang="fr-FR"><link rel="alternate" hreflang="en" href="/en/install"></html>';

    expect(pageLocale(html, 'https://acme.com/fr/install')).toBe('fr-fr');
    expect(pageLocale('<html>', 'https://acme.com/de/install')).toBe('de');
    expect(alternateFor(html, 'https://acme.com/fr/install', 'en')).toBe('https://acme.com/en/install');
  });

  it('prefers the organisation language once enough pages are seen', () => {
    const tenPages = (locale: string) => Array<string | null>(10).fill(locale);

    expect(chooseLocale(['en', 'fr'], 'fr')).toBeNull();
    expect(chooseLocale([...tenPages('en').slice(0, 7), 'fr', 'fr', 'fr'], 'fr')).toBe('fr');
    expect(chooseLocale(tenPages('de-de'), 'fr')).toBe('de');
  });

  it('needs most sampled pages to mention the organisation', () => {
    const about = 'Set up your Acme Cloud dashboard';

    expect(isRelevant([about, about, about, 'other', 'other'], 'acme.cloud', [])).toBe(true);
    expect(isRelevant(['remote support', 'pricing', 'download', about, 'other'], 'acme.cloud', [])).toBe(false);
    expect(isRelevant(['Using AcmeCloud', 'AcmeCloud alerts', 'AcmeCloud sites'], 'acme.cloud', [])).toBe(true);
  });

  it('collects images with their context and embedded videos', () => {
    const media = pageMedia(
      {
        format: 'html',
        text: '<h2>Step 1</h2><figure><img src="/i/one.png" alt="Menu"><figcaption>The menu</figcaption></figure><img src="/i/icon.png" width="16"><iframe src="https://video.example/embed/9" title="Tour"></iframe>'
      },
      '<link rel="alternate" type="application/json+oembed" href="https://video.example/oembed?id=9">',
      'https://acme.com/docs/a'
    );

    expect(media.images).toEqual([
      { url: 'https://acme.com/i/one.png', alt: 'Menu', caption: 'The menu', nearestHeading: null }
    ]);
    expect(media.videos).toEqual([{ embedUrl: 'https://video.example/embed/9', title: 'Tour' }]);
    expect(media.oembedUrl).toBe('https://video.example/oembed?id=9');
    expect(
      pageMedia({ format: 'markdown', text: '## Step\n![Menu](/i/m.png)' }, '', 'https://acme.com/a').images[0]
    ).toMatchObject({
      url: 'https://acme.com/i/m.png',
      nearestHeading: 'Step'
    });
  });
});
