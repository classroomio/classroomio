import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getLearningPathById: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  enrollMember: vi.fn(),
  listLearningPathCourses: vi.fn(),
  getCourseIdsInPath: vi.fn(),
  initializeMemberCourseProgress: vi.fn(),
  grantCourseAccess: vi.fn(),
  getCourseGroupIds: vi.fn(),
  getCourseById: vi.fn(),
  getStudentCourseMembersForCompliance: vi.fn(),
  getLatestComplianceRecordsByProfiles: vi.fn(),
  createCourseCompletionRecord: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getUserOrgRolesMap: vi.fn(),
  createOrganizationMember: vi.fn(),
  createOrganizationMembers: vi.fn(),
  createOrganizationInvites: vi.fn(),
  createOrganizationInviteAudits: vi.fn().mockResolvedValue([]),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  revokeActiveOrganizationInvitesByEmails: vi.fn(),
  countActiveStudents: vi.fn(),
  lockOrganizationForStudentCapacity: vi.fn(),
  getActiveOrganizationPlan: vi.fn(),
  getProfileById: vi.fn(),
  getProfilesByEmails: vi.fn(),
  enqueueEmailSend: vi.fn(),
  enqueuePathBulkEnroll: vi.fn(),
  emailRegistryGet: vi.fn(),
  resolveLearningPath: vi.fn(),
  assertCanManageLearningPath: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  enrollMember: mocks.enrollMember,
  getLearningPathById: mocks.getLearningPathById,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  grantCourseAccess: mocks.grantCourseAccess,
  initializeMemberCourseProgress: mocks.initializeMemberCourseProgress,
  listLearningPathCourses: mocks.listLearningPathCourses,
  getCourseIdsInPath: mocks.getCourseIdsInPath
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseGroupIds: mocks.getCourseGroupIds,
  getCourseById: mocks.getCourseById
}));

