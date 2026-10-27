import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lockOrganizationForUpdate: vi.fn(),
  getOrganizationTeamMemberById: vi.fn(),
  deleteOrganizationMember: vi.fn(),
  countOrganizationAdmins: vi.fn(),
  revokeActiveOrganizationInvitesByEmails: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn(),
  recordOrganizationInviteAudits: vi.fn()
}));

const TX = { tx: true };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));

vi.mock('@cio/db/queries/organization', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  lockOrganizationForUpdate: mocks.lockOrganizationForUpdate,
  getOrganizationTeamMemberById: mocks.getOrganizationTeamMemberById,
  deleteOrganizationMember: mocks.deleteOrganizationMember,
  countOrganizationAdmins: mocks.countOrganizationAdmins,
  revokeActiveOrganizationInvitesByEmails: mocks.revokeActiveOrganizationInvitesByEmails
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitOrganizationMemberWebhookEvent: mocks.emitOrganizationMemberWebhookEvent
}));

vi.mock('@api/services/organization/invite', () => ({
  inviteTeamMembers: vi.fn(),
  recordOrganizationInviteAudits: mocks.recordOrganizationInviteAudits
}));

import { ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { removeTeamMember } from '@api/services/organization';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const tutor = { id: 11, email: 'Tutor@example.com', verified: true, roleId: ROLE.TUTOR, profileId: 'profile-2' };

describe('removeTeamMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrganizationTeamMemberById.mockResolvedValue(tutor);
    mocks.deleteOrganizationMember.mockResolvedValue(tutor);
    mocks.countOrganizationAdmins.mockResolvedValue(1);
    mocks.revokeActiveOrganizationInvitesByEmails.mockResolvedValue([]);
  });

  it('removes a team member under the organization lock and revokes their invites after', async () => {
    await expect(removeTeamMember(ORG_ID, tutor.id, ACTOR_ID)).resolves.toEqual(tutor);

    expect(mocks.lockOrganizationForUpdate).toHaveBeenCalledWith(ORG_ID, TX);
    expect(mocks.deleteOrganizationMember).toHaveBeenCalledWith(ORG_ID, tutor.id, TX);
    expect(mocks.emitOrganizationMemberWebhookEvent).toHaveBeenCalledWith(
      'organization.member.removed',
      ORG_ID,
      tutor,
      ACTOR_ID
    );
    expect(mocks.revokeActiveOrganizationInvitesByEmails).toHaveBeenCalledWith(ORG_ID, ['tutor@example.com'], ACTOR_ID);
  });

  it('refuses to remove yourself and deletes nothing', async () => {
    mocks.getOrganizationTeamMemberById.mockResolvedValue({ ...tutor, roleId: ROLE.ADMIN, profileId: ACTOR_ID });

    await expect(removeTeamMember(ORG_ID, tutor.id, ACTOR_ID)).rejects.toMatchObject({
      statusCode: 400,
      code: ErrorCodes.ORG_TEAM_REMOVE_SELF
    });
    expect(mocks.deleteOrganizationMember).not.toHaveBeenCalled();
    expect(mocks.emitOrganizationMemberWebhookEvent).not.toHaveBeenCalled();
  });

  it('refuses to leave the organization with no admin and sends no webhook', async () => {
    mocks.countOrganizationAdmins.mockResolvedValue(0);

    await expect(removeTeamMember(ORG_ID, tutor.id, ACTOR_ID)).rejects.toMatchObject({
      statusCode: 400,
      code: ErrorCodes.ORG_TEAM_LAST_ADMIN
    });
    expect(mocks.countOrganizationAdmins).toHaveBeenCalledWith(ORG_ID, TX);
    expect(mocks.emitOrganizationMemberWebhookEvent).not.toHaveBeenCalled();
  });

  it('returns 404 for a student or unknown member id', async () => {
    mocks.getOrganizationTeamMemberById.mockResolvedValue(null);

    await expect(removeTeamMember(ORG_ID, 999, ACTOR_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.deleteOrganizationMember).not.toHaveBeenCalled();
  });
});
