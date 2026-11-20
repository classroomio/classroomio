import type { BetaTextCitation } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { describe, expect, it } from 'vitest';
import type * as z from 'zod/v4';

import type { CorpusBlock } from '../corpus/types';
import { GROUNDEDNESS_JUDGE_SYSTEM, groundednessScore, judgeLessonGroundedness } from '../eval/groundedness';
import type { CitedTextPart, ClaudeRequest } from '../llm/claude';
import type { PackageCourse, QuizQuestion } from '../package/schema';
import type { SectionBrief } from '../plan/briefs';
import { BLIND_SOLVER_SYSTEM, OPTION_AUDIT_SYSTEM } from '../verify/answer-keys';
import { lessonSources } from '../plan/briefs';
import { checkCourse } from '../verify/check-course';
import { CLAIM_CHECKER_SYSTEM } from '../verify/claims';
import { briefBlocks, QUESTION_REPAIR_SYSTEM, rewriteQuestion } from './quizzes';
import { repairCourse } from './repair-course';

const URL_A = 'https://acme.com/docs/meters';

function block(id: string, kind: CorpusBlock['kind'], text: string, extra: Partial<CorpusBlock> = {}): CorpusBlock {
  return { id, kind, text, headingPath: [], ...extra };
}

const BLOCKS: CorpusBlock[] = [
  block('m-0', 'paragraph', 'A meter reports a reading every 15 minutes.'),
  block('m-1', 'step', 'Open Settings.', { stepNumber: 1 }),
  block('m-2', 'step', 'Choose Add meter.', { stepNumber: 2 })
];

const BRIEF: SectionBrief = {
  courseKey: 'meters',
  courseTitle: 'Meters',
  section: { key: 'add', title: 'Add meters', objectives: [{ text: 'Add a meter', bloom: 'apply' }] },
  lessons: ['what', 'how', 'where'].map((key) => ({
    key,
    title: `Lesson ${key}`,
    sources: [{ pageId: 'meters', url: URL_A, title: 'Meters', contentHash: 'hash-a', blocks: BLOCKS }]
  })),
  siblingTitles: [],
  glossary: []
};

const LOOKUP = briefBlocks([BRIEF]);

function citation(...blockIds: string[]) {
  return { pageUrl: URL_A, blockIds, contentHash: 'hash-a', fetchedAt: 'now' };
}

function question(correct: string): QuizQuestion {
  return {
    type: 'single',
    prompt: 'How often does a meter report?',
    points: 1,
    options: ['Every 15 minutes', 'Every hour', 'Once a day'].map((label) => ({ label, correct: label === correct })),
    supportBlockIds: ['m-0'],
    bloom: 'remember'
  };
}

function course(): PackageCourse {
  return {
    key: 'meters',
    title: 'Meters',
    description: 'Meters.',
    audience: 'Admins',
    outcomes: ['Add a meter'],
    sections: [
      {
        key: 'add',
        title: 'Add meters',
        lessons: [
          {
            key: 'what',
            title: 'Lesson what',
            sourceUrls: [URL_A],
            blocks: [
              {
                type: 'text',
                html: '<p>A meter reports every 5 minutes. See <a href="https://elsewhere.com/x">the forum</a>.</p>',
                citations: [citation('m-0')]
              }
            ]
          },
          {
            key: 'how',
            title: 'Lesson how',
            sourceUrls: [URL_A],
            blocks: [
              { type: 'text', html: '<p>Open Settings and choose Add meter.</p>', citations: [citation('m-1', 'm-2')] },
              { type: 'text', html: '<p>Meters cost nothing at all.</p>', citations: [citation('m-0')] }
            ]
          },
          {
            key: 'where',
            title: 'Lesson where',
            sourceUrls: [URL_A],
            blocks: [
              { type: 'text', html: '<p>Choose Add meter after opening Settings.</p>', citations: [citation('m-0')] }
            ]
          }
        ],
        check: [question('Every hour')]
      }
    ],
    finalQuiz: [],
    practiceTasks: []
  };
}

