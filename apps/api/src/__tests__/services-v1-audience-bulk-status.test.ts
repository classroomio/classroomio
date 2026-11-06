import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getBulkAudienceMemberIdsByEmails: vi.fn()
}));

vi.mock('@api/services/organization/audience-bulk', () => ({
  applyBulkAudienceAction: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getOrgAudience: vi.fn(),
  getOrgAudienceMember: vi.fn(),
  removeAudienceMember: vi.fn()
}));

vi.mock('@api/services/organization/audience', () => ({
  assignAudienceToCourses: vi.fn(),
  importAudienceMembers: vi.fn(),
  updatePendingAudienceMemberEmail: vi.fn()
}));

vi.mock('@api/services/account/profile', () => ({
  updateUser: vi.fn()
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { getBulkAudienceMemberIdsByEmails, getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { applyBulkAudienceAction } from '@api/services/organization/audience-bulk';
import { bulkUpdateAudienceStatusService } from '@api/services/v1/audience';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

const completed = (failed: [number, string][] = []) => ({
  mode: 'completed' as const,
  requested: 0,
  succeeded: 0,
  failed: failed.map(([memberId, reason]) => ({ memberId, reason })),
  undoToken: 'undo-1'
});

describe('bulkUpdateAudienceStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(applyBulkAudienceAction).mockResolvedValue(completed());
  });

  it('applies the action to the ids, as the key creator, and reports each id in order from the apply outcome', async () => {
    vi.mocked(applyBulkAudienceAction).mockResolvedValue(
      completed([
        [2, 'NOT_FOUND'],
        [3, 'ALREADY_IN_STATE']
      ])
    );

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'deactivate',
      memberIds: [1, 2, 3],
      reason: 'Missed payment',
      confirm: true
    });

    expect(applyBulkAudienceAction).toHaveBeenCalledWith(
      ORG_ID,
      { target: { mode: 'ids', memberIds: [1, 2, 3] }, action: 'deactivate', reason: 'Missed payment' },
      ACTOR_ID
    );
    expect(result).toEqual({
      action: 'deactivate',
      requested: 3,
      changed: 1,
      rows: [
        { index: 0, memberId: 1, email: null, status: 'changed' },
        { index: 1, memberId: null, email: null, status: 'not_found' },
        { index: 2, memberId: 3, email: null, status: 'already_in_state' }
      ]
    });
  });

  it('matches each email against both addresses of a member, so neither comes back not_found', async () => {
    vi.mocked(getBulkAudienceMemberIdsByEmails).mockResolvedValue([
      { id: 5, emails: ['invite@example.com', 'account@example.com'] }
    ]);

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'reactivate',
      emails: ['Invite@Example.com', 'account@example.com', 'gone@example.com'],
      confirm: true
    });

    expect(applyBulkAudienceAction).toHaveBeenCalledWith(
      ORG_ID,
      { target: { mode: 'ids', memberIds: [5] }, action: 'reactivate', reason: undefined },
      ACTOR_ID
    );
    expect(result.rows).toEqual([
      { index: 0, memberId: 5, email: 'Invite@Example.com', status: 'changed' },
      { index: 1, memberId: 5, email: 'account@example.com', status: 'changed' },
      { index: 2, memberId: null, email: 'gone@example.com', status: 'not_found' }
    ]);
  });

  it('acts on every member an email matches', async () => {
    vi.mocked(getBulkAudienceMemberIdsByEmails).mockResolvedValue([
      { id: 5, emails: ['pay@example.com'] },
      { id: 6, emails: ['pay@example.com'] }
    ]);
    vi.mocked(applyBulkAudienceAction).mockResolvedValue(completed([[5, 'ALREADY_IN_STATE']]));

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'archive',
      emails: ['pay@example.com'],
      confirm: true
    });

    expect(vi.mocked(applyBulkAudienceAction).mock.calls[0]![1].target).toEqual({ mode: 'ids', memberIds: [5, 6] });
    expect(result.rows).toEqual([{ index: 0, memberId: 6, email: 'pay@example.com', status: 'changed' }]);
  });

  it('reports not_found without applying anything when no email matches a student', async () => {
    vi.mocked(getBulkAudienceMemberIdsByEmails).mockResolvedValue([]);

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'archive',
      emails: ['nobody@example.com'],
      confirm: true
    });

    expect(applyBulkAudienceAction).not.toHaveBeenCalled();
    expect(result).toEqual({
      action: 'archive',
      requested: 1,
      changed: 0,
      rows: [{ index: 0, memberId: null, email: 'nobody@example.com', status: 'not_found' }]
    });
  });

  it('reports not_found when none of the ids is a student by the time it applies', async () => {
    vi.mocked(applyBulkAudienceAction).mockRejectedValue(
      new AppError('No matching learners to act on', ErrorCodes.ORG_AUDIENCE_BULK_FAILED, 404)
    );

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'deactivate',
      memberIds: [9],
      confirm: true
    });

    expect(result.rows).toEqual([{ index: 0, memberId: null, email: null, status: 'not_found' }]);
  });

  it('does not hand back the dashboard undo token', async () => {
    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'deactivate',
      memberIds: [1],
      confirm: true
    });

    expect(result).not.toHaveProperty('undoToken');
  });

  it('refuses a key creator who is not an org admin before changing anyone', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(
      bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, { action: 'deactivate', memberIds: [1], confirm: true })
    ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED });
    expect(applyBulkAudienceAction).not.toHaveBeenCalled();
  });

  it('refuses a key with no creator with 401', async () => {
    await expect(
      bulkUpdateAudienceStatusService(ORG_ID, null, { action: 'deactivate', memberIds: [1], confirm: true })
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(applyBulkAudienceAction).not.toHaveBeenCalled();
  });

  it('passes a plan-limit refusal through unchanged', async () => {
    vi.mocked(applyBulkAudienceAction).mockRejectedValue(
      new AppError('Student limit reached', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    await expect(
      bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, { action: 'unarchive', memberIds: [1], confirm: true })
    ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.UPGRADE_REQUIRED });
  });
});
