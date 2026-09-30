import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  addCourseMember: vi.fn(),
  getCourseGroupId: vi.fn(),
  getCourseTeachers: vi.fn().mockResolvedValue([]),
  getCourseMember: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn().mockResolvedValue(null),
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn(),
  getProfileById: vi.fn(),
  invalidateOrgStats: vi.fn().mockResolvedValue(undefined),
  enqueueTransactionalEmail: vi.fn().mockResolvedValue(undefined),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn().mockResolvedValue({ createdCount: 0 }),
  getWelcomeSessionIcs: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/db/queries/course/people', () => ({
  addCourseMember: mocks.addCourseMember,
  deleteCourseMember: vi.fn(),
  getCourseGroupId: mocks.getCourseGroupId,
  getCourseMember: mocks.getCourseMember,
  getCourseMembers: vi.fn(),
  getPaginatedCourseMembers: vi.fn(),
  getCourseTeachers: mocks.getCourseTeachers,
  updateCourseMember: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile
}));

vi.mock('@cio/db/queries/course/reset-progress', () => ({
  resetStudentCourseProgress: vi.fn()
}));

vi.mock('@cio/core/config/dashboard-url', () => ({
  getDashboardBaseUrl: vi.fn().mockReturnValue('http://localhost:5173')
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: mocks.invalidateOrgStats
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: mocks.getCourseById,
  getCourseWithOrgData: mocks.getCourseWithOrgData,
  getOrgIdByCourseId: mocks.getOrgIdByCourseId
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: mocks.getProfileById
}));

vi.mock('@cio/email', () => ({
  buildEmailFromName: vi.fn().mockReturnValue('Test'),
  buildEmailBranding: vi.fn().mockReturnValue({})
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: mocks.enqueueTransactionalEmail
}));

vi.mock('@api/services/learning-path', () => ({
  syncCourseProgressInLearningPaths: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: mocks.ensureComplianceEnrollmentRecordsForProfiles
}));

vi.mock('../member-progress', () => ({
  getCourseMemberProgressSummaries: vi.fn()
}));

vi.mock('../enrollment-grants', () => ({
  recordDirectCourseGrant: vi.fn().mockResolvedValue(undefined),
  recordDirectCourseGrantsBulk: vi.fn().mockResolvedValue(0)
}));

vi.mock('../session-invite', () => ({
  getWelcomeSessionIcs: mocks.getWelcomeSessionIcs
}));

import { addMember, addMembers } from '../people';
import { recordDirectCourseGrant } from '../enrollment-grants';

describe('requiresLearningPath enforcement in course people', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrgIdByCourseId.mockResolvedValue('org-1');
    mocks.getCourseWithOrgData.mockResolvedValue({
      courseTitle: 'Course',
      orgName: 'Org',
      orgId: 'org-1',
      orgSiteName: 'org',
      orgAvatarUrl: null,
      orgTheme: null,
      orgCustomDomain: null,
      orgIsCustomDomainVerified: null,
      welcomeEmailMessage: null
    });
    mocks.getProfileById.mockResolvedValue({ id: 'p-1', email: 's@test.dev', fullname: 'S' });
    mocks.addCourseMember.mockResolvedValue({ id: 'gm-1', profileId: 'p-1' });
  });

  it('rejects adding a student to a path-only course via addMember', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', requiresLearningPath: true }]);

    await expect(
      addMember('c-1', { profileId: 'p-1', roleId: ROLE.STUDENT, email: 's@test.dev' })
    ).rejects.toMatchObject({ code: ErrorCodes.VALIDATION_ERROR, statusCode: 400 });

    expect(mocks.addCourseMember).not.toHaveBeenCalled();
  });

  it('allows adding a tutor to a path-only course via addMember', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', requiresLearningPath: true }]);

    await addMember('c-1', { profileId: 'p-1', roleId: ROLE.TUTOR, email: 't@test.dev' });

    expect(mocks.addCourseMember).toHaveBeenCalled();
  });

  it('allows adding a student to a regular course via addMember', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', requiresLearningPath: false }]);

    await addMember('c-1', { profileId: 'p-1', roleId: ROLE.STUDENT, email: 's@test.dev' });

    expect(mocks.addCourseMember).toHaveBeenCalled();
    expect(vi.mocked(recordDirectCourseGrant)).toHaveBeenCalledWith(
      { groupmemberId: 'gm-1', courseId: 'c-1', profileId: 'p-1' },
      { source: 'ADMIN_ADD' },
      expect.anything()
    );
  });

  it('re-adding an existing tutor skips the insert and records no grant', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', requiresLearningPath: false }]);
    mocks.getCourseGroupId.mockResolvedValue('g-1');
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-existing');
    mocks.getCourseMember.mockResolvedValue({
      id: 'gm-existing',
      groupId: 'g-1',
      profileId: 'p-1',
      roleId: ROLE.TUTOR,
      email: 't@test.dev'
    });

    const result = await addMember('c-1', { profileId: 'p-1', roleId: ROLE.TUTOR, email: 't@test.dev' });

    expect(result).toMatchObject({ id: 'gm-existing', profileId: 'p-1' });
    expect(mocks.addCourseMember).not.toHaveBeenCalled();
    expect(vi.mocked(recordDirectCourseGrant)).not.toHaveBeenCalled();
  });

  it('re-adding an existing student skips the insert but repairs the grant', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', requiresLearningPath: false }]);
    mocks.getCourseGroupId.mockResolvedValue('g-1');
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-existing');
    mocks.getCourseMember.mockResolvedValue({
      id: 'gm-existing',
      groupId: 'g-1',
      profileId: 'p-1',
      roleId: ROLE.STUDENT,
      email: 's@test.dev'
    });

    const result = await addMember('c-1', { profileId: 'p-1', roleId: ROLE.STUDENT, email: 's@test.dev' });

    expect(result).toMatchObject({ id: 'gm-existing', profileId: 'p-1' });
    expect(mocks.addCourseMember).not.toHaveBeenCalled();
    expect(vi.mocked(recordDirectCourseGrant)).toHaveBeenCalledWith(
      { groupmemberId: 'gm-existing', courseId: 'c-1', profileId: 'p-1' },
      { source: 'ADMIN_ADD' },
      expect.anything()
    );
  });

  it('rejects bulk student adds to a path-only course via addMembers', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'c-1', requiresLearningPath: true }]);

    await expect(
      addMembers('c-1', [{ profileId: 'p-1', roleId: ROLE.STUDENT, email: 's@test.dev' }])
    ).rejects.toMatchObject({ code: ErrorCodes.VALIDATION_ERROR, statusCode: 400 });

    expect(mocks.addCourseMember).not.toHaveBeenCalled();
  });
});
