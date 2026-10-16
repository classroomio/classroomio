import { describe, expect, it } from 'vitest';
import { ContentType } from '@cio/utils/constants/content';

import {
  getCompletionRulesSummary,
  getCourseExercises,
  getDefaultExerciseMinScorePercent,
  getEffectiveExerciseMinScorePercent,
  resolveFinalExercise
} from './completion-rules-utils';
import type { Course } from './types';

type CourseOverrides = {
  type?: string;
  compliance?: { passingScore?: number } | null;
  certificate?: Record<string, unknown> | null;
};

function buildCourse(overrides: CourseOverrides = {}): Course {
  const sections = [
    {
      id: 'section-2',
      title: 'Wrap up',
      order: 2,
      items: [{ id: 'exercise-final', title: 'Final quiz', type: ContentType.Exercise, order: 0 }]
    },
    {
      id: 'section-1',
      title: 'Basics',
      order: 1,
      items: [
        { id: 'exercise-warmup', title: 'Warm-up', type: ContentType.Exercise, order: 1 },
        { id: 'lesson-intro', title: 'Intro', type: ContentType.Lesson, order: 0 }
      ]
    }
  ];

  return {
    type: 'SELF_PACED',
    compliance: null,
    certificate: null,
    content: { grouped: true, sections: [sections[1], sections[0]], items: [] },
    ...overrides
  } as unknown as Course;
}

describe('getCourseExercises', () => {
  it('lists only exercises, in learner order across sections', () => {
    const exerciseIds = getCourseExercises(buildCourse()).map((item) => item.id);

    expect(exerciseIds).toEqual(['exercise-warmup', 'exercise-final']);
  });

  it('returns an empty list without a course', () => {
    expect(getCourseExercises(null)).toEqual([]);
  });
});

describe('resolveFinalExercise', () => {
  const exercises = [{ id: 'exercise-final', title: 'Final quiz' }];

  it('is none when no final exercise is stored', () => {
    expect(resolveFinalExercise(exercises, null)).toEqual({ kind: 'none' });
    expect(resolveFinalExercise(exercises, undefined)).toEqual({ kind: 'none' });
  });

  it('returns the exercise title when the stored id exists', () => {
    expect(resolveFinalExercise(exercises, 'exercise-final')).toEqual({
      kind: 'found',
      id: 'exercise-final',
      title: 'Final quiz'
    });
  });

  it('is missing when the stored exercise was deleted', () => {
    expect(resolveFinalExercise(exercises, 'exercise-deleted')).toEqual({ kind: 'missing', id: 'exercise-deleted' });
  });
});

describe('minimum score defaults', () => {
  it('defaults to 100% outside compliance courses', () => {
    expect(getDefaultExerciseMinScorePercent(buildCourse())).toBe(100);
  });

  it('falls back to the compliance passing score, like the API', () => {
    const complianceCourse = buildCourse({ type: 'COMPLIANCE', compliance: { passingScore: 70 } });

    expect(getDefaultExerciseMinScorePercent(complianceCourse)).toBe(70);
  });

  it('keeps a stored minimum score', () => {
    const course = buildCourse({
      type: 'COMPLIANCE',
      compliance: { passingScore: 70 },
      certificate: { requiredExerciseId: 'exercise-final', exerciseMinScorePercent: 90 }
    });

    expect(getEffectiveExerciseMinScorePercent(course)).toBe(90);
  });

  it('is null when no final exercise is set', () => {
    expect(getEffectiveExerciseMinScorePercent(buildCourse())).toBeNull();
  });
});

describe('getCompletionRulesSummary', () => {
  it('fills in the API defaults when nothing is stored', () => {
    expect(getCompletionRulesSummary(buildCourse())).toEqual({
      threshold: 100,
      deadline: null,
      finalExercise: { kind: 'none' },
      exerciseMinScorePercent: null
    });
  });

  it('summarizes stored rules with the final exercise title', () => {
    const course = buildCourse({
      certificate: {
        threshold: 80,
        deadline: '2026-12-31T17:00:00.000Z',
        requiredExerciseId: 'exercise-final',
        exerciseMinScorePercent: 75
      }
    });

    expect(getCompletionRulesSummary(course)).toEqual({
      threshold: 80,
      deadline: '2026-12-31T17:00:00.000Z',
      finalExercise: { kind: 'found', id: 'exercise-final', title: 'Final quiz' },
      exerciseMinScorePercent: 75
    });
  });

  it('drops the minimum score when the final exercise was deleted', () => {
    const course = buildCourse({
      certificate: { requiredExerciseId: 'exercise-deleted', exerciseMinScorePercent: 75 }
    });
    const summary = getCompletionRulesSummary(course);

    expect(summary.finalExercise).toEqual({ kind: 'missing', id: 'exercise-deleted' });
    expect(summary.exerciseMinScorePercent).toBeNull();
  });
});
