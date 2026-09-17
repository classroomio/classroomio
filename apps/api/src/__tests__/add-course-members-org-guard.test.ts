import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  addCourseMember: vi.fn(),
  deleteCourseMember: vi.fn(),
  getCourseMember: vi.fn(),
  getCourseMembers: vi.fn(),
  getPaginatedCourseMembers: vi.fn(),
  getCourseTeachers: vi.fn(),
  updateCourseMember: vi.fn()
}));

vi.mock('@cio/db/queries/course/reset-progress', () => ({
  resetStudentCourseProgress: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn()
}));

vi.mock('@cio/core/config/dashboard-url', () => ({
  getDashboardBaseUrl: vi.fn().mockReturnValue('https://org.classroomio.com')
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

vi.mock('@cio/email', () => ({
  buildEmailFromName: vi.fn().mockReturnValue('ClassroomIO <noreply@classroomio.com>'),
  buildEmailBranding: vi.fn().mockReturnValue({})
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

vi.mock('@api/services/course/session-invite', () => ({
  getWelcomeSessionIcs: vi.fn()
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { addCourseMember } from '@cio/db/queries/course/people';
import { getCourseWithOrgData } from '@cio/db/queries/course';
import { getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { addMembers } from '@api/services/course/people';

const COURSE_ORG_DATA = {
  courseTitle: 'Intro to Testing',
  orgId: 'org-1',
  orgName: 'Test Org',
  orgSiteName: 'test-org',
  orgAvatarUrl: null,
  orgTheme: null,
  orgCustomDomain: null,
  orgIsCustomDomainVerified: false,
  welcomeEmailMessage: null
} as Awaited<ReturnType<typeof getCourseWithOrgData>>;

describe('addMembers organization-membership guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseWithOrgData).mockResolvedValue(COURSE_ORG_DATA);
  });

  it('rejects a profileId that does not belong to the course organization, before any insert', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);

    await expect(
      addMembers('course-1', [{ profileId: 'profile-from-another-org', roleId: ROLE.STUDENT }])
    ).rejects.toMatchObject({
      statusCode: 404,
      code: ErrorCodes.PROFILE_NOT_FOUND
    });

    expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith('org-1', 'profile-from-another-org');
    expect(addCourseMember).not.toHaveBeenCalled();
  });

  it('rejects the whole batch if any single profileId in a bulk request is cross-org', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValueOnce(42).mockResolvedValueOnce(null);

    await expect(
      addMembers('course-1', [
        { profileId: 'profile-in-org', roleId: ROLE.STUDENT },
        { profileId: 'profile-from-another-org', roleId: ROLE.STUDENT }
      ])
    ).rejects.toBeInstanceOf(AppError);

    expect(addCourseMember).not.toHaveBeenCalled();
  });

  it('adds a member whose profileId belongs to the course organization', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(7);
    vi.mocked(addCourseMember).mockResolvedValue({
      id: 'member-1',
      profileId: 'profile-in-org',
      roleId: ROLE.STUDENT
    } as Awaited<ReturnType<typeof addCourseMember>>);

    const result = await addMembers('course-1', [{ profileId: 'profile-in-org', roleId: ROLE.STUDENT }]);

    expect(getOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith('org-1', 'profile-in-org');
    expect(addCourseMember).toHaveBeenCalledWith('course-1', { profileId: 'profile-in-org', roleId: ROLE.STUDENT });
    expect(result).toHaveLength(1);
  });

  it('skips the org-membership check for email-only invites (no profileId)', async () => {
    vi.mocked(addCourseMember).mockResolvedValue({
      id: 'member-1',
      profileId: null,
      roleId: ROLE.STUDENT,
      email: 'student@example.com'
    } as Awaited<ReturnType<typeof addCourseMember>>);

    await addMembers('course-1', [{ email: 'student@example.com', roleId: ROLE.STUDENT, name: 'Student' }]);

    expect(getOrganizationMemberIdByOrgAndProfile).not.toHaveBeenCalled();
    expect(addCourseMember).toHaveBeenCalled();
  });
});
