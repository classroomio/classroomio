import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getEarnedCertificates: vi.fn(),
  orgHasCertificatesEnabled: vi.fn()
}));

vi.mock('@cio/db/queries/certificates', () => ({
  getEarnedCertificates: mocks.getEarnedCertificates
}));

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
  });

  it.each([
    ['includes path certificates when the plan has certificates', true],
    ['leaves out path certificates when the plan has none', false]
  ])('%s', async (_label, planAllows) => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(planAllows);

    await getUserEarnedCertificates('org-1', 'ada', query);

    expect(mocks.orgHasCertificatesEnabled).toHaveBeenCalledWith('org-1');
    expect(mocks.getEarnedCertificates).toHaveBeenCalledWith({
      orgId: 'org-1',
      profileId: 'ada',
      includePathCertificates: planAllows,
      ...query
    });
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
