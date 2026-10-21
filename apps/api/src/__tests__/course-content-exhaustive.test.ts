import { describe, expect, it, vi } from 'vitest';

import { ContentType } from '@cio/utils/constants';
import { applyCourseContentBulkUpdates } from '@cio/db/queries/course/content-batch';
import { normalizeDeleteItems } from '@cio/core/services/course/content';
import { annotateNavigableAccess } from '@cio/core/services/course/progression';
import type { CourseContentItem } from '@cio/core/services/course/utils';

function navigableItem(overrides: Partial<CourseContentItem> = {}): CourseContentItem {
  return {
    id: 'lesson-1',
    type: ContentType.Lesson,
    title: 'Introduction',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    lessonAt: null,
    callUrl: null,
    sessionDurationMinutes: null,
    recordingUrl: null,
    hasNoteContent: true,
    hasSlideContent: false,
    videosCount: 0,
    documentsCount: 0,
    questionCount: null,
    dueBy: null,
    slug: null,
    activityKind: null,
    activityStatus: null,
    ...overrides
  };
}

describe('applyCourseContentBulkUpdates unknown types', () => {
  it('gracefully ignores unknown content types without throwing during rolling deploys', async () => {
    const result = await applyCourseContentBulkUpdates(
      {} as never,
      [{ id: 'item-1', type: 'UNKNOWN', order: 1 }] as never
    );
    expect(result.updatedLessons).toBe(0);
    expect(result.updatedExercises).toBe(0);
    expect(result.updatedActivities).toBe(0);
  });

  it('routes activities to the activity update instead of the unknown-type guard', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'activity-1' }]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const tx = { update: vi.fn(() => ({ set })) };

    const result = await applyCourseContentBulkUpdates(
      tx as never,
      [{ id: 'activity-1', type: ContentType.Activity, order: 1 }] as never
    );

    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(result.updatedActivities).toBe(1);
    expect(result.updatedLessons).toBe(0);
    expect(result.updatedExercises).toBe(0);
  });
});

describe('normalizeDeleteItems unknown types', () => {
  it('keeps lessons and exercises with exercises first', () => {
    const normalized = normalizeDeleteItems([
      { id: 'lesson-1', type: ContentType.Lesson },
      { id: 'exercise-1', type: ContentType.Exercise },
      { id: 'lesson-1', type: ContentType.Lesson }
    ]);

    expect(normalized).toEqual([
      { id: 'exercise-1', type: ContentType.Exercise },
      { id: 'lesson-1', type: ContentType.Lesson }
    ]);
  });

  it('keeps activities after lessons and exercises', () => {
    const normalized = normalizeDeleteItems([
      { id: 'activity-1', type: ContentType.Activity },
      { id: 'lesson-1', type: ContentType.Lesson }
    ]);

    expect(normalized).toEqual([
      { id: 'lesson-1', type: ContentType.Lesson },
      { id: 'activity-1', type: ContentType.Activity }
    ]);
  });

  it('throws instead of silently dropping an unknown content type', () => {
    expect(() => normalizeDeleteItems([{ id: 'item-1', type: 'UNKNOWN' }])).toThrow();
  });
});

describe('annotateNavigableAccess unknown types', () => {
  it('marks section items complete as before', () => {
    const accessById = annotateNavigableAccess({
      navigableItems: [navigableItem({ id: 'section-1', type: ContentType.Section })],
      lessonPolicyById: new Map(),
      progressionMode: 'sequential',
      completedLessonIds: new Set(),
      completedExerciseIds: new Set()
    });

    expect(accessById.get('section-1')).toEqual({ accessible: true, lockReason: null });
  });

  it('blocks incomplete activities in sequential mode until they complete', () => {
    const items = [
      navigableItem({ id: 'activity-1', type: ContentType.Activity, title: 'Package' }),
      navigableItem({ id: 'lesson-2', type: ContentType.Lesson, title: 'Next' })
    ];
    const blocked = annotateNavigableAccess({
      navigableItems: items,
      lessonPolicyById: new Map(),
      progressionMode: 'sequential',
      completedLessonIds: new Set(),
      completedExerciseIds: new Set(),
      completedActivityIds: new Set()
    });

    expect(blocked.get('activity-1')).toEqual({ accessible: true, lockReason: null });
    expect(blocked.get('lesson-2')).toEqual({ accessible: false, lockReason: 'progression_blocked' });

    const unblocked = annotateNavigableAccess({
      navigableItems: items,
      lessonPolicyById: new Map(),
      progressionMode: 'sequential',
      completedLessonIds: new Set(),
      completedExerciseIds: new Set(),
      completedActivityIds: new Set(['activity-1'])
    });

    expect(unblocked.get('activity-1')).toEqual({ accessible: true, lockReason: null });
    expect(unblocked.get('lesson-2')).toEqual({ accessible: true, lockReason: null });
  });

  it('handles unknown content types safely without throwing during rolling deploys', () => {
    expect(() =>
      annotateNavigableAccess({
        navigableItems: [navigableItem({ id: 'item-1', type: 'UNKNOWN' as never })],
        lessonPolicyById: new Map(),
        progressionMode: 'sequential',
        completedLessonIds: new Set(),
        completedExerciseIds: new Set()
      })
    ).not.toThrow();
  });
});
