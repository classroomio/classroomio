import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

vi.mock('@cio/db/queries/organization/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

vi.mock('@cio/core/services/license', () => ({
  isFeatureLicensed: vi.fn()
}));

vi.mock('@cio/core/services/activity/providers', () => ({
  ACTIVITY_PROVIDERS: { scorm: { kind: 'scorm', licenseFeature: 'scorm' } }
}));

import { env } from '@cio/core/config/env';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization/organization';
import { isFeatureLicensed } from '@cio/core/services/license';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertActivityKindAllowed } from '@api/services/activity/plan';

const mockedPlan = vi.mocked(getActiveOrganizationPlan);
const mockedLicensed = vi.mocked(isFeatureLicensed);

async function expectRejection(promise: Promise<void>, code: string, statusCode: number) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    expect((error as AppError).statusCode).toBe(statusCode);
    return;
  }

  throw new Error(`Expected rejection with ${code}`);
}

describe('assertActivityKindAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (env as { PUBLIC_IS_SELFHOSTED?: string }).PUBLIC_IS_SELFHOSTED = 'false';
  });

  it('allows paid cloud plans', async () => {
    mockedPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' } as never);
    await assertActivityKindAllowed('org-1', 'scorm');

    mockedPlan.mockResolvedValue({ planName: 'ENTERPRISE' } as never);
    await assertActivityKindAllowed('org-1', 'scorm');
    expect(mockedLicensed).not.toHaveBeenCalled();
  });

  it('refuses the Basic cloud plan with UPGRADE_REQUIRED', async () => {
    mockedPlan.mockResolvedValue({ planName: 'BASIC' } as never);
    await expectRejection(assertActivityKindAllowed('org-1', 'scorm'), ErrorCodes.UPGRADE_REQUIRED, 403);
  });

  it('refuses a missing cloud plan with UPGRADE_REQUIRED', async () => {
    mockedPlan.mockResolvedValue(null);
    await expectRejection(assertActivityKindAllowed('org-1', 'scorm'), ErrorCodes.UPGRADE_REQUIRED, 403);
  });

  it('checks the license on self-hosted without reading the plan', async () => {
    (env as { PUBLIC_IS_SELFHOSTED?: string }).PUBLIC_IS_SELFHOSTED = 'true';
    mockedLicensed.mockResolvedValue(true);
    await assertActivityKindAllowed('org-1', 'scorm');

    expect(mockedLicensed).toHaveBeenCalledWith('scorm');
    expect(mockedPlan).not.toHaveBeenCalled();
  });

  it('refuses an unlicensed self-hosted server with FEATURE_REQUIRES_LICENSE', async () => {
    (env as { PUBLIC_IS_SELFHOSTED?: string }).PUBLIC_IS_SELFHOSTED = 'true';
    mockedLicensed.mockResolvedValue(false);
    await expectRejection(assertActivityKindAllowed('org-1', 'scorm'), ErrorCodes.FEATURE_REQUIRES_LICENSE, 403);
  });
});
