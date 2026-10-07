import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const tx = { marker: 'tx' };

  return {
    tx,
    db: { transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) },
    queries: {
      activateOrganizationPlan: vi.fn(),
      cancelOrganizationPlan: vi.fn(),
      createEarlyAdopterClaim: vi.fn(),
      createOrganizationPlan: vi.fn(),
      getActiveOrganizationPlan: vi.fn(),
      getEarlyAdopterClaimBySubscriptionId: vi.fn(),
      getOrganizationMemberIdByOrgAndProfile: vi.fn(),
      getOrganizationPlanBySubscriptionId: vi.fn(),
      lockEarlyAdopterClaimByTokenHash: vi.fn(),
      markEarlyAdopterClaimClaimed: vi.fn(),
      updateOrganizationPlan: vi.fn(),
      updateUnclaimedEarlyAdopterClaim: vi.fn()
    },
    getAccountPrimary: vi.fn(),
    enqueueTransactionalEmail: vi.fn()
  };
});

vi.mock('@cio/db/drizzle', () => ({ db: mocks.db }));
vi.mock('@cio/db/queries/organization', () => mocks.queries);
vi.mock('@cio/db/queries/account', () => ({ getAccountPrimary: mocks.getAccountPrimary }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: mocks.enqueueTransactionalEmail }));
vi.mock('@cio/core/services/early-adopter/claim-token', () => ({
  deriveEarlyAdopterClaimToken: (subscriptionId: string) => `token-for-${subscriptionId}`,
  hashEarlyAdopterClaimToken: (token: string) => `hash-of-${token}`,
  buildEarlyAdopterClaimUrl: (token: string) => `https://app.test/claim/${token}`
}));

import { claimEarlyAdopterPlan, recordEarlyAdopterSubscriptionEvent } from '../early-adopter-claim';

const future = () => new Date(Date.now() + 60_000).toISOString();
const past = () => new Date(Date.now() - 60_000).toISOString();

const pendingClaim = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  status: 'pending',
  polarSubscriptionId: 'sub_1',
  expiresAt: future(),
  payload: { status: 'active', customer: { id: 'cus_1' } },
  claimedOrgId: null,
  ...overrides
});

describe('claimEarlyAdopterPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(pendingClaim());
    mocks.getAccountPrimary.mockResolvedValue({ id: 'org-primary' });
    mocks.queries.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(42);
    mocks.queries.getActiveOrganizationPlan.mockResolvedValue(null);
    mocks.queries.getOrganizationPlanBySubscriptionId.mockResolvedValue(null);
    mocks.queries.createOrganizationPlan.mockResolvedValue({ id: 1 });
    mocks.queries.markEarlyAdopterClaimClaimed.mockResolvedValue({ id: 7 });
  });

  it('creates the plan on the primary org and marks the claim, all on the transaction client', async () => {
    const result = await claimEarlyAdopterPlan('user-1', 'org-secondary', 'tok');

    expect(result).toEqual({ orgId: 'org-primary', planName: 'EARLY_ADOPTER' });
    expect(mocks.queries.lockEarlyAdopterClaimByTokenHash).toHaveBeenCalledWith('hash-of-tok', mocks.tx);
    expect(mocks.queries.createOrganizationPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org-primary',
        planName: 'EARLY_ADOPTER',
        subscriptionId: 'sub_1',
        triggeredBy: 42,
        provider: 'polar',
        isActive: true
      }),
      mocks.tx
    );
    expect(mocks.queries.markEarlyAdopterClaimClaimed).toHaveBeenCalledWith(
      7,
      { claimedOrgId: 'org-primary', claimedByProfileId: 'user-1' },
      mocks.tx
    );
  });

  it('rejects an unknown token with 404', async () => {
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(null);

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.queries.createOrganizationPlan).not.toHaveBeenCalled();
  });

  it('rejects an expired token with 410', async () => {
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(pendingClaim({ expiresAt: past() }));

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 410 });
    expect(mocks.queries.createOrganizationPlan).not.toHaveBeenCalled();
  });

  it('rejects a canceled purchase with 409', async () => {
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(pendingClaim({ status: 'canceled' }));

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a subscription that is no longer active with 409', async () => {
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(pendingClaim({ payload: { status: 'past_due' } }));

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('returns the same result when the same organization claims again', async () => {
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(
      pendingClaim({ status: 'claimed', claimedOrgId: 'org-primary' })
    );

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).resolves.toEqual({
      orgId: 'org-primary',
      planName: 'EARLY_ADOPTER'
    });
    expect(mocks.queries.createOrganizationPlan).not.toHaveBeenCalled();
  });

  it('rejects a claim already used by a different organization with 409', async () => {
    mocks.queries.lockEarlyAdopterClaimByTokenHash.mockResolvedValue(
      pendingClaim({ status: 'claimed', claimedOrgId: 'org-other' })
    );

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a user who is not a member of the primary org with 403', async () => {
    mocks.queries.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.queries.createOrganizationPlan).not.toHaveBeenCalled();
  });

  it('rejects an organization that already has a paid plan with 409', async () => {
    mocks.queries.getActiveOrganizationPlan.mockResolvedValue({ planName: 'ENTERPRISE' });

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.queries.createOrganizationPlan).not.toHaveBeenCalled();
  });

  it('allows an organization that only has the free Basic plan', async () => {
    mocks.queries.getActiveOrganizationPlan.mockResolvedValue({ planName: 'BASIC' });

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).resolves.toMatchObject({ orgId: 'org-primary' });
  });

  it('throws when the claim cannot be marked, so the transaction rolls back the new plan', async () => {
    mocks.queries.markEarlyAdopterClaimClaimed.mockResolvedValue(null);

    await expect(claimEarlyAdopterPlan('user-1', 'org-1', 'tok')).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.queries.createOrganizationPlan).toHaveBeenCalledTimes(1);
  });

  it('does not create a second plan row when one already exists for the subscription', async () => {
    mocks.queries.getOrganizationPlanBySubscriptionId.mockResolvedValue({ id: 99 });

    await claimEarlyAdopterPlan('user-1', 'org-1', 'tok');

    expect(mocks.queries.createOrganizationPlan).not.toHaveBeenCalled();
    expect(mocks.queries.markEarlyAdopterClaimClaimed).toHaveBeenCalled();
  });
});