vi.mock('@cio/db/queries/course/compliance', () => ({
  getStudentCourseMembersForCompliance: mocks.getStudentCourseMembersForCompliance,
  getLatestComplianceRecordsByProfiles: mocks.getLatestComplianceRecordsByProfiles,
  createCourseCompletionRecord: mocks.createCourseCompletionRecord
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: mocks.ensureComplianceEnrollmentRecordsForProfiles
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('@cio/db/queries/organization', () => ({
  countActiveStudents: mocks.countActiveStudents,
  createOrganizationInviteAudits: mocks.createOrganizationInviteAudits,
  createOrganizationInvites: mocks.createOrganizationInvites,
  createOrganizationMember: mocks.createOrganizationMember,
  createOrganizationMembers: mocks.createOrganizationMembers,
  getActiveOrganizationPlan: mocks.getActiveOrganizationPlan,
  getOrganizationById: mocks.getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile: mocks.getOrganizationMemberIdByOrgAndProfile,
  getOrganizationMembersByNormalizedEmails: mocks.getOrganizationMembersByNormalizedEmails,
  getUserOrgRolesMap: mocks.getUserOrgRolesMap,
  lockOrganizationForStudentCapacity: mocks.lockOrganizationForStudentCapacity,
  revokeActiveOrganizationInvitesByEmails: mocks.revokeActiveOrganizationInvitesByEmails
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: mocks.getProfileById,
  getProfilesByEmails: mocks.getProfilesByEmails
}));

vi.mock('@cio/db/queries/notifications', () => ({
  EmailPreferenceLookupCache: vi.fn().mockImplementation(() => ({
    shouldSend: vi.fn().mockResolvedValue(true)
  }))
}));

vi.mock('@cio/email', () => ({
  EmailRegistry: { get: mocks.emailRegistryGet },
  buildEmailBranding: vi.fn().mockReturnValue({}),
  buildEmailFromName: vi.fn().mockReturnValue('Test')
}));

vi.mock('@cio/jobs', () => ({
  enqueueEmailSend: mocks.enqueueEmailSend,
  enqueuePathBulkEnroll: mocks.enqueuePathBulkEnroll,
  isRedisConfigured: vi.fn().mockReturnValue(true)
}));

vi.mock('../learning-path', () => ({
  resolveLearningPath: mocks.resolveLearningPath,
  assertCanManageLearningPath: mocks.assertCanManageLearningPath,
  getBulkPathEnrollmentStatus: vi.fn()
}));

import { runQueuedPathBulkEnroll } from '@cio/core/services/learning-path/bulk-enroll';
import { addPathMembersService } from '../member-management';

const PATH = {
  id: '11111111-1111-1111-1111-111111111111',
  organizationId: 'org-1',
  name: 'Bulk Path',
  publicId: 'AbC123Xy',
  autoEnroll: false,
  sequentialUnlock: false,
  welcomeEmailMessage: null
};

const ORG = { id: 'org-1', name: 'Org', siteName: 'org' };

describe('runQueuedPathBulkEnroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
    mocks.getLearningPathById.mockResolvedValue(PATH);
    mocks.getOrganizationById.mockResolvedValue(ORG);
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
    mocks.getUserOrgRolesMap.mockResolvedValue({});
    mocks.getActiveOrganizationPlan.mockResolvedValue(null);
    mocks.countActiveStudents.mockResolvedValue(0);
    mocks.enrollMember.mockImplementation(async (data: { profileId: string }) => ({ id: `m-${data.profileId}` }));
    mocks.listLearningPathCourses.mockResolvedValue([]);
    mocks.getCourseIdsInPath.mockResolvedValue([]);
    mocks.getProfilesByEmails.mockResolvedValue([]);
    mocks.getProfileById.mockImplementation(async (id: string) =>
      id === 'p-1' ? { id: 'p-1', email: 'a@test.dev' } : null
    );
    mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
    mocks.createOrganizationInvites.mockImplementation(async (rows: { email: string }[]) =>
      rows.map((row, index) => ({ id: `inv-${index}`, email: row.email }))
    );
    mocks.emailRegistryGet.mockReturnValue({ schema: { parse: (fields: unknown) => fields } });
    mocks.enqueueEmailSend.mockResolvedValue('email-job-1');
  });

  it('enrolls direct members, sends welcomes, and reports the outcome', async () => {
    mocks.getProfileById.mockImplementation(async (id: string) =>
      id === 'p-1' ? { id: 'p-1', email: 'a@test.dev' } : null
    );

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [
        { profileId: 'p-1', email: 'a@test.dev', roleId: ROLE.STUDENT },
        { profileId: 'p-2', roleId: ROLE.STUDENT }
      ],
      chunkSize: 50
    });

    expect(outcome).toEqual({ requested: 2, enrolled: 2, invited: 0, failed: [] });
    expect(mocks.enrollMember).toHaveBeenCalledTimes(2);
    expect(mocks.enqueueEmailSend).toHaveBeenCalledTimes(1);
    expect(mocks.getCourseIdsInPath).toHaveBeenCalledWith(PATH.id);
    expect(mocks.createCourseCompletionRecord).not.toHaveBeenCalled();
  });

  it('creates compliance records for compliance courses in the path', async () => {
    mocks.getCourseIdsInPath.mockResolvedValue(['c-comp-1', 'c-comp-2']);
    mocks.getCourseById.mockImplementation(async (courseId: string) => [
      { id: courseId, type: 'COMPLIANCE', compliance: {}, certificate: { deadline: '2030-06-01' } }
    ]);
    mocks.getStudentCourseMembersForCompliance.mockResolvedValue([
      { member: { id: 'gm-1', profileId: 'p-1' }, profile: null }
    ]);
    mocks.getLatestComplianceRecordsByProfiles.mockResolvedValue([]);
    mocks.createCourseCompletionRecord.mockResolvedValue({ id: 'rec-1' });

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(outcome.enrolled).toBe(1);
    expect(mocks.createCourseCompletionRecord).toHaveBeenCalledTimes(2);
    expect(mocks.createCourseCompletionRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'c-comp-1',
        groupMemberId: 'gm-1',
        profileId: 'p-1',
        cycleNumber: 1,
        status: 'not_started'
      })
    );
    expect(mocks.createCourseCompletionRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'c-comp-2',
        groupMemberId: 'gm-1',
        profileId: 'p-1',
        cycleNumber: 1,
        status: 'not_started'
      })
    );
  });

  it('keeps committed enrollments when the compliance backfill fails', async () => {
    mocks.getCourseIdsInPath.mockRejectedValueOnce(new Error('compliance store unavailable'));

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(outcome).toEqual({ requested: 1, enrolled: 1, invited: 0, failed: [] });
    expect(mocks.enrollMember).toHaveBeenCalledTimes(1);
  });

  it('invites emails without profiles instead of enrolling them', async () => {
    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ email: 'new@test.dev', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(outcome).toEqual({ requested: 1, enrolled: 0, invited: 1, failed: [] });
    expect(mocks.enrollMember).not.toHaveBeenCalled();
    expect(mocks.createOrganizationInvites).toHaveBeenCalledWith([
      expect.objectContaining({ email: 'new@test.dev', metadata: expect.objectContaining({ pathIds: [PATH.id] }) })
    ]);
  });

  it('resolves email-only entries to existing profiles', async () => {
    mocks.getProfilesByEmails.mockResolvedValue([{ id: 'p-9', email: 'found@test.dev' }]);

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ email: 'found@test.dev', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(outcome.enrolled).toBe(1);
    expect(mocks.enrollMember).toHaveBeenCalledWith(expect.objectContaining({ profileId: 'p-9' }), transactionClient);
    expect(mocks.createOrganizationInvites).not.toHaveBeenCalled();
  });

  it('reports tutor emails without accounts as failures instead of throwing', async () => {
    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [
        { email: 'tutor@test.dev', roleId: ROLE.TUTOR },
        { profileId: 'p-1', roleId: ROLE.STUDENT }
      ],
      chunkSize: 50
    });

    expect(outcome.enrolled).toBe(1);
    expect(outcome.failed).toEqual([{ key: 'tutor@test.dev', reason: 'TUTOR_REQUIRES_ACCOUNT' }]);
  });

  it('throws PATH_NOT_FOUND for missing or foreign paths', async () => {
    mocks.getLearningPathById.mockResolvedValue(null);

    await expect(
      runQueuedPathBulkEnroll({
        organizationId: 'org-1',
        actorProfileId: 'admin-1',
        pathId: 'missing',
        members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
        chunkSize: 50
      })
    ).rejects.toMatchObject({ name: 'PathBulkEnrollError', code: 'PATH_NOT_FOUND' });

    mocks.getLearningPathById.mockResolvedValue({ ...PATH, organizationId: 'other-org' });

    await expect(
      runQueuedPathBulkEnroll({
        organizationId: 'org-1',
        actorProfileId: 'admin-1',
        pathId: PATH.id,
        members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
        chunkSize: 50
      })
    ).rejects.toMatchObject({ code: 'PATH_NOT_FOUND' });
  });

  it('records a failed chunk without aborting later chunks', async () => {
    mocks.enrollMember
      .mockRejectedValueOnce(new Error('db blew up'))
      .mockImplementation(async (data: { profileId: string }) => ({ id: `m-${data.profileId}` }));

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [
        { profileId: 'p-1', roleId: ROLE.STUDENT },
        { profileId: 'p-2', roleId: ROLE.STUDENT }
      ],
      chunkSize: 1
    });

    expect(outcome).toEqual({
      requested: 2,
      enrolled: 1,
      invited: 0,
      failed: [{ key: 'p-1', reason: 'CHUNK_FAILED' }]
    });
  });

  it('aborts the run when the student quota is exceeded', async () => {
    mocks.countActiveStudents.mockResolvedValue(25);

    await expect(
      runQueuedPathBulkEnroll({
        organizationId: 'org-1',
        actorProfileId: 'admin-1',
        pathId: PATH.id,
        members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
        chunkSize: 50
      })
    ).rejects.toMatchObject({ name: 'PathBulkEnrollError', code: 'QUOTA_EXCEEDED' });
  });
});

