import { describe, expect, it } from 'vitest';

import type { Question } from '$features/course/types';
import type { SubmissionListItem } from '$features/course/utils/types';
import {
  getManualGradedExerciseQuestions,
  getTotalPossibleExercisePoints,
  groupSubmissionsByStudentAndAttempt,
  shouldCompleteExerciseFromSubmission
} from './exercise-progression-utils';

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Question',
    points: overrides.points ?? 1,
    questionTypeId: overrides.questionTypeId ?? 1,
    questionType: overrides.questionType,
    options: [],
    ...overrides
  } as Question;
}

function makeSubmission(overrides: Partial<SubmissionListItem> & { id: string }): SubmissionListItem {
  return {
    id: overrides.id,
    statusId: overrides.statusId ?? 1,
    gradingState: overrides.gradingState,
    total: overrides.total ?? 0,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    groupmember: overrides.groupmember ?? {
      profile: {
        id: 'student-1',
        fullname: 'Student One',
        avatarUrl: ''
      }
    },
    answers: overrides.answers ?? []
  } as unknown as SubmissionListItem;
}

describe('exercise progression helpers', () => {
  it('detects manual-graded questions from question type ids', () => {
    const questions = [
      makeQuestion({ id: 1, questionTypeId: 1 }),
      makeQuestion({ id: 2, questionTypeId: 3 }),
      makeQuestion({ id: 3, questionTypeId: 8 })
    ];

    expect(getManualGradedExerciseQuestions(questions).map((question) => question.id)).toEqual([2, 3]);
  });

  it('calculates total possible points from active questions', () => {
    const questions = [
      makeQuestion({ id: 1, points: 3 }),
      makeQuestion({ id: 2, points: 2 }),
      makeQuestion({ id: 3, points: 20, deletedAt: '2026-01-01' })
    ];

    expect(getTotalPossibleExercisePoints(questions)).toBe(5);
  });

  it('decides when a submission completes a passed-policy exercise', () => {
    const passingSubmission = makeSubmission({
      id: 'passing',
      gradingState: 'completed',
      total: 8
    });
    const failingSubmission = makeSubmission({
      id: 'failing',
      gradingState: 'completed',
      total: 6
    });
    const awaitingManualSubmission = makeSubmission({
      id: 'manual',
      gradingState: 'awaiting_manual',
      total: 10
    });

    expect(
      shouldCompleteExerciseFromSubmission({
        completionPolicy: 'passed',
        passThreshold: 70,
        totalPossiblePoints: 10,
        submission: passingSubmission
      })
    ).toBe(true);
    expect(
      shouldCompleteExerciseFromSubmission({
        completionPolicy: 'passed',
        passThreshold: 70,
        totalPossiblePoints: 10,
        submission: failingSubmission
      })
    ).toBe(false);
    expect(
      shouldCompleteExerciseFromSubmission({
        completionPolicy: 'passed',
        passThreshold: 70,
        totalPossiblePoints: 10,
        submission: awaitingManualSubmission
      })
    ).toBe(false);
  });

  it('treats submitted-policy submissions as complete regardless of grading state', () => {
    const submission = makeSubmission({
      id: 'submitted',
      gradingState: 'awaiting_manual',
      total: 0
    });

    expect(
      shouldCompleteExerciseFromSubmission({
        completionPolicy: 'submitted',
        passThreshold: 100,
        totalPossiblePoints: 0,
        submission
      })
    ).toBe(true);
  });

  it('groups submissions by student and orders attempts by submission date', () => {
    const olderAttempt = makeSubmission({
      id: 'attempt-1',
      total: 4,
      createdAt: '2026-01-01T00:00:00.000Z'
    });
    const newerAttempt = makeSubmission({
      id: 'attempt-2',
      total: 9,
      createdAt: '2026-01-02T00:00:00.000Z'
    });

    const groups = groupSubmissionsByStudentAndAttempt([newerAttempt, olderAttempt]);

    expect(groups).toHaveLength(1);
    expect(groups[0].attempts.map((attempt) => attempt.submission.id)).toEqual(['attempt-1', 'attempt-2']);
    expect(groups[0].attempts.map((attempt) => attempt.attemptNumber)).toEqual([1, 2]);
  });
});
