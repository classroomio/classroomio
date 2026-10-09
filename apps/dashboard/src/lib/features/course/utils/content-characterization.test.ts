import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import {
  getContentItemsProgress,
  getContentRoute,
  getCourseProgress,
  getMentionableContent,
  getOrderedNavigableContent
} from './content';

function lesson(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: ContentType.Lesson,
    title: `Lesson ${id}`,
    order: 1,
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    ...overrides
  };
}

function exercise(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    type: ContentType.Exercise,
    title: `Exercise ${id}`,
    order: 2,
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    ...overrides
  };
}

function groupedCourse(items: unknown[]) {
  return {
    id: 'course-1',
    title: 'Grouped',
    content: {
      grouped: true,
      sections: [{ id: 'section-1', title: 'Basics', order: 1, items }],
      items: []
    }
  };
}

describe('characterization: getContentRoute (zero activities)', () => {
  it('routes lessons, exercises and sections', () => {
    expect(getContentRoute('course-1', { id: 'lesson-1', type: ContentType.Lesson })).toBe(
      '/courses/course-1/lessons/lesson-1'
    );
    expect(getContentRoute('course-1', { id: 'exercise-1', type: ContentType.Exercise })).toBe(
      '/courses/course-1/exercises/exercise-1'
    );
    expect(getContentRoute('course-1', { id: 'section-1', type: ContentType.Section })).toBe(
      '/courses/course-1/lessons#section-section-1'
    );
  });

  it('returns an empty route for unknown types', () => {
    expect(getContentRoute('course-1', { id: 'x', type: 'UNKNOWN' })).toBe('');
  });
});

describe('characterization: getContentItemsProgress (zero activities)', () => {
  it('returns zeros for an empty course', () => {
    expect(getContentItemsProgress([])).toEqual({
      lessonsTotal: 0,
      lessonsComplete: 0,
      exercisesTotal: 0,
      exercisesComplete: 0,
      total: 0,
      completed: 0,
      percent: 0
    });
  });

  it('combines lessons and exercises into one percentage', () => {
    const progress = getContentItemsProgress([
      lesson('lesson-1', { isComplete: true }),
      lesson('lesson-2', { isComplete: false }),
      exercise('exercise-1', { isComplete: true })
    ] as never);

    expect(progress).toEqual({
      lessonsTotal: 2,
      lessonsComplete: 1,
      exercisesTotal: 1,
      exercisesComplete: 1,
      total: 3,
      completed: 2,
      percent: 67
    });
  });
});

describe('characterization: getCourseProgress (zero activities)', () => {
  it('reads grouped sections', () => {
    const course = groupedCourse([lesson('lesson-1', { isComplete: true }), exercise('exercise-1')]);

    expect(getCourseProgress(course as never)).toMatchObject({ total: 2, completed: 1, percent: 50 });
  });

  it('reads a flat ungrouped list', () => {
    const course = {
      id: 'course-1',
      title: 'Ungrouped',
      content: { grouped: false, sections: [], items: [lesson('lesson-1', { isComplete: true })] }
    };

    expect(getCourseProgress(course as never)).toMatchObject({ total: 1, completed: 1, percent: 100 });
  });

  it('returns zeros for a null course', () => {
    expect(getCourseProgress(null).percent).toBe(0);
  });
});

describe('characterization: getOrderedNavigableContent (zero activities)', () => {
  it('returns lessons and exercises in display order', () => {
    const course = groupedCourse([exercise('exercise-1', { order: 2 }), lesson('lesson-1', { order: 1 })]);

    expect(getOrderedNavigableContent(course as never).map((item) => item.id)).toEqual(['lesson-1', 'exercise-1']);
  });
});

describe('characterization: getMentionableContent (zero activities)', () => {
  it('interleaves the section with its lessons and exercises', () => {
    const course = groupedCourse([lesson('lesson-1'), exercise('exercise-1')]);
    const mentions = getMentionableContent(course as never);

    expect(mentions).toEqual([
      { id: 'section-1', title: 'Basics', type: ContentType.Section },
      { id: 'lesson-1', title: 'Lesson lesson-1', type: ContentType.Lesson },
      { id: 'exercise-1', title: 'Exercise exercise-1', type: ContentType.Exercise }
    ]);
  });
});
