import * as z from 'zod/v4';

import { SOURCE_OUTCOMES } from '../read/types';

export const LEARNING_PACKAGE_VERSION = '1.0';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const ZSourceUrl = z.string().refine(isHttpUrl, { message: 'A page URL must be an absolute http(s) URL' });

export const ZCitation = z.object({
  pageUrl: ZSourceUrl,
  blockIds: z.array(z.string().min(1)).min(1),
  contentHash: z.string().min(1),
  fetchedAt: z.string().min(1)
});

export type Citation = z.infer<typeof ZCitation>;

export const LESSON_BLOCK_TYPES = ['text', 'image', 'video', 'callout'] as const;

export const ZLessonBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), html: z.string().min(1), citations: z.array(ZCitation).min(1) }),
  z.object({
    type: z.literal('image'),
    url: ZSourceUrl.describe('Where the image is stored'),
    sourceUrl: ZSourceUrl.describe('The page the image was published on'),
    alt: z.string(),
    citation: ZCitation
  }),
  z.object({
    type: z.literal('video'),
    provider: z.string().min(1),
    url: ZSourceUrl,
    title: z.string().min(1),
    citation: ZCitation.nullable()
  }),
  z.object({
    type: z.literal('callout'),
    tone: z.enum(['note', 'tip', 'warning']),
    html: z.string().min(1),
    citations: z.array(ZCitation)
  })
]);

export type LessonBlock = z.infer<typeof ZLessonBlock>;

export const QUIZ_QUESTION_TYPES = [
  'single',
  'multiple',
  'true-false',
  'ordering',
  'matching',
  'link',
  'text'
] as const;

export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

const BANNED_OPTION = /\b(all|none) of the above\b/i;

const ZQuizOption = z.object({
  label: z.string().min(1),
  correct: z.boolean()
});

const ZQuizPair = z.object({
  term: z.string().min(1),
  definition: z.string().min(1)
});

/**
 * One question as the plan's item rules require it: one clearly correct answer, 2–3 plausible wrong options, no "all
 * of the above", and a citation for the key.
 */
export const ZQuizQuestion = z
  .object({
    type: z.enum(QUIZ_QUESTION_TYPES),
    prompt: z.string().min(1),
    points: z.number().int().min(1).default(1),
    options: z.array(ZQuizOption).default([]),
    pairs: z.array(ZQuizPair).optional(),
    orderedSteps: z.array(z.string().min(1)).optional(),
    supportBlockIds: z.array(z.string().min(1)).min(1),
    bloom: z.enum(['remember', 'understand', 'apply', 'analyse'])
  })
  .superRefine((question, ctx) => {
    const correct = question.options.filter((option) => option.correct).length;
    const wrong = question.options.length - correct;
    const fail = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });

    for (const [index, option] of question.options.entries()) {
      if (BANNED_OPTION.test(option.label)) fail(['options', index, 'label'], 'Options cannot be "all of the above"');
    }

    switch (question.type) {
      case 'single':
        if (correct !== 1) fail(['options'], 'A single-answer question needs exactly one correct option');
        if (wrong < 2) fail(['options'], 'A single-answer question needs 2–3 plausible wrong options');
        return;
      case 'multiple':
        if (correct < 2) fail(['options'], 'A multiple-answer question needs at least two correct options');
        if (wrong < 1) fail(['options'], 'A multiple-answer question needs at least one wrong option');
        return;
      case 'true-false':
        if (question.options.length !== 2) fail(['options'], 'A true/false question needs exactly two options');
        if (correct !== 1) fail(['options'], 'A true/false question needs one correct option');
        return;
      case 'ordering':
        if ((question.orderedSteps ?? []).length < 2) fail(['orderedSteps'], 'Ordering needs at least two steps');
        return;
      case 'matching':
        if ((question.pairs ?? []).length < 2) fail(['pairs'], 'Matching needs at least two pairs');
        return;
      default:
        return;
    }
  });

export type QuizQuestion = z.infer<typeof ZQuizQuestion>;

