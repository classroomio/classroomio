import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/services/course/course', () => ({
  createCourse: vi.fn(),
  deleteCourse: vi.fn(),
  getCourse: vi.fn(),
  updateCourse: vi.fn()
}));

vi.mock('@api/services/course-import/course-import', () => ({
  createCourseImportDraftService: vi.fn(),
  getCourseImportStructureService: vi.fn(),
  publishCourseImportDraftToExistingCourseService: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getOrganizationCourses: vi.fn()
}));

vi.mock('@api/services/course/people', () => ({
  listPaginatedCourseMembers: vi.fn()
}));

vi.mock('@api/services/v1/shared', () => ({
  assertCourseBelongsToOrganization: vi.fn()
}));

vi.mock('@api/services/course/certificate-plan', () => ({
  assertCertificateChangeAllowed: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { listPaginatedCourseMembers } from '@api/services/course/people';
import { assertCourseBelongsToOrganization } from '@api/services/v1/shared';
import { listCourseStudentsService } from '@api/services/v1/courses/course';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';

const studentPage = {
  items: [{ id: 'member-1', roleId: ROLE.STUDENT }],
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1
};

describe('listCourseStudentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asserts the course belongs to the org and returns the student page with the student role filter', async () => {
    vi.mocked(listPaginatedCourseMembers).mockResolvedValue(
      studentPage as Awaited<ReturnType<typeof listPaginatedCourseMembers>>
    );

    const result = await listCourseStudentsService(ORG_ID, { courseId: COURSE_ID }, { page: 1, limit: 20 });

    expect(assertCourseBelongsToOrganization).toHaveBeenCalledWith(ORG_ID, COURSE_ID);
    expect(listPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, {
      page: 1,
      limit: 20,
      roleId: ROLE.STUDENT
    });
    expect(result).toEqual(studentPage);
  });

  it('forwards explicit page and limit to the database query', async () => {
    vi.mocked(listPaginatedCourseMembers).mockResolvedValue({
      ...studentPage,
      page: 3,
      limit: 5
    } as Awaited<ReturnType<typeof listPaginatedCourseMembers>>);

    const result = await listCourseStudentsService(ORG_ID, { courseId: COURSE_ID }, { page: 3, limit: 5 });

    expect(listPaginatedCourseMembers).toHaveBeenCalledWith(COURSE_ID, {
      page: 3,
      limit: 5,
      roleId: ROLE.STUDENT
    });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(5);
  });

  it('does not query members when the course is missing from the organization', async () => {
    vi.mocked(assertCourseBelongsToOrganization).mockRejectedValue(
      new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404)
    );

    await expect(
      listCourseStudentsService(ORG_ID, { courseId: COURSE_ID }, { page: 1, limit: 20 })
    ).rejects.toMatchObject({ code: ErrorCodes.COURSE_NOT_FOUND, statusCode: 404 });
    expect(listPaginatedCourseMembers).not.toHaveBeenCalled();
  });
});
