import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries', () => ({
  checkSiteNameExists: vi.fn(),
  createOrganization: vi.fn(),
  createOrganizationMember: vi.fn(),
  createOrganizationPlan: vi.fn(),
  getOrganizationByProfileId: vi.fn(),
  getOrganizationCount: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn(),
  updateProfile: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn()
  }
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

import { createOrganizationWithOwner } from '@api/services/onboarding';
import {
  checkSiteNameExists,
  createOrganization,
  createOrganizationMember,
  getOrganizationByProfileId
} from '@cio/db/queries';
import { db } from '@cio/db/drizzle';

const PROFILE_ID = 'profile-1';
const ORGANIZATION_ID = 'organization-1';

describe('createOrganizationWithOwner', () => {
  const transactionClient = { transaction: true };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkSiteNameExists).mockResolvedValue(false);
    vi.mocked(createOrganization).mockResolvedValue({ id: ORGANIZATION_ID } as never);
    vi.mocked(createOrganizationMember).mockResolvedValue({ id: 1 } as never);
    vi.mocked(db.transaction).mockImplementation(async (callback) => callback(transactionClient as never));
  });

  it('reads the updated organization list inside the creation transaction', async () => {
    const organizations = [{ id: ORGANIZATION_ID }];
    vi.mocked(getOrganizationByProfileId).mockResolvedValue(organizations as never);

    const result = await createOrganizationWithOwner(PROFILE_ID, {
      orgName: 'Test organization',
      siteName: 'test-organization'
    });

    expect(getOrganizationByProfileId).toHaveBeenCalledWith(PROFILE_ID, transactionClient);
    expect(result.organizations).toBe(organizations);
  });

  it('rejects the transaction when reading the updated organization list fails', async () => {
    vi.mocked(getOrganizationByProfileId).mockRejectedValue(new Error('Read failed'));

    await expect(
      createOrganizationWithOwner(PROFILE_ID, {
        orgName: 'Test organization',
        siteName: 'test-organization'
      })
    ).rejects.toMatchObject({ statusCode: 500 });

    expect(db.transaction).toHaveBeenCalledOnce();
    expect(getOrganizationByProfileId).toHaveBeenCalledWith(PROFILE_ID, transactionClient);
  });
});
