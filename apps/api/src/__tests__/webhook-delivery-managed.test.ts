import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.PUBLIC_IS_SELFHOSTED = 'true';
  process.env.WEBHOOK_ALLOW_PRIVATE_NETWORKS = 'true';
});

const queries = vi.hoisted(() => ({
  claimNextDueWebhookDelivery: vi.fn(),
  deleteManagedWebhookSubscriptionById: vi.fn(),
  getEarliestPendingWebhookAttemptAt: vi.fn().mockResolvedValue(null),
  getWebhookEndpointById: vi.fn(),
  isManagedWebhookSubscriptionGrantActive: vi.fn().mockResolvedValue(true),
  recordWebhookAttempt: vi.fn().mockResolvedValue(null),
  getOrganizationById: vi.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org', siteName: 'test' }),
  getOrganizationAdminEmails: vi.fn().mockResolvedValue(['admin@test.com'])
}));

const cache = vi.hoisted(() => ({
  refreshOrgHasWebhookEndpoints: vi.fn()
}));

const jobs = vi.hoisted(() => ({
  withRedisLock: vi
    .fn()
    .mockImplementation((_key, _ttl, fn) => fn().then((val: unknown) => ({ acquired: true, value: val }))),
  enqueueWebhookDelivery: vi.fn(),
  enqueueEmailSend: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => queries);
vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: queries.getOrganizationById,
  getOrganizationAdminEmails: queries.getOrganizationAdminEmails
}));
vi.mock('@cio/core/services/webhook/endpoint-cache', () => cache);
vi.mock('@cio/core/services/webhook/entitlement', () => ({
  hasWebhookEntitlement: vi.fn().mockResolvedValue(true)
}));
vi.mock('@cio/jobs', () => jobs);

import { processWebhookEndpoint } from '@cio/core/services/webhook/deliver';
import { notifyWebhookHealthChange } from '@cio/core/services/webhook/health';
import { encryptWebhookSecret } from '@cio/core/services/webhook/secret';
import type { TWebhookDelivery, TWebhookEndpoint, TWebhookEvent } from '@cio/db/types';

let server: http.Server;
let baseUrl: string;

const SECRET = 'whsec_test_secret_for_managed_endpoints';

