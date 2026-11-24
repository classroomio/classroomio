import type { BetaTextCitation } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { describe, expect, it } from 'vitest';
import type * as z from 'zod/v4';

import type { CorpusBlock } from '../corpus/types';
import type { FetchResponse } from '../fetch/types';
import type { CitedTextPart, ClaudeRequest } from '../llm/claude';
import { oembedInfo, withLessonMedia } from '../media/lesson-media';
import { ENGLISH_PACKAGE_LABELS, type LessonBlock } from '../package/schema';
import type { SectionBrief } from '../plan/briefs';
import type { CoursePlan } from '../plan/sections';
import { packageLabels, writeCourse } from './course-writer';
import { briefBlocks, checkQuestions, SECTION_CHECK_SYSTEM, sectionCheck, type QuestionDraft } from './quizzes';
import { sourceResults, toWrittenSection, writeSection, WRITER_SYSTEM } from './section-writer';

const URL_A = 'https://acme.com/docs/meters';

function block(id: string, kind: CorpusBlock['kind'], text: string, extra: Partial<CorpusBlock> = {}): CorpusBlock {
  return { id, kind, text, headingPath: [], ...extra };
}

const METER_BLOCKS: CorpusBlock[] = [
  block('m-0', 'paragraph', 'A meter reports a reading every 15 minutes.'),
  block('m-1', 'step', 'Open Settings.', { stepNumber: 1 }),
  block('m-2', 'image', 'Settings menu', { imageUrl: 'https://acme.com/img/settings.png' }),
  block('m-3', 'step', 'Choose Add meter.', { stepNumber: 2 }),
  block('m-4', 'step', 'Save the meter.', { stepNumber: 3 }),
  block('m-5', 'image', 'Acme logo', { imageUrl: 'https://acme.com/img/brand.png' }),
  block('m-6', 'video', 'https://videos.example/embed/42')
];

function brief(key = 'add', lessons = ['what', 'how']): SectionBrief {
  return {
    courseKey: 'meters',
    courseTitle: 'Meters',
    section: { key, title: `Section ${key}`, objectives: [{ text: 'Add a meter', bloom: 'apply' }] },
    lessons: lessons.map((lessonKey) => ({
      key: lessonKey,
      title: `Lesson ${lessonKey}`,
      sources: [{ pageId: 'meters', url: URL_A, title: 'Add a meter', contentHash: 'hash-a', blocks: METER_BLOCKS }]
    })),
    siblingTitles: ['Reports'],
    glossary: []
  };
}

function cite(start: number, end: number, index = 0): BetaTextCitation {
  return {
    type: 'search_result_location',
    cited_text: '',
    search_result_index: index,
    start_block_index: start,
    end_block_index: end,
    source: URL_A,
    title: 'Add a meter'
  };
}

function part(text: string, citations: BetaTextCitation[] = []): CitedTextPart {
  return { text, citations };
}

const WRITTEN: CitedTextPart[] = [
  part('## Lesson: what\n\nIn this lesson you learn about meters.\n\n'),
  part('A meter reports every 15 minutes.', [cite(0, 1)]),
  part('\n\n> Tip: Save before you leave. <script>x</script>', [cite(3, 4)]),
  part('\n\nBilling is not described. This is not covered in the documentation.\n\n## Lesson: how\n\n### Add one\n\n'),
  part('1. Open Settings.\n2. Choose Add meter.', [cite(1, 3)])
];

