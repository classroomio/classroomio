import { describe, expect, it } from 'vitest';

import { getCourseProgressCounts } from './functions';

describe('getCourseProgressCounts', () => {
  it('prefers progress counts over all-content counts', () => {
    expect(
      getCourseProgressCounts({
        lessonCount: 10,
        exerciseCount: 4,
        progressLessonCount: 7,
        progressExerciseCount: 2
      })
    ).toEqual({ lessons: 7, exercises: 2 });
  });

  it('keeps zero progress counts instead of falling back', () => {
    expect(
      getCourseProgressCounts({
        lessonCount: 10,
        exerciseCount: 4,
        progressLessonCount: 0,
        progressExerciseCount: 0
      })
    ).toEqual({ lessons: 0, exercises: 0 });
  });

  it('falls back to all-content counts for courses without progress fields', () => {
    expect(getCourseProgressCounts({ lessonCount: 8, exerciseCount: 3 })).toEqual({
      lessons: 8,
      exercises: 3
    });
  });
});
