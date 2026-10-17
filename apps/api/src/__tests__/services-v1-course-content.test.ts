import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ isCourseTeamMemberOrOrgAdmin: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseSectionsByCourseId: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({}));
vi.mock('@cio/core/services/course/content', () => ({
  deleteCourseContent: vi.fn(),
  reorderCourseContent: vi.fn(),
  updateCourseContent: vi.fn()
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseSectionsByCourseId } from '@cio/db/queries/course';
import { deleteCourseContent, reorderCourseContent, updateCourseContent } from '@cio/core/services/course/content';
import {
  deletePublicApiCourseContentService,
  reorderPublicApiCourseContentService,
  updatePublicApiCourseContentLockService
} from '@api/services/v1/courses/content';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const courseParams = { courseId: COURSE_ID };
const lessonItem = { id: 'lesson-1', type: 'LESSON' as const };

describe('services/v1/courses/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getCourseSectionsByCourseId).mockResolvedValue([{ id: 'section-1' }] as never);
  });

  it('returns 404 when moving an item into a section of another course', async () => {
    await expect(
      reorderPublicApiCourseContentService(ORG_ID, ACTOR_ID, courseParams, {
        items: [{ ...lessonItem, sectionId: 'section-elsewhere', order: 1 }]
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(reorderCourseContent).not.toHaveBeenCalled();
  });

  it('reorders when the target section is in the course', async () => {
    vi.mocked(reorderCourseContent).mockResolvedValue({
      courseId: COURSE_ID,
      updatedSections: 0,
      updatedItems: 1,
      updatedLessons: 1,
      updatedExercises: 0
    });
    const payload = { items: [{ ...lessonItem, sectionId: 'section-1', order: 1 }] };

    await expect(reorderPublicApiCourseContentService(ORG_ID, ACTOR_ID, courseParams, payload)).resolves.toEqual({
      updatedSections: 0,
      updatedLessons: 1,
      updatedExercises: 0
    });
    expect(reorderCourseContent).toHaveBeenCalledWith(COURSE_ID, payload);
  });

  it('rejects a student before any write', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(
      updatePublicApiCourseContentLockService(ORG_ID, ACTOR_ID, courseParams, {
        items: [{ ...lessonItem, isUnlocked: false }]
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      deletePublicApiCourseContentService(ORG_ID, ACTOR_ID, courseParams, { items: [lessonItem] })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateCourseContent).not.toHaveBeenCalled();
    expect(deleteCourseContent).not.toHaveBeenCalled();
  });

  it('returns 404 for a course in another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(
      deletePublicApiCourseContentService(ORG_ID, ACTOR_ID, courseParams, { items: [lessonItem] })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('passes lock and delete batches to the dashboard services', async () => {
    await updatePublicApiCourseContentLockService(ORG_ID, ACTOR_ID, courseParams, {
      items: [{ ...lessonItem, isUnlocked: false }]
    });
    await deletePublicApiCourseContentService(ORG_ID, ACTOR_ID, courseParams, { items: [lessonItem] });

    expect(updateCourseContent).toHaveBeenCalledWith(COURSE_ID, [{ ...lessonItem, isUnlocked: false }]);
    expect(deleteCourseContent).toHaveBeenCalledWith(COURSE_ID, { items: [lessonItem] });
  });
});
