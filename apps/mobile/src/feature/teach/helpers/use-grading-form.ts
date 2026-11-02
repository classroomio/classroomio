import { useState } from 'react';

import type { GradingQuestion, GradingSubmission, SaveGradesInput } from '@/feature/teach/types/teach';

/** Whole points a question can award; scores are stored as integers. */
export function maxPointsOf(question: Pick<GradingQuestion, 'points'>) {
  return Math.max(0, Math.floor(question.points));
}

export function isScorable(question: Pick<GradingQuestion, 'hasAnswerRow'>) {
  return question.hasAnswerRow;
}

function initialScores(submission: GradingSubmission) {
  const scores: Record<number, string> = {};
  for (const question of submission.questions) {
    if (!isScorable(question)) continue;

    scores[question.id] = question.startingPoints === null ? '' : String(question.startingPoints);
  }

  return scores;
}

export type ScoreError = 'empty' | 'notWhole' | 'tooHigh';

export function scoreError(question: GradingQuestion, value: string | undefined): ScoreError | null {
  if (!isScorable(question)) return null;
  if (value === undefined || value.trim() === '') return 'empty';

  const points = Number(value);
  if (!Number.isInteger(points) || points < 0) return 'notWhole';
  if (points > maxPointsOf(question)) return 'tooHigh';

  return null;
}

export function useGradingForm(submission: GradingSubmission) {
  const [scores, setScores] = useState(() => initialScores(submission));
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [showErrors, setShowErrors] = useState(false);

  const scorable = submission.questions.filter(isScorable);
  const total = scorable.reduce((sum, question) => {
    const points = Number(scores[question.id]);

    return sum + (Number.isInteger(points) && points > 0 ? points : 0);
  }, 0);
  const firstInvalid = scorable.find((question) => scoreError(question, scores[question.id]) !== null) ?? null;

  const setScore = (questionId: number, value: string) =>
    setScores((current) => ({ ...current, [questionId]: value.replace(/[^0-9]/g, '') }));

  const toGrades = (): SaveGradesInput => ({
    answers: scorable.map((question) => ({ questionId: question.id, points: Number(scores[question.id] ?? 0) })),
    total,
    feedback: feedback.trim() || undefined,
    statusId: 3
  });

  return {
    submission,
    scores,
    setScore,
    feedback,
    setFeedback,
    total,
    maxPoints: Math.floor(submission.maxPoints),
    firstInvalid,
    showErrors,
    setShowErrors,
    toGrades
  };
}

export type GradingFormState = ReturnType<typeof useGradingForm>;
