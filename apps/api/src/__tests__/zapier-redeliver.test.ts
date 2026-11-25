import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.PUBLIC_IS_SELFHOSTED = 'false';
});

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  listOAuthConnectedApps: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseTitlesByIds: vi.fn()
}));

vi.mock('@cio/db/queries/cohort/cohort', () => ({
  getCohortTitlesByIds: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run({})) }
}));

vi.mock('@cio/db/queries/webhook', () => ({
  getManagedWebhookEndpoint: vi.fn(),
  listFailedWebhookDeliveriesSince: vi.fn(),
  listManagedWebhookSubscriptions: vi.fn(),
  requeueWebhookDelivery: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  enqueueWebhookDelivery: vi.fn()
}));

vi.mock('@api/services/oauth/clients', () => ({
  getZapierOAuthClientId: vi.fn(() => 'zapier-client')
}));

import { listOAuthConnectedApps } from '@cio/db/queries/auth';
import {
  getManagedWebhookEndpoint,
  listFailedWebhookDeliveriesSince,
  requeueWebhookDelivery,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import { enqueueWebhookDelivery } from '@cio/jobs';
import { getZapierOAuthClientId } from '@api/services/oauth/clients';
import {
  redeliverZapierTriggerFailuresBulkService,
  redeliverZapierTriggerFailuresService
} from '@api/services/organization/zapier';

const orgId = '22222222-2222-4222-8222-222222222222';
const webhookId = '11111111-1111-4111-8111-111111111111';

function buildManagedEndpoint(overrides: Partial<TWebhookEndpointWithEvents> = {}): TWebhookEndpointWithEvents {
  return {
    id: webhookId,
    organizationId: orgId,
    name: 'Zapier',
    payloadUrl: 'https://hooks.zapier.com/hooks/catch/1/abc',
    secretCiphertext: 'cipher',
    secretLast4: 'abcd',
    verifySsl: true,
    eventMode: 'all',
    isActive: true,
    consecutiveFailures: 0,
    autoDisabledAt: null,
    disabledReason: null,
    oauthConsentId: 'consent-1',
    lastDeliveryStatus: null,
    lastDeliveryAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventTypes: ['course.completed'],
    ...overrides
  } as TWebhookEndpointWithEvents;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listOAuthConnectedApps).mockResolvedValue([{ consentId: 'consent-1', clientId: 'zapier-client' } as never]);
  vi.mocked(getManagedWebhookEndpoint).mockResolvedValue(buildManagedEndpoint());
  vi.mocked(listFailedWebhookDeliveriesSince).mockResolvedValue([{ id: 'whd_1' }, { id: 'whd_2' }]);
  vi.mocked(requeueWebhookDelivery).mockResolvedValue({} as never);
});

describe('redeliverZapierTriggerFailuresService', () => {
  it('requeues the last 24 hours of failed deliveries and wakes the worker once', async () => {
    const result = await redeliverZapierTriggerFailuresService(orgId, webhookId);

    expect(result).toEqual({ redelivered: 2 });
    expect(listOAuthConnectedApps).toHaveBeenCalledWith(orgId, { clientId: 'zapier-client' });
    expect(requeueWebhookDelivery).toHaveBeenCalledWith(webhookId, 'whd_1', expect.anything());
    expect(requeueWebhookDelivery).toHaveBeenCalledWith(webhookId, 'whd_2', expect.anything());
    expect(enqueueWebhookDelivery).toHaveBeenCalledTimes(1);
    expect(enqueueWebhookDelivery).toHaveBeenCalledWith({ webhookId });

    const since = vi.mocked(listFailedWebhookDeliveriesSince).mock.calls[0][1];
    expect(since.getTime()).toBeGreaterThan(Date.now() - 24 * 60 * 60 * 1000 - 5_000);
  });

  it('does not enqueue when nothing failed', async () => {
    vi.mocked(listFailedWebhookDeliveriesSince).mockResolvedValue([]);

    const result = await redeliverZapierTriggerFailuresService(orgId, webhookId);

    expect(result).toEqual({ redelivered: 0 });
    expect(enqueueWebhookDelivery).not.toHaveBeenCalled();
  });

  it('rejects endpoints that are not Zapier-managed', async () => {
    vi.mocked(getManagedWebhookEndpoint).mockResolvedValue(null);

    await expect(redeliverZapierTriggerFailuresService(orgId, webhookId)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(requeueWebhookDelivery).not.toHaveBeenCalled();
  });

  it('rejects an endpoint whose consent is not a Zapier grant', async () => {
    vi.mocked(listOAuthConnectedApps).mockResolvedValue([]);

    await expect(redeliverZapierTriggerFailuresService(orgId, webhookId)).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('rejects every trigger when no Zapier client is configured', async () => {
    vi.mocked(getZapierOAuthClientId).mockReturnValueOnce(null);

    await expect(redeliverZapierTriggerFailuresService(orgId, webhookId)).rejects.toMatchObject({
      statusCode: 404
    });
    expect(listOAuthConnectedApps).not.toHaveBeenCalled();
  });

  it('rejects a disabled trigger', async () => {
    vi.mocked(getManagedWebhookEndpoint).mockResolvedValue(buildManagedEndpoint({ isActive: false }));

    await expect(redeliverZapierTriggerFailuresService(orgId, webhookId)).rejects.toMatchObject({
      statusCode: 409
    });
  });
});

describe('redeliverZapierTriggerFailuresBulkService', () => {
  const secondWebhookId = '22222222-2222-4222-8222-222222222222';

  it('sums redeliveries and reports triggers that cannot be retried', async () => {
    vi.mocked(getManagedWebhookEndpoint).mockImplementation(async (_orgId, id) => {
      if (id === webhookId) return buildManagedEndpoint();
      if (id === secondWebhookId) return buildManagedEndpoint({ id: secondWebhookId, isActive: false });

      return null;
    });
    vi.mocked(listFailedWebhookDeliveriesSince).mockResolvedValue([{ id: 'whd_1' }]);

    const result = await redeliverZapierTriggerFailuresBulkService(orgId, [
      webhookId,
      secondWebhookId,
      'missing-trigger-id'
    ]);

    expect(result.redelivered).toBe(1);
    expect(result.failed.map((failure) => failure.triggerId).sort()).toEqual([secondWebhookId, 'missing-trigger-id']);
    expect(requeueWebhookDelivery).toHaveBeenCalledTimes(1);
  });

  it('dedupes repeated trigger ids', async () => {
    vi.mocked(listFailedWebhookDeliveriesSince).mockResolvedValue([{ id: 'whd_1' }]);

    const result = await redeliverZapierTriggerFailuresBulkService(orgId, [webhookId, webhookId]);

    expect(result).toEqual({ redelivered: 1, failed: [] });
    expect(requeueWebhookDelivery).toHaveBeenCalledTimes(1);
  });
});
