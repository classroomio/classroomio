import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getEarnedCertificates: vi.fn(),
  getActiveOrganizationMemberIdByOrgAndProfile: vi.fn(),
  orgHasCertificatesEnabled: vi.fn()
}));

vi.mock('@cio/db/queries/certificates', () => ({
  getEarnedCertificates: mocks.getEarnedCertificates
}));

vi.mock('@cio/db/queries/organization', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/db/queries/organization')>();

  return {
    ...actual,
    getActiveOrganizationMemberIdByOrgAndProfile: mocks.getActiveOrganizationMemberIdByOrgAndProfile
  };
});

vi.mock('@api/utils/plan-features', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/utils/plan-features')>();

  return { ...actual, orgHasCertificatesEnabled: mocks.orgHasCertificatesEnabled };
});

import { getUserEarnedCertificates } from '../organization';

const query = { page: 2, limit: 12, search: 'data' };

describe('getUserEarnedCertificates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEarnedCertificates.mockResolvedValue({ items: [], total: 0 });
    mocks.getActiveOrganizationMemberIdByOrgAndProfile.mockResolvedValue(7);
  });

  it('reads the certificates, telling the query whether the plan includes certificates', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);

    await getUserEarnedCertificates('org-1', 'ada', query);

    expect(mocks.orgHasCertificatesEnabled).toHaveBeenCalledWith('org-1');
    expect(mocks.getEarnedCertificates).toHaveBeenCalledWith({
      orgId: 'org-1',
      profileId: 'ada',
      certificatesEnabled: true,
      ...query
    });
  });

  it('still lists completed rows with nothing downloadable when the plan has none', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(false);

    await getUserEarnedCertificates('org-1', 'ada', query);

    expect(mocks.getEarnedCertificates).toHaveBeenCalledWith({
      orgId: 'org-1',
      profileId: 'ada',
      certificatesEnabled: false,
      ...query
    });
  });

  it('refuses with 403, without reading certificates, once the org membership is deactivated', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.getActiveOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);

    await expect(getUserEarnedCertificates('org-1', 'ada', query)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 403
    });
    expect(mocks.getActiveOrganizationMemberIdByOrgAndProfile).toHaveBeenCalledWith('org-1', 'ada');
    expect(mocks.getEarnedCertificates).not.toHaveBeenCalled();
  });

  it('turns a rejected query into an AppError with CERTIFICATES_FETCH_FAILED', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.getEarnedCertificates.mockRejectedValueOnce(new Error('db down'));

    await expect(getUserEarnedCertificates('org-1', 'ada', query)).rejects.toMatchObject({
      code: 'CERTIFICATES_FETCH_FAILED',
      statusCode: 500
    });
  });
});