describe('addPathMembersService bulk routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
    mocks.resolveLearningPath.mockResolvedValue({ ...PATH, isPublished: true });
    mocks.assertCanManageLearningPath.mockResolvedValue(undefined);
    mocks.getProfilesByEmails.mockResolvedValue([]);
    mocks.getCourseIdsInPath.mockResolvedValue([]);
  });

  function bulkMembers(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      profileId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      roleId: ROLE.STUDENT
    }));
  }

  it('queues adds above the bulk threshold instead of enrolling inline', async () => {
    mocks.enqueuePathBulkEnroll.mockResolvedValue('job-1');

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(result).toEqual({ mode: 'queued', jobId: 'job-1', requested: 51 });
    expect(mocks.enqueuePathBulkEnroll).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', actorProfileId: 'admin-1', pathId: PATH.id })
    );
    expect(mocks.enrollMember).not.toHaveBeenCalled();
  });

  it('throws when the queue is unavailable', async () => {
    mocks.enqueuePathBulkEnroll.mockResolvedValue(undefined);

    await expect(
      addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', { 'org-1': ROLE.ADMIN })
    ).rejects.toMatchObject({ code: ErrorCodes.INTERNAL_ERROR, statusCode: 500 });
  });

  it('still enrolls inline at or below the threshold', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
    mocks.enrollMember.mockImplementation(async (data: { profileId: string }) => ({ id: `m-${data.profileId}` }));
    mocks.listLearningPathCourses.mockResolvedValue([]);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(7);
    mocks.getOrganizationById.mockResolvedValue(ORG);

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(50) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(Array.isArray(result)).toBe(true);
    expect(mocks.enqueuePathBulkEnroll).not.toHaveBeenCalled();
    expect(mocks.enrollMember).toHaveBeenCalledTimes(50);
    expect(mocks.ensureComplianceEnrollmentRecordsForProfiles).toHaveBeenCalledOnce();
    const [, inlineProfileIds] = mocks.ensureComplianceEnrollmentRecordsForProfiles.mock.calls[0];

    expect(inlineProfileIds).toHaveLength(50);
  });
});
