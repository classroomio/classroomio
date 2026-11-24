import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
  process.env.PUBLIC_IS_SELFHOSTED = 'false';
});

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

vi.mock('@cio/db/queries/webhook', () => ({
  createWebhookEndpointWithinLimit: vi.fn(),
  getWebhookDeliveryStats: vi.fn(),
  deleteWebhookEndpoint: vi.fn(),
  getWebhookDeliveryRecord: vi.fn(),
  getWebhookEndpoint: vi.fn(),
  insertWebhookEventWithDeliveries: vi.fn(),
  listWebhookDeliveries: vi.fn(),
  listWebhookEndpoints: vi.fn(),
  orgHasActiveWebhookEndpoint: vi.fn(),
  recordWebhookAttempt: vi.fn(),
  requeueWebhookDelivery: vi.fn(),
  updateWebhookEndpoint: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  enqueueWebhookDelivery: vi.fn()
}));

vi.mock('@cio/core/services/webhook/url-guard', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/core/services/webhook/url-guard')>();

  return { ...original, resolveWebhookTarget: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }) };
});

import { decryptWebhookSecret } from '@cio/core/services/webhook/secret';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import {
  createWebhookEndpointWithinLimit,
  deleteWebhookEndpoint,
  getWebhookDeliveryStats,
  getWebhookEndpoint,
  listWebhookEndpoints,
  requeueWebhookDelivery,
  updateWebhookEndpoint,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import { enqueueWebhookDelivery } from '@cio/jobs';
import { WEBHOOK_EVENT_TYPES, WEBHOOK_MAX_ENDPOINTS_PER_ORG } from '@cio/utils/constants/webhook';
import { ZCreateWebhook, ZUpdateWebhook } from '@cio/utils/validation/webhook';
import {
  createWebhookService,
  deleteWebhookService,
  getWebhookDeliveryService,
  getWebhookService,
  listWebhookDeliveriesService,
  listWebhooksService,
  redeliverWebhookService,
  regenerateWebhookSecretService,
  sendTestWebhookService,
  updateWebhookService
} from '@api/services/webhook/webhook';

const orgId = '22222222-2222-4222-8222-222222222222';
const webhookId = '11111111-1111-4111-8111-111111111111';

function buildEndpoint(overrides: Partial<TWebhookEndpointWithEvents> = {}): TWebhookEndpointWithEvents {
  return {
    id: webhookId,
    organizationId: orgId,
    name: 'CRM',
    payloadUrl: 'https://hooks.example.com/cio',
    secretCiphertext: 'cipher',
    secretLast4: 'abcd',
    verifySsl: true,
    eventMode: 'selected',
    isActive: true,
    consecutiveFailures: 0,
    autoDisabledAt: null,
    lastDeliveryStatus: null,
    lastDeliveryAt: null,
    createdByProfileId: null,
    updatedByProfileId: null,
    oauthConsentId: null,
    filterCourseId: null,
    filterCohortId: null,
    createdAt: '2026-10-13T00:00:00.000Z',
    updatedAt: '2026-10-13T00:00:00.000Z',
    eventTypes: ['course.completed'],
    ...overrides
  };
}

function allowPlan(planName: 'EARLY_ADOPTER' | 'ENTERPRISE' | 'BASIC') {
  vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName } as Awaited<
    ReturnType<typeof getActiveOrganizationPlan>
  >);
}

