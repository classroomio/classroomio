import { ContentType } from '@cio/utils/constants/content';
import { computeProgressionAccess, flattenNavigableItems } from '@cio/utils/functions/course-progression';
import { describe, expect, it } from 'vitest';

import {
  findProgressionBlockingItem,
  getContentLockIndicatorLabelKey,
  getProgressionBlockingItemTitle,
  getStudentContentLockDescription,
  getStudentContentLockTitleKey
} from './content-lock-utils';
import type { Course, CourseContentItem } from './types';

type ItemOverrides = Partial<Pick<CourseContentItem, 'isComplete' | 'completionPolicy' | 'isUnlocked'>>;

function contentItem(
  id: string,
  type: ContentType.Lesson | ContentType.Exercise,
  order: number,
  overrides: ItemOverrides = {}
): CourseContentItem {
  return {
    id,
    type,
    title: `Title ${id}`,
    order,
    isComplete: false,
    completionPolicy: null,
    isUnlocked: true,
    ...overrides
  } as CourseContentItem;
}

function courseWithItems(items: CourseContentItem[]): Course {
  return { content: { grouped: false, sections: [], items } } as unknown as Course;
}

describe('findProgressionBlockingItem', () => {
  it('returns the earliest required incomplete item before the target', () => {
    const course = courseWithItems([
      contentItem('intro', ContentType.Lesson, 1, { isComplete: true }),
      contentItem('quiz', ContentType.Exercise, 2),
      contentItem('second', ContentType.Lesson, 3),
      contentItem('target', ContentType.Lesson, 4)
    ]);

    expect(findProgressionBlockingItem(course, 'target', ContentType.Lesson)?.id).toBe('quiz');
  });

  it('skips optional items', () => {
    const course = courseWithItems([
      contentItem('optional', ContentType.Lesson, 1, { completionPolicy: 'none' }),
      contentItem('required', ContentType.Exercise, 2),
      contentItem('target', ContentType.Exercise, 3)
    ]);

    expect(findProgressionBlockingItem(course, 'target', ContentType.Exercise)?.id).toBe('required');
  });

  it('follows course order rather than array order', () => {
    const course = courseWithItems([
      contentItem('target', ContentType.Lesson, 2),
      contentItem('first', ContentType.Lesson, 1)
    ]);

    expect(findProgressionBlockingItem(course, 'target', ContentType.Lesson)?.id).toBe('first');
  });

  it('returns null when every earlier required item is complete', () => {
    const course = courseWithItems([
      contentItem('done', ContentType.Lesson, 1, { isComplete: true }),
      contentItem('target', ContentType.Lesson, 2),
      contentItem('later', ContentType.Lesson, 3)
    ]);

    expect(findProgressionBlockingItem(course, 'target', ContentType.Lesson)).toBeNull();
  });

  it('agrees with computeProgressionAccess on which items are progression blocked', () => {
    const items = [
      contentItem('a', ContentType.Lesson, 1, { isComplete: true }),
      contentItem('b', ContentType.Exercise, 2, { completionPolicy: 'none' }),
      contentItem('c', ContentType.Lesson, 3, { isUnlocked: false }),
      contentItem('d', ContentType.Exercise, 4),
      contentItem('e', ContentType.Lesson, 5)
    ];
    const course = courseWithItems(items);
    const accessById = computeProgressionAccess({
      navigableItems: flattenNavigableItems(course.content!),
      progressionMode: 'sequential'
    });

    for (const item of items) {
      const isProgressionBlocked = accessById.get(item.id)?.lockReason === 'progression_blocked';
      const blockingItem = findProgressionBlockingItem(
        course,
        item.id,
        item.type as ContentType.Lesson | ContentType.Exercise
      );

      expect(blockingItem !== null).toBe(isProgressionBlocked);
    }
  });
});

describe('getProgressionBlockingItemTitle', () => {
  it('names the blocking item', () => {
    const course = courseWithItems([
      contentItem('quiz', ContentType.Exercise, 1),
      contentItem('target', ContentType.Lesson, 2)
    ]);

    expect(getProgressionBlockingItemTitle(course, 'target', ContentType.Lesson)).toBe('Title quiz');
  });

  it('names nothing when the blocking item is held back by the teacher', () => {
    const course = courseWithItems([
      contentItem('held', ContentType.Lesson, 1, { isUnlocked: false }),
      contentItem('target', ContentType.Lesson, 2)
    ]);

    expect(getProgressionBlockingItemTitle(course, 'target', ContentType.Lesson)).toBeNull();
  });
});

describe('getStudentContentLockDescription', () => {
  it('never mentions earlier content for a teacher hold', () => {
    expect(getStudentContentLockDescription('teacher_locked', ContentType.Lesson, 'Intro')).toEqual({
      key: 'course.navItem.lessons.content_locked_description'
    });
  });

  it('names the blocking item when its title is known', () => {
    expect(getStudentContentLockDescription('progression_locked', ContentType.Exercise, 'Intro')).toEqual({
      key: 'course.navItem.lessons.content_progression_locked_description_named_exercise',
      values: { title: 'Intro' }
    });
  });

  it('falls back to the generic progression copy without a title', () => {
    expect(getStudentContentLockDescription('progression_locked', ContentType.Lesson, null)).toEqual({
      key: 'course.navItem.lessons.content_progression_locked_description_lesson'
    });
  });
});

describe('lock title keys', () => {
  it('labels a teacher hold and a progression lock differently', () => {
    expect(getContentLockIndicatorLabelKey(true)).toBe(getStudentContentLockTitleKey('teacher_locked'));
    expect(getContentLockIndicatorLabelKey(false)).toBe(getStudentContentLockTitleKey('progression_locked'));
  });
});
