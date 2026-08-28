import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  createOrganizationMember: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/organization/invite', () => ({
  getActivePendingOrgInviteForEmail: vi.fn(),
  selectOrganizationMemberByOrgAndNormalizedEmail: vi.fn(),
  updateOrganizationMemberById: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: {}
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

import { joinOrganization } from '@api/services/organization/join';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { env } from '@cio/core/config/env';
import { getProfileById } from '@cio/db/queries/auth';
import {
  createOrganizationMember,
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile
} from '@cio/db/queries/organization';
import {
  getActivePendingOrgInviteForEmail,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  updateOrganizationMemberById
} from '@cio/db/queries/organization/invite';
import { ROLE } from '@cio/utils/constants';

const USER_ID = 'user-1';
const ORG_ID = 'org-1';

describe('joinOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.PUBLIC_IS_SELFHOSTED = 'false';
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);
    vi.mocked(getProfileById).mockResolvedValue({ id: USER_ID, email: 'Learner@Example.com' } as never);
    vi.mocked(getActivePendingOrgInviteForEmail).mockResolvedValue(null);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: false,
      settings: {}
    } as never);
  });

  it('rejects Join Academy on self-hosted instances', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(createOrganizationMember).not.toHaveBeenCalled();
  });

  it('does not change an existing membership', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(1);

    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(result).toEqual({ alreadyMember: true, linkedExistingMember: false });
    expect(createOrganizationMember).not.toHaveBeenCalled();
  });

  it('returns a pending invite instead of creating a student membership', async () => {
    vi.mocked(getActivePendingOrgInviteForEmail).mockResolvedValue({ id: 'invite-1' } as never);

    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(result.pendingInvite).toBe(true);
    expect(createOrganizationMember).not.toHaveBeenCalled();
  });

  it('links an email-only roster row without changing its role', async () => {
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
      id: 'member-1',
      profileId: null,
      roleId: ROLE.TUTOR
    } as never);

    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(updateOrganizationMemberById).toHaveBeenCalledWith(
      expect.anything(),
      'member-1',
      expect.objectContaining({
        profileId: USER_ID,
        email: 'learner@example.com',
        verified: true
      })
    );
    expect(result).toEqual({ alreadyMember: true, linkedExistingMember: true });
    expect(createOrganizationMember).not.toHaveBeenCalled();
  });

  it('rejects joins when public signup is disabled', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: true,
      settings: {}
    } as never);

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(createOrganizationMember).not.toHaveBeenCalled();
  });

  it('rejects joins when the academy is invite-only', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: false,
      settings: { signup: { inviteOnly: true } }
    } as never);

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(createOrganizationMember).not.toHaveBeenCalled();
  });

  it('creates a student membership for an open academy', async () => {
    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(assertStudentCapacityOrThrow).toHaveBeenCalledWith(ORG_ID, 1);
    expect(createOrganizationMember).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      profileId: USER_ID,
      email: 'learner@example.com',
      roleId: ROLE.STUDENT,
      verified: true
    });
    expect(result).toEqual({ alreadyMember: false, linkedExistingMember: false });
  });
});
