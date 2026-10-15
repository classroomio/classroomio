import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  sections: vi.fn(),
  content: vi.fn(),
  updateItems: vi.fn(),
  updateSections: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({ db: { transaction: async (runner: (client: unknown) => unknown) => runner({}) } }));
vi.mock('@cio/db/queries/course', () => ({
  getCourseSectionsByCourseId: queries.sections,
  deleteCourseSection: vi.fn(),
  getCourseSectionById: vi.fn()
}));
vi.mock('@cio/db/queries/course/content', () => ({ getCourseContentItems: queries.content }));
vi.mock('@cio/db/queries/course/content-batch', () => ({
  applyCourseContentBulkUpdates: queries.updateItems,
  applyCourseSectionOrderUpdates: queries.updateSections
}));
vi.mock('@cio/db/queries/lesson', () => ({ deleteLesson: vi.fn() }));
vi.mock('@cio/db/queries/exercise/exercise', () => ({ deleteExercise: vi.fn() }));
vi.mock('@cio/db/queries/assets', () => ({ deleteAssetUsagesByTarget: vi.fn() }));

import { updateCourseContent, reorderCourseContent } from '@cio/core/services/course/content';

beforeEach(() => {
  vi.clearAllMocks();
  queries.sections.mockResolvedValue([{ id: 'settings', courseId: 'course', order: 2 }]);
  queries.content.mockResolvedValue([
    { id: 'settings', type: 'SECTION', sectionId: null, order: 2 },
    { id: 'intro', type: 'LESSON', sectionId: null, order: 1 },
    { id: 'quiz', type: 'EXERCISE', sectionId: 'settings', order: 1 }
  ]);
  queries.updateItems.mockResolvedValue({ updatedItems: 2, updatedLessons: 1, updatedExercises: 1 });
  queries.updateSections.mockResolvedValue(1);
});

describe('course content placement', () => {
  it('rejects a section from another course before writing any content', async () => {
    await expect(
      updateCourseContent('course', [{ id: 'intro', type: 'LESSON', sectionId: 'foreign-section' }])
    ).rejects.toThrow('Destination section does not belong to this course');
    expect(queries.updateItems).not.toHaveBeenCalled();
  });

  it('allows clearing a section while sections remain enabled', async () => {
    const items = [{ id: 'quiz', type: 'EXERCISE' as const, sectionId: null, order: 1 }];
    await updateCourseContent('course', items);
    expect(queries.updateItems).toHaveBeenCalledWith(expect.anything(), items);
  });

  it('reorders sections and standalone items together in the same transaction', async () => {
    const payload = {
      sections: [{ id: 'settings', order: 2 }],
      items: [
        { id: 'intro', type: 'LESSON' as const, sectionId: null, order: 1 },
        { id: 'quiz', type: 'EXERCISE' as const, sectionId: 'settings', order: 1 }
      ]
    };
    await reorderCourseContent('course', payload);
    expect(queries.updateSections).toHaveBeenCalledWith(expect.anything(), payload.sections);
    expect(queries.updateItems).toHaveBeenCalledWith(expect.anything(), payload.items);
  });

  it('rejects content owned by another course before changing sections', async () => {
    await expect(
      reorderCourseContent('course', {
        items: [{ id: 'foreign-item', type: 'LESSON', sectionId: 'settings', order: 1 }]
      })
    ).rejects.toThrow('Lesson does not belong to this course');
    expect(queries.updateItems).not.toHaveBeenCalled();
  });

  it('uses the existing parent when validating an order-only update', async () => {
    await reorderCourseContent('course', {
      sections: [{ id: 'settings', order: 2 }],
      items: [{ id: 'quiz', type: 'EXERCISE', order: 1 }]
    });

    expect(queries.updateSections).toHaveBeenCalled();
    expect(queries.updateItems).toHaveBeenCalled();
  });

  it('rejects an order-only update that collides at the root', async () => {
    await expect(
      reorderCourseContent('course', {
        items: [{ id: 'intro', type: 'LESSON', order: 2 }]
      })
    ).rejects.toThrow('Top-level orders must be unique');

    expect(queries.updateItems).not.toHaveBeenCalled();
  });
});
