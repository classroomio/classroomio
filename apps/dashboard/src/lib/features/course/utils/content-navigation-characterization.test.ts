import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import {
  findActiveNavigableContentIndex,
  getActiveNavigableContent,
  getFirstIncompleteNavigableContent,
  getNextIncompleteNavigableContent,
  getPreviousNavigableContent,
  isContentItemInPath,
  resolveActiveNavigableContentIndex
} from './content-navigation';

function item(id: string, type: ContentType = ContentType.Lesson, overrides: Record<string, unknown> = {}) {
  return { id, type, title: id, order: 1, sectionId: null, isUnlocked: true, isComplete: false, ...overrides };
}

function courseWith(items: unknown[]) {
  return {
    id: 'course-1',
    title: 'Course',
    content: { grouped: false, sections: [], items }
  };
}

describe('characterization: content navigation (zero activities)', () => {
  it('matches ids as exact path segments', () => {
    expect(isContentItemInPath('lesson-1', '/courses/c/lessons/lesson-1')).toBe(true);
    expect(isContentItemInPath('lesson-1', '/courses/c/lessons/lesson-10')).toBe(false);
    expect(isContentItemInPath('lesson-1', null)).toBe(false);
  });

  it('finds the first incomplete unlocked item', () => {
    const course = courseWith([
      item('lesson-1', ContentType.Lesson, { isComplete: true }),
      item('lesson-2', ContentType.Lesson, { isComplete: false, isUnlocked: false }),
      item('exercise-1', ContentType.Exercise, { isComplete: false })
    ]);

    expect(getFirstIncompleteNavigableContent(course as never)?.id).toBe('exercise-1');
  });

  it('resolves the active index from the path, else first incomplete', () => {
    const course = courseWith([item('lesson-1'), item('exercise-1')]);

    expect(resolveActiveNavigableContentIndex(course as never, '/courses/c/exercises/exercise-1')).toBe(1);
    expect(resolveActiveNavigableContentIndex(course as never, '/courses/c/unknown')).toBe(0);
    expect(findActiveNavigableContentIndex([], '/courses/c/lessons/lesson-1')).toBe(-1);
  });

  it('walks previous and next incomplete items', () => {
    const course = courseWith([
      item('lesson-1', ContentType.Lesson, { isComplete: true }),
      item('lesson-2'),
      item('exercise-1')
    ]);

    expect(getPreviousNavigableContent(course as never, '/courses/c/exercises/exercise-1')?.id).toBe('lesson-2');
    expect(getPreviousNavigableContent(course as never, '/courses/c/lessons/lesson-1')).toBeNull();
    expect(getNextIncompleteNavigableContent(course as never, '/courses/c/lessons/lesson-1')?.id).toBe('lesson-2');
    expect(getActiveNavigableContent(course as never, '/courses/c/lessons/lesson-2')?.id).toBe('lesson-2');
  });
});