function buildEndpoint(isManaged: boolean): TWebhookEndpoint {
  return {
    id: isManaged ? 'managed-endpoint-1' : 'customer-endpoint-1',
    organizationId: 'org-1',
    name: isManaged ? 'Zapier · course.completed' : 'Customer Endpoint',
    payloadUrl: `${baseUrl}/gone`,
    secretCiphertext: encryptWebhookSecret(SECRET),
    secretLast4: SECRET.slice(-4),
    verifySsl: true,
    eventMode: 'selected',
    isActive: true,
    consecutiveFailures: 0,
    autoDisabledAt: null,
    lastDeliveryStatus: null,
    lastDeliveryAt: null,
    createdByProfileId: null,
    updatedByProfileId: null,
    oauthConsentId: isManaged ? 'consent-1' : null,
    filterCourseId: null,
    filterCohortId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const event: TWebhookEvent = {
  id: 'evt_1',
  organizationId: 'org-1',
  eventType: 'course.completed',
  payload: { id: 'evt_1', type: 'course.completed', data: {} },
  createdAt: new Date().toISOString()
};

const delivery: TWebhookDelivery = {
  id: 'whd_1',
  webhookId: 'managed-endpoint-1',
  eventId: 'evt_1',
  attempt: 0,
  isTest: false,
  status: 'PENDING',
  nextAttemptAt: new Date().toISOString(),
  requestHeaders: null,
  responseStatus: null,
  responseBody: null,
  errorMessage: null,
  durationMs: null,
  deliveredAt: null,
  createdAt: new Date().toISOString()
};

beforeAll(async () => {
  server = http.createServer((_request, response) => {
    response.statusCode = 410;
    response.end('Gone');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('managed webhook delivery 410 cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queries.claimNextDueWebhookDelivery.mockReset();
    queries.getEarliestPendingWebhookAttemptAt.mockResolvedValue(null);
    queries.recordWebhookAttempt.mockResolvedValue(null);
    queries.getOrganizationById.mockResolvedValue({ id: 'org-1', name: 'Test Org', siteName: 'test' });
    queries.getOrganizationAdminEmails.mockResolvedValue(['admin@test.com']);
    jobs.withRedisLock.mockImplementation((_key, _ttl, fn) =>
      fn().then((val: unknown) => ({ acquired: true, value: val }))
    );
  });

  it('deletes managed subscription and refreshes cache when receiver answers 410', async () => {
    const managedEndpoint = buildEndpoint(true);
    queries.getWebhookEndpointById.mockResolvedValue(managedEndpoint);
    queries.claimNextDueWebhookDelivery.mockResolvedValueOnce({ delivery, event }).mockResolvedValueOnce(null);

    await processWebhookEndpoint(managedEndpoint.id);

    expect(queries.deleteManagedWebhookSubscriptionById).toHaveBeenCalledWith(managedEndpoint.id);
    expect(cache.refreshOrgHasWebhookEndpoints).toHaveBeenCalledWith(managedEndpoint.organizationId);
    expect(queries.recordWebhookAttempt).not.toHaveBeenCalled();
  });

  it('deletes a managed subscription without sending when its grant lost admin access', async () => {
    const managedEndpoint = buildEndpoint(true);
    queries.getWebhookEndpointById.mockResolvedValue(managedEndpoint);
    queries.claimNextDueWebhookDelivery.mockResolvedValueOnce({ delivery, event }).mockResolvedValueOnce(null);
    queries.isManagedWebhookSubscriptionGrantActive.mockResolvedValueOnce(false);

    const res = await processWebhookEndpoint(managedEndpoint.id);

    expect(res.processed).toBe(0);
    expect(queries.isManagedWebhookSubscriptionGrantActive).toHaveBeenCalledWith('consent-1');
    expect(queries.deleteManagedWebhookSubscriptionById).toHaveBeenCalledWith(managedEndpoint.id);
    expect(cache.refreshOrgHasWebhookEndpoints).toHaveBeenCalledWith(managedEndpoint.organizationId);
    expect(queries.recordWebhookAttempt).not.toHaveBeenCalled();
  });

  it('keeps retry behavior for customer endpoints when receiver answers 410', async () => {
    const customerEndpoint = buildEndpoint(false);
    queries.getWebhookEndpointById.mockResolvedValue(customerEndpoint);
    queries.claimNextDueWebhookDelivery
      .mockResolvedValueOnce({ delivery: { ...delivery, webhookId: customerEndpoint.id }, event })
      .mockResolvedValueOnce(null);

    const res = await processWebhookEndpoint(customerEndpoint.id);
    expect(res.processed).toBe(1);

    expect(queries.isManagedWebhookSubscriptionGrantActive).not.toHaveBeenCalled();
    expect(queries.deleteManagedWebhookSubscriptionById).not.toHaveBeenCalled();
    expect(cache.refreshOrgHasWebhookEndpoints).not.toHaveBeenCalled();
    expect(queries.recordWebhookAttempt).toHaveBeenCalled();
  });

  it('sends nothing for managed endpoints on health notifications', async () => {
    const managedEndpoint = buildEndpoint(true);
    queries.getWebhookEndpointById.mockResolvedValue(managedEndpoint);

    await notifyWebhookHealthChange(managedEndpoint.id, 'disabled', 'whd_1');

    expect(jobs.enqueueEmailSend).not.toHaveBeenCalled();
  });

  it('sends email for customer endpoints on health notifications', async () => {
    const customerEndpoint = buildEndpoint(false);
    queries.getWebhookEndpointById.mockResolvedValue(customerEndpoint);

    await notifyWebhookHealthChange(customerEndpoint.id, 'disabled', 'whd_1');

    expect(jobs.enqueueEmailSend).toHaveBeenCalled();
  });
});