describe('section writer', () => {
  it('turns cited prose into lessons whose blocks cite the source block ids', () => {
    const section = toWrittenSection(WRITTEN, brief(), sourceResults(brief()), '2026-11-20T00:00:00Z');

    expect(section.issues).toEqual([]);
    expect(section.gaps).toEqual([
      { topic: 'Lesson what', detail: 'Billing is not described. This is not covered in the documentation.' }
    ]);
    const [what, how] = section.lessons;
    expect(what.blocks).toEqual([
      {
        type: 'text',
        html: '<p>In this lesson you learn about meters.</p>\n<p>A meter reports every 15 minutes.</p>',
        citations: [{ pageUrl: URL_A, blockIds: ['m-0'], contentHash: 'hash-a', fetchedAt: '2026-11-20T00:00:00Z' }]
      },
      {
        type: 'callout',
        tone: 'tip',
        html: '<p>Save before you leave. &lt;script&gt;x&lt;/script&gt;</p>',
        citations: [{ pageUrl: URL_A, blockIds: ['m-4'], contentHash: 'hash-a', fetchedAt: '2026-11-20T00:00:00Z' }]
      }
    ]);
    expect(what.uncitedParagraphs).toBe(1);
    expect(how.blocks[0]).toMatchObject({ type: 'text', citations: [{ blockIds: ['m-1', 'm-3'] }] });
    expect(how.blocks[0].type === 'text' && how.blocks[0].html).toContain('<h3>Add one</h3>');
  });

  it('drops a leading heading that repeats the lesson title, keeping the citations in place', () => {
    const section = toWrittenSection(
      [
        { text: '## Lesson: what\n\n### Lesson what\n\n', citations: [] },
        { text: 'A meter reports every 15 minutes.', citations: [cite(0, 1)] }
      ],
      brief(),
      sourceResults(brief()),
      'now'
    );

    expect(section.lessons[0].blocks).toEqual([
      {
        type: 'text',
        html: '<p>A meter reports every 15 minutes.</p>',
        citations: [{ pageUrl: URL_A, blockIds: ['m-0'], contentHash: 'hash-a', fetchedAt: 'now' }]
      }
    ]);
  });

  it('reports a lesson the writer skipped', () => {
    const section = toWrittenSection(
      [part('## Lesson: what\n\nText.', [cite(0, 1)])],
      brief(),
      sourceResults(brief()),
      'now'
    );

    expect(section.issues).toEqual(['Lesson how was not written.']);
  });

  it('sends a cached course prefix, one search result per source without media, then the outline', async () => {
    const requests: ClaudeRequest[] = [];
    const caller = {
      async cited(request: ClaudeRequest) {
        requests.push(request);

        return WRITTEN;
      }
    };

    await writeSection(
      caller,
      { courseTitle: 'Meters', audience: 'Admins', outcomes: ['Add meters'], glossary: [], fetchedAt: 'now' },
      brief()
    );

    const [prefix, result, outline] = requests[0].content;
    expect(requests[0].system).toBe(WRITER_SYSTEM);
    expect(prefix).toMatchObject({ type: 'text', cache_control: { type: 'ephemeral' } });
    expect(result).toMatchObject({ type: 'search_result', source: URL_A, citations: { enabled: true } });
    expect(result.type === 'search_result' && result.content.map((entry) => entry.text)).toEqual([
      'A meter reports a reading every 15 minutes.',
      'Open Settings.',
      'Choose Add meter.',
      'Save the meter.'
    ]);
    expect(requests[0].content).toHaveLength(3);
    expect(outline.type === 'text' && outline.text).toContain('- how: Lesson how');
  });
});

describe('lesson media', () => {
  const text = (blockIds: string[]): LessonBlock => ({
    type: 'text',
    html: '<p>x</p>',
    citations: [{ pageUrl: URL_A, blockIds, contentHash: 'hash-a', fetchedAt: 'now' }]
  });

  it('places each screenshot after the text citing the step before it, and skips logos and unconfirmed videos', async () => {
    const lesson = brief().lessons[0];
    const result = await withLessonMedia([text(['m-0']), text(['m-1']), text(['m-3', 'm-4'])], lesson, {
      fetchedAt: 'now'
    });

    expect(result.blocks.map((entry) => entry.type)).toEqual(['text', 'text', 'image', 'text']);
    expect(result.blocks[2]).toMatchObject({
      url: 'https://acme.com/img/settings.png',
      sourceUrl: URL_A,
      citation: { blockIds: ['m-2'] }
    });
    expect(result.skipped).toBe(2);
  });

  it('adds an embedded video its oEmbed answer confirms, and an image from the host’s copy', async () => {
    const lesson = brief().lessons[0];
    const result = await withLessonMedia([text(['m-1'])], lesson, {
      fetchedAt: 'now',
      storedImageUrl: (url) => url.replace('https://acme.com/img/', 'https://cdn.host/'),
      videoInfo: async () => ({ title: 'Add a meter in 2 minutes', provider: 'ExampleVideo' })
    });

    expect(result.blocks.map((entry) => entry.type)).toEqual(['text', 'image', 'video']);
    expect(result.blocks[1]).toMatchObject({ url: 'https://cdn.host/settings.png' });
    expect(result.blocks[2]).toMatchObject({
      url: 'https://videos.example/embed/42',
      title: 'Add a meter in 2 minutes'
    });
  });

  it('reads a video’s title from the oEmbed link its player page advertises', async () => {
    const responses: Record<string, string> = {
      'https://videos.example/embed/42':
        '<html><head><link rel="alternate" type="application/json+oembed" href="/oembed?id=42"></head></html>',
      'https://videos.example/oembed?id=42': JSON.stringify({
        type: 'video',
        title: 'Add a meter',
        provider_name: 'ExampleVideo'
      })
    };
    const fetcher = {
      async get(url: string): Promise<FetchResponse> {
        const body = responses[url];

        return { url, status: body ? 200 : 404, body: body ?? '', headers: {}, redirects: [], truncated: false };
      }
    };

    expect(await oembedInfo(fetcher, 'https://videos.example/embed/42')).toEqual({
      title: 'Add a meter',
      provider: 'ExampleVideo'
    });
    expect(await oembedInfo(fetcher, 'https://videos.example/embed/7')).toBeNull();
  });
});

function question(overrides: Partial<QuestionDraft>): QuestionDraft {
  return {
    type: 'single',
    prompt: 'How often does a meter report?',
    options: [
      { label: 'Every 15 minutes', correct: true },
      { label: 'Every hour', correct: false },
      { label: 'Once a day', correct: false }
    ],
    orderedSteps: [],
    supportBlockIds: ['m-0'],
    bloom: 'remember',
    ...overrides
  };
}

