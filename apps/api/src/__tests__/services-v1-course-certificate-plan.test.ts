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

vi.mock('@api/services/organization', () => ({ getOrganizationCourses: vi.fn() }));
vi.mock('@api/services/course/people', () => ({ listCourseMembers: vi.fn() }));
vi.mock('@api/services/v1/shared', () => ({ assertCourseBelongsToOrganization: vi.fn() }));
vi.mock('@api/services/course/certificate-plan', () => ({ assertCertificateChangeAllowed: vi.fn() }));

import { updateCourse } from '@cio/core/services/course/course';
import { assertCertificateChangeAllowed } from '@api/services/course/certificate-plan';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { updatePublicApiCourseService } from '@api/services/v1/courses/course';

const ORG_ID = 'org-1';
const params = { courseId: 'course-1' };

describe('updatePublicApiCourseService certificate plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks the certificate change against the plan before updating the course', async () => {
    const certificate = { isDownloadable: true };

    await updatePublicApiCourseService(ORG_ID, params, { certificate });

    expect(assertCertificateChangeAllowed).toHaveBeenCalledWith('course-1', certificate);
    expect(updateCourse).toHaveBeenCalledWith('course-1', { certificate });
  });

  it('does not update the course when the plan blocks the certificate change', async () => {
    vi.mocked(assertCertificateChangeAllowed).mockRejectedValueOnce(
      new AppError('Certificates require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    await expect(
      updatePublicApiCourseService(ORG_ID, params, { certificate: { isDownloadable: true } })
    ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.UPGRADE_REQUIRED });
    expect(updateCourse).not.toHaveBeenCalled();
  });
});
