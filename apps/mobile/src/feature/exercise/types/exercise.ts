import type { InferRequestType, InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';
import type { en } from '@/feature/exercise/translations/en';
import type { Translator } from '@/feature/i18n/helpers/translate';

type ExerciseRoute = ApiClient['course'][':courseId']['exercise'][':exerciseId'];

type ExerciseResponse = Extract<InferResponseType<ExerciseRoute['$get'], 200>, { success: true }>;

export type Exercise = ExerciseResponse['data'];

export type ExerciseQuestion = NonNullable<Exercise['questions']>[number];

export type ExerciseOption = ExerciseQuestion['options'][number];

type AttemptsResponse = Extract<InferResponseType<ExerciseRoute['attempts']['$get'], 200>, { success: true }>;

export type ExerciseAttempts = AttemptsResponse['data'];

export type ExerciseAttempt = ExerciseAttempts['attempts'][number];

export type AttemptOutcome = ExerciseAttempt['outcome'];

export type AttemptAnswer = ExerciseAttempt['answers'][number];

export type AnswerData = NonNullable<AttemptAnswer['answerData']>;

export type QuestionTypeKey = AnswerData['type'];

export type AnswerOf<Key extends QuestionTypeKey> = Extract<AnswerData, { type: Key }>;

export type SubmissionAnswerInput = InferRequestType<ExerciseRoute['submission']['$post']>['json']['answers'][number];

export type VideoRecordingInitInput = InferRequestType<
  ExerciseRoute['question'][':questionId']['video-recording']['upload']['init']['$post']
>['json'];

export type VideoRecordingMimeType = VideoRecordingInitInput['mimeType'];

/** Answers keyed by question id. */
export type AnswerMap = Record<string, AnswerData>;

export type ExerciseDraft = {
  answers: AnswerMap;
  currentIndex: number;
  baseAttemptCount: number;
  updatedAt: string;
};

export type ExerciseTranslator = Translator<typeof en>;

export type ExerciseMessageKey = keyof typeof en;
