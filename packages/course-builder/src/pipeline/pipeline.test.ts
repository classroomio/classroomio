import { describe, expect, it } from 'vitest';

import type { DiscoveredSource } from '../discover/discover';
import { BudgetExceededError, ClaudeClient } from '../llm/claude';
import { UsageLedger } from '../llm/usage';
import { ENGLISH_PACKAGE_LABELS, ZLearningPackage, type PackageCourse } from '../package/schema';
import type { SourcePage } from '../sources/types';
import { inScope, sourceScope } from '../scope/scope';
import {
  affordablePlans,
  buildReport,
  COURSE_COST_PER_LESSON_USD,
  coursePackage,
  finishStage,
  type BuildCaller,
  prepareCorpus,
  PRODUCT_SITE_EXCLUDE,
  type FinishedCourse,
  type ReadSourceStage
} from './stages';

const SENTENCE =
  'A work order records the job, the asset it concerns, who does it and when, so the team reads one shared plan.';

function page(host: string, id: string, title: string, repeat = 25): SourcePage {
  return {
    id,
    title,
    url: `https://${host}/${id}`,
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
    content: { format: 'html', text: `<main><h1>${title}</h1><p>${Array(repeat).fill(SENTENCE).join(' ')}</p></main>` }
  };
}

function source(kind: DiscoveredSource['kind'], url: string): DiscoveredSource {
  return {
    kind,
    url,
    title: null,
    foundVia: 'site-link',
    foundAt: url,
    redirectChain: [],
    ownership: 'same-site' as DiscoveredSource['ownership'],
    evidence: 'linked-from-site',
    access: 'open',
    llmsTxtUrl: null,
    sitemapUrls: []
  };
}

function readStage(kind: DiscoveredSource['kind'], host: string, pages: SourcePage[]): ReadSourceStage {
  return {
    source: source(kind, `https://${host}/`),
    outcome: 'read',
    pages: pages.map((entry, order) => ({ ...entry, order })),
    media: {},
    completeness: { declared: pages.length, declaredBy: 'sitemap', read: pages.length, ratio: 1, status: 'complete' },
    readAt: '2026-11-20T00:00:00.000Z'
  };
}

const help = readStage('help-center', 'help.acme.com', [
  page('help.acme.com', 'work-orders', 'Work orders'),
  page('help.acme.com', 'assets', 'Assets'),
  page('help.acme.com', 'schedules', 'Schedules'),
  page('help.acme.com', 'teams', 'Teams')
]);
const product = readStage('product-site', 'acme.com', [page('acme.com', 'features', 'Features', 3)]);

describe('prepareCorpus', () => {
  it('teaches from every source but the product site, which only feeds planning and names', () => {
    const prepared = prepareCorpus([product, help], 'en');

    expect(prepared.corpus.pages.map((entry) => entry.title)).toEqual(['Work orders', 'Assets', 'Schedules', 'Teams']);
    expect(prepared.productPages).toEqual([
      { pageId: 'https://acme.com/features', title: 'Features', text: expect.stringContaining('work order') }
    ]);
    expect(prepared.gate).toMatchObject({ passed: true, teachablePages: 4, reason: 'enough-material' });
  });

  it('keeps reading order source by source, so a second source never interleaves with the first', () => {
    const docs = readStage('docs', 'docs.acme.com', [
      page('docs.acme.com', 'api', 'API keys'),
      page('docs.acme.com', 'webhooks', 'Webhooks')
    ]);
    const prepared = prepareCorpus([help, docs], 'en');

    expect(prepared.corpus.pages.map((entry) => entry.title)).toEqual([
      'Work orders',
      'Assets',
      'Schedules',
      'Teams',
      'API keys',
      'Webhooks'
    ]);
  });

  it('stops at the gate when the only material is the product site', () => {
    const prepared = prepareCorpus([product], 'en');

    expect(prepared.gate).toMatchObject({ passed: false, teachablePages: 0, reason: 'too-few-pages' });
  });
});

describe('product site reading', () => {
  it('skips the paths the corpus never teaches, so its small page budget goes to product pages', () => {
    const scope = sourceScope('https://www.acme.com/', { exclude: PRODUCT_SITE_EXCLUDE });

    expect(inScope('https://www.acme.com/blog/5-tips', scope)).toBe(false);
    expect(inScope('https://www.acme.com/blog', scope)).toBe(false);
    expect(inScope('https://www.acme.com/en/careers/engineer', scope)).toBe(false);
    expect(inScope('https://www.acme.com/legal/privacy', scope)).toBe(false);
    expect(inScope('https://www.acme.com/features/scheduling', scope)).toBe(true);
    expect(inScope('https://www.acme.com/blogging-tools', scope)).toBe(true);
  });
});

