import { describe, expect, it } from 'vitest';

import {
  computeLearningPathUnlocks,
  isLearningPathCourseComplete,
  learningPathProgressPercent,
  type LearningPathCourseProgressInput
} from '../src/functions/learning-path';

function course(
  courseId: string,
  done: { lessons: [number, number]; exercises: [number, number] },
  completedAt: string | null = null
): LearningPathCourseProgressInput {
  return {
    courseId,
    lessonsCompleted: done.lessons[0],
    lessonsCount: done.lessons[1],
    exercisesCompleted: done.exercises[0],
    exercisesCount: done.exercises[1],
    completedAt
  };
}

describe('isLearningPathCourseComplete', () => {
  it('needs every lesson and every exercise', () => {
    expect(isLearningPathCourseComplete(course('a', { lessons: [4, 4], exercises: [1, 2] }))).toBe(false);
    expect(isLearningPathCourseComplete(course('a', { lessons: [3, 4], exercises: [2, 2] }))).toBe(false);
    expect(isLearningPathCourseComplete(course('a', { lessons: [4, 4], exercises: [2, 2] }))).toBe(true);
  });

  it('accepts a recorded course completion', () => {
    expect(isLearningPathCourseComplete(course('a', { lessons: [0, 4], exercises: [0, 0] }, '2026-01-01'))).toBe(true);
  });
});

describe('computeLearningPathUnlocks', () => {
  const courses = [
    course('one', { lessons: [2, 2], exercises: [1, 1] }),
    course('two', { lessons: [1, 4], exercises: [0, 0] }),
    course('three', { lessons: [0, 3], exercises: [0, 1] })
  ];

  it('locks every course after the first incomplete one when sequential', () => {
    const unlocks = computeLearningPathUnlocks(courses, true);

    expect(unlocks.map((unlock) => unlock.state)).toEqual(['completed', 'in_progress', 'locked']);
    expect(unlocks[2]).toMatchObject({ isUnlocked: false, blockedByCourseId: 'two' });
    expect(unlocks[1]).toMatchObject({ isUnlocked: true, blockedByCourseId: null, progressPercent: 25 });
  });

  it('names the first incomplete course as the blocker for every later course', () => {
    const unlocks = computeLearningPathUnlocks(
      [
        course('one', { lessons: [0, 2], exercises: [0, 0] }),
        course('two', { lessons: [2, 2], exercises: [0, 0] }),
        course('three', { lessons: [0, 1], exercises: [0, 0] })
      ],
      true
    );

    expect(unlocks.map((unlock) => unlock.blockedByCourseId)).toEqual([null, 'one', 'one']);
  });

  it('opens every course when the path is not sequential', () => {
    const unlocks = computeLearningPathUnlocks(courses, false);

    expect(unlocks.every((unlock) => unlock.isUnlocked)).toBe(true);
    expect(unlocks[2].state).toBe('not_started');
  });

  it('reports path progress as the share of completed courses', () => {
    expect(learningPathProgressPercent(computeLearningPathUnlocks(courses, true))).toBe(33);
    expect(learningPathProgressPercent([])).toBe(0);
  });
});