function cite(start: number, end: number): BetaTextCitation {
  return {
    type: 'search_result_location',
    cited_text: '',
    search_result_index: 0,
    start_block_index: start,
    end_block_index: end,
    source: URL_A,
    title: 'Meters'
  };
}

function textOf(request: ClaudeRequest): string {
  return request.content.map((entry) => (entry.type === 'text' ? entry.text : '')).join('\n');
}

function claimVerdicts(request: ClaudeRequest) {
  const claims = [...textOf(request).matchAll(/^CLAIM (\d+) \([^)]*\): (.*)$/gm)];

  return {
    verdicts: claims.map(([, index, text]) => {
      const elsewhere = /Choose Add meter after/.test(text);

      return {
        claimIndex: Number(index),
        verdict: /every 5 minutes|cost nothing/.test(text)
          ? 'unsupported'
          : elsewhere
            ? 'supported-elsewhere'
            : 'supported',
        sourceBlockIds: elsewhere ? ['m-1', 'm-2'] : [],
        reason: 'compared with the source'
      };
    })
  };
}

function fakeModel(options: { failClaimsFor?: string } = {}) {
  const structuredCalls: ClaudeRequest[] = [];
  const citedCalls: ClaudeRequest[] = [];

  return {
    structuredCalls,
    citedCalls,
    async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
      structuredCalls.push(request);
      const answer = () => {
        if (request.system === CLAIM_CHECKER_SYSTEM) {
          if (options.failClaimsFor && textOf(request).includes(options.failClaimsFor)) throw new Error('overloaded');

          return claimVerdicts(request);
        }
        if (request.system === BLIND_SOLVER_SYSTEM)
          return { chosen: ['Every 15 minutes'], reason: 'the source says so' };
        if (request.system === OPTION_AUDIT_SYSTEM) return { options: [] };
        if (request.system === QUESTION_REPAIR_SYSTEM) {
          return {
            question: {
              type: 'single',
              prompt: 'How often does a meter report a reading?',
              options: [
                { label: 'Every 15 minutes', correct: true },
                { label: 'Every hour', correct: false },
                { label: 'Once a day', correct: false }
              ],
              orderedSteps: [],
              supportBlockIds: ['m-0'],
              bloom: 'remember'
            }
          };
        }
        throw new Error(`unexpected system prompt: ${request.system.slice(0, 40)}`);
      };

      return request.schema.parse(answer()) as z.infer<Schema>;
    },
    async cited(request: ClaudeRequest): Promise<CitedTextPart[]> {
      citedCalls.push(request);
      if (textOf(request).includes('every 5 minutes')) {
        return [
          { text: '## Passage: 1\n\n', citations: [] },
          { text: 'A meter reports a reading every 15 minutes.', citations: [cite(0, 1)] }
        ];
      }

      return [
        { text: '## Passage: 1\n\n', citations: [] },
        { text: 'Meters cost nothing at all.', citations: [cite(0, 1)] }
      ];
    }
  };
}

const CHECKS = {
  blocks: LOOKUP,
  allowedUrls: new Set([URL_A]),
  otherCourseTitles: [],
  lessonSources: lessonSources([BRIEF])
};

describe('course check', () => {
  it('checks every lesson and question, and records a check that failed as unchecked rather than flagged', async () => {
    const model = fakeModel({ failClaimsFor: 'Open Settings and choose' });

    const check = await checkCourse(model, course(), CHECKS);

    expect(check.issues.map((issue) => [issue.target, issue.kind])).toEqual([
      ['lesson:what', 'unsupported-claim'],
      ['lesson:what', 'unknown-link'],
      ['question:add#1', 'wrong-key']
    ]);
    expect(check.claims.get('what')?.map((result) => [result.claim.text, result.verdict])).toEqual([
      ['A meter reports every 5 minutes.', 'unsupported'],
      ['See the forum.', 'supported']
    ]);
    expect(check.unchecked).toEqual([{ target: 'lesson:how', reason: 'overloaded' }]);
  });
});

