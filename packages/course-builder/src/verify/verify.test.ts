import { describe, expect, it } from 'vitest';
import type * as z from 'zod/v4';

import type { ClaudeRequest } from '../llm/claude';
import type { PackageCourse, QuizQuestion } from '../package/schema';
import { BLIND_SOLVER_SYSTEM, checkAnswerKey, checkOrdering, OPTION_AUDIT_SYSTEM } from './answer-keys';
import { checkLessonClaims, claimSentences, lessonClaims, withCorrectedCitations } from './claims';
import { codeChecks, withoutUnreadLinks } from './code-checks';
import { repairLoop } from './repair';
import { applyReviewFixes, reviewCourse } from './review';
import type { CheckIssue, SourceBlock, StructuredCaller } from './types';

const PAGE = 'https://acme.com/docs/meters';

function block(id: string, text: string, extra: Partial<SourceBlock> = {}): [string, SourceBlock] {
  return [id, { id, text, pageUrl: PAGE, kind: 'paragraph', excluded: null, ...extra }];
}

const BLOCKS = new Map<string, SourceBlock>([
  block('b1', 'A meter reports a reading every 15 minutes.'),
  block('b2', 'Readings are kept for two years.'),
  block('s1', 'Open Settings.', { kind: 'step', stepNumber: 1 }),
  block('s2', 'Choose Meters.', { kind: 'step', stepNumber: 2 }),
  block('s3', 'Click Add meter.', { kind: 'step', stepNumber: 3 }),
  block('old', 'Use the classic importer.', { excluded: 'obsolete', pageUrl: 'https://acme.com/docs/classic' })
]);

function citation(...blockIds: string[]) {
  return { pageUrl: PAGE, blockIds, contentHash: 'abcd1234', fetchedAt: '2026-11-19T10:00:00Z' };
}

function single(prompt: string, supportBlockIds = ['b1']): QuizQuestion {
  return {
    type: 'single',
    prompt,
    points: 1,
    options: [
      { label: 'Every 15 minutes', correct: true },
      { label: 'Every hour', correct: false },
      { label: 'Once a day', correct: false }
    ],
    supportBlockIds,
    bloom: 'remember'
  };
}

