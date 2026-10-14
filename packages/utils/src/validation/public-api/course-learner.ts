import * as z from 'zod';

import { ZPublicApiCourseMemberParam } from './course-member';

export const ZPublicApiCourseLearnerLessonParam = ZPublicApiCourseMemberParam.extend({
  lessonId: z.string().uuid()
});
export type TPublicApiCourseLearnerLessonParam = z.infer<typeof ZPublicApiCourseLearnerLessonParam>;

export const ZPublicApiSetLearnerLessonCompletion = z.object({
  isComplete: z.boolean().describe('true records the lesson as completed; false undoes it.')
});
export type TPublicApiSetLearnerLessonCompletion = z.infer<typeof ZPublicApiSetLearnerLessonCompletion>;

export const ZPublicApiCourseLearnerExerciseParam = ZPublicApiCourseMemberParam.extend({
  exerciseId: z.string().uuid()
});
export type TPublicApiCourseLearnerExerciseParam = z.infer<typeof ZPublicApiCourseLearnerExerciseParam>;

const ANSWER_FORMATS = [
  'True/false: "true" or "false".',
  'Short answer and paragraph: the plain text.',
  'Every other type: a JSON string.',
  'Multiple choice: {"type":"CHECKBOX","optionIds":[30,31]}.',
  'Numeric: {"type":"NUMERIC","value":2}.',
  'Fill in the blank: {"type":"FILL_BLANK","answers":["Paris"]}.',
  'Word bank: {"type":"WORD_BANK","filledBlanks":["Paris"]}.',
  'Matching: {"type":"MATCHING","value":[{"left":"A","right":"1"}]}.',
  'Ordering: {"type":"ORDERING","value":["first","second"]}.',
  'Link: {"type":"LINK","links":["https://example.com"]}.',
  'Hotspot: {"type":"HOTSPOT","value":[{"x":10,"y":20}]}.',
  'Star rating: {"type":"STAR","value":4}.'
].join(' ');

export const ZPublicApiCreateLearnerSubmission = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().describe('Must be a question of this exercise.'),
        optionId: z
          .number()
          .int()
          .optional()
          .describe('Single choice questions only: the chosen option, which must belong to the question.'),
        answer: z.string().optional().describe(`Every question type except single choice. ${ANSWER_FORMATS}`)
      })
    )
    .min(1)
    .max(500)
    .refine((answers) => new Set(answers.map((answer) => answer.questionId)).size === answers.length, {
      message: 'Each questionId can appear only once'
    })
    .describe(
      'One entry per answered question. File-upload and video-recording questions cannot be answered through the API.'
    )
});
export type TPublicApiCreateLearnerSubmission = z.infer<typeof ZPublicApiCreateLearnerSubmission>;
