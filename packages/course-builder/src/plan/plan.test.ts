import { describe, expect, it } from 'vitest';
import type * as z from 'zod/v4';

import type { CorpusBlock, CorpusPage } from '../corpus/types';
import type { ClaudeRequest } from '../llm/claude';
import type { GlossaryEntry } from '../understand/glossary';
import type { PageCard } from '../understand/page-card';
import type { StructuredCaller } from '../verify/types';
import { sectionBriefs } from './briefs';
import { checkCourseList, PageRefs, planCourseList, type PlanInput } from './course-list';
import { checkCoursePlan, courseGlossary, planCourses, type SectionPlanDraft } from './sections';

function page(id: string, title: string, blockCount = 3): CorpusPage {
  const blocks: CorpusBlock[] = Array.from({ length: blockCount }, (_, index) => ({
    id: `${id}-${index}`,
    kind: index === 0 ? 'heading' : 'step',
    text: index === 0 ? title : `Step ${index} of ${title}.`,
    headingPath: []
  }));

  return {
    pageId: `https://acme.com/docs/${id}`,
    url: `https://acme.com/docs/${id}`,
    title,
    path: ['Docs'],
    order: 0,
    contentHash: id,
    blocks,
    wordCount: 100,
    excluded: null,
    referenceOnly: false
  };
}

function card(target: CorpusPage, type: PageCard['type'], procedures: PageCard['procedures'] = []): PageCard {
  return {
    pageId: target.pageId,
    type,
    audience: ['Administrator'],
    level: 'beginner',
    summary: `About ${target.title}.`,
    keyFacts: [],
    procedures,
    names: [],
    prerequisites: [],
    freshness: { looksObsolete: false, clues: [] },
    media: { screenshots: 0, videos: 0 },
    parts: 1,
    dropped: { facts: 0, procedures: 0, names: 0 }
  };
}

const OVERVIEW = page('overview', 'What Acme does');
const METERS = page('meters', 'Add a meter');
const ALERTS = page('alerts', 'Set an alert');
const FIX = page('fix', 'Fix missing readings');
const PRICING = page('pricing', 'Pricing');
const PAGES = [OVERVIEW, METERS, ALERTS, FIX, PRICING];
const CARDS = new Map<string, PageCard>([
  [OVERVIEW.pageId, card(OVERVIEW, 'overview')],
  [METERS.pageId, card(METERS, 'how-to', [{ title: 'Add a meter', stepCount: 2, blockIds: ['meters-1', 'meters-2'] }])],
  [ALERTS.pageId, card(ALERTS, 'how-to')],
  [FIX.pageId, card(FIX, 'troubleshooting')],
  [PRICING.pageId, card(PRICING, 'marketing')]
]);

function input(courseCount = 2): PlanInput {
  return {
    pages: PAGES,
    cards: CARDS,
    productPages: [{ pageId: 'home', title: 'Acme', text: 'Energy data for every building.' }],
    answers: {
      firstOutcome: 'onboard-customers',
      jobRole: 'customer-education',
      companySize: '51-200',
      learningMethod: 'help-docs'
    },
    courseCount
  };
}

function fakeCaller(
  answer: (request: ClaudeRequest, index: number) => unknown
): StructuredCaller & { calls: ClaudeRequest[] } {
  const calls: ClaudeRequest[] = [];

  return {
    calls,
    async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
      calls.push(request);

      return request.schema.parse(answer(request, calls.length - 1)) as z.infer<Schema>;
    }
  };
}

function promptOf(request: ClaudeRequest): string {
  const first = request.content[0];

  return first.type === 'text' ? first.text : '';
}

const COURSE_A = { key: 'meters', title: 'Meters', area: 'Meters', audience: 'Admins', why: 'Customers start here.' };
const COURSE_B = { key: 'alerts', title: 'Alerts', area: 'Alerts', audience: 'Admins', why: 'Fewer tickets.' };