describe('quizzes', () => {
  const blocks = briefBlocks([brief()]);
  const checkTypes = new Set<QuestionDraft['type']>(['single', 'multiple', 'true-false', 'ordering']);

  it('keeps questions that meet the item rules and says why each other one was dropped', () => {
    const trueFalse = question({
      type: 'true-false',
      options: [
        { label: 'True', correct: true },
        { label: 'False', correct: false }
      ]
    });
    const checked = checkQuestions(
      [
        question({}),
        question({ supportBlockIds: ['zz-1'] }),
        question({
          options: [
            { label: 'Every 15 minutes', correct: true },
            { label: 'All of the above', correct: false },
            { label: 'Hourly', correct: false }
          ]
        }),
        question({
          type: 'ordering',
          options: [],
          orderedSteps: ['Open Settings.', 'Choose Add meter.'],
          supportBlockIds: ['m-1', 'm-3']
        }),
        question({
          type: 'ordering',
          options: [],
          orderedSteps: ['Choose Add meter.', 'Open Settings.'],
          supportBlockIds: ['m-1', 'm-3']
        }),
        trueFalse,
        trueFalse,
        question({ type: 'link', options: [] })
      ],
      blocks,
      checkTypes
    );

    expect(checked.questions.map((entry) => entry.type)).toEqual(['single', 'ordering', 'true-false']);
    expect(checked.problems).toEqual([
      'Question 2 ("How often does a meter report?"): cites no block of the sources.',
      'Question 3 ("How often does a meter report?"): Options cannot be "all of the above".',
      'Question 5 ("How often does a meter report?"): the order given differs from the numbered source steps.',
      'Question 7 ("How often does a meter report?"): only one true/false question is allowed.',
      'Question 8 ("How often does a meter report?"): type link is not allowed here.'
    ]);
  });

  it('asks again with the problems when fewer than 3 questions survive', async () => {
    const requests: ClaudeRequest[] = [];
    const caller = {
      async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
        requests.push(request);
        const questions =
          requests.length === 1
            ? [question({}), question({ supportBlockIds: [] })]
            : [question({}), question({}), question({})];

        return request.schema.parse({ questions }) as z.infer<Schema>;
      }
    };

    const check = await sectionCheck(caller, brief());

    expect(requests).toHaveLength(2);
    const retry = requests[1].content[0];
    expect(retry.type === 'text' && retry.text).toContain('cites no block of the sources');
    expect(check.questions).toHaveLength(3);
  });
});

describe('course writer', () => {
  const plan: CoursePlan = {
    course: {
      key: 'meters',
      title: 'Meters',
      area: 'Meters',
      audience: 'Admins',
      why: 'Start here.',
      pageIds: ['meters']
    },
    title: 'Meters',
    description: 'All about meters.',
    outcomes: ['Explain meters', 'Add a meter', 'Read a meter'],
    level: 'beginner',
    sections: [],
    openQuestions: [],
    issues: []
  };

  it('writes the first section alone until it answers, then the rest, and assembles a valid course', async () => {
    const events: string[] = [];
    const caller = {
      async cited(request: ClaudeRequest) {
        const outline = request.content[request.content.length - 1];
        const key = outline.type === 'text' ? outline.text.match(/section "Section (\w+)"/)![1] : '';
        events.push(`start ${key}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
        request.onFirstToken?.();
        events.push(`answer ${key}`);

        return [part('## Lesson: what\n\n'), part('A meter reports every 15 minutes.', [cite(0, 1)])];
      },
      async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
        const quiz = { questions: [question({}), question({}), question({})] };
        const final = {
          finalQuiz: Array.from({ length: 10 }, () => question({})),
          practiceTasks: [
            question({ type: 'link', options: [], prompt: 'Add a meter in your account and paste its link.' })
          ]
        };

        return request.schema.parse(request.system === SECTION_CHECK_SYSTEM ? quiz : final) as z.infer<Schema>;
      }
    };

    const written = await writeCourse(caller, {
      plan,
      briefs: [brief('one', ['what']), brief('two', ['what']), brief('three', ['what'])],
      glossary: [],
      fetchedAt: 'now',
      staggerMs: 0
    });

    expect(events.slice(0, 2)).toEqual(['start one', 'answer one']);
    expect(written.issues).toEqual([]);
    expect(written.course.sections.map((section) => section.check.length)).toEqual([3, 3, 3]);
    expect(written.course.finalQuiz).toHaveLength(10);
    expect(written.course.practiceTasks).toHaveLength(1);
    expect(written.stats.images).toBe(3);
  });

  it('uses the English labels as written and translates them once for another language', async () => {
    const caller = {
      async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }) {
        return request.schema.parse({
          ...ENGLISH_PACKAGE_LABELS,
          source: 'Quelle',
          sectionCheck: 'Test: {section}'
        }) as z.infer<Schema>;
      }
    };

    expect(await packageLabels(caller, 'en-GB')).toBe(ENGLISH_PACKAGE_LABELS);
    expect(await packageLabels(caller, 'de')).toMatchObject({ source: 'Quelle', sectionCheck: 'Test: {section}' });
  });
});
