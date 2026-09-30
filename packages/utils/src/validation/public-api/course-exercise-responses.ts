import * as z from 'zod';

import { ZPublicApiExerciseSectionAfterBehavior, ZPublicApiQuestionTypeId } from './course-exercise';
import { ZPublicApiSubmissionGradingState } from './course-submission';

// Response shapes for OpenAPI docs only; handlers don't validate against them. Timestamps are Postgres text, not strict ISO.
const timestamp = z.string();
const nullableTimestamp = z.string().nullable();
const settings = z.record(z.string(), z.unknown());

export const ZPublicApiCourseExerciseResponse = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid().nullable(),
  sectionId: z.string().uuid().nullable(),
  lessonId: z.string().uuid().nullable().describe('Deprecated: exercises now belong to a course section'),
  title: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  slug: z.string().nullable(),
  isUnlocked: z.boolean().nullable(),
  dueBy: nullableTimestamp,
  allowMultipleAttempts: z.boolean(),
  sectionDisplayMode: z.string().nullable().describe('one_question | all_questions'),
  completionPolicy: z.string().describe('submitted | passed'),
  passThreshold: z.number().nullable(),
  createdAt: nullableTimestamp,
  updatedAt: nullableTimestamp
});

export const ZPublicApiExerciseQuestionResponse = z.object({
  id: z.number(),
  name: z.string().describe('Stable key used in submission answers'),
  question: z.string(),
  questionTypeId: ZPublicApiQuestionTypeId,
  points: z.number(),
  order: z.number(),
  settings,
  exerciseSectionId: z.string().uuid().nullable(),
  options: z.array(
    z.object({
      id: z.number(),
      label: z.string().nullable(),
      value: z.string().nullable(),
      isCorrect: z.boolean(),
      settings
    })
  )
});

export const ZPublicApiCourseExerciseDetailResponse = ZPublicApiCourseExerciseResponse.extend({
  questions: z.array(ZPublicApiExerciseQuestionResponse),
  sections: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().nullable(),
      order: z.number(),
      colorTheme: z.string(),
      afterBehavior: ZPublicApiExerciseSectionAfterBehavior,
      questionIds: z.array(z.number())
    })
  )
});

export const ZPublicApiCourseExerciseNotifyResponse = z.object({
  jobId: z.string()
});

export const ZPublicApiCourseExerciseNotifyStatusResponse = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'canceled']),
  createdAt: timestamp,
  updatedAt: timestamp,
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  nextPollMs: z.number().describe('Suggested wait in ms before polling again; 0 once the job has finished')
});

export const ZPublicApiExerciseTemplateResponse = z.object({
  id: z.number(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  tag: z.string().nullable(),
  questionCount: z.number(),
  points: z.number()
});

export const ZPublicApiExerciseTemplateDetailResponse = ZPublicApiExerciseTemplateResponse.extend({
  questions: z.array(
    z.object({
      question: z.string(),
      questionTypeId: z.number(),
      points: z.number(),
      order: z.number(),
      settings,
      options: z.array(z.object({ label: z.string(), isCorrect: z.boolean(), settings }))
    })
  )
});

const submissionStudent = z
  .object({
    profileId: z.string().uuid(),
    fullname: z.string().nullable(),
    email: z.string().nullable(),
    avatarUrl: z.string().nullable()
  })
  .nullable();

const overallStatus = z.enum(['auto_graded', 'manual_required', 'hybrid']);

export const ZPublicApiCourseSubmissionListItemResponse = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  exerciseTitle: z.string(),
  memberId: z.string().uuid().nullable(),
  student: submissionStudent,
  gradingState: ZPublicApiSubmissionGradingState,
  overallStatus,
  total: z.number().nullable(),
  feedback: z.string().nullable(),
  isEarly: z.boolean().describe('Submitted on or before the exercise due date (true when there is no due date)'),
  submittedAt: timestamp
});

export const ZPublicApiCourseSubmissionResponse = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid().nullable(),
  exerciseId: z.string().uuid(),
  memberId: z.string().uuid().nullable(),
  gradingState: ZPublicApiSubmissionGradingState,
  overallStatus: overallStatus.nullable(),
  total: z.number().nullable(),
  feedback: z.string().nullable(),
  submittedAt: nullableTimestamp,
  updatedAt: nullableTimestamp
});

export const ZPublicApiCourseSubmissionDetailResponse = ZPublicApiCourseSubmissionResponse.extend({
  answers: z.array(
    z.object({
      questionId: z.number(),
      points: z.number().nullable(),
      answerData: z
        .record(z.string(), z.unknown())
        .nullable()
        .describe('Typed answer. File and video answers include a short-lived fileUrl / playbackUrl')
    })
  )
});

export const ZPublicApiCourseMarksRowResponse = z.object({
  memberId: z.string().uuid(),
  profileId: z.string().uuid().nullable(),
  fullname: z.string().nullable(),
  email: z.string().nullable(),
  marks: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      exerciseTitle: z.string(),
      maxPoints: z.number(),
      points: z.number().nullable().describe('null when the student has no graded submission for this exercise')
    })
  )
});
