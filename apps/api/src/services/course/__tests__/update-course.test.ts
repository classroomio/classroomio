import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  updateCourse: vi.fn(),
  replaceCourseTags: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/core/services/course/course', () => ({
  updateCourse: mocks.updateCourse
}));

vi.mock('@api/services/tag', () => ({
  replaceCourseTags: mocks.replaceCourseTags
}));

import { updateCourseWithTags } from '../update-course';

const transactionClient = { id: 'transaction-client' };

describe('updateCourseWithTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback(transactionClient));
    mocks.updateCourse.mockResolvedValue({
      course: { id: 'course-1', title: 'Updated course' },
      conversionOffenders: null
    });
    mocks.replaceCourseTags.mockResolvedValue([{ id: 'tag-1' }]);
  });

  it('updates the course and tags on the same transaction client', async () => {
    const result = await updateCourseWithTags({
      courseId: 'course-1',
      courseData: { title: 'Updated course' },
      orgId: 'org-1',
      updatedByUserId: 'user-1',
      tagIds: ['tag-1']
    });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.updateCourse).toHaveBeenCalledWith('course-1', { title: 'Updated course' }, transactionClient);
    expect(mocks.replaceCourseTags).toHaveBeenCalledWith(
      'org-1',
      'course-1',
      { tagIds: ['tag-1'] },
      { updatedByUserId: 'user-1', dbClient: transactionClient }
    );
    expect(result).toEqual({
      course: { id: 'course-1', title: 'Updated course' },
      conversionOffenders: null,
      tags: [{ id: 'tag-1' }]
    });
  });

  it('passes through the conversion offenders updateCourse reports', async () => {
    const offenders: NonAutoGradableQuestionOffender[] = [
      {
        questionId: 'question-1',
        questionTitle: 'Describe your approach',
        exerciseId: 'exercise-1',
        exerciseTitle: 'Week 1 reflection',
        typeId: 3
      }
    ];
    mocks.updateCourse.mockResolvedValue({
      course: { id: 'course-1', title: 'Updated course' },
      conversionOffenders: offenders
    });

    const result = await updateCourseWithTags({
      courseId: 'course-1',
      courseData: { title: 'Updated course' },
      orgId: 'org-1',
      updatedByUserId: 'user-1',
      tagIds: ['tag-1']
    });

    expect(result.conversionOffenders).toEqual(offenders);
  });

  it('propagates tag failures so the transaction can roll back the course update', async () => {
    const tagError = new Error('One or more tags are invalid');
    mocks.replaceCourseTags.mockRejectedValue(tagError);

    await expect(
      updateCourseWithTags({
        courseId: 'course-1',
        courseData: { title: 'Updated course' },
        orgId: 'org-1',
        updatedByUserId: 'user-1',
        tagIds: ['missing-tag']
      })
    ).rejects.toBe(tagError);

    expect(mocks.updateCourse).toHaveBeenCalledWith('course-1', { title: 'Updated course' }, transactionClient);
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});
