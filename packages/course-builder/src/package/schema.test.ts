import { describe, expect, it } from 'vitest';

import { ENGLISH_PACKAGE_LABELS, LEARNING_PACKAGE_VERSION, ZLearningPackage, ZQuizQuestion } from './schema';

const CITATION = {
  pageUrl: 'https://acme.com/docs/dashboards',
  blockIds: ['abcd1234-3-ef567890'],
  contentHash: 'abcd1234ef567890',
  fetchedAt: '2026-11-19T10:00:00Z'
};

const PACKAGE = {
  version: LEARNING_PACKAGE_VERSION,
  labels: ENGLISH_PACKAGE_LABELS,
  locale: 'en',
  courses: [
    {
      key: 'dashboards',
      title: 'Read a dashboard',
      description: 'What a dashboard is and how to read one.',
      audience: 'Operations managers',
      outcomes: ['Read a dashboard at a glance'],
      sections: [
        {
          key: 'dashboards-understanding',
          title: 'Understanding dashboards',
          lessons: [
            {
              key: 'dashboards-what',
              title: 'What a dashboard is',
              sourceUrls: ['https://acme.com/docs/dashboards'],
              blocks: [
                { type: 'text', html: '<p>Dashboards group the numbers.</p>', citations: [CITATION] },
                {
                  type: 'image',
                  url: 'https://cdn.acme.com/dashboard.png',
                  sourceUrl: 'https://acme.com/docs/dashboards',
                  alt: 'Dashboard overview',
                  citation: CITATION
                },
                { type: 'callout', tone: 'tip', html: '<p>Pin it to the home page.</p>', citations: [CITATION] }
              ]
            }
          ],
          check: [
            {
              type: 'single',
              prompt: 'What does a dashboard group?',
              points: 1,
              options: [
                { label: 'Your team’s numbers', correct: true },
                { label: 'The list of users', correct: false },
                { label: 'The billing details', correct: false }
              ],
              supportBlockIds: ['abcd1234-0-ef567890'],
              bloom: 'apply'
            }
          ]
        }
      ],
      finalQuiz: [],
      practiceTasks: []
    }
  ],
  report: {
    sources: [
      {
        url: 'https://acme.com/docs',
        kind: 'help-center',
        evidence: 'linked-from-site',
        access: 'open',
        status: 'read',
        completeness: { declared: 12, read: 12, ratio: 1, status: 'complete' }
      }
    ],
    held: [],
    skipped: [{ url: 'https://community.acme.com', reason: 'community' }],
    excludedPages: [{ url: 'https://acme.com/docs/test', title: 'Test', reason: 'placeholder' }],
    contradictions: [],
    gaps: [{ topic: 'Exports', detail: 'The site does not document scheduled exports.' }],
    removedItems: [],
    gate: { passed: true, teachablePages: 12, words: 8400, reason: 'enough-material' },
    cost: { totalUsd: 6.4, byRole: { planner: 1.2, writer: 3.1 } },
    timings: { totalSeconds: 610, byStage: { read: 140, write: 190 } }
  }
};

describe('learning package schema', () => {
  it('accepts a package with cited blocks, a section check and a full report', () => {
    const parsed = ZLearningPackage.parse(PACKAGE);

    expect(parsed.courses[0].sections[0].lessons[0].blocks).toHaveLength(3);
    expect(parsed.report.gate.reason).toBe('enough-material');
  });

  it('rejects an unknown schema version', () => {
    expect(ZLearningPackage.safeParse({ ...PACKAGE, version: '2.0' }).success).toBe(false);
  });

  it('rejects a lesson block outside the four kinds, and a block with no citation', () => {
    const withUnknownBlock = structuredClone(PACKAGE) as typeof PACKAGE;
    withUnknownBlock.courses[0].sections[0].lessons[0].blocks.push({ type: 'embed' } as never);

    const uncitedText = structuredClone(PACKAGE) as typeof PACKAGE;
    uncitedText.courses[0].sections[0].lessons[0].blocks[0] = {
      type: 'text',
      html: '<p>Dashboards group the numbers.</p>',
      citations: []
    };

    expect(ZLearningPackage.safeParse(withUnknownBlock).success).toBe(false);
    expect(ZLearningPackage.safeParse(uncitedText).success).toBe(false);
  });

  it('rejects a page URL that is not http(s)', () => {
    const broken = structuredClone(PACKAGE) as typeof PACKAGE;
    broken.courses[0].sections[0].lessons[0].sourceUrls = ['/docs/dashboards'];

    expect(ZLearningPackage.safeParse(broken).success).toBe(false);
  });

  it('rejects a package with no courses', () => {
    expect(ZLearningPackage.safeParse({ ...PACKAGE, courses: [] }).success).toBe(false);
  });
});

describe('quiz question rules', () => {
  const base = {
    prompt: 'Which option is right?',
    points: 1,
    supportBlockIds: ['abcd1234-0-ef567890'],
    bloom: 'apply' as const
  };

  it('requires exactly one correct answer for a single-answer question, with wrong options', () => {
    const twoCorrect = {
      ...base,
      type: 'single' as const,
      options: [
        { label: 'One', correct: true },
        { label: 'Two', correct: true },
        { label: 'Three', correct: false }
      ]
    };
    const noWrong = {
      ...base,
      type: 'single' as const,
      options: [
        { label: 'One', correct: true },
        { label: 'Two', correct: false }
      ]
    };

    expect(ZQuizQuestion.safeParse(twoCorrect).success).toBe(false);
    expect(ZQuizQuestion.safeParse(noWrong).success).toBe(false);
  });

  it('bans "all of the above" and "none of the above"', () => {
    const banned = {
      ...base,
      type: 'single' as const,
      options: [
        { label: 'One', correct: true },
        { label: 'Two', correct: false },
        { label: 'All of the above', correct: false }
      ]
    };

    expect(ZQuizQuestion.safeParse(banned).success).toBe(false);
  });

  it('needs two steps to order and two pairs to match', () => {
    expect(ZQuizQuestion.safeParse({ ...base, type: 'ordering', orderedSteps: ['Only one'] }).success).toBe(false);
    expect(
      ZQuizQuestion.safeParse({
        ...base,
        type: 'matching',
        pairs: [{ term: 'Dashboard', definition: 'A group of numbers' }]
      }).success
    ).toBe(false);
    expect(
      ZQuizQuestion.safeParse({
        ...base,
        type: 'ordering',
        orderedSteps: ['Open the board', 'Pin the chart']
      }).success
    ).toBe(true);
  });

  it('lets a practice task ask for a link or a short answer with no options', () => {
    expect(ZQuizQuestion.safeParse({ ...base, type: 'link', bloom: 'apply' }).success).toBe(true);
    expect(ZQuizQuestion.safeParse({ ...base, type: 'text', bloom: 'apply' }).success).toBe(true);
  });
});
