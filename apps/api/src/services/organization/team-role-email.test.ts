import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({ getOrganizationById: vi.fn() }));
vi.mock('@cio/db/queries/auth/profile', () => ({ getProfileById: vi.fn() }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getAppBaseUrl: () => 'https://app.test' }));

import { sendTeamRoleChangedEmail } from './team-role-email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { getOrganizationById } from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth/profile';
import { ROLE } from '@cio/utils/constants';

const notice = {
  orgId: 'org-1',
  memberEmail: null,
  memberProfileId: 'member-1',
  previousRoleId: ROLE.TUTOR,
  roleId: ROLE.ADMIN,
  actorProfileId: 'actor-1'
};

describe('sendTeamRoleChangedEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationById).mockResolvedValue({ id: 'org-1', name: 'Acme', siteName: 'acme' } as never);
    vi.mocked(getProfileById).mockImplementation(
      async (id: string) =>
        (id === 'member-1'
          ? { id, email: 'tutor@acme.test', fullname: 'Tia Tutor' }
          : { id, email: 'boss@acme.test', fullname: 'Ada Admin' }) as never
    );
  });

  it('falls back to the profile email and names both roles and the actor', async () => {
    await sendTeamRoleChangedEmail(notice);

    expect(enqueueTransactionalEmail).toHaveBeenCalledWith(
      'teamRoleChanged',
      expect.objectContaining({
        to: 'tutor@acme.test',
        fields: expect.objectContaining({
          name: 'Tia Tutor',
          orgName: 'Acme',
          previousRoleName: 'tutor',
          newRoleName: 'admin',
          changedByName: 'Ada Admin',
          dashboardUrl: 'https://app.test'
        })
      })
    );
  });

  it('sends nothing to a member who has not joined yet', async () => {
    await sendTeamRoleChangedEmail({ ...notice, memberEmail: 'pending@acme.test', memberProfileId: null });

    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('sends nothing when no email can be found', async () => {
    vi.mocked(getProfileById).mockResolvedValue({ id: 'member-1', email: null } as never);

    await sendTeamRoleChangedEmail(notice);

    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('never throws when queueing fails', async () => {
    vi.mocked(enqueueTransactionalEmail).mockRejectedValue(new Error('redis down'));

    await expect(sendTeamRoleChangedEmail(notice)).resolves.toBeUndefined();
  });
});