describe('build report and package', () => {
  it('records held and skipped candidates and makes a valid one-course package', () => {
    const prepared = prepareCorpus([product, help], 'en');
    const course: PackageCourse = {
      key: 'c1',
      title: 'Work orders',
      description: 'Plan and close work orders.',
      audience: 'Maintenance planners',
      outcomes: ['Create a work order'],
      sections: [
        {
          key: 's1',
          title: 'Basics',
          lessons: [
            {
              key: 'l1',
              title: 'What a work order is',
              sourceUrls: ['https://help.acme.com/work-orders'],
              blocks: [
                {
                  type: 'text',
                  html: '<p>A work order records the job.</p>',
                  citations: [
                    {
                      pageUrl: 'https://help.acme.com/work-orders',
                      blockIds: [prepared.corpus.pages[0].blocks[1].id],
                      contentHash: prepared.corpus.pages[0].contentHash,
                      fetchedAt: '2026-11-20T00:00:00.000Z'
                    }
                  ]
                }
              ]
            }
          ],
          check: []
        }
      ],
      finalQuiz: [],
      practiceTasks: []
    };
    const finished = {
      course,
      gaps: [{ topic: 'Billing', detail: 'Not in the help centre.' }],
      removedItems: [{ kind: 'question', target: 'question:final#2', reason: 'its key could not be confirmed' }]
    } as FinishedCourse;
    const report = buildReport({
      sourceMap: {
        needsConfirmation: [source('docs', 'https://docs.acme.com/')],
        skipped: [{ url: 'https://status.acme.com/', foundVia: 'site-link', reason: 'not-documentation' as never }]
      },
      sources: [product, help],
      prepared,
      finished: [finished],
      cost: { totalUsd: 1.2, byRole: { writer: 1.2 } },
      timings: { totalSeconds: 60, byStage: { write: 60 } }
    });

    expect(report.held).toEqual([{ url: 'https://docs.acme.com/', reason: 'needs-confirmation' }]);
    expect(report.skipped).toEqual([{ url: 'https://status.acme.com/', reason: 'not-documentation' }]);
    expect(report.sources.map((entry) => entry.kind)).toEqual(['product-site', 'help-center']);
    expect(report.gaps).toEqual(finished.gaps);
    expect(
      ZLearningPackage.safeParse(coursePackage(course, report, 'en', ENGLISH_PACKAGE_LABELS)).error?.issues
    ).toBeUndefined();
  });
});

describe('budget', () => {
  it('sends no request once earlier stages and this client have spent the limit', async () => {
    const ledger = new UsageLedger();
    ledger.add(
      'writer',
      'claude-sonnet-5-5',
      { inputTokens: 1_000_000, outputTokens: 0, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0, cacheReadTokens: 0 },
      1
    );
    const client = new ClaudeClient({ apiKey: 'unused', ledger, budget: { limitUsd: 5, spentUsd: 4 } });

    expect(client.spentUsd).toBeGreaterThanOrEqual(5);
    await expect(client.cited({ role: 'writer', system: 'x', content: [] })).rejects.toBeInstanceOf(
      BudgetExceededError
    );
  });
});

describe('affordablePlans', () => {
  const planWith = (title: string, lessons: number) =>
    ({
      title,
      sections: [{ lessons: Array.from({ length: lessons }, (_, index) => ({ key: `${title}-${index}` })) }]
    }) as unknown as Parameters<typeof affordablePlans>[0][number];

  it('keeps the courses the remaining budget can finish, in plan order, and sets aside the rest', () => {
    const plans = [planWith('first', 40), planWith('big', 60), planWith('small', 20)];
    const remaining = 70 * COURSE_COST_PER_LESSON_USD;

    const { kept, dropped } = affordablePlans(plans, remaining);

    expect(kept.map((plan) => plan.title)).toEqual(['first', 'small']);
    expect(dropped.map((plan) => plan.title)).toEqual(['big']);
  });

  it('always keeps the first course', () => {
    expect(affordablePlans([planWith('only', 50)], 0).kept).toHaveLength(1);
  });
});

describe('finishStage', () => {
  it('keeps the checked course, unreviewed, when the budget runs out at the review', async () => {
    const course = {
      key: 'c1',
      title: 'Course',
      description: 'About the course.',
      audience: ['Administrator'],
      outcomes: ['Use it'],
      sections: [],
      finalQuiz: [],
      practiceTasks: []
    } as unknown as PackageCourse;
    const caller = {
      structured: async (request: { role: string }) => {
        throw new BudgetExceededError(request.role as never, 12);
      },
      cited: async () => {
        throw new Error('no passage needs repair');
      }
    } as unknown as BuildCaller;

    const finished = await finishStage(caller, {
      plan: {
        title: 'Course',
        course: { pageIds: [], audience: ['Administrator'] },
        outcomes: ['Use it'],
        sections: []
      },
      corpus: { locale: 'en', pages: [], excluded: {} },
      glossary: [],
      fetchedAt: '2026-11-24T00:00:00.000Z',
      written: { course, gaps: [], issues: [], stats: {} },
      otherCourseTitles: []
    } as unknown as Parameters<typeof finishStage>[1]);

    expect(finished.reviewSkipped).toBe(true);
    expect(finished.course.title).toBe('Course');
  });
});
