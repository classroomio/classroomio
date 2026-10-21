import * as z from 'zod';

import { getVideoCheckpointQuestionIssue } from '../lesson/video-checkpoint';
import { ZPublicApiCourseLessonParam } from './course-lesson';

export const ZPublicApiVideoCheckpointQuestionType = z.enum([
  'RADIO',
  'CHECKBOX',
  'TRUE_FALSE',
  'NUMERIC',
  'FILL_BLANK',
  'WORD_BANK',
  'ORDERING',
  'STAR'
]);
export type TPublicApiVideoCheckpointQuestionType = z.infer<typeof ZPublicApiVideoCheckpointQuestionType>;

export const ZPublicApiVideoCheckpointResumePolicy = z.enum(['any', 'correct']);

export const ZPublicApiVideoCheckpointParam = ZPublicApiCourseLessonParam.extend({
  checkpointId: z.string().uuid()
});
export type TPublicApiVideoCheckpointParam = z.infer<typeof ZPublicApiVideoCheckpointParam>;

const ZPublicApiVideoCheckpointOptionInput = z.object({
  label: z.string().max(500).describe('The text learners see for this option or item'),
  value: z.string().max(200).nullish().describe('A stable value for the option; true/false options use "true"/"false"'),
  isCorrect: z.boolean().optional().describe('Whether this option is a correct answer; defaults to false'),
  settings: z.record(z.string(), z.unknown()).optional().describe('Per-option settings, such as an image')
});

const checkpointInputFields = {
  timestampSeconds: z
    .number()
    .int()
    .min(0)
    .describe('Whole seconds into the video where playback pauses; must be at least 2 seconds from another question'),
  questionType: ZPublicApiVideoCheckpointQuestionType.describe('The type of question; all are auto-graded'),
  title: z.string().trim().min(1).max(1000).describe('The question prompt'),
  settings: z
    .record(z.string(), z.unknown())
    .default({})
    .describe(
      'Type-specific settings: correctValue (TRUE_FALSE boolean, NUMERIC number, STAR integer), tolerance and maxStars, acceptedAnswers (FILL_BLANK), template, correctAnswers and distractors (WORD_BANK)'
    ),
  resumePolicy: ZPublicApiVideoCheckpointResumePolicy.default('any').describe(
    'any resumes after any complete answer; correct keeps the learner on the question until the answer is right'
  ),
  options: z
    .array(ZPublicApiVideoCheckpointOptionInput)
    .max(20)
    .default([])
    .describe(
      'Answer options for RADIO, CHECKBOX and TRUE_FALSE, or the items of an ORDERING question in their correct order'
    )
};

type CheckpointRuleInput = {
  title: string;
  questionType: TPublicApiVideoCheckpointQuestionType;
  settings: Record<string, unknown>;
  options: Array<z.infer<typeof ZPublicApiVideoCheckpointOptionInput>>;
};

function refineQuestion(value: CheckpointRuleInput, context: z.RefinementCtx) {
  const issue = getVideoCheckpointQuestionIssue(value);
  if (issue) {
    context.addIssue({ code: 'custom', message: issue, path: ['options'] });
  }
}

export const ZPublicApiCreateVideoCheckpointFields = z.object({
  assetId: z.string().uuid().describe("The uploaded video the question is on, from the lesson's videos"),
  ...checkpointInputFields
});
export const ZPublicApiCreateVideoCheckpoint = ZPublicApiCreateVideoCheckpointFields.superRefine(refineQuestion);
export type TPublicApiCreateVideoCheckpoint = z.infer<typeof ZPublicApiCreateVideoCheckpoint>;

export const ZPublicApiUpdateVideoCheckpointFields = z.object(checkpointInputFields);
export const ZPublicApiUpdateVideoCheckpoint = ZPublicApiUpdateVideoCheckpointFields.superRefine(refineQuestion);
export type TPublicApiUpdateVideoCheckpoint = z.infer<typeof ZPublicApiUpdateVideoCheckpoint>;

export const ZPublicApiVideoCheckpointOptionResponse = z.object({
  id: z.number().int(),
  label: z.string(),
  value: z.string().nullable(),
  isCorrect: z.boolean(),
  settings: z.record(z.string(), z.unknown())
});

export const ZPublicApiVideoCheckpointResponse = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  assetId: z.string(),
  timestampSeconds: z.number().int(),
  questionType: ZPublicApiVideoCheckpointQuestionType,
  title: z.string(),
  settings: z.record(z.string(), z.unknown()),
  resumePolicy: ZPublicApiVideoCheckpointResumePolicy,
  options: z.array(ZPublicApiVideoCheckpointOptionResponse)
});
export type TPublicApiVideoCheckpointResponse = z.infer<typeof ZPublicApiVideoCheckpointResponse>;

export const ZPublicApiVideoCheckpointListResponse = z.object({
  checkpoints: z.array(ZPublicApiVideoCheckpointResponse).describe('Ordered by time in the video')
});

export const ZPublicApiVideoCheckpointDeleteResponse = z.object({ id: z.string().uuid() });

const ZPublicApiVideoCheckpointAnswerData = z.discriminatedUnion('type', [
  z.object({ type: z.literal('RADIO'), optionId: z.number().int() }),
  z.object({ type: z.literal('CHECKBOX'), optionIds: z.array(z.number().int()) }),
  z.object({ type: z.literal('TRUE_FALSE'), value: z.boolean() }),
  z.object({ type: z.literal('NUMERIC'), value: z.number() }),
  z.object({ type: z.literal('FILL_BLANK'), values: z.array(z.string()) }),
  z.object({ type: z.literal('WORD_BANK'), filledBlanks: z.array(z.string()) }),
  z.object({ type: z.literal('ORDERING'), orderedValues: z.array(z.string()) }),
  z.object({ type: z.literal('STAR'), value: z.number().int() })
]);

export const ZPublicApiVideoCheckpointResultsResponse = z.object({
  enrolledStudentCount: z.number().int(),
  learnersAnsweredAll: z.number().int().describe('Learners who answered every question on the lesson'),
  learnersAnsweredAny: z.number().int(),
  overallCorrectPercent: z.number().nullable().describe('Whole percent of all answers that were correct'),
  checkpoints: z.array(
    z.object({
      checkpointId: z.string().uuid(),
      timestampSeconds: z.number().int(),
      title: z.string(),
      questionType: z.string(),
      answeredCount: z.number().int(),
      correctCount: z.number().int(),
      correctPercent: z.number().nullable(),
      commonWrongAnswer: z
        .object({ label: z.string(), count: z.number().int(), percent: z.number() })
        .nullable()
        .describe('The most chosen wrong answer for option-based questions')
    })
  ),
  answers: z.array(
    z.object({
      checkpointId: z.string().uuid(),
      profileId: z.string().uuid(),
      fullname: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      answerData: ZPublicApiVideoCheckpointAnswerData,
      answerSummary: z.string(),
      isCorrect: z.boolean(),
      answeredAt: z.string()
    })
  )
});
