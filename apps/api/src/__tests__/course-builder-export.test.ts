import { describe, expect, it } from 'vitest';

import {
  ENGLISH_PACKAGE_LABELS,
  toCourseImportDraft,
  toCourseImportDrafts,
  type LearningPackage,
  type QuizQuestion
} from '@cio/core/services/course-builder/export';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';
import { ZCourseImportDraftPayload } from '@cio/utils/validation';
import { getQuestionOptionIssues } from '@cio/utils/validation/exercise';

const CITATION = {
  pageUrl: 'https://acme.com/docs/dashboards',
  blockIds: ['abcd1234-3-ef567890'],
  contentHash: 'abcd1234ef567890',
  fetchedAt: '2026-11-19T10:00:00Z'
};

function singleAnswerQuestion(prompt: string): QuizQuestion {
  return {
    type: 'single',
    prompt,
    points: 1,
    options: [
      { label: 'Right', correct: true },
      { label: 'Wrong one', correct: false },
      { label: 'Wrong two', correct: false }
    ],
    supportBlockIds: ['abcd1234-0-ef567890'],
    bloom: 'apply'
  };
}

function learningPackage(overrides: Partial<LearningPackage> = {}): LearningPackage {
  return {
    version: '1.0',
    labels: ENGLISH_PACKAGE_LABELS,
    locale: 'en',
    courses: [
      {
        key: 'dashboards',
        title: 'Read a dashboard',
        description: 'What a dashboard is and how to read one.',
        audience: 'Operations managers',
        outcomes: ['Read a dashboard at a glance', 'Find a pinned chart'],
        sections: [
          {
            key: 'understanding',
            title: 'Understanding dashboards',
            lessons: [
              {
                key: 'what',
                title: 'What a dashboard is',
                sourceUrls: ['https://acme.com/docs/dashboards'],
                blocks: [
                  {
                    type: 'text',
                    html: '<h2>One board</h2><p>Dashboards group the numbers.</p>',
                    citations: [CITATION]
                  },
                  {
                    type: 'image',
                    url: 'https://cdn.acme.com/dashboard.png',
                    sourceUrl: 'https://acme.com/docs/dashboards',
                    alt: 'Dashboard overview',
                    citation: CITATION
                  },
                  {
                    type: 'video',
                    provider: 'youtube',
                    url: 'https://www.youtube.com/watch?v=abc123',
                    title: 'Dashboards in two minutes',
                    citation: CITATION
                  },
                  { type: 'callout', tone: 'tip', html: '<p>Pin the chart you use most.</p>', citations: [CITATION] }
                ]
              }
            ],
            check: [singleAnswerQuestion('What does a dashboard group?')]
          },
          {
            key: 'doing',
            title: 'Build a dashboard',
            lessons: [
              {
                key: 'build',
                title: 'Add your first chart',
                sourceUrls: ['https://acme.com/docs/charts'],
                blocks: [{ type: 'text', html: '<p>Choose New chart.</p>', citations: [CITATION] }]
              }
            ],
            check: []
          }
        ],
        finalQuiz: [singleAnswerQuestion('Where do pinned charts live?')],
        practiceTasks: [
          {
            type: 'link',
            prompt: 'Paste the link of a dashboard you built',
            points: 1,
            options: [],
            supportBlockIds: ['abcd1234-3-ef567890'],
            bloom: 'apply'
          }
        ]
      },
      {
        key: 'reports',
        title: 'Schedule a report',
        description: 'How scheduled reports work.',
        audience: 'Operations managers',
        outcomes: [],
        sections: [
          {
            key: 'scheduling',
            title: 'Scheduling',
            lessons: [
              {
                key: 'schedule',
                title: 'Schedule a report',
                sourceUrls: ['https://acme.com/docs/reports'],
                blocks: [{ type: 'text', html: '<p>Pick a cadence.</p>', citations: [CITATION] }]
              }
            ],
            check: []
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
      skipped: [],
      excludedPages: [],
      contradictions: [],
      gaps: [],
      removedItems: [],
      gate: { passed: true, teachablePages: 12, words: 8400, reason: 'enough-material' },
      cost: { totalUsd: 6.4, byRole: { planner: 1.2 } },
      timings: { totalSeconds: 610, byStage: { read: 140 } }
    },
    ...overrides
  };
}

describe('course builder export', () => {
  it('produces a draft the importer accepts, with sections, lessons and lesson bodies', () => {
    const draft = toCourseImportDraft(learningPackage(), 'dashboards');

    expect(ZCourseImportDraftPayload.safeParse(draft).success).toBe(true);
    expect(draft.course).toMatchObject({
      title: 'Read a dashboard',
      type: 'SELF_PACED',
      locale: 'en'
    });
    expect(draft.course.description).toContain("You'll be able to:");
    expect(draft.course.description).toContain('- Read a dashboard at a glance');
    expect(draft.sections).toEqual([
      { externalId: 's1', title: 'Understanding dashboards', order: 1 },
      { externalId: 's2', title: 'Build a dashboard', order: 2 }
    ]);
    expect(draft.lessons).toEqual([
      {
        externalId: 's1l1',
        sectionExternalId: 's1',
        title: 'What a dashboard is',
        order: 1,
        videos: [{ type: 'youtube', link: 'https://www.youtube.com/watch?v=abc123' }]
      },
      { externalId: 's2l1', sectionExternalId: 's2', title: 'Add your first chart', order: 1 }
    ]);
  });

  it('turns blocks into one lesson body, starting headings at h3 and ending with the source link', () => {
    const body = toCourseImportDraft(learningPackage(), 'dashboards').lessonLanguages[0].content;

    expect(body).toContain('<h3>One board</h3>');
    expect(body).not.toMatch(/<h[12]\b/);
    expect(body).toContain('<img src="https://cdn.acme.com/dashboard.png" alt="Dashboard overview">');
    expect(body).toContain('<figcaption>Dashboard overview</figcaption>');
    expect(body).toMatch(/<blockquote><p><strong>Tip<\/strong><\/p>/);
    expect(body).not.toContain('youtube');
    expect(body.trimEnd().endsWith('</p>')).toBe(true);
    expect(body).toContain('<strong>Source:</strong> <a href="https://acme.com/docs/dashboards">');
  });

  it('attaches section checks to their section and places the final quiz and practice task at the top level', () => {
    const draft = toCourseImportDraft(learningPackage(), 'dashboards');
    const exercises = draft.exercises ?? [];

    expect(
      exercises.map((exercise) => [exercise.externalId, exercise.sectionExternalId ?? null, exercise.order])
    ).toEqual([
      ['s1-check', 's1', 1],
      ['final-quiz', null, 3],
      ['practice', null, 4]
    ]);
    expect(exercises[0].title).toBe('Check: Understanding dashboards');
    expect(exercises[0].questions?.[0]).toMatchObject({
      questionTypeId: QUESTION_TYPE.RADIO,
      points: 1,
      order: 1
    });
    expect(exercises[2].questions?.[0].questionTypeId).toBe(QUESTION_TYPE.LINK);
  });

  it('cites every page a course draws on, once', () => {
    const draft = toCourseImportDraft(learningPackage(), 'dashboards');

    expect(draft.sourceReferences).toEqual([
      { type: 'website', label: 'https://acme.com/docs/dashboards' },
      { type: 'website', label: 'https://acme.com/docs/charts' }
    ]);
  });

  it('maps every supported question type to its ClassroomIO id', () => {
    const pkg = learningPackage();
    pkg.courses[0].finalQuiz = [
      {
        type: 'multiple',
        prompt: 'Which two are pinned?',
        points: 2,
        options: [
          { label: 'Revenue', correct: true },
          { label: 'Headcount', correct: true },
          { label: 'Billing', correct: false }
        ],
        supportBlockIds: ['abcd1234-0-ef567890'],
        bloom: 'analyse'
      },
      {
        type: 'true-false',
        prompt: 'A dashboard refreshes every minute.',
        points: 1,
        options: [
          { label: 'True', correct: true },
          { label: 'False', correct: false }
        ],
        supportBlockIds: ['abcd1234-1-ef567890'],
        bloom: 'understand'
      },
      {
        type: 'ordering',
        prompt: 'Put the steps in order',
        points: 1,
        options: [],
        orderedSteps: ['Open the board', 'Choose New chart'],
        supportBlockIds: ['abcd1234-2-ef567890'],
        bloom: 'apply'
      },
      {
        type: 'text',
        prompt: 'Describe your first chart',
        points: 1,
        options: [],
        supportBlockIds: ['abcd1234-3-ef567890'],
        bloom: 'apply'
      },
      {
        type: 'matching',
        prompt: 'Match each term',
        points: 1,
        options: [],
        pairs: [
          { term: 'Board', definition: 'A group of charts' },
          { term: 'Chart', definition: 'One metric' }
        ],
        supportBlockIds: ['abcd1234-4-ef567890'],
        bloom: 'understand'
      }
    ];

    const draft = toCourseImportDraft(pkg, 'dashboards');
    const quiz = (draft.exercises ?? []).find((exercise) => exercise.externalId === 'final-quiz');

    expect(quiz?.questions?.map((question) => question.questionTypeId)).toEqual([
      QUESTION_TYPE.CHECKBOX,
      QUESTION_TYPE.TRUE_FALSE,
      QUESTION_TYPE.ORDERING,
      QUESTION_TYPE.TEXTAREA
    ]);
    expect(quiz?.questions?.[1].settings).toEqual({ correctValue: true });
    expect(quiz?.questions?.[2].settings).toEqual({ items: ['Open the board', 'Choose New chart'] });
    expect(draft.warnings.map((warning) => warning.code)).toContain('matching-question-dropped');
  });

  it('answers the exercise rules the product applies when it saves a question', () => {
    const quiz = (toCourseImportDraft(learningPackage(), 'dashboards').exercises ?? []).find(
      (exercise) => exercise.externalId === 'final-quiz'
    );

    for (const question of quiz?.questions ?? []) {
      expect(getQuestionOptionIssues(question)).toEqual([]);
    }
  });

  it('imports a package in a locale ClassroomIO does not speak as English, and says so', () => {
    const draft = toCourseImportDraft(learningPackage({ locale: 'ja' }), 'dashboards');

    expect(draft.course.locale).toBe('en');
    expect(draft.warnings.map((warning) => warning.code)).toContain('locale-not-supported');
  });

  it('throws for a course the package does not carry', () => {
    expect(() => toCourseImportDraft(learningPackage(), 'missing')).toThrow(/no course "missing"/);
  });

  it('converts every course, one draft each', () => {
    const drafts = toCourseImportDrafts(learningPackage());

    expect(drafts.map((draft) => draft.course.title)).toEqual(['Read a dashboard', 'Schedule a report']);
  });
  it('writes every fixed label in the course language the package carries', () => {
    const labels = {
      source: 'Source',
      note: 'Remarque',
      tip: 'Astuce',
      warning: 'Attention',
      sectionCheck: 'Vérification : {section}',
      finalQuiz: '{course} : quiz final',
      practice: '{course} : à pratiquer dans votre compte',
      outcomes: 'Vous saurez :'
    };
    const draft = toCourseImportDraft(learningPackage({ locale: 'fr', labels }), 'dashboards');
    const titles = (draft.exercises ?? []).map((exercise) => exercise.title);

    expect(titles).toEqual([
      'Vérification : Understanding dashboards',
      'Read a dashboard : quiz final',
      'Read a dashboard : à pratiquer dans votre compte'
    ]);
    expect(draft.course.description).toContain('Vous saurez :');
    expect(draft.lessonLanguages[0].content).toContain('<strong>Astuce</strong>');
    expect(JSON.stringify(draft)).not.toMatch(/You'll be able to|final quiz|Check: /);
  });
});