function course(): PackageCourse {
  return {
    key: 'meters',
    title: 'Monitor your meters',
    description: 'Set up meters and read their data.',
    audience: 'Facility managers',
    outcomes: ['Add a meter'],
    sections: [
      {
        key: 'basics',
        title: 'Meter basics',
        lessons: [
          {
            key: 'what',
            title: 'What a meter reports',
            sourceUrls: [PAGE],
            blocks: [
              {
                type: 'text',
                html: '<p>A meter reports every <strong>15 minutes</strong>.</p>',
                citations: [citation('b1')]
              },
              { type: 'callout', tone: 'note', html: '<p>Readings are kept for two years.</p>', citations: [] }
            ]
          },
          {
            key: 'history',
            title: 'Reading history',
            sourceUrls: [PAGE],
            blocks: [{ type: 'text', html: '<p>Readings are kept for two years.</p>', citations: [citation('b2')] }]
          }
        ],
        check: [single('How often does a meter report?')]
      },
      {
        key: 'setup',
        title: 'Add a meter',
        lessons: [
          {
            key: 'add',
            title: 'Add your first meter',
            sourceUrls: [PAGE],
            blocks: [
              {
                type: 'text',
                html: '<p>Open Settings, choose Meters, then Add meter.</p>',
                citations: [citation('s1', 's2', 's3')]
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
}

function fakeCaller(answer: (request: ClaudeRequest) => unknown): StructuredCaller & { calls: ClaudeRequest[] } {
  const calls: ClaudeRequest[] = [];

  return {
    calls,
    async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
      calls.push(request);

      return request.schema.parse(answer(request)) as z.infer<Schema>;
    }
  };
}

function promptOf(request: ClaudeRequest): string {
  const first = request.content[0];

  return first.type === 'text' ? first.text : '';
}

describe('claim checks', () => {
  it('cuts block HTML into factual sentences: headings dropped, list items apart, prose split by sentence', () => {
    expect(
      claimSentences(
        '<h3>Meters</h3><p>A meter reports every 15 minutes. Readings are kept for two years, e.g. for audits.</p><ul><li>Open the Meters page.</li><li>Ok.</li></ul><p>Energis.Cloud stores data &amp; alerts.</p>'
      )
    ).toEqual([
      'A meter reports every 15 minutes.',
      'Readings are kept for two years, e.g. for audits.',
      'Open the Meters page.',
      'Energis.Cloud stores data & alerts.'
    ]);
  });

  it('makes one claim per sentence of the text and callout blocks, carrying the blocks its block cites', () => {
    const claims = lessonClaims(course().sections[0].lessons[0]);

    expect(claims.map((claim) => [claim.index, claim.blockIndex, claim.text, claim.blockIds])).toEqual([
      [1, 0, 'A meter reports every 15 minutes.', ['b1']],
      [2, 1, 'Readings are kept for two years.', []]
    ]);
  });

  it('lists each cited block once and flags every claim not called supported, including a missing verdict', async () => {
    const caller = fakeCaller(() => ({
      verdicts: [{ claimIndex: 1, verdict: 'supported', sourceBlockIds: [], reason: 'stated' }]
    }));

    const check = await checkLessonClaims(caller, course().sections[0].lessons[0], BLOCKS);

    expect(caller.calls).toHaveLength(1);
    expect(caller.calls[0].role).toBe('checker');
    expect(promptOf(caller.calls[0])).toContain('[b1] A meter reports a reading every 15 minutes.');
    expect(promptOf(caller.calls[0])).toContain('CLAIM 2 (uncited): Readings are kept for two years.');
    expect(check.results.map((result) => result.verdict)).toEqual(['supported', 'missing']);
    expect(check.issues.map((issue) => [issue.target, issue.kind])).toEqual([['lesson:what', 'unsupported-claim']]);
    expect(check.issues[0].reason).toContain('no verdict');
  });

  it('reads the whole sources, and corrects the citation of a claim another block states instead of flagging it', async () => {
    const sources = [
      {
        url: PAGE,
        title: 'Meters',
        contentHash: 'hash-m',
        blocks: [...BLOCKS.values()].filter((entry) => !entry.excluded).map(({ id, text }) => ({ id, text }))
      }
    ];
    const lesson = course().sections[0].lessons[0];
    const caller = fakeCaller(() => ({
      verdicts: [
        { claimIndex: 1, verdict: 'supported', sourceBlockIds: [], reason: 'stated' },
        { claimIndex: 2, verdict: 'supported-elsewhere', sourceBlockIds: ['b2', 'nope'], reason: 'b2 states it' }
      ]
    }));

    const check = await checkLessonClaims(caller, lesson, BLOCKS, { sources });
    const fixed = withCorrectedCitations(lesson, check.results, sources, 'later');

    expect(promptOf(caller.calls[0])).toContain('[s3] Click Add meter.');
    expect(check.issues).toEqual([]);
    expect(check.results[1].sourceBlockIds).toEqual(['b2']);
    expect(fixed.blocks[1]).toMatchObject({
      type: 'callout',
      citations: [{ pageUrl: PAGE, blockIds: ['b2'], contentHash: 'hash-m', fetchedAt: 'later' }]
    });
    expect(fixed.blocks[0]).toBe(lesson.blocks[0]);
  });

  it('treats "supported elsewhere" naming no block of the sources as unsupported', async () => {
    const caller = fakeCaller(() => ({
      verdicts: [
        { claimIndex: 1, verdict: 'supported', sourceBlockIds: [], reason: 'stated' },
        { claimIndex: 2, verdict: 'supported-elsewhere', sourceBlockIds: ['invented'], reason: 'somewhere' }
      ]
    }));

    const check = await checkLessonClaims(caller, course().sections[0].lessons[0], BLOCKS, { sources: [] });

    expect(check.results[1].verdict).toBe('unsupported');
    expect(check.issues).toHaveLength(1);
  });
});

describe('answer-key checks', () => {
  it('passes a key all three blind solves agree with, then audits the wrong options', async () => {
    const caller = fakeCaller((request) =>
      request.system === BLIND_SOLVER_SYSTEM
        ? { chosen: ['every 15 minutes'], reason: 'the source says so' }
        : {
            options: [
              { label: 'Every hour', alsoCorrect: false, reason: '' },
              { label: 'Once a day', alsoCorrect: false, reason: '' }
            ]
          }
    );

    const issues = await checkAnswerKey(caller, single('How often?'), { group: 'basics', index: 1 }, BLOCKS);

    expect(issues).toEqual([]);
    expect(caller.calls.filter((call) => call.system === BLIND_SOLVER_SYSTEM)).toHaveLength(3);
    expect(caller.calls.filter((call) => call.system === OPTION_AUDIT_SYSTEM)).toHaveLength(1);
    expect(promptOf(caller.calls[0])).not.toContain('correct');
  });

  it('flags a key that any blind solve disagrees with, and a wrong option that the source also supports', async () => {
    let solve = 0;
    const disagreeing = fakeCaller(() => {
      solve += 1;

      return { chosen: [solve === 2 ? 'Every hour' : 'Every 15 minutes'], reason: 'read it' };
    });
    const ambiguous = fakeCaller((request) =>
      request.system === BLIND_SOLVER_SYSTEM
        ? { chosen: ['Every 15 minutes'], reason: '' }
        : { options: [{ label: 'Every hour', alsoCorrect: true, reason: 'hourly rollups exist' }] }
    );

    const wrongKey = await checkAnswerKey(disagreeing, single('How often?'), { group: 'basics', index: 1 }, BLOCKS);
    const twoAnswers = await checkAnswerKey(ambiguous, single('How often?'), { group: 'final', index: 2 }, BLOCKS);

    expect(wrongKey).toMatchObject([{ target: 'question:basics#1', kind: 'wrong-key' }]);
    expect(wrongKey[0].reason).toContain('1 of 3');
    expect(disagreeing.calls.some((call) => call.system === OPTION_AUDIT_SYSTEM)).toBe(false);
    expect(twoAnswers).toMatchObject([{ target: 'question:final#2', kind: 'ambiguous-option' }]);
  });

  it('checks ordering questions against the numbered source steps without a model', async () => {
    const ordering = (orderedSteps: string[]): QuizQuestion => ({
      type: 'ordering',
      prompt: 'Put the steps in order',
      points: 1,
      options: [],
      orderedSteps,
      supportBlockIds: ['s3', 's1', 's2'],
      bloom: 'apply'
    });
    const caller = fakeCaller(() => {
      throw new Error('no model call expected');
    });

    expect(checkOrdering(ordering(['Open Settings', 'Choose Meters', 'Click Add meter']), BLOCKS)).toBeNull();
    expect(checkOrdering(ordering(['Choose Meters', 'Open Settings']), BLOCKS)).toMatch(/differs/);
    expect(checkOrdering(ordering(['Open Settings', 'Restart the gateway']), BLOCKS)).toMatch(/not one of/);
    expect(
      await checkAnswerKey(caller, ordering(['Choose Meters', 'Open Settings']), { group: 'setup', index: 1 }, BLOCKS)
    ).toMatchObject([{ kind: 'wrong-order' }]);
  });

  it('spends nothing on questions that carry no key', async () => {
    const caller = fakeCaller(() => ({}));
    const link: QuizQuestion = {
      type: 'link',
      prompt: 'Share a link to your dashboard',
      points: 1,
      options: [],
      supportBlockIds: ['b1'],
      bloom: 'apply'
    };

    expect(await checkAnswerKey(caller, link, { group: 'practice', index: 1 }, BLOCKS)).toEqual([]);
    expect(caller.calls).toHaveLength(0);
  });
});

describe('code checks', () => {
  it('flags unread links, excluded or missing citations, unknown names and other courses, once each', () => {
    const subject = course();
    subject.sections[0].lessons[0].blocks.push(
      {
        type: 'text',
        html: '<p>See <a href="https://elsewhere.com/x">this</a> and <a href="https://acme.com/docs/meters#top">that</a>. Use the <strong>Bulk editor</strong>. Also see Energy reports.</p>',
        citations: [citation('old'), citation('gone'), citation('gone')]
      },
      {
        type: 'video',
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=unverified',
        title: 'Tour',
        citation: null
      }
    );

    const issues = codeChecks(subject, {
      blocks: BLOCKS,
      allowedUrls: new Set([PAGE]),
      glossary: new Set(['Settings', 'Meters', 'Add meter']),
      otherCourseTitles: ['Energy reports']
    });

    expect(issues.map((issue) => [issue.target, issue.kind])).toEqual([
      ['lesson:what', 'unknown-link'],
      ['lesson:what', 'unknown-link'],
      ['lesson:what', 'excluded-citation'],
      ['lesson:what', 'missing-block'],
      ['lesson:what', 'unknown-name'],
      ['lesson:what', 'other-course']
    ]);
    expect(issues[4].reason).toContain('Bulk editor');
  });

  it('unlinks pages that were not read and keeps the rest', () => {
    const lesson = withoutUnreadLinks(
      {
        key: 'x',
        title: 'X',
        sourceUrls: [PAGE],
        blocks: [
          {
            type: 'text',
            html: '<p>See <a href="https://elsewhere.com/x">this</a>, <a href="https://acme.com/docs/meters#top">that</a> and <a href="#steps">below</a>.</p>',
            citations: [citation('b1')]
          }
        ]
      },
      new Set([PAGE])
    );

    expect(lesson.blocks[0].type === 'text' && lesson.blocks[0].html).toBe(
      '<p>See this, <a href="https://acme.com/docs/meters#top">that</a> and <a href="#steps">below</a>.</p>'
    );
  });

  it('passes a clean course, accepting a name the cited text uses though the glossary lacks it', () => {
    const issues = codeChecks(course(), {
      blocks: BLOCKS,
      allowedUrls: new Set([PAGE]),
      glossary: new Set(['Settings']),
      otherCourseTitles: ['Energy reports']
    });

    expect(issues).toEqual([]);
  });
});

describe('repair loop', () => {
  it('stops at the first clean round and removes what still fails after two, with its last reasons', async () => {
    const issue = (target: string, reason: string): CheckIssue => ({ target, kind: 'unsupported-claim', reason });
    const rounds: string[] = [];
    const stillFailing: Record<string, number> = { 'lesson:a': 0, 'lesson:b': 1, 'lesson:c': 5 };

    const outcome = await repairLoop({
      issues: [issue('lesson:a', 'x'), issue('lesson:b', 'y'), issue('lesson:c', 'z'), issue('lesson:c', 'w')],
      repair: async (target, issues, round) => {
        rounds.push(`${target}:${round}:${issues.length}`);
      },
      recheck: async (target) => {
        const remaining = stillFailing[target];
        stillFailing[target] = remaining - 1;

        return remaining > 0 ? [issue(target, `still wrong ${remaining}`)] : [];
      }
    });

    expect(outcome.repaired).toEqual(['lesson:a', 'lesson:b']);
    expect(outcome.removed).toEqual([{ target: 'lesson:c', reason: 'unsupported-claim: still wrong 4' }]);
    expect(rounds.sort()).toEqual(['lesson:a:1:1', 'lesson:b:1:1', 'lesson:b:2:1', 'lesson:c:1:2', 'lesson:c:2:1']);
  });
});

describe('course review', () => {
  it('sends the outline with its keys and returns the fixes', async () => {
    const caller = fakeCaller(() => ({
      fixes: [{ kind: 'flag-gap', target: 'Alerts', detail: 'No lesson on alerts' }]
    }));

    const fixes = await reviewCourse(caller, {
      course: course(),
      coverage: 'Meters: what, add',
      checkerReport: 'clean'
    });

    expect(caller.calls[0].role).toBe('reviewer');
    expect(promptOf(caller.calls[0])).toContain('what: What a meter reports');
    expect(promptOf(caller.calls[0])).toContain('basics#1: How often does a meter report?');
    expect(fixes).toEqual([{ kind: 'flag-gap', target: 'Alerts', detail: 'No lesson on alerts' }]);
  });

  it('applies reorder, retitle, drop and move in code, and hands gaps back', () => {
    const applied = applyReviewFixes(course(), [
      { kind: 'reorder', target: 'course', detail: 'setup, basics' },
      { kind: 'reorder', target: 'basics', detail: 'history,what' },
      { kind: 'retitle', target: 'add', detail: 'Add a meter' },
      { kind: 'move-question', target: 'basics#1', detail: 'final' },
      { kind: 'flag-gap', target: 'Alerts', detail: 'No lesson on alerts' }
    ]);

    expect(applied.course.sections.map((section) => section.key)).toEqual(['setup', 'basics']);
    expect(applied.course.sections[1].lessons.map((lesson) => lesson.key)).toEqual(['history', 'what']);
    expect(applied.course.sections[0].lessons[0].title).toBe('Add a meter');
    expect(applied.course.sections[1].check).toEqual([]);
    expect(applied.course.finalQuiz.map((question) => question.prompt)).toEqual(['How often does a meter report?']);
    expect(applied.gaps).toEqual([{ topic: 'Alerts', detail: 'No lesson on alerts' }]);
    expect(applied.rejected).toEqual([]);
  });

  it('merges two sections in code and drops a duplicate question from a check or the final quiz', () => {
    const subject = course();
    subject.finalQuiz = [single('How often does a meter send a reading?'), single('Which page adds a meter?')];

    const applied = applyReviewFixes(subject, [
      { kind: 'merge-sections', target: 'basics,setup', detail: 'both are short' },
      { kind: 'drop-question', target: 'final#1', detail: 'same fact as basics#1' },
      { kind: 'drop-question', target: 'setup#4', detail: 'no such question' }
    ]);

    expect(applied.course.sections.map((section) => section.key)).toEqual(['basics']);
    expect(applied.course.sections[0].lessons.map((lesson) => lesson.key)).toEqual(['what', 'history', 'add']);
    expect(applied.merges).toEqual([{ sectionKeys: ['basics', 'setup'], reason: 'both are short' }]);
    expect(applied.course.finalQuiz.map((question) => question.prompt)).toEqual(['Which page adds a meter?']);
    expect(applied.removed).toEqual([{ kind: 'question', target: 'final#1', reason: 'same fact as basics#1' }]);
    expect(applied.rejected.map((entry) => entry.reason)).toEqual(['no question has this number']);
  });

  it('rejects fixes that name unknown items or leave items out, and removes a section left empty', () => {
    const original = course();
    const applied = applyReviewFixes(original, [
      { kind: 'reorder', target: 'basics', detail: 'what' },
      { kind: 'retitle', target: 'nope', detail: 'X' },
      { kind: 'move-question', target: 'basics#9', detail: 'final' },
      { kind: 'drop-lesson', target: 'add', detail: 'thin' }
    ]);

    expect(applied.rejected.map((entry) => entry.fix.kind)).toEqual(['reorder', 'retitle', 'move-question']);
    expect(applied.course.sections.map((section) => section.key)).toEqual(['basics']);
    expect(applied.removed).toEqual([
      { kind: 'lesson', target: 'add', reason: 'thin' },
      { kind: 'section', target: 'setup', reason: 'every lesson was dropped' }
    ]);
    expect(original.sections).toHaveLength(2);
  });
});
