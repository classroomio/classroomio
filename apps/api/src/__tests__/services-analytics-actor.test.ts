import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { resolveAnalyticsActorForCreator } from '@api/services/analytics/actor';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const PROFILE_ID = '44444444-4444-4444-8444-444444444444';

describe('resolveAnalyticsActorForCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the actor from the creator live org role as admin', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);

    const actor = await resolveAnalyticsActorForCreator(ORG_ID, PROFILE_ID);

    expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
    expect(actor).toEqual({ profileId: PROFILE_ID, orgId: ORG_ID, orgRoles: { [ORG_ID]: ROLE.ADMIN } });
  });

  it('builds the actor from the creator live org role as tutor', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    const actor = await resolveAnalyticsActorForCreator(ORG_ID, PROFILE_ID);

    expect(actor.orgRoles).toEqual({ [ORG_ID]: ROLE.TUTOR });
  });

  it('throws 401 UNAUTHORIZED when the creator is no longer a member', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null);

    await expect(resolveAnalyticsActorForCreator(ORG_ID, PROFILE_ID)).rejects.toMatchObject({
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401
    });
  });

  it('reads the live role on every call, so a demoted creator loses admin scope between two calls', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValueOnce(ROLE.ADMIN).mockResolvedValueOnce(ROLE.TUTOR);

    const firstActor = await resolveAnalyticsActorForCreator(ORG_ID, PROFILE_ID);
    const secondActor = await resolveAnalyticsActorForCreator(ORG_ID, PROFILE_ID);

    expect(getOrganizationMemberRoleId).toHaveBeenCalledTimes(2);
    expect(firstActor.orgRoles).toEqual({ [ORG_ID]: ROLE.ADMIN });
    expect(secondActor.orgRoles).toEqual({ [ORG_ID]: ROLE.TUTOR });
  });
});
