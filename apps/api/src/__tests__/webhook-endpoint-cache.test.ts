import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.REDIS_URL = 'redis://localhost:6379';
});

const mocks = vi.hoisted(() => ({
  orgHasActiveWebhookEndpoint: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  get: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => ({ orgHasActiveWebhookEndpoint: mocks.orgHasActiveWebhookEndpoint }));

vi.mock('@cio/core/utils/redis/redis', () => ({
  logRedisUnavailableOnce: vi.fn(),
  redis: { isReady: true, setEx: mocks.setEx, del: mocks.del, get: mocks.get }
}));

import { readOrgHasWebhookEndpoints, refreshOrgHasWebhookEndpoints } from '@cio/core/services/webhook/endpoint-cache';

const orgId = '22222222-2222-4222-8222-222222222222';

describe('webhook endpoint cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the answer for five minutes', async () => {
    mocks.orgHasActiveWebhookEndpoint.mockResolvedValue(true);

    await refreshOrgHasWebhookEndpoints(orgId);

    expect(mocks.setEx).toHaveBeenCalledWith(`webhook:has-endpoints:v1:${orgId}`, 300, '1');
  });

  it('stores the real answer after a change instead of only dropping the old one', async () => {
    mocks.orgHasActiveWebhookEndpoint.mockResolvedValue(false);

    await refreshOrgHasWebhookEndpoints(orgId);

    expect(mocks.setEx).toHaveBeenCalledWith(`webhook:has-endpoints:v1:${orgId}`, 300, '0');
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it('drops the cached answer when the real answer cannot be read', async () => {
    mocks.orgHasActiveWebhookEndpoint.mockRejectedValue(new Error('db down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await refreshOrgHasWebhookEndpoints(orgId);

    expect(mocks.del).toHaveBeenCalledWith(`webhook:has-endpoints:v1:${orgId}`);
    expect(mocks.setEx).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reads a stored answer back', async () => {
    mocks.get.mockResolvedValue('0');

    await expect(readOrgHasWebhookEndpoints(orgId)).resolves.toBe(false);

    mocks.get.mockResolvedValue(null);

    await expect(readOrgHasWebhookEndpoints(orgId)).resolves.toBeNull();
  });
});