describe('course repair', () => {
  it('corrects citations in code, rewrites only flagged passages, and takes out a passage that still fails', async () => {
    const model = fakeModel();
    const subject = course();
    const check = await checkCourse(model, subject, CHECKS);
    model.citedCalls.length = 0;

    const repaired = await repairCourse(model, {
      course: subject,
      briefs: [BRIEF],
      context: { courseTitle: 'Meters', audience: 'Admins', outcomes: [], glossary: [], fetchedAt: 'now' },
      checks: CHECKS,
      issues: check.issues,
      claims: check.claims
    });

    expect(repaired.repaired.sort()).toEqual(['lesson:what', 'question:add#1']);
    expect(repaired.removed.map((entry) => [entry.target, entry.what])).toEqual([['lesson:how', 'blocks']]);
    expect(repaired.correctedCitations).toBe(1);
    expect(model.citedCalls.map((request) => request.role)).toEqual(['repair', 'repair', 'repair']);
    expect(textOf(model.citedCalls[1])).toContain('<passage number="1">\n<p>Meters cost nothing at all.</p>');
    expect(textOf(model.citedCalls[1])).not.toContain('Open Settings and choose');
    const [what, how, where] = repaired.course.sections[0].lessons;
    expect(what.blocks.map((entry) => (entry.type === 'text' ? entry.html : entry.type))).toEqual([
      '<p>A meter reports a reading every 15 minutes.</p>'
    ]);
    expect(how.blocks.map((entry) => (entry.type === 'text' ? entry.html : entry.type))).toEqual([
      '<p>Open Settings and choose Add meter.</p>'
    ]);
    expect(where.blocks[0].type === 'text' && where.blocks[0].citations[0].blockIds).toEqual(['m-0', 'm-1', 'm-2']);
    expect(repaired.course.sections[0].check[0].options.find((option) => option.correct)?.label).toBe(
      'Every 15 minutes'
    );
    expect(repaired.failures).toEqual([]);
    expect(subject.sections[0].lessons[1].blocks).toHaveLength(2);
  });

  it('does not rewrite a question when no brief source holds the blocks it cites', async () => {
    const model = fakeModel();
    const orphan = { ...question('Every hour'), supportBlockIds: ['elsewhere-1'] };

    expect(await rewriteQuestion(model, orphan, [BRIEF], ['wrong key'])).toBeNull();
    expect(model.structuredCalls).toHaveLength(0);
  });
});

describe('groundedness judge', () => {
  it('judges sentence claims against the whole documentation and scores grounding and citation accuracy apart', async () => {
    const requests: ClaudeRequest[] = [];
    const caller = {
      async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
        requests.push(request);

        return request.schema.parse({
          verdicts: [
            { claimIndex: 1, verdict: 'supported-elsewhere', reason: 'm-0 states it' },
            { claimIndex: 2, verdict: 'supported', reason: 'stated' }
          ]
        }) as z.infer<Schema>;
      }
    };
    const lesson = {
      ...course().sections[0].lessons[1],
      blocks: [
        { type: 'text' as const, html: '<p>A meter reports every 15 minutes.</p>', citations: [citation('m-1')] },
        { type: 'text' as const, html: '<p>Open Settings first.</p><p>It has no.</p>', citations: [citation('m-1')] }
      ]
    };

    const judged = await judgeLessonGroundedness(caller, lesson, [{ url: URL_A, title: 'Meters', blocks: BLOCKS }]);

    expect(requests[0].system).toBe(GROUNDEDNESS_JUDGE_SYSTEM);
    expect(textOf(requests[0])).toContain('[m-2] Choose Add meter.');
    expect(textOf(requests[0])).toContain('CLAIM 3 (cites m-1): It has no.');
    expect(judged.map((entry) => entry.verdict)).toEqual(['supported-elsewhere', 'supported', 'missing']);
    expect(groundednessScore(judged)).toMatchObject({
      claims: 3,
      supported: 1,
      supportedElsewhere: 1,
      missing: 1,
      groundedness: 2 / 3,
      citationAccuracy: 1 / 3
    });
  });
});
