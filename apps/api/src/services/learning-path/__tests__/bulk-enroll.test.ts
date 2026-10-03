import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getLearningPathById: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  enrollMember: vi.fn(),
  listLearningPathCourses: vi.fn(),
  getCourseIdsInPath: vi.fn(),
  initializeMemberCourseProgress: vi.fn(),
  grantCourseAccess: vi.fn(),
  ensureLearningPathCourseGrants: vi.fn(),
  enrollBulkMember: vi.fn(),
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
  getOrgMembersByProfileIds: vi.fn().mockResolvedValue([]),
  isRedisConfigured: vi.fn().mockReturnValue(true),
  waitForRedisReady: vi.fn().mockResolvedValue(true),
  emailRegistryGet: vi.fn(),
  resolveLearningPath: vi.fn(),
  assertCanManageLearningPath: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn(),
  syncLearningPathMembersProgress: vi.fn(),
  scheduleLearningPathProgressSync: vi.fn(),
  supersedeStudentOrgInvites: vi.fn(),
  getStaffInvitedEmails: vi.fn().mockResolvedValue(new Set<string>()),
  notifyStudentMilestone: vi.fn().mockResolvedValue(undefined)
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
  enrollBulkMember: mocks.enrollBulkMember,
  ensureLearningPathCourseGrants: mocks.ensureLearningPathCourseGrants,
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
  getOrgMembersByProfileIds: mocks.getOrgMembersByProfileIds,
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
  isRedisConfigured: mocks.isRedisConfigured,
  waitForRedisReady: mocks.waitForRedisReady
}));

vi.mock('@cio/core/services/learning-path/progress-sync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/core/services/learning-path/progress-sync')>()),
  syncLearningPathMembersProgress: mocks.syncLearningPathMembersProgress
}));

vi.mock('../progress-sync-jobs', () => ({
  scheduleLearningPathProgressSync: mocks.scheduleLearningPathProgressSync
}));

vi.mock('@cio/core/services/organization/supersede-invites', () => ({
  getStaffInvitedEmails: mocks.getStaffInvitedEmails,
  supersedeStudentOrgInvites: mocks.supersedeStudentOrgInvites
}));

vi.mock('@cio/core/services/organization/student-milestone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/core/services/organization/student-milestone')>()),
  notifyStudentMilestone: mocks.notifyStudentMilestone
}));

vi.mock('@api/services/organization/student-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@api/services/organization/student-limit')>()),
  notifyStudentMilestone: mocks.notifyStudentMilestone
}));

vi.mock('../learning-path', () => ({
  resolveLearningPath: mocks.resolveLearningPath,
  assertCanManageLearningPath: mocks.assertCanManageLearningPath,
  getBulkPathEnrollmentStatus: vi.fn()
}));

import { runQueuedPathBulkEnroll } from '@cio/core/services/learning-path/bulk-enroll';
import { getInviteExpiryLabel } from '@cio/core/services/learning-path/path-invite-utils';
import { addPathMembersService } from '../member-management';

