import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ env: { PUBLIC_IS_SELFHOSTED: 'false' }, tx: { name: 'tx' } }));

vi.mock('@cio/db/drizzle', () => ({ db: { transaction: vi.fn() } }));
vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationMemberRoleId: vi.fn(),
  lockOrganizationForUpdate: vi.fn()
}));
vi.mock('@api/services/organization', () => ({ updateOrg: vi.fn() }));
vi.mock('@cio/core/config/env', () => ({ env: mocks.env }));

import { PLAN } from '@cio/utils/plans';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import {
  getActiveOrganizationPlan,
  getOrganizationById,
  getOrganizationMemberRoleId,
  lockOrganizationForUpdate
} from '@cio/db/queries/organization';
import { updateOrg } from '@api/services/organization';
import {
  getPublicApiOrganizationCustomizationService,
  updatePublicApiOrganizationCustomizationService
} from '@api/services/v1/organization/customization';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const IMAGE = 'https://cdn.example.com/bg.png';

const DEFAULTS = {
  dashboard: { community: true, exercise: true, bannerImage: null, bannerText: '' },
  course: { newsfeed: true, grading: true },
  apps: { comments: true },
  auth: { backgroundImage: null }
};

const storedCustomization = {
  apps: { comments: false },
  course: { grading: false, newsfeed: true },
  dashboard: { exercise: false, community: true, bannerText: 'Welcome', bannerImage: 'https://cdn.example.com/b.png' },
  auth: { backgroundImage: IMAGE }
};

const mockStored = (customization: unknown) =>
  vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG_ID, customization } as never);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.env.PUBLIC_IS_SELFHOSTED = 'false';
  vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
  vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: PLAN.EARLY_ADOPTER } as never);
  vi.mocked(db.transaction).mockImplementation((async (callback: (tx: unknown) => unknown) =>
    callback(mocks.tx)) as never);
  mockStored(storedCustomization);
  vi.mocked(updateOrg).mockImplementation(async (_orgId, data) => ({ id: ORG_ID, ...data }) as never);
});

describe('who may call it', () => {
  const calls = {
    get: (actorId: string | null) => getPublicApiOrganizationCustomizationService(ORG_ID, actorId),
    update: (actorId: string | null) =>
      updatePublicApiOrganizationCustomizationService(ORG_ID, actorId, { apps: { comments: true } })
  };

  it.each(Object.entries(calls))('%s rejects a key with no actor with 401', async (_name, call) => {
    await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
  });

  it.each(Object.entries(calls))('%s rejects a tutor with 403', async (_name, call) => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(updateOrg).not.toHaveBeenCalled();
  });
});

describe('getPublicApiOrganizationCustomizationService', () => {
  it('returns the saved values', async () => {
    await expect(getPublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID)).resolves.toEqual(storedCustomization);
  });

  it.each([
    ['nothing saved', null],
    ['an empty object', {}],
    [
      'the column default without auth',
      {
        apps: { comments: true },
        course: { grading: true, newsfeed: true },
        dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
      }
    ]
  ])('fills in the defaults when %s', async (_label, stored) => {
    mockStored(stored);

    await expect(getPublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID)).resolves.toEqual(DEFAULTS);
  });

  it('fills in missing keys inside a section and drops keys it does not own', async () => {
    mockStored({ dashboard: { exercise: false }, apps: { comments: true, poll: true } });

    await expect(getPublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID)).resolves.toEqual({
      ...DEFAULTS,
      dashboard: { ...DEFAULTS.dashboard, exercise: false }
    });
  });

  it('returns 404 when the organization is gone', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue(null);

    await expect(getPublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID)).rejects.toMatchObject({
      statusCode: 404
    });
  });
});

describe('updatePublicApiOrganizationCustomizationService', () => {
  it('saves the whole customization so the fields not sent keep their values', async () => {
    const result = await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, {
      dashboard: { community: false }
    });

    expect(updateOrg).toHaveBeenCalledWith(
      ORG_ID,
      { customization: { ...storedCustomization, dashboard: { ...storedCustomization.dashboard, community: false } } },
      mocks.tx
    );
    expect(result).toEqual({
      ...storedCustomization,
      dashboard: { ...storedCustomization.dashboard, community: false }
    });
  });

  it('locks the organization row before reading, and reads and writes in the same transaction', async () => {
    await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { apps: { comments: true } });

    expect(lockOrganizationForUpdate).toHaveBeenCalledWith(ORG_ID, mocks.tx);
    expect(getOrganizationById).toHaveBeenCalledWith(ORG_ID, mocks.tx);
    expect(vi.mocked(lockOrganizationForUpdate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getOrganizationById).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(updateOrg).mock.calls[0][2]).toBe(mocks.tx);
  });

  it('merges into what the previous writer saved, not a value read before the lock', async () => {
    vi.mocked(lockOrganizationForUpdate).mockImplementation(async () => {
      mockStored({ ...storedCustomization, course: { grading: true, newsfeed: false } });
    });

    await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { dashboard: { community: false } });

    const saved = vi.mocked(updateOrg).mock.calls[0][1].customization;
    expect(saved?.course).toEqual({ grading: true, newsfeed: false });
    expect(saved?.dashboard.community).toBe(false);
  });

  it('fills in the defaults before saving an organization that never saved its customization', async () => {
    mockStored(null);

    await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { course: { grading: false } });

    expect(updateOrg).toHaveBeenCalledWith(
      ORG_ID,
      {
        customization: {
          apps: { comments: true },
          course: { grading: false, newsfeed: true },
          dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' },
          auth: { backgroundImage: '' }
        }
      },
      mocks.tx
    );
  });

  it('stores a null image as an empty string, the way the dashboard clears it', async () => {
    const result = await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, {
      dashboard: { bannerImage: null },
      auth: { backgroundImage: null }
    });

    const saved = vi.mocked(updateOrg).mock.calls[0][1].customization;
    expect(saved?.dashboard.bannerImage).toBe('');
    expect(saved?.auth?.backgroundImage).toBe('');
    expect(result.dashboard.bannerImage).toBeNull();
    expect(result.auth.backgroundImage).toBeNull();
  });

  describe('login background on the free plan', () => {
    beforeEach(() => {
      vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: PLAN.BASIC } as never);
    });

    it('refuses to set one with 403 UPGRADE_REQUIRED', async () => {
      await expect(
        updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { auth: { backgroundImage: IMAGE } })
      ).rejects.toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED' });
      expect(updateOrg).not.toHaveBeenCalled();
    });

    it('refuses an organization with no active plan', async () => {
      vi.mocked(getActiveOrganizationPlan).mockResolvedValue(null as never);

      await expect(
        updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { auth: { backgroundImage: IMAGE } })
      ).rejects.toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED' });
    });

    it('still lets the organization remove one', async () => {
      await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { auth: { backgroundImage: null } });

      expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
      expect(updateOrg).toHaveBeenCalled();
    });

    it('does not check the plan for the other fields', async () => {
      await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { dashboard: { bannerImage: IMAGE } });

      expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
      expect(updateOrg).toHaveBeenCalled();
    });

    it('allows it when self-hosted', async () => {
      mocks.env.PUBLIC_IS_SELFHOSTED = 'true';

      await updatePublicApiOrganizationCustomizationService(ORG_ID, ACTOR_ID, { auth: { backgroundImage: IMAGE } });

      expect(updateOrg).toHaveBeenCalled();
    });
  });
});
