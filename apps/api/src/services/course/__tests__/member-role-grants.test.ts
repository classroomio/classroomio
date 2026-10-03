import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCourseMember: vi.fn(),
  updateCourseMember: vi.fn(),
  deleteCourseMember: vi.fn(),
  getOrgIdByCourseId: vi.fn(),
  invalidateOrgStats: vi.fn(),
  recordDirectCourseGrant: vi.fn(),
  revokeGrantsForGroupmember: vi.fn()
}));

const transactionClient = { id: 'tx' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMember: mocks.getCourseMember,
  updateCourseMember: mocks.updateCourseMember,
  deleteCourseMember: mocks.deleteCourseMember,
  getCourseGroupId: vi.fn(),
  getCourseMembers: vi.fn(),
  getPaginatedCourseMembers: vi.fn(),
  getCourseTeachers: vi.fn().mockResolvedValue([]),
  addCourseMember: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getOrgIdByCourseId: mocks.getOrgIdByCourseId,
  getCourseWithOrgData: vi.fn(),
  getCourseById: vi.fn()
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: mocks.invalidateOrgStats
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  revokeGrantsForGroupmember: mocks.revokeGrantsForGroupmember
}));

vi.mock('../enrollment-grants', () => ({
  recordDirectCourseGrant: mocks.recordDirectCourseGrant,
  recordDirectCourseGrantsBulk: vi.fn()
}));

vi.mock('../compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

vi.mock('@api/services/learning-path', () => ({
  syncCourseProgressInLearningPaths: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn()
}));

vi.mock('@cio/email', () => ({
  buildEmailFromName: vi.fn(),
  buildEmailBranding: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('../member-progress', () => ({
  getCourseMemberProgressSummaries: vi.fn()
}));

vi.mock('../session-invite', () => ({
  getWelcomeSessionIcs: vi.fn()
}));

vi.mock('../path-gate', () => ({
  assertCourseAllowsDirectStudentAdd: vi.fn()
}));

import { assertCourseAllowsDirectStudentAdd } from '../path-gate';
import { deleteMember, updateMember } from '../people';

describe('updateMember role grant writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient));
    mocks.getOrgIdByCourseId.mockResolvedValue('org-1');
    mocks.invalidateOrgStats.mockResolvedValue(undefined);
  });

  it('writes ADMIN_ADD grant when a member becomes STUDENT', async () => {
    mocks.getCourseMember.mockResolvedValue({ id: 'gm-1', roleId: ROLE.TUTOR, profileId: 'p-1' });
    mocks.updateCourseMember.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT, profileId: 'p-1' });

    await updateMember('c-1', 'gm-1', { roleId: ROLE.STUDENT }, 'actor-1');

    // The update only applies while the stored role is still the TUTOR the grant decision was based on.
    expect(mocks.updateCourseMember).toHaveBeenCalledWith(
      'c-1',
      'gm-1',
      { roleId: ROLE.STUDENT },
      transactionClient,
      ROLE.TUTOR
    );
    expect(assertCourseAllowsDirectStudentAdd).toHaveBeenCalledWith('c-1', transactionClient);
    expect(mocks.recordDirectCourseGrant).toHaveBeenCalledWith(
      { groupmemberId: 'gm-1', courseId: 'c-1', profileId: 'p-1' },
      { source: 'ADMIN_ADD', grantedByProfileId: 'actor-1' },
      transactionClient
    );
    expect(mocks.revokeGrantsForGroupmember).not.toHaveBeenCalled();
  });

  it('revokes grants when a member leaves STUDENT', async () => {
    mocks.getCourseMember.mockResolvedValue({ id: 'gm-2', roleId: ROLE.STUDENT, profileId: 'p-2' });
    mocks.updateCourseMember.mockResolvedValue({ id: 'gm-2', roleId: ROLE.TUTOR, profileId: 'p-2' });

    await updateMember('c-1', 'gm-2', { roleId: ROLE.TUTOR });

    expect(mocks.revokeGrantsForGroupmember).toHaveBeenCalledWith('gm-2', transactionClient);
    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it('a concurrent role change gets 409 and writes no grant', async () => {
    mocks.getCourseMember
      .mockResolvedValueOnce({ id: 'gm-3', roleId: ROLE.TUTOR, profileId: 'p-3' })
      .mockResolvedValueOnce({ id: 'gm-3', roleId: ROLE.ADMIN, profileId: 'p-3' });
    mocks.updateCourseMember.mockResolvedValue(null);

    await expect(updateMember('c-1', 'gm-3', { roleId: ROLE.STUDENT }, 'actor-1')).rejects.toMatchObject({
      statusCode: 409
    });

    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it('a member removed mid-change gets 404', async () => {
    mocks.getCourseMember
      .mockResolvedValueOnce({ id: 'gm-4', roleId: ROLE.TUTOR, profileId: 'p-4' })
      .mockResolvedValueOnce(null);
    mocks.updateCourseMember.mockResolvedValue(null);

    await expect(updateMember('c-1', 'gm-4', { roleId: ROLE.STUDENT })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteMember revokes before delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient));
    mocks.getOrgIdByCourseId.mockResolvedValue('org-1');
    mocks.invalidateOrgStats.mockResolvedValue(undefined);
  });

  it('removing two self-enrolled students both succeed with no grants remaining', async () => {
    mocks.getCourseMember
      .mockResolvedValueOnce({ id: 'gm-1', roleId: ROLE.STUDENT })
      .mockResolvedValueOnce({ id: 'gm-2', roleId: ROLE.STUDENT });
    mocks.deleteCourseMember
      .mockResolvedValueOnce({ id: 'gm-1', roleId: ROLE.STUDENT })
      .mockResolvedValueOnce({ id: 'gm-2', roleId: ROLE.STUDENT });

    const first = await deleteMember('c-1', 'gm-1');
    const second = await deleteMember('c-1', 'gm-2');

    expect(first).toMatchObject({ id: 'gm-1' });
    expect(second).toMatchObject({ id: 'gm-2' });
    expect(mocks.revokeGrantsForGroupmember).toHaveBeenCalledTimes(2);
    // Revoke runs before delete (defensive: cascade would remove rows anyway).
    const firstRevokeOrder = mocks.revokeGrantsForGroupmember.mock.invocationCallOrder[0];
    const firstDeleteOrder = mocks.deleteCourseMember.mock.invocationCallOrder[0];
    expect(firstRevokeOrder).toBeLessThan(firstDeleteOrder);
  });
});
