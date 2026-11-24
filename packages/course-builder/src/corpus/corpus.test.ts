import { describe, expect, it } from 'vitest';

import type { SourcePage } from '../sources/types';
import { buildCorpus, MIN_MEDIA_PAGE_WORDS, MIN_PAGE_WORDS, teachablePages, titleKey } from './corpus';

const LONG_TEXT =
  'A dashboard groups the numbers your team watches, so everyone reads the same figures instead of rebuilding them.';

function page(overrides: Partial<SourcePage> & { id: string; title: string }): SourcePage {
  const { id, title, ...rest } = overrides;

  return {
    id,
    title,
    url: rest.url ?? `https://acme.com/docs/${id}`,
    kind: 'page',
    summary: null,
    labels: [],
    parentId: null,
    position: null,
    order: 0,
    depth: 0,
    path: [],
    updatedAt: null,
    locale: 'en',
    content: {
      format: 'html',
      text: `<main><h1>${title}</h1><p>${LONG_TEXT} ${LONG_TEXT} ${LONG_TEXT} ${LONG_TEXT}</p></main>`
    },
    ...rest
  };
}

function withOrder(pages: SourcePage[]): SourcePage[] {
  return pages.map((entry, index) => ({ ...entry, order: index }));
}

describe('corpus', () => {
  it('builds ordered blocks with stable ids and a word count per page', () => {
    const corpus = buildCorpus(withOrder([page({ id: 'dashboards', title: 'Dashboards' })]), 'en');
    const [dashboard] = corpus.pages;

    expect(dashboard.blocks.map((block) => block.kind)).toEqual(['heading', 'paragraph']);
    expect(dashboard.blocks[0].id).toMatch(/^[0-9a-f]{8}-0-[0-9a-f]{8}$/);
    expect(dashboard.contentHash).toMatch(/^[0-9a-f]{16}$/);
    expect(dashboard.wordCount).toBeGreaterThan(20);
    expect(dashboard.excluded).toBeNull();
  });

  it('keeps a block id while its text is unchanged and changes it when the text changes', () => {
    const before = buildCorpus(withOrder([page({ id: 'dashboards', title: 'Dashboards' })]), 'en').pages[0];
    const same = buildCorpus(withOrder([page({ id: 'dashboards', title: 'Dashboards' })]), 'en').pages[0];
    const edited = buildCorpus(
      withOrder([
        page({
          id: 'dashboards',
          title: 'Dashboards',
          content: {
            format: 'html',
            text: `<main><h1>Dashboards</h1><p>${LONG_TEXT} ${LONG_TEXT} ${LONG_TEXT} Charts are widgets.</p></main>`
          }
        })
      ]),
      'en'
    ).pages[0];

    expect(same.blocks[0].id).toBe(before.blocks[0].id);
    expect(edited.blocks[1].id).not.toBe(before.blocks[1].id);
  });

  it('excludes obsolete, placeholder, release, legal and community pages with their reason', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'old', title: 'Data sources [Deprecated]' }),
        page({ id: 'empty', title: 'Test' }),
        page({ id: 'notes', title: 'Release notes 4.2' }),
        page({ id: 'legal', title: 'Privacy policy', url: 'https://acme.com/privacy' }),
        page({ id: 'chat', title: 'Getting started', url: 'https://acme.com/community/getting-started' }),
        page({ id: 'labels', title: 'Exports', labels: ['Archived'] }),
        page({ id: 'good', title: 'Reports' })
      ]),
      'en'
    );

    expect(Object.fromEntries(corpus.pages.map((entry) => [entry.pageId, entry.excluded]))).toEqual({
      old: 'obsolete',
      empty: 'placeholder',
      notes: 'release-notes',
      legal: 'legal-or-company',
      chat: 'community',
      labels: 'obsolete',
      good: null
    });
    expect(corpus.pages.find((entry) => entry.pageId === 'notes')?.referenceOnly).toBe(true);
    expect(corpus.excluded.obsolete).toBe(2);
    expect(teachablePages(corpus).map((entry) => entry.pageId)).toEqual(['good']);
  });

  it('recognises release pages by a version-number title or a releases section, not by the verb', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'r1', title: 'Release 7.3' }),
        page({ id: 'r2', title: 'Acme Release 12.1.1' }),
        page({ id: 'r3', title: 'Highlights', path: ['Home', 'Release Content'] }),
        page({ id: 'verb', title: 'Release a hold on an order' }),
        page({ id: 'api', title: 'Version 2.0 overview' })
      ]),
      'en'
    );

    expect(Object.fromEntries(corpus.pages.map((entry) => [entry.pageId, entry.excluded]))).toEqual({
      r1: 'release-notes',
      r2: 'release-notes',
      r3: 'release-notes',
      verb: null,
      api: null
    });
  });

  it('drops pages in another language and pages too short to teach', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'fr', title: 'Tableaux de bord', locale: 'fr' }),
        page({ id: 'stub', title: 'Coming soon', content: { format: 'html', text: '<main><h1>Soon</h1></main>' } }),
        page({ id: 'good', title: 'Reports' })
      ]),
      'en'
    );

    expect(Object.fromEntries(corpus.pages.map((entry) => [entry.pageId, entry.excluded]))).toEqual({
      fr: 'other-locale',
      stub: 'too-short',
      good: null
    });
    expect(corpus.pages.find((entry) => entry.pageId === 'stub')!.wordCount).toBeLessThan(MIN_PAGE_WORDS);
  });

  it('counts only the words a page says itself, so a repeated title, a bare link and related links lift no stub', () => {
    const stub = page({
      id: 'stub',
      title: 'Supported providers',
      content: {
        format: 'html',
        text: `<main><h1>Supported providers</h1><p>The providers we support are in this spreadsheet.</p>
          <p>https://files.acme.example/providers.xlsx</p>
          <h2>Related articles</h2><ul>${[
            'Connect an account',
            'Fix a failed login',
            'Move an account',
            'Remove an account'
          ]
            .map((title, index) => `<li><a href="/docs/related-${index}">${title} to another site</a></li>`)
            .join('')}</ul></main>`
      }
    });

    const [entry] = buildCorpus(withOrder([stub]), 'en').pages;

    expect(entry.wordCount).toBe(8);
    expect(entry.excluded).toBe('too-short');
  });

  it('treats a page whose own text is a short caption around an embedded video as too short', () => {
    const caption =
      'Learn how crews log equipment hours, track maintenance and report where each machine is working this week.';
    const video = page({
      id: 'video',
      title: 'Webinar: equipment',
      content: {
        format: 'markdown',
        text: `# Webinar: equipment\n\n## About this webinar\n\n${caption} ${caption}\n\nhttps://video.acme.example/embed/1234\n`
      }
    });
    const guide = page({
      id: 'guide',
      title: 'Track equipment',
      content: {
        format: 'markdown',
        text: `# Track equipment\n\n${`${caption} `.repeat(5)}\n\nhttps://video.acme.example/embed/5678\n`
      }
    });

    const corpus = buildCorpus(withOrder([video, guide]), 'en');

    expect(corpus.pages.map((entry) => [entry.pageId, entry.wordCount < MIN_MEDIA_PAGE_WORDS, entry.excluded])).toEqual(
      [
        ['video', true, 'too-short'],
        ['guide', false, null]
      ]
    );
  });

  it('keeps the newer page where a replacement exists and excludes the older one', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'old', title: 'Anomaly conditions (OBSOLETE)' }),
        page({ id: 'previous', title: 'Dashboards', updatedAt: '2024-02-01T00:00:00Z' }),
        page({ id: 'current', title: 'Dashboards - NEW', updatedAt: '2026-05-01T00:00:00Z' })
      ]),
      'en'
    );

    expect(corpus.pages.find((entry) => entry.pageId === 'previous')?.excluded).toBe('obsolete');
    expect(corpus.pages.find((entry) => entry.pageId === 'current')?.excluded).toBeNull();
    expect(titleKey('Dashboards - NEW')).toBe(titleKey('Dashboards'));
  });

  it('keeps one page where two carry the same cleaned text, preferring reading order', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'first', title: 'Reports' }),
        page({ id: 'copy', title: 'Reports', url: 'https://acme.com/docs/reports-copy' }),
        page({ id: 'other', title: 'Dashboards' })
      ]),
      'en'
    );

    expect(corpus.pages.map((entry) => [entry.pageId, entry.excluded])).toEqual([
      ['first', null],
      ['copy', 'duplicate'],
      ['other', null]
    ]);
  });

  it('returns pages in reading order whatever order they were read in', () => {
    const corpus = buildCorpus(
      withOrder([page({ id: 'b', title: 'Reports' }), page({ id: 'a', title: 'Dashboards' })]).map((entry, index) => ({
        ...entry,
        order: index === 0 ? 5 : 1
      })),
      'en'
    );

    expect(corpus.pages.map((entry) => entry.pageId)).toEqual(['a', 'b']);
  });
  it('never excludes product pages whose titles share words with legal, community or release pages', () => {
    const titles = [
      'Scheduling jobs',
      'Payment terms on invoices',
      'Comments on a work order',
      'Privacy settings for technicians',
      'Test your meter connection',
      'Draft invoices',
      'Version 2 API authentication',
      'Press brake maintenance',
      'Migrating from the legacy editor'
    ];
    const corpus = buildCorpus(
      withOrder([
        ...titles.map((title, index) => page({ id: `p${index}`, title })),
        page({ id: 'path', title: 'Create a job', url: 'https://acme.com/help/jobs/create' }),
        page({ id: 'terms', title: 'Glossary', url: 'https://acme.com/docs/terms' })
      ]),
      'en'
    );

    expect(corpus.pages.filter((entry) => entry.excluded).map((entry) => [entry.title, entry.excluded])).toEqual([]);
  });

  it('still excludes legal, company and community pages by their exact titles and URL segments', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'terms', title: 'Terms of Service | Acme' }),
        page({ id: 'careers', title: 'Careers' }),
        page({ id: 'blog', title: 'Five tips', url: 'https://acme.com/blog/five-tips' }),
        page({ id: 'forum', title: 'Question about meters', url: 'https://acme.com/forums/123' }),
        page({ id: 'changelog', title: 'March', url: 'https://acme.com/docs/changelog/march' })
      ]),
      'en'
    );

    expect(Object.fromEntries(corpus.pages.map((entry) => [entry.pageId, entry.excluded]))).toEqual({
      terms: 'legal-or-company',
      careers: 'legal-or-company',
      blog: 'legal-or-company',
      forum: 'community',
      changelog: 'release-notes'
    });
  });

  it('keeps a page whose language has a region in the corpus language', () => {
    const corpus = buildCorpus(withOrder([page({ id: 'us', title: 'Reports', locale: 'en-US' })]), 'en');

    expect(corpus.pages[0].excluded).toBeNull();
  });

  it('keeps the page for the higher version even when the older version was updated later', () => {
    const corpus = buildCorpus(
      withOrder([
        page({ id: 'v5', title: 'Delete a work order', updatedAt: '2026-03-01T00:00:00Z' }),
        page({ id: 'v6', title: 'Delete a work order (v6)', updatedAt: '2025-01-01T00:00:00Z' }),
        page({ id: 'app-109', title: 'Driver App v109', updatedAt: '2026-02-01T00:00:00Z' }),
        page({ id: 'app-110', title: 'Driver App v110', updatedAt: '2026-01-01T00:00:00Z' })
      ]),
      'en'
    );
    const excludedOf = (id: string) => corpus.pages.find((entry) => entry.pageId === id)?.excluded;

    expect(excludedOf('v6')).toBeNull();
    expect(excludedOf('v5')).toBe('obsolete');
    expect(excludedOf('app-110')).toBeNull();
    expect(excludedOf('app-109')).toBe('obsolete');
  });

  it('treats "new" as a replacement marker only when it is written as one', () => {
    const corpus = buildCorpus(
      withOrder([page({ id: 'a', title: 'Create a job' }), page({ id: 'b', title: 'Create a new job' })]),
      'en'
    );

    expect(corpus.pages.map((entry) => entry.excluded)).toEqual([null, null]);
    expect(titleKey('Create a new job')).not.toBe(titleKey('Create a job'));
    expect(titleKey('Dashboards (New)')).toBe(titleKey('Dashboards'));
  });
});
