import { describe, expect, it } from 'vitest';

import { ContentType } from '@cio/utils/constants/content';
import {
  collectLockedContentItems,
  getStudentContentLockDescriptionKey,
  getStudentContentLockTitleKey
} from './content-lock-utils';

function lockedCourse() {
  return {
    id: 'course-1',
    title: 'Locks',
    content: {
      grouped: false,
      sections: [],
      items: [
        { id: 'lesson-1', type: ContentType.Lesson, title: 'Open', order: 1, isUnlocked: true, isComplete: false },
        { id: 'lesson-2', type: ContentType.Lesson, title: 'Locked', order: 2, isUnlocked: false, isComplete: false },
        {
          id: 'exercise-1',
          type: ContentType.Exercise,
          title: 'Locked quiz',
          order: 3,
          isUnlocked: false,
          isComplete: false
        }
      ]
    }
  };
}

describe('characterization: collectLockedContentItems (zero activities)', () => {
  it('returns only locked lessons and exercises', () => {
    expect(collectLockedContentItems(lockedCourse() as never)).toEqual([
      { id: 'lesson-2', type: ContentType.Lesson },
      { id: 'exercise-1', type: ContentType.Exercise }
    ]);
  });

  it('returns an empty list when nothing is locked', () => {
    expect(collectLockedContentItems(null)).toEqual([]);
  });
});

describe('characterization: lock copy keys (zero activities)', () => {
  it('picks the progression title for sequential locks', () => {
    expect(getStudentContentLockTitleKey('progression_locked')).toBe(
      'course.navItem.lessons.content_progression_locked_title'
    );
    expect(getStudentContentLockTitleKey('teacher_locked')).toBe('course.navItem.lessons.content_locked_title');
  });

  it('picks per-type progression descriptions', () => {
    expect(getStudentContentLockDescriptionKey('progression_locked', ContentType.Exercise)).toBe(
      'course.navItem.lessons.content_progression_locked_description_exercise'
    );
    expect(getStudentContentLockDescriptionKey('progression_locked', ContentType.Lesson)).toBe(
      'course.navItem.lessons.content_progression_locked_description_lesson'
    );
    expect(getStudentContentLockDescriptionKey('teacher_locked', ContentType.Lesson)).toBe(
      'course.navItem.lessons.content_locked_description'
    );
  });
});
