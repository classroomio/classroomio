import { describe, expect, it } from 'vitest';

import { ContentType } from '../src/constants/content';
import {
  computeProgressionAccess,
  flattenNavigableItems,
  itemBlocksProgression
} from '../src/functions/course-progression';

function item(id: string, type: ContentType, order: number, overrides: Record<string, unknown> = {}) {
  return { id, type, order, isUnlocked: true, isComplete: false, ...overrides };
}

describe('itemBlocksProgression with activities', () => {
  it('blocks sequential progression until complete', () => {
    expect(itemBlocksProgression(ContentType.Activity)).toBe(true);
  });

  it('keeps existing lesson, exercise and section rules', () => {
    expect(itemBlocksProgression(ContentType.Lesson, 'manual')).toBe(true);
    expect(itemBlocksProgression(ContentType.Lesson, 'none')).toBe(false);
    expect(itemBlocksProgression(ContentType.Exercise)).toBe(true);
    expect(itemBlocksProgression(ContentType.Section)).toBe(false);
    expect(itemBlocksProgression(undefined)).toBe(false);
  });
});

describe('computeProgressionAccess with activities', () => {
  it('blocks later items until the activity completes in sequential mode', () => {
    const items = [item('activity-1', ContentType.Activity, 1), item('lesson-2', ContentType.Lesson, 2)];

    const blocked = computeProgressionAccess({ navigableItems: items, progressionMode: 'sequential' });

    expect(blocked.get('activity-1')).toEqual({ accessible: true, lockReason: null });
    expect(blocked.get('lesson-2')).toEqual({ accessible: false, lockReason: 'progression_blocked' });

    const unblocked = computeProgressionAccess({
      navigableItems: items.map((entry) => (entry.id === 'activity-1' ? { ...entry, isComplete: true } : entry)),
      progressionMode: 'sequential'
    });

    expect(unblocked.get('lesson-2')).toEqual({ accessible: true, lockReason: null });
  });

  it('leaves every item open in free mode', () => {
    const items = [item('activity-1', ContentType.Activity, 1), item('lesson-2', ContentType.Lesson, 2)];

    const access = computeProgressionAccess({ navigableItems: items, progressionMode: 'free' });

    expect(access.get('activity-1')).toEqual({ accessible: true, lockReason: null });
    expect(access.get('lesson-2')).toEqual({ accessible: true, lockReason: null });
  });

  it('flattens activities in shared order with lessons and exercises', () => {
    const content = {
      grouped: true,
      sections: [
        {
          items: [
            item('exercise-1', ContentType.Exercise, 3),
            item('activity-1', ContentType.Activity, 2),
            item('lesson-1', ContentType.Lesson, 1)
          ]
        }
      ],
      items: []
    };

    expect(flattenNavigableItems(content).map((entry) => entry.id)).toEqual(['lesson-1', 'activity-1', 'exercise-1']);
  });
});
