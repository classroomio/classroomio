import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn(),
  getBulkAudienceMembersByIds: vi.fn(),
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
import {
  getBulkAudienceMemberIdsByEmails,
  getBulkAudienceMembersByIds,
  getOrganizationMemberRoleId
} from '@cio/db/queries/organization';
import { applyBulkAudienceAction } from '@api/services/organization/audience-bulk';
import { bulkUpdateAudienceStatusService } from '@api/services/v1/audience';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

const member = (id: number) => ({ id, profileId: `profile-${id}`, email: `s${id}@example.com`, status: 'ACTIVE' });

const completed = (failed: number[] = []) => ({
  mode: 'completed' as const,
  requested: 0,
  succeeded: 0,
  failed: failed.map((memberId) => ({ memberId, reason: 'ALREADY_IN_STATE' })),
  undoToken: 'undo-1'
});

describe('bulkUpdateAudienceStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(applyBulkAudienceAction).mockResolvedValue(completed());
  });

  it('applies the action to the members found, as the key creator, and reports each id in order', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(3), member(1)] as never);
    vi.mocked(applyBulkAudienceAction).mockResolvedValue(completed([3]));

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'deactivate',
      memberIds: [1, 2, 3],
      reason: 'Missed payment',
      confirm: true
    });

    expect(applyBulkAudienceAction).toHaveBeenCalledWith(
      ORG_ID,
      { target: { mode: 'ids', memberIds: [1, 3] }, action: 'deactivate', reason: 'Missed payment' },
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

  it('matches emails without regard to case, acts on every member an email matches, and echoes the email sent', async () => {
    vi.mocked(getBulkAudienceMemberIdsByEmails).mockResolvedValue([
      { id: 5, matchedEmail: 'pay@example.com' },
      { id: 6, matchedEmail: 'pay@example.com' }
    ]);

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'reactivate',
      emails: ['Pay@Example.com', 'gone@example.com'],
      confirm: true
    });

    expect(getBulkAudienceMemberIdsByEmails).toHaveBeenCalledWith(ORG_ID, ['Pay@Example.com', 'gone@example.com']);
    expect(applyBulkAudienceAction).toHaveBeenCalledWith(
      ORG_ID,
      { target: { mode: 'ids', memberIds: [5, 6] }, action: 'reactivate', reason: undefined },
      ACTOR_ID
    );
    expect(result.rows).toEqual([
      { index: 0, memberId: 5, email: 'Pay@Example.com', status: 'changed' },
      { index: 1, memberId: null, email: 'gone@example.com', status: 'not_found' }
    ]);
  });

  it('changes nothing and reports not_found when no entry is a student of the organization', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([]);

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'archive',
      memberIds: [9],
      confirm: true
    });

    expect(applyBulkAudienceAction).not.toHaveBeenCalled();
    expect(result).toEqual({
      action: 'archive',
      requested: 1,
      changed: 0,
      rows: [{ index: 0, memberId: null, email: null, status: 'not_found' }]
    });
  });

  it('does not hand back the dashboard undo token', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1)] as never);

    const result = await bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, {
      action: 'deactivate',
      memberIds: [1],
      confirm: true
    });

    expect(result).not.toHaveProperty('undoToken');
  });

  it('refuses a key creator who is not an org admin before looking anyone up', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(
      bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, { action: 'deactivate', memberIds: [1], confirm: true })
    ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED });
    expect(getBulkAudienceMembersByIds).not.toHaveBeenCalled();
    expect(applyBulkAudienceAction).not.toHaveBeenCalled();
  });

  it('refuses a key with no creator with 401', async () => {
    await expect(
      bulkUpdateAudienceStatusService(ORG_ID, null, { action: 'deactivate', memberIds: [1], confirm: true })
    ).rejects.toBeInstanceOf(AppError);
    expect(applyBulkAudienceAction).not.toHaveBeenCalled();
  });

  it('passes a plan-limit refusal through unchanged', async () => {
    vi.mocked(getBulkAudienceMembersByIds).mockResolvedValue([member(1)] as never);
    vi.mocked(applyBulkAudienceAction).mockRejectedValue(
      new AppError('Student limit reached', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    await expect(
      bulkUpdateAudienceStatusService(ORG_ID, ACTOR_ID, { action: 'unarchive', memberIds: [1], confirm: true })
    ).rejects.toMatchObject({ statusCode: 403, code: ErrorCodes.UPGRADE_REQUIRED });
  });
});