describe('recordEarlyAdopterSubscriptionEvent', () => {
  const event = {
    event: 'activated' as const,
    subscriptionId: 'sub_1',
    customerId: 'cus_1',
    customerEmail: 'buyer@example.com',
    checkoutId: 'chk_1',
    payload: { status: 'active' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queries.getEarlyAdopterClaimBySubscriptionId.mockResolvedValue(null);
    mocks.queries.getOrganizationPlanBySubscriptionId.mockResolvedValue(null);
    mocks.queries.createEarlyAdopterClaim.mockResolvedValue({ id: 1 });
    mocks.enqueueTransactionalEmail.mockResolvedValue({ jobIds: ['job-1'] });
  });

  it('stores only the token hash and emails the buyer a claim link', async () => {
    await recordEarlyAdopterSubscriptionEvent(event);

    expect(mocks.queries.createEarlyAdopterClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: 'hash-of-token-for-sub_1',
        polarSubscriptionId: 'sub_1',
        email: 'buyer@example.com'
      })
    );
    expect(mocks.queries.createEarlyAdopterClaim.mock.calls[0][0]).not.toHaveProperty('token');
    expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith('earlyAdopterReady', {
      to: 'buyer@example.com',
      fields: { claimUrl: 'https://app.test/claim/token-for-sub_1' },
      idempotencyKey: 'early-adopter-ready:sub_1'
    });
  });

  it('sends no second email when the purchase was already recorded concurrently', async () => {
    mocks.queries.createEarlyAdopterClaim.mockResolvedValue(null);

    await recordEarlyAdopterSubscriptionEvent(event);

    expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('only refreshes the payload for a pending claim on a repeated activation', async () => {
    mocks.queries.getEarlyAdopterClaimBySubscriptionId.mockResolvedValue({ status: 'pending' });

    await recordEarlyAdopterSubscriptionEvent(event);

    expect(mocks.queries.updateUnclaimedEarlyAdopterClaim).toHaveBeenCalledWith('sub_1', {
      status: 'pending',
      payload: event.payload
    });
    expect(mocks.queries.createEarlyAdopterClaim).not.toHaveBeenCalled();
    expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('marks a pending claim canceled when the subscription is revoked', async () => {
    mocks.queries.getEarlyAdopterClaimBySubscriptionId.mockResolvedValue({ status: 'pending' });

    await recordEarlyAdopterSubscriptionEvent({ ...event, event: 'revoked' });

    expect(mocks.queries.updateUnclaimedEarlyAdopterClaim).toHaveBeenCalledWith('sub_1', {
      status: 'canceled',
      payload: event.payload
    });
  });

  it('forwards events for a claimed purchase to the organization plan', async () => {
    mocks.queries.getEarlyAdopterClaimBySubscriptionId.mockResolvedValue({ status: 'claimed' });

    await recordEarlyAdopterSubscriptionEvent({ ...event, event: 'activated' });
    await recordEarlyAdopterSubscriptionEvent({ ...event, event: 'updated' });
    await recordEarlyAdopterSubscriptionEvent({ ...event, event: 'revoked' });

    expect(mocks.queries.activateOrganizationPlan).toHaveBeenCalledWith('sub_1', event.payload);
    expect(mocks.queries.updateOrganizationPlan).toHaveBeenCalledWith('sub_1', { payload: event.payload });
    expect(mocks.queries.cancelOrganizationPlan).toHaveBeenCalledWith('sub_1', event.payload);
  });

  it('ignores a non-activation event for a purchase it has never seen', async () => {
    await recordEarlyAdopterSubscriptionEvent({ ...event, event: 'updated' });

    expect(mocks.queries.createEarlyAdopterClaim).not.toHaveBeenCalled();
    expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it('does nothing when a plan already exists for the subscription', async () => {
    mocks.queries.getOrganizationPlanBySubscriptionId.mockResolvedValue({ id: 5 });

    await recordEarlyAdopterSubscriptionEvent(event);

    expect(mocks.queries.createEarlyAdopterClaim).not.toHaveBeenCalled();
  });
});
