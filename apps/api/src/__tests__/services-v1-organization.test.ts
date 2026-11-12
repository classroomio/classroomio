import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: vi.fn(),
  getOrganizationMemberRoleId: vi.fn()
}));
vi.mock('@api/services/organization', () => ({ updateOrg: vi.fn() }));

import { ROLE } from '@cio/utils/constants';
import { getOrganizationById, getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { updateOrg } from '@api/services/organization';
import {
  getPublicApiOrganizationService,
  updatePublicApiOrganizationService
} from '@api/services/v1/organization/organization';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

const storedOrg = {
  id: ORG_ID,
  name: 'Acme Academy',
  siteName: 'acme',
  avatarUrl: 'https://cdn.example.com/logo.png',
  theme: 'blue',
  customDomain: 'learn.acme.com',
  settings: { signup: { inviteOnly: true } },
  customization: { dashboard: { bannerText: 'hi' } }
};

const publicOrg = {
  id: ORG_ID,
  name: 'Acme Academy',
  siteName: 'acme',
  avatarUrl: 'https://cdn.example.com/logo.png',
  theme: 'blue'
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
  vi.mocked(getOrganizationById).mockResolvedValue(storedOrg as never);
  vi.mocked(updateOrg).mockImplementation(async (_orgId, data) => ({ ...storedOrg, ...data }) as never);
});

describe('who may call it', () => {
  const calls = {
    get: (actorId: string | null) => getPublicApiOrganizationService(ORG_ID, actorId),
    update: (actorId: string | null) => updatePublicApiOrganizationService(ORG_ID, actorId, { theme: 'rose' })
  };

  it.each(Object.entries(calls))('%s rejects a key with no actor with 401', async (_name, call) => {
    await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
  });

  it.each(Object.entries(calls))('%s rejects a tutor with 403, like orgAdminMiddleware', async (_name, call) => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(updateOrg).not.toHaveBeenCalled();
  });
});

describe('getPublicApiOrganizationService', () => {
  it('returns only the public fields', async () => {
    await expect(getPublicApiOrganizationService(ORG_ID, ACTOR_ID)).resolves.toEqual(publicOrg);
    expect(getOrganizationById).toHaveBeenCalledWith(ORG_ID);
  });

  it('returns 404 when the organization is gone', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue(null);

    await expect(getPublicApiOrganizationService(ORG_ID, ACTOR_ID)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updatePublicApiOrganizationService', () => {
  it('passes only the sent fields to the dashboard update and returns the public fields', async () => {
    const result = await updatePublicApiOrganizationService(ORG_ID, ACTOR_ID, { name: 'Acme School' });

    expect(updateOrg).toHaveBeenCalledWith(ORG_ID, { name: 'Acme School' });
    expect(result).toEqual({ ...publicOrg, name: 'Acme School' });
  });
});
