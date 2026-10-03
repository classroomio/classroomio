import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  getActiveOrganizationInvitesByEmails: vi.fn(),
  lockOrganizationInviteEmails: vi.fn(),
  revokeOrganizationInvitesByIds: vi.fn(),
  createOrganizationInvites: vi.fn(),
  createOrganizationInviteAudits: vi.fn(),
  getOrgCourses: vi.fn(),
  getCohortsByOrg: vi.fn(),
  getOrgLearningPathsByIds: vi.fn()
}));

const tx = { id: 'test-tx' };

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationInvitesByEmails: mocks.getActiveOrganizationInvitesByEmails,
  lockOrganizationInviteEmails: mocks.lockOrganizationInviteEmails,
  revokeOrganizationInvitesByIds: mocks.revokeOrganizationInvitesByIds,
  createOrganizationInvites: mocks.createOrganizationInvites,
  createOrganizationInviteAudits: mocks.createOrganizationInviteAudits
}));

vi.mock('@cio/db/queries/course', () => ({
  getOrgCourses: mocks.getOrgCourses
}));

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortsByOrg: mocks.getCohortsByOrg
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getOrgLearningPathsByIds: mocks.getOrgLearningPathsByIds
}));

import { supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';

function activeInvite(id: string, email: string, metadata: unknown, roleId: number = ROLE.STUDENT) {
  return {
    id,
    organizationId: 'org-1',
    roleId,
    email,
    metadata,
    isRevoked: false,
    acceptedAt: null,
    expiresAt: new Date(Date.now() + 3600_000).toISOString()
  };
}

describe('supersedeStudentOrgInvites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveOrganizationInvitesByEmails.mockResolvedValue([]);
    mocks.revokeOrganizationInvitesByIds.mockResolvedValue([]);
    mocks.createOrganizationInvites.mockImplementation(async (rows: Array<{ email: string }>) =>
      rows.map((row, index) => ({ id: `new-inv-${index}`, email: row.email }))
    );
    mocks.createOrganizationInviteAudits.mockResolvedValue([]);
    mocks.getOrgCourses.mockResolvedValue({ items: [] });
    mocks.getCohortsByOrg.mockResolvedValue([]);
    mocks.getOrgLearningPathsByIds.mockResolvedValue([]);
  });

  it('a course invite followed by a path invite leaves one invite with both', async () => {
    mocks.getActiveOrganizationInvitesByEmails.mockResolvedValue([
      activeInvite('old-inv-1', 'ada@test.dev', { courseIds: ['c-1'] })
    ]);
    mocks.getOrgLearningPathsByIds.mockResolvedValue([{ id: 'path-1', name: 'Path One' }]);

    const { invites, skipped } = await supersedeStudentOrgInvites(tx as never, {
      orgId: 'org-1',
      emails: ['ada@test.dev'],
      actorProfileId: 'admin-1',
      source: 'LEARNING_PATH_MANUAL_ADD',
      add: { courseIds: [], cohortIds: [], pathIds: ['path-1'] }
    });

    expect(skipped).toEqual([]);
    expect(invites).toHaveLength(1);
    expect(invites[0]).toMatchObject({
      email: 'ada@test.dev',
      courseIds: ['c-1'],
      pathIds: ['path-1'],
      merged: true
    });
    expect(invites[0].accessNamesLabel).toBe('Path One');
    expect(mocks.revokeOrganizationInvitesByIds).toHaveBeenCalledWith(['old-inv-1'], 'admin-1', tx);
    expect(mocks.createOrganizationInviteAudits).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ inviteId: 'old-inv-1', eventType: 'REVOKED', metadata: { mergedInto: 'new-inv-0' } }),
        expect.objectContaining({ inviteId: 'new-inv-0', eventType: 'CREATED' })
      ]),
      tx
    );
  });

  it('a TUTOR invite is untouched', async () => {
    mocks.getActiveOrganizationInvitesByEmails.mockResolvedValue([
      activeInvite('tutor-inv-1', 'tutor@test.dev', {}, ROLE.TUTOR)
    ]);

    const { invites, skipped } = await supersedeStudentOrgInvites(tx as never, {
      orgId: 'org-1',
      emails: ['tutor@test.dev'],
      actorProfileId: 'admin-1',
      source: 'AUDIENCE_IMPORT',
      add: { courseIds: ['c-1'], cohortIds: [], pathIds: [] }
    });

    expect(invites).toEqual([]);
    expect(skipped).toEqual([{ email: 'tutor@test.dev', reason: 'STAFF_INVITE' }]);
    expect(mocks.revokeOrganizationInvitesByIds).not.toHaveBeenCalled();
    expect(mocks.createOrganizationInvites).not.toHaveBeenCalled();
  });

  it("an expired invite isn't merged", async () => {
    // Expired invites never appear in the active set, so only the new ids land.
    mocks.getActiveOrganizationInvitesByEmails.mockResolvedValue([]);
    mocks.getOrgCourses.mockResolvedValue({ items: [{ id: 'c-new', title: 'New Course' }] });

    const { invites } = await supersedeStudentOrgInvites(tx as never, {
      orgId: 'org-1',
      emails: ['ada@test.dev'],
      actorProfileId: 'admin-1',
      source: 'AUDIENCE_IMPORT',
      add: { courseIds: ['c-new'], cohortIds: [], pathIds: [] }
    });

    expect(invites).toHaveLength(1);
    expect(invites[0]).toMatchObject({ courseIds: ['c-new'], merged: false });
    expect(mocks.revokeOrganizationInvitesByIds).not.toHaveBeenCalled();
  });
});