describe('course list', () => {
  it('names pages by short references, maps them back, and retries once with the problems it found', async () => {
    const caller = fakeCaller((_request, index) =>
      index === 0
        ? { courses: [{ ...COURSE_A, pageIds: ['p1', 'p2', 'p9'] }], excludedPages: [] }
        : {
            courses: [
              { ...COURSE_A, pageIds: ['p1', 'p2', 'p4'] },
              { ...COURSE_B, pageIds: ['p1', 'p3'] }
            ],
            excludedPages: [{ pageId: 'p5', reason: 'marketing' }]
          }
    );

    const list = await planCourseList(caller, input());

    expect(promptOf(caller.calls[0])).toContain('p2 Add a meter [how-to, beginner]');
    expect(promptOf(caller.calls[0])).toContain('Return exactly 2 courses.');
    expect(caller.calls[0].role).toBe('planner');
    expect(promptOf(caller.calls[1])).toContain('Returned 1 courses; exactly 2 are needed.');
    expect(promptOf(caller.calls[1])).toContain('Unknown page references: p9.');
    expect(promptOf(caller.calls[1])).toContain('in no course and not excluded: p3, p4, p5');
    expect(list.issues).toEqual([]);
    expect(list.courses.map((course) => course.pageIds)).toEqual([
      [OVERVIEW.pageId, METERS.pageId, FIX.pageId],
      [OVERVIEW.pageId, ALERTS.pageId]
    ]);
    expect(list.coverage).toEqual({
      used: [OVERVIEW.pageId, METERS.pageId, ALERTS.pageId, FIX.pageId],
      excluded: [{ pageId: PRICING.pageId, reason: 'marketing' }],
      unplaced: []
    });
  });

  it('keeps problems it could not fix, and does not count a used page as excluded', () => {
    const list = checkCourseList(
      {
        courses: [{ ...COURSE_A, pageIds: ['p1', 'p2'] }],
        excludedPages: [{ pageId: 'p2', reason: 'not needed' }]
      },
      PAGES,
      new PageRefs(PAGES),
      1
    );

    expect(list.coverage.excluded).toEqual([]);
    expect(list.coverage.unplaced).toEqual([ALERTS.pageId, FIX.pageId, PRICING.pageId]);
    expect(list.issues).toHaveLength(1);
  });
});

function plan(overrides: Partial<SectionPlanDraft> = {}): SectionPlanDraft {
  return {
    title: 'Meters',
    description: 'Meters from start to finish.',
    outcomes: ['Explain meters', 'Add a meter', 'Fix readings'],
    level: 'beginner',
    sections: [
      {
        key: 'basics',
        title: 'What Acme does',
        objectives: [{ text: 'Explain Acme', bloom: 'understand' }],
        lessons: [{ key: 'l1', title: 'Acme', sources: [{ pageId: 'p1' }] }]
      },
      {
        key: 'add',
        title: 'Add meters',
        objectives: [{ text: 'Add a meter', bloom: 'apply' }],
        lessons: [
          {
            key: 'l2',
            title: 'Add a meter',
            sources: [{ pageId: 'p2', fromBlockId: 'meters-1', toBlockId: 'meters-2' }]
          }
        ]
      }
    ],
    openQuestions: [],
    ...overrides
  };
}