const PATH = {
  id: '11111111-1111-1111-1111-111111111111',
  organizationId: 'org-1',
  name: 'Bulk Path',
  publicId: 'AbC123Xy',
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
    mocks.enrollMember.mockImplementation(async (data: { profileId: string; roleId?: number }) => ({
      id: `m-${data.profileId}`,
      roleId: data.roleId ?? ROLE.STUDENT,
      profileId: data.profileId
    }));
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
    mocks.supersedeStudentOrgInvites.mockImplementation(async (_tx: unknown, input: { emails: string[] }) => ({
      invites: input.emails.map((email: string) => ({
        email,
        inviteId: `inv-${email}`,
        token: `token-${email}`,
        expiresAt: '2026-03-01T00:00:00.000Z',
        courseIds: [],
        cohortIds: [],
        pathIds: [],
        accessNamesLabel: undefined,
        merged: false
      })),
      skipped: []
    }));
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
    // Prior work counts, so the enrolled students' progress is synced once the chunks commit.
    expect(mocks.syncLearningPathMembersProgress).toHaveBeenCalledWith({ pathId: PATH.id, profileIds: ['p-1', 'p-2'] });
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
    // The invite email carries the stored expiry, not a recomputed one.
    expect(mocks.enqueueEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({ expiresAt: getInviteExpiryLabel('2026-03-01T00:00:00.000Z') })
      }),
      expect.anything()
    );
    expect(mocks.supersedeStudentOrgInvites).toHaveBeenCalledWith(
      transactionClient,
      expect.objectContaining({
        orgId: 'org-1',
        emails: ['new@test.dev'],
        actorProfileId: 'admin-1',
        source: 'LEARNING_PATH_BULK_ADD',
        add: { courseIds: [], cohortIds: [], pathIds: [PATH.id] }
      })
    );
  });

  it('reports emails skipped for an existing staff invite as failures without writing a student member row', async () => {
    mocks.getStaffInvitedEmails.mockResolvedValueOnce(new Set(['staff@test.dev']));
    mocks.supersedeStudentOrgInvites.mockResolvedValueOnce({
      invites: [],
      skipped: [{ email: 'staff@test.dev', reason: 'STAFF_INVITE' }]
    });

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ email: 'staff@test.dev', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(outcome).toEqual({
      requested: 1,
      enrolled: 0,
      invited: 0,
      failed: [{ key: 'staff@test.dev', reason: 'STAFF_INVITE' }]
    });
    // A STUDENT row would commit without an invite and take a seat.
    expect(mocks.createOrganizationMembers).not.toHaveBeenCalled();
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

  it('reports a partial outcome when the student quota is exceeded mid-run', async () => {
    mocks.countActiveStudents
      .mockResolvedValueOnce(0) // Seat usage before the run
      .mockResolvedValueOnce(0) // First chunk check passes
      .mockResolvedValueOnce(25); // Second chunk check fails (quota exceeded)

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [
        { profileId: 'p-1', roleId: ROLE.STUDENT },
        { profileId: 'p-2', roleId: ROLE.STUDENT },
        { profileId: 'p-3', roleId: ROLE.STUDENT },
        { profileId: 'p-4', roleId: ROLE.STUDENT }
      ],
      chunkSize: 1
    });

    // p-3 and p-4 sit in later chunks that never run, but are still reported.
    expect(outcome).toEqual({
      requested: 4,
      enrolled: 1,
      invited: 0,
      failed: [
        { key: 'p-2', reason: 'QUOTA_EXCEEDED' },
        { key: 'p-3', reason: 'QUOTA_EXCEEDED' },
        { key: 'p-4', reason: 'QUOTA_EXCEEDED' }
      ]
    });
    // p-2's member write runs before the capacity check and rolls back with its
    // chunk; only p-1 committed, so only p-1 is synced.
    expect(mocks.enrollMember).toHaveBeenCalledTimes(2);
    expect(mocks.syncLearningPathMembersProgress).toHaveBeenCalledWith({ pathId: PATH.id, profileIds: ['p-1'] });
  });

  it('sends the student-limit milestone after the run from the seats it took', async () => {
    // 9 of the Free plan's 20 seats before the run; the committed student
    // makes 10, crossing the halfway mark.
    mocks.countActiveStudents
      .mockResolvedValueOnce(9) // Seat usage before the run
      .mockResolvedValueOnce(9) // Chunk capacity check
      .mockResolvedValueOnce(10); // Seat usage after the run

    await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(mocks.notifyStudentMilestone).toHaveBeenCalledTimes(1);
    expect(mocks.notifyStudentMilestone).toHaveBeenCalledWith({
      orgId: 'org-1',
      milestone: 'half',
      studentCount: 10,
      studentLimit: 20
    });
  });

  it('does not send the student-limit milestone when the run takes no seats', async () => {
    mocks.countActiveStudents.mockResolvedValue(25);

    await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(mocks.notifyStudentMilestone).not.toHaveBeenCalled();
  });

  it('reports every member as QUOTA_EXCEEDED when the first chunk is over the limit', async () => {
    mocks.countActiveStudents.mockResolvedValue(25);

    const outcome = await runQueuedPathBulkEnroll({
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
      chunkSize: 50
    });

    expect(outcome).toEqual({
      requested: 1,
      enrolled: 0,
      invited: 0,
      failed: [{ key: 'p-1', reason: 'QUOTA_EXCEEDED' }]
    });
    // The rolled-back chunk leaves nothing committed to sync.
    expect(mocks.syncLearningPathMembersProgress).not.toHaveBeenCalled();
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

  /** Routing tests add existing org members, so the batch takes no new seats. */
  function existingOrgMembers(count: number) {
    mocks.getOrgMembersByProfileIds.mockResolvedValue(
      bulkMembers(count).map((member) => ({ profileId: member.profileId, roleId: ROLE.STUDENT }))
    );
  }

  it('queues adds above the bulk threshold instead of enrolling inline', async () => {
    existingOrgMembers(51);
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

  it('a large add over the student limit gets 403 before it is queued or any chunk is written', async () => {
    mocks.getOrgMembersByProfileIds.mockResolvedValue([]);
    mocks.getActiveOrganizationPlan.mockResolvedValue(null);
    mocks.countActiveStudents.mockResolvedValue(0);

    await expect(
      addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', { 'org-1': ROLE.ADMIN })
    ).rejects.toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED' });

    // The seat check runs before Redis is consulted, so neither branch starts.
    expect(mocks.isRedisConfigured).not.toHaveBeenCalled();
    expect(mocks.enqueuePathBulkEnroll).not.toHaveBeenCalled();
    expect(mocks.enrollBulkMember).not.toHaveBeenCalled();
    expect(mocks.enrollMember).not.toHaveBeenCalled();
    expect(mocks.notifyStudentMilestone).not.toHaveBeenCalled();
  });

  it('does not send the student-limit milestone when a large add is only queued', async () => {
    // 41 of the 51 are already org members, so the add takes 10 new seats:
    // 5 + 10 would cross the halfway mark of the Free plan's 20-student limit,
    // but nobody has joined yet, so the worker sends it after the run.
    existingOrgMembers(41);
    mocks.getActiveOrganizationPlan.mockResolvedValue(null);
    mocks.countActiveStudents.mockResolvedValue(5);
    mocks.enqueuePathBulkEnroll.mockResolvedValue('job-1');

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(result).toEqual({ mode: 'queued', jobId: 'job-1', requested: 51 });
    expect(mocks.notifyStudentMilestone).not.toHaveBeenCalled();
  });

  it('runs inline without Redis', async () => {
    existingOrgMembers(51);
    mocks.isRedisConfigured.mockReturnValueOnce(false);
    mocks.getLearningPathById.mockResolvedValue(PATH);
    mocks.getOrganizationById.mockResolvedValue(ORG);
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
    mocks.getUserOrgRolesMap.mockResolvedValue({});
    mocks.getActiveOrganizationPlan.mockResolvedValue(null);
    mocks.countActiveStudents.mockResolvedValue(0);
    mocks.enrollBulkMember.mockImplementation(async (data: { profileId: string; roleId?: number }) => ({
      id: `m-${data.profileId}`,
      roleId: data.roleId ?? ROLE.STUDENT,
      profileId: data.profileId
    }));
    mocks.listLearningPathCourses.mockResolvedValue([]);
    mocks.getProfilesByEmails.mockResolvedValue([]);
    mocks.getProfileById.mockResolvedValue(null);
    mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
    mocks.emailRegistryGet.mockReturnValue({ schema: { parse: (fields: unknown) => fields } });
    mocks.enqueueEmailSend.mockResolvedValue('email-job-1');

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(result).toMatchObject({ mode: 'completed', requested: 51, enrolled: 51, invited: 0, failed: [] });
    expect(mocks.enqueuePathBulkEnroll).not.toHaveBeenCalled();
  });

  it('falls back when enqueue throws', async () => {
    existingOrgMembers(51);
    mocks.enqueuePathBulkEnroll.mockRejectedValueOnce(new Error('redis down'));
    mocks.getLearningPathById.mockResolvedValue(PATH);
    mocks.getOrganizationById.mockResolvedValue(ORG);
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
    mocks.getUserOrgRolesMap.mockResolvedValue({});
    mocks.getActiveOrganizationPlan.mockResolvedValue(null);
    mocks.countActiveStudents.mockResolvedValue(0);
    mocks.enrollBulkMember.mockImplementation(async (data: { profileId: string; roleId?: number }) => ({
      id: `m-${data.profileId}`,
      roleId: data.roleId ?? ROLE.STUDENT,
      profileId: data.profileId
    }));
    mocks.listLearningPathCourses.mockResolvedValue([]);
    mocks.getProfilesByEmails.mockResolvedValue([]);
    mocks.getProfileById.mockResolvedValue(null);
    mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
    mocks.emailRegistryGet.mockReturnValue({ schema: { parse: (fields: unknown) => fields } });
    mocks.enqueueEmailSend.mockResolvedValue('email-job-1');

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(result).toMatchObject({ mode: 'completed', requested: 51, enrolled: 51, failed: [] });
  });

  it('runs inline when Redis is configured but not ready', async () => {
    existingOrgMembers(51);
    mocks.waitForRedisReady.mockResolvedValueOnce(false);
    mocks.getLearningPathById.mockResolvedValue(PATH);
    mocks.getOrganizationById.mockResolvedValue(ORG);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(7);
    mocks.enrollBulkMember.mockImplementation(async (data: { profileId: string; roleId?: number }) => ({
      id: `m-${data.profileId}`,
      roleId: data.roleId ?? ROLE.STUDENT,
      profileId: data.profileId
    }));
    mocks.listLearningPathCourses.mockResolvedValue([]);

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(result).toMatchObject({ mode: 'completed', requested: 51 });
    expect(mocks.enqueuePathBulkEnroll).not.toHaveBeenCalled();
  });

  it('returns 503 and never runs inline when the enqueue hangs past the timeout', async () => {
    existingOrgMembers(51);
    vi.useFakeTimers();
    mocks.enqueuePathBulkEnroll.mockReturnValueOnce(new Promise(() => {}));

    const pending = addPathMembersService(PATH.id, { members: bulkMembers(51) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });
    const assertion = expect(pending).rejects.toMatchObject({ statusCode: 503 });

    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
    vi.useRealTimers();

    expect(mocks.enrollBulkMember).not.toHaveBeenCalled();
    expect(mocks.enrollMember).not.toHaveBeenCalled();
  });

  it('still enrolls inline at or below the threshold', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
    mocks.enrollMember.mockImplementation(async (data: { profileId: string; roleId?: number }) => ({
      id: `m-${data.profileId}`,
      roleId: data.roleId ?? ROLE.STUDENT,
      profileId: data.profileId
    }));
    mocks.listLearningPathCourses.mockResolvedValue([]);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(7);
    mocks.getOrganizationById.mockResolvedValue(ORG);

    const result = await addPathMembersService(PATH.id, { members: bulkMembers(50) }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(result).toMatchObject({ mode: 'completed', requested: 50 });
    expect(mocks.enqueuePathBulkEnroll).not.toHaveBeenCalled();
    expect(mocks.enrollMember).toHaveBeenCalledTimes(50);
    expect(mocks.ensureComplianceEnrollmentRecordsForProfiles).toHaveBeenCalledOnce();
    const [, inlineProfileIds] = mocks.ensureComplianceEnrollmentRecordsForProfiles.mock.calls[0];

    expect(inlineProfileIds).toHaveLength(50);
    expect(mocks.scheduleLearningPathProgressSync).toHaveBeenCalledWith({
      pathId: PATH.id,
      profileIds: inlineProfileIds
    });
  });
});

describe('runQueuedPathBulkEnroll removal guard', () => {
  const ENQUEUED_AT = '2026-02-01T00:00:00.000Z';

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
    mocks.listLearningPathCourses.mockResolvedValue([]);
    mocks.getCourseIdsInPath.mockResolvedValue([]);
    mocks.getProfilesByEmails.mockResolvedValue([]);
    mocks.getProfileById.mockResolvedValue(null);
    mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
    mocks.emailRegistryGet.mockReturnValue({ schema: { parse: (fields: unknown) => fields } });
    mocks.enqueueEmailSend.mockResolvedValue('email-job-1');
    mocks.supersedeStudentOrgInvites.mockImplementation(async (_tx: unknown, input: { emails: string[] }) => ({
      invites: input.emails.map((email: string) => ({
        email,
        inviteId: `inv-${email}`,
        token: `token-${email}`,
        expiresAt: '2026-03-01T00:00:00.000Z',
        courseIds: [],
        cohortIds: [],
        pathIds: [],
        accessNamesLabel: undefined,
        merged: false
      })),
      skipped: []
    }));
  });

  function bulkPayload() {
    return {
      organizationId: 'org-1',
      actorProfileId: 'admin-1',
      pathId: PATH.id,
      members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }],
      chunkSize: 50,
      enqueuedAt: ENQUEUED_AT
    };
  }

  it('removed after enqueue is skipped and reported', async () => {
    mocks.enrollBulkMember.mockResolvedValue(null);

    const outcome = await runQueuedPathBulkEnroll(bulkPayload());

    expect(outcome.enrolled).toBe(0);
    expect(outcome.failed).toEqual([{ key: 'p-1', reason: 'REMOVED_SINCE_ENQUEUE' }]);
    expect(mocks.enrollBulkMember).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'p-1' }),
      ENQUEUED_AT,
      transactionClient
    );
    expect(mocks.enrollMember).not.toHaveBeenCalled();
  });

  it('removed before enqueue is re-enrolled', async () => {
    mocks.enrollBulkMember.mockResolvedValue({ id: 'm-p-1', roleId: ROLE.STUDENT });

    const outcome = await runQueuedPathBulkEnroll(bulkPayload());

    expect(outcome.enrolled).toBe(1);
    expect(outcome.failed).toEqual([]);
  });

  it('an active tutor keeps their role', async () => {
    mocks.enrollBulkMember.mockImplementation(async (data: { roleId: number }) => ({
      id: 'm-p-1',
      roleId: data.roleId
    }));

    const outcome = await runQueuedPathBulkEnroll({
      ...bulkPayload(),
      members: [{ profileId: 'p-1', roleId: ROLE.TUTOR }]
    });

    expect(outcome.enrolled).toBe(1);
    // The bulk upsert carries the requested role; the query keeps the stored
    // role for already-active rows (covered database-backed below).
    expect(mocks.enrollBulkMember).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'p-1', roleId: ROLE.TUTOR }),
      ENQUEUED_AT,
      transactionClient
    );
  });
});
