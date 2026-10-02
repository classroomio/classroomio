import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ isCourseTeamMemberOrOrgAdmin: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseSectionById: vi.fn() }));
vi.mock('@cio/core/services/course/course', () => ({}));
vi.mock('@cio/core/services/course/section', () => ({
  createCourseSection: vi.fn(),
  listCourseSections: vi.fn(),
  promoteUngroupedSection: vi.fn(),
  updateCourseSectionService: vi.fn()
}));
vi.mock('@cio/core/services/course/content', () => ({ deleteCourseContent: vi.fn() }));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseSectionById } from '@cio/db/queries/course';
import {
  createCourseSection,
  listCourseSections,
  promoteUngroupedSection,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import { deleteCourseContent } from '@cio/core/services/course/content';
import {
  createPublicApiCourseSectionService,
  deletePublicApiCourseSectionService,
  listPublicApiCourseSectionsService,
  updatePublicApiCourseSectionService
} from '@api/services/v1/courses/sections';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const SECTION_ID = 'section-1';

const section = (overrides: Record<string, unknown> = {}) =>
  ({
    id: SECTION_ID,
    courseId: COURSE_ID,
    title: 'Week 1',
    order: 1,
    createdAt: '2026-09-30',
    updatedAt: null,
    sourceId: null,
    sourceSyncedAt: null,
    ...overrides
  }) as never;

const sectionParams = { courseId: COURSE_ID, sectionId: SECTION_ID };

describe('services/v1/courses/sections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getCourseSectionById).mockResolvedValue(section());
  });

  it('returns 404 for a course in another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('other-org');

    await expect(
      listPublicApiCourseSectionsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 401 without an actor and 403 for a student, on reads too', async () => {
    await expect(
      listPublicApiCourseSectionsService(ORG_ID, null, { courseId: COURSE_ID }, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 401 });

    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    await expect(
      listPublicApiCourseSectionsService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      createPublicApiCourseSectionService(ORG_ID, ACTOR_ID, { courseId: COURSE_ID }, { title: 'X', order: 1 })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(createCourseSection).not.toHaveBeenCalled();
  });

  it('lists sections in order and pages them', async () => {
    vi.mocked(listCourseSections).mockResolvedValue([
      section({ id: 'b', order: 2 }),
      section({ id: 'a', order: 1 }),
      section({ id: 'c', order: 3 })
    ]);

    const result = await listPublicApiCourseSectionsService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID },
      { page: 1, limit: 2 }
    );

    expect(result.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('creates a plain section, or promotes ungrouped content with moveUngrouped', async () => {
    vi.mocked(createCourseSection).mockResolvedValue(section());
    const created = await createPublicApiCourseSectionService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID },
      { title: 'Week 1', order: 1 }
    );
    expect(createCourseSection).toHaveBeenCalledWith(COURSE_ID, { title: 'Week 1', order: 1, courseId: COURSE_ID });
    expect(created).toMatchObject({ id: SECTION_ID, movedLessons: 0, movedExercises: 0 });

    vi.mocked(promoteUngroupedSection).mockResolvedValue({
      section: section(),
      movedLessons: 2,
      movedExercises: 1
    });
    const promoted = await createPublicApiCourseSectionService(
      ORG_ID,
      ACTOR_ID,
      { courseId: COURSE_ID },
      { title: 'Loose', moveUngrouped: true }
    );
    expect(promoteUngroupedSection).toHaveBeenCalledWith(COURSE_ID, { title: 'Loose' });
    expect(promoted).toMatchObject({ movedLessons: 2, movedExercises: 1 });
  });

  it('returns 404 for a section from another course on update and delete', async () => {
    vi.mocked(getCourseSectionById).mockResolvedValue(section({ courseId: 'other-course' }));

    await expect(
      updatePublicApiCourseSectionService(ORG_ID, ACTOR_ID, sectionParams, { title: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(deletePublicApiCourseSectionService(ORG_ID, ACTOR_ID, sectionParams)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(updateCourseSectionService).not.toHaveBeenCalled();
    expect(deleteCourseContent).not.toHaveBeenCalled();
  });

  it('deletes a section through the content service the dashboard uses', async () => {
    const deleted = await deletePublicApiCourseSectionService(ORG_ID, ACTOR_ID, sectionParams);

    expect(deleteCourseContent).toHaveBeenCalledWith(COURSE_ID, { sectionId: SECTION_ID });
    expect(deleted).toMatchObject({ id: SECTION_ID });
  });
});
