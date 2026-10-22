import * as z from 'zod';

export const VIDEO_CHECKPOINT_QUESTION_TYPES = [
  'RADIO',
  'CHECKBOX',
  'TRUE_FALSE',
  'NUMERIC',
  'FILL_BLANK',
  'WORD_BANK',
  'ORDERING',
  'STAR'
] as const;
export type TVideoCheckpointQuestionType = (typeof VIDEO_CHECKPOINT_QUESTION_TYPES)[number];

export const VIDEO_CHECKPOINT_RESUME_POLICIES = ['any', 'correct'] as const;
export type TVideoCheckpointResumePolicy = (typeof VIDEO_CHECKPOINT_RESUME_POLICIES)[number];

export const VIDEO_CHECKPOINT_MIN_GAP_SECONDS = 2;
export const VIDEO_CHECKPOINT_MAX_PER_ASSET = 20;

export const ZVideoCheckpointOption = z.object({
  label: z.string().max(500),
  value: z.string().max(200).nullish(),
  isCorrect: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional()
});
export type TVideoCheckpointOption = z.infer<typeof ZVideoCheckpointOption>;

type CheckpointRuleInput = {
  title: string;
  questionType: TVideoCheckpointQuestionType;
  settings: Record<string, unknown>;
  options: TVideoCheckpointOption[];
};

function filledOptions(options: TVideoCheckpointOption[]) {
  return options.filter((option) => option.label.trim().length > 0 || Boolean(option.value));
}

/** Mirrors the exercise editor's per-type rules for the question types a video checkpoint allows. */
export function getVideoCheckpointQuestionIssue(question: CheckpointRuleInput): string | null {
  const { questionType, settings, options } = question;

  if (questionType === 'RADIO' || questionType === 'CHECKBOX') {
    const filled = filledOptions(options);
    if (filled.length < 2) return 'Add at least two options';
    if (!filled.some((option) => option.isCorrect)) return 'Mark the correct answer';
    if (questionType === 'RADIO' && filled.filter((option) => option.isCorrect).length !== 1) {
      return 'Mark exactly one correct answer';
    }
  }

  if (questionType === 'TRUE_FALSE' && typeof settings.correctValue !== 'boolean') {
    return 'Set whether the statement is true or false';
  }

  if (questionType === 'NUMERIC' && !Number.isFinite(Number(settings.correctValue))) {
    return 'Set the correct number';
  }

  if (questionType === 'STAR') {
    const maxStars = Number(settings.maxStars ?? 5);
    const correctValue = Number(settings.correctValue);
    if (!Number.isInteger(correctValue) || correctValue < 1 || correctValue > maxStars) {
      return 'Set the correct star rating';
    }
  }

  if (questionType === 'FILL_BLANK' && !String(settings.acceptedAnswers ?? '').trim()) {
    return 'Add at least one accepted answer';
  }

  if (questionType === 'WORD_BANK') {
    const template = String(settings.template ?? '');
    const blankCount = (template.match(/_{3,}/g) ?? []).length;
    if (blankCount < 1) return 'Add at least one ___ blank in the template';

    const answers = Array.isArray(settings.correctAnswers) ? settings.correctAnswers : [];
    if (answers.length < blankCount || answers.some((value) => !String(value ?? '').trim())) {
      return 'Fill in the correct word for every blank';
    }
  }

  if (questionType === 'ORDERING' && filledOptions(options).length < 2) {
    return 'Add at least two items to order';
  }

  return null;
}

const checkpointFields = {
  timestampSeconds: z.number().int().min(0),
  questionType: z.enum(VIDEO_CHECKPOINT_QUESTION_TYPES),
  title: z.string().trim().min(1).max(1000),
  settings: z.record(z.string(), z.unknown()).default({}),
  resumePolicy: z.enum(VIDEO_CHECKPOINT_RESUME_POLICIES).default('any'),
  options: z.array(ZVideoCheckpointOption).max(20).default([])
};

function refineCheckpointQuestion(value: CheckpointRuleInput & { timestampSeconds: number }, context: z.RefinementCtx) {
  const issue = getVideoCheckpointQuestionIssue(value);
  if (issue) {
    context.addIssue({ code: 'custom', message: issue, path: ['options'] });
  }
}

export const ZVideoCheckpointCreate = z
  .object({ assetId: z.string().trim().min(1), ...checkpointFields })
  .superRefine(refineCheckpointQuestion);
export type TVideoCheckpointCreate = z.infer<typeof ZVideoCheckpointCreate>;

export const ZVideoCheckpointUpdate = z.object(checkpointFields).superRefine(refineCheckpointQuestion);
export type TVideoCheckpointUpdate = z.infer<typeof ZVideoCheckpointUpdate>;

export const ZVideoCheckpointLessonParam = z.object({
  lessonId: z.string().min(1)
});

export const ZVideoCheckpointParam = z.object({
  lessonId: z.string().min(1),
  checkpointId: z.string().uuid()
});
export type TVideoCheckpointParam = z.infer<typeof ZVideoCheckpointParam>;

export const ZVideoCheckpointAnswerData = z.discriminatedUnion('type', [
  z.object({ type: z.literal('RADIO'), optionId: z.number().int() }),
  z.object({ type: z.literal('CHECKBOX'), optionIds: z.array(z.number().int()).max(20) }),
  z.object({ type: z.literal('TRUE_FALSE'), value: z.boolean() }),
  z.object({ type: z.literal('NUMERIC'), value: z.number().finite() }),
  z.object({ type: z.literal('FILL_BLANK'), values: z.array(z.string().max(500)).max(50) }),
  z.object({ type: z.literal('WORD_BANK'), filledBlanks: z.array(z.string().max(500)).max(50) }),
  z.object({ type: z.literal('ORDERING'), orderedValues: z.array(z.string().max(200)).max(50) }),
  z.object({ type: z.literal('STAR'), value: z.number().int().min(1).max(10) })
]);

export const ZVideoCheckpointAnswer = z.object({
  answerData: ZVideoCheckpointAnswerData
});
export type TVideoCheckpointAnswer = z.infer<typeof ZVideoCheckpointAnswer>;
