import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertStudentCanAccessContent,
  getCourseById,
  getCourseContentItems,
  getCourseProgress,
  isPersonalLearningCourseOwner
} = vi.hoisted(() => ({
  assertStudentCanAccessContent: vi.fn(),
  getCourseById: vi.fn(),
  getCourseContentItems: vi.fn(),
  getCourseProgress: vi.fn(),
  isPersonalLearningCourseOwner: vi.fn()
}));

vi.mock('@cio/core/services/course/progression', () => ({ assertStudentCanAccessContent }));
vi.mock('@cio/db/queries/course/course', () => ({ getCourseById, getCourseProgress }));
vi.mock('@cio/db/queries/course/content', () => ({ getCourseContentItems }));
vi.mock('@cio/db/queries/personal-learning', () => ({ isPersonalLearningCourseOwner }));

import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { ContentType, ROLE } from '@cio/utils/constants';

describe('personal learning course content access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCourseById.mockResolvedValue([
      { id: 'course-1', isPublished: false, metadata: { isContentGroupingEnabled: false } }
    ]);
    getCourseProgress.mockResolvedValue({ roleId: ROLE.STUDENT });
    getCourseContentItems.mockResolvedValue([]);
    isPersonalLearningCourseOwner.mockResolvedValue(false);
  });

  it('allows the journey owner to open their unpublished lesson', async () => {
    isPersonalLearningCourseOwner.mockResolvedValue(true);

    await expect(
      assertEnrolledStudentContentAccess({
        courseId: 'course-1',
        profileId: 'owner-1',
        contentId: 'lesson-1',
        type: ContentType.Lesson
      })
    ).resolves.toBeUndefined();

    expect(isPersonalLearningCourseOwner).toHaveBeenCalledWith('course-1', 'owner-1');
    expect(assertStudentCanAccessContent).toHaveBeenCalledOnce();
  });

  it('continues to hide an unpublished personal course from other students', async () => {
    await expect(
      assertEnrolledStudentContentAccess({
        courseId: 'course-1',
        profileId: 'other-student',
        contentId: 'lesson-1',
        type: ContentType.Lesson
      })
    ).rejects.toMatchObject({ code: 'COURSE_NOT_FOUND', statusCode: 404 });
  });
});
