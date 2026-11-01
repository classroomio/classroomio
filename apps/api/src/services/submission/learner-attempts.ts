import type { AnswerData } from '@cio/question-types';
import { getExercise } from '@cio/core/services/exercise/exercise';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';

import { listSubmissionsByExercise } from './submission';

const GRADED_STATUS_ID = 3;

export type LearnerAttemptOutcome = 'awaiting_grade' | 'graded' | 'passed' | 'failed';

export type LearnerAttemptAnswer = {
  questionId: number;
  answerData: AnswerData | null;
  points: number | null;
  maxPoints: number;
};

export type LearnerAttempt = {
  id: string;
  attemptNumber: number;
  submittedAt: string | null;
  outcome: LearnerAttemptOutcome;
  score: number | null;
  scorePercent: number | null;
  feedback: string | null;
  answers: LearnerAttemptAnswer[];
};

export type LearnerExerciseAttempts = {
  exerciseId: string;
  totalPoints: number;
  completionPolicy: 'submitted' | 'passed';
  passThreshold: number | null;
  allowMultipleAttempts: boolean;
  canRetake: boolean;
  attempts: LearnerAttempt[];
};

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function resolveOutcome(params: {
  isGraded: boolean;
  completionPolicy: 'submitted' | 'passed';
  scorePercent: number | null;
  passThreshold: number;
}): LearnerAttemptOutcome {
  if (!params.isGraded) return 'awaiting_grade';
  if (params.completionPolicy !== 'passed' || params.scorePercent === null) return 'graded';

  return params.scorePercent >= params.passThreshold ? 'passed' : 'failed';
}

/**
 * Returns the caller's own attempts at an exercise, oldest first, with per-question points,
 * tutor feedback, pass or fail against the exercise's completion policy, and whether another
 * attempt is allowed. Contains no answer keys and no other learner's data.
 */
export async function listLearnerExerciseAttempts(
  courseId: string,
  exerciseId: string,
  profileId: string
): Promise<LearnerExerciseAttempts> {
  const [exercise, groupMemberId] = await Promise.all([
    getExercise(exerciseId),
    getGroupMemberIdByCourseAndProfile(courseId, profileId)
  ]);

  const questions = (exercise.questions ?? []).filter((question) => !question.deletedAt);
  const maxPointsByQuestionId = new Map(
    questions.map((question) => [Number(question.id), Number(question.points ?? 0)])
  );
  const totalPoints = questions.reduce((total, question) => total + Number(question.points ?? 0), 0);
  const completionPolicy = exercise.completionPolicy === 'passed' ? 'passed' : 'submitted';
  const passThreshold = Number(exercise.passThreshold ?? 100);

  const submissions = groupMemberId ? await listSubmissionsByExercise(courseId, exerciseId, groupMemberId) : [];

  const attempts = submissions.map((submission, index): LearnerAttempt => {
    const isGraded = submission.statusId === GRADED_STATUS_ID;
    const answerRows = submission.answers ?? [];
    const answers = answerRows.map((answer) => ({
      questionId: Number(answer.questionId),
      answerData: (answer.answerData ?? null) as AnswerData | null,
      points: isGraded ? toFiniteNumber(answer.point) : null,
      maxPoints: maxPointsByQuestionId.get(Number(answer.questionId)) ?? 0
    }));

    const answerPointTotal = answers.reduce((total, answer) => total + (answer.points ?? 0), 0);
    const submissionTotal = toFiniteNumber(submission.total);
    const score = isGraded ? (answers.length > 0 ? answerPointTotal : (submissionTotal ?? 0)) : null;
    const scorePercent = score !== null && totalPoints > 0 ? (score / totalPoints) * 100 : null;
    const outcome = resolveOutcome({ isGraded, completionPolicy, scorePercent, passThreshold });

    return {
      id: submission.id,
      attemptNumber: index + 1,
      submittedAt: submission.createdAt ?? null,
      outcome,
      score,
      scorePercent,
      feedback: submission.feedback ?? null,
      answers
    };
  });

  const latestAttempt = attempts.at(-1);
  const allowMultipleAttempts = Boolean(exercise.allowMultipleAttempts);
  const canRetake = latestAttempt ? allowMultipleAttempts && latestAttempt.outcome !== 'passed' : true;

  return {
    exerciseId,
    totalPoints,
    completionPolicy,
    passThreshold: completionPolicy === 'passed' ? passThreshold : null,
    allowMultipleAttempts,
    canRetake,
    attempts
  };
}