describe('section plans', () => {
  const refs = new PageRefs(PAGES);
  const course = { ...COURSE_A, pageIds: [OVERVIEW.pageId, METERS.pageId] };

  it('accepts a plan that follows the rules and maps its sources to pages and blocks', () => {
    const checked = checkCoursePlan(plan(), course, CARDS, refs);

    expect(checked.issues).toEqual([]);
    expect(checked.sections[1].lessons[0].sources).toEqual([
      { pageId: METERS.pageId, fromBlockId: 'meters-1', toBlockId: 'meters-2' }
    ]);
  });

  it('lists every broken rule', () => {
    const wide = { ...course, pageIds: [OVERVIEW.pageId, METERS.pageId, FIX.pageId, ALERTS.pageId] };
    const draft = plan({
      outcomes: ['Only one'],
      sections: [
        {
          key: 'a',
          title: 'Add meters',
          objectives: [],
          lessons: [
            {
              key: 'l1',
              title: 'Add',
              sources: [
                { pageId: 'p2', fromBlockId: 'meters-2', toBlockId: 'meters-1' },
                { pageId: 'p2', fromBlockId: 'x-9' }
              ]
            }
          ]
        },
        {
          key: 'b',
          title: 'Fix 1',
          objectives: [],
          lessons: [{ key: 'l2', title: 'Fix', sources: [{ pageId: 'p4' }, { pageId: 'p5' }] }]
        },
        {
          key: 'c',
          title: 'Fix 2',
          objectives: [],
          lessons: [{ key: 'l3', title: 'Fix again', sources: [{ pageId: 'p4' }, { pageId: 'p7' }] }]
        }
      ]
    });

    const checked = checkCoursePlan(draft, wide, CARDS, refs);

    expect(checked.issues).toEqual([
      'On p2, block meters-2 comes after meters-1.',
      'Block x-9 is not on p2.',
      "p5 is not one of this course's pages.",
      'Unknown page reference p7.',
      'The course has 1 outcomes; it needs 3 to 5.',
      'The first section must be product knowledge, drawing on an overview or concept page.',
      '2 sections are mostly troubleshooting ("Fix 1", "Fix 2"); at most one may be.',
      'No lesson uses these pages: p1, p3.'
    ]);
  });

  it('does not ask for a product-knowledge first section when the course has no overview or concept page', () => {
    const howToOnly = { ...COURSE_A, pageIds: [METERS.pageId, ALERTS.pageId] };
    const draft = plan({
      sections: [
        {
          key: 'a',
          title: 'Meters and alerts',
          objectives: [],
          lessons: [{ key: 'l1', title: 'Add', sources: [{ pageId: 'p2' }, { pageId: 'p3' }] }]
        }
      ]
    });

    expect(checkCoursePlan(draft, howToOnly, CARDS, refs).issues).toEqual([]);
  });

  it('plans courses in parallel and plans again a course that teaches a procedure another course teaches', async () => {
    const list = {
      courses: [
        { ...COURSE_A, pageIds: [OVERVIEW.pageId, METERS.pageId] },
        { ...COURSE_B, pageIds: [OVERVIEW.pageId, METERS.pageId, ALERTS.pageId] }
      ],
      coverage: { used: [], excluded: [], unplaced: [] },
      issues: []
    };
    const alertsPlan = (withMeters: boolean) =>
      plan({
        title: 'Alerts',
        sections: [
          {
            key: 'basics',
            title: 'What Acme does',
            objectives: [],
            lessons: [{ key: 'l1', title: 'Acme', sources: [{ pageId: 'p1' }] }]
          },
          {
            key: 'alerts',
            title: 'Alerts',
            objectives: [],
            lessons: [
              {
                key: 'l2',
                title: 'Set an alert',
                sources: withMeters ? [{ pageId: 'p3' }, { pageId: 'p2' }] : [{ pageId: 'p3' }]
              }
            ]
          }
        ]
      });
    const caller = fakeCaller((request) => {
      const prompt = promptOf(request);
      if (prompt.includes('<course title="Meters"')) return plan();

      return alertsPlan(!prompt.includes('Another course already teaches'));
    });

    const plans = await planCourses(caller, input(), list, []);

    expect(caller.calls).toHaveLength(3);
    expect(promptOf(caller.calls[2])).toContain(
      'Another course already teaches "Add a meter" (taught in meters); leave it out.'
    );
    expect(promptOf(caller.calls[2])).toContain('- Meters (Meters)');
    expect(plans.map((coursePlan) => coursePlan.issues)).toEqual([[], ['No lesson uses these pages: p2.']]);
  });
});

describe('briefs and glossary', () => {
  const glossary: GlossaryEntry[] = [
    { name: 'Save', kind: 'button', pageIds: [OVERVIEW.pageId, METERS.pageId, ALERTS.pageId], aliases: [] },
    { name: 'Meters', kind: 'screen', pageIds: [METERS.pageId], aliases: [] },
    { name: 'Alerts', kind: 'screen', pageIds: [ALERTS.pageId], aliases: [] }
  ];

  it('gives each section exactly the blocks its lessons cite, its sibling titles and the names its pages use', () => {
    const checked = checkCoursePlan(
      plan(),
      { ...COURSE_A, pageIds: [OVERVIEW.pageId, METERS.pageId] },
      CARDS,
      new PageRefs(PAGES)
    );
    const briefs = sectionBriefs(checked, new Map(PAGES.map((entry) => [entry.pageId, entry])), glossary);

    expect(briefs[1].lessons[0].sources[0].blocks.map((block) => block.id)).toEqual(['meters-1', 'meters-2']);
    expect(briefs[1].siblingTitles).toEqual(['What Acme does']);
    expect(briefs[1].glossary.map((entry) => entry.name)).toEqual(['Save', 'Meters']);
    expect(briefs[0].lessons[0].sources[0].blocks).toHaveLength(3);
  });

  it('leaves out of a course glossary the buttons on most of its pages', () => {
    const names = courseGlossary(glossary, new Set([OVERVIEW.pageId, METERS.pageId, ALERTS.pageId]));

    expect(names.map((entry) => entry.name)).toEqual(['Meters', 'Alerts']);
  });
});