describe('webhook service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowPlan('EARLY_ADOPTER');
    vi.mocked(getWebhookDeliveryStats).mockResolvedValue(new Map());
    vi.mocked(createWebhookEndpointWithinLimit).mockImplementation(
      async (values, eventTypes) =>
        ({
          ...buildEndpoint(),
          ...values,
          id: webhookId,
          eventTypes
        }) as TWebhookEndpointWithEvents
    );
  });

  describe('plan entitlement', () => {
    it('rejects a BASIC org on every operation before touching any webhook data', async () => {
      allowPlan('BASIC');

      const operations = [
        () => listWebhooksService(orgId),
        () => getWebhookService(orgId, webhookId),
        () =>
          createWebhookService(
            orgId,
            'profile-1',
            ZCreateWebhook.parse({ name: 'x', payloadUrl: 'https://a.example.com', eventTypes: ['course.completed'] })
          ),
        () => updateWebhookService(orgId, webhookId, 'profile-1', {}),
        () => regenerateWebhookSecretService(orgId, webhookId, 'profile-1'),
        () => deleteWebhookService(orgId, webhookId),
        () => sendTestWebhookService(orgId, webhookId),
        () => listWebhookDeliveriesService(orgId, webhookId, { page: 1, limit: 10 }),
        () => getWebhookDeliveryService(orgId, webhookId, 'whd_1'),
        () => redeliverWebhookService(orgId, webhookId, 'whd_1')
      ];

      for (const operation of operations) {
        await expect(operation()).rejects.toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED' });
      }

      expect(createWebhookEndpointWithinLimit).not.toHaveBeenCalled();
      expect(getWebhookEndpoint).not.toHaveBeenCalled();
      expect(listWebhookEndpoints).not.toHaveBeenCalled();
      expect(deleteWebhookEndpoint).not.toHaveBeenCalled();
      expect(updateWebhookEndpoint).not.toHaveBeenCalled();
      expect(requeueWebhookDelivery).not.toHaveBeenCalled();
    });

    it('rejects an org with no active plan', async () => {
      vi.mocked(getActiveOrganizationPlan).mockResolvedValue(null as never);

      await expect(listWebhooksService(orgId)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('allows Early Adopter and Enterprise orgs', async () => {
      vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'ENTERPRISE' } as never);
      vi.mocked(listWebhookEndpoints).mockResolvedValue([buildEndpoint()]);

      await expect(listWebhooksService(orgId)).resolves.toHaveLength(1);
    });
  });

  describe('recent delivery stats', () => {
    it('adds the 24 hour delivery counts to each listed webhook', async () => {
      vi.mocked(listWebhookEndpoints).mockResolvedValue([buildEndpoint()]);
      vi.mocked(getWebhookDeliveryStats).mockResolvedValue(new Map([[webhookId, { total: 10, failed: 3 }]]));

      const [webhook] = await listWebhooksService(orgId);

      expect(webhook!.recentDeliveries).toEqual({ total: 10, failed: 3 });
    });

    it('reports zero deliveries for a webhook with no recent activity', async () => {
      vi.mocked(listWebhookEndpoints).mockResolvedValue([buildEndpoint()]);

      const [webhook] = await listWebhooksService(orgId);

      expect(webhook!.recentDeliveries).toEqual({ total: 0, failed: 0 });
    });
  });

  describe('createWebhookService', () => {
    const payload = ZCreateWebhook.parse({
      name: 'CRM',
      payloadUrl: 'https://hooks.example.com/cio',
      eventTypes: ['course.completed']
    });

    it('returns the plaintext secret once, stores it encrypted, and never exposes it in the view', async () => {
      const { webhook, secret } = await createWebhookService(orgId, 'profile-1', payload);
      const stored = vi.mocked(createWebhookEndpointWithinLimit).mock.calls[0]![0];

      expect(secret).toMatch(/^whsec_/);
      expect(stored.secretCiphertext).not.toContain(secret);
      expect(decryptWebhookSecret(stored.secretCiphertext!)).toBe(secret);
      expect(stored.secretLast4).toBe(secret.slice(-4));
      expect(JSON.stringify(webhook)).not.toContain(secret);
      expect(webhook).not.toHaveProperty('secretCiphertext');
      expect(webhook.hasSecret).toBe(true);
    });

    it('uses the admin supplied secret when given', async () => {
      const { secret } = await createWebhookService(orgId, 'profile-1', { ...payload, secret: 'my-own-secret-123' });

      expect(secret).toBe('my-own-secret-123');
    });

    it('subscribes to every event in all mode', async () => {
      await createWebhookService(orgId, 'profile-1', { ...payload, eventMode: 'all', eventTypes: [] });

      expect(vi.mocked(createWebhookEndpointWithinLimit).mock.calls[0]![1]).toEqual([...WEBHOOK_EVENT_TYPES]);
    });

    it.each([
      'https://localhost/hook',
      'https://127.0.0.1/hook',
      'https://169.254.169.254/latest',
      'http://hooks.example.com/cio'
    ])('rejects the prohibited URL %s with a field error', async (payloadUrl) => {
      await expect(createWebhookService(orgId, 'profile-1', { ...payload, payloadUrl })).rejects.toMatchObject({
        statusCode: 400,
        code: 'WEBHOOK_URL_INVALID',
        field: 'payloadUrl'
      });
      expect(createWebhookEndpointWithinLimit).not.toHaveBeenCalled();
    });

    it('enforces the per-org endpoint limit', async () => {
      vi.mocked(createWebhookEndpointWithinLimit).mockResolvedValue(null);

      await expect(createWebhookService(orgId, 'profile-1', payload)).rejects.toMatchObject({
        statusCode: 403,
        code: 'WEBHOOK_LIMIT_EXCEEDED'
      });
    });
  });

  describe('validation schemas', () => {
    it('requires at least one event in selected mode', () => {
      expect(
        ZCreateWebhook.safeParse({
          name: 'x',
          payloadUrl: 'https://a.example.com',
          eventMode: 'selected',
          eventTypes: []
        }).success
      ).toBe(false);
      expect(
        ZCreateWebhook.safeParse({ name: 'x', payloadUrl: 'https://a.example.com', eventMode: 'all' }).success
      ).toBe(true);
    });

    it('rejects unknown events and non-http schemes', () => {
      expect(
        ZCreateWebhook.safeParse({ name: 'x', payloadUrl: 'https://a.example.com', eventTypes: ['nope.event'] }).success
      ).toBe(false);
      expect(
        ZCreateWebhook.safeParse({ name: 'x', payloadUrl: 'javascript:alert(1)', eventTypes: ['course.completed'] })
          .success
      ).toBe(false);
    });

    it('does not inject defaults into a partial update', () => {
      expect(ZUpdateWebhook.parse({})).toEqual({});
      expect(ZUpdateWebhook.parse({ name: 'Renamed' })).toEqual({ name: 'Renamed' });
    });

    it('still validates events when an update switches to selected mode', () => {
      expect(ZUpdateWebhook.safeParse({ eventMode: 'selected', eventTypes: [] }).success).toBe(false);
      expect(ZUpdateWebhook.safeParse({ eventMode: 'all' }).success).toBe(true);
      expect(ZUpdateWebhook.safeParse({ eventMode: 'selected' }).success).toBe(true);
    });
  });

  describe('updateWebhookService', () => {
    it('returns 404 for a webhook in another organization', async () => {
      vi.mocked(getWebhookEndpoint).mockResolvedValue(null);

      await expect(updateWebhookService(orgId, webhookId, 'profile-1', { name: 'x' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'WEBHOOK_NOT_FOUND'
      });
    });

    it('resets failure counters and resumes delivery when re-enabling an auto-disabled endpoint', async () => {
      const disabled = buildEndpoint({
        isActive: false,
        consecutiveFailures: 100,
        autoDisabledAt: '2026-10-12T00:00:00.000Z'
      });
      vi.mocked(getWebhookEndpoint).mockResolvedValue(disabled);
      vi.mocked(updateWebhookEndpoint).mockResolvedValue(buildEndpoint());

      await updateWebhookService(orgId, webhookId, 'profile-1', { isActive: true });

      expect(vi.mocked(updateWebhookEndpoint).mock.calls[0]![2]).toMatchObject({
        isActive: true,
        consecutiveFailures: 0,
        autoDisabledAt: null
      });
      expect(enqueueWebhookDelivery).toHaveBeenCalledWith({ webhookId });
    });

    it('rejects switching to selected mode with no events', async () => {
      vi.mocked(getWebhookEndpoint).mockResolvedValue(buildEndpoint({ eventMode: 'all', eventTypes: [] }));

      await expect(
        updateWebhookService(orgId, webhookId, 'profile-1', { eventMode: 'selected', eventTypes: [] })
      ).rejects.toMatchObject({ statusCode: 400, field: 'eventTypes' });
    });
  });

  describe('regenerateWebhookSecretService', () => {
    it('returns a new secret and replaces the stored ciphertext', async () => {
      vi.mocked(getWebhookEndpoint).mockResolvedValue(buildEndpoint());
      vi.mocked(updateWebhookEndpoint).mockResolvedValue(buildEndpoint());

      const { secret } = await regenerateWebhookSecretService(orgId, webhookId, 'profile-1');
      const stored = vi.mocked(updateWebhookEndpoint).mock.calls[0]![2];

      expect(decryptWebhookSecret(stored.secretCiphertext!)).toBe(secret);
    });
  });

  describe('redeliverWebhookService', () => {
    it('refuses to redeliver to a disabled endpoint', async () => {
      vi.mocked(getWebhookEndpoint).mockResolvedValue(buildEndpoint({ isActive: false }));

      await expect(redeliverWebhookService(orgId, webhookId, 'whd_1')).rejects.toMatchObject({
        statusCode: 409,
        code: 'WEBHOOK_ENDPOINT_DISABLED'
      });
      expect(requeueWebhookDelivery).not.toHaveBeenCalled();
    });

    it('returns 404 when the delivery is not found or expired', async () => {
      vi.mocked(getWebhookEndpoint).mockResolvedValue(buildEndpoint());
      vi.mocked(requeueWebhookDelivery).mockResolvedValue(null);

      await expect(redeliverWebhookService(orgId, webhookId, 'whd_gone')).rejects.toMatchObject({
        statusCode: 404,
        code: 'WEBHOOK_DELIVERY_NOT_FOUND'
      });
    });
  });
});
