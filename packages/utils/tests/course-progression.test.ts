import { describe, expect, it } from 'vitest';

import { ContentType } from '../src/constants/content';
import {
  annotateContentItem,
  computeProgressionAccess,
  flattenNavigableItems,
  type ProgressionLockReason
} from '../src/functions/course-progression';

type TestItem = {
  id: string;
  type: ContentType;
  order?: number | null;
  isComplete?: boolean | null;
  isUnlocked?: boolean | null;
  completionPolicy?: string | null;
  accessible?: boolean;
  lockReason?: ProgressionLockReason | null;
};

function lesson(id: string, order: number, options: Partial<TestItem> = {}): TestItem {
  return {
    id,
    type: ContentType.Lesson,
    order,
    isComplete: false,
    isUnlocked: true,
    completionPolicy: 'manual',
    ...options
  };
}

function exercise(id: string, order: number, options: Partial<TestItem> = {}): TestItem {
  return {
    id,
    type: ContentType.Exercise,
    order,
    isComplete: false,
    isUnlocked: true,
    ...options
  };
}

describe('flattenNavigableItems', () => {
  it('orders grouped content section-by-section instead of by global order values', () => {
    const content = {
      grouped: true,
      sections: [
        {
          items: [lesson('section-1-lesson-1', 1), lesson('section-1-lesson-2', 2)]
        },
        {
          items: [lesson('section-2-lesson-1', 1), lesson('section-2-lesson-2', 2)]
        }
      ],
      items: []
    };

    const flattenedIds = flattenNavigableItems(content).map((item) => item.id);

    expect(flattenedIds).toEqual([
      'section-1-lesson-1',
      'section-1-lesson-2',
      'section-2-lesson-1',
      'section-2-lesson-2'
    ]);
  });

  it('sorts ungrouped content by order', () => {
    const content = {
      grouped: false,
      sections: [],
      items: [lesson('lesson-3', 3), lesson('lesson-1', 1), lesson('lesson-2', 2)]
    };

    const flattenedIds = flattenNavigableItems(content).map((item) => item.id);

    expect(flattenedIds).toEqual(['lesson-1', 'lesson-2', 'lesson-3']);
  });

  it('does not mutate the source content array for ungrouped courses', () => {
    const items = [lesson('lesson-2', 2), lesson('lesson-1', 1)];
    const content = {
      grouped: false,
      sections: [],
      items
    };

    flattenNavigableItems(content);

    expect(content.items.map((item) => item.id)).toEqual(['lesson-2', 'lesson-1']);
  });
});

describe('computeProgressionAccess', () => {
  it('unlocks the next item in the same section after the previous item is complete', () => {
    const content = {
      grouped: true,
      sections: [
        {
          items: [lesson('section-1-lesson-1', 1, { isComplete: true }), lesson('section-1-lesson-2', 2)]
        },
        {
          items: [lesson('section-2-lesson-1', 1), lesson('section-2-lesson-2', 2)]
        }
      ],
      items: []
    };
    const navigableItems = flattenNavigableItems(content);

    const accessById = computeProgressionAccess({
      navigableItems,
      progressionMode: 'sequential'
    });

    expect(accessById.get('section-1-lesson-1')).toEqual({ accessible: true, lockReason: null });
    expect(accessById.get('section-1-lesson-2')).toEqual({ accessible: true, lockReason: null });
    expect(accessById.get('section-2-lesson-1')).toEqual({
      accessible: false,
      lockReason: 'progression_blocked'
    });
    expect(accessById.get('section-2-lesson-2')).toEqual({
      accessible: false,
      lockReason: 'progression_blocked'
    });
  });

  it('keeps all items accessible in free progression mode', () => {
    const navigableItems = [lesson('lesson-1', 1), lesson('lesson-2', 2, { isComplete: false })];

    const accessById = computeProgressionAccess({
      navigableItems,
      progressionMode: 'free'
    });

    expect(accessById.get('lesson-1')).toEqual({ accessible: true, lockReason: null });
    expect(accessById.get('lesson-2')).toEqual({ accessible: true, lockReason: null });
  });

  it('blocks teacher-locked items before sequential progression rules', () => {
    const navigableItems = [lesson('lesson-1', 1, { isComplete: true }), lesson('lesson-2', 2, { isUnlocked: false })];

    const accessById = computeProgressionAccess({
      navigableItems,
      progressionMode: 'sequential'
    });

    expect(accessById.get('lesson-2')).toEqual({
      accessible: false,
      lockReason: 'teacher_locked'
    });
  });

  it('does not block progression on lessons with completion policy none', () => {
    const navigableItems = [
      lesson('lesson-1', 1, { isComplete: false, completionPolicy: 'none' }),
      lesson('lesson-2', 2)
    ];

    const accessById = computeProgressionAccess({
      navigableItems,
      progressionMode: 'sequential'
    });

    expect(accessById.get('lesson-2')).toEqual({ accessible: true, lockReason: null });
  });

  it('blocks progression until exercises are complete', () => {
    const navigableItems = [
      lesson('lesson-1', 1, { isComplete: true }),
      exercise('exercise-1', 2),
      lesson('lesson-2', 3)
    ];

    const accessById = computeProgressionAccess({
      navigableItems,
      progressionMode: 'sequential'
    });

    expect(accessById.get('exercise-1')).toEqual({ accessible: true, lockReason: null });
    expect(accessById.get('lesson-2')).toEqual({
      accessible: false,
      lockReason: 'progression_blocked'
    });
  });
});

describe('annotateContentItem', () => {
  it('applies computed access metadata to a content item', () => {
    const item = lesson('lesson-1', 1);
    const accessById = new Map([['lesson-1', { accessible: false, lockReason: 'progression_blocked' as const }]]);

    const annotated = annotateContentItem(item, accessById);

    expect(annotated.accessible).toBe(false);
    expect(annotated.lockReason).toBe('progression_blocked');
  });
});