export const ZPackageLesson = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  sourceUrls: z.array(ZSourceUrl).min(1),
  blocks: z.array(ZLessonBlock).min(1)
});

export const ZPackageSection = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(ZPackageLesson).min(1),
  check: z.array(ZQuizQuestion)
});

export const ZPackageCourse = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  audience: z.string().min(1),
  outcomes: z.array(z.string().min(1)),
  sections: z.array(ZPackageSection).min(1),
  finalQuiz: z.array(ZQuizQuestion),
  practiceTasks: z.array(ZQuizQuestion)
});

export const ZCompleteness = z.object({
  declared: z.number().int().min(0).nullable(),
  read: z.number().int().min(0),
  ratio: z.number().min(0).max(1).nullable(),
  status: z.enum(['complete', 'partial', 'unverified'])
});

export const ZReportSource = z.object({
  url: ZSourceUrl,
  kind: z.string().min(1),
  evidence: z.string().min(1),
  access: z.enum(['open', 'login', 'challenge']),
  status: z.enum(SOURCE_OUTCOMES),
  completeness: ZCompleteness
});

export const ZBuildReport = z.object({
  sources: z.array(ZReportSource),
  /** Sources found but not read, with the reason. */
  held: z.array(z.object({ url: ZSourceUrl, reason: z.string().min(1) })),
  skipped: z.array(z.object({ url: ZSourceUrl, reason: z.string().min(1) })),
  excludedPages: z.array(z.object({ url: ZSourceUrl, title: z.string(), reason: z.string().min(1) })),
  contradictions: z.array(
    z.object({ topic: z.string().min(1), detail: z.string().min(1), pageUrls: z.array(ZSourceUrl).min(1) })
  ),
  gaps: z.array(z.object({ topic: z.string().min(1), detail: z.string().min(1) })),
  removedItems: z.array(
    z.object({ kind: z.enum(['section', 'lesson', 'question']), target: z.string().min(1), reason: z.string().min(1) })
  ),
  gate: z.object({
    passed: z.boolean(),
    teachablePages: z.number().int().min(0),
    words: z.number().int().min(0),
    reason: z.enum(['enough-material', 'too-few-pages', 'too-few-words', 'all-sources-blocked', 'login-only'])
  }),
  cost: z.object({ totalUsd: z.number().min(0), byRole: z.record(z.string(), z.number().min(0)) }),
  timings: z.object({ totalSeconds: z.number().min(0), byStage: z.record(z.string(), z.number().min(0)) })
});

export type BuildReport = z.infer<typeof ZBuildReport>;

/**
 * The few fixed words a host adds around generated content, written in the package's language by the writing stage.
 * They end up inside course content, so they must be in the course's language, never in the host's interface language.
 */
export const ZPackageLabels = z.object({
  source: z.string().min(1),
  note: z.string().min(1),
  tip: z.string().min(1),
  warning: z.string().min(1),
  sectionCheck: z.string().includes('{section}'),
  finalQuiz: z.string().includes('{course}'),
  practice: z.string().includes('{course}'),
  outcomes: z.string().min(1)
});

export type PackageLabels = z.infer<typeof ZPackageLabels>;

export const ENGLISH_PACKAGE_LABELS: PackageLabels = {
  source: 'Source',
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  sectionCheck: 'Check: {section}',
  finalQuiz: '{course}: final quiz',
  practice: '{course}: practise in your account',
  outcomes: "You'll be able to:"
};

/** The neutral output every host consumes: versioned courses with citations and the report that explains them. */
export const ZLearningPackage = z.object({
  version: z.literal(LEARNING_PACKAGE_VERSION),
  locale: z.string().min(2),
  labels: ZPackageLabels,
  courses: z.array(ZPackageCourse).min(1),
  report: ZBuildReport
});

export type LearningPackage = z.infer<typeof ZLearningPackage>;
export type PackageCourse = z.infer<typeof ZPackageCourse>;
export type PackageSection = z.infer<typeof ZPackageSection>;
export type PackageLesson = z.infer<typeof ZPackageLesson>;
