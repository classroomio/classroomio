import { describe, expect, it } from 'vitest';
import { getCourseOutline, calculateNextContentOrder } from '../src/functions/course-content';
import { flattenNavigableItems, computeProgressionAccess } from '../src/functions/course-progression';
import { ZCourseContentReorder } from '../src/validation/course/course';
import { ContentType } from '../src/constants/content';

const introduction = { id: 'intro', type: ContentType.Lesson, order: 1, isComplete: true };
const settings = { id: 'settings-lesson', type: ContentType.Lesson, order: 1, isComplete: false };
const checkpoint = { id: 'checkpoint', type: ContentType.Exercise, order: 3, isComplete: false };
const rules = { id: 'rules-lesson', type: ContentType.Lesson, order: 1, isComplete: false };
const content = {
  grouped: true,
  sections: [
    { id: 'settings', order: 2, items: [settings] },
    { id: 'rules', order: 4, items: [rules] },
    { id: 'ungrouped', order: 5, items: [checkpoint, introduction] }
  ],
  items: []
};

describe('mixed course outlines', () => {
  it('interleaves standalone items with sections and never exposes the synthetic group', () => {
    expect(getCourseOutline(content).map((entry) => entry.id)).toEqual([
      'LESSON-intro',
      'SECTION-settings',
      'EXERCISE-checkpoint',
      'SECTION-rules'
    ]);
  });

  it('flattens the same mixed order for navigation and sequential access', () => {
    const items = flattenNavigableItems(content);
    expect(items.map((item) => item.id)).toEqual(['intro', 'settings-lesson', 'checkpoint', 'rules-lesson']);
    const access = computeProgressionAccess({ navigableItems: items, progressionMode: 'sequential' });
    expect(access.get('intro')?.accessible).toBe(true);
    expect(access.get('settings-lesson')?.accessible).toBe(true);
    expect(access.get('checkpoint')?.lockReason).toBe('progression_blocked');
    expect(access.get('rules-lesson')?.lockReason).toBe('progression_blocked');
  });

  it('allocates standalone items after both sections and standalone siblings', () => {
    expect(calculateNextContentOrder(content)).toBe(5);
    expect(calculateNextContentOrder(content, undefined, [5])).toBe(6);
    expect(calculateNextContentOrder(content, 'settings')).toBe(2);
  });

  it('accepts section positions interleaved with standalone positions', () => {
    const result = ZCourseContentReorder.safeParse({
      sections: [
        { id: 'settings', order: 2 },
        { id: 'rules', order: 4 }
      ],
      items: [
        { id: 'intro', type: 'LESSON', order: 1, sectionId: null },
        { id: 'checkpoint', type: 'EXERCISE', order: 3, sectionId: null },
        { id: 'settings-lesson', type: 'LESSON', order: 1, sectionId: 'settings' }
      ]
    });
    expect(result.success).toBe(true);
  });

  it('rejects colliding section and standalone orders', () => {
    const result = ZCourseContentReorder.safeParse({
      sections: [{ id: 'settings', order: 1 }],
      items: [{ id: 'intro', type: 'LESSON', order: 1, sectionId: null }]
    });
    expect(result.success).toBe(false);
  });
});
