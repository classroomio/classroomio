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

export const ZPublicApiCreateLearnerSubmission = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().describe('Must be a question of this exercise.'),
        optionId: z.number().int().optional().describe('The chosen option, for choice questions.'),
        answer: z.string().optional().describe('The answer text, for every other question type.')
      })
    )
    .min(1)
    .max(500)
    .describe('File-upload and video-recording questions cannot be answered through the API.')
});
export type TPublicApiCreateLearnerSubmission = z.infer<typeof ZPublicApiCreateLearnerSubmission>;
